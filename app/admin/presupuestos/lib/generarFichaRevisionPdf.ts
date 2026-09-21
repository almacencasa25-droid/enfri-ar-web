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

const MARGIN = 30;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

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

function tituloSeccion({
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
    y: y - 3,
    width: CONTENT_WIDTH,
    height: 18,
    color: COLOR_LIGHT,
    borderColor: COLOR_BORDER,
    borderWidth: 0.5,
  });

  page.drawText(
    titulo,
    {
      x: MARGIN + 7,
      y: y + 2,
      size: 7.7,
      font: bold,
      color: COLOR_DARK,
    }
  );
}

function campo({
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
      size: 6.8,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  const anchoEtiqueta =
    bold.widthOfTextAtSize(
      etiqueta,
      6.8
    );

  page.drawLine({
    start: {
      x:
        x +
        anchoEtiqueta +
        5,
      y: y - 1,
    },
    end: {
      x: x + ancho,
      y: y - 1,
    },
    thickness: 0.45,
    color: COLOR_BORDER,
  });
}

function casillero({
  page,
  x,
  y,
}: {
  page: PDFPage;
  x: number;
  y: number;
}) {
  page.drawRectangle({
    x,
    y: y - 1,
    width: 8,
    height: 8,
    borderColor: COLOR_TEXT,
    borderWidth: 0.65,
  });
}

function opcion({
  page,
  etiqueta,
  x,
  y,
  regular,
}: {
  page: PDFPage;
  etiqueta: string;
  x: number;
  y: number;
  regular: PDFFont;
}) {
  casillero({
    page,
    x,
    y,
  });

  page.drawText(
    etiqueta,
    {
      x: x + 12,
      y,
      size: 6.4,
      font: regular,
      color: COLOR_TEXT,
    }
  );
}

function filaTablaDiagnostico({
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
      size: 6.4,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  const columnas = [
    184,
    276,
    368,
    460,
  ];

  opciones
    .slice(0, 4)
    .forEach(
      (
        valor,
        indice
      ) => {
        opcion({
          page,
          etiqueta: valor,
          x: columnas[indice],
          y,
          regular,
        });
      }
    );

  page.drawLine({
    start: {
      x: MARGIN,
      y: y - 5,
    },
    end: {
      x:
        PAGE_WIDTH -
        MARGIN,
      y: y - 5,
    },
    thickness: 0.25,
    color: COLOR_BORDER,
  });
}

function areaLineas({
  page,
  titulo,
  yTop,
  alto,
  bold,
}: {
  page: PDFPage;
  titulo: string;
  yTop: number;
  alto: number;
  bold: PDFFont;
}) {
  page.drawRectangle({
    x: MARGIN,
    y:
      yTop -
      alto,
    width: CONTENT_WIDTH,
    height: alto,
    borderColor: COLOR_BORDER,
    borderWidth: 0.5,
  });

  page.drawText(
    titulo,
    {
      x: MARGIN + 7,
      y: yTop - 13,
      size: 6.8,
      font: bold,
      color: COLOR_TEXT,
    }
  );

  for (
    let lineaY =
      yTop - 27;
    lineaY >
    yTop -
      alto +
      8;
    lineaY -= 14
  ) {
    page.drawLine({
      start: {
        x: MARGIN + 7,
        y: lineaY,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN -
          7,
        y: lineaY,
      },
      thickness: 0.3,
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
    texto(
      empresa.address
    ),
    texto(
      empresa.phone
    ),
    texto(
      empresa.email
    ),
    texto(
      empresa.website
    ),
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

    /*
     * ==========================================
     * ENCABEZADO COMPACTO
     * ==========================================
     */

    if (logo) {
      const escala =
        Math.min(
          110 /
            logo.width,
          34 /
            logo.height
        );

      page.drawImage(
        logo,
        {
          x: MARGIN,
          y:
            PAGE_HEIGHT -
            55,
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
        x: 232,
        y:
          PAGE_HEIGHT -
          35,
        size: 9.5,
        font: bold,
        color: COLOR_DARK,
      }
    );

    page.drawText(
      `N.º ${numeroVisible}`,
      {
        x: 463,
        y:
          PAGE_HEIGHT -
          50,
        size: 8.3,
        font: bold,
        color: COLOR_ORANGE,
      }
    );

    page.drawText(
      nombreEmpresa,
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          68,
        size: 6.5,
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
            78,
          size: 5.3,
          font: regular,
          color: COLOR_MUTED,
        }
      );
    }

    page.drawLine({
      start: {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          87,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y:
          PAGE_HEIGHT -
          87,
      },
      thickness: 0.7,
      color: COLOR_BLUE,
    });

    let y =
      PAGE_HEIGHT -
      108;

    /*
     * ==========================================
     * DATOS DE VISITA
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "DATOS DE LA VISITA",
      y,
      bold,
    });

    y -= 22;

    campo({
      page,
      etiqueta:
        "Fecha:",
      x: MARGIN + 5,
      y,
      ancho: 130,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Hora:",
      x: 180,
      y,
      ancho: 100,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Cliente / empresa:",
      x: 300,
      y,
      ancho: 255,
      bold,
    });

    y -= 17;

    campo({
      page,
      etiqueta:
        "Dirección:",
      x: MARGIN + 5,
      y,
      ancho: 300,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Localidad:",
      x: 355,
      y,
      ancho: 200,
      bold,
    });

    y -= 17;

    campo({
      page,
      etiqueta:
        "Teléfono:",
      x: MARGIN + 5,
      y,
      ancho: 185,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Sector / ubicación:",
      x: 245,
      y,
      ancho: 310,
      bold,
    });

    y -= 25;

    /*
     * ==========================================
     * TIPO DE VISITA
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "TIPO DE VISITA",
      y,
      bold,
    });

    y -= 21;

    opcion({
      page,
      etiqueta:
        "Consulta técnica",
      x: MARGIN + 5,
      y,
      regular,
    });

    opcion({
      page,
      etiqueta:
        "Relevamiento para instalación",
      x: 185,
      y,
      regular,
    });

    opcion({
      page,
      etiqueta:
        "Otro:",
      x: 390,
      y,
      regular,
    });

    page.drawLine({
      start: {
        x: 434,
        y: y - 1,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y: y - 1,
      },
      thickness: 0.45,
      color: COLOR_BORDER,
    });

    y -= 25;

    /*
     * ==========================================
     * IDENTIFICACIÓN DEL EQUIPO
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "IDENTIFICACIÓN DEL EQUIPO",
      y,
      bold,
    });

    y -= 21;

    page.drawText(
      "Tipo:",
      {
        x: MARGIN + 5,
        y,
        size: 6.4,
        font: bold,
        color: COLOR_TEXT,
      }
    );

    const tipos = [
      {
        x: 70,
        t: "Split",
      },
      {
        x: 120,
        t: "Piso techo",
      },
      {
        x: 205,
        t: "Cassette",
      },
      {
        x: 278,
        t: "Ventana",
      },
      {
        x: 350,
        t: "Otro",
      },
    ];

    tipos.forEach(
      (item) => {
        opcion({
          page,
          etiqueta:
            item.t,
          x: item.x,
          y,
          regular,
        });
      }
    );

    y -= 17;

    campo({
      page,
      etiqueta:
        "Marca:",
      x: MARGIN + 5,
      y,
      ancho: 160,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Modelo:",
      x: 205,
      y,
      ancho: 155,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Capacidad:",
      x: 380,
      y,
      ancho: 175,
      bold,
    });

    y -= 17;

    campo({
      page,
      etiqueta:
        "Serie / inventario:",
      x: MARGIN + 5,
      y,
      ancho: 225,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Refrigerante:",
      x: 285,
      y,
      ancho: 165,
      bold,
    });

    opcion({
      page,
      etiqueta:
        "Sin etiqueta",
      x: 468,
      y,
      regular,
    });

    y -= 25;

    /*
     * ==========================================
     * CONSULTA TÉCNICA
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "CONSULTA TÉCNICA",
      y,
      bold,
    });

    y -= 20;

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
          "Corta",
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
          "Pierde agua",
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
      filaTablaDiagnostico({
        page,
        etiqueta:
          control.etiqueta,
        opciones:
          control.opciones,
        y,
        regular,
        bold,
      });

      y -= 13;
    }

    y -= 4;

    /*
     * ==========================================
     * MEDICIONES
     * ==========================================
     */

    campo({
      page,
      etiqueta:
        "Tensión:",
      x: MARGIN + 5,
      y,
      ancho: 105,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Consumo:",
      x: 160,
      y,
      ancho: 105,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Presión:",
      x: 290,
      y,
      ancho: 105,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Temp. entrada:",
      x: 420,
      y,
      ancho: 135,
      bold,
    });

    y -= 17;

    campo({
      page,
      etiqueta:
        "Temp. salida:",
      x: MARGIN + 5,
      y,
      ancho: 150,
      bold,
    });

    y -= 25;

    /*
     * ==========================================
     * RELEVAMIENTO PARA INSTALACIÓN
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "RELEVAMIENTO PARA INSTALACIÓN",
      y,
      bold,
    });

    y -= 20;

    campo({
      page,
      etiqueta:
        "Equipo / capacidad estimada:",
      x: MARGIN + 5,
      y,
      ancho: 240,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Interconexión aprox.:",
      x: 310,
      y,
      ancho: 245,
      bold,
    });

    y -= 17;

    campo({
      page,
      etiqueta:
        "Ubicación evaporador:",
      x: MARGIN + 5,
      y,
      ancho: 245,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Ubicación condensador:",
      x: 305,
      y,
      ancho: 250,
      bold,
    });

    y -= 17;

    const instalacion1 = [
      {
        x: MARGIN + 5,
        t:
          "Desagüe disponible",
      },
      {
        x: 160,
        t:
          "Alimentación eléctrica",
      },
      {
        x: 325,
        t:
          "Perforación",
      },
      {
        x: 420,
        t:
          "Ménsulas / base",
      },
    ];

    instalacion1.forEach(
      (item) => {
        opcion({
          page,
          etiqueta:
            item.t,
          x: item.x,
          y,
          regular,
        });
      }
    );

    y -= 16;

    const instalacion2 = [
      {
        x: MARGIN + 5,
        t:
          "Canaleta",
      },
      {
        x: 120,
        t:
          "Trabajo en altura",
      },
      {
        x: 250,
        t:
          "Acceso complejo",
      },
      {
        x: 385,
        t:
          "Requiere andamio / elevación",
      },
    ];

    instalacion2.forEach(
      (item) => {
        opcion({
          page,
          etiqueta:
            item.t,
          x: item.x,
          y,
          regular,
        });
      }
    );

    y -= 24;

    /*
     * ==========================================
     * CONCLUSIÓN
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "CONCLUSIÓN TÉCNICA",
      y,
      bold,
    });

    y -= 20;

    const conclusiones = [
      {
        x:
          MARGIN +
          5,
        t:
          "Operativo",
      },
      {
        x: 105,
        t:
          "Mantenimiento",
      },
      {
        x: 215,
        t:
          "Reparación",
      },
      {
        x: 305,
        t:
          "Presupuestar",
      },
      {
        x: 405,
        t:
          "Reemplazo",
      },
      {
        x: 495,
        t:
          "Baja técnica",
      },
    ];

    conclusiones.forEach(
      (item) => {
        opcion({
          page,
          etiqueta:
            item.t,
          x: item.x,
          y,
          regular,
        });
      }
    );

    y -= 21;

    areaLineas({
      page,
      titulo:
        "Descripción / observaciones técnicas",
      yTop: y,
      alto: 50,
      bold,
    });

    y -= 59;

    /*
     * ==========================================
     * SEGUIMIENTO
     * ==========================================
     */

    const seguimiento = [
      {
        x:
          MARGIN +
          5,
        t:
          "Fotografías",
      },
      {
        x: 130,
        t:
          "Segunda visita",
      },
      {
        x: 245,
        t:
          "Generar presupuesto",
      },
      {
        x: 390,
        t:
          "Sin intervención",
      },
    ];

    seguimiento.forEach(
      (item) => {
        opcion({
          page,
          etiqueta:
            item.t,
          x: item.x,
          y,
          regular,
        });
      }
    );

    y -= 26;

    /*
     * ==========================================
     * FIRMAS
     * ==========================================
     */

    tituloSeccion({
      page,
      titulo:
        "FIRMAS Y RESPONSABLES",
      y,
      bold,
    });

    y -= 21;

    campo({
      page,
      etiqueta:
        "Responsable del lugar:",
      x: MARGIN + 5,
      y,
      ancho: 245,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Cargo:",
      x: 305,
      y,
      ancho: 115,
      bold,
    });

    campo({
      page,
      etiqueta:
        "DNI:",
      x: 445,
      y,
      ancho: 110,
      bold,
    });

    y -= 18;

    campo({
      page,
      etiqueta:
        "Firma responsable:",
      x: MARGIN + 5,
      y,
      ancho: 245,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Técnico:",
      x: 305,
      y,
      ancho: 250,
      bold,
    });

    y -= 18;

    campo({
      page,
      etiqueta:
        "Matrícula:",
      x: 305,
      y,
      ancho: 130,
      bold,
    });

    campo({
      page,
      etiqueta:
        "Firma y sello:",
      x: 445,
      y,
      ancho: 110,
      bold,
    });

    /*
     * ==========================================
     * PIE / VALIDEZ
     * ==========================================
     */

    page.drawLine({
      start: {
        x: MARGIN,
        y: 54,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y: 54,
      },
      thickness: 0.55,
      color: COLOR_BORDER,
    });

    page.drawText(
      "Esta ficha corresponde a una revisión técnica preliminar y no constituye presupuesto ni factura.",
      {
        x: MARGIN,
        y: 42,
        size: 5.7,
        font: regular,
        color: COLOR_MUTED,
      }
    );

    page.drawText(
      "Este documento carece de validez si no cuenta con la firma y sello del técnico responsable.",
      {
        x: MARGIN,
        y: 31,
        size: 5.7,
        font: bold,
        color: COLOR_DARK,
      }
    );

    page.drawText(
      "Cualquier alteración, enmienda o modificación posterior invalida el documento.",
      {
        x: MARGIN,
        y: 20,
        size: 5.7,
        font: bold,
        color: COLOR_DARK,
      }
    );

    page.drawText(
      `Ficha N.º ${numeroVisible}`,
      {
        x:
          PAGE_WIDTH -
          117,
        y: 20,
        size: 5.7,
        font: regular,
        color: COLOR_MUTED,
      }
    );
  }

  return await pdf.save();
}
