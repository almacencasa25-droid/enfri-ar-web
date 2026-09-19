"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type PresupuestoBusquedaBase = {
  id: string;
  numero: number;
  fecha: string;
  cliente: string;
  dni_cuit: string | null;
  detalle_corto: string | null;
  total: number;
  estado: string;
  trabajo_realizado: boolean;
  relevancia: number;
};

export type PresupuestoBusqueda = {
  id: string;
  numero: number;
  fecha: string;
  cliente: string;
  dni_cuit: string | null;
  detalle_corto: string | null;
  total: number;
  estado: string;
  trabajo_realizado: boolean;
  relevancia: number;

  tiene_orden_trabajo: boolean;
  orden_trabajo_id: string | null;
  numero_orden_trabajo: string | null;

  tiene_conformidad: boolean;
  conformidad_id: string | null;
  numero_conformidad: string | null;

  tiene_pdf_presupuesto: boolean;
  pdf_presupuesto_id: string | null;
  pdf_presupuesto_version: number | null;
};

type OrdenTrabajoResumen = {
  id: string;
  presupuesto_id: string;
  numero_orden: string;
  created_at: string;
};

type ConformidadResumen = {
  id: string;
  presupuesto_id: string;
  numero_conformidad: string;
  created_at: string;
};

type PdfPresupuestoResumen = {
  id: string;
  presupuesto_id: string;
  version: number;
  storage_path: string | null;
  created_at: string;
};

const ESTADOS_VALIDOS = [
  "borrador",
  "enviado",
  "aceptado",
  "rechazado",
  "realizado",
  "anulado",
] as const;

function revalidarPresupuestos() {
  revalidatePath(
    "/admin/presupuestos"
  );

  revalidatePath(
    "/admin/presupuestos/listado"
  );
}

export async function buscarPresupuestosAction(
  busqueda: string
): Promise<
  ActionResult<PresupuestoBusqueda[]>
