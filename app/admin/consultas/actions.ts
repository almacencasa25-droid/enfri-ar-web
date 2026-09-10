"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pendiente",
    "en_revision",
    "respondida",
    "cerrada",
  ]),
});

export async function updateContactRequestStatus(
  formData: FormData
) {
  await requireAdminUser();

  const parsed = updateStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    throw new Error(
      "Los datos enviados para actualizar la consulta no son válidos."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("contact_requests")
    .update({
      status: parsed.data.status,
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error(
      "Error al actualizar estado de consulta:",
      error
    );

    throw new Error(
      "No fue posible actualizar el estado de la consulta."
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/consultas");
}
