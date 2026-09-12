"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "trabajos-enfri-ar";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const categorySchema = z.enum([
  "instalaciones",
  "reparaciones_diagnostico",
  "mantenimiento_limpieza",
]);

type GalleryCategory = z.infer<typeof categorySchema>;

const gallerySchema = z.object({
  title: z.string().trim().min(2).max(120),
  altText: z.string().trim().min(2).max(250),

  /*
   * Temporalmente opcional para mantener compatibilidad
   * mientras actualizamos la interfaz del administrador.
   */
  category: categorySchema.optional(),
});

const updateSchema = gallerySchema.extend({
  id: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(1).max(10000),
  isActive: z.boolean(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export type GalleryActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

type SupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

async function getNextSortOrder(
  supabase: SupabaseClient,
  category: GalleryCategory
) {
  const { data, error } = await supabase
    .from("work_gallery")
    .select("sort_order")
    .eq("category", category)
    .order("sort_order", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      "No fue posible calcular la posición de la nueva foto."
    );
  }

  return (data?.sort_order ?? 0) + 1;
}

async function renumberCategory(
  supabase: SupabaseClient,
  category: GalleryCategory
) {
  const { data, error } = await supabase
    .from("work_gallery")
    .select("id, sort_order")
    .eq("category", category)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      "No fue posible reorganizar la galería."
    );
  }

  for (let index = 0; index < data.length; index += 1) {
    const expectedOrder = index + 1;
    const item = data[index];

    if (item.sort_order === expectedOrder) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("work_gallery")
      .update({
        sort_order: expectedOrder,
      })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(
        "No fue posible reorganizar la galería."
      );
    }
  }
}

