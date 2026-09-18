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

export type OrdenTrabajoVariante =
  | "original"
  | "copia";

export type OrdenTrabajoPdfEmpresa = {
  company_name?: string | null;
  short_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  whatsapp_number?: string | null;
};

export type OrdenTrabajoPdfDatos = {
  numero_orden: string;
  presupuesto_id?: string | null;
  numero_presupuesto?: number | string | null;

  fecha: string;

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
  tecnico_direccion?: string | null;
  tecnico_localidad?: string | null;

  trabajo_detalle: string;

  fecha_programada?: string | null;
  hora_programada?: string | null;

  observaciones?: string | null;

  empresa_snapshot?: OrdenTrabajoPdfEmpresa | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;
const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const FOOTER_LINE_Y = 55;
const FOOTER_TEXT_Y = 37;
const CONTENT_BOTTOM = 78;

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

function fechaArgentina(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return "";
  }

  const partes =
    valor.slice(0, 10).split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function horaArgentina(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return "";
  }

  return valor.slice(0, 5);
}

function nombreCliente(
  datos: OrdenTrabajoPdfDatos
) {
  const razonSocial =
    texto(
      datos.cliente_razon_social
    );

  if (razonSocial) {
    return razonSocial;
  }

  const nombre = [
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
    nombre ||
    "Cliente sin nombre"
  );
}

function nombreTecnico(
  datos: OrdenTrabajoPdfDatos
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
    "Técnico sin nombre"
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
    x: derecha - ancho,
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
    size > sizeMinimo
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

  let actualY = y;

  for (
    const linea of visibles
  ) {
    page.drawText(linea, {
      x,
      y: actualY,
      size,
      font,
      color,
    });

    actualY -=
      lineHeight;
  }
}

