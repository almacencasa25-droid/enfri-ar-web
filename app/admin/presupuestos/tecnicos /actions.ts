"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  error?: string;
};

const BUCKET_TECNICOS = "tecnicos-enfri-ar";

const ESTADOS_VALIDOS = [
  "disponible",
  "no_disponible",
  "inactivo",
] as const;

const MIME_VALIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FOTO_BYTES = 5 * 1024 * 1024;

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

function obtenerFoto(
  formData: FormData
): File | null {
  const valor = formData.get("foto");

  if (!(valor instanceof File)) {
    return null;
  }

  if (valor.size === 0) {
    return null;
  }

  return valor;
}

function validarFoto(
  foto: File | null
): string | null {
  if (!foto) {
    return null;
  }

  if (!MIME_VALIDOS.includes(foto.type)) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (foto.size > MAX_FOTO_BYTES) {
    return "La foto no puede superar los 5 MB.";
  }

  return null;
}

function extensionFoto(foto: File) {
  if (foto.type === "image/png") {
    return "png";
  }

  if (foto.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function datosTecnico(formData: FormData) {
  return {
    nombre: obtenerTexto(formData, "nombre"),
    apellido: obtenerTexto(formData, "apellido"),
    dni: obtenerTexto(formData, "dni"),
    telefono: obtenerTexto(formData, "telefono"),
    email: obtenerTexto(formData, "email"),
    direccion: obtenerTexto(formData, "direccion"),
    localidad: obtenerTexto(formData, "localidad"),

    numeroMatricula: obtenerTexto(
      formData,
      "numero_matricula"
    ),

    vencimientoMatricula: obtenerTexto(
      formData,
      "vencimiento_matricula"
    ),

    especialidad: obtenerTexto(
      formData,
      "especialidad"
    ),

    observaciones: obtenerTexto(
      formData,
      "observaciones"
    ),

    estado: obtenerTexto(
      formData,
      "estado"
    ),
  };
}

function validarTecnico(
  datos: ReturnType<typeof datosTecnico>
): string | null {
  if (!datos.nombre) {
    return "Ingresá el nombre.";
  }

  if (!datos.apellido) {
    return "Ingresá el apellido.";
  }

  if (!datos.telefono) {
    return "Ingresá el teléfono.";
  }

  if (!datos.direccion) {
    return "La dirección es obligatoria.";
  }

  if (!datos.numeroMatricula) {
    return "Ingresá el número de matrícula.";
  }

  if (
    !ESTADOS_VALIDOS.includes(
      datos.estado as (typeof ESTADOS_VALIDOS)[number]
    )
  ) {
    return "El estado del técnico no es válido.";
  }

  return null;
}

async function subirFotoTecnico(
  foto: File,
  supabase: Awaited<
    ReturnType<typeof createSupabaseServerClient>
  >
) {
  const extension = extensionFoto(foto);

  const path =
    `tecnicos/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_TECNICOS)
    .upload(path, foto, {
      contentType: foto.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      "No se pudo guardar la foto del técnico."
    );
  }

  return path;
}

export async function crearTecnicoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const datos = datosTecnico(formData);
  const foto = obtenerFoto(formData);

  const errorDatos = validarTecnico(datos);

  if (errorDatos) {
    return {
      ok: false,
      error: errorDatos,
    };
  }

  const errorFoto = validarFoto(foto);

  if (errorFoto) {
    return {
      ok: false,
      error: errorFoto,
    };
  }

  const supabase =
    await createSupabaseServerClient();

  let fotoPath: string | null = null;

  try {
    if (foto) {
      fotoPath = await subirFotoTecnico(
        foto,
        supabase
      );
    }

    const { error } = await supabase
      .from("tecnicos")
      .insert({
        nombre: datos.nombre,
        apellido: datos.apellido,

        dni: datos.dni || null,

        telefono: datos.telefono,
        email: datos.email || null,

        direccion: datos.direccion,
        localidad: datos.localidad || null,

        numero_matricula:
          datos.numeroMatricula,

        vencimiento_matricula:
          datos.vencimientoMatricula ||
          null,

        especialidad:
          datos.especialidad || null,

        observaciones:
          datos.observaciones || null,

        foto_storage_path: fotoPath,

        estado: datos.estado,
      });

    if (error) {
      if (fotoPath) {
        await supabase.storage
          .from(BUCKET_TECNICOS)
          .remove([fotoPath]);
      }

      if (error.code === "23505") {
        return {
          ok: false,
          error:
            "Ya existe un técnico con ese DNI o número de matrícula.",
        };
      }

      console.error(
        "Error al crear técnico:",
        error
      );

      return {
        ok: false,
        error:
          "No se pudo guardar el técnico.",
      };
    }
  } catch (error) {
    console.error(
      "Error al procesar foto del técnico:",
      error
    );

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el técnico.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/tecnicos"
  );

  return {
    ok: true,
  };
}

export async function actualizarTecnicoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(formData, "id");

  if (!id) {
    return {
      ok: false,
      error: "Técnico inexistente.",
    };
  }

  const datos = datosTecnico(formData);
  const fotoNueva = obtenerFoto(formData);

  const errorDatos = validarTecnico(datos);

  if (errorDatos) {
    return {
      ok: false,
      error: errorDatos,
    };
  }

  const errorFoto = validarFoto(fotoNueva);

  if (errorFoto) {
    return {
      ok: false,
      error: errorFoto,
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const {
    data: tecnicoActual,
    error: tecnicoError,
  } = await supabase
    .from("tecnicos")
    .select("foto_storage_path")
    .eq("id", id)
    .single();

  if (tecnicoError || !tecnicoActual) {
    return {
      ok: false,
      error: "Técnico inexistente.",
    };
  }

  const fotoAnterior =
    tecnicoActual.foto_storage_path;

  let fotoNuevaPath: string | null = null;

  try {
    if (fotoNueva) {
      fotoNuevaPath =
        await subirFotoTecnico(
          fotoNueva,
          supabase
        );
    }

    const actualizacion: {
      nombre: string;
      apellido: string;
      dni: string | null;
      telefono: string;
      email: string | null;
      direccion: string;
      localidad: string | null;
      numero_matricula: string;
      vencimiento_matricula:
        | string
        | null;
      especialidad: string | null;
      observaciones: string | null;
      estado: string;
      foto_storage_path?: string;
    } = {
      nombre: datos.nombre,
      apellido: datos.apellido,

      dni: datos.dni || null,

      telefono: datos.telefono,
      email: datos.email || null,

      direccion: datos.direccion,
      localidad: datos.localidad || null,

      numero_matricula:
        datos.numeroMatricula,

      vencimiento_matricula:
        datos.vencimientoMatricula ||
        null,

      especialidad:
        datos.especialidad || null,

      observaciones:
        datos.observaciones || null,

      estado: datos.estado,
    };

    if (fotoNuevaPath) {
      actualizacion.foto_storage_path =
        fotoNuevaPath;
    }

    const { error } = await supabase
      .from("tecnicos")
      .update(actualizacion)
      .eq("id", id);

    if (error) {
      if (fotoNuevaPath) {
        await supabase.storage
          .from(BUCKET_TECNICOS)
          .remove([fotoNuevaPath]);
      }

      if (error.code === "23505") {
        return {
          ok: false,
          error:
            "Ya existe otro técnico con ese DNI o número de matrícula.",
        };
      }

      console.error(
        "Error al modificar técnico:",
        error
      );

      return {
        ok: false,
        error:
          "No se pudo modificar el técnico.",
      };
    }

    if (
      fotoNuevaPath &&
      fotoAnterior
    ) {
      const { error: eliminarFotoError } =
        await supabase.storage
          .from(BUCKET_TECNICOS)
          .remove([fotoAnterior]);

      if (eliminarFotoError) {
        console.error(
          "No se pudo eliminar la foto anterior:",
          eliminarFotoError
        );
      }
    }
  } catch (error) {
    console.error(
      "Error al procesar técnico:",
      error
    );

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo modificar el técnico.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/tecnicos"
  );

  return {
    ok: true,
  };
}

export async function cambiarEstadoTecnicoAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(formData, "id");

  const estado = obtenerTexto(
    formData,
    "estado"
  );

  if (!id) {
    return {
      ok: false,
      error: "Técnico inexistente.",
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

  const { error } = await supabase
    .from("tecnicos")
    .update({
      estado,
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
        "No se pudo cambiar el estado del técnico.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/tecnicos"
  );

  return {
    ok: true,
  };
}

export async function eliminarTecnicoDefinitivamenteAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAdminUser();

  const id = obtenerTexto(formData, "id");

  const confirmacion = obtenerTexto(
    formData,
    "confirmacion"
  );

  if (!id) {
    return {
      ok: false,
      error: "Técnico inexistente.",
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

  const { data: tecnico } = await supabase
    .from("tecnicos")
    .select("foto_storage_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.rpc(
    "eliminar_tecnico_definitivamente_enfriar",
    {
      p_tecnico_id: id,
    }
  );

  if (error) {
    console.error(
      "Error al eliminar técnico:",
      error
    );

    return {
      ok: false,
      error:
        "No se pudo eliminar definitivamente el técnico.",
    };
  }

  if (tecnico?.foto_storage_path) {
    const { error: fotoError } =
      await supabase.storage
        .from(BUCKET_TECNICOS)
        .remove([
          tecnico.foto_storage_path,
        ]);

    if (fotoError) {
      console.error(
        "No se pudo limpiar la foto del técnico eliminado:",
        fotoError
      );
    }
  }

  revalidatePath(
    "/admin/presupuestos/tecnicos"
  );

  return {
    ok: true,
  };
}
