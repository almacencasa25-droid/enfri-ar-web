import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const CURSOS_COOKIE_NAME = "enfriar-cursos-auth";

export async function createCursosSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_CURSOS_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_CURSOS_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Faltan las variables de conexión de Enfri.Ar Cursos."
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookieOptions: {
        name: CURSOS_COOKIE_NAME,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // El proxy refresca la sesión cuando el componente no puede escribir cookies.
          }
        },
      },
    }
  );
}
