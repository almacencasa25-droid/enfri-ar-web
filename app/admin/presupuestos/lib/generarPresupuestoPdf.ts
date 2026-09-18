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

export type PresupuestoPdfItem = {
  orden?: number | null;
  nombre_corto?: string | null;
  detalle?: string | null;
  tipo?: string | null;
  cantidad?: number | string | null;
  precio_unitario?: number | string | null;
  subtotal?: number | string | null;
};

export type PresupuestoPdfCliente = {
  nombre?: string | null;
  apellido?: string | null;
  razon_social?: string | null;
  dni?: string | null;
  cuit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  localidad?: string | null;
};

export type PresupuestoPdfEmpresa = {
  company_name?: string | null;
  short_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  whatsapp_label?: string | null;
  whatsapp_number?: string | null;
  texto_pie_presupuesto?: string | null;
};

export type PresupuestoPdfSnapshot = {
  presupuesto_id?: string | null;
  numero?: number | string | null;
  fecha?: string | null;
  estado?: string | null;

  cliente?: PresupuestoPdfCliente | null;

  detalle_corto?: string | null;

  items?: PresupuestoPdfItem[] | null;

  moneda?: string | null;

  subtotal?: number | string | null;

  descuento_tipo?: string | null;
  descuento_valor?: number | string | null;

  recargo_tipo?: string | null;
  recargo_valor?: number | string | null;

  total?: number | string | null;

  forma_pago?: string | null;
  condiciones_pago?: string | null;

  vigencia_dias?: number | string | null;

  observaciones_cliente?: string | null;

  fecha_programada?: string | null;
  hora_programada?: string | null;

  empresa?: PresupuestoPdfEmpresa | null;
};

