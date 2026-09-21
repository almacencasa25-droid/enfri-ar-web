import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

type EmpresaFichaRevision = {
  nombre: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
};

export type GenerarFichaRevisionPdfInput = {
  numeroInicial: number;
  cantidad: number;
  empresa?: Partial<EmpresaFichaRevision>;
};

const COLOR_AZUL = rgb(0.10, 0.31, 0.52);
const COLOR_CELESTE = rgb(0.93, 0.96, 0.99);
const COLOR_GRIS = rgb(0.35, 0.35, 0.35);
const COLOR_NEGRO = rgb(0.12, 0.12, 0.12);
const COLOR_NARANJA = rgb(0.88, 0.48, 0.12);

const EMPRESA_DEFAULT: EmpresaFichaRevision = {
  nombre: "Enfri.Ar Refrigeración",
  cuit: "20-93431894-4",
  direccion: "Francia 2559 Moreno, Bs. As.",
  telefono: "11-3847-3222",
  email: "enfri.ar.refrigeracion@gmail.com",
};

type ContextoDibujo = {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  width: number;
  height: number;
  marginX: number;
  y: number;
};

function normalizarEmpresa(
  empresa?: Partial<EmpresaFichaRevision>
): EmpresaFichaRevision {
  return {
    nombre:
      String(empresa?.nombre ?? EMPRESA_DEFAULT.nombre).trim() ||
      EMPRESA_DEFAULT.nombre,
    cuit:
      String(empresa?.cuit ?? EMPRESA_DEFAULT.cuit).trim() ||
      EMPRESA_DEFAULT.cuit,
    direccion:
      String(
        empresa?.direccion ?? EMPRESA_DEFAULT.direccion
      ).trim() || EMPRESA_DEFAULT.direccion,
    telefono:
      String(
        empresa?.telefono ?? EMPRESA_DEFAULT.telefono
      ).trim() || EMPRESA_DEFAULT.telefono,
    email:
      String(empresa?.email ?? EMPRESA_DEFAULT.email).trim() ||
      EMPRESA_DEFAULT.email,
  };
}

async function cargarLogo(
  pdfDoc: PDFDocument
) {
  const candidatos = [
    path.join(process.cwd(), "public", "logo-enfri-ar.png"),
    path.join(process.cwd(), "public", "logo-enfri-ar.jpg"),
    path.join(process.cwd(), "public", "logo-enfri-ar.jpeg"),
    path.join(process.cwd(), "public", "logo-enfri-ar.webp"),
  ];

  for (const ruta of candidatos) {
    try {
      const archivo = await readFile(ruta);

      if (ruta.endsWith(".png")) {
        return await pdfDoc.embedPng(archivo);
      }

      if (
        ruta.endsWith(".jpg") ||
        ruta.endsWith(".jpeg")
      ) {
        return await pdfDoc.embedJpg(archivo);
      }
    } catch {
      // seguimos probando
    }
  }

  return null;
}

function escribirTexto(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(texto, {
    x,
    y,
    size,
    font,
    color,
  });
}

function escribirTextoNegrita(
  page: PDFPage,
  fontBold: PDFFont,
  texto: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(texto, {
    x,
    y,
    size,
    font: fontBold,
    color,
  });
}

function linea(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  grosor = 0.8,
  color = rgb(0.55, 0.60, 0.66)
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: grosor,
    color,
  });
}

function rectanguloTitulo(
  ctx: ContextoDibujo,
  titulo: string
) {
  const { page, fontBold, width, marginX } = ctx;
  const alto = 14;
  const yBase = ctx.y - alto;

  page.drawRectangle({
    x: marginX,
    y: yBase,
    width: width - marginX * 2,
    height: alto,
    color: COLOR_CELESTE,
    borderColor: rgb(0.80, 0.85, 0.90),
    borderWidth: 0.8,
  });

  escribirTextoNegrita(
    page,
    fontBold,
    titulo.toUpperCase(),
    marginX + 6,
    yBase + 4,
    7.2,
    COLOR_AZUL
  );

  ctx.y = yBase - 6;
}

