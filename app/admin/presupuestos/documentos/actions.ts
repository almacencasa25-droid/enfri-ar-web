"use server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "presupuestos-enfri-ar";

export type DocumentoPresupuestoListado = {
  id: string;
  presupuesto_id: string;
  numero: string;
  version: number;
  cliente: string;
  fecha_presupuesto: string;
  creado_en: string;
  storage_path: string | null;
};

type SnapshotDocumento = {
  numero?: string | number | null;

  fecha?: string | null;

  cliente?: {
    nombre?: string | null;
    apellido?: string | null;
    razon_social?: string | null;
  } | null;
};

function obtenerMensajeError(
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

function obtenerCliente(
  snapshot: SnapshotDocumento
) {
  const cliente =
    snapshot.cliente;

  if (!cliente) {
    return "Cliente sin nombre";
  }

  const razonSocial =
    String(
      cliente.razon_social ?? ""
    ).trim();

  if (razonSocial) {
    return razonSocial;
  }

  const nombre =
    String(
      cliente.nombre ?? ""
    ).trim();

  const apellido =
    String(
      cliente.apellido ?? ""
    ).trim();

  const completo = [
    nombre,
    apellido,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Cliente sin nombre"
  );
}

export async function listarDocumentosPresupuestoAction() {
  try {
    await requireAdminUser();

    const supabase =
      await createSupabaseServerClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "presupuesto_documentos"
      )
      .select(`
        id,
        presupuesto_id,
        version,
        snapshot,
        storage_path,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(200);

    if (error) {
      return {
        ok: false as const,
        error:
          error.message,
        data: [],
      };
    }

    const documentos:
      DocumentoPresupuestoListado[] =
      (data || []).map(
        (documento) => {
          const snapshot =
            (
              documento.snapshot &&
              typeof documento.snapshot ===
                "object" &&
              !Array.isArray(
                documento.snapshot
              )
            )
              ? documento.snapshot as SnapshotDocumento
              : {};

          return {
            id:
              documento.id,

            presupuesto_id:
              documento.presupuesto_id,

            numero:
              String(
                snapshot.numero ??
                  "-"
              ),

            version:
              Number(
                documento.version
              ),

            cliente:
              obtenerCliente(
                snapshot
              ),

            fecha_presupuesto:
              String(
                snapshot.fecha ??
                  ""
              ),

            creado_en:
              documento.created_at,

            storage_path:
              documento.storage_path,
          };
        }
      );

    return {
      ok: true as const,
      data:
        documentos,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        obtenerMensajeError(
          error
        ),
      data: [],
    };
  }
}

export async function descargarDocumentoPresupuestoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const ruta =
      String(
        storagePath || ""
      ).trim();

    if (!ruta) {
      return {
        ok: false as const,
        error:
          "Este documento todavía no tiene un PDF guardado.",
      };
    }

    const supabase =
      await createSupabaseServerClient();

    const nombreArchivo =
      ruta
        .split("/")
        .pop() ||
      "presupuesto.pdf";

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUrl(
          ruta,
          300,
          {
            download:
              nombreArchivo,
          }
        );

    if (
      error ||
      !data?.signedUrl
    ) {
      return {
        ok: false as const,
        error:
          error?.message ||
          "No se pudo preparar la descarga del PDF.",
      };
    }

    return {
      ok: true as const,
      url:
        data.signedUrl,
      nombreArchivo,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        obtenerMensajeError(
          error
        ),
    };
  }
}
