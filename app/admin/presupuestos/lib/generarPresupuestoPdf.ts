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

type FilaCalculada = {
  item: PresupuestoPdfItem;
  nombreLineas: string[];
  detalleLineas: string[];
  altura: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 34;
const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const FOOTER_Y = 37;

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
  const convertido =
    Number(valor);

  return Number.isFinite(
    convertido
  )
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
  let size = sizeInicial;

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

  const maxLineas =
    Math.max(
      1,
      Math.floor(
        alto / lineHeight
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
    visibles.length
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
    lineas: visibles,
    x,
    y: yTop,
    font,
    size,
    lineHeight,
    color,
  });

  return {
    size,
    lineas: visibles,
  };
}

function calcularFilas({
  items,
  bold,
  regular,
  nombreSize,
  detalleSize,
  lineHeight,
  anchoDetalle,
}: {
  items: PresupuestoPdfItem[];
  bold: PDFFont;
  regular: PDFFont;
  nombreSize: number;
  detalleSize: number;
  lineHeight: number;
  anchoDetalle: number;
}) {
  const filas:
    FilaCalculada[] = [];

  let alturaTotal = 0;

  for (
    const item of items
  ) {
    const nombreLineas =
      envolverTexto(
        texto(
          item.nombre_corto
        ) || "Trabajo",
        bold,
        nombreSize,
        anchoDetalle
      );

    const detalle =
      texto(
        item.detalle
      );

    const detalleLineas =
      detalle
        ? envolverTexto(
            detalle,
            regular,
            detalleSize,
            anchoDetalle
          )
        : [];

    const cantidadLineas =
      nombreLineas.length +
      detalleLineas.length;

    const altura =
      Math.max(
        25,
        10 +
          cantidadLineas *
            lineHeight
      );

    filas.push({
      item,
      nombreLineas,
      detalleLineas,
      altura,
    });

    alturaTotal += altura;
  }

  return {
    filas,
    alturaTotal,
  };
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

  const page =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

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
   * ENCABEZADO COMPACTO
   * =====================================================
   */

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
    texto(
      empresa.website
    ),
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
   * =====================================================
   * CLIENTE COMPACTO
   * =====================================================
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
    borderWidth: 0.6,
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

  page.drawText(
    nombre,
    {
      x:
        MARGIN +
        9,
      y:
        clienteTop -
        27,
      size: 9,
      font: bold,
      color:
        COLOR_TEXT,
    }
  );

  if (documento) {
    page.drawText(
      documento,
      {
        x:
          MARGIN +
          280,
        y:
          clienteTop -
          27,
        size: 8,
        font: regular,
        color:
          COLOR_TEXT,
      }
    );
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
      font: regular,
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
      font: regular,
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
   * =====================================================
   * DETALLE GENERAL
   * =====================================================
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
        font: regular,
        size: 7.5,
        lineHeight: 9,
        color:
          COLOR_TEXT,
      });

    y -= 7;
  }

  /*
   * =====================================================
   * RESERVA INFERIOR
   * =====================================================
   */

  const bottomTop = 205;

  const tablaDisponible =
    Math.max(
      120,
      y - bottomTop
    );

  /*
   * =====================================================
   * TABLA ADAPTABLE
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

  let nombreSize = 8;
  let detalleSize = 7.2;
  let lineHeight = 8.7;

  let calculo =
    calcularFilas({
      items,
      bold,
      regular,
      nombreSize,
      detalleSize,
      lineHeight,
      anchoDetalle:
        descWidth -
        12,
    });

  const headerHeight =
    21;

  const tamanos = [
    {
      nombre: 8,
      detalle: 7.2,
      linea: 8.7,
    },
    {
      nombre: 7.5,
      detalle: 6.8,
      linea: 8.1,
    },
    {
      nombre: 7,
      detalle: 6.3,
      linea: 7.5,
    },
    {
      nombre: 6.5,
      detalle: 5.9,
      linea: 7,
    },
    {
      nombre: 6,
      detalle: 5.5,
      linea: 6.5,
    },
  ];

  for (
    const tamano of tamanos
  ) {
    nombreSize =
      tamano.nombre;

    detalleSize =
      tamano.detalle;

    lineHeight =
      tamano.linea;

    calculo =
      calcularFilas({
        items,
        bold,
        regular,
        nombreSize,
        detalleSize,
        lineHeight,
        anchoDetalle:
          descWidth -
          12,
      });

    if (
      calculo.alturaTotal +
        headerHeight <=
      tablaDisponible
    ) {
      break;
    }
  }

  const tablaTop =
    y;

  page.drawRectangle({
    x: MARGIN,
    y:
      tablaTop -
      headerHeight,
    width:
      CONTENT_WIDTH,
    height:
      headerHeight,
    color:
      COLOR_DARK,
  });

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

  page.drawText(
    "Cant.",
    {
      x:
        xQty +
        7,
      y:
        tablaTop -
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
        tablaTop -
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
        tablaTop -
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
        tablaTop -
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

  y =
    tablaTop -
    headerHeight;

  for (
    const fila of
    calculo.filas
  ) {
    const item =
      fila.item;

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

    let altura =
      fila.altura;

    const espacioRestante =
      y - bottomTop;

    if (
      altura >
      espacioRestante
    ) {
      altura =
        Math.max(
          22,
          espacioRestante
        );
    }

    const rowBottom =
      y - altura;

    page.drawRectangle({
      x: MARGIN,
      y: rowBottom,
      width:
        CONTENT_WIDTH,
      height: altura,
      color:
        rgb(
          1,
          1,
          1
        ),
      borderColor:
        COLOR_BORDER,
      borderWidth: 0.45,
    });

    page.drawLine({
      start: {
        x: xDesc,
        y: rowBottom,
      },
      end: {
        x: xDesc,
        y,
      },
      thickness: 0.4,
      color:
        COLOR_BORDER,
    });

    page.drawLine({
      start: {
        x: xUnit,
        y: rowBottom,
      },
      end: {
        x: xUnit,
        y,
      },
      thickness: 0.4,
      color:
        COLOR_BORDER,
    });

    page.drawLine({
      start: {
        x: xSubtotal,
        y: rowBottom,
      },
      end: {
        x: xSubtotal,
        y,
      },
      thickness: 0.4,
      color:
        COLOR_BORDER,
    });

    const cantidadTexto =
      cantidad.toLocaleString(
        "es-AR",
        {
          maximumFractionDigits: 2,
        }
      );

    const cantidadAncho =
      regular.widthOfTextAtSize(
        cantidadTexto,
        detalleSize
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
          detalleSize,
        font:
          regular,
        color:
          COLOR_TEXT,
      }
    );

    let textoY =
      y - 12;

    const altoTexto =
      Math.max(
        10,
        altura - 8
      );

    const lineasNombre =
      fila.nombreLineas;

    const lineasDetalle =
      fila.detalleLineas;

    const totalLineas =
      [
        ...lineasNombre,
        ...lineasDetalle,
      ];

    const maxLineas =
      Math.max(
        1,
        Math.floor(
          altoTexto /
            lineHeight
        )
      );

    const visibles =
      totalLineas.slice(
        0,
        maxLineas
      );

    const nombreCantidad =
      Math.min(
        lineasNombre.length,
        visibles.length
      );

    for (
      let indice = 0;
      indice <
      visibles.length;
      indice += 1
    ) {
      const esNombre =
        indice <
        nombreCantidad;

      page.drawText(
        visibles[indice],
        {
          x:
            xDesc +
            6,
          y:
            textoY,
          size:
            esNombre
              ? nombreSize
              : detalleSize,
          font:
            esNombre
              ? bold
              : regular,
          color:
            esNombre
              ? COLOR_TEXT
              : COLOR_MUTED,
        }
      );

      textoY -=
        lineHeight;
    }

    textoDerecha(
      page,
      dinero(
        precioUnitario,
        moneda
      ),
      xSubtotal - 5,
      y - 15,
      regular,
      detalleSize,
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
      detalleSize,
      COLOR_TEXT
    );

    y =
      rowBottom;

    if (
      y <=
      bottomTop
    ) {
      break;
    }
  }

  /*
   * =====================================================
   * PARTE INFERIOR
   * CONDICIONES IZQUIERDA
   * TOTALES DERECHA
   * =====================================================
   */

  const inferiorTop =
    bottomTop - 8;

  const inferiorBottom =
    67;

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
    borderWidth: 0.6,
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

  const condiciones: string[] =
    [];

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
   * =====================================================
   * TOTALES
   * =====================================================
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

  const filasTotales: Array<{
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
              maximumFractionDigits: 2,
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
              maximumFractionDigits: 2,
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
          (
            altura /
            2
          ) -
          3,
        size:
          fila.destacado
            ? 9
            : 7.5,
        font: bold,
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
        (
          altura /
          2
        ) -
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
   * PIE
   * =====================================================
   */

  lineaHorizontal(
    page,
    55
  );

  page.drawText(
    "Este documento no es valido como factura.",
    {
      x: MARGIN,
      y:
        FOOTER_Y,
      size: 7.2,
      font: bold,
      color:
        COLOR_DARK,
    }
  );

  const web =
    texto(
      empresa.website
    ) ||
    "www.enfriar.com.ar";

  textoDerecha(
    page,
    web,
    PAGE_WIDTH -
      MARGIN,
    FOOTER_Y,
    regular,
    7,
    COLOR_MUTED
  );

  return await pdf.save();
}
