import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkGalleryCategory =
  | "instalaciones"
  | "reparaciones_diagnostico"
  | "mantenimiento_limpieza"
  | "capacitaciones";

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

const GALLERY_BUCKET = "trabajos-enfri-ar";
const SIGNED_URL_SECONDS = 60 * 60;

async function addSignedUrl(
  row: WorkGalleryRow
): Promise<WorkGalleryItem | null> {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .createSignedUrl(
      row.storage_path,
      SIGNED_URL_SECONDS
    );

  if (error || !data?.signedUrl) {
    console.error(
      "Error al generar URL firmada para imagen de galería:",
      {
        storagePath: row.storage_path,
        error,
      }
    );

    return null;
  }

  return {
    ...row,
    image_url: data.signedUrl,
  };
}

async function addSignedUrls(
  rows: WorkGalleryRow[]
): Promise<WorkGalleryItem[]> {
  const items = await Promise.all(
    rows.map((row) => addSignedUrl(row))
  );

  return items.filter(
    (item): item is WorkGalleryItem =>
      item !== null
  );
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

  return addSignedUrls(
    (data ?? []) as WorkGalleryRow[]
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

  return addSignedUrls(
    (data ?? []) as WorkGalleryRow[]
  );
}
