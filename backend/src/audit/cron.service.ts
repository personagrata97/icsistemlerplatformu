import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';
import { RiskEngineService } from '../risk-engine/risk-engine.service';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly riskEngineService: RiskEngineService
    ) { }

    @Cron('0 9 * * *') // Her gün sabah 09:00'da çalışır
    async handleCron() {
        this.logger.log('Follow-up CronJob başliyor: Vadesi yaklaşan ve geciken bulgular kontrol ediliyor...');

        try {
            await this.checkApproachingDeadlines();
            await this.checkOverdueDeadlines();
            await this.checkQualityAssessments();
            await this.checkQualityActions();
        } catch (error) {
            this.logger.error('CronJob Sirasinda Hata:', error);
        }
    }

    private async checkApproachingDeadlines() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Vadesine 1 veya 3 gün kalanları bul (Takip Ediliyor statüsündeki bulgular)
        const targetDays = [1, 3];

        for (const daysLeft of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysLeft);
            const targetDateString = targetDate.toISOString().split('T')[0];

            const findings = await this.prisma.finding.findMany({
                where: {
                    status: 'Takip Ediliyor',
                    dueDate: {
                        gte: new Date(`${targetDateString}T00:00:00.000Z`),
                        lte: new Date(`${targetDateString}T23:59:59.999Z`)
                    },
                    isDeleted: false
                },
                include: {
                    audit: true
                }
            });

            for (const finding of findings) {
                // Determine recipient email
                let toEmail = null;
                if (finding.assignedUserId) {
                    const user = await this.prisma.user.findUnique({ where: { id: finding.assignedUserId } });
                    // Provide a default Emlak Katilim email structure if User model lacks email field but has username/displayName
                    toEmail = user?.email || null;
                }

                if (!toEmail && finding.audit?.supervisor) {
                    toEmail = 'teftiskurulumudurlugu@emlakkatilimtfs.com.tr'; // Fallback
                }

                if (toEmail) {
                    await this.emailService.sendAuditReminderEmail(
                        toEmail,
                        finding.code || `BLG-${finding.id}`,
                        finding.title,
                        finding.dueDate ? finding.dueDate.toISOString().split('T')[0] : targetDateString,
                        'approaching',
                        daysLeft
                    );
                } else {
                    this.logger.warn(`Bulgu ${finding.code} için mail atilamadi, atanan kullanici e-postasi eksik.`);
                }
            }
        }
    }

    private async checkOverdueDeadlines() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];

        // --- 10. KUSURSUZLUK İŞ MANTIĞI: Zaman-Aşımı (Overdue) Otomasyon Zafiyeti ---
        // Sadece mail atmasın, sistemdeki bulgu durumunu "Süresi Geçti" olarak da işaretlesin.
        this.logger.log('Süresi geçen bulguların veritabanı durumları güncelleniyor (Overdue Status Update)...');
        const lateFindings = await this.prisma.finding.findMany({
            where: {
                status: 'Takip Ediliyor',
                isDeleted: false
            }
        });

        for (const f of lateFindings) {
            const isPastDue = f.dueDate && new Date(f.dueDate) < today;
            if (isPastDue) {
                await this.prisma.finding.update({
                    where: { id: f.id },
                    data: { status: 'Süresi Geçti' }
                });

                await this.prisma.auditLog.create({
                    data: {
                        action: 'Süresi Geçti',
                        details: `${f.code} kodlu bulgunun aksiyon vadesi (${f.dueDate ? f.dueDate.toISOString().split('T')[0] : ''}) dolduğu için durumu "Süresi Geçti" olarak sistem tarafından kilitlendi.`,
                        targetType: 'Finding',
                        targetId: f.id,
                        user: 'SYSTEM_CRON'
                    }
                });
                this.logger.log(`[CRON] Bulgu kilitlendi (Süresi Geçti): ${f.code}`);
            }
        }
        // ----------------------------------------------------------------------------

        // Vadesi 1, 3 veya 7 gün gecikmiş olanları bul
        const targetDays = [1, 3, 7];

        for (const daysOverdue of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - daysOverdue);
            const targetDateString = targetDate.toISOString().split('T')[0];

            const findings = await this.prisma.finding.findMany({
                where: {
                    status: {
                        in: ['Takip Ediliyor', 'Doğrulama Bekliyor', 'Süresi Geçti']
                    },
                    dueDate: {
                        gte: new Date(`${targetDateString}T00:00:00.000Z`),
                        lte: new Date(`${targetDateString}T23:59:59.999Z`)
                    },
                    isDeleted: false
                },
                include: {
                    audit: true
                }
            });

            for (const finding of findings) {
                // Determine recipient email
                let toEmail = null;
                if (finding.assignedUserId) {
                    const user = await this.prisma.user.findUnique({ where: { id: finding.assignedUserId } });
                    toEmail = user?.email || null;
                }

                if (!toEmail) {
                    toEmail = 'teftiskurulumudurlugu@emlakkatilimtfs.com.tr'; // Fallback
                }

                if (toEmail) {
                    await this.emailService.sendAuditReminderEmail(
                        toEmail,
                        finding.code || `BLG-${finding.id}`,
                        finding.title,
                        finding.dueDate ? finding.dueDate.toISOString().split('T')[0] : targetDateString,
                        'overdue',
                        daysOverdue
                    );
                }
            }
        }
    }

    // ============================================
    // HAFTALIK RİSK TARAMASI (Risk Motoru → Denetim Planı Entegrasyonu)
    // Her Pazartesi sabah 08:00'da çalışır
    // ============================================
    @Cron('0 8 * * 1')
    async handleWeeklyRiskScan() {
        this.logger.log('Haftalık Risk Taraması başlıyor: Tasarruf Finansmanı KPI değerleri kontrol ediliyor...');

        try {
            const allKpis = await this.riskEngineService.calculateAllKpis();

            // RED (Kritik) seviyesindeki KPI'ları filtrele
            const criticalKpis = allKpis.filter(kpi => kpi.risk_seviyesi === 'RED');

            if (criticalKpis.length === 0) {
                this.logger.log('Haftalık risk taraması tamamlandı: Kritik seviyede KPI tespit edilmedi.');
                return;
            }

            this.logger.warn(`DİKKAT: ${criticalKpis.length} adet KPI kritik seviyede!`);

            // Her kritik KPI için AuditLog'a erken uyarı kaydı oluştur
            for (const kpi of criticalKpis) {
                const kpiAciklama = this.getKpiLabel(kpi.kpi_kodu);

                await this.prisma.auditLog.create({
                    data: {
                        action: 'RISK_ERKEN_UYARI',
                        details: JSON.stringify({
                            kpiKodu: kpi.kpi_kodu,
                            aciklama: kpiAciklama,
                            deger: kpi.deger,
                            seviye: kpi.risk_seviyesi,
                            tarih: new Date().toISOString(),
                            mesaj: `${kpiAciklama} göstergesi kritik seviyeye ulaştı (Değer: ${kpi.deger}). Denetim planlamasında önceliklendirme yapılması önerilir.`
                        }),
                        targetType: 'RiskKPI',
                        targetId: kpi.kpi_kodu,
                        user: 'SYSTEM'
                    }
                });
            }

            // Teftiş Kurulu'na toplu bilgilendirme maili gönder
            const kpiOzet = criticalKpis.map(kpi =>
                `• ${this.getKpiLabel(kpi.kpi_kodu)}: Değer ${kpi.deger} (Kritik Seviye)`
            ).join('\n');

            const mailIcerigi = `Haftalık Otomatik Risk Taraması Sonucu\n\nAşağıdaki risk göstergeleri kritik seviyeye ulaşmıştır:\n\n${kpiOzet}\n\nBu göstergelere ilişkin denetlenebilir birimlerin denetim periyodunun sıklaştırılması veya acil denetim planlanması önerilmektedir.\n\nBu mesaj sistem tarafından otomatik oluşturulmuştur.`;

            await this.emailService.sendGeneralEmail(
                'teftiskurulumudurlugu@emlakkatilimtfs.com.tr',
                `[Erken Uyarı] ${criticalKpis.length} Adet Kritik Risk Göstergesi Tespit Edildi`,
                mailIcerigi
            );

            this.logger.log(`Haftalık risk taraması tamamlandı. ${criticalKpis.length} kritik KPI için erken uyarı oluşturuldu ve mail gönderildi.`);

        } catch (error) {
            this.logger.error('Haftalık risk taraması sırasında hata:', error);
        }
    }

    // KPI kodlarını Türkçe etiketlere çevir
    private getKpiLabel(kpiKodu: string): string {
        const etiketler: Record<string, string> = {
            'NPL': 'Takipteki Alacaklar Oranı (NPL)',
            'LCR': 'Likidite Karşılama Oranı',
            'TESLIMAT_BASKI': 'Teslimat Baskısı',
            'KONSANTRASYON_BOLGE': 'Bölgesel Yoğunlaşma',
            'KONSANTRASYON_VADE': 'Vade Yoğunlaşması',
            'DPD_DAGILIM': 'Gecikme Gün Dağılımı (DPD)',
            'TESLIMAT_YUKUMLULUGU': 'Teslimat Yükümlülüğü',
            'IPTAL_ORANI': 'Sözleşme İptal Oranı',
        };
        return etiketler[kpiKodu] || kpiKodu;
    }

    private async checkQualityAssessments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDays = [30, 15, 7];

        for (const daysLeft of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysLeft);
            const targetDateNext = new Date(targetDate);
            targetDateNext.setDate(targetDate.getDate() + 1);

            const assessments = await this.prisma.qualityAssessment.findMany({
                where: {
                    nextDueDate: {
                        gte: targetDate,
                        lt: targetDateNext
                    }
                }
            });

            for (const assessment of assessments) {
                await this.emailService.sendQualityReminderEmail(
                    'teftiskurulumudurlugu@emlakkatilimtfs.com.tr',
                    assessment.type,
                    assessment.nextDueDate?.toLocaleDateString('tr-TR') || 'Belirtilmedi',
                    daysLeft
                );
                this.logger.log(`[KALİTE CRON] Değerlendirme hatırlatması gönderildi: ${assessment.type} (${daysLeft} gün kala)`);
            }
        }
    }

    private async checkQualityActions() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDays = [5, 2, 1];

        for (const daysLeft of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysLeft);
            const targetDateNext = new Date(targetDate);
            targetDateNext.setDate(targetDate.getDate() + 1);

            const actions = await this.prisma.qualityAction.findMany({
                where: {
                    status: 'Açık',
                    dueDate: {
                        gte: targetDate,
                        lt: targetDateNext
                    }
                }
            });

            for (const action of actions) {
                await this.emailService.sendGeneralEmail(
                    'teftiskurulumudurlugu@emlakkatilimtfs.com.tr',
                    `[KALİTE AKSİYON] Vade Hatırlatması: ${action.title}`,
                    `İç Denetim Kalite Güvence Programı kapsamında tanımlanan "${action.title}" aksiyonunun vadesine ${daysLeft} gün kalmıştır.\n\nVade: ${action.dueDate.toLocaleDateString('tr-TR')}`
                );
                this.logger.log(`[KALİTE CRON] Aksiyon hatırlatması gönderildi: ${action.title} (${daysLeft} gün kala)`);
            }
        }
    }
}
