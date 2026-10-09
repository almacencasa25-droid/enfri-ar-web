"use client";

import { useEffect, useState } from "react";

export function RenacliPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("enfriar-renacli-popup-dismissed") === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      // Si el navegador bloquea el almacenamiento, el anuncio sigue funcionando.
    }
    const timer = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <aside role="complementary" aria-label="Invitación a matricularse en RENACLI" style={{
      position: "fixed", right: 16, bottom: 24, zIndex: 90, width: "min(350px, calc(100vw - 32px))",
      padding: "20px 20px 18px", borderRadius: 20, border: "1px solid rgba(255,255,255,.35)",
      background: "radial-gradient(circle at 95% 0%, #20b5d5 0%, transparent 48%), linear-gradient(145deg, #072d51 0%, #087eaf 100%)",
      color: "#fff", boxShadow: "0 16px 42px rgba(5, 45, 72, .28)",
      animation: "renacli-popup-enter .65s ease-out both"
    }}>
      <style>{`@keyframes renacli-popup-enter {from {transform:translateX(115%);opacity:0}to{transform:translateX(0);opacity:1}}@media (prefers-reduced-motion:reduce){aside[aria-label="Invitación a matricularse en RENACLI"]{animation:none!important}}`}</style>
      <button type="button" onClick={() => {
        setDismissed(true);
        try { window.localStorage.setItem("enfriar-renacli-popup-dismissed", "1"); } catch {}
      }} aria-label="Cerrar anuncio" style={{
        position: "absolute", top: 10, right: 12, border: "1px solid #ffffff70", background: "#ffffff18",
        borderRadius: 8, color: "white", fontSize: 20, width: 31, height: 31, cursor: "pointer"
      }}>×</button>
      <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:14}}>
        <div aria-label="Emblema R de RENACLI" style={{width:58,height:58,flexShrink:0,display:"grid",placeItems:"center",borderRadius:16,background:"linear-gradient(135deg,#ffffff,#c9f4ff)",border:"2px solid #ffffff",boxShadow:"0 5px 18px #002c5570",color:"#08638c",fontSize:39,fontWeight:950,lineHeight:1}}>R</div>
        <div>
          <div style={{fontWeight:950,fontSize:23,letterSpacing:".11em",lineHeight:1.1}}>RENACLI</div>
          <div style={{fontSize:10.5,letterSpacing:".07em",color:"#c9f2ff",marginTop:5,fontWeight:700}}>REGISTRO DE CLIMATIZACIÓN Y REFRIGERACIÓN</div>
        </div>
      </div>
      <div style={{display:"inline-block",padding:"5px 10px",borderRadius:999,background:"#f2c94c",color:"#143954",fontSize:11,fontWeight:900,letterSpacing:".08em"}}>MATRICULACIÓN PARA TÉCNICOS</div>
      <h2 style={{fontSize:23,lineHeight:1.15,margin:"12px 26px 10px 0",color:"#fff"}}>¡Dale valor a tu profesión!</h2>
      <p style={{fontSize:15,lineHeight:1.55,margin:"0 0 18px"}}>¿Trabajás en refrigeración o climatización? Conocé cómo solicitar tu matrícula RENACLI y tu credencial digital.</p>
      <a href="https://renacli.com.ar" target="_blank" rel="noopener noreferrer" style={{
        display:"block",textAlign:"center",padding:"12px 15px",borderRadius:11,
        background:"linear-gradient(90deg,#ffe27a,#ffc848)",color:"#123b59",fontWeight:900,textDecoration:"none"
      }}>QUIERO MATRICULARME ↗</a>
      <div style={{fontSize:11,opacity:.85,marginTop:11}}>Accedés al sitio oficial de RENACLI.</div>
    </aside>
  );
}
