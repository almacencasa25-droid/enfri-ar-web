import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type InformeDetallePdfDatos = {
  tipo_documento: "detalle_trabajo" | "informe_mensual";
  fecha_emision: string;
  orden_compra?: string | null;
  numero_factura?: string | null;
  mes_informado?: number | null;
  anio_informado?: number | null;
  cliente_razon_social?: string | null;
  cliente_direccion?: string | null;
  cliente_localidad?: string | null;
  destino?: string | null;
  inventario?: string | null;
  detalle: string;
  observaciones?: string | null;
  numero_presupuesto_snapshot?: number | null;
  tecnico_nombre?: string | null;
  tecnico_apellido?: string | null;
  tecnico_matricula?: string | null;
  empresa_nombre?: string | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

const COLOR_TEXT = rgb(0.12, 0.13, 0.14);
const COLOR_MUTED = rgb(0.38, 0.41, 0.44);
const COLOR_BLUE = rgb(0.10, 0.34, 0.53);
const COLOR_LINE = rgb(0.78, 0.81, 0.84);

function texto(
  valor: string | number | null | undefined
) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor).trim();
}

function nombreMes(
  mes: number | null | undefined
) {
  const nombres = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  if (!mes || mes < 1 || mes > 12) {
    return "";
  }

  return nombres[mes - 1];
}

function fechaArgentina(fechaIso: string) {
  const partes = fechaIso
    .split("-")
    .map(Number);

  if (partes.length !== 3) {
    return fechaIso;
  }

  const [anio, mes, dia] = partes;

  return (
    String(dia) +
    " de " +
    nombreMes(mes) +
    " del " +
    String(anio)
  );
}

async function cargarLogo(pdf: PDFDocument) {
  try {
    const ruta = path.join(
      process.cwd(),
      "public",
      "logo-enfri-ar.png"
    );

    const bytes = await readFile(ruta);

    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

function partirPalabraLarga(
  palabra: string,
  font: PDFFont,
  size: number,
  anchoMaximo: number
) {
  const partes: string[] = [];
  let actual = "";

  for (const caracter of palabra) {
    const prueba = actual + caracter;

    if (
      font.widthOfTextAtSize(prueba, size) <=
      anchoMaximo
    ) {
      actual = prueba;
      continue;
    }

    if (actual) {
      partes.push(actual);
    }

    actual = caracter;
  }

  if (actual) {
    partes.push(actual);
  }

  return partes;
}

function envolverTexto(
  valor: string,
  font: PDFFont,
  size: number,
  anchoMaximo: number
) {
  const resultado: string[] = [];

  const bloques = valor
    .replace(/\r/g, "")
    .split("\n");

  for (const bloque of bloques) {
    if (!bloque.trim()) {
      resultado.push("");
      continue;
    }

    const palabras = bloque.split(/\s+/);
    let linea = "";

    for (const palabraOriginal of palabras) {
      let partes = [palabraOriginal];

      if (
        font.widthOfTextAtSize(
          palabraOriginal,
          size
        ) > anchoMaximo
      ) {
        partes = partirPalabraLarga(
          palabraOriginal,
          font,
          size,
          anchoMaximo
        );
      }

      for (const palabra of partes) {
        const prueba = linea
          ? linea + " " + palabra
          : palabra;

        if (
          font.widthOfTextAtSize(prueba, size) <=
          anchoMaximo
        ) {
          linea = prueba;
        } else {
          if (linea) {
            resultado.push(linea);
          }

          linea = palabra;
        }
      }
    }

    if (linea) {
      resultado.push(linea);
    }
  }

  return resultado;
}

function textoDerecha(
  page: PDFPage,
  valor: string,
  derecha: number,
  y: number,
  font: PDFFont,
  size: number
) {
  const ancho = font.widthOfTextAtSize(
    valor,
    size
  );

  page.drawText(valor, {
    x: derecha - ancho,
    y,
    font,
    size,
    color: COLOR_TEXT,
  });
}

function dibujarEncabezado(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  logo:
    | Awaited<ReturnType<typeof cargarLogo>>
    | null,
  fecha: string
) {
  if (logo) {
    const escala = Math.min(
      125 / logo.width,
      58 / logo.height
    );

    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - 92,
      width: logo.width * escala,
      height: logo.height * escala,
    });
  } else {
    page.drawText("Enfri.Ar", {
      x: MARGIN,
      y: PAGE_HEIGHT - 64,
      font: bold,
      size: 21,
      color: COLOR_BLUE,
    });

    page.drawText("Refrigeración", {
      x: MARGIN,
      y: PAGE_HEIGHT - 78,
      font: regular,
      size: 9,
      color: COLOR_MUTED,
    });
  }

  textoDerecha(
    page,
    "Moreno, " + fechaArgentina(fecha),
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 80,
    regular,
    10
  );

  page.drawLine({
    start: {
      x: MARGIN,
      y: PAGE_HEIGHT - 106,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y: PAGE_HEIGHT - 106,
    },
    thickness: 0.9,
    color: COLOR_LINE,
  });
}

