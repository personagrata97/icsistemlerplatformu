import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class EscalationService {
    private readonly logger = new Logger(EscalationService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private auditLogService: AuditLogService
    ) { }

    // Her sabah saat 08:00'de çalışır
    @Cron('0 8 * * *')
    async checkOverdueActionPlans() {
        this.logger.log('Eylem planı eskalasyon kontrolü başlatıldı.');
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            // Vadesi geçmiş (Açık durumda, deadline < today) eylem planlarını bul
            const overdueActions = await this.prisma.auditFollowUp.findMany({
                where: {
                    status: 'Açık',
                    deadline: {
                        lt: todayStr
                    }
                },
                include: {
                    finding: {
                        include: {
                            audit: true
                        }
                    }
                }
            });

            let escalatedCount = 0;

            for (const action of overdueActions) {
                const currentLevel = action.escalationLevel || 0;
                let newEscalationLevel = currentLevel;

                const deadlineDate = new Date(action.deadline);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - deadlineDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Kademeli eskalasyon mantığı
                // Seviye 1: Vadesi 1+ gün geçmiş → Birim yöneticisine bildirim
                // Seviye 2: Vadesi 7+ gün geçmiş → Üst yönetime (Teftiş Kurulu Müdürlüğü) bildirim
                // Seviye 3: Vadesi 30+ gün geçmiş → Yönetim Kurulu / Denetim Komitesi bildirim
                if (diffDays >= 30 && currentLevel < 3) {
                    newEscalationLevel = 3;
                } else if (diffDays >= 7 && currentLevel < 2) {
                    newEscalationLevel = 2;
                } else if (diffDays >= 1 && currentLevel < 1) {
                    newEscalationLevel = 1;
                }

                if (newEscalationLevel > currentLevel) {
                    // Veritabanı güncelle
                    await this.prisma.auditFollowUp.update({
                        where: { id: action.id },
                        data: {
                            escalationLevel: newEscalationLevel,
                            lastEscalatedAt: new Date()
                        }
                    });

                    // Denetim izine kaydet
                    const bulguKodu = action.finding?.code || `BLG-${action.findingId}`;
                    const bulguBaslik = action.finding?.title || 'Bilinmeyen Bulgu';
                    const seviyeAciklama = newEscalationLevel === 1
                        ? 'Birim yöneticisi bilgilendirildi'
                        : newEscalationLevel === 2
                            ? 'Üst yönetim bilgilendirildi'
                            : 'Yönetim Kurulu / Denetim Komitesi bilgilendirildi';

                    await this.auditLogService.createLog({ 
                        user: 'SYSTEM_CRON',
                        action: 'ESKALASYON',
                        details: JSON.stringify({
                            eylemPlanId: action.id,
                            bulguKodu,
                            gecenGun: diffDays,
                            eskiSeviye: currentLevel,
                            yeniSeviye: newEscalationLevel,
                            aciklama: `${bulguKodu} kodlu bulgunun eylem planı termin süresi ${diffDays} gün aşıldı. Eskalasyon seviyesi ${newEscalationLevel} olarak güncellendi. ${seviyeAciklama}.`
                        }),
                        targetType: 'AuditFollowUp',
                        targetId: action.id
                    });

                    // Email bildirimi gönder
                    await this.sendEscalationEmail(
                        newEscalationLevel,
                        bulguKodu,
                        bulguBaslik,
                        action.deadline,
                        diffDays,
                        action.finding?.audit?.department
                    );

                    escalatedCount++;
                    this.logger.warn(
                        `Eskalasyon tetiklendi: ${bulguKodu} — Seviye ${currentLevel} → ${newEscalationLevel} (${diffDays} gün gecikme)`
                    );
                }
            }

            if (escalatedCount > 0) {
                this.logger.warn(`Eskalasyon kontrolü tamamlandı. ${escalatedCount} adet eylem planı eskalasyon seviyesi yükseltildi.`);
            } else {
                this.logger.log('Eskalasyon kontrolü tamamlandı. Yeni eskalasyon bulunmadı.');
            }
        } catch (error) {
            this.logger.error('Eskalasyon kontrolü sırasında hata oluştu:', error);
        }
    }

    /**
     * Eskalasyon seviyesine göre ilgili alıcıya email gönderir.
     * Seviye 1: Birim yöneticisi (veya atanan kullanıcı)
     * Seviye 2: Üst yönetim (Teftiş Kurulu Müdürlüğü)
     */
    private async sendEscalationEmail(
        level: number,
        bulguKodu: string,
        bulguBaslik: string,
        deadline: string,
        diffDays: number,
        department?: string
    ) {
        try {
            // Alıcı belirleme
            const fallbackEmail = process.env.ESCALATION_EMAIL || 'teftiskurulumudurlugu@emlakkatilimtfs.com.tr';
            const boardEmail = process.env.BOARD_EMAIL || 'denetimkomitesi@emlakkatilimtfs.com.tr';
            let toEmail = fallbackEmail;

            if (level === 1 && department) {
                // Seviye 1: Birim yöneticisini bulmaya çalış
                const departmentManager = await this.prisma.user.findFirst({
                    where: {
                        department: department,
                        isActive: true,
                        roles: {
                            some: {
                                role: {
                                    code: { in: ['DEPARTMENT_MANAGER', 'UNIT_MANAGER', 'AUDIT_UNIT'] }
                                }
                            }
                        }
                    }
                });
                if (departmentManager?.email) {
                    toEmail = departmentManager.email;
                }
            } else if (level === 3) {
                // Seviye 3: Yönetim Kurulu / Denetim Komitesi
                toEmail = boardEmail;
            }
            // Seviye 2 her zaman üst yönetime gider (fallback email)

            const seviyeEtiketi = level === 1 ? 'BİRİM BİLDİRİMİ' : level === 2 ? 'ÜST YÖNETİM ESKALASYONU' : 'YÖNETİM KURULU ESKALASYONU';
            const konu = `[ESKALASYON - ${seviyeEtiketi}] ${bulguKodu} — Eylem planı ${diffDays} gün gecikmiş`;

            const icerik = `Eylem Planı Eskalasyon Bildirimi

Aşağıdaki bulguya ait eylem planının termin süresi aşılmıştır:

Bulgu Kodu: ${bulguKodu}
Bulgu Başlığı: ${bulguBaslik}
Termin Tarihi: ${deadline}
Gecikme Süresi: ${diffDays} gün
Eskalasyon Seviyesi: ${level} (${level === 1 ? 'Birim Bildirimi' : level === 2 ? 'Üst Yönetim Bildirimi' : 'Yönetim Kurulu Bildirimi'})
${department ? `İlgili Birim: ${department}` : ''}

Lütfen ilgili eylem planının en kısa sürede tamamlanması için gerekli önlemleri alınız.

Bu mesaj sistem tarafından otomatik olarak oluşturulmuştur.`;

            await this.emailService.sendGeneralEmail(toEmail, konu, icerik);
            this.logger.log(`Eskalasyon e-postası gönderildi: ${toEmail} (Seviye ${level})`);
        } catch (error) {
            this.logger.error('Eskalasyon e-postası gönderilirken hata:', error);
        }
    }
}
