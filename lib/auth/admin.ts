import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Devuelve el usuario únicamente cuando:
 *
 * 1. Existe una sesión válida de Supabase.
 * 2. El usuario autenticado está registrado en admin_users.
 *
 * Estar autenticado por sí solo NO convierte a una persona
 * en administrador.
 */
export async function getCurrentAdminUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_enfri_admin");

  if (adminError || isAdmin !== true) {
    return null;
  }

  return user;
}

/*
 * Se utiliza dentro de páginas y funciones administrativas.
 *
 * Si no existe un administrador válido, la ejecución se
 * interrumpe y el visitante vuelve al acceso de Administrador.
 */
export async function requireAdminUser() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
