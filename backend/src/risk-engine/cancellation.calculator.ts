import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

@Injectable()
export class CancellationCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        const bugun = new Date();
        const ayBasi = new Date(bugun.getFullYear(), bugun.getMonth(), 1);

        // 1. O Ay İptal Edilen Sözleşme Sayısı
        const iptalEdilenSözleşmeler = await this.prisma.sozlesme.findMany({
            where: {
                OR: [
                    { durum: 'IPTAL' },
                    { iptal_durumu: true }
                ],
                iptal_tarihi: {
                    gte: ayBasi,
                }
            }
        });

        // 2. Ay Başı Aktif Sözleşme Sayısı (Şu anki aktifler + bu ay içinde iptal edilenler)
        const suAnkiAktifler = await this.prisma.sozlesme.count({
            where: { durum: 'AKTIF' }
        });
        
        const ayBasiAktifSayisi = suAnkiAktifler + iptalEdilenSözleşmeler.length;

        if (ayBasiAktifSayisi === 0) {
            return {
                kpi_kodu: 'IPTAL_ORANI',
                deger: 0,
                risk_seviyesi: 'GREEN',
                detay: { aciklama: 'Bu ay aktif sözleşme yok' }
            };
        }

        let aylikIptalOrani = iptalEdilenSözleşmeler.length / ayBasiAktifSayisi;

        // Senaryo etkisi: iptal_artis (stres testi)
        if (params && params.iptal_artis > 0) {
            aylikIptalOrani = aylikIptalOrani * (1 + params.iptal_artis);
        }

        const iptalOraniYuzde = aylikIptalOrani * 100;

        // 3. İade Yükü Simülasyonu (Mevzuat: 14 Gün Kuralı)
        let acilIadeYuku14Gun = 0; // Org. ücreti dahil, hemen ödenmeli
        let normalIadeYuku6Ay = 0;  // Sadece tasarruf birikimi, 6 ay içinde

        iptalEdilenSözleşmeler.forEach((s) => {
            const baslangicTarihi = new Date(s.baslangic_tarihi).getTime();
            const iptalTarihi = s.iptal_tarihi ? new Date(s.iptal_tarihi).getTime() : bugun.getTime();
            
            // Gün farkı hesaplama
            const gunFarki = (iptalTarihi - baslangicTarihi) / (1000 * 3600 * 24);
            
            // Kabaca tahsil edilmiş tutar (örnek mantık: vadeye orantılı)
            const odenenTutar = Number(s.toplam_tutar) * 0.10; // %10'u ödenmiş varsayalım MVP için
            const orgUcreti = Number(s.toplam_tutar) * 0.08; // %8 org ücreti varsayımı
            
            if (gunFarki <= 14) {
                // Cayma Hakkı (14 Gün): Tüm ödemeler kesintisiz iade
                acilIadeYuku14Gun += (odenenTutar + orgUcreti);
            } else {
                // Fesih (>14 Gün): Org. ücreti yanar, sadece tasarruf iade (azami 6 ay)
                normalIadeYuku6Ay += odenenTutar;
            }
        });

        // Risk Seviyeleri (Sektör standardı aylık > %3 iptal risktir)
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (iptalOraniYuzde > 5.0) {
            riskSeviyesi = 'RED';
        } else if (iptalOraniYuzde > 3.0) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'IPTAL_ORANI',
            deger: iptalOraniYuzde, // Yüzde
            risk_seviyesi: riskSeviyesi,
            detay: {
                ay_basi_aktif_sozlesme: ayBasiAktifSayisi,
                aylik_iptal_sayisi: iptalEdilenSözleşmeler.length,
                acil_iade_yuku_14gun: acilIadeYuku14Gun,
                normal_iade_yuku_6ay: normalIadeYuku6Ay,
                toplam_iade_yuku: acilIadeYuku14Gun + normalIadeYuku6Ay,
                senaryo_etkisi: params?.iptal_artis || 0
            }
        };
    }
}
