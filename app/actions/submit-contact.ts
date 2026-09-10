"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre y apellido.")
    .max(120, "El nombre es demasiado largo."),

  phone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono válido.")
    .max(40, "El teléfono es demasiado largo."),

  email: z
    .string()
    .trim()
    .max(254, "El correo electrónico es demasiado largo.")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Ingresá un correo electrónico válido."
    ),

  serviceType: z.enum([
    "instalacion_split",
    "piso_techo",
    "reparacion_diagnostico",
    "mantenimiento_limpieza",
    "otro",
  ]),

  locality: z
    .string()
    .trim()
    .min(2, "Ingresá tu localidad.")
    .max(120, "La localidad es demasiado larga."),

  message: z
    .string()
    .trim()
    .min(10, "Contanos un poco más sobre la consulta.")
    .max(3000, "El mensaje es demasiado largo."),

  privacyAccepted: z.literal(true),

  /*
   * Campo oculto anti-spam.
   * Una persona real no debe completarlo.
   */
  company: z.string().max(0).optional(),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function submitContactRequest(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawData = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    serviceType: String(formData.get("serviceType") ?? ""),
    locality: String(formData.get("locality") ?? ""),
    message: String(formData.get("message") ?? ""),
    privacyAccepted:
      formData.get("privacyAccepted") === "on",
    company: String(formData.get("company") ?? ""),
  };

  const result = contactSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      message: "Revisá los datos marcados e intentá nuevamente.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("contact_requests")
      .insert({
        full_name: result.data.fullName,
        phone: result.data.phone,
        email:
          result.data.email === ""
            ? null
            : result.data.email,
        service_type: result.data.serviceType,
        locality: result.data.locality,
        message: result.data.message,
        privacy_accepted: true,
      });

    if (error) {
      console.error(
        "Error al guardar consulta de Enfri.Ar:",
        error
      );

      return {
        success: false,
        message:
          "No pudimos enviar la consulta en este momento. Intentá nuevamente en unos minutos.",
      };
    }

    return {
      success: true,
      message:
        "Tu consulta fue enviada correctamente. Enfri.Ar se comunicará con vos a la brevedad.",
    };
  } catch (error) {
    console.error(
      "Error inesperado al enviar consulta de Enfri.Ar:",
      error
    );

    return {
      success: false,
      message:
        "No pudimos enviar la consulta en este momento. Intentá nuevamente en unos minutos.",
    };
  }
}
