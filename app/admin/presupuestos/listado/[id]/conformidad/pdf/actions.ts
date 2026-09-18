"use server";

import { Buffer } from "node:buffer";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  generarConformidadPdf,
  type ConformidadPdfDatos,
} from "../../../../lib/generarConformidadPdf";

const BUCKET = "trabajos-enfri-ar";

type GenerarConformidadPdfOpciones = {
  regenerar?: boolean;
};

type ArchivoExistente = {
  id: string;
  storage_path: string;
  nombre_original: string | null;
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

function limpiarNombre(
  valor: string
) {
  return valor
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "-"
    );
}

function esArchivoExistente(
  error: unknown
) {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const dato =
    error as {
      message?: unknown;
      statusCode?: unknown;
      status?: unknown;
    };

  const estado =
    Number(
      dato.statusCode ??
        dato.status ??
        0
    );

  const mensaje =
    String(
      dato.message ?? ""
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

async function crearEnlace(
  storagePath: string,
  nombreArchivo: string
) {
  const supabase =
    await createSupabaseServerClient();

  const {
    data,
    error,
  } =
    await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        storagePath,
        300
      );

  if (
    error ||
    !data?.signedUrl
  ) {
    return {
      ok: false as const,
      error:
        error?.message ||
        `No se pudo generar el enlace para ${nombreArchivo}.`,
    };
  }

  return {
    ok: true as const,
    url:
      data.signedUrl,
  };
}

export async function generarConformidadPdfAction(
  conformidadId: string,
  opciones?: GenerarConformidadPdfOpciones
) {
  try {
    await requireAdminUser();

    const id =
      String(
        conformidadId ?? ""
      ).trim();

    const regenerar =
      Boolean(
        opciones?.regenerar
      );

    if (!id) {
      return {
        ok: false as const,
        error:
          "La conformidad no es válida.",
      };
    }

    const supabase =
      await createSupabaseServerClient();

    /*
     * =========================================
     * CARGAR CONFORMIDAD
     * =========================================
     */

    const {
      data: conformidad,
      error:
        conformidadError,
    } = await supabase
      .from("conformidades")
      .select(`
        id,
        presupuesto_id,
        numero_conformidad,
        cliente_nombre,
        cliente_apellido,
        cliente_razon_social,
        cliente_dni,
        cliente_cuit,
        cliente_telefono,
        cliente_direccion,
        cliente_localidad,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_dni,
        tecnico_telefono,
        tecnico_matricula,
        trabajo_realizado,
        observaciones,
        empresa_snapshot
      `)
      .eq(
        "id",
        id
      )
      .single();

    if (
      conformidadError ||
      !conformidad
    ) {
      return {
        ok: false as const,
        error:
          conformidadError
            ?.message ||
          "No se encontró la conformidad.",
      };
    }

    const conformidadSegura =
      conformidad;

    /*
     * =========================================
     * PRESUPUESTO RELACIONADO
     * =========================================
     */

    const {
      data: presupuesto,
      error:
        presupuestoError,
    } = await supabase
      .from("presupuestos")
      .select(`
        id,
        numero
      `)
      .eq(
        "id",
        conformidadSegura
          .presupuesto_id
      )
      .single();

    if (
      presupuestoError ||
      !presupuesto
    ) {
      return {
        ok: false as const,
        error:
          presupuestoError
            ?.message ||
          "No se pudo recuperar el presupuesto relacionado.",
      };
    }

    /*
     * =========================================
     * DATOS DEL PDF
     * =========================================
     */

    const datosPdf:
      ConformidadPdfDatos = {
      numero_conformidad:
        conformidadSegura
          .numero_conformidad,

      presupuesto_id:
        conformidadSegura
          .presupuesto_id,

      numero_presupuesto:
        presupuesto.numero,

      cliente_nombre:
        conformidadSegura
          .cliente_nombre,

      cliente_apellido:
        conformidadSegura
          .cliente_apellido,

      cliente_razon_social:
        conformidadSegura
          .cliente_razon_social,

      cliente_dni:
        conformidadSegura
          .cliente_dni,

      cliente_cuit:
        conformidadSegura
          .cliente_cuit,

      cliente_telefono:
        conformidadSegura
          .cliente_telefono,

      cliente_direccion:
        conformidadSegura
          .cliente_direccion,

      cliente_localidad:
        conformidadSegura
          .cliente_localidad,

      tecnico_nombre:
        conformidadSegura
          .tecnico_nombre,

      tecnico_apellido:
        conformidadSegura
          .tecnico_apellido,

      tecnico_dni:
        conformidadSegura
          .tecnico_dni,

      tecnico_telefono:
        conformidadSegura
          .tecnico_telefono,

      tecnico_matricula:
        conformidadSegura
          .tecnico_matricula,

      trabajo_realizado:
        conformidadSegura
          .trabajo_realizado,

      observaciones:
        conformidadSegura
          .observaciones,

      empresa_snapshot:
        conformidadSegura
          .empresa_snapshot,
    };

    /*
     * =========================================
     * REVISAR PDF EXISTENTE
     * =========================================
     */

    const {
      data:
        archivosActuales,
      error:
        archivosError,
    } = await supabase
      .from(
        "archivos_trabajo"
      )
      .select(`
        id,
        storage_path,
        nombre_original
      `)
      .eq(
        "conformidad_id",
        id
      )
      .eq(
        "documento_clase",
        "conformidad"
      )
      .eq(
        "documento_variante",
        "unico"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1);

    if (archivosError) {
      return {
        ok: false as const,
        error:
          archivosError.message,
      };
    }

    const existente =
      (
        archivosActuales ||
        []
      )[0] as
        | ArchivoExistente
        | undefined;

    /*
     * Si ya existe y NO pedimos
     * regeneración, reutilizamos
     * el documento histórico.
     */

    if (
      existente &&
      !regenerar
    ) {
      const nombreArchivo =
        existente
          .nombre_original ||
        `${limpiarNombre(
          conformidadSegura
            .numero_conformidad
        )}.pdf`;

      const enlace =
        await crearEnlace(
          existente.storage_path,
          nombreArchivo
        );

      if (!enlace.ok) {
        return enlace;
      }

      return {
        ok: true as const,

        numeroConformidad:
          conformidadSegura
            .numero_conformidad,

        regenerado: false,

        archivoId:
          existente.id,

        storagePath:
          existente.storage_path,

        nombreArchivo,

        url:
          enlace.url,
      };
    }

    /*
     * =========================================
     * GENERAR PDF
     * =========================================
     */

    const bytes =
      await generarConformidadPdf(
        datosPdf
      );

    const numeroSeguro =
      limpiarNombre(
        conformidadSegura
          .numero_conformidad
      );

    const nombreArchivo =
      existente
        ?.nombre_original ||
      `${numeroSeguro}.pdf`;

    const storagePath =
      existente
        ?.storage_path ||
      `conformidades/${id}/${nombreArchivo}`;

    /*
     * =========================================
     * SUBIR STORAGE PRIVADO
     * =========================================
     */

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          storagePath,
          Buffer.from(
            bytes
          ),
          {
            contentType:
              "application/pdf",

            cacheControl:
              "3600",

            upsert:
              Boolean(
                existente &&
                regenerar
              ),
          }
        );

    if (
      uploadError &&
      !(
        !existente &&
        esArchivoExistente(
          uploadError
        )
      )
    ) {
      return {
        ok: false as const,
        error:
          uploadError.message,
      };
    }

    /*
     * =========================================
     * ACTUALIZAR REGISTRO EXISTENTE
     * =========================================
     */

    if (existente) {
      const {
        data:
          archivoActualizado,
        error:
          actualizarError,
      } = await supabase
        .from(
          "archivos_trabajo"
        )
        .update({
          storage_bucket:
            BUCKET,

          storage_path:
            storagePath,

          nombre_original:
            nombreArchivo,

          mime_type:
            "application/pdf",

          tamanio_bytes:
            bytes.byteLength,

          descripcion:
            `Conformidad ${conformidadSegura.numero_conformidad}`,

          documento_clase:
            "conformidad",

          documento_variante:
            "unico",
        })
        .eq(
          "id",
          existente.id
        )
        .select(`
          id,
          storage_path,
          nombre_original
        `)
        .single();

      if (
        actualizarError ||
        !archivoActualizado
      ) {
        return {
          ok: false as const,
          error:
            actualizarError
              ?.message ||
            "El PDF fue regenerado, pero no se pudo actualizar su registro.",
        };
      }

      const enlace =
        await crearEnlace(
          storagePath,
          nombreArchivo
        );

      if (!enlace.ok) {
        return enlace;
      }

      return {
        ok: true as const,

        numeroConformidad:
          conformidadSegura
            .numero_conformidad,

        regenerado: true,

        archivoId:
          archivoActualizado.id,

        storagePath,

        nombreArchivo,

        url:
          enlace.url,
      };
    }

    /*
     * =========================================
     * REGISTRAR PDF NUEVO
     * =========================================
     */

    const {
      data:
        archivoCreado,
      error:
        insertarError,
    } = await supabase
      .from(
        "archivos_trabajo"
      )
      .insert({
        presupuesto_id:
          conformidadSegura
            .presupuesto_id,

        tipo:
          "documento",

        storage_bucket:
          BUCKET,

        storage_path:
          storagePath,

        nombre_original:
          nombreArchivo,

        mime_type:
          "application/pdf",

        tamanio_bytes:
          bytes.byteLength,

        descripcion:
          `Conformidad ${conformidadSegura.numero_conformidad}`,

        planilla_trabajo_id:
          null,

        conformidad_id:
          id,

        documento_clase:
          "conformidad",

        documento_variante:
          "unico",
      })
      .select(`
        id,
        storage_path,
        nombre_original
      `)
      .single();

    if (
      insertarError ||
      !archivoCreado
    ) {
      return {
        ok: false as const,
        error:
          insertarError
            ?.message ||
          "El PDF fue generado, pero no se pudo registrar en Documentos.",
      };
    }

    const enlace =
      await crearEnlace(
        storagePath,
        nombreArchivo
      );

    if (!enlace.ok) {
      return enlace;
    }

    return {
      ok: true as const,

      numeroConformidad:
        conformidadSegura
          .numero_conformidad,

      regenerado: false,

      archivoId:
        archivoCreado.id,

      storagePath,

      nombreArchivo,

      url:
        enlace.url,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        mensajeError(
          error
        ),
    };
  }
}
