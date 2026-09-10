"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
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

const gallerySchema = z.object({
  title: z.string().trim().min(2).max(120),
  altText: z.string().trim().min(2).max(250),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

const updateSchema = gallerySchema.extend({
  id: z.string().uuid(),
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

export async function createGalleryItem(
  _previousState: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  await requireAdminUser();

  const file = formData.get("image");

  const parsed = gallerySchema.safeParse({
    title: String(formData.get("title") ?? ""),
    altText: String(formData.get("altText") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
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
      message: "La imagen no puede superar los 5 MB.",
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
      sort_order: parsed.data.sortOrder,
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
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(
      "Los datos del trabajo no son válidos."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("work_gallery")
    .update({
      title: parsed.data.title,
      alt_text: parsed.data.altText,
      sort_order: parsed.data.sortOrder,
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

  revalidatePath("/");
  revalidatePath("/admin/galeria");
}

export async function deleteGalleryItem(
  formData: FormData
) {
  await requireAdminUser();

  const parsed = deleteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("El trabajo seleccionado no es válido.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: item, error: readError } = await supabase
    .from("work_gallery")
    .select("storage_path")
    .eq("id", parsed.data.id)
    .single();

  if (readError || !item) {
    throw new Error(
      "No fue posible encontrar el trabajo seleccionado."
    );
  }

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

  const { error: deleteFileError } = await supabase.storage
    .from(BUCKET)
    .remove([item.storage_path]);

  if (deleteFileError) {
    console.error(
      "El registro fue eliminado pero no se pudo limpiar el archivo:",
      deleteFileError
    );
  }

  revalidatePath("/");
  revalidatePath("/admin/galeria");
}