function campoLinea(
  ctx: ContextoDibujo,
  label: string,
  x: number,
  anchoLabel: number,
  anchoLinea: number,
  y?: number
) {
  const {
    page,
    font,
    fontBold,
  } = ctx;

  const yy = y ?? ctx.y;

  escribirTextoNegrita(
    page,
    fontBold,
    label,
    x,
    yy + 2,
    6.2,
    COLOR_GRIS
  );

  linea(
    page,
    x + anchoLabel,
    yy + 1,
    x + anchoLabel + anchoLinea,
    yy + 1,
    0.7
  );

  return yy;
}

function checkbox(
  ctx: ContextoDibujo,
  x: number,
  y: number,
  label: string
) {
  const { page, font } = ctx;

  page.drawRectangle({
    x,
    y,
    width: 8,
    height: 8,
    borderColor: COLOR_GRIS,
    borderWidth: 0.8,
  });

  escribirTexto(
    page,
    font,
    label,
    x + 12,
    y + 1,
    6.2,
    COLOR_NEGRO
  );
}

function filaChecks(
  ctx: ContextoDibujo,
  nombre: string,
  opciones: string[],
  y: number
) {
  const {
    page,
    font,
    fontBold,
    marginX,
  } = ctx;

  const inicioX = marginX;
  const nombreW = 118;
  const inicioChecks = inicioX + nombreW;
  const anchoDisponible = 520 - nombreW;
  const columnas = opciones.length;
  const anchoCol = anchoDisponible / columnas;

  escribirTextoNegrita(
    page,
    fontBold,
    nombre,
    inicioX,
    y + 1,
    6.2,
    COLOR_GRIS
  );

  for (let i = 0; i < opciones.length; i += 1) {
    const x = inicioChecks + i * anchoCol;
    page.drawRectangle({
      x,
      y,
      width: 8,
      height: 8,
      borderColor: COLOR_GRIS,
      borderWidth: 0.8,
    });

    escribirTexto(
      page,
      font,
      opciones[i],
      x + 12,
      y + 1,
      6.1,
      COLOR_NEGRO
    );
  }
}

function bloqueObservaciones(
  ctx: ContextoDibujo,
  titulo: string,
  lineas: number,
  altoLinea = 14
) {
  const {
    page,
    fontBold,
    width,
    marginX,
  } = ctx;

  escribirTextoNegrita(
    page,
    fontBold,
    titulo,
    marginX,
    ctx.y,
    6.6,
    COLOR_GRIS
  );

  ctx.y -= 8;

  for (let i = 0; i < lineas; i += 1) {
    linea(
      page,
      marginX,
      ctx.y,
      width - marginX,
      ctx.y,
      0.7,
      rgb(0.68, 0.70, 0.74)
    );
    ctx.y -= altoLinea;
  }
}

