"use server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET_PRESUPUESTOS =
  "presupuestos-enfri-ar";

const BUCKET_TRABAJOS =
  "trabajos-enfri-ar";

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

export type DocumentoOrdenTrabajoListado = {
  id: string;

  presupuesto_id: string;

  planilla_trabajo_id: string;

  numero_presupuesto: string;

  numero_orden: string;

  variante: string;

  cliente: string;

  tecnico: string;

  matricula:
    | string
    | null;

  fecha_orden: string;

  creado_en: string;

  storage_bucket: string;

  storage_path: string;

  nombre_archivo: string;
};

export type DocumentoConformidadListado = {
  id: string;

  presupuesto_id: string;

  conformidad_id: string;

  numero_presupuesto: string;

  numero_conformidad: string;

  cliente: string;

  tecnico: string;

  matricula:
    | string
    | null;

  fecha_conformidad: string;

  creado_en: string;

  storage_bucket: string;

  storage_path: string;

  nombre_archivo: string;

  vigente: boolean;
};

type ConformidadDocumento = {
  id: string;

  presupuesto_id: string;

  numero_conformidad: string;

  fecha: string;

  cliente_nombre:
    | string
    | null;

  cliente_apellido:
    | string
    | null;

  cliente_razon_social:
    | string
    | null;

  tecnico_nombre:
    | string
    | null;

  tecnico_apellido:
    | string
    | null;

  tecnico_matricula:
    | string
    | null;

  vigente: boolean;
};

type SnapshotDocumento = {
  numero?:
    | string
    | number
    | null;

  fecha?:
    | string
    | null;

  cliente?: {
    nombre?:
      | string
      | null;

    apellido?:
      | string
      | null;

    razon_social?:
      | string
      | null;
  } | null;
};

type PlanillaDocumento = {
  id: string;

  presupuesto_id: string;

  numero_orden: string;

  fecha: string;

  cliente_nombre:
    | string
    | null;

  cliente_apellido:
    | string
    | null;

  cliente_razon_social:
    | string
    | null;

  tecnico_nombre:
    | string
    | null;

  tecnico_apellido:
    | string
    | null;

  tecnico_matricula:
    | string
    | null;
};

type PresupuestoNumero = {
  id: string;

  numero:
    | string
    | number;
};