function dibujarLineas(
  page: PDFPage,
  lineas: string[],
  x: number,
  yInicial: number,
  font: PDFFont,
  size: number,
  lineHeight: number
) {
  let y = yInicial;

  for (const linea of lineas) {
    if (!linea) {
      y -= lineHeight * 0.65;
      continue;
    }

    page.drawText(linea, {
      x,
      y,
      font,
      size,
      color: COLOR_TEXT,
    });

    y -= lineHeight;
  }

  return y;
}

function firmaTecnico(
  datos: InformeDetallePdfDatos
) {
  const nombre = [
    texto(datos.tecnico_nombre),
    texto(datos.tecnico_apellido),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    nombre:
      nombre ||
      texto(datos.empresa_nombre) ||
      "Enfri.Ar Refrigeración",
    matricula: texto(datos.tecnico_matricula),
  };
}

function crearDetalleTrabajo(
  pdf: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  logo:
    | Awaited<ReturnType<typeof cargarLogo>>
    | null,
  datos: InformeDetallePdfDatos
) {
  const page = pdf.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  dibujarEncabezado(
    page,
    regular,
    bold,
    logo,
    datos.fecha_emision
  );

  let y = PAGE_HEIGHT - 158;

  const intro =
    "De mi mayor consideración, informo que se realizó correctamente el siguiente servicio:";

  y =
    dibujarLineas(
      page,
      envolverTexto(
        intro,
        regular,
        10.5,
        PAGE_WIDTH - MARGIN * 2
      ),
      MARGIN,
      y,
      regular,
      10.5,
      17
    ) - 8;

  y =
    dibujarLineas(
      page,
      envolverTexto(
        texto(datos.detalle),
        regular,
        10.5,
        PAGE_WIDTH - MARGIN * 2
      ),
      MARGIN,
      y,
      regular,
      10.5,
      17
    ) - 12;

  const referencias: string[] = [];

  if (texto(datos.destino)) {
    referencias.push(
      "Destino: " + texto(datos.destino)
    );
  }

  if (texto(datos.inventario)) {
    referencias.push(
      "Inventario N° " + texto(datos.inventario)
    );
  }

  if (texto(datos.orden_compra)) {
    referencias.push(
      "Según Orden de Compra N° " +
        texto(datos.orden_compra)
    );
  }

  if (datos.numero_presupuesto_snapshot) {
    referencias.push(
      "Presupuesto relacionado N° " +
        String(datos.numero_presupuesto_snapshot)
    );
  }

  if (texto(datos.observaciones)) {
    referencias.push(
      "Observaciones: " +
        texto(datos.observaciones)
    );
  }

  for (const referencia of referencias) {
    y =
      dibujarLineas(
        page,
        envolverTexto(
          referencia,
          regular,
          10,
          PAGE_WIDTH - MARGIN * 2
        ),
        MARGIN,
        y,
        regular,
        10,
        15
      ) - 5;
  }

  const firma = firmaTecnico(datos);

  const firmaY = Math.max(
    145,
    y - 55
  );

  page.drawText(firma.nombre, {
    x: PAGE_WIDTH - MARGIN - 155,
    y: firmaY,
    font: bold,
    size: 9,
    color: COLOR_TEXT,
  });

  if (firma.matricula) {
    page.drawText(firma.matricula, {
      x: PAGE_WIDTH - MARGIN - 155,
      y: firmaY - 13,
      font: regular,
      size: 8.2,
      color: COLOR_MUTED,
    });
  }

  page.drawText(
    "Sin otro particular, saludos a usted atentamente.",
    {
      x: PAGE_WIDTH - MARGIN - 255,
      y: 90,
      font: regular,
      size: 9.5,
      color: COLOR_TEXT,
    }
  );
}

