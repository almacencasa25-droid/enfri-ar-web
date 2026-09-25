"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createCursosSupabaseServerClient } from "@/lib/supabase/cursos-server";

const loginSchema = z.object({
  email: z.string().trim().email("Ingresá un correo válido.").max(254),
  password: z.string().min(8, "La contraseña no es válida.").max(200),
});

export type CursosLoginState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function loginCursos(
  _previousState: CursosLoginState,
  formData: FormData
): Promise<CursosLoginState> {
  const result = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.success) {
    return {
      success: false,
      message: "Revisá los datos ingresados.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createCursosSupabaseServerClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (loginError) {
    return { success: false, message: "Correo o contraseña incorrectos." };
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_enfri_admin");

  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: "Este usuario no tiene permisos para administrar Cursos.",
    };
  }

  redirect("/admin/cursos");
}

export async function logoutCursos() {
  const supabase = await createCursosSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/cursos/login");
}
