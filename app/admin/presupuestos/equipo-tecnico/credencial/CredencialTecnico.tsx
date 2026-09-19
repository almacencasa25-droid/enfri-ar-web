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
}: Props) {
  const [generando, setGenerando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    eligiendoFormato,
    setEligiendoFormato,
  ] = useState(false);

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
      tecnico.numero_matricula,
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
      "CREDENCIAL TÉCNICA",
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
    const fotoY = 180;
    const fotoAncho = 260;
    const fotoAlto = 330;

    await dibujarFoto(
      ctx,
      fotoX,
      fotoY,
      fotoAncho,
      fotoAlto,
      28
    );

    const contenidoX = 365;

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
      "600 18px Arial, sans-serif";

    ctx.fillText(
      "SERVICIO TÉCNICO",
      contenidoX,
      292
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 20px Arial, sans-serif";

    ctx.fillText(
      "Matrícula",
      contenidoX,
      320
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 30px Arial, sans-serif";

    ctx.fillText(
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

    ctx.fillText(
      "Vencimiento",
      contenidoX,
      493
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 24px Arial, sans-serif";

    ctx.fillText(
      formatearFecha(
        tecnico.vencimiento_matricula
      ),
      contenidoX,
      528
    );

    const estado =
      textoEstado(tecnico.estado);

    ctx.fillStyle =
      colorEstado(tecnico.estado);

    redondearRectangulo(
      ctx,
      765,
      482,
      250,
      58,
      29
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "700 21px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      estado,
      890,
      519
    );

    ctx.textAlign = "left";

    ctx.strokeStyle =
      "rgba(23, 61, 89, 0.12)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(
      55,
      570
    );

    ctx.lineTo(
      ANCHO - 55,
      570
    );

    ctx.stroke();

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 17px Arial, sans-serif";

    ctx.fillText(
      "Credencial interna de técnico",
      55,
      612
    );

    ctx.textAlign = "right";

    ctx.fillText(
      "www.enfriar.com.ar",
      ANCHO - 55,
      612
    );

    ctx.textAlign = "left";

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
      "CREDENCIAL TÉCNICA",
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

    const fotoAncho = 250;
    const fotoAlto = 315;
    const fotoX =
      (ancho - fotoAncho) / 2;
    const fotoY = 155;

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
      535
    );

    ctx.fillStyle = "#176da2";
    ctx.font =
      "700 21px Arial, sans-serif";

    ctx.fillText(
      "TÉCNICO",
      ancho / 2,
      575
    );

    ctx.fillStyle = "#65717a";
    ctx.font =
      "600 17px Arial, sans-serif";

    ctx.fillText(
      "SERVICIO TÉCNICO",
      ancho / 2,
      605
    );

    ctx.textAlign = "left";

    const contenidoX = 70;

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 19px Arial, sans-serif";

    ctx.fillText(
      "Matrícula",
      contenidoX,
      640
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 29px Arial, sans-serif";

    ctx.fillText(
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

    ctx.fillText(
      "Vencimiento",
      contenidoX,
      823
    );

    ctx.fillStyle = "#173d59";
    ctx.font =
      "700 23px Arial, sans-serif";

    ctx.fillText(
      formatearFecha(
        tecnico.vencimiento_matricula
      ),
      contenidoX,
      858
    );

    const estado =
      textoEstado(tecnico.estado);

    ctx.fillStyle =
      colorEstado(tecnico.estado);

    redondearRectangulo(
      ctx,
      ancho - 285,
      805,
      215,
      58,
      29
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font =
      "700 20px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      estado,
      ancho - 177.5,
      842
    );

    ctx.strokeStyle =
      "rgba(23, 61, 89, 0.12)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(
      55,
      925
    );

    ctx.lineTo(
      ancho - 55,
      925
    );

    ctx.stroke();

    ctx.fillStyle = "#65717a";
    ctx.font =
      "500 16px Arial, sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      "Credencial interna de técnico",
      ancho / 2,
      972
    );

    ctx.fillText(
      "www.enfriar.com.ar",
      ancho / 2,
      1008
    );

    ctx.textAlign = "left";

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