export async function generarOrdenTrabajoPdf(
  datos: OrdenTrabajoPdfDatos,
  variante: OrdenTrabajoVariante
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
    await cargarLogo(pdf);

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
    "Enfri.Ar Refrigeración";

  const web =
    texto(
      empresa.website
    ) ||
    "www.enfriar.com.ar";

  const numeroOrden =
    texto(
      datos.numero_orden
    );

  const numeroPresupuesto =
    texto(
      datos.numero_presupuesto
    );

  const varianteVisible =
    variante === "original"
      ? "ORIGINAL"
      : "COPIA";

  pdf.setTitle(
    `${numeroOrden} - ${varianteVisible}`
  );

  pdf.setAuthor(
    empresaNombre
  );

  pdf.setSubject(
    `Orden de Trabajo ${numeroOrden}`
  );

  pdf.setCreator(
    "Enfri.Ar Refrigeración"
  );

  function dibujarPie(
    page: PDFPage
  ) {
    lineaHorizontal(
      page,
      FOOTER_LINE_Y
    );

    page.drawText(
      "Orden de trabajo - Documento operativo.",
      {
        x: MARGIN,
        y:
          FOOTER_TEXT_Y,
        size: 6.8,
        font: bold,
        color:
          COLOR_DARK,
      }
    );
  }

  function crearPaginaContinuacion() {
    const page =
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

    page.drawText(
      empresaNombre,
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          38,
        size: 10,
        font: bold,
        color:
          COLOR_DARK,
      }
    );

    textoDerecha(
      page,
      `${numeroOrden} - ${varianteVisible}`,
      PAGE_WIDTH -
        MARGIN,
      PAGE_HEIGHT -
        38,
      bold,
      9,
      COLOR_BLUE
    );

    page.drawText(
      "CONTINUACION DEL DETALLE",
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          59,
        size: 7.2,
        font: bold,
        color:
          COLOR_MUTED,
      }
    );

    if (numeroPresupuesto) {
      textoDerecha(
        page,
        `Según Presupuesto N° ${numeroPresupuesto}`,
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
      page,
      PAGE_HEIGHT -
        69,
      COLOR_BLUE
    );

    dibujarPie(page);

    return {
      page,
      y:
        PAGE_HEIGHT -
        91,
    };
  }

  /*
   * =====================================================
   * PRIMERA HOJA
   * =====================================================
   */

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
        x: MARGIN,
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
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          53,
        size: 20,
        font: bold,
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
  ].filter(Boolean);

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
    "ORDEN DE TRABAJO",
    {
      x: MARGIN,
      y,
      size: 18,
      font: bold,
      color:
        COLOR_DARK,
    }
  );

  textoDerecha(
    page,
    varianteVisible,
    PAGE_WIDTH -
      MARGIN,
    y + 2,
    bold,
    10,
    variante ===
      "original"
      ? COLOR_BLUE
      : COLOR_ORANGE
  );

  y -= 19;

  page.drawText(
    numeroOrden,
    {
      x: MARGIN,
      y,
      size: 11,
      font: bold,
      color:
        COLOR_BLUE,
    }
  );

  textoDerecha(
    page,
    `Fecha: ${fechaArgentina(
      datos.fecha
    )}`,
    PAGE_WIDTH -
      MARGIN,
    y,
    regular,
    8,
    COLOR_MUTED
  );

  if (numeroPresupuesto) {
    page.drawText(
      `Según Presupuesto N° ${numeroPresupuesto}`,
      {
        x: MARGIN,
        y: y - 14,
        size: 8,
        font: bold,
        color:
          COLOR_MUTED,
      }
    );
  }

  /*
   * =====================================================
   * DATOS CLIENTE
   * =====================================================
   */

  y -= numeroPresupuesto
    ? 34
    : 20;

  const clienteTop =
    y;

  const clienteHeight =
    76;

  page.drawRectangle({
    x: MARGIN,
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
    borderWidth: 0.6,
  });

  page.drawText(
    "CLIENTE",
    {
      x:
        MARGIN +
        9,
      y:
        clienteTop -
        14,
      size: 6.8,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  dibujarTextoAjustado({
    page,
    valor:
      nombreCliente(datos),
    x:
      MARGIN +
      9,
    y:
      clienteTop -
      27,
    ancho: 250,
    alto: 14,
    font: bold,
    sizeInicial: 9,
    sizeMinimo: 7,
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
    alto: 14,
    font:
      regular,
    sizeInicial: 8,
    sizeMinimo: 6.5,
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
    .filter(Boolean)
    .join(" - ");

  dibujarTextoAjustado({
    page,
    valor:
      `Dirección: ${direccionCliente}`,
    x:
      MARGIN +
      9,
    y:
      clienteTop -
      47,
    ancho: 260,
    alto: 22,
    font:
      regular,
    sizeInicial: 7.5,
    sizeMinimo: 6,
    color:
      COLOR_MUTED,
  });

  dibujarTextoAjustado({
    page,
    valor:
      `Teléfono: ${
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
    alto: 22,
    font:
      regular,
    sizeInicial: 7.5,
    sizeMinimo: 6,
    color:
      COLOR_MUTED,
  });

  /*
   * =====================================================
   * TÉCNICO
   * =====================================================
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
    x: MARGIN,
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
    borderWidth: 0.6,
  });

  page.drawText(
    "TÉCNICO ASIGNADO",
    {
      x:
        MARGIN +
        9,
      y:
        tecnicoTop -
        14,
      size: 6.8,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  page.drawText(
    nombreTecnico(datos),
    {
      x:
        MARGIN +
        9,
      y:
        tecnicoTop -
        28,
      size: 8.8,
      font: bold,
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
      ? `Matrícula: ${texto(
          datos.tecnico_matricula
        )}`
      : "",
  ]
    .filter(Boolean)
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
    alto: 14,
    font:
      regular,
    sizeInicial: 7.5,
    sizeMinimo: 6,
    color:
      COLOR_TEXT,
  });

  const contactoTecnico = [
    texto(
      datos.tecnico_telefono
    ),
    texto(
      datos.tecnico_localidad
    ),
  ]
    .filter(Boolean)
    .join(" - ");

  dibujarTextoAjustado({
    page,
    valor:
      `Contacto: ${
        contactoTecnico ||
        "-"
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
    alto: 14,
    font:
      regular,
    sizeInicial: 7,
    sizeMinimo: 5.8,
    color:
      COLOR_MUTED,
  });

  /*
   * =====================================================
   * PROGRAMACIÓN
   * =====================================================
   */

  y =
    tecnicoTop -
    tecnicoHeight -
    10;

  const programadoFecha =
    fechaArgentina(
      datos.fecha_programada
    );

  const programadoHora =
    horaArgentina(
      datos.hora_programada
    );

  page.drawRectangle({
    x: MARGIN,
    y:
      y -
      34,
    width:
      CONTENT_WIDTH,
    height: 34,
    color:
      COLOR_LIGHT,
    borderColor:
      COLOR_BORDER,
    borderWidth: 0.6,
  });

  page.drawText(
    "TRABAJO PROGRAMADO",
    {
      x:
        MARGIN +
        9,
      y:
        y -
        13,
      size: 6.5,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  page.drawText(
    programadoFecha
      ? `${programadoFecha}${
          programadoHora
            ? ` - ${programadoHora} hs`
            : ""
        }`
      : "Sin fecha programada",
    {
      x:
        MARGIN +
        9,
      y:
        y -
        26,
      size: 8,
      font: bold,
      color:
        COLOR_TEXT,
    }
  );

  y -= 46;

  /*
   * =====================================================
   * DETALLE DEL TRABAJO
   * =====================================================
   */

  page.drawText(
    "TRABAJOS A REALIZAR",
    {
      x: MARGIN,
      y,
      size: 7.2,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  y -= 15;

  const detalleLineas:
    string[] = [];

  const bloquesDetalle =
    texto(
      datos.trabajo_detalle
    )
      .replace(/\r/g, "")
      .split("\n")
      .filter(
        (linea) =>
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

  let primeraLineaPagina =
    true;

  for (
    let indice = 0;
    indice <
    detalleLineas.length;
    indice += 1
  ) {
    const linea =
      detalleLineas[indice];

    if (
      y <
      CONTENT_BOTTOM +
        18
    ) {
      page.drawText(
        "Detalle continúa en la hoja siguiente.",
        {
          x: MARGIN,
          y:
            CONTENT_BOTTOM -
            1,
          size: 6.5,
          font: bold,
          color:
            COLOR_ORANGE,
        }
      );

      const nueva =
        crearPaginaContinuacion();

      page =
        nueva.page;

      y =
        nueva.y;

      primeraLineaPagina =
        true;
    }

    if (
      primeraLineaPagina &&
      pdf.getPageCount() >
        1
    ) {
      page.drawText(
        "Continuación:",
        {
          x: MARGIN,
          y,
          size: 7,
          font: bold,
          color:
            COLOR_ORANGE,
        }
      );

      y -= 13;

      primeraLineaPagina =
        false;
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
        size: 8,
        font:
          regular,
        color:
          COLOR_TEXT,
      }
    );

    y -= 10;
  }

  /*
   * =====================================================
   * OBSERVACIONES
   * =====================================================
   */

  const observaciones =
    texto(
      datos.observaciones
    );

  if (observaciones) {
    const lineasObservacion =
      envolverTexto(
        observaciones,
        regular,
        7.5,
        CONTENT_WIDTH -
          18
      );

    const alturaNecesaria =
      31 +
      lineasObservacion.length *
        9;

    if (
      y -
        alturaNecesaria <
      CONTENT_BOTTOM
    ) {
      const nueva =
        crearPaginaContinuacion();

      page =
        nueva.page;

      y =
        nueva.y;
    }

    y -= 7;

    page.drawRectangle({
      x: MARGIN,
      y:
        y -
        alturaNecesaria,
      width:
        CONTENT_WIDTH,
      height:
        alturaNecesaria,
      color:
        COLOR_LIGHT,
      borderColor:
        COLOR_BORDER,
      borderWidth: 0.6,
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
        size: 6.8,
        font: bold,
        color:
          COLOR_MUTED,
      }
    );

    let observacionY =
      y - 29;

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
          size: 7.5,
          font:
            regular,
          color:
            COLOR_TEXT,
        }
      );

      observacionY -= 9;
    }

    y -=
      alturaNecesaria;
  }

  /*
   * =====================================================
   * PIE Y NUMERACIÓN DE HOJAS
   * =====================================================
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
          ? `${numeroOrden} | Presupuesto N° ${numeroPresupuesto} | ${varianteVisible} | Hoja ${
              indice + 1
            } de ${
              paginas.length
            }`
          : `${numeroOrden} | ${varianteVisible} | Hoja ${
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
