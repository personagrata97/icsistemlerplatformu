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
                const yeniUyari = await this.prisma.uyari.create({
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

                // Eğer limit aşımı kritik veya yüksek seviyedeyse, otomatik teftiş bulgusu oluştur
                if (limit.seviye === 'KRITIK' || limit.seviye === 'YUKSEK' || limit.seviye === 'RED') {
                    try {
                        // 1. Sistem Denetimi Kaydını bul veya oluştur
                        let audit = await this.prisma.audit.findFirst({
                            where: { title: 'Risk Yönetimi ve Uyum Kontrolleri', isDeleted: false }
                        });

                        if (!audit) {
                            audit = await this.prisma.audit.create({
                                data: {
                                    title: 'Risk Yönetimi ve Uyum Kontrolleri',
                                    type: 'Risk ve Uyum',
                                    status: 'Devam Ediyor',
                                    startDate: new Date().toISOString().split('T')[0],
                                    auditCode: 'RISK-UYUM'
                                }
                            });
                        }

                        // 2. Mükerrer açık bulgu kontrolü
                        const titlePattern = `${kpiCode} Risk Limiti İhlali`;
                        const existingFinding = await this.prisma.finding.findFirst({
                            where: {
                                auditId: audit.id,
                                title: titlePattern,
                                status: { in: ['Taslak', 'Onay Bekliyor', 'Onaylandı', 'Tebliğ Edildi', 'Açık', 'Süresi Geçti'] },
                                isDeleted: false
                            }
                        });

                        if (!existingFinding) {
                            // 3. Bulgu Kodu Üret
                            const currentYear = new Date().getFullYear();
                            const sequenceCount = await this.prisma.finding.count({
                                where: { code: { startsWith: `RSK-${currentYear}-` } }
                            });
                            const sequence = (sequenceCount + 1).toString().padStart(3, '0');
                            const findingCode = `RSK-${currentYear}-${sequence}`;

                            // 4. Bulgu Oluştur
                            const riskLevelLabel = limit.seviye === 'KRITIK' || limit.seviye === 'RED' ? 'Kritik' : 'Yüksek';
                            
                            const finding = await this.prisma.finding.create({
                                data: {
                                    auditId: audit.id,
                                    code: findingCode,
                                    title: titlePattern,
                                    risk: riskLevelLabel,
                                    category: 'Risk Yönetimi Limit Aşımı',
                                    status: 'Açık',
                                    description: `Akıllı risk motoru tarafından ${scenarioCode} senaryosunda ${kpiCode} göstergesi için limit aşımı tespit edilmiştir. \nGerçekleşen Değer: ${value.toFixed(4)} \nKabul Edilebilir Limit Eşiği: ${esikDeger}.`,
                                    department: 'Risk Yönetimi ve Uyum',
                                    criteria: 'BDDK Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik ve Kurum İçi Risk İştahı Politikası.',
                                    rootCause: 'Likidite dengesizliği veya portföy yoğunlaşma sınırlarının aşılması.',
                                    recommendation: 'Risk Komitesi acil olarak toplanmalı ve ilgili limit aşımına dair aksiyon planı devreye alınmalıdır.',
                                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonrası
                                }
                            });

                            // 5. AuditLog kaydı oluştur
                            await this.prisma.auditLog.create({
                                data: {
                                    user: 'Risk Motoru (Sistem)',
                                    action: 'Bulgu Oluşturuldu',
                                    details: `Risk limiti aşımı nedeniyle otomatik teftiş bulgusu oluşturuldu. Kod: ${findingCode}`,
                                    targetType: 'Finding',
                                    targetId: finding.id
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Otomatik bulgu oluşturma hatası:', err);
                    }
                }
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
