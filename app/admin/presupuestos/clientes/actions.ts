"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  error?: string;
};

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

function datosCliente(formData: FormData) {
  const nombre = obtenerTexto(formData, "nombre");
  const apellido = obtenerTexto(formData, "apellido");
  const razonSocial = obtenerTexto(
    formData,
    "razon_social"
  );

  const dni = obtenerTexto(formData, "dni");
  const cuit = obtenerTexto(formData, "cuit");

  const telefono = obtenerTexto(
    formData,
    "telefono"
  );

  const email = obtenerTexto(
    formData,
    "email"
  );

  const direccion = obtenerTexto(
    formData,
    "direccion"
  );

  const localidad = obtenerTexto(
    formData,
    "localidad"
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones"
  );

  return {
    nombre,
    apellido,
    razonSocial,
    dni,
    cuit,
    telefono,
    email,
    direccion,
    localidad,
    observaciones,
  };
}

function validarCliente(
  datos: ReturnType<typeof datosCliente>
): string | null {
  if (
    !datos.nombre &&
    !datos.apellido &&
    !datos.razonSocial
  ) {
    return "Ingresá nombre, apellido o razón social.";
  }

  if (!datos.direccion) {
    return "La dirección es obligatoria.";
  }

  return null;
}

export async function crearClienteAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const datos = datosCliente(formData);

  const errorValidacion =
    validarCliente(datos);

  if (errorValidacion) {
    return {
      ok: false,
      error: errorValidacion,
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("clientes")
    .insert({
      nombre: datos.nombre || null,
      apellido: datos.apellido || null,
      razon_social:
        datos.razonSocial || null,

      dni: datos.dni || null,
      cuit: datos.cuit || null,

      telefono: datos.telefono || null,
      email: datos.email || null,

      direccion: datos.direccion,
      localidad:
        datos.localidad || null,

      observaciones:
        datos.observaciones || null,

      activo: true,
    });

  if (error) {
    console.error(
      "Error al crear cliente:",
      error
    );

    if (
      error.code === "23505"
    ) {
      return {
        ok: false,
        error:
          "Ya existe un cliente con ese DNI o CUIT.",
      };
    }

    return {
      ok: false,
      error:
        "No se pudo guardar el cliente.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/clientes"
  );

  return {
    ok: true,
  };
}

export async function actualizarClienteAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(
    formData,
    "id"
  );

  if (!id) {
    return {
      ok: false,
      error: "Cliente inexistente.",
    };
  }

  const datos = datosCliente(formData);

  const errorValidacion =
    validarCliente(datos);

  if (errorValidacion) {
    return {
      ok: false,
      error: errorValidacion,
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      nombre: datos.nombre || null,
      apellido: datos.apellido || null,
      razon_social:
        datos.razonSocial || null,

      dni: datos.dni || null,
      cuit: datos.cuit || null,

      telefono: datos.telefono || null,
      email: datos.email || null,

      direccion: datos.direccion,
      localidad:
        datos.localidad || null,

      observaciones:
        datos.observaciones || null,
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Error al actualizar cliente:",
      error
    );

    if (
      error.code === "23505"
    ) {
      return {
        ok: false,
        error:
          "Ya existe otro cliente con ese DNI o CUIT.",
      };
    }

    return {
      ok: false,
      error:
        "No se pudo modificar el cliente.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/clientes"
  );

  return {
    ok: true,
  };
}

export async function cambiarEstadoClienteAction(
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
      error: "Cliente inexistente.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      activo,
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Error al cambiar estado del cliente:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo cambiar el estado del cliente.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/clientes"
  );

  return {
    ok: true,
  };
}

export async function eliminarClienteDefinitivamenteAction(
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
      error: "Cliente inexistente.",
    };
  }

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
    "eliminar_cliente_definitivamente_enfriar",
    {
      p_cliente_id: id,
    }
  );

  if (error) {
    console.error(
      "Error al eliminar cliente:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo eliminar definitivamente el cliente.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/clientes"
  );

  return {
    ok: true,
  };
}
