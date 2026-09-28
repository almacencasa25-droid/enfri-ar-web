import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdminUser();

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const origin = new URL(request.url).origin;
  const response = await fetch(
    "https://czbzuowslfprevykqmug.supabase.co/functions/v1/admin-handoff",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        verify_url: `${origin}/api/admin/verify-evaluaciones`,
      }),
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !payload?.url) {
    return new NextResponse(
      "No se pudo abrir Evaluaciones automáticamente. Volvé al administrador e intentá nuevamente.",
      {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return NextResponse.redirect(payload.url);
}
