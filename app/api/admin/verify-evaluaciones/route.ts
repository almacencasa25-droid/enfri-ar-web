import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Falta sesión" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = authorization.slice("Bearer ".length).trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.json(
      { ok: false, error: "Configuración incompleta" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sesión inválida" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_enfri_admin");

  if (adminError || isAdmin !== true) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, email: user.email ?? "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
