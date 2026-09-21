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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 28;

const COLOR_AZUL = rgb(
  0.12,
  0.31,
  0.47
);

const COLOR_CELESTE = rgb(
  0.93,
  0.96,
  0.98
);

const COLOR_GRIS = rgb(
  0.35,
  0.35,
  0.35
);

const COLOR_NEGRO = rgb(
  0.14,
  0.14,
  0.14
);

const COLOR_NARANJA = rgb(
  0.85,
  0.47,
  0.09
);

const COLOR_LINEA = rgb(
  0.72,
  0.75,
  0.78
);

const COLOR_LINEA_SUAVE = rgb(
  0.88,
  0.89,
  0.9
);

const COLOR_ROJO = rgb(
  0.55,
  0.18,
  0.18
);

const EMPRESA_DEFAULT: EmpresaFichaRevision = {
  nombre:
    "Enfri.Ar Refrigeración",
  cuit:
    "20-93431894-4",
  direccion:
    "Francia 2559 Moreno, Bs. As.",
  telefono:
    "11-3847-3222",
  email:
    "enfri.ar.refrigeracion@gmail.com",
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
      String(
        empresa?.nombre ??
          EMPRESA_DEFAULT.nombre
      ).trim() ||
      EMPRESA_DEFAULT.nombre,

    cuit:
      String(
        empresa?.cuit ??
          EMPRESA_DEFAULT.cuit
      ).trim() ||
      EMPRESA_DEFAULT.cuit,

    direccion:
      String(
        empresa?.direccion ??
          EMPRESA_DEFAULT.direccion
      ).trim() ||
      EMPRESA_DEFAULT.direccion,

    telefono:
      String(
        empresa?.telefono ??
          EMPRESA_DEFAULT.telefono
      ).trim() ||
      EMPRESA_DEFAULT.telefono,

    email:
      String(
        empresa?.email ??
          EMPRESA_DEFAULT.email
      ).trim() ||
      EMPRESA_DEFAULT.email,
  };
}

async function cargarLogo(
  pdfDoc: PDFDocument
) {
  try {
    const ruta = path.join(
      process.cwd(),
      "public",
      "logo-enfri-ar.png"
    );

    const archivo =
      await readFile(
        /* turbopackIgnore: true */
        ruta
      );

    return await pdfDoc.embedPng(
      archivo
    );
  } catch {
    return null;
  }
}

function escribirTexto(
  page: PDFPage,
  font: PDFFont,
  valor: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(
    valor,
    {
      x,
      y,
      size,
      font,
      color,
    }
  );
}

function escribirTextoNegrita(
  page: PDFPage,
  fontBold: PDFFont,
  valor: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(
    valor,
    {
      x,
      y,
      size,
      font:
        fontBold,
      color,
    }
  );
}

function linea(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  grosor = 0.6,
  color = COLOR_LINEA
) {
  page.drawLine({
    start: {
      x: x1,
      y: y1,
    },
    end: {
      x: x2,
      y: y2,
    },
    thickness:
      grosor,
    color,
  });
}

function tituloSeccion(
  ctx: ContextoDibujo,
  titulo: string
) {
  const {
    page,
    fontBold,
    width,
    marginX,
  } = ctx;

  const alto = 17;

  const yBase =
    ctx.y -
    alto;

  page.drawRectangle({
    x:
      marginX,
    y:
      yBase,
    width:
      width -
      marginX *
        2,
    height:
      alto,
    color:
      COLOR_CELESTE,
    borderColor:
      COLOR_LINEA,
    borderWidth:
      0.7,
  });

  escribirTextoNegrita(
    page,
    fontBold,
    titulo.toUpperCase(),
    marginX + 7,
    yBase + 5,
    7.2,
    COLOR_AZUL
  );

  ctx.y =
    yBase -
    7;
}

function campoLinea({
  ctx,
  etiqueta,
  x,
  y,
  xFinal,
  size = 6.4,
}: {
  ctx: ContextoDibujo;
  etiqueta: string;
  x: number;
  y: number;
  xFinal: number;
  size?: number;
}) {
  const {
    page,
    fontBold,
  } = ctx;

  escribirTextoNegrita(
    page,
    fontBold,
    etiqueta,
    x,
    y,
    size,
    COLOR_GRIS
  );

  const anchoTexto =
    fontBold.widthOfTextAtSize(
      etiqueta,
      size
    );

  linea(
    page,
    x +
      anchoTexto +
      5,
    y - 1,
    xFinal,
    y - 1,
    0.55
  );
}