function crearInformeMensual(
  pdf: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  logo:
    | Awaited<ReturnType<typeof cargarLogo>>
    | null,
  datos: InformeDetallePdfDatos
) {
  let page = pdf.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  dibujarEncabezado(
    page,
    regular,
    bold,
    logo,
    datos.fecha_emision
  );

  let y = PAGE_HEIGHT - 158;

  const mes = nombreMes(
    datos.mes_informado
  );

  const introduccion =
    "En mi rol como instructor, informo que durante el mes de " +
    (mes || "indicado") +
    " se llevaron adelante las siguientes tareas:";

  y =
    dibujarLineas(
      page,
      envolverTexto(
        introduccion,
        regular,
        10.3,
        PAGE_WIDTH - MARGIN * 2
      ),
      MARGIN,
      y,
      regular,
      10.3,
      17
    ) - 12;

  const bloques = texto(datos.detalle)
    .replace(/\r/g, "")
    .split("\n");

  for (const bloqueOriginal of bloques) {
    const bloque = bloqueOriginal.trim();

    if (!bloque) {
      y -= 7;
      continue;
    }

    if (y < 135) {
      page = pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

      dibujarEncabezado(
        page,
        regular,
        bold,
        logo,
        datos.fecha_emision
      );

      y = PAGE_HEIGHT - 150;
    }

    const esItem =
      /^[-•*]/.test(bloque);

    const limpio = esItem
      ? bloque.replace(
          /^[-•*]\s*/,
          ""
        )
      : bloque;

    if (esItem) {
      page.drawCircle({
        x: MARGIN + 3,
        y: y + 3,
        size: 2.2,
        color: COLOR_TEXT,
      });
    }

    const x = esItem
      ? MARGIN + 18
      : MARGIN;

    y =
      dibujarLineas(
        page,
        envolverTexto(
          limpio,
          regular,
          10,
          PAGE_WIDTH - MARGIN - x
        ),
        x,
        y,
        regular,
        10,
        15
      ) - 5;
  }

  if (texto(datos.orden_compra)) {
    y -= 8;

    page.drawText(
      "Según Orden N° " +
        texto(datos.orden_compra),
      {
        x: MARGIN,
        y: Math.max(125, y),
        font: regular,
        size: 10,
        color: COLOR_TEXT,
      }
    );
  }

  const firma = firmaTecnico(datos);

  page.drawText(firma.nombre, {
    x: PAGE_WIDTH - MARGIN - 120,
    y: 82,
    font: bold,
    size: 8.7,
    color: COLOR_TEXT,
  });

  if (firma.matricula) {
    page.drawText(firma.matricula, {
      x: PAGE_WIDTH - MARGIN - 120,
      y: 69,
      font: regular,
      size: 8,
      color: COLOR_MUTED,
    });
  }
}

export async function generarInformeDetallePdf(
  datos: InformeDetallePdfDatos
): Promise<Uint8Array> {
  if (
    datos.tipo_documento !==
      "detalle_trabajo" &&
    datos.tipo_documento !==
      "informe_mensual"
  ) {
    throw new Error(
      "Este tipo de documento todavía no tiene plantilla PDF."
    );
  }

  const pdf = await PDFDocument.create();

  const regular = await pdf.embedFont(
    StandardFonts.Helvetica
  );

  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold
  );

  const logo = await cargarLogo(pdf);

  pdf.setTitle(
    datos.tipo_documento ===
      "informe_mensual"
      ? "Informe mensual"
      : "Detalle de trabajo"
  );

  pdf.setAuthor(
    texto(datos.empresa_nombre) ||
      "Enfri.Ar Refrigeración"
  );

  pdf.setCreator(
    "Enfri.Ar Refrigeración"
  );

  if (
    datos.tipo_documento ===
    "detalle_trabajo"
  ) {
    crearDetalleTrabajo(
      pdf,
      regular,
      bold,
      logo,
      datos
    );
  } else {
    crearInformeMensual(
      pdf,
      regular,
      bold,
      logo,
      datos
    );
  }

  const paginas = pdf.getPages();

  paginas.forEach(
    (pagina, indice) => {
      pagina.drawLine({
        start: {
          x: MARGIN,
          y: 45,
        },
        end: {
          x: PAGE_WIDTH - MARGIN,
          y: 45,
        },
        thickness: 0.6,
        color: COLOR_LINE,
      });

      pagina.drawText(
        "Documento administrativo Enfri.Ar | Hoja " +
          String(indice + 1) +
          " de " +
          String(paginas.length),
        {
          x: MARGIN,
          y: 29,
          font: regular,
          size: 6.7,
          color: COLOR_MUTED,
        }
      );
    }
  );

  return await pdf.save();
}
