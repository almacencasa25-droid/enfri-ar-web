"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { quitarDocumentoTecnico,verDocumentoTecnico,publicarDocumentoTecnico } from "./documentosActions";

type Doc={tipo:string;nombre_archivo:string;updated_at:string;publicado:boolean};
export default function DocumentosTecnico({id,documentos}:{id:string;documentos:Doc[]}){
 const router=useRouter(),[pending,start]=useTransition(),[message,setMessage]=useState("");
 const [consent,setConsent]=useState<Record<string,boolean>>({});
 const [uploading,setUploading]=useState(false);
 async function subir(form:FormData,tipo:"seguro"|"antecedentes"){
  const archivo=form.get("archivo");
  if(!(archivo instanceof File)||!archivo.size){setMessage("Elegí un archivo PDF.");return;}
  if(archivo.size>10*1024*1024){setMessage("El PDF supera los 10 MB permitidos.");return;}
  if(!archivo.name.toLowerCase().endsWith(".pdf")){setMessage("Seleccioná un archivo PDF.");return;}
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key){setMessage("Falta configurar el almacenamiento.");return;}
  setMessage("Subiendo "+archivo.name+"…");
  setUploading(true);
  try{
   const db=createBrowserClient(url,key);
   const {data:{user},error:sessionError}=await db.auth.getUser();
   if(sessionError||!user)throw new Error("La sesión venció. Volvé a iniciar sesión en el administrador.");
   const {data:anterior,error:readError}=await db.from("tecnico_documentos").select("archivo_path").eq("tecnico_id",id).eq("tipo",tipo).maybeSingle();
   if(readError)throw new Error("No se pudo consultar la documentación: "+readError.message);
   const nombre="documentos/"+id+"/"+tipo+"-"+crypto.randomUUID()+".pdf";
   const {error:uploadError}=await db.storage.from("enfri-tecnico-documentos").upload(nombre,archivo,{contentType:"application/pdf",upsert:false});
   if(uploadError)throw new Error("Error al subir el PDF: "+uploadError.message);
   const {error:saveError}=await db.from("tecnico_documentos").upsert({tecnico_id:id,tipo,archivo_path:nombre,nombre_archivo:archivo.name,publicado:false,updated_at:new Date().toISOString()},{onConflict:"tecnico_id,tipo"});
   if(saveError){await db.storage.from("enfri-tecnico-documentos").remove([nombre]);throw new Error("No se pudo registrar el documento: "+saveError.message);}
   if(anterior?.archivo_path)await db.storage.from("enfri-tecnico-documentos").remove([anterior.archivo_path]);
   setMessage("PDF cargado correctamente. Ahora podés autorizarlo para el QR si corresponde.");
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo subir el PDF.");}
  finally{setUploading(false);}
 }

 const types=[{id:"seguro" as const,title:"Seguro de trabajo",hint:"Póliza o constancia de cobertura vigente"},{id:"antecedentes" as const,title:"Antecedentes penales",hint:"Documento sensible: acceso privado, solo administrador"}];
 const action=(cb:()=>Promise<{ok:boolean;error?:string;url?:string}>)=>start(async()=>{setMessage("");try{const res=await cb();if(!res.ok){setMessage(res.error||"No se pudo completar la operación.");return;}if(res.url){window.open(res.url,"_blank","noopener,noreferrer");return;}setMessage("Documento actualizado.");router.refresh();}catch{setMessage("Error de conexión. Intentá nuevamente.");}});
 return <details style={{width:"100%",marginTop:10,padding:12,border:"2px solid #94adb9",borderRadius:12,background:"#eff7fa"}}>
  <summary style={{cursor:"pointer",fontWeight:800,color:"#123b51"}}>📁 Documentación del técnico ({documentos.length})</summary>
  <p style={{fontSize:12,color:"#526674",lineHeight:1.5}}>Los PDF se guardan de forma privada. El acceso es privado por defecto. Para incluir un PDF en la consulta del QR, autorizá expresamente su publicación. Los antecedentes penales son datos sensibles.</p>
  <div style={{display:"grid",gap:12}}>
   {types.map(t=>{const doc=documentos.find(d=>d.tipo===t.id);return <div key={t.id} style={{border:"1px solid #9bb3c0",borderRadius:10,padding:12,background:"#fff"}}>
    <strong>{t.title}</strong><p style={{fontSize:12,margin:"4px 0 10px",color:"#465969"}}>{t.hint}</p>
    {doc?<p style={{fontSize:13,color:"#166546"}}>✓ Cargado: {doc.nombre_archivo}</p>:<p style={{fontSize:13,color:"#6b7280"}}>Sin documento cargado</p>}
    <form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);form.set("tecnico_id",id);form.set("tipo",t.id);void subir(form,t.id);}} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <input aria-label={"Seleccionar "+t.title} name="archivo" type="file" accept="application/pdf,.pdf" required style={{maxWidth:"100%",padding:8,border:"2px solid #8ca9bb",borderRadius:8,background:"#e7f2f7"}}/>
      <button disabled={pending||uploading} type="submit" style={{padding:"10px 14px",background:"#10536d",color:"white",border:0,borderRadius:8,fontWeight:800,cursor:"pointer"}}>{uploading?"Subiendo PDF…":doc?"Reemplazar PDF":"Cargar PDF"}</button>
      {doc&&<div style={{flexBasis:"100%",padding:10,border:"1px solid #bfd2dc",borderRadius:8,background:doc.publicado?"#e7f8ed":"#f3f5f7"}}>
      <div style={{fontWeight:800,color:doc.publicado?"#176239":"#576577"}}>{doc.publicado?"Visible mediante QR":"Privado: no se muestra en el QR"}</div>
      {!doc.publicado&&<label style={{display:"flex",gap:7,alignItems:"flex-start",fontSize:12,marginTop:7}}><input type="checkbox" checked={!!consent[t.id]} onChange={e=>setConsent(s=>({...s,[t.id]:e.target.checked}))}/>Confirmo que tengo la autorización expresa del técnico para compartir este documento con cualquiera que escanee el QR.</label>}
      <button type="button" disabled={pending||(!doc.publicado&&!consent[t.id])} onClick={()=>action(()=>publicarDocumentoTecnico(id,t.id,!doc.publicado,!!consent[t.id]))} style={{padding:"8px 12px",borderRadius:8,marginTop:8,border:"1px solid #6d90a0",background:doc.publicado?"#ffebeb":"#e5f3f9",fontWeight:800,cursor:"pointer"}}>
       {doc.publicado?"Quitar del QR":"Autorizar publicación en QR"}
      </button>
    </div>}{doc&&<><button disabled={pending} type="button" onClick={()=>action(()=>verDocumentoTecnico(id,t.id))} style={{padding:"10px 14px",background:"#dcebf2",border:"1px solid #7396a7",borderRadius:8,fontWeight:800}}>Ver PDF</button><button disabled={pending} type="button" onClick={()=>{if(window.confirm("¿Eliminar este documento del técnico?"))action(()=>quitarDocumentoTecnico(id,t.id));}} style={{padding:"10px 14px",background:"#fbe7e6",color:"#921f1f",border:"1px solid #c98383",borderRadius:8,fontWeight:800}}>Eliminar</button></>}
    </form>
   </div>})}
  </div>
  {message&&<p role="status" style={{fontWeight:700,color:"#173d59"}}>{message}</p>}
 </details>;
}
