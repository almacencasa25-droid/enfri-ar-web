"use server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CrearConformidadInput = {
  presupuestoId: string;
  tecnicoId: string;

  fecha?: string | null;
  fechaFinalizacion?: string | null;

  observaciones?: string | null;

  nombreAclaracionCliente?: string | null;
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

export async function crearConformidadAction(
  input: CrearConformidadInput
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
      data: conformidadId,
      error: crearError,
    } = await supabase.rpc(
      "crear_conformidad_enfriar",
      {
        p_presupuesto_id:
          presupuestoId,

        p_tecnico_id:
          tecnicoId,

        p_fecha:
          textoOpcional(
            input.fecha
          ),

        p_fecha_finalizacion:
          textoOpcional(
            input.fechaFinalizacion
          ),

        p_observaciones:
          textoOpcional(
            input.observaciones
          ),

        p_nombre_aclaracion_cliente:
          textoOpcional(
            input.nombreAclaracionCliente
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

    if (!conformidadId) {
      return {
        ok: false as const,
        error:
          "No se pudo crear la conformidad.",
      };
    }

    const {
      data: conformidad,
      error: conformidadError,
    } = await supabase
      .from("conformidades")
      .select(`
        id,
        numero_conformidad,
        fecha,
        fecha_finalizacion,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_matricula,
        nombre_aclaracion_cliente
      `)
      .eq(
        "id",
        conformidadId
      )
      .single();

    if (
      conformidadError ||
      !conformidad
    ) {
      return {
        ok: false as const,
        error:
          conformidadError?.message ||
          "La conformidad fue creada, pero no se pudo recuperar su información.",
      };
    }

    return {
      ok: true as const,

      data: {
        id:
          conformidad.id,

        numeroConformidad:
          conformidad.numero_conformidad,

        fecha:
          conformidad.fecha,

        fechaFinalizacion:
          conformidad.fecha_finalizacion,

        tecnico:
          [
            conformidad.tecnico_nombre,
            conformidad.tecnico_apellido,
          ]
            .filter(Boolean)
            .join(" "),

        matricula:
          conformidad.tecnico_matricula,

        nombreAclaracionCliente:
          conformidad.nombre_aclaracion_cliente,
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
