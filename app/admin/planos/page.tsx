"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type View = "frente" | "superior";
type Kind = "ventana" | "puerta" | "aire" | "artefacto" | "toma" | "caja";
type Pipe = "liquido" | "succion" | "desague" | "electrica";
type Point = { x: number; y: number };
type Item = { id: string; kind: Kind; x: number; y: number; w: number; h: number; label: string };
type Line = { id: string; kind: Pipe; points: Point[] };
type Plan = { items: Item[]; lines: Line[] };
const blank = (): Plan => ({items:[],lines:[]});
const labels: Record<Kind,string> = { ventana:"Ventana",puerta:"Puerta",aire:"Equipo de aire",artefacto:"Artefacto",toma:"Tomacorriente",caja:"Caja de paso" };
const sizes: Record<Kind,[number,number]> = {ventana:[160,110],puerta:[110,235],aire:[175,78],artefacto:[100,90],toma:[48,48],caja:[55,55]};
const colors: Record<Pipe,string> = { liquido:"#e58e24",succion:"#2563eb",desague:"#059669",electrica:"#9333ea" };
const uid = () => Math.random().toString(36).slice(2,11);
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
function Diagram({plan, draft=[], selected=null, view, action, onClick}:{plan:Plan;draft?:Point[];selected?:string|null;view:View;action?: (e:React.MouseEvent<SVGSVGElement>)=>void;onClick?: never}) {
 return <svg viewBox="0 0 1000 600" onClick={action} style={{width:"100%",display:"block",touchAction:"manipulation",background:"#fff",cursor:action?"crosshair":"default",border:"1px solid #a9c7d0",borderRadius:8}}>
  <defs><pattern id="plano-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#d5e7eb" strokeWidth="1"/></pattern></defs>
  <rect width="1000" height="600" fill="url(#plano-grid)"/>
  <rect x="8" y="8" width="984" height="584" stroke="#17394b" strokeWidth="5" fill="none"/>
  {view==="superior"&&<rect x="25" y="25" width="950" height="550" stroke="#64748b" strokeWidth="8" fill="none"/>}
  {plan.lines.map(l=><polyline key={l.id} points={l.points.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={colors[l.kind]} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"/>)}
  {draft.length>0&&<polyline points={draft.map(p=>p.x+","+p.y).join(" ")} fill="none" stroke="#f97316" strokeWidth={5} strokeDasharray="12 8"/>}
  {plan.items.map(o=><g key={o.id} transform={`translate(${o.x},${o.y})`}>
   <rect width={o.w} height={o.h} rx={o.kind==="aire"?12:3} fill={o.kind==="aire"?"#cffafe":"#fff"} stroke={selected===o.id?"#f97316":"#157b91"} strokeWidth={selected===o.id?6:3}/>
   {o.kind==="ventana"&&<><line x1={o.w/2} y1="0" x2={o.w/2} y2={o.h} stroke="#157b91" strokeWidth="2"/><line x1="0" y1={o.h/2} x2={o.w} y2={o.h/2} stroke="#157b91" strokeWidth="2"/></>}
   {o.kind==="aire"&&<><rect x="14" y={o.h-23} width={o.w-28} height="11" rx="4" fill="#67e8f9"/><circle cx={o.w-20} cy="17" r="5" fill="#16a34a"/></>}
   {o.kind==="puerta"&&<circle cx={o.w-15} cy={o.h/2} r="5" fill="#92400e"/>}
   {o.kind==="toma"&&<circle cx={o.w/2} cy={o.h/2} r="15" fill="none" stroke="#475569" strokeWidth="3"/>}
   <text x={o.w/2} y={o.h+18} fill="#0f172a" fontSize="17" fontWeight="bold" textAnchor="middle">{o.label}</text>
  </g>)}
  <text x="20" y="579" fontSize="16" fill="#475569">ENFRI.AR · {view==="frente"?"VISTA FRONTAL":"VISTA SUPERIOR"} · Croquis esquemático</text>
 </svg>;
}
export default function PlanosPage(){
 const [view,setView]=useState<View>("frente");
 const [plans,setPlans]=useState<Record<View,Plan>>({frente:blank(),superior:blank()});
 const [tool,setTool]=useState<Kind|"trazar"|"seleccionar">("ventana");
 const [pipe,setPipe]=useState<Pipe>("liquido");
 const [draft,setDraft]=useState<Point[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [project,setProject]=useState("Plano de instalación");
 const [client,setClient]=useState("");
 const [width,setWidth]=useState(4);
 const [height,setHeight]=useState(2.8);
 const [depth,setDepth]=useState(3);
 const svgArea=useRef<HTMLDivElement>(null);
 const ready=useRef(false);
 useEffect(()=>{try{const value=localStorage.getItem("enfri-planos-v1");if(value){const a=JSON.parse(value);if(a.plans)setPlans(a.plans);if(a.project)setProject(a.project);if(a.client)setClient(a.client);if(a.width)setWidth(a.width);if(a.height)setHeight(a.height);if(a.depth)setDepth(a.depth);}}catch{} ready.current=true;},[]);
 useEffect(()=>{if(ready.current)localStorage.setItem("enfri-planos-v1",JSON.stringify({plans,project,client,width,height,depth}));},[plans,project,client,width,height,depth]);
 const plan=plans[view], picked=plan.items.find(i=>i.id===selected);
 function update(fn:(p:Plan)=>Plan){setPlans(old=>({...old,[view]:fn(old[view])}));}
 function click(e:React.MouseEvent<SVGSVGElement>){const r=e.currentTarget.getBoundingClientRect();const p={x:clamp(Math.round((e.clientX-r.left)/r.width*1000/10)*10,0,1000),y:clamp(Math.round((e.clientY-r.top)/r.height*600/10)*10,0,600)};
 if(tool==="trazar"){setDraft(d=>[...d,p]);return;}
 if(tool==="seleccionar"){const item=[...plan.items].reverse().find(i=>p.x>=i.x&&p.x<=i.x+i.w&&p.y>=i.y&&p.y<=i.y+i.h);setSelected(item?.id||null);return;}
 const [w,h]=sizes[tool];const item:Item={id:uid(),kind:tool,x:clamp(p.x-w/2,10,990-w),y:clamp(p.y-h/2,10,550-h),w,h,label:labels[tool]};update(z=>({...z,items:[...z.items,item]}));setSelected(item.id);
 }
 function finish(){if(draft.length>1)update(p=>({...p,lines:[...p.lines,{id:uid(),kind:pipe,points:draft}]}));setDraft([]);}
 function move(dx:number,dy:number){if(selected)update(p=>({...p,items:p.items.map(i=>i.id===selected?{...i,x:clamp(i.x+dx,10,990-i.w),y:clamp(i.y+dy,10,550-i.h)}:i)}));}
 function remove(){update(p=>({...p,items:p.items.filter(i=>i.id!==selected)}));setSelected(null);}
 function reset(){if(confirm("¿Limpiar la vista actual?")){update(()=>blank());setDraft([]);setSelected(null);}}
 function save(){const blob=new Blob([JSON.stringify({project,client,width,height,depth,plans},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="enfriar-plano.json";a.click();URL.revokeObjectURL(url);}
 async function load(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;try{const x=JSON.parse(await file.text());if(!x.plans?.frente||!x.plans?.superior)throw Error();setPlans(x.plans);setProject(x.project||"Plano de instalación");setClient(x.client||"");setWidth(x.width||4);setHeight(x.height||2.8);setDepth(x.depth||3);}catch{alert("El archivo no es un plano válido.");}e.target.value="";}
 const btn:React.CSSProperties={padding:"11px 15px",borderRadius:9,border:"1px solid #2f6474",background:"#16485a",color:"white",fontWeight:700,cursor:"pointer"};
 const field:React.CSSProperties={padding:"10px",border:"1px solid #b7d5dc",borderRadius:8,width:"100%",background:"white",color:"#17394b"};
 return <main style={{minHeight:"100vh",background:"#e9f7f7",color:"#17394b",padding:"22px 14px",fontFamily:"Arial,sans-serif"}}>
 <style>{`@media print { @page {size:A4 landscape;margin:10mm} body *{visibility:hidden!important} #enfri-print,#enfri-print *{visibility:visible!important} #enfri-print{display:block!important;position:absolute;top:0;left:0;width:100%;} .enfri-sheet{break-after:page;page-break-after:always;height:176mm;display:flex;flex-direction:column;justify-content:center} .enfri-sheet:last-child{break-after:auto;page-break-after:auto} } @media screen {#enfri-print{display:none}} `}</style>
 <div style={{maxWidth:1320,margin:"auto"}}>
 <header style={{background:"linear-gradient(110deg,#102d40,#087e87)",padding:22,borderRadius:18,color:"white",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
 <div><div style={{color:"#f9b44e",fontWeight:800,letterSpacing:2,fontSize:12}}>ENFRI.AR · HERRAMIENTA TÉCNICA</div><h1 style={{margin:"8px 0",fontSize:30}}>Planos de instalación</h1><div style={{color:"#c4eff0"}}>Croquis de paredes, equipos y recorrido de cañerías</div></div><Link href="/admin" style={{...btn,background:"#ffad42",border:0,color:"#152f3e",textDecoration:"none"}}>← Administrador</Link>
 </header>
 <section style={{background:"white",borderRadius:14,padding:15,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:14}}>
 <label>Nombre del plano<input style={field} value={project} onChange={e=>setProject(e.target.value)}/></label>
 <label>Cliente / obra<input style={field} value={client} onChange={e=>setClient(e.target.value)}/></label>
 <label>Ancho de pared (m)<input style={field} type="number" min=".1" step=".1" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label>
 <label>Alto (m)<input style={field} type="number" min=".1" step=".1" value={height} onChange={e=>setHeight(Number(e.target.value))}/></label>
 <label>Profundidad (m)<input style={field} type="number" min=".1" step=".1" value={depth} onChange={e=>setDepth(Number(e.target.value))}/></label>
 </section>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
 {(["frente","superior"] as View[]).map(v=><button key={v} style={{...btn,background:view===v?"#e88b1e":"#16485a",border:view===v?"2px solid #a65c07":"1px solid #16485a"}} onClick={()=>{setView(v);setDraft([]);setSelected(null);}}>{v==="frente"?"▣ Vista frontal":"▤ Vista desde arriba"}</button>)}
 <button style={btn} onClick={()=>window.print()}>Imprimir / Guardar PDF A4</button><button style={btn} onClick={save}>Guardar proyecto</button><label style={{...btn,display:"inline-block"}}>Abrir proyecto<input type="file" accept=".json,application/json" onChange={load} style={{display:"none"}}/></label>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"minmax(210px,260px) minmax(0,1fr)",gap:14,alignItems:"start"}}>
 <aside style={{background:"#12394c",color:"white",borderRadius:14,padding:16,display:"grid",gap:10}}>
 <strong style={{color:"#f9b44e"}}>ELEMENTOS</strong>
 {(["ventana","puerta","aire","artefacto","toma","caja","seleccionar","trazar"] as const).map(k=><button key={k} onClick={()=>{setTool(k);setSelected(null);setDraft([])}} style={{...btn,textAlign:"left",background:tool===k?"#f3ad43":"#22576b",color:tool===k?"#1b3441":"white"}}>{k==="seleccionar"?"Mover / editar":k==="trazar"?"Trazar cañería":labels[k]}</button>)}
 {tool==="trazar"&&<><select style={field} value={pipe} onChange={e=>setPipe(e.target.value as Pipe)}><option value="liquido">Cañería líquido</option><option value="succion">Cañería succión</option><option value="desague">Desagüe</option><option value="electrica">Eléctrica</option></select><button style={{...btn,background:"#15803d"}} onClick={finish}>Terminar recorrido</button><button style={btn} onClick={()=>setDraft([])}>Cancelar recorrido</button></>}
 <button style={{...btn,background:"#832f34"}} onClick={reset}>Limpiar esta vista</button>
 <div style={{fontSize:12,color:"#c9dce4",lineHeight:1.5}}>Elegí un elemento y hacé clic en el plano para agregarlo. Para seleccionar uno existente, elegí “Mover / editar” y hacé clic sobre él. Para trazar cañerías, marcá sucesivos puntos y finalizá el recorrido.</div>
 </aside>
 <section style={{background:"white",padding:14,borderRadius:14,minWidth:0}}>
 <h2 style={{margin:"0 0 10px"}}>{view==="frente"?"Elevación de pared":"Planta · vista superior"}</h2>
 <div ref={svgArea}><Diagram plan={plan} draft={draft} selected={selected} view={view} action={click}/></div>
 <p style={{fontSize:13,color:"#476779"}}>Cuadrícula orientativa · las dimensiones del croquis no representan escala de obra certificada.</p>
 {picked&&<section style={{padding:14,border:"1px solid #b5d3dd",background:"#e9f8fb",borderRadius:10}}>
 <h3 style={{marginTop:0}}>Editar elemento seleccionado</h3>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>
 <label>Nombre<input style={field} value={picked.label} onChange={e=>update(p=>({...p,items:p.items.map(i=>i.id===picked.id?{...i,label:e.target.value}:i)}))}/></label>
 {(["x","y","w","h"] as const).map(k=><label key={k}>{({x:"X",y:"Y",w:"Ancho",h:"Alto"})[k]}<input style={field} type="number" min="0" value={Math.round(picked[k])} onChange={e=>update(p=>({...p,items:p.items.map(i=>i.id===picked.id?{...i,[k]:Number(e.target.value)}:i)}))}/></label>)}
 </div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button style={btn} onClick={()=>move(-10,0)}>←</button><button style={btn} onClick={()=>move(0,-10)}>↑</button><button style={btn} onClick={()=>move(0,10)}>↓</button><button style={btn} onClick={()=>move(10,0)}>→</button><button style={{...btn,background:"#a22b35"}} onClick={remove}>Eliminar</button></div>
 </section>}
 <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:12,fontSize:13}}>{(Object.keys(colors) as Pipe[]).map(c=><span key={c}><span style={{display:"inline-block",width:20,height:5,background:colors[c],verticalAlign:"middle",marginRight:6}}/>{c}</span>)}</div>
 </section>
 </div>
 </div>
 <div id="enfri-print">{(["frente","superior"] as View[]).map((v,i)=><section className="enfri-sheet" key={v}><h2 style={{color:"#12394c",margin:"0 0 8px"}}>ENFRI.AR · {project}</h2><div style={{fontSize:13,marginBottom:8}}>Cliente: {client||"—"} · Medidas: {width} m × {height} m · Profundidad: {depth} m · Hoja {i+1}/2</div><h3 style={{margin:"0 0 8px"}}>{v==="frente"?"VISTA FRONTAL":"VISTA SUPERIOR"}</h3><Diagram plan={plans[v]} view={v}/><div style={{fontSize:12,marginTop:8}}>Referencias: naranja = líquido · azul = succión · verde = desagüe · violeta = eléctrica. Croquis orientativo, verificar medidas en obra.</div></section>)}</div>
 </main>;
}
