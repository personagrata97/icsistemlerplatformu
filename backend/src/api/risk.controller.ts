import { Controller, Get, Post, Query, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ScenarioEngineService } from '../scenario-engine/scenario-engine.service';
import { AlertService } from '../alert-system/alert.service';
import * as xlsx from 'xlsx';
import { PrismaService } from '../common/prisma.service';
import { BddkExportService } from '../risk-engine/bddk-export.service';
import { DataIngestionService } from '../risk-engine/data-ingestion.service';

@Controller('risk')
export class RiskController {
    constructor(
        private scenarioEngine: ScenarioEngineService,
        private alertService: AlertService,
        private prisma: PrismaService,
        private bddkService: BddkExportService,
        private dataIngestionService: DataIngestionService,
    ) { }

    /**
     * GET /risk/summary?senaryo=BAZ
     * Belirli bir senaryo için risk özetini döner
     */
    @Get('summary')
    async getRiskSummary(@Query('senaryo') senaryo: string = 'BAZ') {
        const ozet = await this.scenarioEngine.getScenarioSummary(senaryo);
        return {
            senaryo_kodu: senaryo,
            ozet,
        };
    }

    /**
     * GET /risk/run
     * Tüm senaryoları çalıştırır ve sonuçları kaydeder
     */
    @Get('run')
    async runAllScenarios() {
        const result = await this.scenarioEngine.runAllScenarios();

        // Her senaryo için uyarıları kontrol et
        const senaryolar = await this.scenarioEngine['prisma'].senaryo.findMany();

        for (const senaryo of senaryolar) {
            const ozetler = await this.scenarioEngine.getScenarioSummary(senaryo.senaryo_kodu);

            for (const ozet of ozetler) {
                await this.alertService.checkLimitsAndCreateAlerts(
                    ozet.kpi_kodu,
                    Number(ozet.deger),
                    senaryo.senaryo_kodu,
                    ozet.risk_seviyesi,
                );
            }
        }

        return result;
    }

    /**
     * POST /risk/upload-excel
     * Akıllı Excel Yükleme ve Validasyon Endpoint'i
     */
    @Post('upload-excel')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcelData(@UploadedFile() file: Express.Multer.File, @Query('confirm') confirm: string) {
        if (!file) {
            return { basari: false, mesaj: 'Dosya bulunamadı' };
        }

        try {
            // Adım 1: Ön İnceleme (Pre-flight Check)
            const { report, mappedData } = await this.dataIngestionService.validateExcelData(file.buffer);

            // Eğer "confirm=true" parametresi gelmediyse (Sadece Rapor İsteği)
            if (confirm !== 'true') {
                return {
                    basari: report.is_valid,
                    mesaj: report.is_valid ? 'Dosya doğrulaması başarılı. Kaydetmek için onay verin.' : 'Dosya doğrulama hataları içeriyor.',
                    report: report
                };
            }

            // Adım 2: Kullanıcı Onayladıysa Kaydet
            if (!report.is_valid) {
                return {
                    basari: false,
                    mesaj: 'Veri kalitesi doğrulamasını geçemeyen dosya yüklenemez.',
                    report: report
                };
            }

            const basariliKayit = await this.dataIngestionService.processAndLoadData(mappedData);

            // Hesaplamaları otomatik olarak tetikleyelim ki arayüzde veriler güncellensin
            try {
                await this.scenarioEngine.runAllScenarios();
            } catch (calcError) {
                // Hata olsa dahi kayıtların yüklendiğini bildirmeliyiz
                return {
                    basari: true,
                    mesaj: `${basariliKayit} adet kayıt yüklendi fakat hesaplamalar tetiklenirken hata oluştu: ${calcError.message}`,
                    report: report
                };
            }

            return {
                basari: true,
                mesaj: `${basariliKayit} adet kayıt başarıyla Risk Motoruna yüklendi ve tüm risk göstergeleri yeniden hesaplandı.`,
                report: report
            };

        } catch (error) {
            return {
                basari: false,
                mesaj: 'Excel işlenirken beklenmeyen hata oluştu',
                hata: error.message
            };
        }
    }

    /**
     * GET /risk/bddk-export/lyo
     * BDDK Haftalık LYO Cetveli
     */
    @Get('bddk-export/lyo')
    async getBddkLyoExport() {
        return this.bddkService.generateWeeklyLiquidityReport();
    }

    /**
     * GET /risk/bddk-export/npl
     * BDDK Aylık NPL Cetveli
     */
    @Get('bddk-export/npl')
    async getBddkNplExport() {
        return this.bddkService.generateMonthlyNplReport();
    }

    /**
     * GET /risk/limits
     * Risk limit listesini döner
     */
    @Get('limits')
    async getLimits() {
        return this.prisma.riskLimit.findMany({
            include: { kpi: true },
            orderBy: { kpi_kodu: 'asc' }
        });
    }

    /**
     * POST /risk/limits
     * Belirli limit eşik değerlerini günceller
     */
    @Post('limits')
    async updateLimit(@Body() body: { id: string; esik_deger: number }) {
        const { id, esik_deger } = body;
        return this.prisma.riskLimit.update({
            where: { id },
            data: { esik_deger },
            include: { kpi: true }
        });
    }
}
