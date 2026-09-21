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

const MARGIN_X = 26;

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
  0.68,
  0.71,
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
  texto: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(
    texto,
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
  texto: string,
  x: number,
  y: number,
  size: number,
  color = COLOR_NEGRO
) {
  page.drawText(
    texto,
    {
      x,
      y,
      size,
      font: fontBold,
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
  grosor = 0.7,
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

  const alto = 16;

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
    marginX + 6,
    yBase + 5,
    7.1,
    COLOR_AZUL
  );

  ctx.y =
    yBase - 8;
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
    fontBold,
  } = ctx;

  const yy =
    y ?? ctx.y;

  escribirTextoNegrita(
    page,
    fontBold,
    label,
    x,
    yy + 2,
    6.3,
    COLOR_GRIS
  );

  linea(
    page,
    x + anchoLabel,
    yy + 1,
    x +
      anchoLabel +
      anchoLinea,
    yy + 1,
    0.6
  );
}

function checkbox(
  ctx: ContextoDibujo,
  x: number,
  y: number,
  label: string
) {
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
    label,
    x + 12,
    y + 1,
    6.25,
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
    font,
    fontBold,
    marginX,
  } = ctx;

  const y =
    ctx.y;

  const inicioOpciones =
    marginX + 142;

  const columnas = [
    inicioOpciones,
    inicioOpciones + 94,
    inicioOpciones + 188,
    inicioOpciones + 282,
  ];

  escribirTextoNegrita(
    page,
    fontBold,
    nombre,
    marginX + 4,
    y + 1,
    6.35,
    COLOR_GRIS
  );

  opciones
    .slice(
      0,
      4
    )
    .forEach(
      (
        opcion,
        indice
      ) => {
        checkbox(
          ctx,
          columnas[
            indice
          ],
          y,
          opcion
        );
      }
    );

  linea(
    page,
    marginX,
    y - 5,
    PAGE_WIDTH -
      marginX,
    y - 5,
    0.28,
    rgb(
      0.84,
      0.85,
      0.87
    )
  );

  ctx.y -= 16;
}