type LineaServicio = {
  texto: string;
  negrita: boolean;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 34;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const FOOTER_LINE_Y = 55;
const FOOTER_TEXT_Y = 37;

/*
 * Las páginas intermedias pueden aprovechar
 * casi toda la hoja para detalles.
 */
const SERVICE_BOTTOM_NORMAL = 82;

/*
 * En la última hoja reservamos este espacio
 * para condiciones y totales.
 */
const SUMMARY_TOP = 205;
const SUMMARY_BOTTOM = 67;

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

function numero(
  valor:
    | number
    | string
    | null
    | undefined
) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

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

  const fecha =
    valor.slice(0, 10);

  const partes =
    fecha.split("-");

  if (
    partes.length !== 3
  ) {
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

function dinero(
  valor: number,
  moneda: string
) {
  try {
    return new Intl.NumberFormat(
      "es-AR",
      {
        style: "currency",
        currency:
          moneda || "ARS",
        maximumFractionDigits: 2,
      }
    )
      .format(valor)
      .replace(
        /\u00a0/g,
        " "
      );
  } catch {
    return `$ ${valor.toFixed(
      2
    )}`;
  }
}

function nombreCliente(
  cliente:
    | PresupuestoPdfCliente
    | null
    | undefined
) {
  if (!cliente) {
    return "Cliente";
  }

  if (
    texto(
      cliente.razon_social
    )
  ) {
    return texto(
      cliente.razon_social
    );
  }

  const nombre = [
    texto(cliente.nombre),
    texto(cliente.apellido),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    nombre || "Cliente"
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
          linea.length > 0
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

  return resultado.length > 0
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

function dibujarLineas({
  page,
  lineas,
  x,
  y,
  font,
  size,
  lineHeight,
  color,
}: {
  page: PDFPage;
  lineas: string[];
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  lineHeight: number;
  color: RGB;
}) {
  let actualY = y;

  for (
    const linea of lineas
  ) {
    page.drawText(linea, {
      x,
      y: actualY,
      font,
      size,
      color,
    });

    actualY -=
      lineHeight;
  }

  return actualY;
}

function dibujarTextoAjustado({
  page,
  valor,
  x,
  yTop,
  ancho,
  alto,
  font,
  color,
  sizeInicial,
  sizeMinimo,
}: {
  page: PDFPage;
  valor: string;
  x: number;
  yTop: number;
  ancho: number;
  alto: number;
  font: PDFFont;
  color: RGB;
  sizeInicial: number;
  sizeMinimo: number;
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

  const maxLineas =
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
      maxLineas
    );

  if (
    lineas.length >
      maxLineas &&
    visibles.length > 0
  ) {
    const ultima =
      visibles.length - 1;

    visibles[ultima] =
      `${visibles[
        ultima
      ].replace(
        /\.*$/,
        ""
      )}...`;
  }

  dibujarLineas({
    page,
    lineas:
      visibles,
    x,
    y: yTop,
    font,
    size,
    lineHeight,
    color,
  });
}

export async function generarPresupuestoPdf(
  snapshot:
    PresupuestoPdfSnapshot,
  version: number
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
    snapshot.empresa || {};

  const cliente =
    snapshot.cliente || {};

  const items =
    Array.isArray(
      snapshot.items
    )
      ? snapshot.items
      : [];

  const moneda =
    texto(
      snapshot.moneda
    ) || "ARS";

  const numeroPresupuesto =
    numero(
      snapshot.numero
    );

  const numeroVisible =
    String(
      numeroPresupuesto
    ).padStart(
      6,
      "0"
    );

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

  pdf.setTitle(
    `Presupuesto ${numeroVisible}`
  );

  pdf.setAuthor(
    empresaNombre
  );

  pdf.setSubject(
    `Presupuesto Enfri.Ar Nro. ${numeroVisible}`
  );

  pdf.setCreator(
    "Enfri.Ar Refrigeración"
  );

  /*
   * =====================================================
   * COLUMNAS DE SERVICIOS
   * =====================================================
   */

  const qtyWidth = 38;
  const unitWidth = 82;
  const subtotalWidth = 90;

  const descWidth =
    CONTENT_WIDTH -
    qtyWidth -
    unitWidth -
    subtotalWidth;

  const xQty =
    MARGIN;

  const xDesc =
    xQty +
    qtyWidth;

  const xUnit =
    xDesc +
    descWidth;

  const xSubtotal =
    xUnit +
    unitWidth;

  const SERVICE_NAME_SIZE = 7.8;
  const SERVICE_DETAIL_SIZE = 7;
  const SERVICE_LINE_HEIGHT = 8.6;

  /*
   * Guarda cuáles páginas continúan
   * detalles en la página siguiente.
   */
  const paginasConContinuacion =
    new Set<number>();

  /*
   * =====================================================
   * CABECERA DE TABLA
   * =====================================================
   */

  function dibujarCabeceraTabla(
    page: PDFPage,
    y: number
  ) {
    const altura = 21;

    page.drawRectangle({
      x: MARGIN,
      y:
        y -
        altura,
      width:
        CONTENT_WIDTH,
      height:
        altura,
      color:
        COLOR_DARK,
    });

    page.drawText(
      "Cant.",
      {
        x:
          xQty +
          7,
        y:
          y -
          14,
        size: 7,
        font: bold,
        color:
          rgb(
            1,
            1,
            1
          ),
      }
    );

    page.drawText(
      "Servicio / detalle",
      {
        x:
          xDesc +
          6,
        y:
          y -
          14,
        size: 7,
        font: bold,
        color:
          rgb(
            1,
            1,
            1
          ),
      }
    );

    page.drawText(
      "Precio",
      {
        x:
          xUnit +
          8,
        y:
          y -
          14,
        size: 7,
        font: bold,
        color:
          rgb(
            1,
            1,
            1
          ),
      }
    );

    page.drawText(
      "Subtotal",
      {
        x:
          xSubtotal +
          8,
        y:
          y -
          14,
        size: 7,
        font: bold,
        color:
          rgb(
            1,
            1,
            1
          ),
      }
    );

    return y - altura;
  }

  /*
   * =====================================================
   * PRIMERA PÁGINA
   * =====================================================
   */

  function crearPaginaPrincipal() {
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

    /*
     * Logo deliberadamente compacto
     * para ganar espacio útil.
     */
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
            54,
          size: 20,
          font: bold,
          color:
            COLOR_DARK,
        }
      );
    }

    let empresaY =
      PAGE_HEIGHT -
      32;

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
          : 7.5,
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
      "PRESUPUESTO",
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
      `Nro. ${numeroVisible}`,
      PAGE_WIDTH -
        MARGIN,
      y + 1,
      bold,
      13,
      COLOR_BLUE
    );

    y -= 18;

    page.drawText(
      `Fecha: ${fechaArgentina(
        snapshot.fecha
      )}`,
      {
        x: MARGIN,
        y,
        size: 8,
        font: regular,
        color:
          COLOR_MUTED,
      }
    );

    textoDerecha(
      page,
      `Version ${version}`,
      PAGE_WIDTH -
        MARGIN,
      y,
      regular,
      8,
      COLOR_MUTED
    );

    /*
     * CLIENTE
     */

    y -= 18;

    const clienteTop =
      y;

    const clienteHeight =
      67;

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
      borderWidth:
        0.6,
    });

    const nombre =
      nombreCliente(
        cliente
      );

    const documento =
      texto(
        cliente.cuit
      )
        ? `CUIT: ${texto(
            cliente.cuit
          )}`
        : texto(
              cliente.dni
            )
          ? `DNI: ${texto(
              cliente.dni
            )}`
          : "";

    const direccion = [
      texto(
        cliente.direccion
      ),
      texto(
        cliente.localidad
      ),
    ]
      .filter(Boolean)
      .join(" - ");

    const contacto = [
      texto(
        cliente.telefono
      ),
      texto(
        cliente.email
      ),
    ]
      .filter(Boolean)
      .join(" - ");

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
        nombre,
      x:
        MARGIN +
        9,
      yTop:
        clienteTop -
        27,
      ancho: 250,
      alto: 14,
      font: bold,
      color:
        COLOR_TEXT,
      sizeInicial: 9,
      sizeMinimo: 7,
    });

    if (documento) {
      dibujarTextoAjustado({
        page,
        valor:
          documento,
        x:
          MARGIN +
          280,
        yTop:
          clienteTop -
          27,
        ancho:
          CONTENT_WIDTH -
          289,
        alto: 14,
        font:
          regular,
        color:
          COLOR_TEXT,
        sizeInicial: 8,
        sizeMinimo: 6.5,
      });
    }

    if (direccion) {
      dibujarTextoAjustado({
        page,
        valor:
          `Direccion: ${direccion}`,
        x:
          MARGIN +
          9,
        yTop:
          clienteTop -
          45,
        ancho: 250,
        alto: 18,
        font:
          regular,
        color:
          COLOR_MUTED,
        sizeInicial: 7.5,
        sizeMinimo: 6,
      });
    }

    if (contacto) {
      dibujarTextoAjustado({
        page,
        valor:
          `Contacto: ${contacto}`,
        x:
          MARGIN +
          280,
        yTop:
          clienteTop -
          45,
        ancho:
          CONTENT_WIDTH -
          289,
        alto: 18,
        font:
          regular,
        color:
          COLOR_MUTED,
        sizeInicial: 7.5,
        sizeMinimo: 6,
      });
    }

    y =
      clienteTop -
      clienteHeight -
      12;

    /*
     * DETALLE GENERAL
     */

    if (
      texto(
        snapshot.detalle_corto
      )
    ) {
      page.drawText(
        "DETALLE GENERAL",
        {
          x: MARGIN,
          y,
          size: 6.8,
          font: bold,
          color:
            COLOR_MUTED,
        }
      );

      y -= 11;

      const detalleGeneral =
        envolverTexto(
          texto(
            snapshot.detalle_corto
          ),
          regular,
          7.5,
          CONTENT_WIDTH
        );

      const lineas =
        detalleGeneral.slice(
          0,
          3
        );

      y =
        dibujarLineas({
          page,
          lineas,
          x: MARGIN,
          y,
          font:
            regular,
          size: 7.5,
          lineHeight: 9,
          color:
            COLOR_TEXT,
        });

      y -= 7;
    }

    return {
      page,
      y:
        dibujarCabeceraTabla(
          page,
          y
        ),
    };
  }

  /*
   * =====================================================
   * PÁGINAS DE CONTINUACIÓN
   * =====================================================
   */

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

    page.drawText(
      empresaNombre,
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          39,
        size: 10,
        font: bold,
        color:
          COLOR_DARK,
      }
    );

    textoDerecha(
      page,
      `Presupuesto Nro. ${numeroVisible}`,
      PAGE_WIDTH -
        MARGIN,
      PAGE_HEIGHT -
        39,
      bold,
      9,
      COLOR_BLUE
    );

    page.drawText(
      "CONTINUACION DE SERVICIOS",
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          61,
        size: 7.5,
        font: bold,
        color:
          COLOR_MUTED,
      }
    );

    textoDerecha(
      page,
      `Version ${version}`,
      PAGE_WIDTH -
        MARGIN,
      PAGE_HEIGHT -
        61,
      regular,
      7.5,
      COLOR_MUTED
    );

    lineaHorizontal(
      page,
      PAGE_HEIGHT -
        70,
      COLOR_BLUE
    );

    const y =
      dibujarCabeceraTabla(
        page,
        PAGE_HEIGHT -
          87
      );

    return {
      page,
      y,
    };
  }

  let actual =
    crearPaginaPrincipal();

  let page =
    actual.page;

  let y =
    actual.y;

  /*
   * =====================================================
   * DIBUJAR UN FRAGMENTO DE SERVICIO
   * =====================================================
   */

  function dibujarFragmentoServicio({
    page,
    y,
    altura,
    lineas,
    cantidad,
    precioUnitario,
    subtotalItem,
    esPrimerFragmento,
    etiquetaContinuacion,
  }: {
    page: PDFPage;
    y: number;
    altura: number;
    lineas: LineaServicio[];
    cantidad: number;
    precioUnitario: number;
    subtotalItem: number;
    esPrimerFragmento: boolean;
    etiquetaContinuacion: string[];
  }) {
    const rowBottom =
      y - altura;

    page.drawRectangle({
      x: MARGIN,
      y:
        rowBottom,
      width:
        CONTENT_WIDTH,
      height:
        altura,
      color:
        rgb(
          1,
          1,
          1
        ),
      borderColor:
        COLOR_BORDER,
      borderWidth:
        0.45,
    });

    page.drawLine({
      start: {
        x: xDesc,
        y:
          rowBottom,
      },
      end: {
        x: xDesc,
        y,
      },
      thickness:
        0.4,
      color:
        COLOR_BORDER,
    });

    page.drawLine({
      start: {
        x: xUnit,
        y:
          rowBottom,
      },
      end: {
        x: xUnit,
        y,
      },
      thickness:
        0.4,
      color:
        COLOR_BORDER,
    });

    page.drawLine({
      start: {
        x: xSubtotal,
        y:
          rowBottom,
      },
      end: {
        x: xSubtotal,
        y,
      },
      thickness:
        0.4,
      color:
        COLOR_BORDER,
    });

    if (
      esPrimerFragmento
    ) {
      const cantidadTexto =
        cantidad.toLocaleString(
          "es-AR",
          {
            maximumFractionDigits:
              2,
          }
        );

      const cantidadAncho =
        regular.widthOfTextAtSize(
          cantidadTexto,
          SERVICE_DETAIL_SIZE
        );

      page.drawText(
        cantidadTexto,
        {
          x:
            xQty +
            (
              qtyWidth -
              cantidadAncho
            ) /
              2,
          y:
            y -
            15,
          size:
            SERVICE_DETAIL_SIZE,
          font:
            regular,
          color:
            COLOR_TEXT,
        }
      );

      textoDerecha(
        page,
        dinero(
          precioUnitario,
          moneda
        ),
        xSubtotal -
          5,
        y - 15,
        regular,
        SERVICE_DETAIL_SIZE,
        COLOR_TEXT
      );

      textoDerecha(
        page,
        dinero(
          subtotalItem,
          moneda
        ),
        PAGE_WIDTH -
          MARGIN -
          5,
        y - 15,
        bold,
        SERVICE_DETAIL_SIZE,
        COLOR_TEXT
      );
    }

    let textoY =
      y - 12;

    if (
      !esPrimerFragmento
    ) {
      for (
        const linea
        of etiquetaContinuacion
      ) {
        page.drawText(
          linea,
          {
            x:
              xDesc +
              6,
            y:
              textoY,
            size: 6.7,
            font: bold,
            color:
              COLOR_ORANGE,
          }
        );

        textoY -=
          SERVICE_LINE_HEIGHT;
      }
    }

    for (
      const linea of lineas
    ) {
      page.drawText(
        linea.texto,
        {
          x:
            xDesc +
            6,
          y:
            textoY,
          size:
            linea.negrita
              ? SERVICE_NAME_SIZE
              : SERVICE_DETAIL_SIZE,
          font:
            linea.negrita
              ? bold
              : regular,
          color:
            linea.negrita
              ? COLOR_TEXT
              : COLOR_MUTED,
        }
      );

      textoY -=
        SERVICE_LINE_HEIGHT;
    }

    return rowBottom;
  }

  /*
   * =====================================================
   * SERVICIOS
   * =====================================================
   */

  for (
    let itemIndex = 0;
    itemIndex <
    items.length;
    itemIndex += 1
  ) {
    const item =
      items[itemIndex];

    const esUltimoItem =
      itemIndex ===
      items.length - 1;

    const nombreServicio =
      texto(
        item.nombre_corto
      ) || "Servicio";

    const nombreLineas =
      envolverTexto(
        nombreServicio,
        bold,
        SERVICE_NAME_SIZE,
        descWidth - 12
      ).map(
        (linea) => ({
          texto:
            linea,
          negrita:
            true,
        })
      );

    const detalleTexto =
      texto(
        item.detalle
      );

    const detalleLineas =
      detalleTexto
        ? envolverTexto(
            detalleTexto,
            regular,
            SERVICE_DETAIL_SIZE,
            descWidth -
              12
          ).map(
            (linea) => ({
              texto:
                linea,
              negrita:
                false,
            })
          )
        : [];

    const lineasCompletas:
      LineaServicio[] = [
        ...nombreLineas,
        ...detalleLineas,
      ];

    const cantidad =
      numero(
        item.cantidad
      );

    const precioUnitario =
      numero(
        item.precio_unitario
      );

    const subtotalItem =
      item.subtotal !==
        null &&
      item.subtotal !==
        undefined
        ? numero(
            item.subtotal
          )
        : cantidad *
          precioUnitario;

    let indiceLinea = 0;

    let primerFragmento =
      true;

    while (
      indiceLinea <
      lineasCompletas.length
    ) {
      /*
       * Si este es el último servicio,
       * reservamos abajo el espacio fijo
       * para condiciones y valores.
       *
       * Si no entra, continúa en otra hoja.
       */
      const limiteInferior =
        esUltimoItem
          ? SUMMARY_TOP +
            8
          : SERVICE_BOTTOM_NORMAL;

      const etiquetaContinuacion =
        primerFragmento
          ? []
          : envolverTexto(
              `Continuacion - ${nombreServicio}`,
              bold,
              6.7,
              descWidth -
                12
            );

      const lineasEtiqueta =
        etiquetaContinuacion.length;

      const espacioDisponible =
        y -
        limiteInferior;

      const lineasQueEntran =
        Math.floor(
          (
            espacioDisponible -
            10
          ) /
            SERVICE_LINE_HEIGHT
        ) -
        lineasEtiqueta;

      /*
       * No queda lugar suficiente:
       * pasamos a una hoja nueva.
       */
      if (
        lineasQueEntran <
        1
      ) {
        paginasConContinuacion.add(
          pdf.getPageCount() -
            1
        );

        actual =
          crearPaginaContinuacion();

        page =
          actual.page;

        y =
          actual.y;

        continue;
      }

      const restantes =
        lineasCompletas.length -
        indiceLinea;

      const cantidadTomar =
        Math.min(
          restantes,
          lineasQueEntran
        );

      const fragmento =
        lineasCompletas.slice(
          indiceLinea,
          indiceLinea +
            cantidadTomar
        );

      const cantidadLineasVisuales =
        fragmento.length +
        lineasEtiqueta;

      const altura =
        Math.max(
          26,
          10 +
            cantidadLineasVisuales *
              SERVICE_LINE_HEIGHT
        );

      y =
        dibujarFragmentoServicio({
          page,
          y,
          altura,
          lineas:
            fragmento,
          cantidad,
          precioUnitario,
          subtotalItem,
          esPrimerFragmento:
            primerFragmento,
          etiquetaContinuacion,
        });

      indiceLinea +=
        cantidadTomar;

      primerFragmento =
        false;

      /*
       * Este servicio todavía tiene texto.
       * La hoja actual queda vinculada
       * explícitamente con la siguiente.
       */
      if (
        indiceLinea <
        lineasCompletas.length
      ) {
        paginasConContinuacion.add(
          pdf.getPageCount() -
            1
        );

        actual =
          crearPaginaContinuacion();

        page =
          actual.page;

        y =
          actual.y;
      }
    }
  }

  /*
   * Si excepcionalmente no hubo servicios,
   * conservamos igualmente una presentación
   * coherente.
   */
  if (
    items.length === 0
  ) {
    const altura = 30;

    page.drawRectangle({
      x: MARGIN,
      y:
        y -
        altura,
      width:
        CONTENT_WIDTH,
      height:
        altura,
      color:
        rgb(
          1,
          1,
          1
        ),
      borderColor:
        COLOR_BORDER,
      borderWidth:
        0.45,
    });

    page.drawText(
      "Sin servicios cargados.",
      {
        x:
          xDesc +
          6,
        y:
          y -
          18,
        size: 7.5,
        font:
          regular,
        color:
          COLOR_MUTED,
      }
    );

    y -= altura;
  }

  /*
   * =====================================================
   * CONDICIONES Y TOTALES
   * SIEMPRE EN LA ÚLTIMA HOJA
   * EN LA MISMA POSICIÓN.
   * =====================================================
   */

  if (
    y <
    SUMMARY_TOP +
      8
  ) {
    paginasConContinuacion.add(
      pdf.getPageCount() -
        1
    );

    actual =
      crearPaginaContinuacion();

    page =
      actual.page;

    y =
      actual.y;
  }

  const inferiorTop =
    SUMMARY_TOP -
    8;

  const inferiorBottom =
    SUMMARY_BOTTOM;

  const inferiorHeight =
    inferiorTop -
    inferiorBottom;

  const separacion = 10;

  const totalesWidth =
    210;

  const condicionesWidth =
    CONTENT_WIDTH -
    totalesWidth -
    separacion;

  const condicionesX =
    MARGIN;

  const totalesX =
    MARGIN +
    condicionesWidth +
    separacion;

  page.drawRectangle({
    x:
      condicionesX,
    y:
      inferiorBottom,
    width:
      condicionesWidth,
    height:
      inferiorHeight,
    color:
      COLOR_LIGHT,
    borderColor:
      COLOR_BORDER,
    borderWidth:
      0.6,
  });

  page.drawText(
    "CONDICIONES",
    {
      x:
        condicionesX +
        9,
      y:
        inferiorTop -
        15,
      size: 7,
      font: bold,
      color:
        COLOR_MUTED,
    }
  );

  const condiciones:
    string[] = [];

  if (
    texto(
      snapshot.forma_pago
    )
  ) {
    condiciones.push(
      `Forma de pago: ${texto(
        snapshot.forma_pago
      )}`
    );
  }

  if (
    texto(
      snapshot.condiciones_pago
    )
  ) {
    condiciones.push(
      `Condiciones: ${texto(
        snapshot.condiciones_pago
      )}`
    );
  }

  if (
    snapshot.vigencia_dias !==
      null &&
    snapshot.vigencia_dias !==
      undefined
  ) {
    condiciones.push(
      `Validez: ${numero(
        snapshot.vigencia_dias
      )} dias`
    );
  }

  if (
    texto(
      snapshot.fecha_programada
    )
  ) {
    const fecha =
      fechaArgentina(
        snapshot.fecha_programada
      );

    const hora =
      horaArgentina(
        snapshot.hora_programada
      );

    condiciones.push(
      `Trabajo programado: ${fecha}${
        hora
          ? ` - ${hora} hs`
          : ""
      }`
    );
  }

  if (
    texto(
      snapshot.observaciones_cliente
    )
  ) {
    condiciones.push(
      `Observaciones: ${texto(
        snapshot.observaciones_cliente
      )}`
    );
  }

  if (
    texto(
      empresa.texto_pie_presupuesto
    )
  ) {
    condiciones.push(
      texto(
        empresa.texto_pie_presupuesto
      )
    );
  }

  dibujarTextoAjustado({
    page,
    valor:
      condiciones.join(
        "\n"
      ) || "-",
    x:
      condicionesX +
      9,
    yTop:
      inferiorTop -
      29,
    ancho:
      condicionesWidth -
      18,
    alto:
      inferiorHeight -
      39,
    font:
      regular,
    color:
      COLOR_TEXT,
    sizeInicial: 7.5,
    sizeMinimo: 5.5,
  });

  /*
   * TOTALES
   */

  const subtotal =
    numero(
      snapshot.subtotal
    );

  const descuentoValor =
    numero(
      snapshot.descuento_valor
    );

  const recargoValor =
    numero(
      snapshot.recargo_valor
    );

  const descuentoMonto =
    snapshot.descuento_tipo ===
    "porcentaje"
      ? subtotal *
        (
          descuentoValor /
          100
        )
      : snapshot.descuento_tipo ===
          "importe"
        ? descuentoValor
        : 0;

  const baseConDescuento =
    Math.max(
      0,
      subtotal -
        descuentoMonto
    );

  const recargoMonto =
    snapshot.recargo_tipo ===
    "porcentaje"
      ? baseConDescuento *
        (
          recargoValor /
          100
        )
      : snapshot.recargo_tipo ===
          "importe"
        ? recargoValor
        : 0;

  const total =
    numero(
      snapshot.total
    );

  const filasTotales:
    Array<{
      etiqueta: string;
      valor: string;
      destacado?: boolean;
    }> = [
      {
        etiqueta:
          "Subtotal",
        valor:
          dinero(
            subtotal,
            moneda
          ),
      },
    ];

  if (
    descuentoMonto > 0
  ) {
    const detalleDescuento =
      snapshot.descuento_tipo ===
      "porcentaje"
        ? ` (${descuentoValor.toLocaleString(
            "es-AR",
            {
              maximumFractionDigits:
                2,
            }
          )}%)`
        : "";

    filasTotales.push({
      etiqueta:
        `Descuento${detalleDescuento}`,
      valor:
        `- ${dinero(
          descuentoMonto,
          moneda
        )}`,
    });
  }

  if (
    recargoMonto > 0
  ) {
    const detalleRecargo =
      snapshot.recargo_tipo ===
      "porcentaje"
        ? ` (${recargoValor.toLocaleString(
            "es-AR",
            {
              maximumFractionDigits:
                2,
            }
          )}%)`
        : "";

    filasTotales.push({
      etiqueta:
        `Recargo${detalleRecargo}`,
      valor:
        `+ ${dinero(
          recargoMonto,
          moneda
        )}`,
    });
  }

  filasTotales.push({
    etiqueta:
      "TOTAL",
    valor:
      dinero(
        total,
        moneda
      ),
    destacado:
      true,
  });

  const filaHeight =
    Math.min(
      29,
      inferiorHeight /
        filasTotales.length
    );

  let totalY =
    inferiorTop;

  for (
    const fila
    of filasTotales
  ) {
    const altura =
      fila.destacado
        ? Math.max(
            filaHeight,
            28
          )
        : filaHeight;

    page.drawRectangle({
      x:
        totalesX,
      y:
        totalY -
        altura,
      width:
        totalesWidth,
      height:
        altura,
      color:
        fila.destacado
          ? COLOR_DARK
          : COLOR_LIGHT,
      borderColor:
        fila.destacado
          ? COLOR_DARK
          : COLOR_BORDER,
      borderWidth:
        0.6,
    });

    page.drawText(
      fila.etiqueta,
      {
        x:
          totalesX +
          8,
        y:
          totalY -
          altura +
          altura /
            2 -
          3,
        size:
          fila.destacado
            ? 9
            : 7.5,
        font:
          bold,
        color:
          fila.destacado
            ? rgb(
                1,
                1,
                1
              )
            : COLOR_TEXT,
      }
    );

    textoDerecha(
      page,
      fila.valor,
      totalesX +
        totalesWidth -
        8,
      totalY -
        altura +
        altura /
          2 -
        3,
      bold,
      fila.destacado
        ? 9.5
        : 7.5,
      fila.destacado
        ? rgb(
            1,
            1,
            1
          )
        : COLOR_TEXT
    );

    totalY -=
      altura;
  }

  /*
   * =====================================================
   * RELACIÓN ENTRE TODAS LAS HOJAS
   * =====================================================
   *
   * Se realiza al final porque recién ahora
   * sabemos cuántas páginas tiene el PDF.
   */

  const paginas =
    pdf.getPages();

  const totalPaginas =
    paginas.length;

  paginas.forEach(
    (
      pagina,
      indice
    ) => {
      /*
       * Aviso de continuación.
       */
      if (
        paginasConContinuacion.has(
          indice
        ) &&
        indice <
          totalPaginas -
            1
      ) {
        const aviso =
          `Detalle continua en hoja ${
            indice + 2
          } ->`;

        textoDerecha(
          pagina,
          aviso,
          PAGE_WIDTH -
            MARGIN,
          66,
          bold,
          7,
          COLOR_ORANGE
        );
      }

      /*
       * Línea del pie.
       */
      lineaHorizontal(
        pagina,
        FOOTER_LINE_Y
      );

      pagina.drawText(
        "Este documento no es valido como factura.",
        {
          x: MARGIN,
          y:
            FOOTER_TEXT_Y,
          size: 7.1,
          font: bold,
          color:
            COLOR_DARK,
        }
      );

      const referencia =
        `${web} | Presupuesto Nro. ${numeroVisible} | Hoja ${
          indice + 1
        } de ${totalPaginas}`;

      textoDerecha(
        pagina,
        referencia,
        PAGE_WIDTH -
          MARGIN,
        FOOTER_TEXT_Y,
        regular,
        6.5,
        COLOR_MUTED
      );
    }
  );

  return await pdf.save();
}