function casillero(
  ctx: ContextoDibujo,
  x: number,
  y: number
) {
  ctx.page.drawRectangle({
    x,
    y:
      y - 1,
    width: 8,
    height: 8,
    borderColor:
      COLOR_GRIS,
    borderWidth:
      0.8,
  });
}

function opcion({
  ctx,
  etiqueta,
  x,
  y,
  size = 6.3,
}: {
  ctx: ContextoDibujo;
  etiqueta: string;
  x: number;
  y: number;
  size?: number;
}) {
  casillero(
    ctx,
    x,
    y
  );

  escribirTexto(
    ctx.page,
    ctx.font,
    etiqueta,
    x + 12,
    y,
    size,
    COLOR_NEGRO
  );
}

function bloqueConsulta({
  ctx,
  x,
  y,
  ancho,
  titulo,
  opciones,
}: {
  ctx: ContextoDibujo;
  x: number;
  y: number;
  ancho: number;
  titulo: string;
  opciones: string[];
}) {
  escribirTextoNegrita(
    ctx.page,
    ctx.fontBold,
    titulo,
    x,
    y,
    6.35,
    COLOR_GRIS
  );

  const yOpciones =
    y - 14;

  let posiciones:
    number[];

  if (
    opciones.length ===
    2
  ) {
    posiciones = [
      x,
      x +
        ancho /
          2,
    ];
  } else if (
    opciones.length ===
    3
  ) {
    posiciones = [
      x,
      x +
        ancho /
          3,
      x +
        (
          ancho *
          2
        ) /
          3,
    ];
  } else {
    posiciones = [
      x,
      x +
        ancho /
          4,
      x +
        ancho /
          2,
      x +
        (
          ancho *
          3
        ) /
          4,
    ];
  }

  opciones.forEach(
    (
      item,
      indice
    ) => {
      opcion({
        ctx,
        etiqueta:
          item,
        x:
          posiciones[
            indice
          ],
        y:
          yOpciones,
        size:
          6.1,
      });
    }
  );
}

function dibujarEncabezado(
  ctx: ContextoDibujo,
  numero: number,
  empresa: EmpresaFichaRevision,
  logo:
    | Awaited<
        ReturnType<
          typeof cargarLogo
        >
      >
    | null
) {
  const {
    page,
    font,
    fontBold,
    width,
    height,
    marginX,
  } = ctx;

  const top =
    height -
    23;

  if (logo) {
    const escala =
      Math.min(
        60 /
          logo.width,
        26 /
          logo.height
      );

    page.drawImage(
      logo,
      {
        x:
          marginX,
        y:
          top -
          logo.height *
            escala +
          2,
        width:
          logo.width *
          escala,
        height:
          logo.height *
          escala,
      }
    );
  } else {
    escribirTextoNegrita(
      page,
      fontBold,
      "Enfri.Ar",
      marginX,
      top - 3,
      14,
      COLOR_AZUL
    );

    escribirTexto(
      page,
      font,
      "Refrigeración",
      marginX,
      top - 14,
      7,
      COLOR_GRIS
    );
  }

  escribirTextoNegrita(
    page,
    fontBold,
    "FICHA DE REVISIÓN TÉCNICA",
    width /
      2 -
      77,
    top - 1,
    9.1,
    COLOR_NEGRO
  );

  escribirTextoNegrita(
    page,
    fontBold,
    `N° ${String(
      numero
    ).padStart(
      6,
      "0"
    )}`,
    width -
      marginX -
      73,
    top - 1,
    8,
    COLOR_NARANJA
  );

  escribirTexto(
    page,
    font,
    `${empresa.nombre} | CUIT: ${empresa.cuit}`,
    marginX,
    top - 27,
    5.6,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    `${empresa.direccion} | Tel: ${empresa.telefono} | ${empresa.email}`,
    marginX,
    top - 37,
    5.35,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    top - 45,
    width -
      marginX,
    top - 45,
    0.9,
    rgb(
      0.66,
      0.76,
      0.85
    )
  );

  ctx.y =
    top -
    56;
}