export async function createGalleryItem(
  _previousState: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  await requireAdminUser();

  const file = formData.get("image");

  const parsed = gallerySchema.safeParse({
    title: String(formData.get("title") ?? ""),
    altText: String(formData.get("altText") ?? ""),
    category:
      formData.get("category") === null
        ? undefined
        : String(formData.get("category")),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los datos ingresados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Seleccioná una imagen.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message:
        "La imagen no pudo reducirse lo suficiente para subirla.",
    };
  }

  const extension =
    allowedTypes[file.type as keyof typeof allowedTypes];

  if (!extension) {
    return {
      success: false,
      message:
        "Formato no permitido. Usá JPG, PNG o WebP.",
    };
  }

  const supabase = await createSupabaseServerClient();

  /*
   * Mientras actualizamos la pantalla del administrador,
   * una carga antigua sin categoría se conserva en Instalaciones.
   */
  const category: GalleryCategory =
    parsed.data.category ?? "instalaciones";

  let nextSortOrder: number;

  try {
    nextSortOrder = await getNextSortOrder(
      supabase,
      category
    );
  } catch (error) {
    console.error(
      "Error al calcular orden de galería:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible calcular la posición de la foto.",
    };
  }

  const storagePath = `${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Error al subir imagen de galería:",
      uploadError
    );

    return {
      success: false,
      message: "No fue posible subir la imagen.",
    };
  }

  const { error: insertError } = await supabase
    .from("work_gallery")
    .insert({
      storage_path: storagePath,
      title: parsed.data.title,
      alt_text: parsed.data.altText,
      category,
      sort_order: nextSortOrder,
      is_active: true,
    });

  if (insertError) {
    console.error(
      "Error al registrar imagen de galería:",
      insertError
    );

    await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    return {
      success: false,
      message:
        "No fue posible registrar el trabajo en la galería.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/galeria");

  return {
    success: true,
    message: "Trabajo agregado correctamente.",
  };
}

export async function updateGalleryItem(
  formData: FormData
) {
  await requireAdminUser();

  const parsed = updateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    altText: String(formData.get("altText") ?? ""),
    category:
      formData.get("category") === null
        ? undefined
        : String(formData.get("category")),
    sortOrder: String(formData.get("sortOrder") ?? "1"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(
      "Los datos del trabajo no son válidos."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: currentItem, error: currentError } =
    await supabase
      .from("work_gallery")
      .select("id, category, sort_order")
      .eq("id", parsed.data.id)
      .single();

  if (currentError || !currentItem) {
    throw new Error(
      "No fue posible encontrar el trabajo seleccionado."
    );
  }

  const currentCategory =
    categorySchema.parse(currentItem.category);

  const requestedCategory =
    parsed.data.category ?? currentCategory;

  /*
   * Si cambia de galería:
   * - sale de la categoría anterior;
   * - entra automáticamente al final de la nueva;
   * - la categoría anterior vuelve a quedar numerada 1, 2, 3...
   */
  if (requestedCategory !== currentCategory) {
    const newOrder = await getNextSortOrder(
      supabase,
      requestedCategory
    );

    const { error } = await supabase
      .from("work_gallery")
      .update({
        title: parsed.data.title,
        alt_text: parsed.data.altText,
        category: requestedCategory,
        sort_order: newOrder,
        is_active: parsed.data.isActive,
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error(
        "Error al cambiar trabajo de galería:",
        error
      );

      throw new Error(
        "No fue posible modificar el trabajo."
      );
    }

    await renumberCategory(
      supabase,
      currentCategory
    );
  } else {
    const { data: lastItem, error: lastItemError } =
      await supabase
        .from("work_gallery")
        .select("sort_order")
        .eq("category", currentCategory)
        .order("sort_order", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (lastItemError) {
      throw new Error(
        "No fue posible verificar el orden de la galería."
      );
    }

    const maxOrder = Math.max(
      lastItem?.sort_order ?? 1,
      1
    );

    const requestedOrder = Math.min(
      parsed.data.sortOrder,
      maxOrder
    );

    /*
     * Si la posición solicitada ya pertenece a otra foto,
     * intercambiamos ambas posiciones.
     *
     * Ejemplo:
     * foto 8 pasa a 1
     * foto que estaba en 1 pasa automáticamente a 8
     */
    if (requestedOrder !== currentItem.sort_order) {
      const { data: targetItem, error: targetError } =
        await supabase
          .from("work_gallery")
          .select("id")
          .eq("category", currentCategory)
          .eq("sort_order", requestedOrder)
          .neq("id", parsed.data.id)
          .maybeSingle();

      if (targetError) {
        throw new Error(
          "No fue posible verificar la posición seleccionada."
        );
      }

      if (targetItem) {
        const { error: swapError } = await supabase
          .from("work_gallery")
          .update({
            sort_order: currentItem.sort_order,
          })
          .eq("id", targetItem.id);

        if (swapError) {
          throw new Error(
            "No fue posible intercambiar las posiciones."
          );
        }
      }
    }

    const { error } = await supabase
      .from("work_gallery")
      .update({
        title: parsed.data.title,
        alt_text: parsed.data.altText,
        category: currentCategory,
        sort_order: requestedOrder,
        is_active: parsed.data.isActive,
      })
      .eq("id", parsed.data.id);

    if (error) {
      console.error(
        "Error al modificar trabajo de galería:",
        error
      );

      throw new Error(
        "No fue posible modificar el trabajo."
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/galeria");

  redirect("/admin/galeria?guardado=1");
}

export async function deleteGalleryItem(
  formData: FormData
) {
  await requireAdminUser();

  const parsed = deleteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    throw new Error(
      "El trabajo seleccionado no es válido."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: item, error: readError } =
    await supabase
      .from("work_gallery")
      .select("storage_path, category")
      .eq("id", parsed.data.id)
      .single();

  if (readError || !item) {
    throw new Error(
      "No fue posible encontrar el trabajo seleccionado."
    );
  }

  const category = categorySchema.parse(
    item.category
  );

  const { error: deleteDbError } = await supabase
    .from("work_gallery")
    .delete()
    .eq("id", parsed.data.id);

  if (deleteDbError) {
    console.error(
      "Error al eliminar trabajo de la base:",
      deleteDbError
    );

    throw new Error(
      "No fue posible eliminar el trabajo."
    );
  }

  const { error: deleteFileError } =
    await supabase.storage
      .from(BUCKET)
      .remove([item.storage_path]);

  if (deleteFileError) {
    console.error(
      "El registro fue eliminado pero no se pudo limpiar el archivo:",
      deleteFileError
    );
  }

  /*
   * Si se elimina, por ejemplo, la foto 2,
   * las siguientes pasan automáticamente a 2, 3, 4...
   */
  await renumberCategory(
    supabase,
    category
  );

  revalidatePath("/");
  revalidatePath("/admin/galeria");
}
