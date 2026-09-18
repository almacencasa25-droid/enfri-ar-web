"use server";

import { Buffer } from "node:buffer";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  generarPresupuestoPdf,
  type PresupuestoPdfSnapshot,
} from "../../lib/generarPresupuestoPdf";

const BUCKET =
  "presupuestos-enfri-ar";

type DocumentoPresupuesto = {
  id: string;
  presupuesto_id: string;
  version: number;
  snapshot: unknown;
  storage_path: string | null;
};

function mensajeError(
  error: unknown
) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  return "Ocurrió un error inesperado.";
}

function esErrorArchivoExistente(
  error: unknown
) {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const posibleError =
    error as {
      message?: unknown;
      statusCode?: unknown;
      status?: unknown;
    };

  const estado = Number(
    posibleError.statusCode ??
      posibleError.status ??
      0
  );

  const mensaje = String(
    posibleError.message ?? ""
  ).toLowerCase();

  return (
    estado === 409 ||
    mensaje.includes(
      "already exists"
    ) ||
    mensaje.includes(
      "duplicate"
    ) ||
    mensaje.includes(
      "resource already exists"
    )
  );
}

function numeroVisible(
  valor: unknown
) {
  const base = String(
    valor ?? "sin-numero"
  ).trim();

  if (/^\d+$/.test(base)) {
    return base.padStart(
      6,
      "0"
    );
  }

  return (
    base.replace(
      /[^a-zA-Z0-9_-]/g,
      "-"
    ) || "sin-numero"
  );
}

export async function emitirPresupuestoPdfAction(
  presupuestoId: string
) {
  try {
    await requireAdminUser();

    if (
      !presupuestoId ||
      typeof presupuestoId !==
        "string"
    ) {
      return {
        ok: false as const,
        error:
          "El presupuesto no es válido.",
      };
    }

    const supabase =
      await createSupabaseServerClient();

    /*
     * Primero buscamos una versión
     * que haya quedado pendiente.
     *
     * Esto evita crear versiones
     * duplicadas si anteriormente
     * falló la creación o guardado
     * del PDF.
     */
    const {
      data: documentoPendiente,
      error: pendienteError,
    } = await supabase
      .from(
        "presupuesto_documentos"
      )
      .select(`
        id,
        presupuesto_id,
        version,
        snapshot,
        storage_path
      `)
      .eq(
        "presupuesto_id",
        presupuestoId
      )
      .is(
        "storage_path",
        null
      )
      .order(
        "version",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (pendienteError) {
      return {
        ok: false as const,
        error:
          pendienteError.message,
      };
    }

    let documento =
      documentoPendiente as
        | DocumentoPresupuesto
        | null;

    /*
     * Si no existe una emisión
     * pendiente, creamos una nueva
     * versión histórica.
     */
    if (!documento) {
      const {
        data: documentoId,
        error: emitirError,
      } = await supabase.rpc(
        "emitir_presupuesto_enfriar",
        {
          p_presupuesto_id:
            presupuestoId,
        }
      );

      if (emitirError) {
        return {
          ok: false as const,
          error:
            emitirError.message,
        };
      }

      if (!documentoId) {
        return {
          ok: false as const,
          error:
            "No se pudo crear la versión histórica del presupuesto.",
        };
      }

      const {
        data: documentoNuevo,
        error: documentoError,
      } = await supabase
        .from(
          "presupuesto_documentos"
        )
        .select(`
          id,
          presupuesto_id,
          version,
          snapshot,
          storage_path
        `)
        .eq(
          "id",
          documentoId
        )
        .single();

      if (
        documentoError ||
        !documentoNuevo
      ) {
        return {
          ok: false as const,
          error:
            documentoError?.message ||
            "No se pudo recuperar la versión emitida.",
        };
      }

      documento =
        documentoNuevo as DocumentoPresupuesto;
    }

    if (
      !documento.snapshot ||
      typeof documento.snapshot !==
        "object" ||
      Array.isArray(
        documento.snapshot
      )
    ) {
      return {
        ok: false as const,
        error:
          "La versión histórica no contiene un snapshot válido.",
      };
    }

    const snapshot =
      documento.snapshot as PresupuestoPdfSnapshot;

    /*
     * El PDF se genera exclusivamente
     * con el snapshot histórico.
     *
     * Si el presupuesto se modifica
     * posteriormente, esta versión
     * seguirá siendo exactamente igual.
     */
    const pdfBytes =
      await generarPresupuestoPdf(
        snapshot,
        Number(
          documento.version
        )
      );

    const nro =
      numeroVisible(
        snapshot.numero
      );

    const version =
      Number(
        documento.version
      );

    const nombreArchivo =
      `presupuesto-${nro}-v${version}.pdf`;

    const storagePath =
      `${presupuestoId}/${nombreArchivo}`;

    /*
     * Guardamos el PDF en el
     * bucket privado.
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from(BUCKET)
      .upload(
        storagePath,
        Buffer.from(
          pdfBytes
        ),
        {
          contentType:
            "application/pdf",
          cacheControl:
            "3600",
          upsert: false,
        }
      );

    /*
     * Si el archivo ya existe,
     * puede provenir de un intento
     * anterior que llegó a subirlo
     * pero no terminó de registrar
     * la ruta.
     */
    if (
      uploadError &&
      !esErrorArchivoExistente(
        uploadError
      )
    ) {
      return {
        ok: false as const,
        error:
          uploadError.message,
      };
    }

    /*
     * Antes de cerrar definitivamente
     * la emisión generamos el enlace.
     *
     * Si esto falla, storage_path queda
     * pendiente y podremos reintentar
     * la misma versión sin crear otra.
     */
    const {
      data: enlace,
      error: enlaceError,
    } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        storagePath,
        300,
        {
          download:
            nombreArchivo,
        }
      );

    if (
      enlaceError ||
      !enlace?.signedUrl
    ) {
      return {
        ok: false as const,
        error:
          enlaceError?.message ||
          "El PDF fue generado, pero no se pudo preparar su descarga.",
      };
    }

    /*
     * Ahora sí dejamos vinculada
     * definitivamente esta versión
     * con su archivo histórico.
     */
    const {
      error: guardarError,
    } = await supabase.rpc(
      "guardar_pdf_presupuesto_emitido_enfriar",
      {
        p_documento_id:
          documento.id,
        p_storage_path:
          storagePath,
      }
    );

    if (guardarError) {
      return {
        ok: false as const,
        error:
          guardarError.message,
      };
    }

    return {
      ok: true as const,

      documentoId:
        documento.id,

      version,

      nombreArchivo,

      storagePath,

      url:
        enlace.signedUrl,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        mensajeError(error),
    };
  }
}
