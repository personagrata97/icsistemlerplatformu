import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditRiskService {
    private readonly logger = new Logger(AuditRiskService.name);

    constructor(private prisma: PrismaService) { }

    async updateOpenFindingsCount(auditId: string): Promise<void> {
        try {
            const audit = await this.prisma.audit.findUnique({
                where: { id: auditId },
                select: { unitId: true, auditableUnitId: true }
            });

            const targetUnitId = audit?.unitId || audit?.auditableUnitId;
            if (!targetUnitId) return;

            const unit = await this.prisma.auditableUnit.findUnique({
                where: { id: targetUnitId }
            });

            if (!unit) return;

            const openFindings = await this.prisma.finding.findMany({
                where: {
                    audit: {
                        OR: [
                            { unitId: targetUnitId },
                            { auditableUnitId: targetUnitId }
                        ]
                    },
                    isDeleted: false,
                    status: {
                        notIn: ['Tamamlandı', 'Kapatıldı', 'Risk Kabul Edildi', 'İptal Edildi']
                    }
                },
                select: { risk: true, controlId: true }
            });

            // KAPALI ÇEVRİM ENTEGRASYON (CLOSED-LOOP)
            // İlgili birime atanmış / ilişkilendirilmiş Etik Bildirimlerinin sayısını ve ciddiyetini çek
            const ethicsReports = await this.prisma.ethicsReport.findMany({
                where: {
                    targetUnitId: targetUnitId,
                    status: { notIn: ['Kapatıldı', 'Reddedildi'] } // Aktif/Açık bildirimler
                },
                select: { priority: true, type: true }
            });

            // KAPALI ÇEVRİM ENTEGRASYON (CLOSED-LOOP) 2
            // Kapanan geçmiş bulguların kalıntı risk / tarihçe cezası
            const closedFindings = await this.prisma.finding.findMany({
                where: {
                    audit: {
                        OR: [
                            { unitId: targetUnitId },
                            { auditableUnitId: targetUnitId }
                        ]
                    },
                    isDeleted: false,
                    status: 'Kapatıldı'
                },
                select: { risk: true }
            });

            const impactScore: any = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 };
            const controlScore: any = { 'Zayıf': 3, 'Orta': 2, 'Güçlü': 1 };

            const financialVal = impactScore[unit.financialImpact || 'Düşük'] || 1;
            const volumeVal = impactScore[unit.transactionVolume || 'Düşük'] || 1;
            const inherentVal = impactScore[unit.inherentRisk || 'Düşük'] || 1;
            const controlVal = controlScore[unit.controlEffectiveness || 'Güçlü'] || 1;
            const criticalityVal = impactScore[unit.businessCriticality || 'Düşük'] || 1;
            const changeVal = unit.changeRisk ? 1.2 : 1;
            const mandatoryVal = unit.mandatoryAudit ? 1.1 : 1;

            let employeeVal = 1;
            if (unit.employeeCount) {
                if (unit.employeeCount > 50) employeeVal = 3;
                else if (unit.employeeCount >= 20) employeeVal = 2;
            }

            const baseScore = (financialVal * 3 + volumeVal * 2 + inherentVal * 2 + controlVal * 2 + criticalityVal + employeeVal) / 33 * 100;
            let adjustedScore = Math.round(baseScore * changeVal * mandatoryVal);

            let findingsPenalty = 0;
            for (const finding of openFindings) {
                if (finding.controlId) {
                    if (finding.risk === 'Kritik') findingsPenalty += 15;
                    else if (finding.risk === 'Yüksek') findingsPenalty += 10;
                    else if (finding.risk === 'Orta') findingsPenalty += 5;
                    else if (finding.risk === 'Düşük') findingsPenalty += 2;
                } else {
                    if (finding.risk === 'Kritik') findingsPenalty += 5;
                    else if (finding.risk === 'Yüksek') findingsPenalty += 3;
                    else if (finding.risk === 'Orta') findingsPenalty += 1;
                }
            }

            let ethicsPenalty = 0;
            for (const report of ethicsReports) {
                // Öncelik bazlı ceza puanı
                if (report.priority === 'Kritik') ethicsPenalty += 20;
                else if (report.priority === 'Yüksek') ethicsPenalty += 15;
                else if (report.priority === 'Orta') ethicsPenalty += 8;
                else if (report.priority === 'Düşük') ethicsPenalty += 3;

                // Konu bazlı ceza puanı (Zimmet/Yolsuzluk ihbarı en ağır skoru getirir)
                const t = report.type.toLowerCase();
                if (t.includes('zimmet') || t.includes('yolsuzluk') || t.includes('rüşvet') || t.includes('hırsızlık')) {
                    ethicsPenalty += 25; 
                } else if (t.includes('çıkar çatışması') || t.includes('mobbing')) {
                    ethicsPenalty += 10;
                }
            }

            let historyPenalty = 0;
            for (const f of closedFindings) {
                // Kapatılmış olsa bile, geçmişte kritik hata yapan şubenin inherent riski yüksektir
                if (f.risk === 'Kritik') historyPenalty += 3;
                else if (f.risk === 'Yüksek') historyPenalty += 1;
                // Orta ve Düşük bulguları tarihçe cezasına katmıyoruz
            }

            // --- ELITE: DINAMIK TEST SONUCU ENTEGRASYONU ---
            // Birime ait son denetim testlerini kontrol et
            const unitTests = await this.prisma.auditTest.findMany({
                where: {
                    control: {
                        risk: {
                            process: {
                                unitId: targetUnitId
                            }
                        }
                    }
                },
                orderBy: { testDate: 'desc' },
                select: { testResult: true }
            });

            let testPenalty = 0;
            if (unitTests.length > 0) {
                const negativeTests = unitTests.filter(t => t.testResult === 'Olumsuz').length;
                const failRate = negativeTests / unitTests.length;
                
                if (failRate > 0.5) testPenalty = 20; // Testlerin yarısından fazlası olumsuzsa ağır ceza
                else if (negativeTests > 0) testPenalty = 10; // En az bir olumsuzluk varsa ceza
            }

            const finalRiskScore = Math.min(100, Math.max(0, adjustedScore + findingsPenalty + ethicsPenalty + historyPenalty + testPenalty));
            const controlDiscount: any = { 'Güçlü': 0.4, 'Orta': 0.7, 'Zayıf': 1.0 };
            const discount = controlDiscount[unit.controlEffectiveness || 'Orta'] || 0.7;
            const residualRiskScore = Math.min(100, Math.max(0, Math.round(finalRiskScore * discount)));

            await this.prisma.auditableUnit.update({
                where: { id: targetUnitId },
                data: {
                    openFindingsCount: openFindings.length,
                    riskScore: finalRiskScore,
                    residualRiskScore: residualRiskScore
                }
            });

            this.logger.log(`Update Metrics for unit ${targetUnitId}: openFindings=${openFindings.length}, riskScore=${finalRiskScore}`);
        } catch (error) {
            this.logger.error('Failed to update unit scores:', error);
        }
    }
}
