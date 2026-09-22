import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";

export type ConformidadPdfEmpresa = {
  company_name?: string | null;
  short_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  whatsapp_number?: string | null;
};

export type ConformidadPdfDatos = {
  numero_conformidad: string;

  presupuesto_id?: string | null;
  numero_presupuesto?: number | string | null;

  cliente_nombre?: string | null;
  cliente_apellido?: string | null;
  cliente_razon_social?: string | null;
  cliente_dni?: string | null;
  cliente_cuit?: string | null;
  cliente_telefono?: string | null;
  cliente_direccion: string;
  cliente_localidad?: string | null;

  tecnico_nombre?: string | null;
  tecnico_apellido?: string | null;
  tecnico_dni?: string | null;
  tecnico_telefono?: string | null;
  tecnico_matricula?: string | null;

  trabajo_realizado: string;

  observaciones?: string | null;

  empresa_snapshot?: ConformidadPdfEmpresa | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const FOOTER_LINE_Y = 55;
const FOOTER_TEXT_Y = 37;

const CONTENT_BOTTOM = 78;

const MANUAL_HEIGHT = 326;
const MANUAL_TOP_GAP = 12;

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
  0.82,
  0.84,
  0.85
);

const COLOR_LIGHT = rgb(
  0.965,
  0.98,
  0.99
);

function texto(
  valor:
    | string
    | number
    | null
    | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor).trim();
}

function nombreCliente(
  datos: ConformidadPdfDatos
) {
  const razonSocial =
    texto(
      datos.cliente_razon_social
    );

  if (razonSocial) {
    return razonSocial;
  }

  const persona = [
    texto(
      datos.cliente_nombre
    ),
    texto(
      datos.cliente_apellido
    ),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    persona ||
    "Cliente sin nombre"
  );
}

function nombreTecnico(
  datos: ConformidadPdfDatos
) {
  const nombre = [
    texto(
      datos.tecnico_nombre
    ),
    texto(
      datos.tecnico_apellido
    ),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    nombre ||
    "Tecnico sin nombre"
  );
}