function obtenerMensajeError(
  error: unknown
) {
  if (
    error &&
    typeof error ===
      "object" &&
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
  snapshot:
    SnapshotDocumento
) {
  const cliente =
    snapshot.cliente;

  if (!cliente) {
    return "Cliente sin nombre";
  }

  const razonSocial =
    String(
      cliente.razon_social ??
        ""
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

function obtenerClientePlanilla(
  planilla: PlanillaDocumento
) {
  const razonSocial =
    String(
      planilla.cliente_razon_social ??
        ""
    ).trim();

  if (razonSocial) {
    return razonSocial;
  }

  const completo = [
    planilla.cliente_nombre,
    planilla.cliente_apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Cliente sin nombre"
  );
}

function obtenerTecnicoPlanilla(
  planilla: PlanillaDocumento
) {
  const completo = [
    planilla.tecnico_nombre,
    planilla.tecnico_apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Técnico sin nombre"
  );
}

function obtenerClienteConformidad(
  conformidad: ConformidadDocumento
) {
  const razonSocial =
    String(
      conformidad.cliente_razon_social ??
        ""
    ).trim();

  if (razonSocial) {
    return razonSocial;
  }

  const completo = [
    conformidad.cliente_nombre,
    conformidad.cliente_apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Cliente sin nombre"
  );
}

function obtenerTecnicoConformidad(
  conformidad: ConformidadDocumento
) {
  const completo = [
    conformidad.tecnico_nombre,
    conformidad.tecnico_apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Técnico sin nombre"
  );
}

function nombreArchivoDesdeRuta(
  ruta: string
) {
  return (
    ruta
      .split("/")
      .pop() ||
    "documento.pdf"
  );
}

async function validarRutaDocumento(
  storagePath: string
) {
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

  return {
    ok: true as const,
    ruta,
  };
}

/*
 * =====================================================
 * COMPROBAR ARCHIVO FÍSICO DE PRESUPUESTO
 * =====================================================
 */

export async function comprobarDocumentoPresupuestoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const validacion =
      await validarRutaDocumento(
        storagePath
      );

    if (!validacion.ok) {
      return {
        ok: true as const,
        existe: false,
      };
    }

    const supabase =
      await createSupabaseServerClient();

    const partes =
      validacion.ruta.split("/");

    const nombreArchivo =
      partes.pop() || "";

    const carpeta =
      partes.join("/");

    if (!nombreArchivo) {
      return {
        ok: true as const,
        existe: false,
      };
    }

    const {
      data,
      error,
    } = await supabase.storage
      .from(
        BUCKET_PRESUPUESTOS
      )
      .list(
        carpeta,
        {
          limit: 100,
          search:
            nombreArchivo,
        }
      );

    if (error) {
      return {
        ok: false as const,
        error:
          error.message ||
          "No se pudo comprobar el archivo físico.",
      };
    }

    const existe =
      (data || []).some(
        (archivo) =>
          archivo.name ===
          nombreArchivo
      );

    return {
      ok: true as const,
      existe,
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

/*
 * =====================================================
 * PRESUPUESTOS HISTÓRICOS
 * =====================================================
 */

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

/*
 * =====================================================
 * ÓRDENES DE TRABAJO
 * =====================================================
 */

export async function listarDocumentosOrdenTrabajoAction() {
  try {
    await requireAdminUser();

    const supabase =
      await createSupabaseServerClient();

    /*
     * Primero recuperamos los archivos PDF
     * registrados como Orden de Trabajo.
     */
    const {
      data: archivos,
      error: archivosError,
    } = await supabase
      .from(
        "archivos_trabajo"
      )
      .select(`
        id,
        presupuesto_id,
        planilla_trabajo_id,
        documento_variante,
        storage_bucket,
        storage_path,
        nombre_original,
        created_at
      `)
      .eq(
        "documento_clase",
        "orden_trabajo"
      )
      .not(
        "planilla_trabajo_id",
        "is",
        null
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(200);

    if (archivosError) {
      return {
        ok: false as const,
        error:
          archivosError.message,
        data: [],
      };
    }

    if (
      !archivos ||
      archivos.length === 0
    ) {
      return {
        ok: true as const,
        data:
          [] as DocumentoOrdenTrabajoListado[],
      };
    }

    /*
     * IDs únicos de las Órdenes de Trabajo.
     */
    const planillaIds =
      Array.from(
        new Set(
          archivos
            .map(
              (archivo) =>
                archivo.planilla_trabajo_id
            )
            .filter(
              (
                valor
              ): valor is string =>
                Boolean(valor)
            )
        )
      );

    /*
     * IDs únicos de presupuestos.
     */
    const presupuestoIds =
      Array.from(
        new Set(
          archivos
            .map(
              (archivo) =>
                archivo.presupuesto_id
            )
            .filter(
              (
                valor
              ): valor is string =>
                Boolean(valor)
            )
        )
      );

    /*
     * Recuperamos los snapshots de cada OT.
     */
    const {
      data: planillasData,
      error: planillasError,
    } = await supabase
      .from(
        "planillas_trabajo"
      )
      .select(`
        id,
        presupuesto_id,
        numero_orden,
        fecha,
        cliente_nombre,
        cliente_apellido,
        cliente_razon_social,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_matricula
      `)
      .in(
        "id",
        planillaIds
      );

    if (planillasError) {
      return {
        ok: false as const,
        error:
          planillasError.message,
        data: [],
      };
    }

    /*
     * Recuperamos el número visible
     * de cada presupuesto.
     */
    const {
      data: presupuestosData,
      error: presupuestosError,
    } = await supabase
      .from("presupuestos")
      .select(`
        id,
        numero
      `)
      .in(
        "id",
        presupuestoIds
      );

    if (presupuestosError) {
      return {
        ok: false as const,
        error:
          presupuestosError.message,
        data: [],
      };
    }

    const planillas =
      (planillasData ||
        []) as PlanillaDocumento[];

    const presupuestos =
      (presupuestosData ||
        []) as PresupuestoNumero[];

    const planillasPorId =
      new Map(
        planillas.map(
          (planilla) => [
            planilla.id,
            planilla,
          ]
        )
      );

    const presupuestosPorId =
      new Map(
        presupuestos.map(
          (presupuesto) => [
            presupuesto.id,
            presupuesto,
          ]
        )
      );

    const documentos:
      DocumentoOrdenTrabajoListado[] =
      archivos
        .map(
          (archivo) => {
            const planillaId =
              String(
                archivo.planilla_trabajo_id ??
                  ""
              );

            const planilla =
              planillasPorId.get(
                planillaId
              );

            if (!planilla) {
              return null;
            }

            const presupuesto =
              presupuestosPorId.get(
                archivo.presupuesto_id
              );

            return {
              id:
                archivo.id,

              presupuesto_id:
                archivo.presupuesto_id,

              planilla_trabajo_id:
                planilla.id,

              numero_presupuesto:
                String(
                  presupuesto?.numero ??
                    "-"
                ),

              numero_orden:
                planilla.numero_orden,

              variante:
                String(
                  archivo.documento_variante ??
                    "documento"
                ),

              cliente:
                obtenerClientePlanilla(
                  planilla
                ),

              tecnico:
                obtenerTecnicoPlanilla(
                  planilla
                ),

              matricula:
                planilla.tecnico_matricula,

              fecha_orden:
                planilla.fecha,

              creado_en:
                archivo.created_at,

              storage_bucket:
                archivo.storage_bucket,

              storage_path:
                archivo.storage_path,

              nombre_archivo:
                archivo.nombre_original ||
                nombreArchivoDesdeRuta(
                  archivo.storage_path
                ),
            };
          }
        )
        .filter(
          (
            documento
          ): documento is DocumentoOrdenTrabajoListado =>
            documento !== null
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

/*
 * =====================================================
 * CONFORMIDADES HISTÓRICAS
 * =====================================================
 */

export async function listarDocumentosConformidadAction() {
  try {
    await requireAdminUser();

    const supabase =
      await createSupabaseServerClient();

    /*
     * Acá NO filtramos por vigente.
     * Documentos es el centro histórico y debe
     * mostrar conformidades actuales y anteriores.
     */
    const {
      data: archivos,
      error: archivosError,
    } = await supabase
      .from(
        "archivos_trabajo"
      )
      .select(`
        id,
        presupuesto_id,
        conformidad_id,
        storage_bucket,
        storage_path,
        nombre_original,
        created_at
      `)
      .eq(
        "documento_clase",
        "conformidad"
      )
      .eq(
        "documento_variante",
        "unico"
      )
      .not(
        "conformidad_id",
        "is",
        null
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(200);

    if (archivosError) {
      return {
        ok: false as const,
        error:
          archivosError.message,
        data: [],
      };
    }

    if (
      !archivos ||
      archivos.length === 0
    ) {
      return {
        ok: true as const,
        data:
          [] as DocumentoConformidadListado[],
      };
    }

    const conformidadIds =
      Array.from(
        new Set(
          archivos
            .map(
              (archivo) =>
                archivo.conformidad_id
            )
            .filter(
              (
                valor
              ): valor is string =>
                Boolean(valor)
            )
        )
      );

    const presupuestoIds =
      Array.from(
        new Set(
          archivos
            .map(
              (archivo) =>
                archivo.presupuesto_id
            )
            .filter(
              (
                valor
              ): valor is string =>
                Boolean(valor)
            )
        )
      );

    const {
      data: conformidadesData,
      error: conformidadesError,
    } = await supabase
      .from(
        "conformidades"
      )
      .select(`
        id,
        presupuesto_id,
        numero_conformidad,
        fecha,
        cliente_nombre,
        cliente_apellido,
        cliente_razon_social,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_matricula,
        vigente
      `)
      .in(
        "id",
        conformidadIds
      );

    if (conformidadesError) {
      return {
        ok: false as const,
        error:
          conformidadesError.message,
        data: [],
      };
    }

    const {
      data: presupuestosData,
      error: presupuestosError,
    } = await supabase
      .from("presupuestos")
      .select(`
        id,
        numero
      `)
      .in(
        "id",
        presupuestoIds
      );

    if (presupuestosError) {
      return {
        ok: false as const,
        error:
          presupuestosError.message,
        data: [],
      };
    }

    const conformidades =
      (conformidadesData ||
        []) as ConformidadDocumento[];

    const presupuestos =
      (presupuestosData ||
        []) as PresupuestoNumero[];

    const conformidadesPorId =
      new Map(
        conformidades.map(
          (conformidad) => [
            conformidad.id,
            conformidad,
          ]
        )
      );

    const presupuestosPorId =
      new Map(
        presupuestos.map(
          (presupuesto) => [
            presupuesto.id,
            presupuesto,
          ]
        )
      );

    const documentos:
      DocumentoConformidadListado[] =
      archivos
        .map(
          (archivo) => {
            const conformidadId =
              String(
                archivo.conformidad_id ??
                  ""
              );

            const conformidad =
              conformidadesPorId.get(
                conformidadId
              );

            if (!conformidad) {
              return null;
            }

            const presupuesto =
              presupuestosPorId.get(
                archivo.presupuesto_id
              );

            return {
              id:
                archivo.id,

              presupuesto_id:
                archivo.presupuesto_id,

              conformidad_id:
                conformidad.id,

              numero_presupuesto:
                String(
                  presupuesto?.numero ??
                    "-"
                ),

              numero_conformidad:
                conformidad.numero_conformidad,

              cliente:
                obtenerClienteConformidad(
                  conformidad
                ),

              tecnico:
                obtenerTecnicoConformidad(
                  conformidad
                ),

              matricula:
                conformidad.tecnico_matricula,

              fecha_conformidad:
                conformidad.fecha,

              creado_en:
                archivo.created_at,

              storage_bucket:
                archivo.storage_bucket ||
                BUCKET_TRABAJOS,

              storage_path:
                archivo.storage_path,

              nombre_archivo:
                archivo.nombre_original ||
                nombreArchivoDesdeRuta(
                  archivo.storage_path
                ),

              vigente:
                Boolean(
                  conformidad.vigente
                ),
            };
          }
        )
        .filter(
          (
            documento
          ): documento is DocumentoConformidadListado =>
            documento !== null
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

/*
 * =====================================================
 * VER PRESUPUESTO
 * =====================================================
 */

export async function verDocumentoPresupuestoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const validacion =
      await validarRutaDocumento(
        storagePath
      );

    if (!validacion.ok) {
      return validacion;
    }

    const supabase =
      await createSupabaseServerClient();

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          BUCKET_PRESUPUESTOS
        )
        .createSignedUrl(
          validacion.ruta,
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
          "No se pudo abrir la vista previa del PDF.",
      };
    }

    return {
      ok: true as const,
      url:
        data.signedUrl,
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

/*
 * =====================================================
 * DESCARGAR PRESUPUESTO
 * =====================================================
 */

export async function descargarDocumentoPresupuestoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const validacion =
      await validarRutaDocumento(
        storagePath
      );

    if (!validacion.ok) {
      return validacion;
    }

    const supabase =
      await createSupabaseServerClient();

    const nombreArchivo =
      nombreArchivoDesdeRuta(
        validacion.ruta
      );

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          BUCKET_PRESUPUESTOS
        )
        .createSignedUrl(
          validacion.ruta,
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

/*
 * =====================================================
 * VER ORDEN DE TRABAJO
 * =====================================================
 */

export async function verDocumentoOrdenTrabajoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const validacion =
      await validarRutaDocumento(
        storagePath
      );

    if (!validacion.ok) {
      return validacion;
    }

    const supabase =
      await createSupabaseServerClient();

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          BUCKET_TRABAJOS
        )
        .createSignedUrl(
          validacion.ruta,
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
          "No se pudo abrir la Orden de Trabajo.",
      };
    }

    return {
      ok: true as const,
      url:
        data.signedUrl,
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

/*
 * =====================================================
 * DESCARGAR ORDEN DE TRABAJO
 * =====================================================
 */

export async function descargarDocumentoOrdenTrabajoAction(
  storagePath: string
) {
  try {
    await requireAdminUser();

    const validacion =
      await validarRutaDocumento(
        storagePath
      );

    if (!validacion.ok) {
      return validacion;
    }

    const supabase =
      await createSupabaseServerClient();

    const nombreArchivo =
      nombreArchivoDesdeRuta(
        validacion.ruta
      );

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          BUCKET_TRABAJOS
        )
        .createSignedUrl(
          validacion.ruta,
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
          "No se pudo preparar la descarga de la Orden de Trabajo.",
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
