import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { AuditLogService } from './audit-log.service';
import { ORG } from '../common/org-config';
import { BRAND_COLORS } from '../common/brand-colors';
const PDFDocument = require('pdfkit');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// ============================================================
// CORPORATE DESIGN TOKENS — Merkezi brand-colors.ts'den alınır
// ============================================================
const COLORS = BRAND_COLORS;

import { PdfReportService } from './pdf-report.service';
import { REPORT_TYPES, generateReportNumber } from '../common/report-types';

@Injectable()
export class ReportGeneratorService {
    private readonly assetsDir = path.join(process.cwd(), 'uploads', 'assets');
    private readonly fontRegular = path.join(this.assetsDir, 'LiberationSans-Regular.ttf');
    private readonly fontBold = path.join(this.assetsDir, 'LiberationSans-Bold.ttf');
    private readonly logoPath = path.join(this.assetsDir, 'logo.png');

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
        private pdfReportService: PdfReportService
    ) { }

    private readonly logger = new Logger(ReportGeneratorService.name);

    // ============================================================
    // PUBLIC API
    // ============================================================

    async getTemplates() {
        return this.prisma.reportTemplate.findMany({ where: { isActive: true } });
    }

    async getGeneratedReports() {
        return this.prisma.generatedReport.findMany({
            orderBy: { generatedAt: 'desc' },
            include: { template: true }
        });
    }

    async generateReport(type: string, period: string, templateId?: string, user?: any, includeWatermark: boolean = true) {
        this.logger.log(`${type} raporu üretiliyor. Dönem: ${period}`);
        try {
            // 1. Parse Period → Date Range
            const { startDate, endDate } = this.parsePeriod(period);
            this.logger.debug(`Tarih aralığı: ${startDate.toISOString()} - ${endDate.toISOString()}`);

            // 2. Fetch Data
            const audits = await this.prisma.audit.findMany({
                where: { created_at: { gte: startDate, lte: endDate }, isDeleted: false },
                include: {
                    findings: { where: { isDeleted: false } },
                    AuditableUnit: true,
                    AuditTest: { where: { isDeleted: false } }
                }
            });
            this.logger.debug(`${audits.length} denetim bulundu`);

            // 3. Create PDF
            const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const filename = `RAPOR_${type}_${period}_${Date.now()}.pdf`;
            const filePath = path.join(uploadDir, filename);

            const doc = this.pdfReportService.createDocument({
                margin: 60,
                info: {
                    Title: `${this.getReportTitle(type)} - ${period}`,
                    Author: user?.displayName || ORG.departmentName,
                    Subject: 'İç Denetim Raporu',
                    Creator: `${ORG.platformName} (AMS)`,
                    Producer: 'PDFKit',
                }
            });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Register Fonts
            const hasFonts = fs.existsSync(this.fontRegular) && fs.existsSync(this.fontBold);
            if (hasFonts) {
                doc.registerFont('CustomRegular', this.fontRegular);
                doc.registerFont('CustomBold', this.fontBold);
                doc.font('CustomRegular');
            }
            const fontR = hasFonts ? 'CustomRegular' : 'Helvetica';
            const fontB = hasFonts ? 'CustomBold' : 'Helvetica-Bold';

            // --- COVER PAGE ---
            this.drawCoverPage(doc, type, period, user, fontR, fontB, includeWatermark);

            // --- TABLE OF CONTENTS (placeholder page) ---
            doc.addPage();
            const tocPageIndex = doc.bufferedPageRange().count - 1;
            // Will be filled after content pages are generated

            // --- CONTENT PAGES ---
            const sections: { title: string; page: number }[] = [];

            if (type === 'activity' || type === 'Faaliyet Raporu') {
                await this.generateActivityContent(doc, startDate, endDate, audits, fontR, fontB, sections);
            } else {
                await this.generateStandardContent(doc, audits, fontR, fontB, sections, startDate, endDate);
            }

            // --- SIGNATURE PAGE ---
            this.drawSignaturePage(doc, user, fontR, fontB);

            // --- FILL TABLE OF CONTENTS ---
            doc.switchToPage(tocPageIndex);
            this.drawTableOfContents(doc, sections, fontR, fontB);

            // --- APPLY PAGE TEMPLATE TO ALL PAGES ---
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                if (i === 0) {
                    // Cover page gets minimal template (no header, just border)
                    this.drawCoverPageBorder(doc);
                } else {
                    this.drawPageTemplate(doc, i + 1, pages.count, type, fontR, fontB, includeWatermark);
                }
            }

            doc.end();

            await new Promise<void>((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', (err) => reject(err));
            });
            this.logger.log(`Rapor kaydedildi: ${filePath}`);

            // Audit Trail
            try {
                await this.auditLogService.createLog({ 
                    user: user?.displayName || user?.username || 'Sistem',
                    action: 'Rapor Oluşturuldu',
                    details: `${this.getReportTitle(type)} (${period}) başarıyla oluşturuldu.`,
                    targetType: 'Report',
                    targetId: filename
                });
            } catch (logErr) {
                this.logger.warn('Denetim izi kaydı başarısız (kritik değil):', logErr);
            }

            // Save Record
            const reportData: any = {
                title: `${this.getReportTitle(type)} - ${period}`,
                type,
                period,
                filePath: filename,
                generatedBy: user?.displayName || 'Sistem',
                parameters: JSON.stringify({ auditCount: audits.length })
            };
            if (templateId) {
                reportData.templateId = templateId;
            }
            return await this.prisma.generatedReport.create({ data: reportData });
        } catch (error) {
            this.logger.error('Rapor üretimi başarısız:', error);
            const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Rapor üretimi başarısız oldu.',
                debug: errorMessage
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async downloadReport(id: string, user?: any) {
        const report = await this.prisma.generatedReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Rapor bulunamadı');

        const filePath = path.join(process.cwd(), 'uploads', 'reports', report.filePath);
        if (!fs.existsSync(filePath)) throw new NotFoundException('Dosya sunucuda bulunamadı');

        // Audit Trail for Downloading Report
        try {
            await this.auditLogService.createLog({ 
                user: user?.displayName || user?.username || 'Sistem',
                action: 'RAPOR_İNDİRİLDİ',
                details: `${report.title} isimli rapor indirildi.`,
                targetType: 'Report',
                targetId: report.filePath
            });
        } catch (logErr) {
            this.logger.warn('Rapor indirme logu kaydı başarısız:', logErr);
        }

        return filePath;
    }

    async deleteGeneratedReport(id: string) {
        const report = await this.prisma.generatedReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Rapor bulunamadı');

        const filePath = path.join(process.cwd(), 'uploads', 'reports', report.filePath);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (error) {
                this.logger.error(`Dosya silinemedi: ${filePath}`, error);
            }
        }

        return this.prisma.generatedReport.delete({ where: { id } });
    }

    // ============================================================
    // WORD REPORT (DOCX)
    // ============================================================

    async generateWordReport(auditId: string, user?: any) {
        this.logger.log(`Word raporu üretiliyor. Denetim ID: ${auditId}`);
        try {
            const audit = await this.prisma.audit.findUnique({
                where: { id: auditId },
                include: {
                    AuditableUnit: true,
                    findings: {
                        where: { isDeleted: false },
                        include: {
                            conciliation: true,
                            followUps: true
                        }
                    }
                }
            });

            if (!audit) throw new NotFoundException('Denetim kaydı bulunamadı');

            const templateDir = path.join(process.cwd(), 'uploads', 'templates');
            const templatePath = path.join(templateDir, 'tasarruf_finans_rapor_sablonu.docx');

            if (!fs.existsSync(templatePath)) {
                if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });
                throw new HttpException(
                    'Rapor şablonu (tasarruf_finans_rapor_sablonu.docx) bulunamadı. Lütfen uploads/templates dizinine şablonu ekleyin.',
                    HttpStatus.NOT_FOUND
                );
            }

            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const docx = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            const findingsData = (audit.findings || []).map((f: any, index: number) => {
                const conciliation = f.conciliation;
                return {
                    sira_no: index + 1,
                    bulgu_kodu: f.code || '-',
                    bulgu_baslik: f.title || 'Belirtilmemiş',
                    risk_seviyesi: f.risk || 'Belirtilmemiş',
                    kategori: f.category || 'Diğer',
                    icerik: f.description || '',
                    kok_neden: f.rootCause || 'Kök neden analizi eksik',
                    kriter: f.criteria || '',
                    etki: f.financialImpact ? `${Number(f.financialImpact).toLocaleString('tr-TR')} TL` : 'Etki analizi eksik',
                    oneri: f.recommendation || 'Öneri belirtilmemiş',
                    aksiyon_plani: f.actionPlan || '',
                    birim_cevabi: conciliation ? conciliation.response || 'Birim cevabı girilmemiş.' : 'Birim cevabı henüz oluşturulmadı.',
                    birim_aksiyon_plani: conciliation ? conciliation.actionPlan || 'Aksiyon planı eklenmemiş.' : 'Aksiyon planı henüz oluşturulmadı.',
                    is_mutabik: conciliation ? (conciliation.isAgreed ? 'Mutabık Kalındı' : 'Birim Cevabı Yeterli Bulunmadı (Mutabık Kalınamadı)') : 'Mutabakatsız',
                    mutabik_kalinamama_nedeni: conciliation && !conciliation.isAgreed ? conciliation.disagreementReason : '',
                    aksiyon_sayisi: f.followUps?.length || 0,
                    durum: f.status || '-'
                };
            });

            const templateData = {
                denetim_baslik: audit.title || '-',
                denetim_kodu: audit.auditCode || '-',
                denetim_kapsami: audit.scope || '-',
                denetim_amaci: audit.objective || '-',
                denetim_metodolojisi: audit.methodology || '-',
                denetim_kriterleri: audit.criteria || '-',
                denetim_donemi: audit.period || '-',
                denetilen_birim: audit.AuditableUnit ? audit.AuditableUnit.name : 'Genel',
                rapor_tarihi: new Date().toLocaleDateString('tr-TR'),
                denetim_gorusu: audit.opinion || 'Görüş Belirtilmemiş',
                bulgular: findingsData,
                bulgu_sayisi: findingsData.length,
                kritik_bulgu: findingsData.filter(f => f.risk_seviyesi === 'Kritik').length,
                yuksek_bulgu: findingsData.filter(f => f.risk_seviyesi === 'Yüksek').length,
                orta_bulgu: findingsData.filter(f => f.risk_seviyesi === 'Orta').length,
                dusuk_bulgu: findingsData.filter(f => f.risk_seviyesi === 'Düşük').length,
                hazirlayan: user?.displayName || user?.username || 'Sistem',
                baslangic_tarihi: audit.startDate || '-',
                bitis_tarihi: audit.endDate || '-',
            };

            docx.render(templateData);

            const buf = docx.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const filename = `RAPOR_${audit.auditCode || 'DOCX'}_${Date.now()}.docx`;
            const reportFilePath = path.join(uploadDir, filename);

            fs.writeFileSync(reportFilePath, buf);

            const savedReport = await this.prisma.generatedReport.create({
                data: {
                    title: `${audit.title || 'Denetim'} - Word Raporu`,
                    type: 'audit_docx',
                    period: new Date().getFullYear().toString(),
                    filePath: filename,
                    generatedBy: user?.displayName || user?.username || 'Sistem',
                    parameters: JSON.stringify({ auditId })
                }
            });

            return savedReport;

        } catch (error: any) {
            this.logger.error('Word raporu üretimi hatası:', error);

            if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map((e: any) => e.message).join(', ');
                throw new HttpException(`Şablon etiket hatası: ${errorMessages}`, HttpStatus.BAD_REQUEST);
            }

            if (error instanceof HttpException) throw error;
            throw new HttpException(error.message || 'Word raporu oluşturulamadı', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ============================================================
    // PDF DRAWING HELPERS
    // ============================================================

    /** Parse period string into start/end dates */
    private parsePeriod(period: string): { startDate: Date; endDate: Date } {
        let startDate = new Date();
        let endDate = new Date();
        if (period.length === 4) {
            startDate = new Date(`${period}-01-01`);
            endDate = new Date(`${period}-12-31`);
        } else if (period.includes('Q')) {
            const [year, q] = period.split('-');
            const quarter = parseInt(q.replace('Q', ''));
            startDate = new Date(`${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 3);
            endDate.setDate(0);
        }
        return { startDate, endDate };
    }

    /** Get localized report title */
    private getReportTitle(type: string): string {
        // REPORT_TYPES'tan otomatik mapping
        const typeMap: Record<string, string> = {};
        for (const [, cfg] of Object.entries(REPORT_TYPES)) {
            typeMap[cfg.label] = cfg.label;
            typeMap[cfg.shortLabel] = cfg.label;
        }
        // Ek eski uyumluluk mapping'leri
        typeMap['activity'] = REPORT_TYPES.FAALIYET.label;
        typeMap['board'] = REPORT_TYPES.YONETIM_KURULU.label;
        typeMap['finding-summary'] = REPORT_TYPES.BULGU_OZETI.label;
        typeMap['finding-aging'] = REPORT_TYPES.BULGU_YASLANDIRMA.label;
        typeMap['risk-matrix'] = REPORT_TYPES.RISK_DEGERLENDIRME.label;
        typeMap['risk-assessment'] = REPORT_TYPES.RISK_DEGERLENDIRME.label;
        typeMap['plan-progress'] = REPORT_TYPES.PLAN_ILERLEME.label;
        typeMap['audit_docx'] = REPORT_TYPES.SUREC_DENETIM.label;
        
        return typeMap[type] || type;
    }

    /** Get risk color for PDFKit */
    private getRiskColor(risk: string): string {
        const r = risk?.toLowerCase() || '';
        if (r.includes('kritik')) return COLORS.riskKritik;
        if (r.includes('yüksek') || r.includes('yuksek')) return COLORS.riskYuksek;
        if (r.includes('orta')) return COLORS.riskOrta;
        if (r.includes('düşük') || r.includes('dusuk')) return COLORS.riskDusuk;
        return COLORS.textMuted;
    }

    /** Font helper: returns correct font name */
    private f(fontR: string, fontB: string, bold: boolean = false): string {
        return bold ? fontB : fontR;
    }

    // ============================================================
    // COVER PAGE — Premium Corporate Design
    // ============================================================

    private drawCoverPage(doc: any, type: string, period: string, user: any, fontR: string, fontB: string, includeWatermark: boolean = true) {
        const W = doc.page.width;
        const H = doc.page.height;

        // Elegant minimal accent at top
        doc.rect(0, 0, W, 8).fill(COLORS.primary);
        doc.rect(0, 8, W, 2).fill(COLORS.gold);

        // === LOGO ===
        let y = 80;
        if (fs.existsSync(this.logoPath)) {
            const logoW = 120;
            const logoH = 60;
            const logoX = (W / 2) - (logoW / 2);
            doc.image(this.logoPath, logoX, y, { fit: [logoW, logoH], align: 'center', valign: 'center' });
            y += logoH + 40;
        } else {
            y += 60;
        }

        // === INSTITUTION NAME ===
        doc.font(fontB).fontSize(20).fillColor(COLORS.primaryDark);
        doc.text(ORG.companyName.toLocaleUpperCase('tr-TR'), 0, y, { align: 'center', width: W });
        y += 30;
        doc.font(fontR).fontSize(14).fillColor(COLORS.textSecondary);
        doc.text(ORG.departmentName.toLocaleUpperCase('tr-TR'), 0, y, { align: 'center', width: W });

        // === DECORATIVE LINE ===
        y += 40;
        const lineW = 60;
        doc.moveTo((W - lineW) / 2, y).lineTo((W + lineW) / 2, y).lineWidth(3).strokeColor(COLORS.gold).stroke();

        // === REPORT TITLE ===
        y += 40;
        doc.font(fontB).fontSize(28).fillColor(COLORS.primary);
        doc.text(this.getReportTitle(type).toLocaleUpperCase('tr-TR'), 40, y, { align: 'center', width: W - 80, lineGap: 6 });

        // === METADATA BOX ===
        y += 80;
        const boxX = 100;
        const boxW = W - 200;
        const boxH = 130;
        // Box background
        doc.roundedRect(boxX, y, boxW, boxH, 6).fillAndStroke(COLORS.bgAccent, COLORS.border);

        // Box content
        const labelX = boxX + 25;
        const valueX = boxX + 160;
        let lineY = y + 20;
        const lineSpacing = 26;

        const metaItems = [
            { label: 'Rapor Dönemi', value: period },
            { label: 'Oluşturma Tarihi', value: new Date().toLocaleDateString('tr-TR') },
            { label: 'Hazırlayan', value: user?.displayName || user?.username || 'Sistem' },
            { label: 'Gizlilik Derecesi', value: ORG.confidentiality },
        ];

        metaItems.forEach(item => {
            doc.font(fontB).fontSize(10).fillColor(COLORS.textSecondary);
            doc.text(item.label + ':', labelX, lineY, { width: 130 });
            doc.font(fontR).fontSize(10).fillColor(COLORS.text);
            doc.text(item.value, valueX, lineY, { width: boxW - 170 });
            lineY += lineSpacing;
        });

        // === DOCUMENT REFERENCE NUMBER ===
        const refNo = `REF: ${ORG.departmentName.substring(0, 3).toUpperCase()}-${period.replace(/[^0-9]/g, '')}-${String(Date.now()).slice(-6)}`;
        doc.font(fontR).fontSize(8).fillColor(COLORS.textMuted);
        doc.text(refNo, W - 200, 170, { width: 180, align: 'right' });

        // === BOTTOM CONFIDENTIALITY NOTICE ===
        const noticeY = H - 120;
        doc.font(fontR).fontSize(8).fillColor(COLORS.textMuted);
        doc.text(
            ORG.footerNotice,
            0, noticeY, { align: 'center', width: W }
        );
        doc.text(
            'İzinsiz kopyalanamaz, çoğaltılamaz ve üçüncü taraflarla paylaşılamaz.',
            0, noticeY + 14, { align: 'center', width: W }
        );

        // === CLASSIFICATION STAMP ===
        const stampY = noticeY + 35;
        if (includeWatermark && ORG.confidentiality) {
            const stampW = 130;
            const stampH = 28;
            const stampX = (W - stampW) / 2;
            doc.roundedRect(stampX, stampY, stampW, stampH, 4)
                .lineWidth(1.5).strokeColor(COLORS.danger).stroke();
            doc.font(fontB).fontSize(10).fillColor(COLORS.danger);
            doc.text(ORG.confidentiality.toLocaleUpperCase('tr-TR'), stampX, stampY + 7, { width: stampW, align: 'center' });
        }

        // Bottom gold line
        doc.rect(0, H - 50, W, 3).fill(COLORS.gold);
        doc.rect(0, H - 47, W, 47).fill(COLORS.primaryDark);
        doc.font(fontR).fontSize(7).fillColor('#ffffff80');
        doc.text(`${ORG.platformName} (AMS) | ${refNo}`, 0, H - 35, { align: 'center', width: W });
    }

    /** Cover page outer border (applied during template pass) */
    private drawCoverPageBorder(doc: any) {
        const W = doc.page.width;
        const H = doc.page.height;
        // Elegant double border
        doc.rect(15, 15, W - 30, H - 30).lineWidth(1.5).strokeColor(COLORS.primary).stroke();
        doc.rect(18, 18, W - 36, H - 36).lineWidth(0.5).strokeColor(COLORS.gold).stroke();
    }

    // ============================================================
    // PAGE TEMPLATE — Applied to every content page
    // ============================================================

    private drawPageTemplate(doc: any, pageNum: number, totalPages: number, type: string, fontR: string, fontB: string, includeWatermark: boolean = true) {
        const W = doc.page.width;
        const H = doc.page.height;

        // === TOP HEADER BAR ===
        doc.rect(0, 0, W, 35).fill(COLORS.primary);
        doc.rect(0, 35, W, 2).fill(COLORS.gold);

        // Mini logo in header
        if (fs.existsSync(this.logoPath)) {
            try {
                // Just place the logo naturally without a forced white background
                doc.image(this.logoPath, 14, 7, { fit: [45, 21], align: 'left', valign: 'center' });
            } catch (e) { /* logo render hatası kritik değil */ }
        }

        // Header text - shifted X to 70 to avoid overlapping with logo
        doc.font(fontB).fontSize(8).fillColor(COLORS.white);
        doc.text(ORG.headerBand, 70, 12, { width: W - 200 });
        doc.font(fontR).fontSize(7).fillColor('#ffffffcc');
        doc.text(this.getReportTitle(type), W - 200, 13, { width: 185, align: 'right' });

        // === LEFT ACCENT LINE (subtle) ===
        doc.rect(0, 37, 3, H - 77).fill(COLORS.primaryLight);

        // === CONFIDENTIAL WATERMARK ===
        if (includeWatermark && ORG.confidentiality) {
            doc.save();
            doc.rotate(-45, { origin: [W / 2, H / 2] });
            doc.font(fontR).fontSize(45).fillColor('#0000000a');
            // Center the text properly so it doesn't overflow
            doc.text(ORG.confidentiality.toLocaleUpperCase('tr-TR'), W / 2 - 300, H / 2 - 20, { width: 600, align: 'center' });
            doc.restore();
        }

        // === FOOTER ===
        const footerY = H - 35;
        // Top line
        doc.moveTo(40, footerY).lineTo(W - 40, footerY).lineWidth(0.5).strokeColor(COLORS.border).stroke();
        doc.moveTo(40, footerY + 1.5).lineTo(W - 40, footerY + 1.5).lineWidth(0.3).strokeColor(COLORS.borderLight).stroke();

        // Footer text
        doc.font(fontR).fontSize(7).fillColor(COLORS.textMuted);
        doc.text(ORG.confidentiality, 40, footerY + 8);
        doc.text(`${ORG.companyName} ${ORG.departmentName}`, W / 2 - 60, footerY + 8, { width: 120, align: 'center' });
        doc.font(fontB).fontSize(7).fillColor(COLORS.textSecondary);
        doc.text(`Sayfa ${pageNum} / ${totalPages}`, W - 120, footerY + 8, { width: 80, align: 'right' });
    }

    // ============================================================
    // TABLE OF CONTENTS
    // ============================================================

    private drawTableOfContents(doc: any, sections: { title: string; page: number }[], fontR: string, fontB: string) {
        const W = doc.page.width;
        let y = 55;

        // Title
        this.drawSectionHeader(doc, 'İÇİNDEKİLER', '', fontB, y);
        y += 45;

        // Decorative line
        doc.moveTo(60, y).lineTo(W - 60, y).lineWidth(1).strokeColor(COLORS.gold).stroke();
        y += 20;

        sections.forEach((section, index) => {
            doc.font(fontR).fontSize(11).fillColor(COLORS.text);
            const label = `${index + 1}. ${section.title}`;
            doc.text(label, 70, y, { width: W - 200, continued: false });

            // Dotted line to page number
            const textWidth = doc.widthOfString(label);
            const dotsStart = 70 + Math.min(textWidth, W - 220) + 5;
            const dotsEnd = W - 100;
            let dotX = dotsStart;
            doc.fontSize(8).fillColor(COLORS.textMuted);
            while (dotX < dotsEnd) {
                doc.text('.', dotX, y + 2, { width: 5 });
                dotX += 5;
            }

            // Page number
            doc.font(fontB).fontSize(11).fillColor(COLORS.primary);
            doc.text(String(section.page), W - 90, y, { width: 30, align: 'right' });

            y += 24;
        });
    }

    // ============================================================
    // SECTION HEADER HELPER
    // ============================================================

    private drawSectionHeader(doc: any, title: string, subtitle: string, fontB: string, y?: number) {
        const W = doc.page.width;
        const startY = y || doc.y;

        // Blue accent bar
        doc.rect(60, startY, 4, 24).fill(COLORS.primary);

        // Title
        doc.font(fontB).fontSize(16).fillColor(COLORS.primary);
        doc.text(title, 72, startY + 2, { width: W - 140 });

        if (subtitle) {
            doc.font(fontB).fontSize(10).fillColor(COLORS.textSecondary);
            doc.text(subtitle, 72, startY + 24, { width: W - 140 });
        }

        // Underline
        const lineY = startY + (subtitle ? 40 : 28);
        doc.moveTo(60, lineY).lineTo(W - 60, lineY).lineWidth(0.5).strokeColor(COLORS.borderLight).stroke();

        doc.y = lineY + 10;
    }

    // ============================================================
    // INFO BOX HELPER
    // ============================================================

    private drawInfoBox(doc: any, title: string, items: { label: string; value: string }[], fontR: string, fontB: string) {
        const W = doc.page.width;
        const boxX = 60;
        const boxW = W - 120;
        const lineH = 22;
        const boxH = items.length * lineH + 30;
        const startY = doc.y + 5;

        // Check page overflow
        if (startY + boxH > doc.page.height - 60) {
            doc.addPage();
            return this.drawInfoBox(doc, title, items, fontR, fontB);
        }

        // Box
        doc.roundedRect(boxX, startY, boxW, boxH, 4).fillAndStroke(COLORS.bgLight, COLORS.border);

        // Title bar inside box
        doc.roundedRect(boxX, startY, boxW, 24, 4).fill(COLORS.primaryLight);
        doc.rect(boxX, startY + 20, boxW, 4).fill(COLORS.primaryLight); // mask bottom corner
        doc.font(fontB).fontSize(9).fillColor(COLORS.primary);
        doc.text(title, boxX + 12, startY + 6, { width: boxW - 24 });

        // Items
        let y = startY + 30;
        items.forEach((item) => {
            doc.font(fontB).fontSize(9).fillColor(COLORS.textSecondary);
            doc.text(item.label + ':', boxX + 12, y, { width: 140 });
            doc.font(fontR).fontSize(9).fillColor(COLORS.text);
            doc.text(item.value || '-', boxX + 155, y, { width: boxW - 175 });
            y += lineH;
        });

        doc.y = startY + boxH + 10;
    }

    // ============================================================
    // RISK BADGE Helper
    // ============================================================

    private drawRiskBadge(doc: any, risk: string, x: number, y: number, fontB: string) {
        const color = this.getRiskColor(risk);
        const label = risk || '-';
        const badgeW = Math.max(doc.widthOfString(label) + 14, 50);

        doc.roundedRect(x, y - 2, badgeW, 14, 3).fill(color);
        doc.font(fontB).fontSize(7).fillColor(COLORS.white);
        doc.text(label, x + 4, y, { width: badgeW - 8, align: 'center' });
    }

    // ============================================================
    // RISK BAR CHART — Horizontal Risk Distribution
    // ============================================================

    private drawRiskBarChart(
        doc: any,
        riskDist: { kritik: number; yuksek: number; orta: number; dusuk: number },
        total: number,
        fontR: string, fontB: string
    ) {
        const W = doc.page.width;
        const chartX = 60;
        const chartW = W - 120;
        const barH = 18;
        const gap = 8;
        let y = doc.y + 5;

        // Check page overflow
        if (y + 140 > doc.page.height - 60) {
            doc.addPage();
            y = 55;
        }

        // Title
        doc.font(fontB).fontSize(10).fillColor(COLORS.primary);
        doc.text('Risk Seviyesi Dağılımı', chartX, y, { width: chartW });
        y += 20;

        const risks = [
            { label: 'Kritik', count: riskDist.kritik, color: COLORS.riskKritik },
            { label: 'Yüksek', count: riskDist.yuksek, color: COLORS.riskYuksek },
            { label: 'Orta', count: riskDist.orta, color: COLORS.riskOrta },
            { label: 'Düşük', count: riskDist.dusuk, color: COLORS.riskDusuk },
        ];

        const labelWidth = 55;
        const valueWidth = 50;
        const maxBarW = chartW - labelWidth - valueWidth - 10;

        risks.forEach(risk => {
            const pct = total > 0 ? (risk.count / total) : 0;
            const barW = Math.max(pct * maxBarW, risk.count > 0 ? 4 : 0);

            // Label
            doc.font(fontB).fontSize(8).fillColor(COLORS.text);
            doc.text(risk.label, chartX, y + 3, { width: labelWidth });

            // Background bar (gray track)
            doc.roundedRect(chartX + labelWidth, y, maxBarW, barH, 3).fill('#f1f5f9');

            // Value bar
            if (barW > 0) {
                doc.roundedRect(chartX + labelWidth, y, barW, barH, 3).fill(risk.color);
            }

            // Count + percentage text
            const pctStr = total > 0 ? `%${(pct * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : '%0';
            doc.font(fontR).fontSize(8).fillColor(COLORS.textSecondary);
            doc.text(`${risk.count} (${pctStr})`, chartX + labelWidth + maxBarW + 5, y + 3, { width: valueWidth });

            y += barH + gap;
        });

        doc.y = y + 5;
    }

    // ============================================================
    // KPI STAT CARDS — Dashboard-style visual cards
    // ============================================================

    private drawStatCards(doc: any, cards: { label: string; value: string; color: string; subtext?: string }[], fontR: string, fontB: string) {
        const W = doc.page.width;
        const cardW = (W - 120 - 30) / 3; // 3 cards per row with gaps
        const cardH = 65;
        const startX = 60;
        let y = doc.y + 10;

        // Check page overflow
        const totalRows = Math.ceil(cards.length / 3);
        if (y + totalRows * (cardH + 12) > doc.page.height - 60) {
            doc.addPage();
            y = 55;
        }

        cards.forEach((card, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * (cardW + 15);
            const cy = y + row * (cardH + 12);

            // Card shadow (subtle)
            doc.roundedRect(x + 2, cy + 2, cardW, cardH, 6).fill('#00000008');
            // Card background
            doc.roundedRect(x, cy, cardW, cardH, 6).fillAndStroke(COLORS.white, '#e2e8f0');
            // Color accent bar at top
            doc.roundedRect(x, cy, cardW, 4, 6).fill(card.color);
            doc.rect(x, cy + 3, cardW, 3).fill(card.color); // mask bottom radius

            // Value (large number)
            doc.font(fontB).fontSize(22).fillColor(card.color);
            doc.text(card.value, x + 12, cy + 14, { width: cardW - 24 });

            // Label
            doc.font(fontR).fontSize(8).fillColor(COLORS.textSecondary);
            doc.text(card.label, x + 12, cy + 40, { width: cardW - 24 });

            // Subtext
            if (card.subtext) {
                doc.font(fontR).fontSize(7).fillColor(COLORS.textMuted);
                doc.text(card.subtext, x + 12, cy + 52, { width: cardW - 24 });
            }
        });

        doc.y = y + Math.ceil(cards.length / 3) * (cardH + 12) + 5;
    }

    // ============================================================
    // DONUT CHART — Status/Category distribution
    // ============================================================

    private drawDonutChart(
        doc: any,
        data: { label: string; value: number; color: string }[],
        title: string,
        fontR: string, fontB: string
    ) {
        const W = doc.page.width;
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return;

        let y = doc.y + 10;
        if (y + 160 > doc.page.height - 60) {
            doc.addPage();
            y = 55;
        }

        // Title
        doc.font(fontB).fontSize(10).fillColor(COLORS.primary);
        doc.text(title, 60, y, { width: W - 120 });
        y += 20;

        const cx = 160; // Center of donut
        const cy2 = y + 60;
        const outerR = 55;
        const innerR = 30;

        // Draw donut segments
        let startAngle = -Math.PI / 2; // Start from top
        data.forEach(segment => {
            if (segment.value === 0) return;
            const sliceAngle = (segment.value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            // Draw arc segment using small line segments
            doc.save();
            doc.path(this.donutArcPath(cx, cy2, outerR, innerR, startAngle, endAngle));
            doc.fill(segment.color);
            doc.restore();

            startAngle = endAngle;
        });

        // Inner circle (white donut hole)
        doc.circle(cx, cy2, innerR).fill(COLORS.white);

        // Center text
        doc.font(fontB).fontSize(16).fillColor(COLORS.primary);
        doc.text(String(total), cx - 20, cy2 - 12, { width: 40, align: 'center' });
        doc.font(fontR).fontSize(7).fillColor(COLORS.textMuted);
        doc.text('Toplam', cx - 20, cy2 + 6, { width: 40, align: 'center' });

        // Legend (right side)
        let legendY = y + 10;
        const legendX = 240;
        data.forEach(item => {
            if (item.value === 0) return;
            // Color dot
            doc.circle(legendX, legendY + 5, 4).fill(item.color);
            // Label
            doc.font(fontR).fontSize(9).fillColor(COLORS.text);
            doc.text(item.label, legendX + 12, legendY, { width: 120 });
            // Value + percentage
            const pct = total > 0 ? `%${((item.value / total) * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : '%0';
            doc.font(fontB).fontSize(9).fillColor(COLORS.textSecondary);
            doc.text(`${item.value} (${pct})`, legendX + 140, legendY, { width: 100 });
            legendY += 18;
        });

        doc.y = Math.max(cy2 + outerR + 15, legendY + 10);
    }

    /** Helper to create donut arc path */
    private donutArcPath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
        const outerStartX = cx + outerR * Math.cos(startAngle);
        const outerStartY = cy + outerR * Math.sin(startAngle);
        const outerEndX = cx + outerR * Math.cos(endAngle);
        const outerEndY = cy + outerR * Math.sin(endAngle);
        const innerStartX = cx + innerR * Math.cos(endAngle);
        const innerStartY = cy + innerR * Math.sin(endAngle);
        const innerEndX = cx + innerR * Math.cos(startAngle);
        const innerEndY = cy + innerR * Math.sin(startAngle);

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        return `M ${outerStartX} ${outerStartY} ` +
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX} ${outerEndY} ` +
            `L ${innerStartX} ${innerStartY} ` +
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY} Z`;
    }

    // ============================================================
    // SIMPLE TABLE Helper
    // ============================================================

    private drawSimpleTable(doc: any, headers: string[], rows: string[][], colWidths: number[], fontR: string, fontB: string) {
        const W = doc.page.width;
        const tableX = 60;
        const rowH = 20;
        let y = doc.y + 10;

        // Check if header + at least one row fits on page
        const headerAndFirstRowH = rowH * 2 + 10;
        if (y + headerAndFirstRowH > doc.page.height - 60) {
            doc.addPage();
            y = 55;
        }

        let currentTableStartY = y;

        // Header row
        doc.rect(tableX, y, W - 120, rowH).fill(COLORS.primary);
        let x = tableX;
        headers.forEach((header, i) => {
            doc.font(fontB).fontSize(8).fillColor(COLORS.white);
            doc.text(header, x + 4, y + 5, { width: colWidths[i] - 8 });
            x += colWidths[i];
        });
        y += rowH;

        // Data rows
        rows.forEach((row, rowIndex) => {
            // Page overflow check
            if (y + rowH > doc.page.height - 60) {
                // Draw border for the previous part of the table before jumping to next page
                doc.rect(tableX, currentTableStartY, W - 120, y - currentTableStartY).lineWidth(0.5).strokeColor(COLORS.border).stroke();

                doc.addPage();
                y = 55;
                currentTableStartY = y;
                // Re-draw header on new page
                doc.rect(tableX, y, W - 120, rowH).fill(COLORS.primary);
                let hx = tableX;
                headers.forEach((header, i) => {
                    doc.font(fontB).fontSize(8).fillColor(COLORS.white);
                    doc.text(header, hx + 4, y + 5, { width: colWidths[i] - 8 });
                    hx += colWidths[i];
                });
                y += rowH;
            }

            const bgColor = rowIndex % 2 === 0 ? COLORS.white : COLORS.bgLight;
            doc.rect(tableX, y, W - 120, rowH).fill(bgColor);
            // Bottom border
            doc.moveTo(tableX, y + rowH).lineTo(tableX + W - 120, y + rowH).lineWidth(0.3).strokeColor(COLORS.borderLight).stroke();

            x = tableX;
            row.forEach((cell, i) => {
                doc.font(fontR).fontSize(8).fillColor(COLORS.text);
                doc.text(cell || '-', x + 4, y + 5, { width: colWidths[i] - 8, lineBreak: false });
                x += colWidths[i];
            });
            y += rowH;
        });

        // Table border for the final page
        doc.rect(tableX, currentTableStartY, W - 120, y - currentTableStartY).lineWidth(0.5).strokeColor(COLORS.border).stroke();
        doc.y = y + 10;
    }

    // ============================================================
    // SIGNATURE PAGE
    // ============================================================

    private drawSignaturePage(doc: any, user: any, fontR: string, fontB: string) {
        doc.addPage();
        const W = doc.page.width;
        let y = 55;

        this.drawSectionHeader(doc, 'ONAY VE İMZA', '', fontB, y);
        y = doc.y + 20;

        doc.font(fontR).fontSize(10).fillColor(COLORS.text);
        doc.text(
            `Bu rapor, ${ORG.departmentName} tarafından hazırlanmış olup, aşağıda imzaları bulunan yetkili personel tarafından gözden geçirilmiş ve onaylanmıştır.`,
            60, y, { width: W - 120, lineGap: 4 }
        );
        y += 60;

        // Two signature columns
        const colW = (W - 160) / 2;
        const signatures = [
            { title: 'Hazırlayan', name: user?.displayName || user?.username || '................................' },
            { title: `Onaylayan (${ORG.headTitle})`, name: '................................' }
        ];

        signatures.forEach((sig, i) => {
            const sx = 80 + i * (colW + 40);

            // Box
            doc.roundedRect(sx, y, colW, 120, 4).strokeColor(COLORS.border).lineWidth(0.5).stroke();

            // Title
            doc.font(fontB).fontSize(10).fillColor(COLORS.primary);
            doc.text(sig.title, sx + 15, y + 15, { width: colW - 30, align: 'center' });

            // Name
            doc.font(fontR).fontSize(10).fillColor(COLORS.text);
            doc.text(sig.name, sx + 15, y + 45, { width: colW - 30, align: 'center' });

            // Date & signature line
            doc.font(fontR).fontSize(9).fillColor(COLORS.textMuted);
            doc.text('Tarih: ....../....../..........', sx + 15, y + 70, { width: colW - 30, align: 'center' });

            // Signature line
            doc.moveTo(sx + 30, y + 100).lineTo(sx + colW - 30, y + 100).lineWidth(0.5).strokeColor(COLORS.border).stroke();
            doc.font(fontR).fontSize(7).fillColor(COLORS.textMuted);
            doc.text('İmza', sx + 15, y + 103, { width: colW - 30, align: 'center' });
        });

        doc.y = y + 160;
    }

    // ============================================================
    // STANDARD REPORT CONTENT (Denetim Özet / Komite / YK)
    // ============================================================

    private async generateStandardContent(
        doc: any, audits: any[], fontR: string, fontB: string,
        sections: { title: string; page: number }[],
        startDate: Date, endDate: Date
    ) {
        const W = doc.page.width;
        const allFindings = audits.flatMap(a => a.findings || []);
        const riskDist = {
            kritik: allFindings.filter(f => f.risk?.toLowerCase().includes('kritik')).length,
            yuksek: allFindings.filter(f => f.risk?.toLowerCase().includes('yüksek') || f.risk?.toLowerCase().includes('yuksek')).length,
            orta: allFindings.filter(f => f.risk?.toLowerCase().includes('orta')).length,
            dusuk: allFindings.filter(f => f.risk?.toLowerCase().includes('düşük') || f.risk?.toLowerCase().includes('dusuk')).length,
        };

        // ===== SECTION 1: YÖNETİCİ ÖZETİ =====
        doc.addPage();
        sections.push({ title: 'Yönetici Özeti', page: doc.bufferedPageRange().count });
        this.drawSectionHeader(doc, '1. YÖNETİCİ ÖZETİ', '', fontB);

        doc.font(fontR).fontSize(10).fillColor(COLORS.text);
        doc.text(
            `Bu rapor, ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')} tarihleri arasında gerçekleştirilen iç denetim faaliyetlerinin sonuçlarını özetlemektedir.`,
            60, doc.y, { width: W - 120, lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `Dönem içerisinde toplam ${audits.length} adet denetim görevi yürütülmüş, bu denetimlerde ${allFindings.length} adet bulgu tespit edilmiştir.`,
            60, doc.y, { width: W - 120, lineGap: 4 }
        );
        doc.moveDown(1);

        // === PREMIUM KPI STAT CARDS ===
        const completedAudits = audits.filter(a => a.status?.toLowerCase().includes('tamaml') || a.status?.toLowerCase().includes('kapal')).length;
        const completionRate = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0;

        this.drawStatCards(doc, [
            { label: 'Toplam Denetim', value: String(audits.length), color: COLORS.primary, subtext: `${completedAudits} tamamlandı` },
            { label: 'Toplam Bulgu', value: String(allFindings.length), color: COLORS.warning, subtext: `${riskDist.kritik + riskDist.yuksek} yüksek öncelikli` },
            { label: 'Tamamlanma Oranı', value: `%${completionRate}`, color: COLORS.success, subtext: `${audits.length - completedAudits} devam eden` },
            { label: 'Kritik Bulgu', value: String(riskDist.kritik), color: COLORS.riskKritik, subtext: 'Acil aksiyon gerektirir' },
            { label: 'Yüksek Risk', value: String(riskDist.yuksek), color: COLORS.riskYuksek, subtext: 'Kısa vadede çözülmeli' },
            { label: 'Orta / Düşük Risk', value: `${riskDist.orta} / ${riskDist.dusuk}`, color: COLORS.riskOrta, subtext: 'Takip edilmeli' },
        ], fontR, fontB);

        // === RISK DONUT CHART ===
        if (allFindings.length > 0) {
            doc.moveDown(0.5);
            this.drawDonutChart(doc, [
                { label: 'Kritik', value: riskDist.kritik, color: COLORS.riskKritik },
                { label: 'Yüksek', value: riskDist.yuksek, color: COLORS.riskYuksek },
                { label: 'Orta', value: riskDist.orta, color: COLORS.riskOrta },
                { label: 'Düşük', value: riskDist.dusuk, color: COLORS.riskDusuk },
            ], 'Risk Seviyesi Dağılımı', fontR, fontB);

            // === RISK BAR CHART ===
            this.drawRiskBarChart(doc, riskDist, allFindings.length, fontR, fontB);
        }

        // Risk distribution explanation
        if (riskDist.kritik > 0 || riskDist.yuksek > 0) {
            doc.moveDown(0.5);
            doc.font(fontB).fontSize(10).fillColor(COLORS.danger);
            doc.text('⚠ Dikkat Gerektiren Bulgular:', 60, doc.y, { width: W - 120 });
            doc.font(fontR).fontSize(9).fillColor(COLORS.text);
            if (riskDist.kritik > 0) {
                doc.text(`• ${riskDist.kritik} adet KRİTİK risk seviyesinde bulgu tespit edilmiştir. Acil aksiyon gerekmektedir.`, 70, doc.y, { width: W - 140, lineGap: 3 });
            }
            if (riskDist.yuksek > 0) {
                doc.text(`• ${riskDist.yuksek} adet YÜKSEK risk seviyesinde bulgu tespit edilmiştir. Kısa vadede düzeltici aksiyon planlanmalıdır.`, 70, doc.y, { width: W - 140, lineGap: 3 });
            }
        }

        // ===== SECTION 2: DENETİM LİSTESİ =====
        doc.addPage();
        sections.push({ title: 'Denetim Listesi', page: doc.bufferedPageRange().count });
        this.drawSectionHeader(doc, '2. DENETİM LİSTESİ', '', fontB);

        const auditHeaders = ['#', 'Denetim Kodu', 'Denetim Adı', 'Birim', 'Durum', 'Bulgu'];
        const auditColWidths = [30, 80, 145, 80, 70, 50];
        const auditRows = audits.map((a, i) => [
            String(i + 1),
            a.auditCode || '-',
            (a.title || 'Başlıksız').substring(0, 35),
            a.AuditableUnit?.name?.substring(0, 18) || '-',
            a.status || '-',
            String(a.findings?.length || 0)
        ]);
        this.drawSimpleTable(doc, auditHeaders, auditRows, auditColWidths, fontR, fontB);

        // ===== SECTION 3: BULGU ÖZETİ =====
        if (allFindings.length > 0) {
            doc.addPage();
            sections.push({ title: 'Bulgu Özet Tablosu', page: doc.bufferedPageRange().count });
            this.drawSectionHeader(doc, '3. BULGU ÖZET TABLOSU', '', fontB);

            const findingHeaders = ['#', 'Bulgu Kodu', 'Başlık', 'Risk', 'Durum', 'Denetim'];
            const findingColWidths = [25, 75, 145, 55, 75, 80];
            const findingRows = allFindings.map((f: any, i: number) => [
                String(i + 1),
                f.code || '-',
                (f.title || '-').substring(0, 35),
                f.risk || '-',
                f.status || '-',
                audits.find(a => a.id === f.auditId)?.auditCode || '-'
            ]);
            this.drawSimpleTable(doc, findingHeaders, findingRows, findingColWidths, fontR, fontB);
        }

        // ===== SECTION 4: BULGU DETAYLARI =====
        if (allFindings.length > 0) {
            doc.addPage();
            sections.push({ title: 'Bulgu Detayları', page: doc.bufferedPageRange().count });
            this.drawSectionHeader(doc, '4. BULGU DETAYLARI', '', fontB);

            for (let i = 0; i < allFindings.length; i++) {
                const finding: any = allFindings[i];
                const auditTitle = audits.find(a => a.id === finding.auditId)?.title || '-';

                // Check page overflow — each finding needs ~200px space
                if (doc.y > doc.page.height - 250) {
                    doc.addPage();
                }

                // Finding header
                const fHeaderY = doc.y + 5;
                doc.roundedRect(60, fHeaderY, W - 120, 22, 3).fill(COLORS.primaryLight);
                doc.font(fontB).fontSize(10).fillColor(COLORS.primary);
                doc.text(`Bulgu ${i + 1}: ${finding.code || '-'}`, 68, fHeaderY + 5, { width: W - 200 });

                // Risk badge
                this.drawRiskBadge(doc, finding.risk, W - 135, fHeaderY + 4, fontB);

                doc.y = fHeaderY + 30;

                // Finding info
                this.drawInfoBox(doc, finding.title || 'Başlıksız Bulgu', [
                    { label: 'Denetim', value: auditTitle },
                    { label: 'Kategori', value: finding.category || '-' },
                    { label: 'Durum', value: finding.status || '-' },
                    { label: 'Açıklama', value: (finding.description || '-').substring(0, 200) },
                    { label: 'Kök Neden', value: (finding.rootCause || '-').substring(0, 200) },
                    { label: 'Öneri', value: (finding.recommendation || '-').substring(0, 200) },
                ], fontR, fontB);

                doc.moveDown(0.5);
            }
        }

        // ===== SECTION 5: DENETİM DETAYLARI =====
        if (audits.length > 0) {
            doc.addPage();
            sections.push({ title: 'Denetim Detayları', page: doc.bufferedPageRange().count });
            this.drawSectionHeader(doc, `${allFindings.length > 0 ? '5' : '3'}. DENETİM DETAYLARI`, '', fontB);

            for (const audit of audits) {
                if (doc.y > doc.page.height - 200) {
                    doc.addPage();
                }

                this.drawInfoBox(doc, `${audit.auditCode || '-'} — ${audit.title || 'Başlıksız'}`, [
                    { label: 'Birim', value: audit.AuditableUnit?.name || '-' },
                    { label: 'Durum', value: audit.status || '-' },
                    { label: 'Başlangıç', value: audit.startDate || '-' },
                    { label: 'Bitiş', value: audit.endDate || '-' },
                    { label: 'Kapsam', value: (audit.scope || '-').substring(0, 150) },
                    { label: 'Amaç', value: (audit.objective || '-').substring(0, 150) },
                    { label: 'Bulgu Sayısı', value: `${audit.findings?.length || 0} adet` },
                ], fontR, fontB);

                doc.moveDown(0.5);
            }
        }
    }

    // ============================================================
    // ACTIVITY REPORT CONTENT  (Faaliyet Raporu)
    // ============================================================

    private async generateActivityContent(
        doc: any, startDate: Date, endDate: Date, audits: any[],
        fontR: string, fontB: string,
        sections: { title: string; page: number }[]
    ) {
        const W = doc.page.width;
        const allFindings = audits.flatMap(a => a.findings || []);

        // Fetch timesheets
        const timesheets = await this.prisma.auditTimesheet.findMany({
            where: {
                date: {
                    gte: startDate.toISOString().split('T')[0],
                    lte: endDate.toISOString().split('T')[0]
                }
            },
            include: { user: true }
        });
        const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours || 0), 0);

        // Log verileri rapor içeriği değildir, kaldırıldı.

        // ===== SECTION 1: FAALİYET ÖZETİ =====
        doc.addPage();
        sections.push({ title: 'Faaliyet Özeti', page: doc.bufferedPageRange().count });
        this.drawSectionHeader(doc, '1. FAALİYET ÖZETİ', '', fontB);

        doc.font(fontR).fontSize(10).fillColor(COLORS.text);
        doc.text(
            `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')} dönemine ait ${ORG.departmentName} faaliyet özeti aşağıda sunulmaktadır.`,
            60, doc.y, { width: W - 120, lineGap: 4 }
        );
        doc.moveDown(1);

        this.drawStatCards(doc, [
            { label: 'Toplam Denetim', value: String(audits.length), color: COLORS.primary, subtext: 'Dönem içi denetim' },
            { label: 'Toplam Bulgu', value: String(allFindings.length), color: COLORS.warning, subtext: 'Tespit edilen bulgu' },
            { label: 'Toplam Efor', value: `${totalHours.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}s`, color: COLORS.success, subtext: 'Adam-saat efor' },
            { label: 'Personel', value: String(new Set(timesheets.map(t => t.userId)).size), color: COLORS.primary, subtext: 'Aktif denetçi' },
            { label: 'Ortalama Bulgu', value: audits.length > 0 ? (allFindings.length / audits.length).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : '0', color: COLORS.riskOrta, subtext: 'Denetim başına bulgu' },
        ], fontR, fontB);

        // ===== SECTION 2: PERSONEL EFOR DAĞILIMI =====
        doc.addPage();
        sections.push({ title: 'Personel Efor Dağılımı', page: doc.bufferedPageRange().count });
        this.drawSectionHeader(doc, '2. PERSONEL EFOR DAĞILIMI', '', fontB);

        const userEffort: Record<string, { hours: number; count: number }> = {};
        timesheets.forEach(t => {
            if (t.user) {
                const name = t.user.displayName || t.user.username || 'Bilinmeyen';
                if (!userEffort[name]) userEffort[name] = { hours: 0, count: 0 };
                userEffort[name].hours += Number(t.hours || 0);
                userEffort[name].count += 1;
            }
        });

        const effortHeaders = ['#', 'Personel', 'Toplam Saat', 'Kayıt Sayısı', 'Oran'];
        const effortColWidths = [30, 170, 90, 85, 80];
        const effortRows = Object.entries(userEffort)
            .sort((a, b) => b[1].hours - a[1].hours)
            .map(([name, data], i) => [
                String(i + 1),
                name,
                data.hours.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                String(data.count),
                totalHours > 0 ? '%' + ((data.hours / totalHours) * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'
            ]);
        this.drawSimpleTable(doc, effortHeaders, effortRows, effortColWidths, fontR, fontB);

        // ===== SECTION 3: DENETİM DURUM DAĞILIMI =====
        doc.addPage();
        sections.push({ title: 'Denetim Durum Dağılımı', page: doc.bufferedPageRange().count });
        this.drawSectionHeader(doc, '3. DENETİM DURUM DAĞILIMI', '', fontB);

        const statusDist: Record<string, number> = {};
        audits.forEach(a => {
            statusDist[a.status || 'Belirsiz'] = (statusDist[a.status || 'Belirsiz'] || 0) + 1;
        });

        // Status donut chart
        const statusColors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.riskOrta, COLORS.danger, COLORS.textMuted];
        const statusDonutData = Object.entries(statusDist).map(([status, count], i) => ({
            label: status,
            value: count,
            color: statusColors[i % statusColors.length]
        }));
        this.drawDonutChart(doc, statusDonutData, 'Denetim Durum Dağılımı', fontR, fontB);

        doc.moveDown(0.5);

        const statusHeaders = ['Durum', 'Adet', 'Oran'];
        const statusColWidths = [200, 100, 155];
        const statusRows = Object.entries(statusDist).map(([status, count]) => [
            status,
            String(count),
            audits.length > 0 ? '%' + ((count / audits.length) * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'
        ]);
        this.drawSimpleTable(doc, statusHeaders, statusRows, statusColWidths, fontR, fontB);

        // Audit list
        doc.moveDown(1);
        const auditHeaders = ['#', 'Kod', 'Denetim Adı', 'Durum', 'Bulgu'];
        const auditColWidths = [30, 80, 195, 80, 70];
        const auditRows = audits.map((a, i) => [
            String(i + 1),
            a.auditCode || '-',
            (a.title || '-').substring(0, 45),
            a.status || '-',
            String(a.findings?.length || 0)
        ]);
        this.drawSimpleTable(doc, auditHeaders, auditRows, auditColWidths, fontR, fontB);

        // ===== SECTION 4: BULGU ÖZETİ =====
        if (allFindings.length > 0) {
            doc.addPage();
            sections.push({ title: 'Bulgu Özeti', page: doc.bufferedPageRange().count });
            this.drawSectionHeader(doc, '4. BULGU ÖZETİ', '', fontB);

            const riskDist = {
                kritik: allFindings.filter(f => f.risk?.toLowerCase().includes('kritik')).length,
                yuksek: allFindings.filter(f => f.risk?.toLowerCase().includes('yüksek') || f.risk?.toLowerCase().includes('yuksek')).length,
                orta: allFindings.filter(f => f.risk?.toLowerCase().includes('orta')).length,
                dusuk: allFindings.filter(f => f.risk?.toLowerCase().includes('düşük') || f.risk?.toLowerCase().includes('dusuk')).length,
            };

            this.drawRiskBarChart(doc, riskDist, allFindings.length, fontR, fontB);

            doc.moveDown(1);

            const findingHeaders = ['#', 'Kod', 'Başlık', 'Risk', 'Durum'];
            const findingColWidths = [30, 75, 200, 75, 75];
            const findingRows = allFindings.map((f: any, i: number) => [
                String(i + 1),
                f.code || '-',
                (f.title || '-').substring(0, 50),
                f.risk || '-',
                f.status || '-'
            ]);
            this.drawSimpleTable(doc, findingHeaders, findingRows, findingColWidths, fontR, fontB);
        }
    }
}
