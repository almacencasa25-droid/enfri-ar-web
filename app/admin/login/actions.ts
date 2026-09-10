"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresá un correo electrónico válido.")
    .max(254),

  password: z
    .string()
    .min(8, "La contraseña no es válida.")
    .max(200),
});

export type AdminLoginState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const rawData = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const result = loginSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      message: "Revisá los datos ingresados.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

  if (loginError) {
    return {
      success: false,
      message:
        "Correo o contraseña incorrectos.",
    };
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_enfri_admin");

  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();

    return {
      success: false,
      message:
        "Este usuario no tiene permisos de administrador.",
    };
  }

  redirect("/admin");
}
