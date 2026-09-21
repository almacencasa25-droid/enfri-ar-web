import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

export type FichaRevisionEmpresa = {
  company_name?: string | null;
  short_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  whatsapp_number?: string | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 32;

const COLOR_DARK = rgb(
  0.09,
  0.24,
  0.35
);

const COLOR_BLUE = rgb(
  0.09,
  0.43,
  0.64
);

const COLOR_ORANGE = rgb(
  0.94,
  0.55,
  0.18
);

const COLOR_TEXT = rgb(
  0.16,
  0.17,
  0.18
);

const COLOR_MUTED = rgb(
  0.39,
  0.43,
  0.46
);

const COLOR_BORDER = rgb(
  0.79,
  0.82,
  0.84
);

const COLOR_LIGHT = rgb(
  0.965,
  0.98,
  0.99
);

function texto(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor).trim();
}

async function cargarLogo(
  pdf: PDFDocument
): Promise<PDFImage | null> {
  try {
    const ruta = path.join(
      process.cwd(),
      "public",
      "logo-enfri-ar.png"
    );

    const bytes =
      await readFile(ruta);

    return await pdf.embedPng(
      bytes
    );
  } catch {
    return null;
  }
}

function dibujarTituloSeccion({
  page,
  titulo,
  y,
  bold,
}: {
  page: PDFPage;
  titulo: string;
  y: number;
  bold: PDFFont;
}) {
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width:
      PAGE_WIDTH -
      MARGIN * 2,
    height: 20,
    color: COLOR_LIGHT,
    borderColor:
      COLOR_BORDER,
    borderWidth: 0.5,
  });

  page.drawText(
    titulo,
    {
      x: MARGIN + 8,
      y: y + 2,
      size: 8,
      font: bold,
      color: COLOR_DARK,
    }
  );
}

