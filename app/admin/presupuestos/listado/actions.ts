"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
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

  const { data, error } = await supabase.rpc(
    "buscar_presupuestos_enfriar",
    {
      p_busqueda: busqueda.trim(),
      p_limite: 50,
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

  return {
    ok: true,
    data:
      (data || []) as PresupuestoBusqueda[],
  };
}

export async function duplicarPresupuestoAction(
  presupuestoId: string
): Promise<ActionResult<{ id: string }>> {
  await requireAdminUser();

  if (!presupuestoId) {
    return {
      ok: false,
      error: "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "duplicar_presupuesto_enfriar",
    {
      p_presupuesto_id: presupuestoId,
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

  if (typeof data !== "string") {
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
      id: data,
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
      error: "Presupuesto inexistente.",
    };
  }

  if (
    !ESTADOS_VALIDOS.includes(
      estado as (typeof ESTADOS_VALIDOS)[number]
    )
  ) {
    return {
      ok: false,
      error: "Estado inválido.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "cambiar_estado_presupuesto_enfriar",
    {
      p_presupuesto_id: presupuestoId,
      p_estado: estado,
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
      error: "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "anular_presupuesto_enfriar",
    {
      p_presupuesto_id: presupuestoId,
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
      error: "Presupuesto inexistente.",
    };
  }

  if (confirmacion !== "ELIMINAR") {
    return {
      ok: false,
      error:
        "La eliminación no fue confirmada.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "eliminar_presupuesto_enfriar",
    {
      p_presupuesto_id: presupuestoId,
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
      error: "Presupuesto inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "restaurar_presupuesto_enfriar",
    {
      p_presupuesto_id: presupuestoId,
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
