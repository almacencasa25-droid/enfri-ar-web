"use client";

import { useMemo, useState } from "react";
import TrabajoEditor from "./TrabajoEditor";

type Trabajo = { id:string; nombre_corto:string; detalle:string; categoria:string|null; tipo:string; precio_unitario:number|string; activo:boolean };

export default function ListaTrabajosBuscable({ trabajos }: { trabajos: Trabajo[] }) {
  const [busqueda, setBusqueda] = useState("");
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es-AR");
    if (!q) return trabajos;
    return trabajos
      .map((t) => {
        const nombre = t.nombre_corto.toLocaleLowerCase("es-AR");
        const categoria = (t.categoria || "").toLocaleLowerCase("es-AR");
        const detalle = t.detalle.toLocaleLowerCase("es-AR");

        let prioridad = 0;
        if (nombre === q) prioridad = 100;
        else if (nombre.startsWith(q)) prioridad = 80;
        else if (nombre.split(/\\s+/).some((palabra) => palabra.startsWith(q))) prioridad = 60;
        else if (nombre.includes(q)) prioridad = 40;
        else if (categoria.split(/\\s+/).some((palabra) => palabra.startsWith(q))) prioridad = 20;
        else if (detalle.split(/\\s+/).some((palabra) => palabra.startsWith(q))) prioridad = 10;

        return { t, prioridad };
      })
      .filter(({ prioridad }) => prioridad > 0)
      .sort((a, b) =>
        b.prioridad - a.prioridad ||
        a.t.nombre_corto.localeCompare(b.t.nombre_corto, "es-AR")
      )
      .map(({ t }) => t);
  }, [busqueda, trabajos]);

  return <>
    <div style={{marginBottom:"16px"}}>
      <label style={{display:"grid",gap:"6px",color:"var(--foreground)",fontSize:"0.88rem",fontWeight:800}}>
        Buscar trabajo
        <input type="search" value={busqueda} onChange={(e)=>setBusqueda(e.target.value)}
          placeholder="Ej.: preinstalación, limpieza, split..." autoComplete="off"
          style={{width:"100%",minHeight:"44px",boxSizing:"border-box",padding:"10px 12px",border:"1px solid rgba(38, 40, 42, 0.18)",borderRadius:"10px",background:"#ffffff",color:"var(--foreground)",font:"inherit"}} />
      </label>
      {busqueda ? <div style={{marginTop:"7px",color:"var(--muted)",fontSize:"0.82rem",fontWeight:700}}>{filtrados.length} resultado{filtrados.length===1?"":"s"}</div> : null}
    </div>

    {filtrados.length===0 ? <p style={{margin:0,color:"var(--muted)"}}>No se encontraron trabajos con esa búsqueda.</p> :
      <div style={{display:"grid",gap:"12px"}}>
        {filtrados.map((t)=>(
          <article key={t.id} style={{padding:"16px",border:"1px solid rgba(38, 40, 42, 0.1)",borderRadius:"13px",background:t.activo?"rgba(255, 255, 255, 0.7)":"rgba(38, 40, 42, 0.035)",opacity:t.activo?1:0.72}}>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:"10px"}}>
              <div style={{minWidth:0,flex:"1 1 300px"}}>
                <h3 style={{margin:"0 0 6px",color:"var(--foreground)",fontSize:"1rem"}}>{t.nombre_corto}</h3>
                <p style={{margin:0,color:"var(--muted)",lineHeight:1.5,overflowWrap:"anywhere"}}>{t.detalle}</p>
              </div>
              <strong style={{color:"var(--foreground)",whiteSpace:"nowrap"}}>$ {Number(t.precio_unitario).toLocaleString("es-AR")}</strong>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"12px",color:"var(--muted)",fontSize:"0.82rem"}}>
              <span>{t.categoria || "Sin categoría"}</span><span>·</span>
              <span>{t.tipo==="mano_obra"?"Mano de obra":t.tipo==="material"?"Material":"Otro"}</span><span>·</span>
              <strong style={{color:t.activo?"#236b43":"#8a4f1d"}}>{t.activo?"Activo":"Inactivo"}</strong>
            </div>
            <TrabajoEditor trabajo={t} />
          </article>
        ))}
      </div>}
  </>;
}