function dibujarContenido(
  ctx: ContextoDibujo
) {
  const {
    page,
    font,
    fontBold,
    width,
    marginX,
  } = ctx;

  /*
   * ==========================================
   * DATOS DE LA VISITA
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Datos de la visita"
  );

  campoLinea({
    ctx,
    etiqueta:
      "Fecha:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      130,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Hora:",
    x:
      marginX +
      155,
    y:
      ctx.y,
    xFinal:
      marginX +
      245,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Cliente / empresa:",
    x:
      marginX +
      275,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 18;

  campoLinea({
    ctx,
    etiqueta:
      "Dirección:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      300,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Localidad:",
    x:
      marginX +
      325,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 18;

  campoLinea({
    ctx,
    etiqueta:
      "Teléfono:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      190,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Sector / ubicación:",
    x:
      marginX +
      220,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 21;

  /*
   * ==========================================
   * TIPO DE VISITA
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Tipo de visita"
  );

  opcion({
    ctx,
    etiqueta:
      "Consulta técnica",
    x:
      marginX +
      10,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Relevamiento para instalación",
    x:
      marginX +
      190,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Otro:",
    x:
      marginX +
      420,
    y:
      ctx.y,
  });

  linea(
    page,
    marginX +
      463,
    ctx.y -
      1,
    width -
      marginX,
    ctx.y -
      1,
    0.55
  );

  ctx.y -= 21;

  /*
   * ==========================================
   * IDENTIFICACIÓN DEL EQUIPO
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Identificación del equipo"
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "Tipo:",
    marginX,
    ctx.y,
    6.4,
    COLOR_GRIS
  );

  opcion({
    ctx,
    etiqueta:
      "Split",
    x:
      marginX +
      44,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Piso techo",
    x:
      marginX +
      105,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Cassette",
    x:
      marginX +
      200,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Ventana",
    x:
      marginX +
      285,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Otro",
    x:
      marginX +
      375,
    y:
      ctx.y,
  });

  ctx.y -= 18;

  campoLinea({
    ctx,
    etiqueta:
      "Marca:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      165,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Modelo:",
    x:
      marginX +
      185,
    y:
      ctx.y,
    xFinal:
      marginX +
      345,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Capacidad:",
    x:
      marginX +
      365,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 18;

  campoLinea({
    ctx,
    etiqueta:
      "Refrigerante:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      235,
  });

  opcion({
    ctx,
    etiqueta:
      "Sin etiqueta",
    x:
      marginX +
      265,
    y:
      ctx.y,
  });

  ctx.y -= 21;

  /*
   * ==========================================
   * CONSULTA TÉCNICA
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Consulta técnica"
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "Control y diagnóstico del equipo",
    marginX + 5,
    ctx.y,
    6.8,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    ctx.y -
      6,
    width -
      marginX,
    ctx.y -
      6,
    0.5,
    rgb(
      0.78,
      0.8,
      0.82
    )
  );

  ctx.y -= 17;

  /*
   * Consulta técnica organizada
   * en dos columnas.
   */

  const separacionConsulta =
    18;

  const anchoColumna =
    (
      width -
      marginX *
        2 -
      separacionConsulta
    ) /
    2;

  const izquierdaX =
    marginX +
    5;

  const derechaX =
    marginX +
    anchoColumna +
    separacionConsulta +
    5;

  const paresConsulta = [
    {
      izquierda: {
        titulo:
          "Equipo enciende",
        opciones: [
          "Sí",
          "No",
        ],
      },
      derecha: {
        titulo:
          "Refrigerante",
        opciones: [
          "Normal",
          "Falta",
          "Posible fuga",
        ],
      },
    },
    {
      izquierda: {
        titulo:
          "Evaporador",
        opciones: [
          "Correcto",
          "Sucio",
          "Dañado",
        ],
      },
      derecha: {
        titulo:
          "Drenaje",
        opciones: [
          "Correcto",
          "Obstruido",
          "Pérdida",
        ],
      },
    },
    {
      izquierda: {
        titulo:
          "Condensador",
        opciones: [
          "Correcto",
          "Sucio",
          "Dañado",
        ],
      },
      derecha: {
        titulo:
          "Instalación eléctrica",
        opciones: [
          "Correcta",
          "Revisar",
          "Riesgosa",
        ],
      },
    },
    {
      izquierda: {
        titulo:
          "Forzador evaporador",
        opciones: [
          "Funciona",
          "No funciona",
          "Ruidoso",
        ],
      },
      derecha: {
        titulo:
          "Filtros",
        opciones: [
          "Correctos",
          "Sucios",
          "Deteriorados",
        ],
      },
    },
    {
      izquierda: {
        titulo:
          "Forzador condensador",
        opciones: [
          "Funciona",
          "No funciona",
          "Ruidoso",
        ],
      },
      derecha: {
        titulo:
          "Motocompresor",
        opciones: [
          "Funciona",
          "No arranca",
          "Corta",
          "Ruidoso",
        ],
      },
    },
  ];

  paresConsulta.forEach(
    (par) => {
      const yFila =
        ctx.y;

      bloqueConsulta({
        ctx,
        x:
          izquierdaX,
        y:
          yFila,
        ancho:
          anchoColumna -
          10,
        titulo:
          par.izquierda
            .titulo,
        opciones:
          par.izquierda
            .opciones,
      });

      bloqueConsulta({
        ctx,
        x:
          derechaX,
        y:
          yFila,
        ancho:
          anchoColumna -
          10,
        titulo:
          par.derecha
            .titulo,
        opciones:
          par.derecha
            .opciones,
      });

      linea(
        page,
        marginX,
        yFila -
          24,
        width -
          marginX,
        yFila -
          24,
        0.25,
        COLOR_LINEA_SUAVE
      );

      ctx.y -= 30;
    }
  );

  /*
   * Mediciones en una sola fila.
   */

  campoLinea({
    ctx,
    etiqueta:
      "Tensión:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      95,
    size:
      6.1,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Consumo:",
    x:
      marginX +
      110,
    y:
      ctx.y,
    xFinal:
      marginX +
      205,
    size:
      6.1,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Presión:",
    x:
      marginX +
      220,
    y:
      ctx.y,
    xFinal:
      marginX +
      315,
    size:
      6.1,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Temp. entrada:",
    x:
      marginX +
      330,
    y:
      ctx.y,
    xFinal:
      marginX +
      440,
    size:
      6.1,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Temp. salida:",
    x:
      marginX +
      455,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
    size:
      6.1,
  });

  ctx.y -= 23;

  /*
   * ==========================================
   * RELEVAMIENTO PARA INSTALACIÓN
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Relevamiento para instalación"
  );

  campoLinea({
    ctx,
    etiqueta:
      "Capacidad estimada:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      245,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Interconexión aprox.:",
    x:
      marginX +
      285,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 18;

  campoLinea({
    ctx,
    etiqueta:
      "Ubicación evaporador:",
    x:
      marginX,
    y:
      ctx.y,
    xFinal:
      marginX +
      245,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Ubicación condensador:",
    x:
      marginX +
      285,
    y:
      ctx.y,
    xFinal:
      width -
      marginX,
  });

  ctx.y -= 19;

  opcion({
    ctx,
    etiqueta:
      "Desagüe",
    x:
      marginX,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Alimentación eléctrica",
    x:
      marginX +
      120,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Perforación",
    x:
      marginX +
      280,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Ménsulas / base",
    x:
      marginX +
      390,
    y:
      ctx.y,
  });

  ctx.y -= 17;

  opcion({
    ctx,
    etiqueta:
      "Canaleta",
    x:
      marginX,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Trabajo en altura",
    x:
      marginX +
      150,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Acceso especial",
    x:
      marginX +
      330,
    y:
      ctx.y,
  });

  ctx.y -= 21;

  /*
   * ==========================================
   * CONCLUSIÓN TÉCNICA
   * ==========================================
   */

  tituloSeccion(
    ctx,
    "Conclusión técnica"
  );

  opcion({
    ctx,
    etiqueta:
      "Operativo",
    x:
      marginX,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Mantenimiento",
    x:
      marginX +
      95,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Reparación",
    x:
      marginX +
      205,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Presupuestar",
    x:
      marginX +
      300,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Reemplazo",
    x:
      marginX +
      405,
    y:
      ctx.y,
  });

  opcion({
    ctx,
    etiqueta:
      "Baja técnica",
    x:
      marginX +
      495,
    y:
      ctx.y,
  });

  ctx.y -= 22;

  /*
   * ==========================================
   * OBSERVACIONES
   * ==========================================
   */

  escribirTextoNegrita(
    page,
    fontBold,
    "Descripción / observaciones técnicas",
    marginX,
    ctx.y,
    6.7,
    COLOR_GRIS
  );

  ctx.y -= 11;

  for (
    let indice = 0;
    indice < 3;
    indice += 1
  ) {
    linea(
      page,
      marginX,
      ctx.y,
      width -
        marginX,
      ctx.y,
      0.6
    );

    ctx.y -= 17;
  }

  ctx.y -= 5;

  /*
   * ==========================================
   * RESPONSABLE Y TÉCNICO
   * ==========================================
   */

  const separacionFirmas =
    12;

  const anchoCaja =
    (
      width -
      marginX *
        2 -
      separacionFirmas
    ) /
    2;

  const cajaIzquierdaX =
    marginX;

  const cajaDerechaX =
    marginX +
    anchoCaja +
    separacionFirmas;

  const cajaTop =
    ctx.y;

  const altoCaja =
    82;

  const cajaBottom =
    cajaTop -
    altoCaja;

  [
    cajaIzquierdaX,
    cajaDerechaX,
  ].forEach(
    (x) => {
      page.drawRectangle({
        x,
        y:
          cajaBottom,
        width:
          anchoCaja,
        height:
          altoCaja,
        borderColor:
          rgb(
            0.78,
            0.81,
            0.83
          ),
        borderWidth:
          0.7,
      });

      page.drawRectangle({
        x,
        y:
          cajaTop -
          18,
        width:
          anchoCaja,
        height:
          18,
        color:
          COLOR_CELESTE,
      });
    }
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "RESPONSABLE DEL ESTABLECIMIENTO",
    cajaIzquierdaX +
      7,
    cajaTop -
      12,
    6.45,
    COLOR_AZUL
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "TÉCNICO RESPONSABLE",
    cajaDerechaX +
      7,
    cajaTop -
      12,
    6.45,
    COLOR_AZUL
  );

  let firmaY =
    cajaTop -
    32;

  campoLinea({
    ctx,
    etiqueta:
      "Nombre:",
    x:
      cajaIzquierdaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaIzquierdaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Nombre:",
    x:
      cajaDerechaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaDerechaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  firmaY -= 16;

  campoLinea({
    ctx,
    etiqueta:
      "Cargo:",
    x:
      cajaIzquierdaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaIzquierdaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Matrícula:",
    x:
      cajaDerechaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaDerechaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  firmaY -= 16;

  campoLinea({
    ctx,
    etiqueta:
      "DNI:",
    x:
      cajaIzquierdaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaIzquierdaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Firma:",
    x:
      cajaDerechaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaDerechaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  firmaY -= 16;

  campoLinea({
    ctx,
    etiqueta:
      "Firma:",
    x:
      cajaIzquierdaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaIzquierdaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Sello:",
    x:
      cajaDerechaX +
      8,
    y:
      firmaY,
    xFinal:
      cajaDerechaX +
      anchoCaja -
      8,
    size:
      6.2,
  });

  /*
   * ==========================================
   * PIE DE VALIDEZ
   * ==========================================
   */

  escribirTextoNegrita(
    page,
    fontBold,
    "Este documento carece de validez si no cuenta con la firma y sello del técnico responsable.",
    marginX,
    33,
    5.5,
    COLOR_ROJO
  );

  escribirTexto(
    page,
    font,
    "Cualquier alteración, enmienda o modificación posterior invalida el documento.",
    marginX,
    23,
    5.2,
    COLOR_ROJO
  );

  escribirTexto(
    page,
    font,
    "Esta ficha corresponde a una revisión técnica preliminar y no constituye presupuesto ni factura.",
    marginX,
    13,
    5,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    "Pág. 1 de 1",
    width -
      marginX -
      36,
    13,
    5,
    COLOR_GRIS
  );
}

export async function generarFichaRevisionPdf(
  input: GenerarFichaRevisionPdfInput
): Promise<Uint8Array> {
  const numeroInicial =
    Number(
      input.numeroInicial ||
        0
    );

  const cantidad =
    Number(
      input.cantidad ||
        0
    );

  if (
    !Number.isFinite(
      numeroInicial
    ) ||
    numeroInicial <= 0
  ) {
    throw new Error(
      "El número inicial no es válido."
    );
  }

  if (
    !Number.isFinite(
      cantidad
    ) ||
    cantidad <= 0
  ) {
    throw new Error(
      "La cantidad de fichas no es válida."
    );
  }

  const empresa =
    normalizarEmpresa(
      input.empresa
    );

  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const fontBold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const logo =
    await cargarLogo(
      pdfDoc
    );

  for (
    let indice = 0;
    indice < cantidad;
    indice += 1
  ) {
    const page =
      pdfDoc.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    const {
      width,
      height,
    } =
      page.getSize();

    const ctx: ContextoDibujo = {
      page,
      font,
      fontBold,
      width,
      height,
      marginX:
        MARGIN_X,
      y:
        height -
        20,
    };

    dibujarEncabezado(
      ctx,
      numeroInicial +
        indice,
      empresa,
      logo
    );

    dibujarContenido(
      ctx
    );
  }

  return await pdfDoc.save();
}
