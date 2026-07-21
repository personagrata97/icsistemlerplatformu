import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ORG } from '../common/org-config';

const PDFDocument = require('pdfkit');

export const PDF_COLORS = {
    primary: '#004a99',        // Emlak Katılım Koyu Mavi
    primaryDark: '#001d3d',    // Daha koyu mavi
    primaryLight: '#e8f0fe',   // Açık mavi
    gold: '#c9a84c',           // Altın aksan
    white: '#ffffff',
    text: '#1a1a2e',           // Ana metin
    textSecondary: '#4a5568',  // İkincil metin
    textMuted: '#718096',      // Soluk metin
    border: '#cbd5e0',         // Kenarlık
    success: '#059669',
    danger: '#dc2626',
    warning: '#f59e0b',
    riskKritik: '#881337',
    riskYuksek: '#dc2626',
    riskOrta: '#f97316',
    riskDusuk: '#ca8a04',
    bgLight: '#f8fafc',
};

@Injectable()
export class PdfReportService {
    private readonly logger = new Logger(PdfReportService.name);
    private readonly assetsDir = path.join(process.cwd(), 'uploads', 'assets');
    private readonly fontRegular = path.join(this.assetsDir, 'LiberationSans-Regular.ttf');
    private readonly fontBold = path.join(this.assetsDir, 'LiberationSans-Bold.ttf');
    private readonly logoPath = path.join(this.assetsDir, 'logo.png');

    createDocument(options?: any) {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true,
            ...options
        });

        // Türkçe Karakter Destekli Kurumsal Yazı Tipleri Yükle
        if (fs.existsSync(this.fontRegular)) {
            doc.registerFont('Regular', this.fontRegular);
        }
        if (fs.existsSync(this.fontBold)) {
            doc.registerFont('Bold', this.fontBold);
        }

        return doc;
    }

    addHeaderAndFooter(doc: any, title: string, includeWatermark = true) {
        const totalPages = doc.bufferedPageRange().count;

        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const pageNum = i + 1;

            // Filigran / Watermark
            if (includeWatermark) {
                doc.save();
                doc.font(fs.existsSync(this.fontBold) ? 'Bold' : 'Helvetica-Bold');
                doc.fontSize(55);
                doc.fillColor('#94a3b8');
                doc.fillOpacity(0.06);
                doc.rotate(-35, { origin: [300, 400] });
                doc.text('EMLAK KATILIM - GİZLİ', 50, 400, { align: 'center', width: 500 });
                doc.restore();
            }

            // Kurumsal Başlık (Kapak haricinde)
            if (pageNum > 1) {
                doc.save();
                doc.font(fs.existsSync(this.fontRegular) ? 'Regular' : 'Helvetica');
                doc.fontSize(8);
                doc.fillColor(PDF_COLORS.textMuted);
                doc.text(`${ORG.companyName} - ${title}`, 50, 25);
                doc.moveTo(50, 37).lineTo(545, 37).strokeColor(PDF_COLORS.border).lineWidth(0.5).stroke();
                doc.restore();
            }

            // Kurumsal Alt Bilgi / Sayfa Numarası
            doc.save();
            doc.font(fs.existsSync(this.fontRegular) ? 'Regular' : 'Helvetica');
            doc.fontSize(8);
            doc.fillColor(PDF_COLORS.textMuted);
            doc.moveTo(50, 792 - 40).lineTo(545, 792 - 40).strokeColor(PDF_COLORS.border).lineWidth(0.5).stroke();

            doc.text('GİZLİDİR - Üçüncü şahıslarla paylaşılamaz.', 50, 792 - 30);
            doc.text(`Sayfa ${pageNum} / ${totalPages}`, 50, 792 - 30, { align: 'right', width: 495 });
            doc.restore();
        }
    }

    getLogoPath(): string | null {
        return fs.existsSync(this.logoPath) ? this.logoPath : null;
    }
}
