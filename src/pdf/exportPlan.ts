import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { buildPdfSections } from "./buildPdfContent";
import type { PlanData } from "@wizard/stepValidators";
import { THEME } from "@constants/theme";

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 7;
const TITLE_GAP = 3;
const BLOCK_GAP = 4;
const FOOTER_LINE_HEIGHT = 3.5;
const TABLE_ROW_HEIGHT_ESTIMATE = 7;
const TABLE_HEADER_HEIGHT_ESTIMATE = 8;
const MIN_TABLE_ROWS_TO_KEEP_TOGETHER = 3;

const DISCLAIMER_LINE =
  "Este documento no es una herramienta oficial de la UNGRD y contiene datos sensibles (identificación, salud, discapacidad, dirección) — a diferencia de la app, este archivo no expira ni se borra solo.";
const CITATION_LINE = "Basado en el Formato Plan Familiar de la UNGRD — portal.gestiondelriesgo.gov.co/simulacro";

export function generatePlanPdf(planData: PlanData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = PAGE_MARGIN;

  doc.setFontSize(8);
  const disclaimerLineCount = (doc.splitTextToSize(DISCLAIMER_LINE, pageWidth - PAGE_MARGIN * 2) as string[]).length;
  const footerReserve = disclaimerLineCount * FOOTER_LINE_HEIGHT;
  doc.setFontSize(10);

  function ensureSpace(extra: number) {
    if (y + extra > pageHeight - PAGE_MARGIN - footerReserve) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  doc.setFontSize(16);
  doc.text("Plan Familiar de Emergencias", PAGE_MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toISOString().slice(0, 10)}`, PAGE_MARGIN, y);
  y += LINE_HEIGHT - 2 + TITLE_GAP;
  doc.setFontSize(10);

  for (const section of buildPdfSections(planData)) {
    const firstBlock = section.blocks[0];
    const firstBlockMinHeight = !firstBlock
      ? 0
      : firstBlock.type === "lines"
        ? LINE_HEIGHT
        : TABLE_HEADER_HEIGHT_ESTIMATE +
          Math.min(MIN_TABLE_ROWS_TO_KEEP_TOGETHER, firstBlock.rows.length) * TABLE_ROW_HEIGHT_ESTIMATE;
    ensureSpace(LINE_HEIGHT * 2 + firstBlockMinHeight);
    doc.setFontSize(13);
    doc.text(section.title, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFontSize(10);

    for (const block of section.blocks) {
      if (block.type === "lines") {
        for (const line of block.lines) {
          const wrapped = doc.splitTextToSize(line, pageWidth - PAGE_MARGIN * 2) as string[];
          for (const wrappedLine of wrapped) {
            ensureSpace(LINE_HEIGHT);
            doc.text(wrappedLine, PAGE_MARGIN, y);
            y += LINE_HEIGHT;
          }
        }
      } else {
        const rowsToKeepTogether = Math.min(MIN_TABLE_ROWS_TO_KEEP_TOGETHER, block.rows.length);
        ensureSpace(TABLE_HEADER_HEIGHT_ESTIMATE + rowsToKeepTogether * TABLE_ROW_HEIGHT_ESTIMATE);
        autoTable(doc, {
          startY: y,
          head: [block.head],
          body: block.rows,
          margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN + footerReserve },
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: THEME.colors.primary, textColor: "#FFFFFF" },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + BLOCK_GAP;
      }
    }
    y += TITLE_GAP;
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    const disclaimerLines = doc.splitTextToSize(DISCLAIMER_LINE, pageWidth - PAGE_MARGIN * 2) as string[];
    let footerY = pageHeight - 8 - disclaimerLines.length * FOOTER_LINE_HEIGHT;
    for (const line of disclaimerLines) {
      doc.text(line, PAGE_MARGIN, footerY);
      footerY += FOOTER_LINE_HEIGHT;
    }
    doc.text(CITATION_LINE, PAGE_MARGIN, pageHeight - 8);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 8, { align: "right" });
  }

  return doc;
}
