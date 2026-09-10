import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactRequestStatus =
  | "pendiente"
  | "en_revision"
  | "respondida"
  | "cerrada";

export type ContactRequest = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_type: string;
  locality: string;
  message: string;
  privacy_accepted: boolean;
  status: ContactRequestStatus;
  created_at: string;
  updated_at: string;
};

export async function getContactRequests(): Promise<ContactRequest[]> {
  await requireAdminUser();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("contact_requests")
    .select(
      `
        id,
        full_name,
        phone,
        email,
        service_type,
        locality,
        message,
        privacy_accepted,
        status,
        created_at,
        updated_at
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Error al cargar consultas administrativas:",
      error
    );

    throw new Error(
      "No fue posible cargar las consultas recibidas."
    );
  }

  return (data ?? []) as ContactRequest[];
}
