import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: {params: Promise<{id:string;tipo:string}>}) {
  const {id,tipo} = await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["seguro","antecedentes"].includes(tipo)) return new NextResponse("Documento inválido.",{status:404});
  const db = await createSupabaseServerClient();
  const {data,error} = await db.from("tecnico_documentos")
    .select("archivo_path").eq("tecnico_id",id).eq("tipo",tipo).eq("publicado",true).maybeSingle();
  if(error || !data) return new NextResponse("Documento no disponible.",{status:404});
  // Descarga desde servidor mediante el acceso autorizado de Storage; evita entregar
  // al visitante una URL firmada cuyo JWT vence entre la consulta y el clic.
  const {data:pdf,error:downloadError}=await db.storage.from("enfri-tecnico-documentos").download(data.archivo_path);
  if(downloadError||!pdf) return new NextResponse("No se pudo abrir el documento.",{status:502});
  const bytes=await pdf.arrayBuffer();
  return new NextResponse(bytes,{status:200,headers:{
    "Content-Type":"application/pdf",
    "Content-Disposition":"inline; filename=\"documentacion-tecnica.pdf\"",
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  }});
}
