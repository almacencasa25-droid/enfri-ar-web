import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** Identificación institucional para los PDF emitidos por Enfri.Ar.
 * No se atribuye una matrícula a otro técnico si no fue informada.
 */
const DEFAULT_TECH = "Claudio GONZALEZ";
const DEFAULT_LICENSE = "RNC-447052";
const REGISTRY_URL = "https://renacli.com.ar";

export async function agregarIdentificacionMatriculado(
  pdf: PDFDocument,
  options: { tecnico?: string | null; matricula?: string | null; excluirPaginas?: number[] } = {}
) {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supplied = (options.matricula || "").trim();
  const otroTecnico = Boolean((options.tecnico || "").trim());
  const matricula = supplied || (otroTecnico ? "" : DEFAULT_LICENSE);
  if (!matricula) return;
  const tecnico = (options.tecnico || "").trim() || DEFAULT_TECH;

  pdf.getPages().forEach((page, index) => {
    if (options.excluirPaginas?.includes(index)) return;
    const width = page.getWidth();

    // Recuadro en el borde inferior, por debajo del pie comercial del presupuesto.
    const x = 34, y = 6, boxWidth = width - 68, boxHeight = 24;
    page.drawRectangle({
      x, y, width: boxWidth, height: boxHeight,
      color: rgb(.944,.979,.984),
      borderColor: rgb(.31,.58,.65),
      borderWidth: .7,
    });
    page.drawRectangle({
      x: x + 5, y: y + 4, width: 72, height: 16,
      color: rgb(.075,.27,.36),
    });
    // Identidad tipográfica. No suplanta un archivo de logo oficial que no esté disponible.
    page.drawText("RENACLI", {
      x: x + 13, y: y + 9, size: 9,
      font: bold, color: rgb(1,1,1),
    });
    page.drawText("Verifique la matricula profesional en:", {
      x: x + 86, y: y + 14, size: 7.3,
      font: bold, color: rgb(.09,.25,.35),
    });
    page.drawText("www.renacli.com.ar", {
      x: x + 86, y: y + 5, size: 7,
      font, color: rgb(.14,.34,.45),
    });
  });
}