function dibujarEncabezado(
  ctx: ContextoDibujo,
  numero: number,
  empresa: EmpresaFichaRevision,
  logo: Awaited<ReturnType<typeof cargarLogo>>
) {
  const { page, font, fontBold, width, height, marginX } = ctx;

  const top = height - 20;

  if (logo) {
    const logoWidth = 60;
    const logoHeight = 24;
    page.drawImage(logo, {
      x: marginX,
      y: top - logoHeight + 2,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    escribirTextoNegrita(
      page,
      fontBold,
      "Enfri.Ar",
      marginX,
      top - 8,
      14,
      COLOR_AZUL
    );
    escribirTexto(
      page,
      font,
      "Refrigeración",
      marginX,
      top - 18,
      8,
      COLOR_GRIS
    );
  }

  escribirTextoNegrita(
    page,
    fontBold,
    "FICHA DE REVISIÓN TÉCNICA",
    width / 2 - 72,
    top - 8,
    8.5,
    COLOR_NEGRO
  );

  escribirTextoNegrita(
    page,
    fontBold,
    `N° ${String(numero).padStart(6, "0")}`,
    width - marginX - 52,
    top - 8,
    8,
    COLOR_NARANJA
  );

  escribirTexto(
    page,
    font,
    empresa.nombre,
    marginX,
    top - 34,
    6.1,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    `CUIT: ${empresa.cuit}  |  ${empresa.direccion}`,
    marginX,
    top - 42,
    6,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    `Tel: ${empresa.telefono}  |  Email: ${empresa.email}`,
    marginX,
    top - 50,
    6,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    top - 56,
    width - marginX,
    top - 56,
    1,
    rgb(0.68, 0.78, 0.88)
  );

  ctx.y = top - 68;
}

function dibujarPrimeraHoja(
  ctx: ContextoDibujo
) {
  const {
    page,
    font,
    fontBold,
    width,
    marginX,
  } = ctx;

  rectanguloTitulo(ctx, "Datos de la visita");

  const col1 = marginX;
  const col2 = marginX + 160;
  const col3 = marginX + 330;

  campoLinea(ctx, "Fecha:", col1, 26, 108);
  campoLinea(ctx, "Hora:", col2, 24, 74);
  campoLinea(ctx, "Cliente / empresa:", col3, 70, 145);
  ctx.y -= 16;

  campoLinea(ctx, "Dirección:", col1, 38, 190);
  campoLinea(ctx, "Localidad:", col3, 45, 170);
  ctx.y -= 16;

  campoLinea(ctx, "Teléfono:", col1, 42, 130);
  campoLinea(ctx, "Sector / ubicación:", col2, 70, 192);
  ctx.y -= 18;

  rectanguloTitulo(ctx, "Motivo de la visita");

  checkbox(ctx, marginX, ctx.y - 1, "Diagnóstico");
  checkbox(ctx, marginX + 96, ctx.y - 1, "Presupuesto");
  checkbox(ctx, marginX + 192, ctx.y - 1, "Instalación");
  checkbox(ctx, marginX + 296, ctx.y - 1, "Mantenimiento");
  checkbox(ctx, marginX + 418, ctx.y - 1, "Garantía");
  ctx.y -= 18;

  rectanguloTitulo(ctx, "Identificación del equipo");

  campoLinea(ctx, "Tipo:", col1, 20, 110);
  checkbox(ctx, col1 + 138, ctx.y - 1, "Split");
  checkbox(ctx, col1 + 200, ctx.y - 1, "Cassette");
  checkbox(ctx, col1 + 282, ctx.y - 1, "Ventana");
  checkbox(ctx, col1 + 370, ctx.y - 1, "Otro");
  ctx.y -= 16;

  campoLinea(ctx, "Marca:", col1, 28, 150);
  campoLinea(ctx, "Modelo:", col2 + 10, 36, 140);
  campoLinea(ctx, "Capacidad:", col3, 48, 102);
  ctx.y -= 16;

  campoLinea(ctx, "Serie / inventario:", col1, 72, 150);
  campoLinea(ctx, "Refrigerante:", col3, 58, 100);
  checkbox(ctx, col3 + 165, ctx.y - 1, "Sin etiqueta");
  ctx.y -= 18;

  rectanguloTitulo(ctx, "Consulta técnica");

  escribirTextoNegrita(
    page,
    fontBold,
    "Control y diagnóstico del equipo",
    marginX,
    ctx.y,
    6.6,
    COLOR_GRIS
  );

  ctx.y -= 12;

  filaChecks(
    ctx,
    "Equipo enciende",
    ["Sí", "No"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Evaporador",
    ["Correcto", "Sucio", "Congelado", "Dañado"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Condensador",
    ["Correcto", "Sucio", "Obstruido", "Dañado"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Forzador evaporador",
    ["Funciona", "No funciona", "Ruidoso"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Forzador condensador",
    ["Funciona", "No funciona", "Ruidoso"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Motocompresor",
    ["Funciona", "No arranca", "Corta", "Ruidoso"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Refrigerante",
    ["Normal", "Falta", "Sin carga", "Posible fuga"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Drenaje",
    ["Correcto", "Obstruido", "Pérdida de agua"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Instalación eléctrica",
    ["Correcta", "A revisar", "Riesgosa"],
    ctx.y
  );
  ctx.y -= 13;

  filaChecks(
    ctx,
    "Filtros",
    ["Correctos", "Sucios", "Deteriorados"],
    ctx.y
  );
  ctx.y -= 18;

  campoLinea(ctx, "Tensión:", col1, 38, 82);
  campoLinea(ctx, "Consumo:", col2, 48, 70);
  campoLinea(ctx, "Presión:", col2 + 130, 40, 66);
  campoLinea(ctx, "Temp. entrada:", col3, 70, 60);
  ctx.y -= 16;

  campoLinea(ctx, "Temp. salida:", col1, 55, 90);
  ctx.y -= 18;

  rectanguloTitulo(ctx, "Relevamiento para instalación");

  campoLinea(
    ctx,
    "Equipo / capacidad estimada:",
    col1,
    102,
    150
  );
  campoLinea(
    ctx,
    "Interconexión aprox.:",
    col3,
    80,
    86
  );
  ctx.y -= 16;

  campoLinea(
    ctx,
    "Ubicación evaporador:",
    col1,
    86,
    130
  );
  campoLinea(
    ctx,
    "Ubicación condensador:",
    col3,
    90,
    100
  );
  ctx.y -= 16;

  checkbox(ctx, col1, ctx.y - 1, "Desagüe disponible");
  checkbox(ctx, col1 + 118, ctx.y - 1, "Alimentación eléctrica");
  checkbox(ctx, col1 + 280, ctx.y - 1, "Perforación");
  checkbox(ctx, col1 + 378, ctx.y - 1, "Ménsulas / base");
  ctx.y -= 14;

  checkbox(ctx, col1, ctx.y - 1, "Canaleta");
  checkbox(ctx, col1 + 78, ctx.y - 1, "Trabajo en altura");
  checkbox(ctx, col1 + 210, ctx.y - 1, "Acceso complejo");
  checkbox(ctx, col1 + 330, ctx.y - 1, "Requiere andamio / elevación");
  ctx.y -= 18;

  rectanguloTitulo(ctx, "Conclusión técnica");

  checkbox(ctx, col1, ctx.y - 1, "Operativo");
  checkbox(ctx, col1 + 72, ctx.y - 1, "Mantenimiento");
  checkbox(ctx, col1 + 160, ctx.y - 1, "Reparación");
  checkbox(ctx, col1 + 262, ctx.y - 1, "Presupuestar");
  checkbox(ctx, col1 + 378, ctx.y - 1, "Reemplazo");
  checkbox(ctx, col1 + 470, ctx.y - 1, "Baja técnica");
  ctx.y -= 18;

  bloqueObservaciones(
    ctx,
    "Descripción / observaciones técnicas",
    3,
    14
  );

  ctx.y -= 2;

  const medio = width / 2;

  escribirTextoNegrita(
    page,
    fontBold,
    "Responsable del establecimiento",
    marginX,
    ctx.y,
    6.6,
    COLOR_GRIS
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "Técnico responsable",
    medio + 10,
    ctx.y,
    6.6,
    COLOR_GRIS
  );

  ctx.y -= 10;

  campoLinea(ctx, "Nombre:", marginX, 40, 180, ctx.y);
  campoLinea(ctx, "Nombre:", medio + 10, 40, 120, ctx.y);
  ctx.y -= 16;

  campoLinea(ctx, "Cargo:", marginX, 32, 188, ctx.y);
  campoLinea(ctx, "Matrícula:", medio + 10, 48, 112, ctx.y);
  ctx.y -= 16;

  campoLinea(ctx, "DNI:", marginX, 24, 198, ctx.y);
  campoLinea(ctx, "Firma y sello:", medio + 10, 62, 98, ctx.y);
  ctx.y -= 18;

  escribirTexto(
    page,
    font,
    "Este documento no tiene validez si no se encuentra la firma y sello del técnico responsable.",
    marginX,
    ctx.y,
    6,
    rgb(0.50, 0.18, 0.18)
  );

  escribirTexto(
    page,
    font,
    "Pág. 1 de 1",
    width - marginX - 34,
    14,
    6,
    rgb(0.45, 0.45, 0.45)
  );
}

export async function generarFichaRevisionPdf(
  input: GenerarFichaRevisionPdfInput
): Promise<Uint8Array> {
  const numeroInicial = Number(input.numeroInicial || 0);
  const cantidad = Number(input.cantidad || 0);

  if (!Number.isFinite(numeroInicial) || numeroInicial <= 0) {
    throw new Error("El número inicial no es válido.");
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad de fichas no es válida.");
  }

  const empresa = normalizarEmpresa(input.empresa);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await cargarLogo(pdfDoc);

  for (let i = 0; i < cantidad; i += 1) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const ctx: ContextoDibujo = {
      page,
      font,
      fontBold,
      width,
      height,
      marginX: 24,
      y: height - 24,
    };

    dibujarEncabezado(
      ctx,
      numeroInicial + i,
      empresa,
      logo
    );

    dibujarPrimeraHoja(ctx);
  }

  return await pdfDoc.save();
}
