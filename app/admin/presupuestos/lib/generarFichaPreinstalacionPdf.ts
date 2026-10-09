import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Empresa = { nombre: string; direccion: string; telefono: string; email: string; cuit: string };
export async function generarFichaPreinstalacionPdf(input: {
  numeroInicial: number;
  cantidad: number;
  empresa?: Partial<Empresa>;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const azul = rgb(0.12, 0.31, 0.47);
  const gris = rgb(0.42, 0.46, 0.49);
  const linea = rgb(0.72, 0.76, 0.79);
  const tenue = rgb(0.67, 0.71, 0.74);
  const empresa = input.empresa || {};
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "logo-enfri-ar.png"));
    logo = await pdf.embedPng(bytes);
  } catch { /* El encabezado textual funciona sin logo. */ }
  for (let i = 0; i < input.cantidad; i++) {
    const page = pdf.addPage([595.28, 841.89]);
    const left = 30, right = 565, width = right - left;
    const text = (value: string, x: number, y: number, size = 8, strong = false) =>
      page.drawText(value, { x, y, size, font: strong ? bold : normal, color: strong ? azul : gris });
    const rule = (x1: number, y1: number, x2: number, y2: number, color = linea, thickness = 0.6) =>
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
    const field = (label: string, x: number, y: number, end: number) => {
      text(label, x, y, 7, true);
      rule(x + bold.widthOfTextAtSize(label, 7) + 6, y - 2, end, y - 2);
    };
    const heading = (label: string, y: number) => {
      page.drawRectangle({ x: left, y: y - 7, width, height: 21, color: rgb(0.93, 0.96, 0.98), borderColor: linea, borderWidth: 0.6 });
      text(label, left + 8, y, 8, true);
    };
    const check = (label: string, x: number, y: number) => {
      page.drawRectangle({ x, y: y - 2, width: 9, height: 9, borderColor: gris, borderWidth: 0.8 });
      text(label, x + 14, y, 7);
    };
    if (logo) {
      const scale = Math.min(76 / logo.width, 33 / logo.height);
      page.drawImage(logo, { x: left, y: 785, width: logo.width * scale, height: logo.height * scale });
    } else text("ENFRI.AR", left, 803, 16, true);
    text("FICHA DE VISITA - PREINSTALACIÓN", 148, 806, 11, true);
    text("N° " + String(input.numeroInicial + i).padStart(6, "0"), 480, 806, 10, true);
    text(empresa.nombre || "Enfri.Ar Refrigeración", left, 775, 7);
    text([empresa.direccion, empresa.telefono, empresa.email].filter(Boolean).join("  |  ").slice(0, 125), left, 764, 6.5);
    rule(left, 753, right, 753, azul, 1);
    heading("DATOS DE LA VISITA", 732);
    field("Fecha:", left, 706, 165);
    field("Hora:", 183, 706, 288);
    field("Técnico:", 305, 706, right);
    field("Cliente / contacto:", left, 682, 320);
    field("Teléfono:", 335, 682, right);
    field("Dirección / lote / unidad:", left, 658, right);
    field("Barrio / country / localidad:", left, 634, right);
    heading("DATOS DE LA PREINSTALACIÓN", 606);
    field("Ambiente / sector:", left, 580, 302);
    field("Piso / planta:", 319, 580, right);
    check("Split", left, 557); check("Piso techo", 125, 557); check("Cassette", 257, 557); check("Otro", 377, 557);
    field("Capacidad estimada:", left, 532, 268);
    field("Ubicación unidad interior:", 287, 532, right);
    field("Ubicación unidad exterior:", left, 508, right);
    field("Recorrido estimado de cañerías (m):", left, 484, 320);
    field("Desagüe / descarga:", 336, 484, right);
    field("Alimentación eléctrica / toma:", left, 460, right);
    heading("CROQUIS DEL AMBIENTE Y RECORRIDO", 434);
    text("Dibujar a lápiz: ubicación interior (UI), exterior (UE), inicio, recorrido y fin de cañerías, desagüe y medidas.", left + 4, 411, 6.8);
    const gx = left + 1, gy = 114, gw = width - 2, gh = 285, step = 18;
    page.drawRectangle({ x: gx, y: gy, width: gw, height: gh, borderColor: azul, borderWidth: 1 });
    for (let x = gx + step; x < gx + gw; x += step) rule(x, gy, x, gy + gh, tenue, 0.65);
    for (let y = gy + step; y < gy + gh; y += step) rule(gx, y, gx + gw, y, tenue, 0.3);
    heading("OBSERVACIONES / MATERIALES / MEDIDAS", 92);
    rule(left, 60, right, 60);
    rule(left, 44, right, 44);
    text("Firma técnico:", left, 27, 7, true);
    rule(105, 25, 305, 25);
    text("Firma contacto:", 325, 27, 7, true);
    rule(410, 25, right, 25);
  }
  return pdf.save();
}
