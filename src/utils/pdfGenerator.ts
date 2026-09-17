import { jsPDF } from 'jspdf';
import { StockItem, GroundingSource } from '../types';
import { parseItemTechnicalDimensions } from './technicalDimensions';

/**
 * Clean markdown symbols for PDF text rendering
 */
function cleanMarkdownLine(line: string): string {
  return line
    .replace(/^#+\s*/, '') // remove headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italic
    .replace(/`([^`]+)`/g, '$1') // remove code ticks
    .replace(/^[-*]\s*/, '• ') // replace list items with bullet
    .replace(/^>\s*/, '') // remove blockquote
    .trim();
}

/**
 * Generates and downloads a standardized, professional engineering PDF Data-Sheet
 * for any stock item, suitable for mobile, tablet, and desktop viewing/saving.
 */
export function generateDatasheetPdf(
  item: StockItem,
  markdownContent?: string,
  sources?: GroundingSource[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Colors
  const primaryDark = [15, 23, 42]; // Slate 900
  const primaryBlue = [14, 116, 144]; // Cyan/Teal 700
  const accentAmber = [217, 119, 6]; // Amber 600
  const bgLight = [248, 250, 252]; // Slate 50
  const borderLight = [226, 232, 240]; // Slate 200
  const textDark = [30, 41, 59]; // Slate 800
  const textMuted = [100, 116, 139]; // Slate 500

  // Technical Dimensions
  const dims = parseItemTechnicalDimensions(item.descricao, item.categoria, item.subCategoria);

  // Helper for adding a new page with header and footer
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = margin;
      drawPageHeaderMini();
    }
  };

  const drawPageHeaderMini = () => {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`MANUTAMAKI // DATA-SHEET TÉCNICO - ITEM ${item.codigo}`, margin + 3, currentY + 5.5);
    currentY += 12;
  };

  // --- 1. COVER / TOP OFFICIAL HEADER ---
  doc.setFillColor(15, 23, 42); // Dark navy header
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');

  // Brand / Plant Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUTAMAKI INDUSTRIAL', margin + 6, currentY + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('ALMOXARIFADO TÉCNICO // FICHA DE ESPECIFICAÇÃO INDUSTRIAL', margin + 6, currentY + 15);

  // Right-aligned status pill
  const pillW = 44;
  const pillX = pageWidth - margin - pillW - 6;
  doc.setFillColor(14, 116, 144);
  doc.roundedRect(pillX, currentY + 5, pillW, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('HOMOLOGADO MRO', pillX + pillW / 2, currentY + 9.5, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 6, currentY + 19, { align: 'right' });

  currentY += 28;

  // --- 2. ITEM MAIN IDENTIFICATION BLOCK ---
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  // Item Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text(item.codigo, margin + 5, currentY + 8);

  // Item Description
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const splitDesc = doc.splitTextToSize(item.descricao.toUpperCase(), contentWidth - 10);
  doc.text(splitDesc, margin + 5, currentY + 14);

  // Category & Location line
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const catLine = `CATEGORIA: ${item.categoria || 'N/A'}  |  SUBCATEGORIA: ${item.subCategoria || 'N/A'}  |  LOCAL: ${item.localizacao || 'Almoxarifado'}`;
  doc.text(catLine, margin + 5, currentY + 22);

  currentY += 31;

  // --- 3. TECHNICAL DIMENSIONS & COTAS (HIGHLIGHTED SECTION) ---
  checkPageBreak(50);
  doc.setFillColor(254, 243, 199); // Light amber
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'FD');

  const titleText = 'ESPECIFICAÇÕES DIMENSIONAIS E COTAS DE ENGENHARIA';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber 900
  doc.text(titleText, margin + 4, currentY + 5.5);

  const titleWidth = doc.getTextWidth(titleText);
  const maxStandardWidth = contentWidth - titleWidth - 14;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let standardText = `Norma: ${dims.standard}`;

  // Truncate cleanly if standard text exceeds remaining box width
  if (doc.getTextWidth(standardText) > maxStandardWidth) {
    while (standardText.length > 10 && doc.getTextWidth(standardText + '...') > maxStandardWidth) {
      standardText = standardText.slice(0, -1);
    }
    standardText += '...';
  }

  // Right-aligned strictly inside the amber box boundary with padding
  doc.text(standardText, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
  currentY += 10;

  // Dimension Table Header
  const colW = [52, 40, 35, 55]; // sum = 182 (exact contentWidth)
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(margin, currentY, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('Parâmetro / Cota', margin + 2, currentY + 4.5);
  doc.text('Nominal', margin + colW[0] + 2, currentY + 4.5);
  doc.text('Tolerância', margin + colW[0] + colW[1] + 2, currentY + 4.5);
  doc.text('Função / Alojamento', margin + colW[0] + colW[1] + colW[2] + 2, currentY + 4.5);

  currentY += 6.5;

  // Dimension Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  dims.rows.forEach((row, idx) => {
    checkPageBreak(8);
    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(margin, currentY + 6, margin + contentWidth, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const paramText = doc.splitTextToSize(row.parameter, colW[0] - 4);
    doc.text(paramText[0] || row.parameter, margin + 2, currentY + 4.2);

    doc.setTextColor(14, 116, 144);
    const nominalText = doc.splitTextToSize(row.nominalValue, colW[1] - 4);
    doc.text(nominalText[0] || row.nominalValue, margin + colW[0] + 2, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const tolText = doc.splitTextToSize(row.tolerance, colW[2] - 4);
    doc.text(tolText[0] || row.tolerance, margin + colW[0] + colW[1] + 2, currentY + 4.2);

    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const note = doc.splitTextToSize(row.engineeringNote, colW[3] - 4);
    doc.text(note[0] || '', margin + colW[0] + colW[1] + colW[2] + 2, currentY + 4.2);

    currentY += 6;
  });

  currentY += 6;

  // --- 4. MARKDOWN CONTENT SECTIONS ---
  if (markdownContent) {
    const rawLines = markdownContent.split('\n');
    let inTable = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();

      // Skip lines already rendered in headers/dimensions or markdown dividers
      if (!line || line.startsWith('---') || line.startsWith('***') || line.startsWith('===') || line.startsWith('|')) {
        continue;
      }
      if (line.startsWith('# DATA-SHEET') || line.startsWith('**Denominação:**') || line.startsWith('**Classificação:**') || line.startsWith('**Status de')) {
        continue;
      }

      // Check for Section Titles (### or ##)
      if (line.startsWith('###') || line.startsWith('##')) {
        const title = cleanMarkdownLine(line);
        // Avoid duplicate dimension title
        if (title.toUpperCase().includes('ESPECIFICAÇÕES DIMENSIONAIS') || title.toUpperCase().includes('COTAS DE ENGENHARIA')) {
          continue;
        }

        checkPageBreak(16);
        currentY += 3;

        // Section Title Pill
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
        doc.text(title.toUpperCase(), margin + 3, currentY + 4.5);
        currentY += 8.5;
        continue;
      }

      // Check for list items (bullet points)
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        const bulletText = cleanMarkdownLine(line);
        checkPageBreak(10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);

        const wrapped = doc.splitTextToSize(bulletText, contentWidth - 6);
        doc.text(wrapped, margin + 4, currentY);
        currentY += wrapped.length * 4.2 + 1;
        continue;
      }

      // Regular descriptive paragraph
      const cleanText = cleanMarkdownLine(line);
      if (cleanText.length > 0) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        const wrapped = doc.splitTextToSize(cleanText, contentWidth - 4);
        doc.text(wrapped, margin + 2, currentY);
        currentY += wrapped.length * 4.2 + 1.5;
      }
    }
  }

  // --- 5. SOURCES & REFERENCES ---
  if (sources && sources.length > 0) {
    checkPageBreak(22);
    currentY += 4;
    doc.setFillColor(240, 249, 255); // Sky 50
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(margin, currentY, contentWidth, 6, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(3, 105, 161);
    doc.text(`FONTES E CATÁLOGOS CONSULTADOS (${sources.length})`, margin + 3, currentY + 4.2);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    sources.slice(0, 4).forEach((s) => {
      checkPageBreak(6);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      const srcText = `• ${s.title || 'Catálogo Oficial'}: ${s.uri}`;
      const splitSrc = doc.splitTextToSize(srcText, contentWidth - 6);
      doc.text(splitSrc[0] || srcText, margin + 3, currentY);
      currentY += 4;
    });
  }

  // --- 6. PAGE FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('MANUTAMAKI // ALMOXARIFADO TÉCNICO - CONTROLE DE MRO INDUSTRIAL', margin, pageHeight - 7);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Sanitize filename and trigger direct download
  const sanitizedCode = item.codigo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DataSheet_${sanitizedCode}.pdf`;

  // Save/Download the file in .pdf format
  doc.save(filename);
}
