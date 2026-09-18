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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 42;
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
  0.82,
  0.84,
  0.85
);

const COLOR_LIGHT = rgb(
  0.96,
  0.98,
  0.99
);

function numero(
  valor: number | string | null | undefined
) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function texto(
  valor: string | number | null | undefined
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
  valor: string | null | undefined
) {
  if (!valor) {
    return "";
  }

  const fecha = valor.slice(0, 10);

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function horaArgentina(
  valor: string | null | undefined
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
        currency: moneda || "ARS",
        maximumFractionDigits: 2,
      }
    ).format(valor);
  } catch {
    return `$ ${valor.toFixed(2)}`;
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

  if (texto(cliente.razon_social)) {
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

  return nombre || "Cliente";
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
  const resultado: string[] = [];

  const bloques = valor
    .replace(/\r/g, "")
    .split("\n");

  for (const bloque of bloques) {
    if (!bloque.trim()) {
      resultado.push("");
      continue;
    }

    const palabras =
      bloque.split(/\s+/);

    let linea = "";

    for (const palabraOriginal of palabras) {
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

      for (const palabra of partes) {
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

  return resultado.length > 0
    ? resultado
    : [""];
}

function dibujarTextoEnvuelto({
  page,
  valor,
  x,
  y,
  ancho,
  font,
  size,
  lineHeight,
  color,
}: {
  page: PDFPage;
  valor: string;
  x: number;
  y: number;
  ancho: number;
  font: PDFFont;
  size: number;
  lineHeight: number;
  color: RGB;
}) {
  const lineas =
    envolverTexto(
      valor,
      font,
      size,
      ancho
    );

  let actualY = y;

  for (const linea of lineas) {
    page.drawText(linea, {
      x,
      y: actualY,
      size,
      font,
      color,
    });

    actualY -= lineHeight;
  }

  return actualY;
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
    size,
    font,
    color,
  });
}

function lineaHorizontal(
  page: PDFPage,
  y: number,
  color: RGB = COLOR_BORDER
) {
  page.drawLine({
    start: {
      x: MARGIN,
      y,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y,
    },
    thickness: 0.8,
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

function etiquetaValor({
  page,
  etiqueta,
  valor,
  x,
  y,
  ancho,
  regular,
  bold,
}: {
  page: PDFPage;
  etiqueta: string;
  valor: string;
  x: number;
  y: number;
  ancho: number;
  regular: PDFFont;
  bold: PDFFont;
}) {
  page.drawText(etiqueta, {
    x,
    y,
    size: 8,
    font: bold,
    color: COLOR_MUTED,
  });

  return dibujarTextoEnvuelto({
    page,
    valor: valor || "-",
    x,
    y: y - 13,
    ancho,
    font: regular,
    size: 9.5,
    lineHeight: 12,
    color: COLOR_TEXT,
  });
}

export async function generarPresupuestoPdf(
  snapshot: PresupuestoPdfSnapshot,
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
    Array.isArray(snapshot.items)
      ? snapshot.items
      : [];

  const moneda =
    texto(snapshot.moneda) ||
    "ARS";

  const numeroPresupuesto =
    numero(snapshot.numero);

  const numeroVisible =
    String(numeroPresupuesto).padStart(
      6,
      "0"
    );

  const empresaNombre =
    texto(empresa.company_name) ||
    texto(empresa.short_name) ||
    "Enfri.Ar Refrigeración";

  pdf.setTitle(
    `Presupuesto ${numeroVisible}`
  );

  pdf.setAuthor(empresaNombre);

  pdf.setSubject(
    `Presupuesto Enfri.Ar Nro. ${numeroVisible}`
  );

  pdf.setCreator(
    "Enfri.Ar Refrigeración"
  );

  let page: PDFPage;

  let y = 0;

  function encabezadoPrincipal() {
    page = pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 12,
      width: PAGE_WIDTH,
      height: 12,
      color: COLOR_BLUE,
    });

    page.drawRectangle({
      x: PAGE_WIDTH - 150,
      y: 0,
      width: 150,
      height: 7,
      color: COLOR_ORANGE,
    });

    if (logo) {
      const escala = Math.min(
        155 / logo.width,
        68 / logo.height
      );

      page.drawImage(logo, {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          52 -
          logo.height * escala,
        width:
          logo.width * escala,
        height:
          logo.height * escala,
      });
    } else {
      page.drawText(
        "Enfri.Ar",
        {
          x: MARGIN,
          y: PAGE_HEIGHT - 78,
          size: 28,
          font: bold,
          color: COLOR_DARK,
        }
      );
    }

    let empresaY =
      PAGE_HEIGHT - 47;

    const empresaLineas = [
      empresaNombre,
      texto(empresa.address),
      texto(empresa.phone)
        ? `Tel.: ${texto(
            empresa.phone
          )}`
        : "",
      texto(empresa.email),
      texto(empresa.website),
    ].filter(Boolean);

    for (
      let i = 0;
      i < empresaLineas.length;
      i += 1
    ) {
      textoDerecha(
        page,
        empresaLineas[i],
        PAGE_WIDTH - MARGIN,
        empresaY,
        i === 0 ? bold : regular,
        i === 0 ? 10.5 : 8.5,
        i === 0
          ? COLOR_DARK
          : COLOR_MUTED
      );

      empresaY -=
        i === 0 ? 15 : 12;
    }

    y = PAGE_HEIGHT - 145;

    lineaHorizontal(
      page,
      y,
      COLOR_BLUE
    );

    y -= 31;

    page.drawText(
      "PRESUPUESTO",
      {
        x: MARGIN,
        y,
        size: 22,
        font: bold,
        color: COLOR_DARK,
      }
    );

    textoDerecha(
      page,
      `Nro. ${numeroVisible}`,
      PAGE_WIDTH - MARGIN,
      y + 2,
      bold,
      15,
      COLOR_BLUE
    );

    y -= 24;

    page.drawText(
      `Fecha: ${fechaArgentina(
        snapshot.fecha
      )}`,
      {
        x: MARGIN,
        y,
        size: 9,
        font: regular,
        color: COLOR_MUTED,
      }
    );

    textoDerecha(
      page,
      `Versión ${version}`,
      PAGE_WIDTH - MARGIN,
      y,
      regular,
      9,
      COLOR_MUTED
    );

    y -= 28;
  }

  function encabezadoContinuacion() {
    page = pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 10,
      width: PAGE_WIDTH,
      height: 10,
      color: COLOR_BLUE,
    });

    page.drawText(
      empresaNombre,
      {
        x: MARGIN,
        y: PAGE_HEIGHT - 48,
        size: 10,
        font: bold,
        color: COLOR_DARK,
      }
    );

    textoDerecha(
      page,
      `Presupuesto Nro. ${numeroVisible} - continuación`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 48,
      regular,
      9,
      COLOR_MUTED
    );

    lineaHorizontal(
      page,
      PAGE_HEIGHT - 62
    );

    y = PAGE_HEIGHT - 86;
  }

  function asegurarEspacio(
    altoNecesario: number
  ) {
    if (
      y - altoNecesario >= 78
    ) {
      return;
    }

    encabezadoContinuacion();
  }

  function cabeceraTabla() {
    const alto = 24;

    page.drawRectangle({
      x: MARGIN,
      y: y - alto,
      width: CONTENT_WIDTH,
      height: alto,
      color: COLOR_DARK,
    });

    const qtyX = MARGIN;
    const descX =
      MARGIN + 44;
    const unitX =
      MARGIN + 334;
    const subtotalX =
      MARGIN + 416;

    page.drawText("Cant.", {
      x: qtyX + 8,
      y: y - 16,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    });

    page.drawText(
      "Trabajo / detalle",
      {
        x: descX + 7,
        y: y - 16,
        size: 8,
        font: bold,
        color: rgb(1, 1, 1),
      }
    );

    page.drawText(
      "P. unitario",
      {
        x: unitX + 7,
        y: y - 16,
        size: 8,
        font: bold,
        color: rgb(1, 1, 1),
      }
    );

    page.drawText(
      "Subtotal",
      {
        x: subtotalX + 7,
        y: y - 16,
        size: 8,
        font: bold,
        color: rgb(1, 1, 1),
      }
    );

    y -= alto;
  }

  encabezadoPrincipal();

  const clienteBoxTop = y;

  const clienteNombre =
    nombreCliente(cliente);

  const clienteId =
    texto(cliente.cuit)
      ? `CUIT: ${texto(
          cliente.cuit
        )}`
      : texto(cliente.dni)
        ? `DNI: ${texto(
            cliente.dni
          )}`
        : "-";

  const direccion = [
    texto(cliente.direccion),
    texto(cliente.localidad),
  ]
    .filter(Boolean)
    .join(" - ");

  page.drawRectangle({
    x: MARGIN,
    y: clienteBoxTop - 106,
    width: CONTENT_WIDTH,
    height: 106,
    color: COLOR_LIGHT,
    borderColor: COLOR_BORDER,
    borderWidth: 0.8,
  });

  etiquetaValor({
    page,
    etiqueta: "CLIENTE",
    valor: clienteNombre,
    x: MARGIN + 12,
    y: clienteBoxTop - 18,
    ancho: 228,
    regular,
    bold,
  });

  etiquetaValor({
    page,
    etiqueta: "DNI / CUIT",
    valor: clienteId,
    x: MARGIN + 265,
    y: clienteBoxTop - 18,
    ancho: 220,
    regular,
    bold,
  });

  etiquetaValor({
    page,
    etiqueta: "DIRECCIÓN",
    valor: direccion || "-",
    x: MARGIN + 12,
    y: clienteBoxTop - 65,
    ancho: 228,
    regular,
    bold,
  });

  etiquetaValor({
    page,
    etiqueta: "CONTACTO",
    valor: [
      texto(cliente.telefono),
      texto(cliente.email),
    ]
      .filter(Boolean)
      .join(" - ") || "-",
    x: MARGIN + 265,
    y: clienteBoxTop - 65,
    ancho: 220,
    regular,
    bold,
  });

  y = clienteBoxTop - 125;

  if (texto(snapshot.detalle_corto)) {
    page.drawText(
      "DETALLE DEL PRESUPUESTO",
      {
        x: MARGIN,
        y,
        size: 8,
        font: bold,
        color: COLOR_MUTED,
      }
    );

    y -= 16;

    y = dibujarTextoEnvuelto({
      page,
      valor: texto(
        snapshot.detalle_corto
      ),
      x: MARGIN,
      y,
      ancho: CONTENT_WIDTH,
      font: regular,
      size: 10,
      lineHeight: 13,
      color: COLOR_TEXT,
    });

    y -= 12;
  }

  asegurarEspacio(65);

  cabeceraTabla();

  for (const item of items) {
    const cantidad =
      numero(item.cantidad);

    const precioUnitario =
      numero(
        item.precio_unitario
      );

    const subtotalItem =
      item.subtotal !== null &&
      item.subtotal !== undefined
        ? numero(item.subtotal)
        : cantidad *
          precioUnitario;

    const nombreLineas =
      envolverTexto(
        texto(
          item.nombre_corto
        ) || "Trabajo",
        bold,
        8.5,
        274
      );

    const detalleLineas =
      envolverTexto(
        texto(item.detalle),
        regular,
        8,
        274
      );

    const cantidadLineas =
      nombreLineas.length +
      detalleLineas.length;

    const rowHeight =
      Math.max(
        34,
        11 +
          cantidadLineas * 10
      );

    if (
      y - rowHeight < 78
    ) {
      encabezadoContinuacion();
      cabeceraTabla();
    }

    const rowBottom =
      y - rowHeight;

    page.drawRectangle({
      x: MARGIN,
      y: rowBottom,
      width: CONTENT_WIDTH,
      height: rowHeight,
      borderColor: COLOR_BORDER,
      borderWidth: 0.6,
      color: rgb(1, 1, 1),
    });

    const xQty = MARGIN;
    const xDesc =
      MARGIN + 44;
    const xUnit =
      MARGIN + 334;
    const xSubtotal =
      MARGIN + 416;

    page.drawLine({
      start: {
        x: xDesc,
        y: rowBottom,
      },
      end: {
        x: xDesc,
        y,
      },
      thickness: 0.5,
      color: COLOR_BORDER,
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
      thickness: 0.5,
      color: COLOR_BORDER,
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
      thickness: 0.5,
      color: COLOR_BORDER,
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
        8.5
      );

    page.drawText(
      cantidadTexto,
      {
        x:
          xQty +
          (44 -
            cantidadAncho) /
            2,
        y: y - 20,
        size: 8.5,
        font: regular,
        color: COLOR_TEXT,
      }
    );

    let textoY = y - 16;

    for (const linea of nombreLineas) {
      page.drawText(linea, {
        x: xDesc + 7,
        y: textoY,
        size: 8.5,
        font: bold,
        color: COLOR_TEXT,
      });

      textoY -= 10;
    }

    for (const linea of detalleLineas) {
      page.drawText(linea, {
        x: xDesc + 7,
        y: textoY,
        size: 8,
        font: regular,
        color: COLOR_MUTED,
      });

      textoY -= 10;
    }

    textoDerecha(
      page,
      dinero(
        precioUnitario,
        moneda
      ),
      xSubtotal - 7,
      y - 20,
      regular,
      8,
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
        7,
      y - 20,
      bold,
      8,
      COLOR_TEXT
    );

    y = rowBottom;
  }

  y -= 18;

  asegurarEspacio(150);

  const subtotal =
    numero(snapshot.subtotal);

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
        (descuentoValor / 100)
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
        (recargoValor / 100)
      : snapshot.recargo_tipo ===
          "importe"
        ? recargoValor
        : 0;

  const total =
    numero(snapshot.total);

  const totalX =
    PAGE_WIDTH - MARGIN - 220;

  const totalWidth = 220;

  const filasTotales: Array<{
    etiqueta: string;
    valor: string;
    destacado?: boolean;
  }> = [
    {
      etiqueta: "Subtotal",
      valor: dinero(
        subtotal,
        moneda
      ),
    },
  ];

  if (
    snapshot.descuento_tipo &&
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
    snapshot.recargo_tipo &&
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
    etiqueta: "TOTAL",
    valor: dinero(
      total,
      moneda
    ),
    destacado: true,
  });

  for (const fila of filasTotales) {
    const alto =
      fila.destacado
        ? 31
        : 24;

    page.drawRectangle({
      x: totalX,
      y: y - alto,
      width: totalWidth,
      height: alto,
      color:
        fila.destacado
          ? COLOR_DARK
          : COLOR_LIGHT,
      borderColor:
        fila.destacado
          ? COLOR_DARK
          : COLOR_BORDER,
      borderWidth: 0.6,
    });

    page.drawText(
      fila.etiqueta,
      {
        x: totalX + 9,
        y:
          y -
          (fila.destacado
            ? 20
            : 16),
        size:
          fila.destacado
            ? 10
            : 8.5,
        font: bold,
        color:
          fila.destacado
            ? rgb(1, 1, 1)
            : COLOR_TEXT,
      }
    );

    textoDerecha(
      page,
      fila.valor,
      totalX +
        totalWidth -
        9,
      y -
        (fila.destacado
          ? 20
          : 16),
      bold,
      fila.destacado
        ? 11
        : 8.5,
      fila.destacado
        ? rgb(1, 1, 1)
        : COLOR_TEXT
    );

    y -= alto;
  }

  y -= 22;

  const datosExtra: string[] = [];

  if (texto(snapshot.forma_pago)) {
    datosExtra.push(
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
    datosExtra.push(
      `Condiciones: ${texto(
        snapshot.condiciones_pago
      )}`
    );
  }

  if (
    numero(
      snapshot.vigencia_dias
    ) >= 0 &&
    snapshot.vigencia_dias !==
      null &&
    snapshot.vigencia_dias !==
      undefined
  ) {
    datosExtra.push(
      `Validez del presupuesto: ${numero(
        snapshot.vigencia_dias
      )} días`
    );
  }

  if (
    texto(
      snapshot.fecha_programada
    )
  ) {
    const fechaTrabajo =
      fechaArgentina(
        snapshot.fecha_programada
      );

    const horaTrabajo =
      horaArgentina(
        snapshot.hora_programada
      );

    datosExtra.push(
      `Trabajo programado: ${fechaTrabajo}${
        horaTrabajo
          ? ` - ${horaTrabajo} hs`
          : ""
      }`
    );
  }

  if (datosExtra.length > 0) {
    asegurarEspacio(
      34 +
        datosExtra.length *
          14
    );

    page.drawText(
      "CONDICIONES",
      {
        x: MARGIN,
        y,
        size: 8,
        font: bold,
        color: COLOR_MUTED,
      }
    );

    y -= 17;

    for (const dato of datosExtra) {
      y = dibujarTextoEnvuelto({
        page,
        valor: dato,
        x: MARGIN,
        y,
        ancho:
          CONTENT_WIDTH,
        font: regular,
        size: 9,
        lineHeight: 12,
        color: COLOR_TEXT,
      });

      y -= 3;
    }

    y -= 10;
  }

  if (
    texto(
      snapshot.observaciones_cliente
    )
  ) {
    const lineas =
      envolverTexto(
        texto(
          snapshot.observaciones_cliente
        ),
        regular,
        9,
        CONTENT_WIDTH - 20
      );

    const alto =
      36 +
      lineas.length * 12;

    asegurarEspacio(alto);

    page.drawRectangle({
      x: MARGIN,
      y: y - alto,
      width: CONTENT_WIDTH,
      height: alto,
      color: COLOR_LIGHT,
      borderColor: COLOR_BORDER,
      borderWidth: 0.6,
    });

    page.drawText(
      "OBSERVACIONES",
      {
        x: MARGIN + 10,
        y: y - 18,
        size: 8,
        font: bold,
        color: COLOR_MUTED,
      }
    );

    let observacionY =
      y - 34;

    for (const linea of lineas) {
      page.drawText(linea, {
        x: MARGIN + 10,
        y: observacionY,
        size: 9,
        font: regular,
        color: COLOR_TEXT,
      });

      observacionY -= 12;
    }

    y -= alto + 16;
  }

  if (
    texto(
      empresa.texto_pie_presupuesto
    )
  ) {
    const pieLineas =
      envolverTexto(
        texto(
          empresa.texto_pie_presupuesto
        ),
        regular,
        8.5,
        CONTENT_WIDTH
      );

    asegurarEspacio(
      20 +
        pieLineas.length *
          11
    );

    page.drawText(
      "INFORMACIÓN",
      {
        x: MARGIN,
        y,
        size: 8,
        font: bold,
        color: COLOR_MUTED,
      }
    );

    y -= 16;

    for (const linea of pieLineas) {
      page.drawText(linea, {
        x: MARGIN,
        y,
        size: 8.5,
        font: regular,
        color: COLOR_TEXT,
      });

      y -= 11;
    }
  }

  const paginas =
    pdf.getPages();

  paginas.forEach(
    (pagina, indice) => {
      pagina.drawLine({
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
        thickness: 0.6,
        color: COLOR_BORDER,
      });

      pagina.drawText(
        "Este documento no es válido como factura.",
        {
          x: MARGIN,
          y: 37,
          size: 8,
          font: bold,
          color: COLOR_DARK,
        }
      );

      const web =
        texto(
          empresa.website
        ) ||
        "www.enfriar.com.ar";

      const paginaTexto =
        `${web}  |  Página ${
          indice + 1
        } de ${paginas.length}`;

      textoDerecha(
        pagina,
        paginaTexto,
        PAGE_WIDTH - MARGIN,
        37,
        regular,
        7.5,
        COLOR_MUTED
      );
    }
  );

  return await pdf.save();
}
