import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireAdminUser } from "@/lib/auth/admin";
import { categoriasTarifario } from "@/lib/tarifarios-2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const interno = request.nextUrl.searchParams.get("tipo") === "interno";
  if (interno) {
    try { await requireAdminUser(); }
    catch { return new NextResponse("Acceso reservado a administradores", { status: 403 }); }
  }
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.055, 0.25, 0.41);
  const teal = rgb(0.02, 0.52, 0.69);
  const pale = rgb(0.92, 0.97, 0.99);
  const ink = rgb(0.13, 0.22, 0.31);
  const money = (v: number) => "$ " + v.toLocaleString("es-AR");
  const clean = (s: string) => s.replace(/—/g, "-").replace(/–/g, "-");
  const fit = (text: string, max: number, start: number) => {
    let size = start;
    while (font.widthOfTextAtSize(clean(text), size) > max && size > 8) size -= .25;
    return size;
  };
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "logo-enfri-ar.png"));
    const logo = await doc.embedPng(logoBytes);
    const scale = Math.min(120 / logo.width, 59 / logo.height);
    page.drawImage(logo, { x: 37, y: 742, width: logo.width * scale, height: logo.height * scale });
  } catch { /* PDF sigue disponible aunque falte el logo */ }
  page.drawText("TARIFARIO ENFRI.AR", { x: 166, y: 791, font: bold, size: 19, color: blue });
  page.drawText(interno ? "Uso interno - mano de obra" : "Referencia para técnicos - mano de obra", { x: 166, y: 770, font: bold, size: 10.5, color: teal });
  page.drawText("Octubre 2026  |  Sin materiales ni repuestos", { x: 166, y: 752, font, size: 9.5, color: ink });
  page.drawLine({ start: { x: 35, y: 729 }, end: { x: 560, y: 729 }, thickness: 1.5, color: teal });
  let y = 712;
  for (const cat of categoriasTarifario) {
    page.drawRectangle({ x: 35, y: y - 21, width: 525, height: 23, color: blue });
    page.drawText(clean(cat.titulo), { x: 44, y: y - 14, size: 11.5, font: bold, color: rgb(1,1,1) });
    y -= 27;
    for (const [index, [name, internalPrice, studentPrice]] of cat.trabajos.entries()) {
      const price = interno ? internalPrice : studentPrice;
      page.drawRectangle({ x: 35, y: y - 20, width: 525, height: 23, color: (index % 2) ? rgb(1,1,1) : pale });
      page.drawText(clean(name), { x: 43, y: y - 13, size: fit(name, 390, 10.6), font, color: ink });
      const priceText = money(price);
      page.drawText(priceText, { x: 552 - bold.widthOfTextAtSize(priceText, 11), y: y - 13, size: 11, font: bold, color: blue });
      y -= 23;
    }
    y -= 9;
  }
  page.drawText(interno ? "Valores internos propuestos para Enfri.Ar." : "Valores orientativos; no son los precios comerciales de Enfri.Ar.", { x: 37, y: 51, size: 9, font: bold, color: blue });
  page.drawText("Trabajos especiales, altura, traslados y materiales se presupuestan aparte.", { x: 37, y: 37, size: 8.5, font, color: ink });
  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + (interno ? "EnfriAr_Tarifario_Interno_2026.pdf" : "EnfriAr_Tarifario_Tecnicos_2026.pdf") + '"',
      "Cache-Control": interno ? "private, no-store" : "public, max-age=3600",
    },
  });
}
