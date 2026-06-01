import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './audit-utils';
import { ORG } from './org-config';
import {
    PDF_COLORS,
    applyPdfTemplate,
    drawPdfSectionHeader,
    PDF_CONTENT_START_Y,
    PDF_SAFE_BOTTOM,
    sanitizePdfText,
} from './pdf-theme';

export const exportAuditToPdf = (auditData: any, findings: any[]) => {
    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        
        // Dynamically determine report title and filename suffix based on audit status
        let reportTitle = 'Denetim Raporu';
        let filenameSuffix = 'raporu';

        if (auditData.status === 'Taslak' || auditData.status === 'Planlandı') {
            reportTitle = 'Denetim Bildirimi';
            filenameSuffix = 'bildirimi';
        } else if (auditData.status === 'Devam Ediyor' || auditData.status === 'Gözden Geçirme') {
            reportTitle = 'Denetim Çalışma Planı';
            filenameSuffix = 'calisma_plani';
        } else {
            reportTitle = 'Denetim Raporu';
            filenameSuffix = 'raporu';
        }

        // === PAGE 1: COVER ===
        // Minimal top accent
        doc.setFillColor(...PDF_COLORS.primary);
        doc.rect(0, 0, W, 8, 'F');
        doc.setFillColor(...PDF_COLORS.gold);
        doc.rect(0, 8, W, 2, 'F');

        // Company & Department
        let y = 120;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...PDF_COLORS.primaryDark);
        doc.text(sanitizePdfText(ORG.companyName).toUpperCase(), W / 2, y, { align: 'center' });
        y += 22;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(...PDF_COLORS.textSecondary);
        doc.text(sanitizePdfText(ORG.departmentName).toUpperCase(), W / 2, y, { align: 'center' });

        // Gold line
        y += 30;
        doc.setDrawColor(...PDF_COLORS.gold);
        doc.setLineWidth(2);
        doc.line(W / 2 - 30, y, W / 2 + 30, y);

        // Report Title
        y += 35;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.text(sanitizePdfText(reportTitle).toUpperCase(), W / 2, y, { align: 'center' });

        // Audit Title
        y += 30;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(...PDF_COLORS.text);
        const titleLines = doc.splitTextToSize(sanitizePdfText(auditData.title || '-'), W - 160);
        doc.text(titleLines, W / 2, y, { align: 'center' });

        // Metadata box
        y += titleLines.length * 18 + 40;
        const boxX = 100;
        const boxW = W - 200;
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setFillColor(...PDF_COLORS.bgLight);
        doc.roundedRect(boxX, y, boxW, 100, 4, 4, 'FD');

        const metaItems = [
            ['Denetim Kodu', auditData.auditCode || '-'],
            ['Durum', auditData.status || '-'],
            ['Oluşturma Tarihi', formatDate(auditData.createdAt)],
        ];
        let metaY = y + 20;
        metaItems.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.textSecondary);
            doc.text(`${sanitizePdfText(label)}:`, boxX + 20, metaY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...PDF_COLORS.text);
            doc.text(sanitizePdfText(value), boxX + 130, metaY);
            metaY += 24;
        });

        // Bottom bar
        doc.setFillColor(...PDF_COLORS.gold);
        doc.rect(0, H - 40, W, 2, 'F');
        doc.setFillColor(...PDF_COLORS.primaryDark);
        doc.rect(0, H - 38, W, 38, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(sanitizePdfText(`${ORG.platformName} (AMS)`), W / 2, H - 18, { align: 'center' });

        // === PAGE 2: DENETİM DETAYLARI ===
        doc.addPage();
        y = PDF_CONTENT_START_Y;
        y = drawPdfSectionHeader(doc, 'DENETİM DETAYLARI', y);

        const detailItems = [
            ['Denetim Amacı', auditData.objective || 'Belirtilmemiş'],
            ['Kapsam', auditData.scope || 'Belirtilmemiş'],
            ['Yöntem', auditData.methodology || 'Belirtilmemiş'],
            ['Kriterler', auditData.criteria || 'Belirtilmemiş'],
        ];

        detailItems.forEach(([label, value]) => {
            if (y > H - PDF_SAFE_BOTTOM - 60) {
                doc.addPage();
                y = PDF_CONTENT_START_Y;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.primary);
            doc.text(sanitizePdfText(label), 20, y);
            y += 14;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.text);
            const lines = doc.splitTextToSize(sanitizePdfText(value), W - 40);
            doc.text(lines, 20, y);
            y += lines.length * 12 + 10;
        });

        // === FINDINGS SECTION ===
        if (findings && findings.length > 0) {
            if (y > H - PDF_SAFE_BOTTOM - 80) {
                doc.addPage();
                y = PDF_CONTENT_START_Y;
            }
            y = drawPdfSectionHeader(doc, `BULGULAR ÖZETİ (${findings.length} Adet)`, y);

            autoTable(doc, {
                startY: y,
                head: [[
                    sanitizePdfText('Kod'),
                    sanitizePdfText('Bulgu Başlığı'),
                    sanitizePdfText('Risk'),
                    sanitizePdfText('Durum'),
                    sanitizePdfText('Tarih')
                ]],
                body: findings.map(f => [
                    sanitizePdfText(f.findingCode || f.code || '-'),
                    sanitizePdfText((f.title || '-').substring(0, 60)),
                    sanitizePdfText(f.riskLevel || f.risk || '-'),
                    sanitizePdfText(f.status || '-'),
                    sanitizePdfText(formatDate(f.createdAt))
                ]),
                theme: 'grid',
                headStyles: {
                    fillColor: PDF_COLORS.primary,
                    textColor: PDF_COLORS.white,
                    fontStyle: 'bold',
                    fontSize: 8,
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    lineColor: PDF_COLORS.border,
                    lineWidth: 0.3,
                },
                alternateRowStyles: { fillColor: PDF_COLORS.bgLight },
            });
        } else {
            y += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...PDF_COLORS.textMuted);
            doc.text(sanitizePdfText('Bu denetime ait kayıtlı bulgu bulunmamaktadır.'), 20, y);
        }

        // Apply unified template to all pages (header+footer)
        applyPdfTemplate(doc, reportTitle);

        doc.save(`${auditData.auditCode || 'denetim'}_${filenameSuffix}.pdf`);
        return true;
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        return false;
    }
};

