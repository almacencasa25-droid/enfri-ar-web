"use server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CrearOrdenTrabajoInput = {
  presupuestoId: string;
  tecnicoId: string;

  fecha?: string | null;

  fechaProgramada?: string | null;
  horaProgramada?: string | null;

  observaciones?: string | null;
};

function textoOpcional(
  valor:
    | string
    | null
    | undefined
) {
  const limpio =
    String(valor ?? "").trim();

  return limpio || null;
}

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

export async function crearOrdenTrabajoAction(
  input: CrearOrdenTrabajoInput
) {
  try {
    await requireAdminUser();

    const presupuestoId =
      String(
        input.presupuestoId ?? ""
      ).trim();

    const tecnicoId =
      String(
        input.tecnicoId ?? ""
      ).trim();

    if (!presupuestoId) {
      return {
        ok: false as const,
        error:
          "El presupuesto es obligatorio.",
      };
    }

    if (!tecnicoId) {
      return {
        ok: false as const,
        error:
          "Tenés que seleccionar un técnico.",
      };
    }

    const supabase =
      await createSupabaseServerClient();

    const {
      data: planillaId,
      error: crearError,
    } = await supabase.rpc(
      "crear_planilla_trabajo_enfriar",
      {
        p_presupuesto_id:
          presupuestoId,

        p_tecnico_id:
          tecnicoId,

        p_fecha:
          textoOpcional(
            input.fecha
          ),

        p_fecha_programada:
          textoOpcional(
            input.fechaProgramada
          ),

        p_hora_programada:
          textoOpcional(
            input.horaProgramada
          ),

        p_observaciones:
          textoOpcional(
            input.observaciones
          ),
      }
    );

    if (crearError) {
      return {
        ok: false as const,
        error:
          crearError.message,
      };
    }

    if (!planillaId) {
      return {
        ok: false as const,
        error:
          "No se pudo crear la Orden de Trabajo.",
      };
    }

    const {
      data: orden,
      error: ordenError,
    } = await supabase
      .from(
        "planillas_trabajo"
      )
      .select(`
        id,
        numero_orden,
        fecha,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_matricula
      `)
      .eq(
        "id",
        planillaId
      )
      .single();

    if (
      ordenError ||
      !orden
    ) {
      return {
        ok: false as const,
        error:
          ordenError?.message ||
          "La Orden de Trabajo fue creada, pero no se pudo recuperar su información.",
      };
    }

    return {
      ok: true as const,

      data: {
        id:
          orden.id,

        numeroOrden:
          orden.numero_orden,

        fecha:
          orden.fecha,

        tecnico:
          [
            orden.tecnico_nombre,
            orden.tecnico_apellido,
          ]
            .filter(Boolean)
            .join(" "),

        matricula:
          orden.tecnico_matricula,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        mensajeError(error),
    };
  }
}
