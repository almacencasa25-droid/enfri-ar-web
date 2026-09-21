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
  0.1,
  0.31,
  0.52
);

const COLOR_CELESTE = rgb(
  0.93,
  0.96,
  0.99
);

const COLOR_GRIS = rgb(
  0.35,
  0.35,
  0.35
);

const COLOR_NEGRO = rgb(
  0.12,
  0.12,
  0.12
);

const COLOR_NARANJA = rgb(
  0.88,
  0.48,
  0.12
);

const COLOR_LINEA = rgb(
  0.7,
  0.72,
  0.75
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
      await readFile(ruta);

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
    thickness: grosor,
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
    ctx.y - alto;

  page.drawRectangle({
    x: marginX,
    y: yBase,
    width:
      width -
      marginX * 2,
    height: alto,
    color: COLOR_CELESTE,
    borderColor:
      rgb(
        0.8,
        0.85,
        0.9
      ),
    borderWidth: 0.7,
  });

  escribirTextoNegrita(
    page,
    fontBold,
    titulo.toUpperCase(),
    marginX + 7,
    yBase + 5,
    7.3,
    COLOR_AZUL
  );

  ctx.y =
    yBase - 9;
}

function campoLinea({
  ctx,
  etiqueta,
  x,
  y,
  ancho,
}: {
  ctx: ContextoDibujo;
  etiqueta: string;
  x: number;
  y: number;
  ancho: number;
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
    y + 2,
    6.4,
    COLOR_GRIS
  );

  const etiquetaWidth =
    fontBold.widthOfTextAtSize(
      etiqueta,
      6.4
    );

  linea(
    page,
    x +
      etiquetaWidth +
      5,
    y + 1,
    x + ancho,
    y + 1
  );
}

function checkbox({
  ctx,
  etiqueta,
  x,
  y,
}: {
  ctx: ContextoDibujo;
  etiqueta: string;
  x: number;
  y: number;
}) {
  const {
    page,
    font,
  } = ctx;

  page.drawRectangle({
    x,
    y,
    width: 8,
    height: 8,
    borderColor:
      COLOR_GRIS,
    borderWidth: 0.8,
  });

  escribirTexto(
    page,
    font,
    etiqueta,
    x + 13,
    y + 1,
    6.3,
    COLOR_NEGRO
  );
}

