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

  async function generarCredencial() {
    setError("");
    setGenerando(true);

    try {
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

      try {
        const logo = await cargarImagen(
          "/logo-enfri-ar.png"
        );

        const anchoLogo = 250;

        const altoLogo =
          anchoLogo *
          (logo.naturalHeight /
            logo.naturalWidth);

        ctx.drawImage(
          logo,
          54,
          42,
          anchoLogo,
          altoLogo
        );
      } catch {
        ctx.fillStyle = "#173d59";
        ctx.font =
          "700 42px Arial, sans-serif";

        ctx.fillText(
          "Enfri.Ar",
          54,
          92
        );
      }

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

      ctx.save();

      redondearRectangulo(
        ctx,
        fotoX,
        fotoY,
        fotoAncho,
        fotoAlto,
        28
      );

      ctx.clip();

      ctx.fillStyle = "#e8edf0";

      ctx.fillRect(
        fotoX,
        fotoY,
        fotoAncho,
        fotoAlto
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
            fotoX,
            fotoY,
            fotoAncho,
            fotoAlto
          );
        } catch {
          ctx.fillStyle = "#69757e";
          ctx.font =
            "700 24px Arial, sans-serif";

          ctx.textAlign = "center";

          ctx.fillText(
            "SIN FOTO",
            fotoX + fotoAncho / 2,
            fotoY + fotoAlto / 2
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
          fotoX + fotoAncho / 2,
          fotoY + fotoAlto / 2
        );

        ctx.textAlign = "left";
      }

      ctx.restore();

      ctx.strokeStyle =
        "rgba(23, 61, 89, 0.20)";

      ctx.lineWidth = 3;

      redondearRectangulo(
        ctx,
        fotoX,
        fotoY,
        fotoAncho,
        fotoAlto,
        28
      );

      ctx.stroke();

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
        tecnico.dni
          ? `DNI ${tecnico.dni}`
          : "Credencial interna de técnico",
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

      const nombreArchivo = [
        "credencial",
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
      <button
        type="button"
        onClick={generarCredencial}
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
