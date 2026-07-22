import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PdfReportService, PDF_COLORS } from './pdf-report.service';
import { BRAND_COLORS } from '../common/brand-colors';
import { ORG } from '../common/org-config';
import { REPORT_TYPES, generateReportNumber } from '../common/report-types';
import { AuditLogService } from './audit-log.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BilgiNotuService {
    private readonly logger = new Logger(BilgiNotuService.name);
    private readonly assetsDir = path.join(process.cwd(), 'uploads', 'assets');
    private readonly fontRegular = path.join(this.assetsDir, 'LiberationSans-Regular.ttf');
    private readonly fontBold = path.join(this.assetsDir, 'LiberationSans-Bold.ttf');

    constructor(
        private prisma: PrismaService,
        private pdfService: PdfReportService,
        private auditLog: AuditLogService,
    ) {}

    /**
     * Bilgi Notu PDF'ı üretir
     * Nihai Rapor Bölüm 7 şeması esas alınmıştır.
     */
    async generateBilgiNotu(data: {
        konu: string;
        ilgi?: string;
        konuAciklama: string;
        aciklamaVeDegerlendirme: string;
        sonucKanaatOneri: string;
        hazirlayanAd: string;
        hazirlayanUnvan: string;
        gozdenGecirenAd?: string;
        gozdenGecirenUnvan?: string;
        ekler?: Array<{ no: number; ad: string }>;
        tarih?: string;
    }, user?: any): Promise<{ filePath: string; reportNo: string }> {
        
        // Rapor No üret
        const currentYear = new Date().getFullYear();
        const count = await this.prisma.generatedReport.count({
            where: { type: 'BILGI_NOTU' }
        });
        const reportNo = generateReportNumber('BN', count + 1, currentYear);
        const tarih = data.tarih || new Date().toLocaleDateString('tr-TR');
        
        // PDF oluştur
        const doc = this.pdfService.createDocument();
        const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const fileName = `BILGI_NOTU_${reportNo.replace(/\./g, '_')}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const W = doc.page.width;
        const margin = 50;
        const contentWidth = W - (margin * 2);

        // Font kaydet
        try {
            doc.registerFont('Regular', this.fontRegular);
            doc.registerFont('Bold', this.fontBold);
        } catch {
            // Fallback to Helvetica
        }

        // ── KAPAK / BAŞLIK ──
        // Üst bant
        doc.rect(0, 0, W, 80).fill(BRAND_COLORS.primaryDark);
        doc.rect(0, 77, W, 3).fill(BRAND_COLORS.gold);
        
        // Şirket adı
        doc.font('Bold').fontSize(14).fillColor(BRAND_COLORS.white);
        doc.text(ORG.companyName.toLocaleUpperCase('tr-TR'), margin, 20, { align: 'center', width: contentWidth });
        doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.gold);
        doc.text(ORG.departmentName, margin, 40, { align: 'center', width: contentWidth });
        
        // Gizlilik
        doc.font('Bold').fontSize(8).fillColor(BRAND_COLORS.white);
        doc.text(ORG.confidentiality, margin, 60, { align: 'center', width: contentWidth });

        // "BİLGİ NOTU" başlığı
        doc.moveDown(2);
        const yTitle = 100;
        doc.font('Bold').fontSize(20).fillColor(BRAND_COLORS.primary);
        doc.text('BİLGİ NOTU', margin, yTitle, { align: 'center', width: contentWidth });
        doc.moveTo(margin + 100, yTitle + 28).lineTo(W - margin - 100, yTitle + 28).strokeColor(BRAND_COLORS.gold).lineWidth(1).stroke();

        // Meta tablo
        let yMeta = yTitle + 50;
        const metaFields = [
            ['NOT NO.SU', reportNo],
            ['TARİH', tarih],
            ['KONU', data.konu],
        ];
        if (data.ilgi) metaFields.push(['İLGİ', data.ilgi]);

        for (const [label, value] of metaFields) {
            doc.font('Bold').fontSize(10).fillColor(BRAND_COLORS.text);
            doc.text(label, margin, yMeta, { width: 100 });
            doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.text);
            doc.text(`:  ${value}`, margin + 105, yMeta, { width: contentWidth - 110 });
            yMeta += 20;
        }

        // Bölüm ayırıcı
        yMeta += 10;
        doc.moveTo(margin, yMeta).lineTo(W - margin, yMeta).strokeColor(BRAND_COLORS.border).lineWidth(0.5).stroke();
        yMeta += 15;

        // 1. KONU / AMAÇ
        doc.font('Bold').fontSize(11).fillColor(BRAND_COLORS.primary);
        doc.text('1. KONU / AMAÇ', margin, yMeta);
        yMeta += 18;
        doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.text);
        doc.text(data.konuAciklama, margin, yMeta, { width: contentWidth, lineGap: 4 });
        yMeta = doc.y + 15;

        // 2. AÇIKLAMA VE DEĞERLENDİRME
        doc.font('Bold').fontSize(11).fillColor(BRAND_COLORS.primary);
        doc.text('2. AÇIKLAMA VE DEĞERLENDİRME', margin, yMeta);
        yMeta += 18;
        doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.text);
        doc.text(data.aciklamaVeDegerlendirme, margin, yMeta, { width: contentWidth, lineGap: 4 });
        yMeta = doc.y + 15;

        // 3. SONUÇ, KANAAT VE ÖNERİ
        doc.font('Bold').fontSize(11).fillColor(BRAND_COLORS.primary);
        doc.text('3. SONUÇ, KANAAT VE ÖNERİ', margin, yMeta);
        yMeta += 18;
        doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.text);
        doc.text(data.sonucKanaatOneri, margin, yMeta, { width: contentWidth, lineGap: 4 });
        yMeta = doc.y + 30;

        // İmza
        doc.font('Regular').fontSize(10).fillColor(BRAND_COLORS.textSecondary);
        doc.text('Saygılarımla,', margin, yMeta);
        yMeta += 30;
        doc.font('Bold').fontSize(10).fillColor(BRAND_COLORS.text);
        doc.text(data.hazirlayanAd, margin, yMeta);
        yMeta += 14;
        doc.font('Regular').fontSize(9).fillColor(BRAND_COLORS.textSecondary);
        doc.text(data.hazirlayanUnvan, margin, yMeta);

        // Gözetim Sorumlusu (varsa)
        if (data.gozdenGecirenAd) {
            yMeta += 30;
            doc.font('Bold').fontSize(9).fillColor(BRAND_COLORS.textMuted);
            doc.text('GÖZETİM SORUMLUSU:', margin, yMeta);
            yMeta += 14;
            doc.font('Bold').fontSize(10).fillColor(BRAND_COLORS.text);
            doc.text(data.gozdenGecirenAd, margin, yMeta);
            yMeta += 14;
            doc.font('Regular').fontSize(9).fillColor(BRAND_COLORS.textSecondary);
            doc.text(data.gozdenGecirenUnvan || '', margin, yMeta);
        }

        // Ekler (varsa)
        if (data.ekler && data.ekler.length > 0) {
            yMeta += 30;
            doc.font('Bold').fontSize(10).fillColor(BRAND_COLORS.primary);
            doc.text('EK:', margin, yMeta);
            yMeta += 16;
            for (const ek of data.ekler) {
                doc.font('Regular').fontSize(9).fillColor(BRAND_COLORS.text);
                doc.text(`Ek.${ek.no} : ${ek.ad}`, margin + 10, yMeta);
                yMeta += 14;
            }
        }

        // Header/Footer ekle
        this.pdfService.addHeaderAndFooter(doc, 'Bilgi Notu');

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', async () => {
                // DB'ye kaydet
                try {
                    await this.prisma.generatedReport.create({
                        data: {
                            title: `Bilgi Notu - ${data.konu}`,
                            type: 'BILGI_NOTU',
                            period: `${currentYear}`,
                            filePath: fileName,
                            generatedBy: user?.sub || user?.userId || 'system',
                            parameters: JSON.stringify({
                                reportNo,
                                konu: data.konu,
                                tarih,
                            }),
                        },
                    });
                    
                    this.logger.log(`Bilgi Notu üretildi: ${reportNo}`);
                    
                    if (this.auditLog) {
                        await this.auditLog.createLog({
                            action: 'BILGI_NOTU_URETILDI',
                            user: user?.sub || user?.userId || 'system',
                            details: `Bilgi Notu ${reportNo} başarıyla üretilmiştir. Konu: ${data.konu}`,
                        });
                    }
                } catch (dbErr) {
                    this.logger.error('Bilgi Notu DB kaydı hatası', dbErr);
                }
                resolve({ filePath, reportNo });
            });
            stream.on('error', reject);
        });
    }
}
