"use client";

import { useState } from "react";

type TecnicoCredencial = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  numero_matricula: string;
  vencimiento_matricula: string | null;
  especialidad: string | null;
  estado: string;
  fotoUrl?: string | null;
};

type Props = {
  tecnico: TecnicoCredencial;
  tieneDocumentosPublicados?: boolean;
};

const ANCHO = 1080;
const ALTO = 675;

function formatearFecha(fecha: string | null) {
  if (!fecha) {
    return "Sin vencimiento";
  }

  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function textoEstado(estado: string) {
  if (estado === "disponible") {
    return "Disponible";
  }

  if (estado === "no_disponible") {
    return "No disponible";
  }

  if (estado === "inactivo") {
    return "Inactivo";
  }

  return estado;
}

function colorEstado(estado: string) {
  if (estado === "disponible") {
    return "#1f7a4d";
  }

  if (estado === "no_disponible") {
    return "#a2611d";
  }

  return "#9b2c2c";
}

function redondearRectangulo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
}

async function cargarImagen(
  url: string
): Promise<HTMLImageElement> {
  const respuesta = await fetch(url, {
    cache: "no-store",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar una imagen.");
  }

  const blob = await respuesta.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const imagen = new Image();

    await new Promise<void>((resolve, reject) => {
      imagen.onload = () => resolve();

      imagen.onerror = () => {
        reject(
          new Error("No se pudo procesar una imagen.")
        );
      };

      imagen.src = objectUrl;
    });

    return imagen;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function dibujarImagenCubierta(
  ctx: CanvasRenderingContext2D,
  imagen: HTMLImageElement,
  x: number,
  y: number,
  ancho: number,
  alto: number
) {
  const relacionDestino = ancho / alto;

  const relacionImagen =
    imagen.naturalWidth / imagen.naturalHeight;

  let sx = 0;
  let sy = 0;
  let sw = imagen.naturalWidth;
  let sh = imagen.naturalHeight;

  if (relacionImagen > relacionDestino) {
    sw =
      imagen.naturalHeight *
      relacionDestino;

    sx =
      (imagen.naturalWidth - sw) / 2;
  } else {
    sh =
      imagen.naturalWidth /
      relacionDestino;

    sy =
      (imagen.naturalHeight - sh) / 2;
  }

  ctx.drawImage(
    imagen,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    ancho,
    alto
  );
}

export default function CredencialTecnico({
  tecnico,
  tieneDocumentosPublicados = false,
}: Props) {
  const [generando, setGenerando] =
    useState(false);
  const [mostrarMatricula, setMostrarMatricula] = useState(Boolean(tecnico.numero_matricula?.trim()));

  const [error, setError] =
    useState("");

  const [
    eligiendoFormato,
    setEligiendoFormato,
  ] = useState(false);

  function decorarFondo(ctx: CanvasRenderingContext2D, ancho: number, alto: number) {
    ctx.save();
    const ola = ctx.createLinearGradient(0, 0, ancho, alto);
    ola.addColorStop(0, "rgba(23,109,162,0.19)");
    ola.addColorStop(1, "rgba(86,194,224,0.04)");
    ctx.fillStyle = ola;
    ctx.beginPath();
    ctx.moveTo(0, alto * 0.30);
    ctx.bezierCurveTo(ancho * 0.28, alto * 0.08, ancho * 0.62, alto * 0.48, ancho, alto * 0.14);
    ctx.lineTo(ancho, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(23,109,162,0.15)";
    ctx.lineWidth = Math.max(3, ancho * 0.006);
    for (let n = 0; n < 3; n++) {
      ctx.beginPath();
      ctx.moveTo(0, alto * (0.69 + n * 0.045));
      ctx.bezierCurveTo(ancho * 0.3, alto * (0.59 + n * 0.045), ancho * 0.63, alto * (0.85 + n * 0.03), ancho, alto * (0.67 + n * 0.045));
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(239,140,47,0.24)";
    ctx.lineWidth = Math.max(2, ancho * 0.003);
    ctx.beginPath();
    ctx.arc(ancho * 0.92, alto * 0.10, ancho * 0.17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  async function dibujarLogo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    anchoLogo: number
  ) {
    try {
      const logo = await cargarImagen(
        "/logo-enfri-ar.png"
      );

      const altoLogo =
        anchoLogo *
        (logo.naturalHeight /
          logo.naturalWidth);

      ctx.drawImage(
        logo,
        x,
        y,
        anchoLogo,
        altoLogo
      );
    } catch {
      ctx.fillStyle = "#173d59";
      ctx.font =
        "700 42px Arial, sans-serif";

      ctx.fillText(
        "Enfri.Ar",
        x,
        y + 50
      );
    }
  }

  async function dibujarFoto(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ancho: number,
    alto: number,
    radio: number
  ) {
    ctx.save();

    redondearRectangulo(
      ctx,
      x,
      y,
      ancho,
      alto,
      radio
    );

    ctx.clip();

    ctx.fillStyle = "#e8edf0";

    ctx.fillRect(
      x,
      y,
      ancho,
      alto
    );

    if (tecnico.fotoUrl) {
      try {
        const foto =
          await cargarImagen(
            tecnico.fotoUrl
          );

        dibujarImagenCubierta(
          ctx,
          foto,
          x,
          y,
          ancho,
          alto
        );
      } catch {
        ctx.fillStyle = "#69757e";
        ctx.font =
          "700 24px Arial, sans-serif";
        ctx.textAlign = "center";

        ctx.fillText(
          "SIN FOTO",
          x + ancho / 2,
          y + alto / 2
        );

        ctx.textAlign = "left";
      }
    } else {
      ctx.fillStyle = "#69757e";
      ctx.font =
        "700 24px Arial, sans-serif";
      ctx.textAlign = "center";

      ctx.fillText(
        "SIN FOTO",
        x + ancho / 2,
        y + alto / 2
      );

      ctx.textAlign = "left";
    }

    ctx.restore();

    ctx.strokeStyle =
      "rgba(23, 61, 89, 0.20)";

    ctx.lineWidth = 3;

    redondearRectangulo(
      ctx,
      x,
      y,
      ancho,
      alto,
      radio
    );

    ctx.stroke();
  }

  function descargarCanvas(
    canvas: HTMLCanvasElement,
    formato: "carnet" | "celular"
  ) {
    const nombreArchivo = [
      "credencial",
      formato,
      tecnico.apellido,
      tecnico.nombre,
      mostrarMatricula ? tecnico.numero_matricula : "sin-matricula",
    ]
      .join("-")
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      );

    const enlace =
      document.createElement("a");

    enlace.download =
      `${nombreArchivo}.jpg`;

    enlace.href =
      canvas.toDataURL(
        "image/jpeg",
        0.94
      );

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();
  }

  async function dibujarQrDocumentos(ctx:CanvasRenderingContext2D,x:number,y:number,size:number) {
    if (!tieneDocumentosPublicados) return;
    const imagen=await cargarImagen("/api/tecnico-qr?id="+encodeURIComponent(tecnico.id));
    ctx.fillStyle="#ffffff";
    ctx.fillRect(x-5,y-5,size+10,size+10);
    ctx.drawImage(imagen,x,y,size,size);
    ctx.fillStyle="#173d59";
    ctx.textAlign="center";
    ctx.font="700 15px Arial, sans-serif";
    ctx.fillText("DOCUMENTACIÓN",x+size/2,y+size+21);
    ctx.textAlign="left";
  }

  async function generarCarnet() {
    const canvas =
      document.createElement("canvas");

    canvas.width = ANCHO;
    canvas.height = ALTO;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "El navegador no pudo generar la credencial."
      );
    }

    ctx.fillStyle = "#f8fbfd";
    ctx.fillRect(0, 0, ANCHO, ALTO);

    const degradado =
      ctx.createLinearGradient(
        0,
        0,
        ANCHO,
        ALTO
      );

    degradado.addColorStop(
      0,
      "#eef8ff"
    );

    degradado.addColorStop(
      0.52,
      "#ffffff"
    );

    degradado.addColorStop(
      1,
      "#fff4e8"
    );

    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    ctx.fillStyle = "#176da2";
    ctx.fillRect(0, 0, ANCHO, 18);

    ctx.fillStyle = "#ef8c2f";
    ctx.fillRect(
      760,
      ALTO - 18,
      320,
      18
    );

    ctx.fillStyle =
      "rgba(23, 109, 162, 0.08)";

    ctx.beginPath();
    ctx.arc(
      80,
      80,
      230,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle =
      "rgba(239, 140, 47, 0.08)";

    ctx.beginPath();
    ctx.arc(
      ANCHO - 40,
      ALTO + 10,
      270,
      0,
      Math.PI * 2
    );
    ctx.fill();

    decorarFondo(ctx, ANCHO, ALTO);

    await dibujarLogo(
      ctx,
      54,
      42,
      250
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 30px Arial, sans-serif";
    ctx.textAlign = "right";

    ctx.fillText(
      "SERVICIO TÉCNICO",
      ANCHO - 54,
      75
    );

    ctx.fillStyle = "#66727c";
    ctx.font =
      "500 21px Arial, sans-serif";

    ctx.fillText(
      "Enfri.Ar Refrigeración",
      ANCHO - 54,
      108
    );

    ctx.textAlign = "left";

    const fotoX = 55;
    const fotoY = 154;
    const fotoAncho = 290;
    const fotoAlto = 365;

    await dibujarFoto(
      ctx,
      fotoX,
      fotoY,
      fotoAncho,
      fotoAlto,
      28
    );

    const contenidoX = 390;

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 45px Arial, sans-serif";

    ctx.fillText(
      `${tecnico.nombre} ${tecnico.apellido}`,
      contenidoX,
      220
    );

    ctx.fillStyle = "#176da2";
    ctx.font =
      "700 23px Arial, sans-serif";

    ctx.fillText(
      "TÉCNICO",
      contenidoX,
      263
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 20px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      "Matrícula",
      contenidoX,
      320
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 30px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      tecnico.numero_matricula,
      contenidoX,
      356
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 20px Arial, sans-serif";

    ctx.fillText(
      "Especialidad",
      contenidoX,
      407
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 25px Arial, sans-serif";

    ctx.fillText(
      tecnico.especialidad ||
        "Refrigeración y climatización",
      contenidoX,
      442
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 20px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      "Vencimiento",
      contenidoX,
      493
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 24px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      formatearFecha(
        tecnico.vencimiento_matricula
      ),
      contenidoX,
      528
    );

    const vigente = Boolean(tecnico.numero_matricula?.trim()) &&
      Boolean(tecnico.vencimiento_matricula) &&
      tecnico.vencimiento_matricula!.slice(0, 10) >= new Date().toISOString().slice(0, 10);
    const estado = vigente ? "VIGENTE" : "VENCIDA";
    ctx.fillStyle = vigente ? "#187448" : "#a32626";

    redondearRectangulo(
      ctx,
      765,
      303,
      215,
      52,
      26
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "700 21px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      estado,
      872.5,
      336
    );

    ctx.textAlign = "left";

    ctx.fillStyle = "#65717a";
    ctx.font = "500 19px Arial, sans-serif";
    ctx.fillText("Documento (DNI)", contenidoX, 557);
    ctx.fillStyle = "#173d59";
    ctx.font = "700 25px Arial, sans-serif";
    ctx.fillText(tecnico.dni?.trim() || "No registrado", contenidoX, 591);

    ctx.strokeStyle =
      "rgba(23, 61, 89, 0.12)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(
      55,
      615
    );

    ctx.lineTo(
      ANCHO - 55,
      615
    );

    ctx.stroke();

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 17px Arial, sans-serif";

    ctx.fillText(
      "Credencial interna de técnico",
      55,
      650
    );

    ctx.textAlign = "right";

    ctx.fillText(
      "www.enfriar.com.ar",
      ANCHO - 55,
      650
    );

    ctx.textAlign = "left";
    await dibujarQrDocumentos(ctx,822,463,174);

    descargarCanvas(
      canvas,
      "carnet"
    );
  }

  async function generarCelular() {
    const ancho = 675;
    const alto = 1080;

    const canvas =
      document.createElement("canvas");

    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "El navegador no pudo generar la credencial."
      );
    }

    const degradado =
      ctx.createLinearGradient(
        0,
        0,
        ancho,
        alto
      );

    degradado.addColorStop(
      0,
      "#eef8ff"
    );

    degradado.addColorStop(
      0.55,
      "#ffffff"
    );

    degradado.addColorStop(
      1,
      "#fff4e8"
    );

    ctx.fillStyle = degradado;
    ctx.fillRect(
      0,
      0,
      ancho,
      alto
    );

    ctx.fillStyle = "#176da2";
    ctx.fillRect(
      0,
      0,
      ancho,
      16
    );

    ctx.fillStyle = "#ef8c2f";
    ctx.fillRect(
      ancho - 210,
      alto - 16,
      210,
      16
    );

    ctx.fillStyle =
      "rgba(23, 109, 162, 0.08)";
    ctx.beginPath();
    ctx.arc(
      40,
      70,
      180,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle =
      "rgba(239, 140, 47, 0.08)";
    ctx.beginPath();
    ctx.arc(
      ancho - 10,
      alto - 10,
      220,
      0,
      Math.PI * 2
    );
    ctx.fill();

    decorarFondo(ctx, ancho, alto);

    await dibujarLogo(
      ctx,
      38,
      42,
      210
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 27px Arial, sans-serif";
    ctx.textAlign = "right";

    ctx.fillText(
      "SERVICIO TÉCNICO",
      ancho - 38,
      78
    );

    ctx.fillStyle = "#66727c";
    ctx.font =
      "500 18px Arial, sans-serif";

    ctx.fillText(
      "Enfri.Ar Refrigeración",
      ancho - 38,
      108
    );

    ctx.textAlign = "left";

    const fotoAncho = 290;
    const fotoAlto = 350;
    const fotoX =
      (ancho - fotoAncho) / 2;
    const fotoY = 140;

    await dibujarFoto(
      ctx,
      fotoX,
      fotoY,
      fotoAncho,
      fotoAlto,
      28
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 38px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      `${tecnico.nombre} ${tecnico.apellido}`,
      ancho / 2,
      548
    );

    ctx.fillStyle = "#176da2";
    ctx.font =
      "700 21px Arial, sans-serif";

    ctx.fillText(
      "TÉCNICO",
      ancho / 2,
      585
    );

    ctx.textAlign = "left";

    const contenidoX = 70;

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 19px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      "Matrícula",
      contenidoX,
      640
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 29px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      tecnico.numero_matricula,
      contenidoX,
      676
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 19px Arial, sans-serif";

    ctx.fillText(
      "Especialidad",
      contenidoX,
      732
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 23px Arial, sans-serif";

    ctx.fillText(
      tecnico.especialidad ||
        "Refrigeración y climatización",
      contenidoX,
      767
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 19px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      "Vencimiento",
      contenidoX,
      823
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 23px Arial, sans-serif";

    if (mostrarMatricula) ctx.fillText(
      formatearFecha(
        tecnico.vencimiento_matricula
      ),
      contenidoX,
      858
    );

    const vigente = Boolean(tecnico.numero_matricula?.trim()) &&
      Boolean(tecnico.vencimiento_matricula) &&
      tecnico.vencimiento_matricula!.slice(0, 10) >= new Date().toISOString().slice(0, 10);
    const estado = vigente ? "VIGENTE" : "VENCIDA";
    ctx.fillStyle = vigente ? "#187448" : "#a32626";

    redondearRectangulo(
      ctx,
      ancho - 235,
      630,
      180,
      52,
      26
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "700 20px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      estado,
      ancho - 145,
      664
    );

    ctx.fillStyle = "#65717a";
    ctx.font = "500 19px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Documento (DNI)", contenidoX, 900);
    ctx.fillStyle = "#173d59";
    ctx.font = "700 25px Arial, sans-serif";
    ctx.fillText(tecnico.dni?.trim() || "No registrado", contenidoX, 934);

    ctx.strokeStyle =
      "rgba(23, 61, 89, 0.12)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(
      55,
      960
    );

    ctx.lineTo(
      ancho - 55,
      960
    );

    ctx.stroke();

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 16px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      "Credencial interna de técnico",
      ancho / 2,
      1000
    );

    ctx.fillText(
      "www.enfriar.com.ar",
      ancho / 2,
      1035
    );

    ctx.textAlign = "left";
    await dibujarQrDocumentos(ctx,470,870,158);

    descargarCanvas(
      canvas,
      "celular"
    );
  }

  async function generarCredencial(
    formato: "carnet" | "celular"
  ) {
    setError("");
    setGenerando(true);
    setEligiendoFormato(false);

    try {
      if (formato === "carnet") {
        await generarCarnet();
      } else {
        await generarCelular();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo generar la credencial."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "7px",
      }}
    >
      {!eligiendoFormato ? (
        <button
          type="button"
          onClick={() =>
            setEligiendoFormato(true)
          }
          disabled={generando}
          style={{
            minHeight: "40px",
            padding: "8px 13px",
            border:
              "1px solid rgba(38, 40, 42, 0.16)",
            borderRadius: "9px",
            background: "#173d59",
            color: "#ffffff",
            font: "inherit",
            fontSize: "0.84rem",
            fontWeight: 800,
            cursor: generando
              ? "wait"
              : "pointer",
            opacity: generando
              ? 0.65
              : 1,
          }}
        >
          {generando
            ? "Generando..."
            : "Generar credencial JPG"}
        </button>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "8px",
            padding: "10px",
            border:
              "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius: "10px",
            background:
              "rgba(255,255,255,0.72)",
          }}
        >
          <strong
            style={{
              fontSize: "0.82rem",
            }}
          >
            Elegí el formato de la credencial
          </strong>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700, color: "#173d59" }}>
            <input type="checkbox" checked={mostrarMatricula} disabled={!tecnico.numero_matricula?.trim() || generando} onChange={(event) => setMostrarMatricula(event.target.checked)} />
            Mostrar matrícula y vencimiento en la credencial
          </label>
          <span style={{fontSize:"0.76rem",color:"#64748b"}}>Desmarcá esta opción si el técnico trabaja bajo la responsabilidad de ENFRI.AR y no tiene matrícula propia.</span>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <button
              type="button"
              disabled={generando}
              onClick={() =>
                void generarCredencial(
                  "carnet"
                )
              }
              style={{
                minHeight: "38px",
                padding: "7px 12px",
                border:
                  "1px solid rgba(38, 40, 42, 0.16)",
                borderRadius: "9px",
                background: "#173d59",
                color: "#ffffff",
                font: "inherit",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Carnet
            </button>

            <button
              type="button"
              disabled={generando}
              onClick={() =>
                void generarCredencial(
                  "celular"
                )
              }
              style={{
                minHeight: "38px",
                padding: "7px 12px",
                border:
                  "1px solid rgba(23, 109, 162, 0.30)",
                borderRadius: "9px",
                background:
                  "rgba(23, 109, 162, 0.08)",
                color: "#176da2",
                font: "inherit",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Celular
            </button>

            <button
              type="button"
              disabled={generando}
              onClick={() =>
                setEligiendoFormato(false)
              }
              style={{
                minHeight: "38px",
                padding: "7px 12px",
                border:
                  "1px solid rgba(38, 40, 42, 0.16)",
                borderRadius: "9px",
                background: "#ffffff",
                color:
                  "var(--foreground)",
                font: "inherit",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error ? (
        <span
          style={{
            color: "#982828",
            fontSize: "0.78rem",
            fontWeight: 800,
          }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