function filaConsulta({
  ctx,
  nombre,
  opciones,
}: {
  ctx: ContextoDibujo;
  nombre: string;
  opciones: string[];
}) {
  const {
    page,
    fontBold,
    marginX,
    width,
  } = ctx;

  const y =
    ctx.y;

  escribirTextoNegrita(
    page,
    fontBold,
    nombre,
    marginX + 5,
    y + 1,
    6.35,
    COLOR_GRIS
  );

  /*
   * Las opciones se distribuyen
   * uniformemente según cantidad.
   */
  const inicio =
    marginX + 155;

  const final =
    width -
    marginX -
    8;

  const espacio =
    final -
    inicio;

  const paso =
    opciones.length > 1
      ? espacio /
        opciones.length
      : espacio;

  opciones.forEach(
    (
      item,
      indice
    ) => {
      checkbox({
        ctx,
        etiqueta:
          item,
        x:
          inicio +
          paso *
            indice,
        y,
      });
    }
  );

  linea(
    page,
    marginX,
    y - 6,
    width -
      marginX,
    y - 6,
    0.25,
    rgb(
      0.86,
      0.87,
      0.89
    )
  );

  ctx.y -= 17;
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
    height - 17;

  if (logo) {
    const escala =
      Math.min(
        58 /
          logo.width,
        25 /
          logo.height
      );

    page.drawImage(
      logo,
      {
        x: marginX,
        y:
          top -
          logo.height *
            escala,
        width:
          logo.width *
          escala,
        height:
          logo.height *
          escala,
      }
    );
  }

  escribirTextoNegrita(
    page,
    fontBold,
    "FICHA DE REVISIÓN TÉCNICA",
    width / 2 - 73,
    top - 10,
    8.4,
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
      58,
    top - 10,
    7.5,
    COLOR_NARANJA
  );

  escribirTexto(
    page,
    font,
    `${empresa.nombre} | CUIT: ${empresa.cuit}`,
    marginX,
    top - 34,
    5.6,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    `${empresa.direccion} | Tel: ${empresa.telefono} | ${empresa.email}`,
    marginX,
    top - 44,
    5.4,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    top - 52,
    width -
      marginX,
    top - 52,
    0.9,
    rgb(
      0.68,
      0.78,
      0.88
    )
  );

  ctx.y =
    top - 65;
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
   * ==========================
   * DATOS DE LA VISITA
   * ==========================
   */

  tituloSeccion(
    ctx,
    "Datos de la visita"
  );

  campoLinea({
    ctx,
    etiqueta:
      "Fecha:",
    x: marginX,
    y: ctx.y,
    ancho: 150,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Hora:",
    x: 180,
    y: ctx.y,
    ancho: 275,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Cliente / empresa:",
    x: 305,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 20;

  campoLinea({
    ctx,
    etiqueta:
      "Dirección:",
    x: marginX,
    y: ctx.y,
    ancho: 330,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Localidad:",
    x: 355,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 20;

  campoLinea({
    ctx,
    etiqueta:
      "Teléfono:",
    x: marginX,
    y: ctx.y,
    ancho: 210,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Sector / ubicación:",
    x: 245,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 25;

  /*
   * ==========================
   * TIPO DE VISITA
   * ==========================
   */

  tituloSeccion(
    ctx,
    "Tipo de visita"
  );

  checkbox({
    ctx,
    etiqueta:
      "Consulta técnica",
    x:
      marginX +
      10,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Relevamiento para instalación",
    x: 205,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Otro",
    x: 445,
    y: ctx.y,
  });

  linea(
    page,
    488,
    ctx.y + 1,
    width -
      marginX,
    ctx.y + 1
  );

  ctx.y -= 24;

  /*
   * ==========================
   * IDENTIFICACIÓN
   * ==========================
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
    ctx.y + 2,
    6.4,
    COLOR_GRIS
  );

  checkbox({
    ctx,
    etiqueta:
      "Split",
    x: 70,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Piso techo",
    x: 135,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Cassette",
    x: 235,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Ventana",
    x: 330,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Otro",
    x: 425,
    y: ctx.y,
  });

  ctx.y -= 20;

  campoLinea({
    ctx,
    etiqueta:
      "Marca:",
    x: marginX,
    y: ctx.y,
    ancho: 180,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Modelo:",
    x: 205,
    y: ctx.y,
    ancho: 365,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Capacidad:",
    x: 390,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 20;

  campoLinea({
    ctx,
    etiqueta:
      "Refrigerante:",
    x: marginX,
    y: ctx.y,
    ancho: 275,
  });

  checkbox({
    ctx,
    etiqueta:
      "Sin etiqueta",
    x: 315,
    y: ctx.y,
  });

  ctx.y -= 25;

  /*
   * ==========================
   * CONSULTA TÉCNICA
   * ==========================
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
    ctx.y + 2,
    6.7,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    ctx.y - 6,
    width -
      marginX,
    ctx.y - 6,
    0.5
  );

  ctx.y -= 19;

  filaConsulta({
    ctx,
    nombre:
      "Equipo enciende",
    opciones: [
      "Sí",
      "No",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Evaporador",
    opciones: [
      "Correcto",
      "Sucio",
      "Dañado",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Condensador",
    opciones: [
      "Correcto",
      "Sucio",
      "Dañado",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Forzador evaporador",
    opciones: [
      "Funciona",
      "No funciona",
      "Ruidoso",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Forzador condensador",
    opciones: [
      "Funciona",
      "No funciona",
      "Ruidoso",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Motocompresor",
    opciones: [
      "Funciona",
      "No arranca",
      "Corta",
      "Ruidoso",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Refrigerante",
    opciones: [
      "Normal",
      "Falta",
      "Posible fuga",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Drenaje",
    opciones: [
      "Correcto",
      "Obstruido",
      "Pérdida",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Instalación eléctrica",
    opciones: [
      "Correcta",
      "Revisar",
      "Riesgosa",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Filtros",
    opciones: [
      "Correctos",
      "Sucios",
      "Deteriorados",
    ],
  });

  ctx.y -= 2;

  /*
   * MEDICIONES EN UNA SOLA FILA
   */

  const mediciones = [
    {
      etiqueta:
        "Tensión:",
      x: marginX,
      ancho: 118,
    },
    {
      etiqueta:
        "Consumo:",
      x: 138,
      ancho: 230,
    },
    {
      etiqueta:
        "Presión:",
      x: 250,
      ancho: 340,
    },
    {
      etiqueta:
        "Temp. entrada:",
      x: 360,
      ancho: 465,
    },
    {
      etiqueta:
        "Temp. salida:",
      x: 480,
      ancho:
        width -
        marginX,
    },
  ];

  mediciones.forEach(
    (item) => {
      campoLinea({
        ctx,
        etiqueta:
          item.etiqueta,
        x: item.x,
        y: ctx.y,
        ancho:
          item.ancho,
      });
    }
  );

  ctx.y -= 27;

  /*
   * ==========================
   * INSTALACIÓN
   * ==========================
   */

  tituloSeccion(
    ctx,
    "Relevamiento para instalación"
  );

  campoLinea({
    ctx,
    etiqueta:
      "Capacidad estimada:",
    x: marginX,
    y: ctx.y,
    ancho: 275,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Interconexión aprox.:",
    x: 310,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 20;

  campoLinea({
    ctx,
    etiqueta:
      "Ubicación evaporador:",
    x: marginX,
    y: ctx.y,
    ancho: 275,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Ubicación condensador:",
    x: 310,
    y: ctx.y,
    ancho:
      width -
      marginX,
  });

  ctx.y -= 21;

  checkbox({
    ctx,
    etiqueta:
      "Desagüe",
    x: marginX,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Alimentación eléctrica",
    x: 125,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Perforación",
    x: 285,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Ménsulas / base",
    x: 390,
    y: ctx.y,
  });

  ctx.y -= 19;

  checkbox({
    ctx,
    etiqueta:
      "Canaleta",
    x: marginX,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Trabajo en altura",
    x: 150,
    y: ctx.y,
  });

  checkbox({
    ctx,
    etiqueta:
      "Acceso especial",
    x: 330,
    y: ctx.y,
  });

  ctx.y -= 26;

  /*
   * ==========================
   * CONCLUSIÓN
   * ==========================
   */

  tituloSeccion(
    ctx,
    "Conclusión técnica"
  );

  const conclusiones = [
    {
      etiqueta:
        "Operativo",
      x: marginX,
    },
    {
      etiqueta:
        "Mantenimiento",
      x: 112,
    },
    {
      etiqueta:
        "Reparación",
      x: 225,
    },
    {
      etiqueta:
        "Presupuestar",
      x: 325,
    },
    {
      etiqueta:
        "Reemplazo",
      x: 435,
    },
  ];

  conclusiones.forEach(
    (item) => {
      checkbox({
        ctx,
        etiqueta:
          item.etiqueta,
        x: item.x,
        y: ctx.y,
      });
    }
  );

  ctx.y -= 20;

  checkbox({
    ctx,
    etiqueta:
      "Baja técnica",
    x: marginX,
    y: ctx.y,
  });

  ctx.y -= 24;

  /*
   * ==========================
   * OBSERVACIONES
   * ==========================
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

  ctx.y -= 12;

  for (
    let indice = 0;
    indice < 5;
    indice += 1
  ) {
    linea(
      page,
      marginX,
      ctx.y,
      width -
        marginX,
      ctx.y
    );

    ctx.y -= 18;
  }

  ctx.y -= 6;

  /*
   * ==========================
   * FIRMAS
   * ==========================
   */

  const separacion =
    12;

  const anchoCaja =
    (
      width -
      marginX * 2 -
      separacion
    ) /
    2;

  const izquierdaX =
    marginX;

  const derechaX =
    marginX +
    anchoCaja +
    separacion;

  const altoCaja =
    108;

  const cajaTop =
    ctx.y;

  const cajaBottom =
    cajaTop -
    altoCaja;

  [
    izquierdaX,
    derechaX,
  ].forEach(
    (x) => {
      page.drawRectangle({
        x,
        y: cajaBottom,
        width:
          anchoCaja,
        height:
          altoCaja,
        borderColor:
          rgb(
            0.8,
            0.83,
            0.86
          ),
        borderWidth:
          0.7,
      });

      page.drawRectangle({
        x,
        y:
          cajaTop -
          20,
        width:
          anchoCaja,
        height: 20,
        color:
          COLOR_CELESTE,
      });
    }
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "RESPONSABLE DEL ESTABLECIMIENTO",
    izquierdaX + 7,
    cajaTop - 13,
    6.5,
    COLOR_AZUL
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "TÉCNICO RESPONSABLE",
    derechaX + 7,
    cajaTop - 13,
    6.5,
    COLOR_AZUL
  );

  let firmaY =
    cajaTop - 37;

  campoLinea({
    ctx,
    etiqueta:
      "Nombre:",
    x:
      izquierdaX +
      8,
    y:
      firmaY,
    ancho:
      izquierdaX +
      anchoCaja -
      8,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Nombre:",
    x:
      derechaX +
      8,
    y:
      firmaY,
    ancho:
      derechaX +
      anchoCaja -
      8,
  });

  firmaY -= 22;

  campoLinea({
    ctx,
    etiqueta:
      "Cargo:",
    x:
      izquierdaX +
      8,
    y:
      firmaY,
    ancho:
      izquierdaX +
      anchoCaja -
      8,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Matrícula:",
    x:
      derechaX +
      8,
    y:
      firmaY,
    ancho:
      derechaX +
      anchoCaja -
      8,
  });

  firmaY -= 22;

  campoLinea({
    ctx,
    etiqueta:
      "DNI:",
    x:
      izquierdaX +
      8,
    y:
      firmaY,
    ancho:
      izquierdaX +
      anchoCaja -
      8,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Firma:",
    x:
      derechaX +
      8,
    y:
      firmaY,
    ancho:
      derechaX +
      anchoCaja -
      8,
  });

  firmaY -= 22;

  campoLinea({
    ctx,
    etiqueta:
      "Firma:",
    x:
      izquierdaX +
      8,
    y:
      firmaY,
    ancho:
      izquierdaX +
      anchoCaja -
      8,
  });

  campoLinea({
    ctx,
    etiqueta:
      "Sello:",
    x:
      derechaX +
      8,
    y:
      firmaY,
    ancho:
      derechaX +
      anchoCaja -
      8,
  });

  /*
   * ==========================
   * PIE
   * ==========================
   */

  escribirTextoNegrita(
    page,
    fontBold,
    "Este documento carece de validez si no cuenta con la firma y sello del técnico responsable.",
    marginX,
    40,
    5.7,
    rgb(
      0.5,
      0.18,
      0.18
    )
  );

  escribirTexto(
    page,
    font,
    "Cualquier alteración, enmienda o modificación posterior invalida el documento.",
    marginX,
    29,
    5.4,
    rgb(
      0.5,
      0.18,
      0.18
    )
  );

  escribirTexto(
    page,
    font,
    "Esta ficha corresponde a una revisión técnica preliminar y no constituye presupuesto ni factura.",
    marginX,
    18,
    5.2,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    "Pág. 1 de 1",
    width -
      marginX -
      36,
    18,
    5.2,
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