export const exportFindingToPdf = (finding: any) => {
    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const W = doc.internal.pageSize.getWidth();
        const reportTitle = 'Bulgu Detay Raporu';
        let y = PDF_CONTENT_START_Y;

        // Section header
        y = drawPdfSectionHeader(doc, 'BULGU DETAY RAPORU', y);

        // Info table
        autoTable(doc, {
            startY: y,
            head: [[sanitizePdfText('Özellik'), sanitizePdfText('Değer')]],
            body: [
                [sanitizePdfText('Bulgu Kodu'), sanitizePdfText(finding.findingCode || finding.code || '-')],
                [sanitizePdfText('Başlık'), sanitizePdfText(finding.title || '-')],
                [sanitizePdfText('Denetim'), sanitizePdfText(finding.auditName || finding.auditTitle || '-')],
                [sanitizePdfText('Risk Seviyesi'), sanitizePdfText(finding.riskLevel || finding.risk || '-')],
                [sanitizePdfText('Durum'), sanitizePdfText(finding.status || '-')],
                [sanitizePdfText('Sorumlu Birim'), sanitizePdfText(finding.department || finding.unitName || '-')],
                [sanitizePdfText('Oluşturulma'), sanitizePdfText(formatDate(finding.createdAt))],
                [sanitizePdfText('Kapatılma'), sanitizePdfText(finding.closedAt ? formatDate(finding.closedAt) : '-')],
            ],
            theme: 'grid',
            headStyles: {
                fillColor: PDF_COLORS.primary,
                textColor: PDF_COLORS.white,
                fontStyle: 'bold',
                fontSize: 9,
            },
            styles: {
                fontSize: 9,
                cellPadding: 5,
                lineColor: PDF_COLORS.border,
                lineWidth: 0.3,
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 120, textColor: PDF_COLORS.textSecondary },
            },
            alternateRowStyles: { fillColor: PDF_COLORS.bgLight },
        });

        y = (doc as any).lastAutoTable.finalY + 20;

        // Description section
        y = drawPdfSectionHeader(doc, 'BULGU AÇIKLAMASI', y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...PDF_COLORS.text);
        const descLines = doc.splitTextToSize(
            sanitizePdfText(finding.description || 'Açıklama belirtilmemiş.'),
            W - 40
        );
        doc.text(descLines, 20, y);
        y += descLines.length * 13 + 15;

        // Recommendation
        if (finding.recommendation) {
            if (y > doc.internal.pageSize.getHeight() - PDF_SAFE_BOTTOM - 80) {
                doc.addPage();
                y = PDF_CONTENT_START_Y;
            }
            y = drawPdfSectionHeader(doc, 'ÖNERİ', y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...PDF_COLORS.text);
            const recLines = doc.splitTextToSize(sanitizePdfText(finding.recommendation), W - 40);
            doc.text(recLines, 20, y);
        }

        // Apply unified template
        applyPdfTemplate(doc, reportTitle);

        doc.save(`${finding.findingCode || finding.code || 'bulgu'}_detay.pdf`);
        return true;
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        return false;
    }
};
