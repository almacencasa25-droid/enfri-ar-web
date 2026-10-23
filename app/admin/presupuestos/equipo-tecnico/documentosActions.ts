"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "enfri-tecnico-documentos";
const MAX_BYTES = 8 * 1024 * 1024;
type Tipo = "seguro" | "antecedentes";
type Result = {ok:boolean;error?:string;url?:string};
const basePath = "/admin/presupuestos/equipo-tecnico";

async function adminContext(){
  await requireAdminUser();
  return createSupabaseServerClient();
}
export async function guardarDocumentoTecnico(form:FormData):Promise<Result>{
  const db=await adminContext();
  const id=String(form.get("tecnico_id")||"");
  const tipo=String(form.get("tipo")||"") as Tipo;
  const archivo=form.get("archivo");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["seguro","antecedentes"].includes(tipo))
    return {ok:false,error:"Técnico o tipo de documento inválido."};
  if(!(archivo instanceof File)||archivo.size===0||archivo.size>MAX_BYTES)
    return {ok:false,error:"Seleccioná un PDF de hasta 8 MB."};
  const bytes=new Uint8Array(await archivo.arrayBuffer());
  // Comprobación adicional de cabecera, no depender solo del MIME del navegador.
  if(new TextDecoder().decode(bytes.subarray(0,5))!=="%PDF-")
    return {ok:false,error:"El archivo debe ser un PDF válido."};
  const {data:tecnico,error:tecnicoError}=await db.from("tecnicos").select("id").eq("id",id).maybeSingle();
  if(tecnicoError||!tecnico)return {ok:false,error:"No se encontró el técnico."};
  const {data:previo}=await db.from("tecnico_documentos").select("archivo_path").eq("tecnico_id",id).eq("tipo",tipo).maybeSingle();
  const path=`documentos/${id}/${tipo}-${randomUUID()}.pdf`;
  const {error:uploadError}=await db.storage.from(BUCKET).upload(path,bytes,{contentType:"application/pdf",upsert:false});
  if(uploadError)return {ok:false,error:"No se pudo subir el documento. Verificá los permisos del almacenamiento."};
  const {error:saveError}=await db.from("tecnico_documentos").upsert({
    tecnico_id:id,tipo,archivo_path:path,nombre_archivo:archivo.name,
    updated_at:new Date().toISOString(),
    publicado:false,
  },{onConflict:"tecnico_id,tipo"});
  if(saveError){
    await db.storage.from(BUCKET).remove([path]);
    return {ok:false,error:"No se pudo asociar el documento al técnico."};
  }
  if(previo?.archivo_path)await db.storage.from(BUCKET).remove([previo.archivo_path]);
  revalidatePath(basePath);
  return {ok:true};
}
export async function quitarDocumentoTecnico(tecnicoId:string,tipo:Tipo):Promise<Result>{
  const db=await adminContext();
  const {data,error}=await db.from("tecnico_documentos").select("archivo_path").eq("tecnico_id",tecnicoId).eq("tipo",tipo).maybeSingle();
  if(error)return {ok:false,error:"No se pudo consultar el documento."};
  if(!data)return {ok:true};
  const {error:deleteError}=await db.from("tecnico_documentos").delete().eq("tecnico_id",tecnicoId).eq("tipo",tipo);
  if(deleteError)return {ok:false,error:"No se pudo quitar el documento."};
  await db.storage.from(BUCKET).remove([data.archivo_path]);
  revalidatePath(basePath);
  return {ok:true};
}
export async function verDocumentoTecnico(tecnicoId:string,tipo:Tipo):Promise<Result>{
  const db=await adminContext();
  const {data}=await db.from("tecnico_documentos").select("archivo_path").eq("tecnico_id",tecnicoId).eq("tipo",tipo).maybeSingle();
  if(!data)return {ok:false,error:"No hay documento cargado."};
  const {data:signed,error}=await db.storage.from(BUCKET).createSignedUrl(data.archivo_path,120);
  if(error||!signed?.signedUrl)return {ok:false,error:"No se pudo abrir el PDF."};
  return {ok:true,url:signed.signedUrl};
}

/** Publicar requiere acción expresa; antecedentes no se comparten por defecto. */
export async function publicarDocumentoTecnico(tecnicoId:string,tipo:Tipo,publicar:boolean,consentimiento:boolean):Promise<Result>{
  const db=await adminContext();
  if(!/^[0-9a-f-]{36}$/i.test(tecnicoId)||!["seguro","antecedentes"].includes(tipo))return {ok:false,error:"Datos inválidos."};
  if(publicar&&!consentimiento)return {ok:false,error:"Se requiere autorización expresa del técnico para compartir el PDF mediante QR."};
  const {data,error}=await db.from("tecnico_documentos").update({publicado:publicar}).eq("tecnico_id",tecnicoId).eq("tipo",tipo).select("id").maybeSingle();
  if(error||!data)return {ok:false,error:"No se pudo actualizar la visibilidad del documento."};
  revalidatePath(basePath);
  return {ok:true};
}
