import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskEngineService } from '../risk-engine/risk-engine.service';
import { ScenarioParameters } from '../risk-engine/risk-engine.types';

@Injectable()
export class ScenarioEngineService {
    constructor(
        private prisma: PrismaService,
        private riskEngine: RiskEngineService,
    ) { }

    private readonly logger = new Logger(ScenarioEngineService.name);

    /**
     * Senaryo parametrelerini getir
     */
    async getScenarioParameters(scenarioCode: string): Promise<ScenarioParameters | null> {
        const senaryo = await this.prisma.senaryo.findUnique({
            where: { senaryo_kodu: scenarioCode },
        });

        if (!senaryo) return null;

        return senaryo.parametreler as any as ScenarioParameters;
    }

    /**
     * Tüm senaryoları çalıştır ve sonuçları kaydet
     */
    async runAllScenarios() {
        const bugun = new Date();

        // Tüm senaryoları al
        const senaryolar = await this.prisma.senaryo.findMany();

        for (const senaryo of senaryolar) {
            // SQLite uyumluluğu: Parametreler string ise parse et
            let params: ScenarioParameters;
            if (typeof senaryo.parametreler === 'string') {
                try {
                    params = JSON.parse(senaryo.parametreler);
                } catch (e) {
                    this.logger.error(`Senaryo parametreleri parse edilemedi (${senaryo.senaryo_kodu}):`, e);
                    params = {} as any;
                }
            } else {
                params = senaryo.parametreler as any;
            }

            // Tüm KPI'ları hesapla
            const results = await this.riskEngine.calculateAllKpis(params);

            // Sonuçları veritabanına kaydet
            for (const result of results) {
                await this.prisma.gunlukRiskOzet.upsert({
                    where: {
                        tarih_senaryo_kodu_kpi_kodu: {
                            tarih: bugun,
                            senaryo_kodu: senaryo.senaryo_kodu,
                            kpi_kodu: result.kpi_kodu,
                        },
                    },
                    create: {
                        tarih: bugun,
                        deger: isNaN(Number(result.deger)) ? 0 : result.deger,
                        risk_seviyesi: result.risk_seviyesi,
                        senaryo: { connect: { senaryo_kodu: senaryo.senaryo_kodu } },
                        kpi: { connect: { kpi_kodu: result.kpi_kodu } },
                    },
                    update: {
                        deger: isNaN(Number(result.deger)) ? 0 : result.deger,
                        risk_seviyesi: result.risk_seviyesi,
                    },
                });

                // ----------------------------------------------------------------------
                // KAPALI ÇEVRİM (CLOSED-LOOP): SENARYO -> SÜREKLİ DENETİM BULGUSU
                // ----------------------------------------------------------------------
                if (result.risk_seviyesi === 'RED') {
                    try {
                        const yearStr = bugun.getFullYear().toString();
                        let continuousAudit = await this.prisma.audit.findFirst({
                            where: { title: `Otomatik Sürekli Denetim (${yearStr})` }
                        });

                        if (!continuousAudit) {
                            continuousAudit = await this.prisma.audit.create({
                                data: {
                                    title: `Otomatik Sürekli Denetim (${yearStr})`,
                                    description: `Senaryo motoru tarafından ${yearStr} yılı içinde tespit edilen kritik (RED) anomalilerin toplandığı sürekli denetim havuzu.`,
                                    startDate: `${yearStr}-01-01`,
                                    endDate: `${yearStr}-12-31`,
                                    status: 'Planlanıyor',
                                    type: 'Sürekli Denetim',
                                    riskLevel: 'Kritik',
                                    department: 'Merkezi Sistem'
                                }
                            });
                        }

                        // Spam'i önlemek için: Bu KPI için zaten aktif bir bulgu var mı?
                        const existingFinding = await this.prisma.finding.findFirst({
                            where: {
                                auditId: continuousAudit.id,
                                title: { contains: result.kpi_kodu },
                                status: { in: ['Taslak', 'Onay Bekliyor', 'Doğrulama Bekliyor', 'Takip Ediliyor'] },
                                isDeleted: false
                            }
                        });

                        if (!existingFinding) {
                            const desc = `Senaryo Motoru (${senaryo.senaryo_kodu}) tarafından ${result.kpi_kodu} göstergesinde "RED" (Kritik) seviyesinde risk tespit edilmiştir. Güncel Değer: ${result.deger}. Bu bulgu otomatik olarak oluşturulmuştur ve detaylı incelenmelidir.`;
                            await this.prisma.finding.create({
                                data: {
                                    auditId: continuousAudit.id,
                                    title: `[Anomali] ${result.kpi_kodu} Göstergesi Kritik Seviyede`,
                                    risk: 'Kritik',
                                    status: 'Taslak',
                                    description: desc,
                                    department: 'Veri Analitiği',
                                    code: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${result.kpi_kodu}`,
                                    category: 'Veri Analitiği / Suistimal'
                                }
                            });
                            this.logger.log(`[Sürekli Denetim] Otomatik bulgu eklendi: KPI=${result.kpi_kodu}`);
                        }
                    } catch (e) {
                         this.logger.error(`Sürekli Denetim bulgusu oluşturulurken hata: `, e);
                    }
                }
                // ----------------------------------------------------------------------
            }
        }

        return { message: 'Tüm senaryolar çalıştırıldı', tarih: bugun };
    }

    /**
     * Belirli bir senaryo için özet getir
     */
    async getScenarioSummary(scenarioCode: string, date?: Date) {
        const tarih = date || new Date();

        const ozetler = await this.prisma.gunlukRiskOzet.findMany({
            where: {
                senaryo_kodu: scenarioCode,
                tarih: {
                    gte: new Date(tarih.setHours(0, 0, 0, 0)),
                    lte: new Date(tarih.setHours(23, 59, 59, 999)),
                },
            },
            include: {
                kpi: true,
            },
        });

        return ozetler;
    }
}
