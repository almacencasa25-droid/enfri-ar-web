import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic="force-dynamic";
export const metadata={title:"Documentación técnica | Enfri.Ar",robots:{index:false,follow:false,noarchive:true}};

export default async function DocumentacionPublica({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("tecnico_documentos").select("tipo,archivo_path").eq("tecnico_id",id).eq("publicado",true);
 if(error)throw new Error("No se pudo verificar la documentación.");
 if(!data?.length)return <main style={{minHeight:"100vh",background:"#e8f3f8",padding:"45px 20px",fontFamily:"Arial,sans-serif"}}><section style={{background:"#fff",padding:25,borderRadius:15,maxWidth:650,margin:"auto",border:"1px solid #98b7c6"}}><h1 style={{color:"#173d59"}}>ENFRI.AR · Documentación del técnico</h1><p>No hay documentos compartidos para esta credencial.</p><Link href="/">Volver a Enfri.Ar</Link></section></main>;
 const docs=data.map(doc=>({tipo:doc.tipo,url:`/verificar-documentos/${id}/${doc.tipo}`}));
 return <main style={{minHeight:"100vh",background:"linear-gradient(135deg,#e4f5f8,#fff4e5)",padding:"45px 18px",fontFamily:"Arial,sans-serif"}}>
   <article style={{background:"#fff",borderRadius:18,padding:26,maxWidth:680,margin:"auto",border:"2px solid #87a6b7",boxShadow:"0 15px 32px rgba(19,58,76,.12)"}}>
    <p style={{fontSize:13,fontWeight:800,letterSpacing:2,color:"#147d8a"}}>ENFRI.AR REFRIGERACIÓN</p>
    <h1 style={{color:"#173d59"}}>Documentación del técnico</h1>
    <p style={{color:"#495965",lineHeight:1.5}}>A continuación se muestran únicamente los documentos que fueron autorizados para compartir. Podés consultar los documentos autorizados desde esta página.</p>
    <div style={{display:"grid",gap:12}}>{docs.map(doc=><section key={doc.tipo} style={{background:"#eaf5f8",padding:16,border:"1px solid #a2bfcc",borderRadius:12}}>
      <h2 style={{fontSize:18,margin:"0 0 9px",color:"#173d59"}}>{doc.tipo==="seguro"?"Seguro de trabajo":"Antecedentes penales"}</h2>
      {doc.url?<a href={doc.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"10px 15px",borderRadius:8,background:"#0d6476",color:"#fff",fontWeight:800,textDecoration:"none"}}>Ver documento PDF</a>:<span>No disponible temporalmente</span>}
    </section>)}</div>
    <p style={{fontSize:12,color:"#5c6b75",marginTop:20}}>Documentación proporcionada por Enfri.Ar. La presencia de un archivo no certifica su vigencia ni sustituye la verificación con el emisor.</p>
   </article>
 </main>;
}
