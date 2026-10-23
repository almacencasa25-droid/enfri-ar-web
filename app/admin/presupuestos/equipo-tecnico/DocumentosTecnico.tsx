"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarDocumentoTecnico,quitarDocumentoTecnico,verDocumentoTecnico } from "./documentosActions";

type Doc={tipo:string;nombre_archivo:string;updated_at:string};
export default function DocumentosTecnico({id,documentos}:{id:string;documentos:Doc[]}){
 const router=useRouter(),[pending,start]=useTransition(),[message,setMessage]=useState("");
 const types=[{id:"seguro" as const,title:"Seguro de trabajo",hint:"Póliza o constancia de cobertura vigente"},{id:"antecedentes" as const,title:"Antecedentes penales",hint:"Documento sensible: acceso privado, solo administrador"}];
 const action=(cb:()=>Promise<{ok:boolean;error?:string;url?:string}>)=>start(async()=>{setMessage("");try{const res=await cb();if(!res.ok){setMessage(res.error||"No se pudo completar la operación.");return;}if(res.url){window.open(res.url,"_blank","noopener,noreferrer");return;}setMessage("Documento actualizado.");router.refresh();}catch{setMessage("Error de conexión. Intentá nuevamente.");}});
 return <details style={{width:"100%",marginTop:10,padding:12,border:"2px solid #94adb9",borderRadius:12,background:"#eff7fa"}}>
  <summary style={{cursor:"pointer",fontWeight:800,color:"#123b51"}}>📁 Documentación del técnico ({documentos.length})</summary>
  <p style={{fontSize:12,color:"#526674",lineHeight:1.5}}>Los PDF se guardan de forma privada. Solo un administrador puede abrirlos en esta etapa. No se publica información sensible automáticamente.</p>
  <div style={{display:"grid",gap:12}}>
   {types.map(t=>{const doc=documentos.find(d=>d.tipo===t.id);return <div key={t.id} style={{border:"1px solid #9bb3c0",borderRadius:10,padding:12,background:"#fff"}}>
    <strong>{t.title}</strong><p style={{fontSize:12,margin:"4px 0 10px",color:"#465969"}}>{t.hint}</p>
    {doc?<p style={{fontSize:13,color:"#166546"}}>✓ Cargado: {doc.nombre_archivo}</p>:<p style={{fontSize:13,color:"#6b7280"}}>Sin documento cargado</p>}
    <form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);form.set("tecnico_id",id);form.set("tipo",t.id);action(()=>guardarDocumentoTecnico(form));}} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <input aria-label={"Seleccionar "+t.title} name="archivo" type="file" accept="application/pdf,.pdf" required style={{maxWidth:"100%",padding:8,border:"2px solid #8ca9bb",borderRadius:8,background:"#e7f2f7"}}/>
      <button disabled={pending} type="submit" style={{padding:"10px 14px",background:"#10536d",color:"white",border:0,borderRadius:8,fontWeight:800,cursor:"pointer"}}>{doc?"Reemplazar PDF":"Cargar PDF"}</button>
      {doc&&<><button disabled={pending} type="button" onClick={()=>action(()=>verDocumentoTecnico(id,t.id))} style={{padding:"10px 14px",background:"#dcebf2",border:"1px solid #7396a7",borderRadius:8,fontWeight:800}}>Ver PDF</button><button disabled={pending} type="button" onClick={()=>{if(window.confirm("¿Eliminar este documento del técnico?"))action(()=>quitarDocumentoTecnico(id,t.id));}} style={{padding:"10px 14px",background:"#fbe7e6",color:"#921f1f",border:"1px solid #c98383",borderRadius:8,fontWeight:800}}>Eliminar</button></>}
    </form>
   </div>})}
  </div>
  {message&&<p role="status" style={{fontWeight:700,color:"#173d59"}}>{message}</p>}
 </details>;
}