function dibujarCampo({
  page,
  etiqueta,
  x,
  y,
  ancho,
  bold,
}: {
  page: PDFPage;
  etiqueta: string;
  x: number;
  y: number;
  ancho: number;
  bold: PDFFont;
}) {
  page.drawText(
    etiqueta,
    {
      x,
      y,
      size: 7.4,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  const anchoEtiqueta =
    bold.widthOfTextAtSize(
      etiqueta,
      7.4
    );

  page.drawLine({
    start: {
      x:
        x +
        anchoEtiqueta +
        6,
      y: y - 1,
    },
    end: {
      x: x + ancho,
      y: y - 1,
    },
    thickness: 0.55,
    color: COLOR_BORDER,
  });
}

function dibujarOpcion({
  page,
  textoOpcion,
  x,
  y,
  regular,
}: {
  page: PDFPage;
  textoOpcion: string;
  x: number;
  y: number;
  regular: PDFFont;
}) {
  page.drawRectangle({
    x,
    y: y - 2,
    width: 8,
    height: 8,
    borderColor:
      COLOR_TEXT,
    borderWidth: 0.65,
  });

  page.drawText(
    textoOpcion,
    {
      x: x + 13,
      y,
      size: 6.7,
      font: regular,
      color: COLOR_TEXT,
    }
  );
}

function dibujarFilaControl({
  page,
  etiqueta,
  opciones,
  y,
  regular,
  bold,
}: {
  page: PDFPage;
  etiqueta: string;
  opciones: string[];
  y: number;
  regular: PDFFont;
  bold: PDFFont;
}) {
  page.drawText(
    etiqueta,
    {
      x: MARGIN + 6,
      y,
      size: 6.8,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  let x =
    MARGIN + 132;

  for (
    const opcion
    of opciones
  ) {
    dibujarOpcion({
      page,
      textoOpcion:
        opcion,
      x,
      y,
      regular,
    });

    x +=
      22 +
      regular.widthOfTextAtSize(
        opcion,
        6.7
      );
  }
}

function dibujarObservaciones({
  page,
  ySuperior,
  alto,
  bold,
}: {
  page: PDFPage;
  ySuperior: number;
  alto: number;
  bold: PDFFont;
}) {
  page.drawRectangle({
    x: MARGIN,
    y:
      ySuperior -
      alto,
    width:
      PAGE_WIDTH -
      MARGIN * 2,
    height: alto,
    borderColor:
      COLOR_BORDER,
    borderWidth: 0.6,
  });

  page.drawText(
    "Observaciones",
    {
      x: MARGIN + 8,
      y:
        ySuperior -
        14,
      size: 7.4,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  for (
    let y =
      ySuperior - 30;
    y >
    ySuperior -
      alto +
      10;
    y -= 15
  ) {
    page.drawLine({
      start: {
        x: MARGIN + 8,
        y,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN -
          8,
        y,
      },
      thickness: 0.35,
      color: COLOR_BORDER,
    });
  }
}

export async function generarFichaRevisionPdf({
  numeroInicial,
  cantidad,
  empresa,
}: {
  numeroInicial: number;
  cantidad: number;
  empresa: FichaRevisionEmpresa;
}) {
  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold
    );

  const logo =
    await cargarLogo(pdf);

  const nombreEmpresa =
    texto(
      empresa.company_name
    ) ||
    texto(
      empresa.short_name
    ) ||
    "Enfri.Ar Refrigeración";

  const contacto = [
    texto(empresa.phone),
    texto(
      empresa.whatsapp_number
    ),
    texto(empresa.email),
    texto(empresa.website),
  ]
    .filter(Boolean)
    .join(" | ");

  for (
    let indice = 0;
    indice < cantidad;
    indice += 1
  ) {
    const numeroFicha =
      numeroInicial +
      indice;

    const numeroVisible =
      String(
        numeroFicha
      ).padStart(
        6,
        "0"
      );

    const page =
      pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    if (logo) {
      const escala =
        Math.min(
          150 /
            logo.width,
          48 /
            logo.height
        );

      page.drawImage(
        logo,
        {
          x: MARGIN,
          y:
            PAGE_HEIGHT -
            77,
          width:
            logo.width *
            escala,
          height:
            logo.height *
            escala,
        }
      );
    }

    page.drawText(
      "FICHA DE REVISIÓN TÉCNICA",
      {
        x: 228,
        y:
          PAGE_HEIGHT -
          48,
        size: 12.5,
        font: bold,
        color: COLOR_DARK,
      }
    );

    page.drawText(
      `N.º ${numeroVisible}`,
      {
        x: 445,
        y:
          PAGE_HEIGHT -
          68,
        size: 10.5,
        font: bold,
        color:
          COLOR_ORANGE,
      }
    );

    page.drawText(
      nombreEmpresa,
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          94,
        size: 7.6,
        font: bold,
        color: COLOR_TEXT,
      }
    );

    if (contacto) {
      page.drawText(
        contacto,
        {
          x: MARGIN,
          y:
            PAGE_HEIGHT -
            106,
          size: 6.3,
          font: regular,
          color:
            COLOR_MUTED,
        }
      );
    }

    page.drawLine({
      start: {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          116,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y:
          PAGE_HEIGHT -
          116,
      },
      thickness: 0.8,
      color: COLOR_BLUE,
    });

    let y =
      PAGE_HEIGHT -
      140;

    dibujarTituloSeccion({
      page,
      titulo:
        "DATOS DE LA VISITA",
      y,
      bold,
    });

    y -= 25;

    dibujarCampo({
      page,
      etiqueta:
        "Fecha:",
      x: MARGIN + 6,
      y,
      ancho: 170,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Solicitante / cliente:",
      x: 240,
      y,
      ancho: 315,
      bold,
    });

    y -= 20;

    dibujarCampo({
      page,
      etiqueta:
        "Dirección:",
      x: MARGIN + 6,
      y,
      ancho: 325,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Localidad:",
      x: 375,
      y,
      ancho: 180,
      bold,
    });

    y -= 20;

    dibujarCampo({
      page,
      etiqueta:
        "Teléfono:",
      x: MARGIN + 6,
      y,
      ancho: 190,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Sector / ubicación:",
      x: 260,
      y,
      ancho: 295,
      bold,
    });

    y -= 30;

    dibujarTituloSeccion({
      page,
      titulo:
        "DATOS DEL EQUIPO",
      y,
      bold,
    });

    y -= 25;

    page.drawText(
      "Tipo:",
      {
        x: MARGIN + 6,
        y,
        size: 6.8,
        font: bold,
        color: COLOR_TEXT,
      }
    );

    let tipoX =
      MARGIN + 45;

    for (
      const tipo
      of [
        "Split",
        "Piso techo",
        "Cassette",
        "Ventana",
        "Otro",
      ]
    ) {
      dibujarOpcion({
        page,
        textoOpcion:
          tipo,
        x: tipoX,
        y,
        regular,
      });

      tipoX +=
        22 +
        regular.widthOfTextAtSize(
          tipo,
          6.7
        );
    }

    y -= 20;

    dibujarCampo({
      page,
      etiqueta:
        "Marca:",
      x: MARGIN + 6,
      y,
      ancho: 165,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Modelo:",
      x: 215,
      y,
      ancho: 165,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Capacidad:",
      x: 395,
      y,
      ancho: 160,
      bold,
    });

    y -= 20;

    dibujarCampo({
      page,
      etiqueta:
        "Refrigerante:",
      x: MARGIN + 6,
      y,
      ancho: 220,
      bold,
    });

    dibujarOpcion({
      page,
      textoOpcion:
        "Sin etiqueta / ilegible",
      x: 310,
      y,
      regular,
    });

    y -= 30;

    dibujarTituloSeccion({
      page,
      titulo:
        "CONTROL Y DIAGNÓSTICO",
      y,
      bold,
    });

    y -= 23;

    const controles = [
      {
        etiqueta:
          "Equipo enciende",
        opciones: [
          "Sí",
          "No",
        ],
      },
      {
        etiqueta:
          "Evaporador",
        opciones: [
          "Correcto",
          "Sucio",
          "Congelado",
          "Dañado",
        ],
      },
      {
        etiqueta:
          "Condensador",
        opciones: [
          "Correcto",
          "Sucio",
          "Obstruido",
          "Dañado",
        ],
      },
      {
        etiqueta:
          "Forzador evaporador",
        opciones: [
          "Funciona",
          "No funciona",
          "Ruidoso",
        ],
      },
      {
        etiqueta:
          "Forzador condensador",
        opciones: [
          "Funciona",
          "No funciona",
          "Ruidoso",
        ],
      },
      {
        etiqueta:
          "Motocompresor",
        opciones: [
          "Funciona",
          "No arranca",
          "Arranca y corta",
          "Ruidoso",
        ],
      },
      {
        etiqueta:
          "Refrigerante",
        opciones: [
          "Normal",
          "Falta",
          "Sin carga",
          "Posible fuga",
        ],
      },
      {
        etiqueta:
          "Drenaje",
        opciones: [
          "Correcto",
          "Obstruido",
          "Pérdida de agua",
        ],
      },
      {
        etiqueta:
          "Instalación eléctrica",
        opciones: [
          "Correcta",
          "A revisar",
          "Riesgosa",
        ],
      },
      {
        etiqueta:
          "Filtros",
        opciones: [
          "Correctos",
          "Sucios",
          "Deteriorados",
        ],
      },
    ];

    for (
      const control
      of controles
    ) {
      dibujarFilaControl({
        page,
        etiqueta:
          control.etiqueta,
        opciones:
          control.opciones,
        y,
        regular,
        bold,
      });

      y -= 15;
    }

    y -= 3;

    dibujarCampo({
      page,
      etiqueta:
        "Tensión:",
      x: MARGIN + 6,
      y,
      ancho: 145,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Consumo:",
      x: 195,
      y,
      ancho: 145,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Presión:",
      x: 355,
      y,
      ancho: 200,
      bold,
    });

    y -= 20;

    dibujarCampo({
      page,
      etiqueta:
        "Temp. entrada:",
      x: MARGIN + 6,
      y,
      ancho: 235,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Temp. salida:",
      x: 315,
      y,
      ancho: 240,
      bold,
    });

    y -= 30;

    dibujarTituloSeccion({
      page,
      titulo:
        "DIAGNÓSTICO PRELIMINAR",
      y,
      bold,
    });

    y -= 23;

    let diagnosticoX =
      MARGIN + 6;

    for (
      const opcion
      of [
        "Limpieza",
        "Mantenimiento",
        "Reparación",
        "Búsqueda de fuga",
      ]
    ) {
      dibujarOpcion({
        page,
        textoOpcion:
          opcion,
        x:
          diagnosticoX,
        y,
        regular,
      });

      diagnosticoX +=
        22 +
        regular.widthOfTextAtSize(
          opcion,
          6.7
        );
    }

    y -= 15;

    diagnosticoX =
      MARGIN + 6;

    for (
      const opcion
      of [
        "Carga refrigerante",
        "Reemplazo componente",
        "Reemplazo equipo",
        "Diagnóstico adicional",
      ]
    ) {
      dibujarOpcion({
        page,
        textoOpcion:
          opcion,
        x:
          diagnosticoX,
        y,
        regular,
      });

      diagnosticoX +=
        22 +
        regular.widthOfTextAtSize(
          opcion,
          6.7
        );
    }

    y -= 22;

    dibujarObservaciones({
      page,
      ySuperior: y,
      alto: 62,
      bold,
    });

    y -= 72;

    dibujarTituloSeccion({
      page,
      titulo:
        "SEGUIMIENTO",
      y,
      bold,
    });

    y -= 23;

    let seguimientoX =
      MARGIN + 6;

    for (
      const opcion
      of [
        "Requiere fotografías",
        "Segunda visita",
        "Presupuestar",
        "Sin intervención",
      ]
    ) {
      dibujarOpcion({
        page,
        textoOpcion:
          opcion,
        x:
          seguimientoX,
        y,
        regular,
      });

      seguimientoX +=
        22 +
        regular.widthOfTextAtSize(
          opcion,
          6.7
        );
    }

    y -= 30;

    dibujarTituloSeccion({
      page,
      titulo:
        "RESPONSABLE DEL LUGAR",
      y,
      bold,
    });

    y -= 24;

    dibujarCampo({
      page,
      etiqueta:
        "Nombre y apellido:",
      x: MARGIN + 6,
      y,
      ancho: 270,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Cargo:",
      x: 340,
      y,
      ancho: 215,
      bold,
    });

    y -= 23;

    dibujarCampo({
      page,
      etiqueta:
        "Firma:",
      x: MARGIN + 6,
      y,
      ancho: 245,
      bold,
    });

    dibujarCampo({
      page,
      etiqueta:
        "Técnico:",
      x: 320,
      y,
      ancho: 235,
      bold,
    });

    page.drawLine({
      start: {
        x: MARGIN,
        y: 43,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y: 43,
      },
      thickness: 0.6,
      color: COLOR_BORDER,
    });

    page.drawText(
      "Revisión técnica preliminar. No constituye presupuesto, factura ni comprobante fiscal.",
      {
        x: MARGIN,
        y: 28,
        size: 6.2,
        font: bold,
        color: COLOR_DARK,
      }
    );

    page.drawText(
      `Ficha N.º ${numeroVisible}`,
      {
        x:
          PAGE_WIDTH -
          126,
        y: 28,
        size: 6.2,
        font: regular,
        color: COLOR_MUTED,
      }
    );
  }

  return await pdf.save();
}
