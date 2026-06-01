import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly mailerService: MailerService) { }

    /**
     * Send a reply email to the ethics report submitter
     * @param to Recipient email address
     * @param subject Email subject
     * @param content Email body content
     * @param inReplyTo Original Message-ID for threading
     * @param trackingCode Ethics report tracking code for reference
     */
    async sendReplyEmail(
        to: string,
        subject: string,
        content: string,
        inReplyTo?: string,
        trackingCode?: string
    ): Promise<boolean> {
        try {
            const headers: Record<string, string> = {};
            if (inReplyTo) {
                headers['In-Reply-To'] = inReplyTo;
                headers['References'] = inReplyTo;
            }

            await this.mailerService.sendMail({
                to,
                subject: trackingCode
                    ? `Re: [ETİK-${trackingCode}] ${subject}`
                    : `Re: ${subject}`,
                text: this.generatePlainTextEmail(content, trackingCode),
                html: this.generateHtmlEmail(content, trackingCode),
                headers,
            });

            this.logger.log(`Reply email sent to ${to} for tracking code ${trackingCode || 'N/A'}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send reply email to ${to}:`, error);
            return false;
        }
    }

    /**
     * Send notification email when a new ethics report is received
     * @param to Recipient email (submitter)
     * @param trackingCode Tracking code for the report
     */
    async sendReceiptConfirmation(to: string, trackingCode: string): Promise<boolean> {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `[ETİK-${trackingCode}] Bildiriminiz Alındı`,
                html: this.generateReceiptHtml(trackingCode),
                text: this.generateReceiptText(trackingCode),
            });

            this.logger.log(`Receipt confirmation sent to ${to} for ${trackingCode}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send receipt confirmation:`, error);
            return false;
        }
    }

    /**
     * Send notification to ethics committee when new report arrives
     * @param reportSummary Brief summary of the report
     * @param trackingCode Tracking code
     */
    async notifyEthicsCommittee(reportSummary: string, trackingCode: string): Promise<boolean> {
        // Committee emails configured via ETHICS_COMMITTEE_EMAILS env variable (comma-separated)
        const committeeEmails = process.env.ETHICS_COMMITTEE_EMAILS?.split(',') || [];

        if (committeeEmails.length === 0) {
            this.logger.warn('No ethics committee emails configured');
            return false;
        }

        try {
            await this.mailerService.sendMail({
                to: committeeEmails,
                subject: `[YENİ ETİK BİLDİRİMİ] ${trackingCode}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px;">
                        <h2 style="color: #1e3a5f;">Yeni Etik Bildirimi</h2>
                        <p><strong>Takip Kodu:</strong> ${trackingCode}</p>
                        <p><strong>Özet:</strong></p>
                        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 15px; color: #374151;">
                            ${reportSummary.substring(0, 200)}${reportSummary.length > 200 ? '...' : ''}
                        </blockquote>
                        <p style="margin-top: 20px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3010'}/audit/ethics" 
                               style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Sisteme Git
                            </a>
                        </p>
                    </div>
                `,
            });

            this.logger.log(`Ethics committee notified for ${trackingCode}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to notify ethics committee:', error);
        }
    }

    /**
     * Send a general system email (used by Auditron AI Assistant)
     */
    async sendGeneralEmail(to: string, subject: string, content: string): Promise<boolean> {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                text: content,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #374151;">
                        <div style="background: #1e3a5f; padding: 15px; border-radius: 8px 8px 0 0;">
                            <h2 style="color: white; margin: 0;">Auditron AI Bildirimi</h2>
                        </div>
                        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                            <div style="white-space: pre-wrap; line-height: 1.6;">
                                ${content}
                            </div>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="color: #6b7280; font-size: 11px;">
                                Bu mesaj Auditron AI akıllı asistanı tarafından otomatik olarak oluşturulmuş ve gönderilmiştir.
                            </p>
                        </div>
                    </div>
                `,
            });
            this.logger.log(`General email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send general email to ${to}:`, error);
            return false;
        }
    }

    /**
     * Send audit finding reminder/overdue email
     */
    async sendAuditReminderEmail(to: string, findingCode: string, findingTitle: string, dueDate: string, daysType: 'approaching' | 'overdue', daysCount: number): Promise<boolean> {
        try {
            const isOverdue = daysType === 'overdue';
            const subjectPrefix = isOverdue ? 'GECİKMİŞ BULGU' : 'YAKLAŞAN VADE';
            const subject = `[${subjectPrefix}] ${findingCode} nolu bulgunuz için aksiyon hatırlatması`;

            const contentColor = isOverdue ? '#dc2626' : '#ea580c'; // Red for overdue, Orange for approaching
            const statusText = isOverdue
                ? `aksiyon vadesi üzerinden <strong>${daysCount} gün geçmiştir.</strong>`
                : `aksiyon vadesine <strong>${daysCount} gün kalmıştır.</strong>`;

            const content = `Değerli Çalışma Arkadaşımız,

Sorumluluğunuzda bulunan aşağıda detayı verilen denetim bulgusunun ${statusText}

Lütfen ilgili bulguya ait aksiyonlarınızı en kısa sürede İç Sistemler Platformu üzerinden güncelleyiniz. 

Bulgu Kodu: ${findingCode}
Bulgu Başlığı: ${findingTitle}
Öngörülen Kapatma Tarihi: ${dueDate}
`;

            await this.mailerService.sendMail({
                to,
                subject,
                text: this.generatePlainTextEmail(content),
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; max-width: 600px;">
                        <div style="background: linear-gradient(135deg, ${contentColor} 0%, #991b1b 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: white; margin: 0;">Emlak Katılım Teftiş Kurulu</h2>
                            <p style="color: #fed7aa; margin: 5px 0 0 0; font-size: 12px;">Sistem Otomatik Hatırlatması</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                            <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${content}</div>
                            <p style="margin-top: 25px;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3010'}/audit/findings"
                                   style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                                    Sisteme Git ve Aksiyon Planını Güncelle
                                </a>
                            </p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="color: #6b7280; font-size: 11px; margin: 0; line-height: 1.4;">
                                Bu e-posta, Emlak Katılım Tasarruf Finansman A.Ş. İç Sistemler Platformu tarafından otomatik olarak oluşturulmuştur.<br>
                                © ${new Date().getFullYear()} Emlak Katılım Tasarruf Finansman AŞ • Teftiş Kurulu
                            </p>
                        </div>
                    </div>
                `,
            });
            this.logger.log(`Audit reminder email sent to ${to} for finding ${findingCode}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send audit reminder email to ${to}:`, error);
            return false;
        }
    }

    /**
     * Send Quality Assessment (EQA/IQA) reminder email
     */
    async sendQualityReminderEmail(to: string, type: string, dueDate: string, daysLeft: number): Promise<boolean> {
        try {
            const subject = `[KALİTE GÜVENCE] ${type} Değerlendirme Hatırlatması (${daysLeft} Gün)`;
            const content = `Sayın Yetkili,

İç Denetim Kalite Güvence ve İyileştirme Programı kapsamında planlanan ${type} değerlendirmesinin vadesi yaklaşmaktadır.

Değerlendirme Türü: ${type}
Planlanan Vade: ${dueDate}
Kalan Süre: ${daysLeft} Gün

Lütfen gerekli hazırlık çalışmalarını ve dökümantasyon hazırlıklarını başlatınız.
`;

            await this.mailerService.sendMail({
                to,
                subject,
                text: this.generatePlainTextEmail(content),
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; max-width: 600px;">
                        <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: white; margin: 0;">Kalite Güvence Sistemi</h2>
                            <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 12px;">Otomatik Vade Hatırlatması</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                            <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${content}</div>
                            <p style="margin-top: 25px;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3010'}/audit/quality"
                                   style="background: #065f46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                                    Kalite Modülüne Git
                                </a>
                            </p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="color: #6b7280; font-size: 11px; margin: 0; line-height: 1.4;">
                                © ${new Date().getFullYear()} Emlak Katılım Tasarruf Finansman AŞ • Teftiş Kurulu<br>
                                Kalite Güvence ve İyileştirme Programı (KGİP)
                            </p>
                        </div>
                    </div>
                `,
            });
            this.logger.log(`Quality reminder email sent to ${to} for ${type}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send quality reminder email to ${to}:`, error);
            return false;
        }
    }

    private generateHtmlEmail(content: string, trackingCode?: string): string {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; max-width: 600px;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: white; margin: 0;">Emlak Katılım Etik Hattı</h2>
                    ${trackingCode ? `<p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 12px;">Takip Kodu: ${trackingCode}</p>` : ''}
                </div>
                <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                    <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">
                        ${content}
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Bu mesaj, Emlak Katılım Tasarruf Finansman A.Ş. Etik Bildirim Hattı sistemi tarafından gönderilmiştir.
                        ${trackingCode ? `<br>Bildirimi takip etmek için takip kodunuzu kullanabilirsiniz: <strong>${trackingCode}</strong>` : ''}
                    </p>
                </div>
            </div>
        `;
    }

    private generatePlainTextEmail(content: string, trackingCode?: string): string {
        return `
EMLAK KATILIM ETİK HATTI
${trackingCode ? `Takip Kodu: ${trackingCode}` : ''}
${'─'.repeat(40)}

${content}

${'─'.repeat(40)}
Bu mesaj, Emlak Katılım Tasarruf Finansman A.Ş. Etik Bildirim Hattı sistemi tarafından gönderilmiştir.
${trackingCode ? `Bildirimi takip etmek için takip kodunuzu kullanabilirsiniz: ${trackingCode}` : ''}
        `.trim();
    }

    private generateReceiptHtml(trackingCode: string): string {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; max-width: 600px;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: white; margin: 0;">✓ Bildiriminiz Alındı</h2>
                </div>
                <div style="background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; border-top: none; border-radius: 0 0 10px 10px;">
                    <p style="color: #166534; font-size: 16px;">
                        Etik bildirimi sisteme başarıyla kaydedilmiştir.
                    </p>
                    <div style="background: white; border: 2px dashed #86efac; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">TAKİP KODUNUZ</p>
                        <p style="color: #059669; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">
                            ${trackingCode}
                        </p>
                    </div>
                    <p style="color: #374151; font-size: 14px;">
                        Bu kodu saklayınız. Bildirimin durumunu 
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3010'}/audit/ethics/submit" style="color: #059669;">
                            buradan
                        </a> 
                        takip edebilirsiniz.
                    </p>
                    <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Emlak Katılım Tasarruf Finansman A.Ş.<br>
                        Etik Bildirim Hattı
                    </p>
                </div>
            </div>
        `;
    }

    private generateReceiptText(trackingCode: string): string {
        return `
BİLDİRİMİNİZ ALINDI
${'─'.repeat(40)}

Etik bildirimi sisteme başarıyla kaydedilmiştir.

TAKİP KODUNUZ: ${trackingCode}

Bu kodu saklayınız. Bildirimin durumunu takip etmek için 
${process.env.FRONTEND_URL || 'http://localhost:3010'}/ethics/query 
adresini ziyaret edebilirsiniz.

${'─'.repeat(40)}
Emlak Katılım Tasarruf Finansman A.Ş.
Etik Bildirim Hattı
        `.trim();
    }
}
