import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const DEFAULT_TECH = "Claudio GONZALEZ";
const DEFAULT_LICENSE = "RNC-447052";

export async function agregarIdentificacionMatriculado(
  pdf: PDFDocument,
  options: { tecnico?: string | null; matricula?: string | null; excluirPaginas?: number[] } = {}
) {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supplied = (options.matricula || "").trim();
  const matricula = supplied || DEFAULT_LICENSE;
  const tecnico = (options.tecnico || "").trim() || (supplied ? "" : DEFAULT_TECH);
  const heading = "TECNICO MATRICULADO  |  " + (tecnico ? tecnico + "  |  " : "") + matricula;
  const footer = "Servicio tecnico matriculado  -  RENACLI  |  Matricula " + matricula;
  pdf.getPages().forEach((page, index) => {
    if (options.excluirPaginas?.includes(index)) return;
    const width = page.getWidth(), height = page.getHeight();
    const topSize = 7.4, footSize = 6.7;
    const x = Math.max(24,(width-bold.widthOfTextAtSize(heading,topSize))/2);
    page.drawText(heading,{x,y:height-11,size:topSize,font:bold,color:rgb(.11,.32,.42)});
    page.drawText(footer,{x:Math.max(24,(width-font.widthOfTextAtSize(footer,footSize))/2),y:11,size:footSize,font,color:rgb(.25,.37,.42)});
  });
}
