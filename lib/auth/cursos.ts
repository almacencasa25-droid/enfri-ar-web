import { redirect } from "next/navigation";

import { createCursosSupabaseServerClient } from "@/lib/supabase/cursos-server";

export async function getCurrentCursosAdminUser() {
  const supabase = await createCursosSupabaseServerClient();
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

export async function requireCursosAdminUser() {
  const user = await getCurrentCursosAdminUser();

  if (!user) {
    redirect("/admin/cursos/login");
  }

  return user;
}