function partirPalabraLarga(
  palabra: string,
  font: PDFFont,
  size: number,
  anchoMaximo: number
) {
  const partes: string[] =
    [];

  let actual = "";

  for (
    const caracter of palabra
  ) {
    const prueba =
      actual + caracter;

    if (
      font.widthOfTextAtSize(
        prueba,
        size
      ) <= anchoMaximo
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
  const resultado: string[] =
    [];

  const bloques = valor
    .replace(/\r/g, "")
    .split("\n");

  for (
    const bloque of bloques
  ) {
    if (!bloque.trim()) {
      resultado.push("");
      continue;
    }

    const palabras =
      bloque.split(/\s+/);

    let linea = "";

    for (
      const palabraOriginal
      of palabras
    ) {
      let partes = [
        palabraOriginal,
      ];

      if (
        font.widthOfTextAtSize(
          palabraOriginal,
          size
        ) > anchoMaximo
      ) {
        partes =
          partirPalabraLarga(
            palabraOriginal,
            font,
            size,
            anchoMaximo
          );
      }

      for (
        const palabra
        of partes
      ) {
        const prueba =
          linea
            ? `${linea} ${palabra}`
            : palabra;

        if (
          font.widthOfTextAtSize(
            prueba,
            size
          ) <= anchoMaximo
        ) {
          linea = prueba;
        } else {
          if (linea) {
            resultado.push(
              linea
            );
          }

          linea = palabra;
        }
      }
    }

    if (linea) {
      resultado.push(linea);
    }
  }

  return resultado.length
    ? resultado
    : [""];
}

function textoDerecha(
  page: PDFPage,
  valor: string,
  derecha: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB
) {
  const ancho =
    font.widthOfTextAtSize(
      valor,
      size
    );

  page.drawText(valor, {
    x:
      derecha -
      ancho,
    y,
    font,
    size,
    color,
  });
}

function lineaHorizontal(
  page: PDFPage,
  y: number,
  color: RGB =
    COLOR_BORDER
) {
  page.drawLine({
    start: {
      x: MARGIN,
      y,
    },
    end: {
      x:
        PAGE_WIDTH -
        MARGIN,
      y,
    },
    thickness: 0.7,
    color,
  });
}

async function cargarLogo(
  pdf: PDFDocument
): Promise<PDFImage | null> {
  try {
    const ruta =
      path.join(
        process.cwd(),
        "public",
        "logo-enfri-ar.png"
      );

    const bytes =
      await readFile(
        ruta
      );

    return await pdf.embedPng(
      bytes
    );
  } catch {
    return null;
  }
}

function dibujarTextoAjustado({
  page,
  valor,
  x,
  y,
  ancho,
  alto,
  font,
  sizeInicial,
  sizeMinimo,
  color,
}: {
  page: PDFPage;
  valor: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  font: PDFFont;
  sizeInicial: number;
  sizeMinimo: number;
  color: RGB;
}) {
  let size =
    sizeInicial;

  let lineas =
    envolverTexto(
      valor,
      font,
      size,
      ancho
    );

  while (
    size >
    sizeMinimo
  ) {
    const lineHeight =
      size + 2;

    if (
      lineas.length *
        lineHeight <=
      alto
    ) {
      break;
    }

    size -= 0.5;

    lineas =
      envolverTexto(
        valor,
        font,
        size,
        ancho
      );
  }

  const lineHeight =
    size + 2;

  const cantidadMaxima =
    Math.max(
      1,
      Math.floor(
        alto /
          lineHeight
      )
    );

  const visibles =
    lineas.slice(
      0,
      cantidadMaxima
    );

  let actualY =
    y;

  for (
    const linea of visibles
  ) {
    page.drawText(
      linea,
      {
        x,
        y:
          actualY,
        size,
        font,
        color,
      }
    );

    actualY -=
      lineHeight;
  }
}

function dibujarCampoManual({
  page,
  etiqueta,
  y,
  bold,
  anchoLinea,
}: {
  page: PDFPage;
  etiqueta: string;
  y: number;
  bold: PDFFont;
  anchoLinea?: number;
}) {
  const etiquetaVisible =
    `${etiqueta}:`;

  page.drawText(
    etiquetaVisible,
    {
      x:
        MARGIN +
        10,
      y,
      size: 7.4,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  const anchoEtiqueta =
    bold.widthOfTextAtSize(
      etiquetaVisible,
      7.4
    );

  const inicioLinea =
    MARGIN +
    15 +
    anchoEtiqueta;

  const finLinea =
    Math.min(
      PAGE_WIDTH -
        MARGIN -
        10,
      inicioLinea +
        (
          anchoLinea ??
          300
        )
    );

  page.drawLine({
    start: {
      x:
        inicioLinea,
      y:
        y - 2,
    },
    end: {
      x:
        finLinea,
      y:
        y - 2,
    },
    thickness: 0.55,
    color:
      COLOR_MUTED,
  });
}

export async function generarConformidadPdf(
  datos: ConformidadPdfDatos
): Promise<Uint8Array> {
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
    await cargarLogo(
      pdf
    );

  const empresa =
    datos.empresa_snapshot ||
    {};

  const empresaNombre =
    texto(
      empresa.company_name
    ) ||
    texto(
      empresa.short_name
    ) ||
    "Enfri.Ar Refrigeracion";

  const web =
    texto(
      empresa.website
    ) ||
    "www.enfriar.com.ar";

  const numeroConformidad =
    texto(
      datos.numero_conformidad
    );

  const numeroPresupuesto =
    texto(
      datos.numero_presupuesto
    );

  pdf.setTitle(
    numeroConformidad
  );

  pdf.setAuthor(
    empresaNombre
  );

  pdf.setSubject(
    `Conformidad ${numeroConformidad}`
  );

  pdf.setCreator(
    "Enfri.Ar Refrigeracion"
  );

  function dibujarPie(
    pagina: PDFPage
  ) {
    lineaHorizontal(
      pagina,
      FOOTER_LINE_Y
    );

    pagina.drawText(
      "Conformidad de trabajo - Documento operativo.",
      {
        x:
          MARGIN,
        y:
          FOOTER_TEXT_Y,
        size:
          6.8,
        font:
          bold,
        color:
          COLOR_DARK,
      }
    );
  }

  function crearPaginaContinuacion(
    titulo:
      | "detalle"
      | "documento" =
      "documento"
  ) {
    const pagina =
      pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    pagina.drawRectangle({
      x: 0,
      y:
        PAGE_HEIGHT -
        9,
      width:
        PAGE_WIDTH,
      height: 9,
      color:
        COLOR_BLUE,
    });

    pagina.drawText(
      empresaNombre,
      {
        x:
          MARGIN,
        y:
          PAGE_HEIGHT -
          38,
        size: 10,
        font:
          bold,
        color:
          COLOR_DARK,
      }
    );

    textoDerecha(
      pagina,
      numeroConformidad,
      PAGE_WIDTH -
        MARGIN,
      PAGE_HEIGHT -
        38,
      bold,
      9,
      COLOR_BLUE
    );

    pagina.drawText(
      titulo ===
        "detalle"
        ? "CONTINUACION DEL DETALLE"
        : "CONTINUACION DE LA CONFORMIDAD",
      {
        x:
          MARGIN,
        y:
          PAGE_HEIGHT -
          59,
        size:
          7.2,
        font:
          bold,
        color:
          COLOR_MUTED,
      }
    );

    if (
      numeroPresupuesto
    ) {
      textoDerecha(
        pagina,
        `Segun Presupuesto N° ${numeroPresupuesto}`,
        PAGE_WIDTH -
          MARGIN,
        PAGE_HEIGHT -
          59,
        bold,
        7,
        COLOR_MUTED
      );
    }

    lineaHorizontal(
      pagina,
      PAGE_HEIGHT -
        69,
      COLOR_BLUE
    );

    dibujarPie(
      pagina
    );

    return {
      page:
        pagina,
      y:
        PAGE_HEIGHT -
        91,
    };
  }

  let page =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  page.drawRectangle({
    x: 0,
    y:
      PAGE_HEIGHT -
      9,
    width:
      PAGE_WIDTH,
    height: 9,
    color:
      COLOR_BLUE,
  });

  page.drawRectangle({
    x:
      PAGE_WIDTH -
      135,
    y: 0,
    width: 135,
    height: 5,
    color:
      COLOR_ORANGE,
  });

  if (logo) {
    const escala =
      Math.min(
        105 /
          logo.width,
        43 /
          logo.height
      );

    page.drawImage(
      logo,
      {
        x:
          MARGIN,
        y:
          PAGE_HEIGHT -
          64,
        width:
          logo.width *
          escala,
        height:
          logo.height *
          escala,
      }
    );
  } else {
    page.drawText(
      "Enfri.Ar",
      {
        x:
          MARGIN,
        y:
          PAGE_HEIGHT -
          53,
        size: 20,
        font:
          bold,
        color:
          COLOR_DARK,
      }
    );
  }

  let empresaY =
    PAGE_HEIGHT -
    31;

  const empresaLineas = [
    empresaNombre,

    texto(
      empresa.phone
    )
      ? `Tel.: ${texto(
          empresa.phone
        )}`
      : "",

    texto(
      empresa.email
    ),

    web,
  ].filter(
    Boolean
  );

  for (
    let i = 0;
    i <
    empresaLineas.length;
    i += 1
  ) {
    textoDerecha(
      page,
      empresaLineas[i],
      PAGE_WIDTH -
        MARGIN,
      empresaY,
      i === 0
        ? bold
        : regular,
      i === 0
        ? 9
        : 7.3,
      i === 0
        ? COLOR_DARK
        : COLOR_MUTED
    );

    empresaY -=
      i === 0
        ? 12
        : 10;
  }

  let y =
    PAGE_HEIGHT -
    87;

  lineaHorizontal(
    page,
    y,
    COLOR_BLUE
  );

  y -= 24;

  page.drawText(
    "CONFORMIDAD",
    {
      x:
        MARGIN,
      y,
      size: 18,
      font:
        bold,
      color:
        COLOR_DARK,
    }
  );

  textoDerecha(
    page,
    numeroConformidad,
    PAGE_WIDTH -
      MARGIN,
    y + 2,
    bold,
    10,
    COLOR_BLUE
  );

  y -= 20;

  if (
    numeroPresupuesto
  ) {
    page.drawText(
      `Segun Presupuesto N° ${numeroPresupuesto}`,
      {
        x:
          MARGIN,
        y,
        size: 8,
        font:
          bold,
        color:
          COLOR_MUTED,
      }
    );
  }

  y -= 27;

  /*
   * =========================================
   * CLIENTE / ESTABLECIMIENTO
   * =========================================
   */

  const clienteTop =
    y;

  const clienteHeight =
    76;

  page.drawRectangle({
    x:
      MARGIN,
    y:
      clienteTop -
      clienteHeight,
    width:
      CONTENT_WIDTH,
    height:
      clienteHeight,
    color:
      COLOR_LIGHT,
    borderColor:
      COLOR_BORDER,
    borderWidth:
      0.6,
  });

  page.drawText(
    "CLIENTE / ESTABLECIMIENTO",
    {
      x:
        MARGIN +
        9,
      y:
        clienteTop -
        14,
      size:
        6.8,
      font:
        bold,
      color:
        COLOR_MUTED,
    }
  );

  dibujarTextoAjustado({
    page,
    valor:
      nombreCliente(
        datos
      ),
    x:
      MARGIN +
      9,
    y:
      clienteTop -
      27,
    ancho:
      250,
    alto:
      14,
    font:
      bold,
    sizeInicial:
      9,
    sizeMinimo:
      7,
    color:
      COLOR_TEXT,
  });

  const identificacionCliente =
    texto(
      datos.cliente_cuit
    )
      ? `CUIT: ${texto(
          datos.cliente_cuit
        )}`
      : texto(
            datos.cliente_dni
          )
        ? `DNI: ${texto(
            datos.cliente_dni
          )}`
        : "-";

  dibujarTextoAjustado({
    page,
    valor:
      identificacionCliente,
    x:
      MARGIN +
      286,
    y:
      clienteTop -
      27,
    ancho:
      CONTENT_WIDTH -
      295,
    alto:
      14,
    font:
      regular,
    sizeInicial:
      8,
    sizeMinimo:
      6.5,
    color:
      COLOR_TEXT,
  });

  const direccionCliente = [
    texto(
      datos.cliente_direccion
    ),
    texto(
      datos.cliente_localidad
    ),
  ]
    .filter(
      Boolean
    )
    .join(" - ");

  dibujarTextoAjustado({
    page,
    valor:
      `Direccion: ${
        direccionCliente ||
        "-"
      }`,
    x:
      MARGIN +
      9,
    y:
      clienteTop -
      47,
    ancho:
      260,
    alto:
      22,
    font:
      regular,
    sizeInicial:
      7.5,
    sizeMinimo:
      6,
    color:
      COLOR_MUTED,
  });

  dibujarTextoAjustado({
    page,
    valor:
      `Telefono: ${
        texto(
          datos.cliente_telefono
        ) || "-"
      }`,
    x:
      MARGIN +
      286,
    y:
      clienteTop -
      47,
    ancho:
      CONTENT_WIDTH -
      295,
    alto:
      22,
    font:
      regular,
    sizeInicial:
      7.5,
    sizeMinimo:
      6,
    color:
      COLOR_MUTED,
  });

  /*
   * =========================================
   * TECNICO RESPONSABLE
   * =========================================
   */

  y =
    clienteTop -
    clienteHeight -
    10;

  const tecnicoTop =
    y;

  const tecnicoHeight =
    66;

  page.drawRectangle({
    x:
      MARGIN,
    y:
      tecnicoTop -
      tecnicoHeight,
    width:
      CONTENT_WIDTH,
    height:
      tecnicoHeight,
    color:
      rgb(
        1,
        1,
        1
      ),
    borderColor:
      COLOR_BORDER,
    borderWidth:
      0.6,
  });

  page.drawText(
    "TECNICO RESPONSABLE",
    {
      x:
        MARGIN +
        9,
      y:
        tecnicoTop -
        14,
      size:
        6.8,
      font:
        bold,
      color:
        COLOR_MUTED,
    }
  );

  page.drawText(
    nombreTecnico(
      datos
    ),
    {
      x:
        MARGIN +
        9,
      y:
        tecnicoTop -
        28,
      size:
        8.8,
      font:
        bold,
      color:
        COLOR_TEXT,
    }
  );

  const tecnicoDocumento = [
    texto(
      datos.tecnico_dni
    )
      ? `DNI: ${texto(
          datos.tecnico_dni
        )}`
      : "",

    texto(
      datos.tecnico_matricula
    )
      ? `Matricula: ${texto(
          datos.tecnico_matricula
        )}`
      : "",
  ]
    .filter(
      Boolean
    )
    .join(" | ");

  dibujarTextoAjustado({
    page,
    valor:
      tecnicoDocumento ||
      "-",
    x:
      MARGIN +
      286,
    y:
      tecnicoTop -
      28,
    ancho:
      CONTENT_WIDTH -
      295,
    alto:
      14,
    font:
      regular,
    sizeInicial:
      7.5,
    sizeMinimo:
      6,
    color:
      COLOR_TEXT,
  });

  dibujarTextoAjustado({
    page,
    valor:
      `Contacto: ${
        texto(
          datos.tecnico_telefono
        ) || "-"
      }`,
    x:
      MARGIN +
      9,
    y:
      tecnicoTop -
      47,
    ancho:
      CONTENT_WIDTH -
      18,
    alto:
      14,
    font:
      regular,
    sizeInicial:
      7,
    sizeMinimo:
      5.8,
    color:
      COLOR_MUTED,
  });

  /*
   * =========================================
   * PREPARAR TRABAJO REALIZADO
   * =========================================
   */

  y =
    tecnicoTop -
    tecnicoHeight -
    18;

  page.drawText(
    "TRABAJO REALIZADO",
    {
      x:
        MARGIN,
      y,
      size:
        7.2,
      font:
        bold,
      color:
        COLOR_MUTED,
    }
  );

  y -= 15;

  const detalleLineas:
    string[] = [];

  const bloquesDetalle =
    texto(
      datos.trabajo_realizado
    )
      .replace(
        /\r/g,
        ""
      )
      .split(
        "\n"
      )
      .filter(
        (
          linea
        ) =>
          linea.trim()
      );

  for (
    const bloque
    of bloquesDetalle
  ) {
    const envuelto =
      envolverTexto(
        bloque,
        regular,
        8,
        CONTENT_WIDTH -
          20
      );

    detalleLineas.push(
      ...envuelto,
      ""
    );
  }

  if (
    detalleLineas.length ===
    0
  ) {
    detalleLineas.push(
      "Sin detalle de trabajos."
    );
  }

  const observaciones =
    texto(
      datos.observaciones
    );

  const lineasObservacion =
    observaciones
      ? envolverTexto(
          observaciones,
          regular,
          7.5,
          CONTENT_WIDTH -
            18
        )
      : [];

  const alturaObservaciones =
    observaciones
      ? 31 +
        lineasObservacion.length *
          9
      : 0;

  const alturaDetalleTotal =
    detalleLineas.reduce(
      (
        total,
        linea
      ) =>
        total +
        (
          linea
            ? 10
            : 5
        ),
      0
    );

  const espacioNecesarioCompleto =
    alturaDetalleTotal +
    (
      observaciones
        ? 7 +
          alturaObservaciones
        : 0
    ) +
    MANUAL_TOP_GAP +
    MANUAL_HEIGHT;

  const entraTodoEnPrimeraHoja =
    y -
      espacioNecesarioCompleto >=
    CONTENT_BOTTOM;

  /*
   * =========================================
   * DIBUJAR TRABAJO REALIZADO
   * =========================================
   */

  let detalleContinuo =
    false;

  for (
    let indice = 0;
    indice <
    detalleLineas.length;
    indice += 1
  ) {
    const linea =
      detalleLineas[
        indice
      ];

    const espacioLinea =
      linea
        ? 10
        : 5;

    /*
     * Si TODO entra, no hacemos ningún
     * salto anticipado.
     *
     * Si NO entra todo, aprovechamos la
     * hoja hasta abajo antes de crear otra.
     */
    if (
      !entraTodoEnPrimeraHoja &&
      y -
        espacioLinea <
        CONTENT_BOTTOM +
          18
    ) {
      page.drawText(
        "El detalle continua en la hoja siguiente.",
        {
          x:
            MARGIN,
          y:
            CONTENT_BOTTOM +
            2,
          size:
            6.5,
          font:
            bold,
          color:
            COLOR_ORANGE,
        }
      );

      const nueva =
        crearPaginaContinuacion(
          "detalle"
        );

      page =
        nueva.page;

      y =
        nueva.y;

      detalleContinuo =
        true;

      page.drawText(
        "Continuacion:",
        {
          x:
            MARGIN,
          y,
          size:
            7,
          font:
            bold,
          color:
            COLOR_ORANGE,
        }
      );

      y -= 13;
    }

    if (!linea) {
      y -= 5;
      continue;
    }

    page.drawText(
      linea,
      {
        x:
          MARGIN +
          8,
        y,
        size:
          8,
        font:
          regular,
        color:
          COLOR_TEXT,
      }
    );

    y -= 10;
  }

  /*
   * =========================================
   * OBSERVACIONES
   * =========================================
   */

  if (
    observaciones
  ) {
    const espacioConManual =
      7 +
      alturaObservaciones +
      MANUAL_TOP_GAP +
      MANUAL_HEIGHT;

    /*
     * Si observaciones + bloque manual
     * entran juntos, los dejamos juntos
     * en esta hoja.
     *
     * Si no entran, la observación puede
     * pasar completa a una hoja nueva.
     */
    if (
      y -
        espacioConManual <
        CONTENT_BOTTOM &&
      y -
        (
          7 +
          alturaObservaciones
        ) <
        CONTENT_BOTTOM
    ) {
      const nueva =
        crearPaginaContinuacion(
          detalleContinuo
            ? "detalle"
            : "documento"
        );

      page =
        nueva.page;

      y =
        nueva.y;
    }

    y -= 7;

    page.drawRectangle({
      x:
        MARGIN,
      y:
        y -
        alturaObservaciones,
      width:
        CONTENT_WIDTH,
      height:
        alturaObservaciones,
      color:
        COLOR_LIGHT,
      borderColor:
        COLOR_BORDER,
      borderWidth:
        0.6,
    });

    page.drawText(
      "OBSERVACIONES",
      {
        x:
          MARGIN +
          9,
        y:
          y -
          15,
        size:
          6.8,
        font:
          bold,
        color:
          COLOR_MUTED,
      }
    );

    let observacionY =
      y -
      29;

    for (
      const linea
      of lineasObservacion
    ) {
      page.drawText(
        linea,
        {
          x:
            MARGIN +
            9,
          y:
            observacionY,
          size:
            7.5,
          font:
            regular,
          color:
            COLOR_TEXT,
        }
      );

      observacionY -=
        9;
    }

    y -=
      alturaObservaciones;
  }

  /*
   * =========================================
   * CAMPOS MANUALES
   * =========================================
   *
   * Este bloque nunca se divide.
   */

  if (
    y -
      MANUAL_TOP_GAP -
      MANUAL_HEIGHT <
    CONTENT_BOTTOM
  ) {
    const nueva =
      crearPaginaContinuacion(
        "documento"
      );

    page =
      nueva.page;

    y =
      nueva.y;
  }

  y -=
    MANUAL_TOP_GAP;

  page.drawRectangle({
    x:
      MARGIN,
    y:
      y -
      MANUAL_HEIGHT,
    width:
      CONTENT_WIDTH,
    height:
      MANUAL_HEIGHT,
    color:
      rgb(
        1,
        1,
        1
      ),
    borderColor:
      COLOR_BORDER,
    borderWidth:
      0.7,
  });

  page.drawText(
    "CONFORMIDAD DEL SERVICIO",
    {
      x:
        MARGIN +
        10,
      y:
        y -
        16,
      size:
        7,
      font:
        bold,
      color:
        COLOR_BLUE,
    }
  );

  const leyendaConformidad =
    "El responsable del establecimiento deja constancia de la recepción y conformidad respecto de los trabajos detallados en este documento y de los controles realizados al finalizar la intervención. Esta conformidad se limita al alcance del servicio efectivamente realizado y no comprende fallas preexistentes, componentes no intervenidos, desperfectos ajenos a la intervención ni trabajos o reparaciones informados como pendientes. Las observaciones técnicas comunicadas forman parte de esta constancia. La firma acredita la recepción del servicio y de dichas observaciones, sin perjuicio de los derechos que legalmente correspondan.";

  const lineasConformidad =
    envolverTexto(
      leyendaConformidad,
      regular,
      7,
      CONTENT_WIDTH - 20
    );

  let conformidadY =
    y -
    32;

  for (
    const linea
    of lineasConformidad
  ) {
    page.drawText(
      linea,
      {
        x:
          MARGIN +
          10,
        y:
          conformidadY,
        size:
          7,
        font:
          regular,
        color:
          COLOR_TEXT,
      }
    );

    conformidadY -= 9;
  }

  page.drawText(
    "DATOS A COMPLETAR EN EL ESTABLECIMIENTO",
    {
      x:
        MARGIN +
        10,
      y:
        conformidadY -
        8,
      size:
        7,
      font:
        bold,
      color:
        COLOR_BLUE,
    }
  );

  let manualY =
    conformidadY -
    29;

  dibujarCampoManual({
    page,
    etiqueta:
      "Fecha de conformidad",
    y:
      manualY,
    bold,
    anchoLinea:
      130,
  });

  manualY -= 24;

  dibujarCampoManual({
    page,
    etiqueta:
      "Fecha de finalizacion",
    y:
      manualY,
    bold,
    anchoLinea:
      130,
  });

  manualY -= 31;

  page.drawText(
    "RESPONSABLE DEL ESTABLECIMIENTO",
    {
      x:
        MARGIN +
        10,
      y:
        manualY,
      size:
        7,
      font:
        bold,
      color:
        COLOR_DARK,
    }
  );

  manualY -= 22;

  dibujarCampoManual({
    page,
    etiqueta:
      "Nombre y apellido",
    y:
      manualY,
    bold,
  });

  manualY -= 21;

  dibujarCampoManual({
    page,
    etiqueta:
      "DNI",
    y:
      manualY,
    bold,
    anchoLinea:
      190,
  });

  manualY -= 21;

  dibujarCampoManual({
    page,
    etiqueta:
      "Cargo / funcion",
    y:
      manualY,
    bold,
  });

  manualY -= 21;

  dibujarCampoManual({
    page,
    etiqueta:
      "Firma",
    y:
      manualY,
    bold,
  });

  manualY -= 21;

  dibujarCampoManual({
    page,
    etiqueta:
      "Aclaracion",
    y:
      manualY,
    bold,
  });

  /*
   * =========================================
   * PIE Y NUMERACION DE HOJAS
   * =========================================
   */

  const paginas =
    pdf.getPages();

  paginas.forEach(
    (
      pagina,
      indice
    ) => {
      dibujarPie(
        pagina
      );

      const referencia =
        numeroPresupuesto
          ? `${numeroConformidad} | Presupuesto N° ${numeroPresupuesto} | Hoja ${
              indice + 1
            } de ${
              paginas.length
            }`
          : `${numeroConformidad} | Hoja ${
              indice + 1
            } de ${
              paginas.length
            }`;

      textoDerecha(
        pagina,
        referencia,
        PAGE_WIDTH -
          MARGIN,
        FOOTER_TEXT_Y,
        regular,
        6.4,
        COLOR_MUTED
      );
    }
  );

  return await pdf.save();
}
