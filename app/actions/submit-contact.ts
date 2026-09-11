"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

async function getHashedIp() {
  const requestHeaders = await headers();

  const forwardedFor =
    requestHeaders.get("x-forwarded-for");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  const secret =
    process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY."
    );
  }

  return createHmac("sha256", secret)
    .update(ip)
    .digest("hex");
}

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
      message:
        "Revisá los datos marcados e intentá nuevamente.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase =
      createSupabaseAdminClient();

    const ipHash = await getHashedIp();

    const windowStart = new Date(
      Date.now() -
        RATE_LIMIT_MINUTES * 60 * 1000
    );

    const {
      count,
      error: rateLimitReadError,
    } = await supabase
      .from("contact_rate_limits")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("ip_hash", ipHash)
      .gte(
        "created_at",
        windowStart.toISOString()
      );

    if (rateLimitReadError) {
      console.error(
        "Error al verificar límite de consultas:",
        rateLimitReadError
      );

      return {
        success: false,
        message:
          "No pudimos enviar la consulta en este momento. Intentá nuevamente en unos minutos.",
      };
    }

    if (
      (count ?? 0) >=
      RATE_LIMIT_MAX_REQUESTS
    ) {
      return {
        success: false,
        message:
          "Se enviaron varias consultas recientemente. Esperá unos minutos antes de intentar nuevamente.",
      };
    }

    const {
      error: rateLimitInsertError,
    } = await supabase
      .from("contact_rate_limits")
      .insert({
        ip_hash: ipHash,
      });

    if (rateLimitInsertError) {
      console.error(
        "Error al registrar límite de consultas:",
        rateLimitInsertError
      );

      return {
        success: false,
        message:
          "No pudimos enviar la consulta en este momento. Intentá nuevamente en unos minutos.",
      };
    }

    const { error } = await supabase
      .from("contact_requests")
      .insert({
        full_name: result.data.fullName,
        phone: result.data.phone,
        email:
          result.data.email === ""
            ? null
            : result.data.email,
        service_type:
          result.data.serviceType,
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
