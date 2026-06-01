// ============================================================
// PDF TEMA MERKEZİ — Tüm frontend PDF çıktıları için tek kaynak
// ============================================================
// Backend report-generator.service.ts ile aynı renk paleti ve
// tasarım dilini kullanır. jsPDF tabanlı tüm dokümanlar buradan
// geçmelidir.
// ============================================================

import jsPDF from 'jspdf';
import { ORG } from './org-config';

// Backend COLORS ile senkron renk paleti
export const PDF_COLORS = {
    primary: [0, 61, 121] as [number, number, number],         // #003D79
    primaryDark: [0, 40, 85] as [number, number, number],      // #002855
    gold: [191, 155, 48] as [number, number, number],          // #BF9B30
    white: [255, 255, 255] as [number, number, number],
    text: [30, 41, 59] as [number, number, number],            // #1e293b
    textSecondary: [100, 116, 139] as [number, number, number],// #64748b
    textMuted: [148, 163, 184] as [number, number, number],    // #94a3b8
    border: [226, 232, 240] as [number, number, number],       // #e2e8f0
    bgLight: [248, 250, 252] as [number, number, number],      // #f8fafc
    riskKritik: [127, 29, 29] as [number, number, number],     // #7f1d1d
    riskYuksek: [220, 38, 38] as [number, number, number],     // #dc2626
    riskOrta: [249, 115, 22] as [number, number, number],      // #f97316
    riskDusuk: [250, 204, 21] as [number, number, number],     // #facc15
    success: [16, 185, 129] as [number, number, number],       // #10b981
    danger: [220, 38, 38] as [number, number, number],         // #dc2626
};

/**
 * Türkçeye özel karakterleri jsPDF standard helvetica fontu için temizler
 */
export function sanitizePdfText(text: string | null | undefined): string {
    if (!text) return '';
    const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    return text.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (match) => trMap[match] || match);
}

/**
 * Tüm PDF sayfalarına üst header bandı çizer.
 * Backend drawPageTemplate ile aynı tasarım.
 */
export function drawPdfHeader(doc: jsPDF, title: string) {
    const W = doc.internal.pageSize.getWidth();

    // Blue header bar
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(0, 0, W, 28, 'F');

    // Gold accent line
    doc.setFillColor(...PDF_COLORS.gold);
    doc.rect(0, 28, W, 1.5, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.white);
    const headerStr = `${ORG.companyName} | ${ORG.departmentName}`.toUpperCase();
    doc.text(sanitizePdfText(headerStr), 12, 13);

    // Report type (right side)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(sanitizePdfText(title), W - 12, 13, { align: 'right' });

    // Left accent bar
    doc.setFillColor(200, 220, 240);
    doc.rect(0, 29.5, 2.5, doc.internal.pageSize.getHeight() - 59, 'F');
}

/**
 * Tüm PDF sayfalarına alt footer çizer.
 */
export function drawPdfFooter(doc: jsPDF, pageNum: number, totalPages: number) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const footerY = H - 22;

    // Top line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(12, footerY, W - 12, footerY);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(sanitizePdfText(ORG.footerNotice), 12, footerY + 8);

    // Page number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(`Sayfa ${pageNum} / ${totalPages}`, W - 12, footerY + 8, { align: 'right' });
}

/**
 * Tüm sayfalar oluşturulduktan sonra, her sayfaya header+footer uygular.
 */
export function applyPdfTemplate(doc: jsPDF, title: string) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawPdfHeader(doc, title);
        drawPdfFooter(doc, i, pageCount);
    }
}

/**
 * Bölüm başlığı çizer (Section Header).
 * Backend drawSectionHeader ile aynı tasarım.
 */
export function drawPdfSectionHeader(doc: jsPDF, title: string, y: number): number {
    const W = doc.internal.pageSize.getWidth();

    // Blue accent bar
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(12, y, 3, 16, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(sanitizePdfText(title), 20, y + 11);

    // Underline
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(12, y + 19, W - 12, y + 19);

    return y + 26;
}

/**
 * İçerik bölümü başlangıç Y koordinatı.
 * Header altında kalmasını sağlar.
 */
export const PDF_CONTENT_START_Y = 40;

/**
 * Sayfa sonunda güvenli alan (footer ile çakışmayı önler).
 */
export const PDF_SAFE_BOTTOM = 35;
