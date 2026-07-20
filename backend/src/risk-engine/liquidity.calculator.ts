import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';

/**
 * LYO - Likidite Yeterlilik Oranı (BDDK 1 Ocak 2026 Tebliği)
 * Formül: Nakit Girişleri / Nakit Çıkışları
 */
@Injectable()
export class LiquidityCalculator {
    constructor(
        private prisma: PrismaService,
        private deliveryLiabilityCalculator: DeliveryLiabilityCalculator
    ) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        // En son pozisyonu al (Normalde bu günlük cron job ile beslenir)
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        if (!pozisyon) {
            return {
                kpi_kodu: 'LCR',
                deger: 0,
                risk_seviyesi: 'RED',
                detay: { mesaj: 'Likidite verisi bulunamadı' },
            };
        }

        // Nakit Giriş Kalemleri (BDDK Tebliği)
        let nakitGiris = Number(pozisyon.nakit) + Number(pozisyon.likit_varlik);
        
        // Nakit Çıkış Kalemleri (Borçlar)
        let kisaVadeliCikis = Number(pozisyon.kisa_vadeli_yukumluluk);
        
        // 30 Günlük Teslimat Çıkış Yükümlülüğü
        let teslimatCikis = await this.deliveryLiabilityCalculator.calculateTotalLiability(params);

        // Şok Senaryoları Uygulama
        if (params) {
            if (params.likidite_dusus !== 0) {
                nakitGiris = nakitGiris * (1 - params.likidite_dusus);
            }
            if (params.iptal_artis > 0) {
                nakitGiris = nakitGiris * (1 - params.iptal_artis);
            }
        }

        const toplamCikis = kisaVadeliCikis + teslimatCikis;
        const lyo = toplamCikis > 0 ? (nakitGiris / toplamCikis) : (nakitGiris > 0 ? 9.99 : 1.0);
        const lyoYuzde = lyo * 100;

        // BDDK Eşikleri Belirleme (1 Ocak 2026 Tebliği)
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let bddkUyariMesaji = '✅ LYO Sağlıklı (Mevzuat Uyumlu)';

        if (lyoYuzde < 100) {
            riskSeviyesi = 'RED';
            bddkUyariMesaji = '🚨 KRİTİK İHLAL: Oran %100 asgari sınırının altına düştü. 2 hafta içinde giderilmelidir. (Yılda en fazla 6 kez ihlal edilebilir)';
        } else if (lyoYuzde < 120) {
            riskSeviyesi = 'YELLOW';
            bddkUyariMesaji = '🔴 BDDK BİLDİRİM EŞİĞİ: Oran %120 sınırının altında. Alınacak önlemlerle birlikte ivedilikle BDDK\'ya bildirilmelidir.';
        } else if (lyoYuzde < 200) {
            riskSeviyesi = 'YELLOW';
            bddkUyariMesaji = '⚠️ ERKEN UYARI EŞİĞİ: Oran %200\'ün altında. 6 hafta üst üste bu seviyede kalırsa gerekçeler BDDK\'ya bildirilmelidir.';
        }

        return {
            kpi_kodu: 'LCR', // Legacy kod adı LCR kalabilir ama metrik LYO
            deger: lyoYuzde,
            risk_seviyesi: riskSeviyesi,
            detay: {
                nakit_giris: nakitGiris,
                nakit_cikis_borclar: kisaVadeliCikis,
                nakit_cikis_teslimat: teslimatCikis,
                toplam_cikis: toplamCikis,
                bddk_mesaji: bddkUyariMesaji
            },
        };
    }
}
