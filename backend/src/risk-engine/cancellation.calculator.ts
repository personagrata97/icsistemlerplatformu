import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

@Injectable()
export class CancellationCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        // Toplam sözleşme sayısı
        const totalContracts = await this.prisma.sozlesme.count();

        // İptal edilen sözleşme sayısı (durum='IPTAL' veya iptal_durumu=true)
        const cancelledContracts = await this.prisma.sozlesme.count({
            where: {
                OR: [
                    { durum: 'IPTAL' },
                    { iptal_durumu: true }
                ]
            }
        });

        if (totalContracts === 0) {
            return {
                kpi_kodu: 'IPTAL_ORANI',
                deger: 0,
                risk_seviyesi: 'GREEN',
                detay: { aciklama: 'Henüz sözleşme yok' }
            };
        }

        let cancellationRate = cancelledContracts / totalContracts;

        // Senaryo etkisi: iptal_artis
        if (params && params.iptal_artis > 0) {
            // Mevcut iptal oranını senaryo kadar artırıyoruz
            // Örn: Oran 0.05, İptal Artış 0.20 (%20) -> Yeni Oran = 0.05 * 1.20 = 0.06
            cancellationRate = cancellationRate * (1 + params.iptal_artis);
        }

        // Risk Seviyeleri (Örnek Limitler)
        // %10 üzeri RED, %5-%10 arası YELLOW
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (cancellationRate > 0.10) {
            riskSeviyesi = 'RED';
        } else if (cancellationRate > 0.05) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'IPTAL_ORANI',
            deger: cancellationRate * 100, // Yüzde olarak gösterim
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_sozlesme: totalContracts,
                iptal_sozlesme: cancelledContracts,
                senaryo_etkisi: params?.iptal_artis || 0
            }
        };
    }
}
