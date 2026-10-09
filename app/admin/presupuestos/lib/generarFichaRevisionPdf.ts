import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type PDFImage } from "pdf-lib";

type Empresa = { nombre: string; cuit: string; direccion: string; telefono: string; email: string };
export type GenerarFichaRevisionPdfInput = { numeroInicial: number; cantidad: number; empresa?: Partial<Empresa> };
const W=595.28, H=841.89, BLUE=rgb(.106,.318,.486), PALE=rgb(.918,.949,.969), DARK=rgb(.13,.13,.13), GREY=rgb(.44,.46,.48);
const DEFAULT: Empresa={nombre:"Enfri.Ar Refrigeración",cuit:"20-93431894-4",direccion:"Francia 2559, Moreno, Bs. As.",telefono:"11-3847-3222",email:"enfri.ar.refrigeracion@gmail.com"};
type C={p:PDFPage; f:PDFFont; b:PDFFont};
function text(c:C,s:string,x:number,y:number,size=10,bold=false,color=DARK){c.p.drawText(s,{x,y,size,font:bold?c.b:c.f,color});}
function line(c:C,x:number,y:number,x2:number,y2:number){c.p.drawLine({start:{x,y},end:{x:x2,y:y2},thickness:.65,color:GREY});}
function section(c:C,s:string,y:number){c.p.drawRectangle({x:46,y:y-5,width:503,height:21,color:PALE});text(c,s,52,y+1,10.3,true,BLUE);}
function field(c:C,s:string,y:number,x=50,end=546,size=10.2){text(c,s,x,y,size,true);const start=x+c.b.widthOfTextAtSize(s,size)+9;if(start<end)line(c,start,y-3,end,y-3);}
function checkbox(c:C,s:string,x:number,y:number){c.p.drawRectangle({x,y:y-2,width:11,height:11,borderColor:DARK,borderWidth:.9});text(c,s,x+17,y,10);}
function footer(c:C,page:number){c.p.drawRectangle({x:443,y:33,width:106,height:25,borderColor:BLUE,borderWidth:.7});text(c,(page===1?"ORIGINAL":"DUPLICADO")+" "+page+" DE 2",453,42,9,true,BLUE);}
function header(c:C,logo:PDFImage|null,page:number,numero:number,empresa:Empresa){
 if(logo){const scale=Math.min(164/logo.width,75/logo.height);c.p.drawImage(logo,{x:46,y:747,width:logo.width*scale,height:logo.height*scale});}
 else {text(c,"Enfri.Ar",46,789,17,true,BLUE);text(c,"Refrigeración",46,772,10);}
 if(page===1){const titles=["INFORME DE REVISIÓN TÉCNICA","Y BAJA DE EQUIPOS"];titles.forEach((s,i)=>text(c,s,379-c.b.widthOfTextAtSize(s,11)/2,797-i*20,11,true,BLUE));}
 // La numeración se calcula a partir del correlativo reservado por la aplicación.
 text(c,String(numero).padStart(6,"0"),505,798,10,true,BLUE);
 line(c,46,730,549,730);
 if(page===1){text(c,"EMPRESA: "+empresa.nombre,50,710,10.5,true);text(c,"CUIT: "+empresa.cuit,50,693,10);text(c,"Dirección: "+empresa.direccion,50,676,10);text(c,"Teléfono: "+empresa.telefono,50,659,10);text(c,"Email: "+empresa.email,50,642,10);}
}
function pageOne(c:C,empresa:Empresa,logo:PDFImage|null,numero:number){
 header(c,logo,1,numero,empresa);
 field(c,"Fecha:",620,50,246,11);field(c,"Hora:",620,283,548,11);
 field(c,"Cliente / Empresa:",594,50,546,11);
 field(c,"Dirección del establecimiento:",568,50,546,11);
 field(c,"Teléfono de contacto:",542,50,546,11);
 section(c,"IDENTIFICACIÓN DEL EQUIPO A REVISAR",506);
 field(c,"Tipo de equipo:",480,50,546,11);
 field(c,"Marca y modelo:",457,50,546,11);
 field(c,"Número de serie / Inventario:",434,50,546,11);
 field(c,"Tipo de gas refrigerante (si aplica):",411,50,546,11);
 section(c,"DETALLE DEL DIAGNÓSTICO TÉCNICO",379);
 text(c,"Marcar con una X los motivos detectados durante la revisión.",51,357,9.5);
 const checks=[
 ["Avería irreparable:","Daño crítico: motocompresor clavado, fugas inaccesibles en serpentina."],
 ["Obsolescencia tecnológica:","Equipo antiguo sin disponibilidad de repuestos legítimos en el mercado."],
 ["Antieconómico:","La reparación supera el valor operativo o presupuesto lógico del equipo."],
 ["Fin de vida útil / Desgaste generalizado:","Pérdida extrema de rendimiento y riesgo de fallas consecutivas."],
 ["Riesgo operativo / Seguridad:","Peligro eléctrico o estructural para el lugar."]
 ];
 checks.forEach(([title,desc],i)=>{const y=328-i*42;c.p.drawRectangle({x:52,y:y-2,width:11,height:11,borderColor:DARK,borderWidth:.9});text(c,title,72,y,10.5,true);text(c,desc,72,y-17,9.25);});
 text(c,"Descripción detallada del estado actual:",50,124,10.5,true);
 [104,84,64].forEach(y=>line(c,50,y,548,y));
 footer(c,1);
}
function pageTwo(c:C,logo:PDFImage|null,numero:number,empresa:Empresa){
 header(c,logo,2,numero,empresa);
 section(c,"CONCLUSIÓN TÉCNICA Y RECOMENDACIÓN DE BAJA",706);
 text(c,"Dictamen:",50,678,10.5,true);
 text(c,"El técnico firmante determina que el equipo detallado NO se encuentra apto",50,658,10);
 text(c,"para su funcionamiento seguro y eficiente, por lo que se recomienda",50,641,10);
 text(c,"formalmente su BAJA DEFINITIVA y retiro de servicio.",50,624,10,true);
 text(c,"Retiro de gas refrigerante para reciclado / destrucción:",50,593,10,true);
 checkbox(c,"Sí",66,571);checkbox(c,"No",160,571);checkbox(c,"No aplica",254,571);
 text(c,"Destino recomendado del equipo:",50,545,10,true);
 checkbox(c,"Desguace / Repuestos",66,523);checkbox(c,"Chatarra / Descarte",302,523);
 section(c,"FIRMAS Y CONFORMIDAD — TÉCNICO RESPONSABLE",485);
 field(c,"Nombre:",456,50,547);
 field(c,"Matrícula N.º:",429,50,288);
 field(c,"Firma y sello:",429,309,548);
 c.p.drawRectangle({x:48,y:307,width:501,height:87,color:PALE,borderColor:BLUE,borderWidth:.7});
 text(c,"IMPORTANTE — VALIDEZ DEL INFORME",60,375,10,true,BLUE);
 text(c,"Para su validación por Enfri.Ar Refrigeración, el informe debe presentarse",60,358,8.9);
 text(c,"en su ejemplar original en papel, con firma manuscrita y sello original",60,342,8.9,true);
 text(c,"del técnico responsable. Las fotografías, fotocopias y reproducciones",60,326,8.9);
 text(c,"digitales no se aceptan como originales para respaldar la baja del equipo.",60,312,8.55);
 section(c,"CONFORMIDAD Y RECEPCIÓN DEL CLIENTE",282);
 text(c,"El responsable del establecimiento declara haber recibido el presente",50,254,9.4);
 text(c,"informe técnico, quedando notificado del estado del equipo y aceptando",50,238,9.4);
 text(c,"la recomendación de baja operativa firmada por el técnico de Enfri.Ar.",50,222,9.4);
 field(c,"Firma del responsable:",191);
 field(c,"Aclaración:",166);
 field(c,"DNI / Cargo:",141);
 c.p.drawRectangle({x:48,y:70,width:501,height:54,color:PALE});
 text(c,"ESTE DOCUMENTO SIRVE COMO INFORME TÉCNICO DE RESPALDO",58,108,9,true,BLUE);
 text(c,"PARA JUSTIFICAR LA BAJA PATRIMONIAL, CONTABLE O EL REEMPLAZO",58,93,8.8,true,BLUE);
 text(c,"DEL ACTIVO ANTE EVENTUALES AUDITORÍAS O RECLAMOS.",58,78,8.8,true,BLUE);
 footer(c,2);
}
export async function generarFichaRevisionPdf(input:GenerarFichaRevisionPdfInput):Promise<Uint8Array>{
 const start=Number(input.numeroInicial),count=Number(input.cantidad);
 if(!Number.isSafeInteger(start)||start<=0)throw new Error("El número inicial no es válido.");
 if(!Number.isSafeInteger(count)||count<=0)throw new Error("La cantidad de fichas no es válida.");
 const empresa={...DEFAULT,...Object.fromEntries(Object.entries(input.empresa||{}).filter(([,v])=>typeof v==="string"&&v.trim()).map(([k,v])=>[k,(v as string).trim()]))} as Empresa;
 const pdf=await PDFDocument.create();
 const f=await pdf.embedFont(StandardFonts.Helvetica),b=await pdf.embedFont(StandardFonts.HelveticaBold);
 let logo:PDFImage|null=null;
 try{const bytes=await readFile(/* turbopackIgnore: true */path.join(process.cwd(),"public","logo-enfri-ar.png"));logo=await pdf.embedPng(bytes);}catch{}
 for(let i=0;i<count;i++){
  const p1=pdf.addPage([W,H]);pageOne({p:p1,f,b},empresa,logo,start+i);
  const p2=pdf.addPage([W,H]);pageTwo({p:p2,f,b},start+i,empresa);
 }
 return pdf.save();
}
