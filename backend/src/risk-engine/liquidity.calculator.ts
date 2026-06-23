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
        const lyo = toplamCikis > 0 ? (nakitGiris / toplamCikis) : 0;
        const lyoYuzde = lyo * 100;

        // BDDK Eşikleri Belirleme (1 Ocak 2026 Tebliği)
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let bddkUyariMesaji = '✅ LYO Sağlıklı';

        if (lyoYuzde < 100) {
            riskSeviyesi = 'RED';
            bddkUyariMesaji = '🚨 KRİTİK İHLAL: Oran %100 altına düştü. 2 hafta içinde giderilmeli.';
        } else if (lyoYuzde < 120) {
            riskSeviyesi = 'RED'; // Veya UI için koyu sarı
            bddkUyariMesaji = '🔴 ACİL BİLDİRİM: %120 altına inildi. İvedi olarak BDDK savunma yazısı hazırlanmalı.';
        } else if (lyoYuzde < 200) {
            riskSeviyesi = 'YELLOW';
            bddkUyariMesaji = '⚠️ YAKIN İZLEME: %200 altında. 6 hafta sürerse BDDK bildirimi zorunludur.';
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
