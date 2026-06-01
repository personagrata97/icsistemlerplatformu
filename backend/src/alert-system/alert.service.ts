import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AlertService {
    constructor(private prisma: PrismaService) { }

    /**
     * Risk limitlerini kontrol et ve uyarı oluştur
     */
    async checkLimitsAndCreateAlerts(kpiCode: string, value: number, scenarioCode: string, riskLevel: string) {
        // İlgili limitleri al
        const limitler = await this.prisma.riskLimit.findMany({
            where: { kpi_kodu: kpiCode },
        });

        for (const limit of limitler) {
            const esikDeger = Number(limit.esik_deger);
            let limitAsimi = false;

            // Karşılaştırma kontrolü
            switch (limit.karsilastirma) {
                case 'GT':
                    limitAsimi = value > esikDeger;
                    break;
                case 'LT':
                    limitAsimi = value < esikDeger;
                    break;
                case 'EQ':
                    limitAsimi = Math.abs(value - esikDeger) < 0.0001;
                    break;
            }

            if (limitAsimi) {
                // Uyarı oluştur
                await this.prisma.uyari.create({
                    data: {
                        kpi_kodu: kpiCode,
                        senaryo_kodu: scenarioCode,
                        esik_deger: esikDeger,
                        gerceklesen_deger: value,
                        risk_seviyesi: limit.seviye,
                        durum: 'OPEN',
                        mesaj: `${kpiCode} limiti aşıldı: ${value.toFixed(4)} (Eşik: ${esikDeger})`,
                    },
                });
            }
        }
    }

    /**
     * Açık uyarıları listele
     */
    async getOpenAlerts() {
        const uyarilar = await this.prisma.uyari.findMany({
            where: { durum: 'OPEN' },
            include: {
                kpi: true,
                senaryo: true,
            },
            orderBy: {
                tarih: 'desc',
            },
        });

        return uyarilar;
    }

    /**
     * Uyarı kapat
     */
    async closeAlert(uyariId: string) {
        return this.prisma.uyari.update({
            where: { uyari_id: uyariId },
            data: { durum: 'CLOSED' },
        });
    }

    /**
     * Tüm uyarıları listele (filtreleme ile)
     */
    async getAllAlerts(filters?: { durum?: string; risk_seviyesi?: string }) {
        const where: any = {};

        if (filters?.durum) where.durum = filters.durum;
        if (filters?.risk_seviyesi) where.risk_seviyesi = filters.risk_seviyesi;

        return this.prisma.uyari.findMany({
            where,
            include: {
                kpi: true,
                senaryo: true,
            },
            orderBy: {
                tarih: 'desc',
            },
        });
    }
}