> {
  await requireAdminUser();

  const supabase =
    await createSupabaseServerClient();

  /*
   * =========================================
   * BUSCAR PRESUPUESTOS
   * =========================================
   */

  const {
    data,
    error,
  } = await supabase.rpc(
    "buscar_presupuestos_enfriar",
    {
      p_busqueda:
        busqueda.trim(),

      p_limite:
        50,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudieron buscar los presupuestos.",
    };
  }

  const presupuestosBase =
    (data ||
      []) as PresupuestoBusquedaBase[];

  if (
    presupuestosBase.length ===
    0
  ) {
    return {
      ok: true,
      data: [],
    };
  }

  const presupuestoIds =
    presupuestosBase.map(
      (presupuesto) =>
        presupuesto.id
    );

  /*
   * =========================================
   * ÓRDENES DE TRABAJO VIGENTES
   * =========================================
   */

  const {
    data: ordenesData,
    error: ordenesError,
  } = await supabase
    .from(
      "planillas_trabajo"
    )
    .select(`
      id,
      presupuesto_id,
      numero_orden,
      created_at
    `)
    .in(
      "presupuesto_id",
      presupuestoIds
    )
    .eq(
      "vigente",
      true
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (ordenesError) {
    return {
      ok: false,
      error:
        ordenesError.message ||
        "No se pudieron consultar las Órdenes de Trabajo.",
    };
  }

  const ordenes =
    (ordenesData ||
      []) as OrdenTrabajoResumen[];

  /*
   * =========================================
   * CONFORMIDADES VIGENTES
   * =========================================
   */

  const {
    data: conformidadesData,
    error:
      conformidadesError,
  } = await supabase
    .from(
      "conformidades"
    )
    .select(`
      id,
      presupuesto_id,
      numero_conformidad,
      created_at
    `)
    .in(
      "presupuesto_id",
      presupuestoIds
    )
    .eq(
      "vigente",
      true
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (
    conformidadesError
  ) {
    return {
      ok: false,
      error:
        conformidadesError.message ||
        "No se pudieron consultar las conformidades.",
    };
  }

  const conformidades =
    (conformidadesData ||
      []) as ConformidadResumen[];

  /*
   * =========================================
   * PDF DE PRESUPUESTOS EXISTENTES
   * =========================================
   */

  const {
    data: pdfsData,
    error: pdfsError,
  } = await supabase
    .from(
      "presupuesto_documentos"
    )
    .select(`
      id,
      presupuesto_id,
      version,
      storage_path,
      created_at
    `)
    .in(
      "presupuesto_id",
      presupuestoIds
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (pdfsError) {
    return {
      ok: false,
      error:
        pdfsError.message ||
        "No se pudieron consultar los PDF de presupuestos.",
    };
  }

  const pdfs =
    (pdfsData ||
      []) as PdfPresupuestoResumen[];

  /*
   * =========================================
   * TOMAR EL DOCUMENTO ACTUAL DE CADA TIPO
   * =========================================
   *
   * En OT y conformidad ya recibimos
   * solamente los documentos vigentes.
   *
   * En PDF de presupuesto conservamos
   * el más nuevo que tenga storage_path.
   */

  const ordenPorPresupuesto =
    new Map<
      string,
      OrdenTrabajoResumen
    >();

  for (
    const orden of ordenes
  ) {
    if (
      !ordenPorPresupuesto.has(
        orden.presupuesto_id
      )
    ) {
      ordenPorPresupuesto.set(
        orden.presupuesto_id,
        orden
      );
    }
  }

  const conformidadPorPresupuesto =
    new Map<
      string,
      ConformidadResumen
    >();

  for (
    const conformidad
    of conformidades
  ) {
    if (
      !conformidadPorPresupuesto.has(
        conformidad.presupuesto_id
      )
    ) {
      conformidadPorPresupuesto.set(
        conformidad.presupuesto_id,
        conformidad
      );
    }
  }

  const pdfPorPresupuesto =
    new Map<
      string,
      PdfPresupuestoResumen
    >();

  for (
    const pdf of pdfs
  ) {
    /*
     * Solamente consideramos que
     * existe PDF cuando el documento
     * histórico ya tiene storage_path.
     */
    if (
      !pdf.storage_path
    ) {
      continue;
    }

    if (
      !pdfPorPresupuesto.has(
        pdf.presupuesto_id
      )
    ) {
      pdfPorPresupuesto.set(
        pdf.presupuesto_id,
        pdf
      );
    }
  }

  /*
   * =========================================
   * ARMAR RESULTADO FINAL
   * =========================================
   */

  const presupuestos:
    PresupuestoBusqueda[] =
    presupuestosBase.map(
      (presupuesto) => {
        const orden =
          ordenPorPresupuesto.get(
            presupuesto.id
          );

        const conformidad =
          conformidadPorPresupuesto.get(
            presupuesto.id
          );

        const pdf =
          pdfPorPresupuesto.get(
            presupuesto.id
          );

        return {
          ...presupuesto,

          tiene_orden_trabajo:
            Boolean(
              orden
            ),

          orden_trabajo_id:
            orden?.id ??
            null,

          numero_orden_trabajo:
            orden
              ?.numero_orden ??
            null,

          tiene_conformidad:
            Boolean(
              conformidad
            ),

          conformidad_id:
            conformidad?.id ??
            null,

          numero_conformidad:
            conformidad
              ?.numero_conformidad ??
            null,

          tiene_pdf_presupuesto:
            Boolean(
              pdf
            ),

          pdf_presupuesto_id:
            pdf?.id ??
            null,

          pdf_presupuesto_version:
            pdf?.version ??
            null,
        };
      }
    );

  return {
    ok: true,
    data:
      presupuestos,
  };
}

export async function duplicarPresupuestoAction(
  presupuestoId: string
): Promise<
  ActionResult<{
    id: string;
  }>
> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "duplicar_presupuesto_enfriar",
    {
      p_presupuesto_id:
        presupuestoId,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo duplicar el presupuesto.",
    };
  }

  if (
    typeof data !==
    "string"
  ) {
    return {
      ok: false,
      error:
        "El presupuesto fue duplicado pero no se recibió su identificación.",
    };
  }

  revalidarPresupuestos();

  return {
    ok: true,
    data: {
      id:
        data,
    },
  };
}

export async function cambiarEstadoPresupuestoAction(
  presupuestoId: string,
  estado: string
): Promise<ActionResult> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "Presupuesto inexistente.",
    };
  }

  if (
    !ESTADOS_VALIDOS.includes(
      estado as (
        typeof ESTADOS_VALIDOS
      )[number]
    )
  ) {
    return {
      ok: false,
      error:
        "Estado inválido.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } = await supabase.rpc(
    "cambiar_estado_presupuesto_enfriar",
    {
      p_presupuesto_id:
        presupuestoId,

      p_estado:
        estado,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo cambiar el estado.",
    };
  }

  revalidarPresupuestos();

  return {
    ok: true,
  };
}

export async function anularPresupuestoAction(
  presupuestoId: string
): Promise<ActionResult> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } = await supabase.rpc(
    "anular_presupuesto_enfriar",
    {
      p_presupuesto_id:
        presupuestoId,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo anular el presupuesto.",
    };
  }

  revalidarPresupuestos();

  return {
    ok: true,
  };
}

export async function eliminarPresupuestoAction(
  presupuestoId: string,
  confirmacion: string
): Promise<ActionResult> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "Presupuesto inexistente.",
    };
  }

  if (
    confirmacion !==
    "ELIMINAR"
  ) {
    return {
      ok: false,
      error:
        "La eliminación no fue confirmada.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } = await supabase.rpc(
    "eliminar_presupuesto_enfriar",
    {
      p_presupuesto_id:
        presupuestoId,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo eliminar el presupuesto.",
    };
  }

  revalidarPresupuestos();

  return {
    ok: true,
  };
}

export async function restaurarPresupuestoAction(
  presupuestoId: string
): Promise<ActionResult> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    error,
  } = await supabase.rpc(
    "restaurar_presupuesto_enfriar",
    {
      p_presupuesto_id:
        presupuestoId,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo restaurar el presupuesto.",
    };
  }

  revalidarPresupuestos();

  return {
    ok: true,
  };
}
