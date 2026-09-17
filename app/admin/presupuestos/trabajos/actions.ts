"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  error?: string;
};

const TIPOS_VALIDOS = [
  "mano_obra",
  "material",
  "otro",
] as const;

function obtenerTexto(
  formData: FormData,
  campo: string
) {
  const valor = formData.get(campo);

  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim();
}

function obtenerPrecio(valor: string) {
  const normalizado = valor
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return numero;
}

export async function crearTrabajoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const nombreCorto = obtenerTexto(
    formData,
    "nombre_corto"
  );

  const detalle = obtenerTexto(
    formData,
    "detalle"
  );

  const categoria = obtenerTexto(
    formData,
    "categoria"
  );

  const tipo = obtenerTexto(
    formData,
    "tipo"
  );

  const precioTexto = obtenerTexto(
    formData,
    "precio_unitario"
  );

  const precioUnitario =
    obtenerPrecio(precioTexto);

  if (!nombreCorto) {
    return {
      ok: false,
      error: "Ingresá el nombre del trabajo.",
    };
  }

  if (!detalle) {
    return {
      ok: false,
      error: "Ingresá el detalle del trabajo.",
    };
  }

  if (
    !TIPOS_VALIDOS.includes(
      tipo as (typeof TIPOS_VALIDOS)[number]
    )
  ) {
    return {
      ok: false,
      error: "El tipo de trabajo no es válido.",
    };
  }

  if (
    precioUnitario === null ||
    precioUnitario < 0
  ) {
    return {
      ok: false,
      error: "Ingresá un precio válido.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("trabajos_precios")
    .insert({
      nombre_corto: nombreCorto,
      detalle,
      categoria:
        categoria || null,
      tipo,
      precio_unitario: precioUnitario,
      activo: true,
    });

  if (error) {
    console.error(
      "Error al crear trabajo:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo guardar el trabajo.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/trabajos"
  );

  return {
    ok: true,
  };
}

export async function actualizarTrabajoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(
    formData,
    "id"
  );

  const nombreCorto = obtenerTexto(
    formData,
    "nombre_corto"
  );

  const detalle = obtenerTexto(
    formData,
    "detalle"
  );

  const categoria = obtenerTexto(
    formData,
    "categoria"
  );

  const tipo = obtenerTexto(
    formData,
    "tipo"
  );

  const precioTexto = obtenerTexto(
    formData,
    "precio_unitario"
  );

  const precioUnitario =
    obtenerPrecio(precioTexto);

  if (!id) {
    return {
      ok: false,
      error: "Trabajo inexistente.",
    };
  }

  if (!nombreCorto) {
    return {
      ok: false,
      error: "Ingresá el nombre del trabajo.",
    };
  }

  if (!detalle) {
    return {
      ok: false,
      error: "Ingresá el detalle del trabajo.",
    };
  }

  if (
    !TIPOS_VALIDOS.includes(
      tipo as (typeof TIPOS_VALIDOS)[number]
    )
  ) {
    return {
      ok: false,
      error: "El tipo de trabajo no es válido.",
    };
  }

  if (
    precioUnitario === null ||
    precioUnitario < 0
  ) {
    return {
      ok: false,
      error: "Ingresá un precio válido.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("trabajos_precios")
    .update({
      nombre_corto: nombreCorto,
      detalle,
      categoria:
        categoria || null,
      tipo,
      precio_unitario: precioUnitario,
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Error al actualizar trabajo:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo modificar el trabajo.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/trabajos"
  );

  return {
    ok: true,
  };
}

export async function cambiarEstadoTrabajoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(
    formData,
    "id"
  );

  const activo =
    obtenerTexto(
      formData,
      "activo"
    ) === "true";

  if (!id) {
    return {
      ok: false,
      error: "Trabajo inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("trabajos_precios")
    .update({
      activo,
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Error al cambiar estado:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo cambiar el estado.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/trabajos"
  );

  return {
    ok: true,
  };
}

export async function eliminarTrabajoDefinitivamenteAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(
    formData,
    "id"
  );

  const confirmacion = obtenerTexto(
    formData,
    "confirmacion"
  );

  if (!id) {
    return {
      ok: false,
      error: "Trabajo inexistente.",
    };
  }

  /*
   * Protección adicional del lado servidor.
   * La interfaz deberá pedir una segunda
   * confirmación antes de enviar ELIMINAR.
   */
  if (confirmacion !== "ELIMINAR") {
    return {
      ok: false,
      error:
        "La eliminación definitiva no fue confirmada.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "eliminar_trabajo_definitivamente_enfriar",
    {
      p_trabajo_id: id,
    }
  );

  if (error) {
    console.error(
      "Error al eliminar trabajo:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo eliminar definitivamente el trabajo.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/trabajos"
  );

  return {
    ok: true,
  };
}
