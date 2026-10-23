import { NextRequest,NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get("id")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"ID inválido"},{status:400});
 const url="https://enfriar.com.ar/verificar-documentos/"+id;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),9000);
 try{
  const upstream=new URL("https://api.qrserver.com/v1/create-qr-code/");
  upstream.searchParams.set("size","240x240");
  upstream.searchParams.set("format","png");
  upstream.searchParams.set("margin","2");
  upstream.searchParams.set("data",url);
  const res=await fetch(upstream.toString(),{signal:controller.signal,cache:"no-store"});
  if(!res.ok||!(res.headers.get("content-type")||"").includes("image/png"))throw new Error("Respuesta QR inválida");
  return new NextResponse(await res.arrayBuffer(),{headers:{"Content-Type":"image/png","Cache-Control":"public, max-age=3600","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"No fue posible generar el QR"},{status:502});}
 finally{clearTimeout(timer);}
}