function observaciones(
  ctx: ContextoDibujo
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
    "Descripción / observaciones técnicas",
    marginX,
    ctx.y,
    6.6,
    COLOR_GRIS
  );

  ctx.y -= 11;

  for (
    let i = 0;
    i < 4;
    i += 1
  ) {
    linea(
      page,
      marginX,
      ctx.y,
      width - marginX,
      ctx.y,
      0.6
    );

    ctx.y -= 17;
  }
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
    height - 16;

  if (logo) {
    const escala =
      Math.min(
        55 /
          logo.width,
        23 /
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
  } else {
    escribirTextoNegrita(
      page,
      fontBold,
      "Enfri.Ar",
      marginX,
      top - 10,
      12,
      COLOR_AZUL
    );
  }

  escribirTextoNegrita(
    page,
    fontBold,
    "FICHA DE REVISIÓN TÉCNICA",
    width / 2 - 73,
    top - 9,
    8.2,
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
      54,
    top - 9,
    7.4,
    COLOR_NARANJA
  );

  escribirTexto(
    page,
    font,
    empresa.nombre,
    marginX,
    top - 30,
    5.8,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    `CUIT: ${empresa.cuit} | ${empresa.direccion} | Tel: ${empresa.telefono} | ${empresa.email}`,
    marginX,
    top - 39,
    5.4,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    top - 47,
    width - marginX,
    top - 47,
    0.9,
    rgb(
      0.68,
      0.78,
      0.88
    )
  );

  ctx.y =
    top - 59;
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

  const col1 =
    marginX;

  const col2 =
    187;

  const col3 =
    365;

  /*
   * DATOS DE LA VISITA
   */

  tituloSeccion(
    ctx,
    "Datos de la visita"
  );

  campoLinea(
    ctx,
    "Fecha:",
    col1,
    28,
    105
  );

  campoLinea(
    ctx,
    "Hora:",
    col2,
    25,
    75
  );

  campoLinea(
    ctx,
    "Cliente / empresa:",
    col3,
    72,
    130
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Dirección:",
    col1,
    42,
    225
  );

  campoLinea(
    ctx,
    "Localidad:",
    col3,
    45,
    135
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Teléfono:",
    col1,
    43,
    145
  );

  campoLinea(
    ctx,
    "Sector / ubicación:",
    260,
    72,
    235
  );

  ctx.y -= 23;

  /*
   * TIPO DE VISITA
   */

  tituloSeccion(
    ctx,
    "Tipo de visita"
  );

  checkbox(
    ctx,
    marginX + 8,
    ctx.y,
    "Consulta técnica"
  );

  checkbox(
    ctx,
    205,
    ctx.y,
    "Relevamiento para instalación"
  );

  checkbox(
    ctx,
    430,
    ctx.y,
    "Otro"
  );

  linea(
    page,
    474,
    ctx.y + 1,
    width - marginX,
    ctx.y + 1,
    0.6
  );

  ctx.y -= 22;

  /*
   * IDENTIFICACIÓN
   */

  tituloSeccion(
    ctx,
    "Identificación del equipo"
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "Tipo:",
    col1,
    ctx.y + 2,
    6.3,
    COLOR_GRIS
  );

  checkbox(
    ctx,
    70,
    ctx.y,
    "Split"
  );

  checkbox(
    ctx,
    130,
    ctx.y,
    "Piso techo"
  );

  checkbox(
    ctx,
    225,
    ctx.y,
    "Cassette"
  );

  checkbox(
    ctx,
    310,
    ctx.y,
    "Ventana"
  );

  checkbox(
    ctx,
    400,
    ctx.y,
    "Otro"
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Marca:",
    col1,
    31,
    135
  );

  campoLinea(
    ctx,
    "Modelo:",
    205,
    37,
    120
  );

  campoLinea(
    ctx,
    "Capacidad:",
    390,
    50,
    125
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Serie / inventario:",
    col1,
    74,
    175
  );

  campoLinea(
    ctx,
    "Refrigerante:",
    325,
    60,
    110
  );

  checkbox(
    ctx,
    505,
    ctx.y,
    "Sin etiqueta"
  );

  ctx.y -= 23;

  /*
   * CONSULTA TÉCNICA
   */

  tituloSeccion(
    ctx,
    "Consulta técnica"
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "Control y diagnóstico del equipo",
    marginX + 4,
    ctx.y + 2,
    6.7,
    COLOR_GRIS
  );

  linea(
    page,
    marginX,
    ctx.y - 5,
    width - marginX,
    ctx.y - 5,
    0.55,
    rgb(
      0.75,
      0.78,
      0.82
    )
  );

  ctx.y -= 17;

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
      "Congelado",
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
      "Obstruido",
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
      "Sin carga",
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
      "Pierde agua",
    ],
  });

  filaConsulta({
    ctx,
    nombre:
      "Instalación eléctrica",
    opciones: [
      "Correcta",
      "A revisar",
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

  campoLinea(
    ctx,
    "Tensión:",
    col1,
    40,
    90
  );

  campoLinea(
    ctx,
    "Consumo:",
    165,
    49,
    75
  );

  campoLinea(
    ctx,
    "Presión:",
    305,
    42,
    70
  );

  campoLinea(
    ctx,
    "Temp. entrada:",
    425,
    66,
    70
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Temp. salida:",
    col1,
    59,
    110
  );

  ctx.y -= 24;

  /*
   * INSTALACIÓN
   */

  tituloSeccion(
    ctx,
    "Relevamiento para instalación"
  );

  campoLinea(
    ctx,
    "Equipo / capacidad estimada:",
    col1,
    106,
    145
  );

  campoLinea(
    ctx,
    "Interconexión aprox.:",
    330,
    80,
    130
  );

  ctx.y -= 19;

  campoLinea(
    ctx,
    "Ubicación evaporador:",
    col1,
    89,
    150
  );

  campoLinea(
    ctx,
    "Ubicación condensador:",
    325,
    94,
    135
  );

  ctx.y -= 20;

  checkbox(
    ctx,
    col1,
    ctx.y,
    "Desagüe disponible"
  );

  checkbox(
    ctx,
    165,
    ctx.y,
    "Alimentación eléctrica"
  );

  checkbox(
    ctx,
    330,
    ctx.y,
    "Perforación"
  );

  checkbox(
    ctx,
    435,
    ctx.y,
    "Ménsulas / base"
  );

  ctx.y -= 18;

  checkbox(
    ctx,
    col1,
    ctx.y,
    "Canaleta"
  );

  checkbox(
    ctx,
    130,
    ctx.y,
    "Trabajo en altura"
  );

  checkbox(
    ctx,
    270,
    ctx.y,
    "Acceso complejo"
  );

  checkbox(
    ctx,
    405,
    ctx.y,
    "Andamio / elevación"
  );

  ctx.y -= 23;

  /*
   * CONCLUSIÓN
   */

  tituloSeccion(
    ctx,
    "Conclusión técnica"
  );

  checkbox(
    ctx,
    col1,
    ctx.y,
    "Operativo"
  );

  checkbox(
    ctx,
    110,
    ctx.y,
    "Mantenimiento"
  );

  checkbox(
    ctx,
    215,
    ctx.y,
    "Reparación"
  );

  checkbox(
    ctx,
    310,
    ctx.y,
    "Presupuestar"
  );

  checkbox(
    ctx,
    415,
    ctx.y,
    "Reemplazo"
  );

  checkbox(
    ctx,
    505,
    ctx.y,
    "Baja técnica"
  );

  ctx.y -= 23;

  observaciones(
    ctx
  );

  ctx.y -= 8;

  /*
   * RESPONSABLES
   */

  const centro =
    width / 2;

  const altoCaja =
    104;

  const yCaja =
    ctx.y -
    altoCaja;

  page.drawRectangle({
    x: marginX,
    y: yCaja,
    width:
      centro -
      marginX -
      7,
    height:
      altoCaja,
    borderColor:
      rgb(
        0.8,
        0.83,
        0.86
      ),
    borderWidth: 0.7,
  });

  page.drawRectangle({
    x: centro + 7,
    y: yCaja,
    width:
      width -
      marginX -
      centro -
      7,
    height:
      altoCaja,
    borderColor:
      rgb(
        0.8,
        0.83,
        0.86
      ),
    borderWidth: 0.7,
  });

  page.drawRectangle({
    x: marginX,
    y:
      ctx.y -
      18,
    width:
      centro -
      marginX -
      7,
    height: 18,
    color: COLOR_CELESTE,
  });

  page.drawRectangle({
    x:
      centro + 7,
    y:
      ctx.y -
      18,
    width:
      width -
      marginX -
      centro -
      7,
    height: 18,
    color: COLOR_CELESTE,
  });

  escribirTextoNegrita(
    page,
    fontBold,
    "RESPONSABLE DEL ESTABLECIMIENTO",
    marginX + 6,
    ctx.y - 12,
    6.6,
    COLOR_AZUL
  );

  escribirTextoNegrita(
    page,
    fontBold,
    "TÉCNICO RESPONSABLE",
    centro + 13,
    ctx.y - 12,
    6.6,
    COLOR_AZUL
  );

  const izquierdaX =
    marginX + 8;

  const derechaX =
    centro + 15;

  let firmaY =
    ctx.y - 34;

  campoLinea(
    ctx,
    "Nombre:",
    izquierdaX,
    39,
    170,
    firmaY
  );

  campoLinea(
    ctx,
    "Nombre:",
    derechaX,
    39,
    170,
    firmaY
  );

  firmaY -= 21;

  campoLinea(
    ctx,
    "Cargo:",
    izquierdaX,
    34,
    175,
    firmaY
  );

  campoLinea(
    ctx,
    "Matrícula:",
    derechaX,
    49,
    160,
    firmaY
  );

  firmaY -= 21;

  campoLinea(
    ctx,
    "DNI:",
    izquierdaX,
    25,
    184,
    firmaY
  );

  campoLinea(
    ctx,
    "Firma:",
    derechaX,
    32,
    177,
    firmaY
  );

  firmaY -= 21;

  campoLinea(
    ctx,
    "Firma:",
    izquierdaX,
    32,
    177,
    firmaY
  );

  campoLinea(
    ctx,
    "Sello:",
    derechaX,
    30,
    179,
    firmaY
  );

  ctx.y =
    yCaja - 12;

  /*
   * VALIDEZ
   */

  escribirTextoNegrita(
    page,
    fontBold,
    "Este documento carece de validez si no cuenta con la firma y sello del técnico responsable.",
    marginX,
    39,
    5.8,
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
    28,
    5.5,
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
    17,
    5.3,
    COLOR_GRIS
  );

  escribirTexto(
    page,
    font,
    "Pág. 1 de 1",
    width -
      marginX -
      35,
    17,
    5.3,
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
    let i = 0;
    i < cantidad;
    i += 1
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
        i,
      empresa,
      logo
    );

    dibujarContenido(
      ctx
    );
  }

  return await pdfDoc.save();
}
