import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BRAND_COLORS } from '../common/brand-colors';
import * as fs from 'fs';
import * as path from 'path';

const PDFDocument = require('pdfkit');

export interface PartialCopyOptions {
    reportId: string;
    mode: 'TOPLU' | 'BOLUM' | 'BIRIM';
    targetUnitId?: string;
    targetUnitName?: string;
    sectionIds?: string[];
    requestedBy: string;
}

@Injectable()
export class PartialReportService {
    private readonly logger = new Logger(PartialReportService.name);
    private readonly assetsDir = path.join(process.cwd(), 'uploads', 'assets');
    private readonly fontRegular = path.join(this.assetsDir, 'LiberationSans-Regular.ttf');
    private readonly fontBold = path.join(this.assetsDir, 'LiberationSans-Bold.ttf');

    constructor(private prisma: PrismaService) {}

    async createPartialCopy(options: PartialCopyOptions): Promise<{ issueId: string; fileBuffer: Buffer; turevNo: string }> {
        this.logger.log(`Kısmi Nüsha üretiliyor: Rapor ${options.reportId}, Mod: ${options.mode}, Birim: ${options.targetUnitName || 'Tüm'}`);

        // 1. Ana Rapor ve Bölümler
        const sections = await this.prisma.reportSection.findMany({
            where: { reportId: options.reportId },
            orderBy: { sira: 'asc' }
        });

        const findings = await this.prisma.reportFinding.findMany({
            where: { reportId: options.reportId }
        });

        // Türev Numarası Üretme (İS.1.2026/BT veya İS.1.2026/B-02)
        const unitSuffix = options.targetUnitName ? options.targetUnitName.substring(0, 3).toUpperCase() : 'TÜM';
        const turevNo = options.mode === 'TOPLU' ? 'İS.1.2026' : `İS.1.2026/${options.mode === 'BIRIM' ? unitSuffix : 'KISMİ'}`;

        // 2. Filtreleme Mantığı (Section & Finding Filtering)
        let filteredSections = sections;
        if (options.mode === 'BOLUM' && options.sectionIds?.length) {
            filteredSections = sections.filter(s => options.sectionIds?.includes(s.id) || s.kismiCiktidaYerAlir);
        } else if (options.mode === 'BIRIM' && options.targetUnitId) {
            filteredSections = sections.filter(s => {
                if (s.kismiCiktidaYerAlir) return true;
                if (!s.hedefBirimIds) return false;
                return s.hedefBirimIds.includes(options.targetUnitId!);
            });
        }

        let filteredFindings = findings;
        if (options.mode === 'BIRIM' && options.targetUnitId) {
            filteredFindings = findings.filter(f => f.hedefBirimId === options.targetUnitId);
        }

        // 3. PDF Üretimi (ReportShell Standardı)
        const pdfBuffer = await this.buildPdfDocument(options, turevNo, filteredSections, filteredFindings);

        // 4. ReportIssue Loglama
        const issue = await this.prisma.reportIssue.create({
            data: {
                reportId: options.reportId,
                tur: options.mode,
                hedefBirimId: options.targetUnitId || null,
                sectionIds: JSON.stringify(filteredSections.map(s => s.id)),
                turevNo: turevNo,
                olusturanId: options.requestedBy,
            }
        });

        return {
            issueId: issue.id,
            fileBuffer: pdfBuffer,
            turevNo: turevNo,
        };
    }

    private async buildPdfDocument(
        options: PartialCopyOptions,
        turevNo: string,
        sections: any[],
        findings: any[]
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
            const buffers: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err: any) => reject(err));

            if (fs.existsSync(this.fontRegular)) doc.registerFont('Regular', this.fontRegular);
            if (fs.existsSync(this.fontBold)) doc.registerFont('Bold', this.fontBold);

            // KAPAK SAYFASI (RAPOR KABUĞU)
            doc.fillColor(BRAND_COLORS.primary).fontSize(20).font('Bold');
            doc.text('EMLAK KATILIM TEFTİŞ KURULU BAŞKANLIĞI', { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(24).fillColor('#16211C').text('DENETİM VE İNCELEME RAPORU', { align: 'center' });
            if (options.mode !== 'TOPLU') {
                doc.moveDown(0.5);
                doc.fontSize(14).fillColor(BRAND_COLORS.gold).text(`[ ${options.mode} NÜSHASI — ${options.targetUnitName || ''} ]`, { align: 'center' });
            }

            doc.moveDown(2);

            // Meta Kutusu
            doc.fontSize(10).fillColor('#2E3B35').font('Regular');
            doc.text(`Rapor No: ${turevNo}`);
            doc.text(`Ana Rapor Referansı: İS.1.2026`);
            doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`);
            doc.moveDown(2);

            // GÖVDE (BÖLÜMLER)
            sections.forEach((sec) => {
                doc.font('Bold').fontSize(13).fillColor(BRAND_COLORS.primary);
                doc.text(`${sec.numara} ${sec.baslik.toUpperCase()}`);
                doc.moveDown(0.5);
                doc.font('Regular').fontSize(10).fillColor('#2E3B35');
                doc.text(sec.icerik);
                doc.moveDown(1.5);
            });

            // BULGULAR (FİLTRELENMİŞ)
            if (findings.length > 0) {
                doc.font('Bold').fontSize(13).fillColor(BRAND_COLORS.primary);
                doc.text('TESPİT VE BULGULAR');
                doc.moveDown(0.5);

                findings.forEach((f) => {
                    doc.font('Bold').fontSize(11).fillColor('#16211C');
                    doc.text(`Bulgu ${f.bulguNo} (${f.onemDuzeyi})`);
                    doc.font('Regular').fontSize(10).fillColor('#2E3B35');
                    doc.text(`Tespit: ${f.tespit}`);
                    if (f.oneri) doc.text(`Öneri: ${f.oneri}`);
                    doc.moveDown(1);
                });
            }

            // İMZA BLOĞU (RAPORLAMA STANDARDI VE TALİMATI UYARINCA)
            doc.moveDown(3);
            doc.font('Bold').fontSize(10).fillColor(BRAND_COLORS.primary);
            doc.text('RAPOR İMZA VE ONAY BLOĞU', { align: 'center' });
            doc.moveDown(1.5);

            const startY = doc.y;
            // HAZIRLAYAN (Müfettiş)
            doc.font('Bold').fontSize(9).fillColor('#16211C').text('HAZIRLAYAN', 50, startY);
            doc.font('Regular').fontSize(9).text('Selim KAYA\nMüfettiş', 50, startY + 15);

            // GÖZETİM SORUMLUSU (Gözetim Sorumlusu - AUDIT_SUPERVISOR)
            doc.font('Bold').fontSize(9).fillColor('#16211C').text('GÖZETİM SORUMLUSU', 230, startY);
            doc.font('Regular').fontSize(9).text('Taha TURUNÇ\nGözetim Sorumlusu', 230, startY + 15);

            // ONAYLAYAN (Teftiş Kurulu Başkanı)
            doc.font('Bold').fontSize(9).fillColor('#16211C').text('ONAYLAYAN', 420, startY);
            doc.font('Regular').fontSize(9).text('Kerem YILMAZ\nTeftiş Kurulu Başkanı', 420, startY + 15);

            doc.end();
        });
    }
}
