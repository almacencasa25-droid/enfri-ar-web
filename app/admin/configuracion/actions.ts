"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || z.url().safeParse(value).success,
    "Ingresá una dirección web válida."
  );

const settingsSchema = z.object({
  whatsappNumber: z.string().trim().max(50),
  whatsappMessage: z.string().trim().max(500),

  phone: z.string().trim().max(50),

  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) =>
        value === "" || z.email().safeParse(value).success,
      "Ingresá un correo electrónico válido."
    ),

  website: optionalUrl,

  address: z.string().trim().max(250),

  renacliWebsite: optionalUrl,
  renacliSectionTitle: z.string().trim().min(2).max(180),
  renacliSectionDescription: z
    .string()
    .trim()
    .min(2)
    .max(600),
  renacliButtonLabel: z.string().trim().min(2).max(120),
});

export type SiteSettingsState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function updateSiteSettings(
  _previousState: SiteSettingsState,
  formData: FormData
): Promise<SiteSettingsState> {
  await requireAdminUser();

  const parsed = settingsSchema.safeParse({
    whatsappNumber: String(
      formData.get("whatsappNumber") ?? ""
    ),

    whatsappMessage: String(
      formData.get("whatsappMessage") ?? ""
    ),

    phone: String(formData.get("phone") ?? ""),

    email: String(formData.get("email") ?? ""),

    website: String(formData.get("website") ?? ""),

    address: String(formData.get("address") ?? ""),

    renacliWebsite: String(
      formData.get("renacliWebsite") ?? ""
    ),

    renacliSectionTitle: String(
      formData.get("renacliSectionTitle") ?? ""
    ),

    renacliSectionDescription: String(
      formData.get("renacliSectionDescription") ?? ""
    ),

    renacliButtonLabel: String(
      formData.get("renacliButtonLabel") ?? ""
    ),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los datos ingresados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("site_settings")
    .update({
      whatsapp_number: parsed.data.whatsappNumber,
      whatsapp_message: parsed.data.whatsappMessage,

      phone: parsed.data.phone,
      email: parsed.data.email,
      website: parsed.data.website,

      address:
        parsed.data.address.length > 0
          ? parsed.data.address
          : null,

      renacli_website: parsed.data.renacliWebsite,
      renacli_section_title:
        parsed.data.renacliSectionTitle,
      renacli_section_description:
        parsed.data.renacliSectionDescription,
      renacli_button_label:
        parsed.data.renacliButtonLabel,
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Error al actualizar configuración de Enfri.Ar:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible guardar la configuración.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/configuracion");

  return {
    success: true,
    message: "Configuración guardada correctamente.",
  };
}
