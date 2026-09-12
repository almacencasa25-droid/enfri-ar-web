import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkGalleryCategory =
  | "instalaciones"
  | "reparaciones_diagnostico"
  | "mantenimiento_limpieza";

export type WorkGalleryItem = {
  id: string;
  storage_path: string;
  title: string;
  alt_text: string;
  category: WorkGalleryCategory;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url: string;
};

type WorkGalleryRow = Omit<WorkGalleryItem, "image_url">;

function addPublicUrl(
  supabase: Awaited<
    ReturnType<typeof createSupabaseServerClient>
  >,
  row: WorkGalleryRow
): WorkGalleryItem {
  const { data } = supabase.storage
    .from("trabajos-enfri-ar")
    .getPublicUrl(row.storage_path);

  return {
    ...row,
    image_url: data.publicUrl,
  };
}

export async function getPublishedWorkGallery(): Promise<
  WorkGalleryItem[]
> {
  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("work_gallery")
    .select(
      `
        id,
        storage_path,
        title,
        alt_text,
        category,
        sort_order,
        is_active,
        created_at,
        updated_at
      `
    )
    .eq("is_active", true)
    .order("category", {
      ascending: true,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Error al cargar galería pública de Enfri.Ar:",
      error
    );

    return [];
  }

  return ((data ?? []) as WorkGalleryRow[]).map(
    (row) => addPublicUrl(supabase, row)
  );
}

export async function getAdminWorkGallery(): Promise<
  WorkGalleryItem[]
> {
  await requireAdminUser();

  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("work_gallery")
    .select(
      `
        id,
        storage_path,
        title,
        alt_text,
        category,
        sort_order,
        is_active,
        created_at,
        updated_at
      `
    )
    .order("category", {
      ascending: true,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Error al cargar galería administrativa:",
      error
    );

    throw new Error(
      "No fue posible cargar los trabajos de la galería."
    );
  }

  return ((data ?? []) as WorkGalleryRow[]).map(
    (row) => addPublicUrl(supabase, row)
  );
}
