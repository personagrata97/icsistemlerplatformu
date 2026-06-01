import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../common/notification/notification.service';
import * as crypto from 'crypto';

@Injectable()
export class EthicsService {
    private readonly logger = new Logger(EthicsService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private notificationService: NotificationService
    ) { }

    // SLA days based on priority
    private readonly slaDays: Record<string, number> = {
        'Kritik': 7,
        'Yüksek': 15,
        'Orta': 30,
        'Düşük': 45
    };

    // --- FIELD-LEVEL ENCRYPTION KODLARI ---
    private readonly IV_LENGTH = 16;

    private getEncryptionKey(): string {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('GÜVENLİK İHLALİ: Üretim (production) ortamında ENCRYPTION_KEY çevre değişkeni tanımlanmalıdır!');
            }
            return 'icsistemler-platformu-secure-key-1234567890'; // local development fallback
        }
        return key;
    }

    private maskText(text: string | null | undefined): string | null {
        if (!text) return null;
        if (text.length <= 2) return text;
        const visibleLen = Math.max(1, Math.floor(text.length * 0.2)); // Show 20%
        return text.substring(0, visibleLen) + '*'.repeat(text.length - visibleLen);
    }

    private maskEmail(email: string | null | undefined): string | null {
        if (!email) return null;
        const parts = email.split('@');
        if (parts.length !== 2) return this.maskText(email);
        const name = parts[0];
        const domain = parts[1];
        return this.maskText(name) + '@' + domain;
    }

    private encrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        try {
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        } catch (e) {
            this.logger.error('Şifreleme hatası (Encryption Failed)', e);
            throw new Error('Veri güvenliği ihlali: Şifreleme başarısız.');
        }
    }

    private decrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        if (!text.includes(':')) return text; // Not encrypted (legacy plain-text data fallback)
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift()!, 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        } catch (e) {
            this.logger.error('Deşifre hatası (Decryption Failed)', e);
            return '*** ŞİFRELİ VERİ (DEŞİFRE EDİLEMEDİ) ***';
        }
    }

    private parseUserAgent(ua?: string): string {
        if (!ua) return 'Bilinmeyen Tarayıcı';
        const lUa = ua.toLowerCase();
        let browser = 'Diğer';
        let os = 'Bilinmeyen OS';
        
        if (lUa.includes('edg/')) browser = 'Edge';
        else if (lUa.includes('chrome/') || lUa.includes('criom/')) browser = 'Chrome';
        else if (lUa.includes('safari/') && !lUa.includes('chrome') && !lUa.includes('chromium')) browser = 'Safari';
        else if (lUa.includes('firefox/')) browser = 'Firefox';
        else if (lUa.includes('opera/') || lUa.includes('opr/')) browser = 'Opera';
        
        if (lUa.includes('windows')) os = 'Windows';
        else if (lUa.includes('android')) os = 'Android';
        else if (lUa.includes('iphone') || lUa.includes('ipad')) os = 'iOS';
        else if (lUa.includes('macintosh') || lUa.includes('mac os')) os = 'macOS';
        else if (lUa.includes('linux')) os = 'Linux';
        
        return `${browser} (${os})`;
    }

    async createReport(data: any, userId?: string, ipAddress?: string) {
        // ZAFİYET YAMASI (RACE CONDITION)
        // Eğer 2 kişi aynı anda, AYNI Mili-saniyede bildirim atarsa ve sistem kazara aaynı Takip Kodunu üretirse,
        // Prisma `P2002 Unique Constraint Failed` hatası verip çökerdi.
        // Bu yüzden kaydetme işlemini "Safe Retry Loop" (Güvenli Tekrar Döngüsü) içine alıyoruz (Max 3 deneme).
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            // Generate a cryptographically secure, non-guessable tracking code with unique check
            const trackingCode = await this.generateUniqueTrackingCode();

            // Calculate SLA deadline based on priority
            const slaDeadline = new Date();
            slaDeadline.setDate(slaDeadline.getDate() + (this.slaDays[data.priority] || 30));

            try {
                const report = await this.prisma.ethicsReport.create({
                    data: {
                        type: data.type,
                        anonymous: data.anonymous ?? true,
                        name: this.encrypt(data.name),
                        email: this.encrypt(data.email),
                        phone: this.encrypt(data.phone),
                        description: this.encrypt(data.description),
                        priority: data.priority || 'Orta',
                        status: 'Yeni',
                        source: data.source || 'Web Form',
                        trackingCode,
                        slaDeadline,
                        reporterId: (data.anonymous || !userId) ? null : userId,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });

                // IP Handling
                let finalIp = ipAddress;
                if (data.anonymous && ipAddress) {
                    try {
                        finalIp = crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);
                    } catch (e) {
                        this.logger.error('IP Hashing failed', e);
                        finalIp = 'unknown-ip-hash';
                    }
                }

                // Audit Log
                await this.prisma.auditLog.create({
                    data: {
                        action: 'ETHICS_SUBMITTED',
                        details: 'Etik bildirim sisteme kaydedildi.',
                        user: (data.anonymous || !userId) ? 'ANONYMOUS' : userId,
                        targetType: 'ETHICS',
                        targetId: report.id,
                        ipAddress: finalIp
                    }
                });

                // NOTIFICATIONS
                try {
                    await this.emailService.notifyEthicsCommittee(
                        `Kategori: ${data.type}\nÖncelik: ${data.priority}\n\n${data.description}`,
                        trackingCode
                    );

                    if (data.email) {
                        await this.emailService.sendReceiptConfirmation(data.email, trackingCode);
                    }
                } catch (notifyError) {
                    this.logger.error('Failed to send initial notifications', notifyError);
                }

                return report; // SUCCESSS! Exit the Retry Loop

            } catch (error: any) {
                // Eğer hata P2002 ise (Unique Constraint on trackingCode) ve hakkımız bitmediyse, tekrar dene!
                if (error.code === 'P2002' && attempt < maxRetries) {
                    this.logger.warn(`Tracking Code Collision (Race Condition) prevented on attempt ${attempt}. Retrying...`);
                    continue; // Döngünün başına dön ve yeni kod ile tekrar dene
                }

                // Başka bir hata ise veya hakkımız bittiyse dışarı fırlat
                this.logger.error('Failed to create ethics report', error.stack);
                this.logger.error('Payload:', JSON.stringify(data));
                throw error;
            }
        }

        throw new Error('Etik bildirim oluşturulamadı. Lütfen sistemi daha sonra tekrar deneyin.');
    }

    private async generateUniqueTrackingCode(): Promise<string> {
        // Base32 character set (removed ambiguous characters like I, 1, O, 0)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        // Try up to 5 times to generate a unique code (though collision probability is astronomically low)
        for (let i = 0; i < 5; i++) {
            const segment = (len: number) => {
                let result = '';
                const randomBytes = crypto.randomBytes(len);
                for (let j = 0; j < len; j++) {
                    // Simple modulo to pick char. For this charset length (32), 
                    // bias is negligible with byte (256 values). 256 % 32 == 0, so actually no bias for div 32.
                    result += chars.charAt(randomBytes[j] % chars.length);
                }
                return result;
            };

            // Generated format: XXXX-XXXX-XXXX-XXXX (16 chars, base32)
            // No predictable prefix like 'ETH' or date. Pure high-entropy randomness.
            const code = `${segment(4)}-${segment(4)}-${segment(4)}-${segment(4)}`;

            // Database Persistence Check (Critical for uniqueness guarantee)
            const exists = await this.prisma.ethicsReport.findUnique({
                where: { trackingCode: code },
                select: { id: true }
            });

            if (!exists) {
                return code;
            }
        }

        throw new Error('Benzersiz takip kodu üretilemedi. Lütfen tekrar deneyin.');
    }

    async getReports(filters: any) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.priority) where.priority = filters.priority;

        const reports = await this.prisma.ethicsReport.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                reporter: { select: { id: true, displayName: true } },
                assignee: { select: { id: true, displayName: true, title: true } }
            }
        });

        // Decrypt KVKK fields
        return reports.map(r => ({
            ...r,
            name: this.decrypt(r.name),
            email: this.decrypt(r.email),
            phone: this.decrypt(r.phone),
            description: this.decrypt(r.description)
        }));
    }

    async getReportStats() {
        const total = await this.prisma.ethicsReport.count();
        const open = await this.prisma.ethicsReport.count({ where: { status: 'Yeni' } });
        const investigating = await this.prisma.ethicsReport.count({ where: { status: 'İnceleniyor' } });
        const closed = await this.prisma.ethicsReport.count({ where: { status: 'Kapatıldı' } });

        // Category breakdown
        const byCategory = await this.prisma.ethicsReport.groupBy({
            by: ['type'],
            _count: { type: true }
        });

        // Outcome breakdown (Results of closed cases)
        const byOutcome = await this.prisma.ethicsReport.groupBy({
            by: ['investigationOutcome'],
            where: { status: 'Kapatıldı', investigationOutcome: { not: null } },
            _count: { investigationOutcome: true }
        });

        // Disciplinary Actions (Count cases with disciplinary action)
        const disciplinaryCount = await this.prisma.ethicsReport.count({
            where: { disciplinaryAction: true }
        });

        // Reports with linked Investigations/Audits (Converted to formal report)
        const convertedToReport = await this.prisma.ethicsReport.count({
            where: { OR: [{ linkedAudits: { some: {} } }, { linkedFindingId: { not: null } }] }
        });

        // Referrals (HR or Other departments)
        const referrals = await this.prisma.ethicsReport.count({
            where: {
                status: 'Kapatıldı',
                investigationOutcome: { in: ['İK\'ya Devredildi', 'İlgili Birime Aktarıldı'] }
            }
        });

        // Overdue reports (SLA exceeded)
        const now = new Date();
        const overdue = await this.prisma.ethicsReport.count({
            where: {
                status: { not: 'Kapatıldı' },
                slaDeadline: { lt: now }
            }
        });

        // Recent reports
        const recent = await this.prisma.ethicsReport.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: { assignee: true }
        });

        return {
            totalReports: total,
            openReports: open,
            investigating: investigating,
            closedReports: closed,
            overdueReports: overdue,

            // Detailed Metrics
            disciplinaryCount,
            convertedToReport,
            referrals,

            categoryBreakdown: byCategory.map(c => ({
                category: c.type,
                count: c._count.type
            })),

            outcomeBreakdown: byOutcome.map(o => ({
                outcome: o.investigationOutcome,
                count: o._count.investigationOutcome
            })),

            recentReports: recent.map(r => ({
                id: r.id,
                title: r.type,
                date: r.created_at.toLocaleDateString('tr-TR'),
                status: r.status,
                priority: r.priority,
                source: r.source || 'Web Form',
                slaDeadline: r.slaDeadline,
                assignee: r.assignee?.displayName || 'Atanmadı'
            }))
        };
    }

    async updateStatus(id: string, status: string, userId: string) {
        const validStatuses = ['Yeni', 'İnceleniyor', 'Beklemede', 'Kapatıldı'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Geçersiz durum değeri: ${status}`);
        }

        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        if (report.status === 'Kapatıldı') {
            throw new BadRequestException('Kapatılmış bildirimin durumu değiştirilemez.');
        }

        const updatedReport = await this.prisma.ethicsReport.update({
            where: { id },
            data: {
                status,
                updated_at: new Date()
            }
        });

        // Audit Log
        await this.prisma.auditLog.create({
            data: {
                action: 'STATUS_CHANGE',
                details: `Bildirim durumu güncellendi: ${status}`,
                user: userId,
                targetType: 'ETHICS',
                targetId: id
            }
        });

        return updatedReport;
    }

    async assignReport(id: string, assigneeId: string, conflictDeclared: boolean, userId: string) {
        // ISO 37002 Compliance:
        // Manager assigns the inspector. Conflict of Interest declaration is now the inspector's responsibility.
        // assigneeConflictDeclared starts as false — the inspector must self-declare via /declare-conflict endpoint.

        const report = await this.prisma.ethicsReport.update({
            where: { id },
            data: {
                assigneeId,
                assigneeConflictDeclared: false, // Inspector must self-declare
                status: 'İnceleniyor',
                assignedAt: new Date(),
                updated_at: new Date()
            },
            include: { assignee: true }
        });

        // Audit Log
        await this.prisma.auditLog.create({
            data: {
                action: 'ASSIGNMENT',
                details: `Bildirim müfettişe atandı: ${report.assignee?.displayName}. Çıkar çatışması beyanı bekleniyor.`,
                user: userId,
                targetType: 'ETHICS',
                targetId: id
            }
        });

        // K4: Atanan müfettişe in-app bildirim gönder
        try {
            await this.notificationService.create({
                userId: assigneeId,
                title: 'Etik Bildirim Ataması',
                description: `Size yeni bir etik bildirimi atandı. Lütfen çıkar çatışması beyanınızı vererek incelemeye başlayınız.`,
                type: 'warning',
                category: 'ETİK',
                link: `/audit/ethics?id=${id}`
            });
        } catch (notifyError) {
            this.logger.error('Failed to send ethics assignment notification (non-blocking):', notifyError);
        }

        return report;
    }

    /**
     * Inspector self-declares conflict of interest (ISO 37002 Compliance).
     * Only the assigned inspector can declare.
     */
    async declareConflict(id: string, userId: string) {
        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        if (report.assigneeId !== userId) {
            throw new ForbiddenException('Bu beyanı yalnızca atanan müfettiş verebilir.');
        }

        if (report.assigneeConflictDeclared) {
            throw new BadRequestException('Bu beyan zaten verilmiştir.');
        }

        const updatedReport = await this.prisma.ethicsReport.update({
            where: { id },
            data: {
                assigneeConflictDeclared: true,
                updated_at: new Date()
            },
            include: { assignee: true }
        });

        // Audit Log
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
        await this.prisma.auditLog.create({
            data: {
                action: 'ETHICS_CONFLICT_DECLARED',
                details: `Müfettiş ${user?.displayName || userId} çıkar çatışması bulunmadığını beyan etti.`,
                user: userId,
                targetType: 'ETHICS',
                targetId: id
            }
        });

        return updatedReport;
    }

    async closeReport(id: string, data: {
        investigationOutcome: string;
        closingSummary: string;
        disciplinaryAction: boolean;
        disciplinaryActionDetails?: string;
        linkedFindingId?: string;
        linkedAuditIds?: string[];
    }, userId: string) {
        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        if (report.status === 'Kapatıldı') {
            throw new BadRequestException('Bu bildirim zaten kapatılmıştır.');
        }

        // Authorization: Allow the assigned inspector OR any user with AUDIT_ADMIN role to close
        // The PermissionsGuard already ensures AUDIT_ADMIN bypass (God Mode).
        // Here we just need to check if a non-admin user is the assignee.
        if (report.assigneeId && report.assigneeId !== userId) {
            // This ForbiddenException will be caught for non-admin users.
            // AUDIT_ADMIN users bypass PermissionsGuard but this is a service-level check.
            // We pass the user's roles from the controller to allow admin override.
            // For now, we relax this — the PermissionsGuard already protects the endpoint.
            // Any user with AUDIT:EDIT permission can close if needed (managers, supervisors).
            this.logger.warn(`Close attempt by non-assignee user ${userId} on report ${id}. Allowing due to AUDIT:EDIT permission.`);
        }

        const updateData: any = {
            status: 'Kapatıldı',
            investigationOutcome: data.investigationOutcome,
            closingSummary: data.closingSummary,
            disciplinaryAction: data.disciplinaryAction,
            disciplinaryActionDetails: data.disciplinaryAction ? data.disciplinaryActionDetails : null,
            linkedFindingId: data.linkedFindingId || null,
            closedAt: new Date(),
            closedById: userId,
            updated_at: new Date()
        };

        // Handle M-N Relationship for audits
        if (data.linkedAuditIds && data.linkedAuditIds.length > 0) {
            updateData.linkedAudits = {
                connect: data.linkedAuditIds.map(auditId => ({ id: auditId }))
            };
        }

        const updatedReport = await this.prisma.ethicsReport.update({
            where: { id },
            data: updateData
        });

        // Audit Log
        await this.prisma.auditLog.create({
            data: {
                action: 'ETHICS_CLOSED',
                details: `Etik bildirim kapatıldı. Sonuç: ${data.investigationOutcome}, Disiplin: ${data.disciplinaryAction ? 'Evet' : 'Hayır'}`,
                user: userId,
                targetType: 'ETHICS',
                targetId: id
            }
        });

        // RECIPROCAL INTEGRATION: Update the linked finding to point back to this ethics report
        if (data.linkedFindingId) {
            await this.prisma.finding.update({
                where: { id: data.linkedFindingId },
                data: { linkedEthicsReportId: id }
            });
        }

        return updatedReport;
    }

    async addMessage(reportId: string, content: string, senderId?: string, isFromReporter = false) {
        const report = await this.prisma.ethicsReport.findUnique({
            where: { id: reportId }
        });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        if (report.status === 'Kapatıldı') {
            throw new BadRequestException('Kapatılmış bildirimlere yeni mesaj eklenemez.');
        }

        if (!isFromReporter) {
            // Admin/Staff message
            if (!report.assigneeId) {
                throw new BadRequestException('Bildirime henüz bir müfettiş atanmamıştır. Önce atama yapılmalıdır.');
            }
            if (report.assigneeId !== senderId) {
                // Check if the sender is an authorized manager or administrator
                const sender = senderId ? await this.prisma.user.findUnique({
                    where: { id: senderId },
                    include: { roles: { include: { role: true } } }
                }) : null;
                
                const roles = sender?.roles?.map((r: any) => r.role?.code || '') || [];
                const isAdminOrManager = roles.includes('ADMIN') || roles.includes('AUDIT_MANAGER') || roles.includes('SUPER_ADMIN');
                
                if (!isAdminOrManager) {
                    throw new ForbiddenException('Bu bildirime sadece atanan müfettiş veya Teftiş Kurulu yöneticileri mesaj gönderebilir.');
                }
            }
        }

        const message = await this.prisma.ethicsMessage.create({
            data: {
                reportId,
                content,
                senderId,
                isFromReporter,
                created_at: new Date()
            }
        });

        // Enrich Audit Log
        const reportForLog = await this.prisma.ethicsReport.findUnique({
            where: { id: reportId },
            select: { trackingCode: true }
        });

        let senderName = 'ANONYMOUS';
        if (senderId) {
            const user = await this.prisma.user.findUnique({ where: { id: senderId }, select: { displayName: true, username: true } });
            if (user) senderName = user.displayName || user.username;
        }

        const logDetail = isFromReporter
            ? `Bildirim sahibi mesaj gönderdi. (Takip Kodu: ${report?.trackingCode})`
            : `${senderName} tarafından mesaj gönderildi: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}" (Takip Kodu: ${report?.trackingCode})`;

        await this.prisma.auditLog.create({
            data: {
                action: 'MESSAGE_SENT',
                details: logDetail,
                user: senderId || 'SYSTEM_ANONYMOUS',
                targetType: 'ETHICS',
                targetId: reportId
            }
        });

        // Send email reply if message is from staff and reporter has email
        if (!isFromReporter && report) {
            try {
                const fullReport = await this.prisma.ethicsReport.findUnique({
                    where: { id: reportId },
                    select: { email: true, emailMessageId: true, trackingCode: true }
                });

                if (fullReport?.email) {
                    await this.emailService.sendReplyEmail(
                        fullReport.email,
                        'Bildiriminiz Hakkında Güncelleme',
                        content,
                        fullReport.emailMessageId || undefined,
                        fullReport.trackingCode
                    );
                }
            } catch (emailError) {
                this.logger.error('Mesaj e-posta bildirimi gönderilirken hata oluştu (İşlem devam ediyor):', emailError);
            }
        }

        const messageJson = JSON.parse(JSON.stringify(message));
        return {
            ...messageJson,
            createdAt: message.created_at || messageJson.created_at
        };
    }

    /**
     * Add a new investigation note (with history - doesn't overwrite)
     */
    async addInvestigationNote(reportId: string, content: string, userId: string) {
        const report = await this.prisma.ethicsReport.findUnique({
            where: { id: reportId }
        });

        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        const note = await this.prisma.ethicsInvestigationNote.create({
            data: {
                reportId,
                authorId: userId,
                content,
                created_at: new Date()
            },
            include: {
                author: { select: { displayName: true } }
            }
        });

        // Audit log
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
        await this.prisma.auditLog.create({
            data: {
                action: 'ETHICS_NOTE_ADDED',
                details: `İnceleme notu eklendi: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                user: user?.displayName || userId,
                targetType: 'ETHICS',
                targetId: reportId
            }
        });

        return note;
    }

    /**
     * Legacy: Update internal notes (single field - kept for backward compatibility)
     */
    async updateInternalNotes(id: string, notes: string, userId: string) {
        // Use addInvestigationNote instead
        return this.addInvestigationNote(id, notes, userId);
    }

    async getReportWithHistory(id: string, userId: string) {
        const report = await this.prisma.ethicsReport.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' },
                    include: { sender: { select: { displayName: true } } }
                },
                evidences: true,
                assignee: { select: { displayName: true, title: true } },
                investigationNotes: {
                    orderBy: { created_at: 'desc' },
                    include: { author: { select: { displayName: true } } }
                }
            }
        });

        if (!report) return null;

        // Audit Log for Viewing
        await this.prisma.auditLog.create({
            data: {
                action: 'ETHICS_VIEWED',
                details: `Etik bildirim incelendi. Takip Kodu: ${report.trackingCode}`,
                user: userId,
                targetType: 'ETHICS',
                targetId: id
            }
        });

        // Fetch related audit logs (History) - Specifically Ethics queries and status changes
        const logs = await this.prisma.auditLog.findMany({
            where: {
                targetId: id,
                targetType: 'ETHICS'
            },
            orderBy: { date: 'desc' }
        });

        // Decrypt DB object
        report.name = this.decrypt(report.name);
        report.email = this.decrypt(report.email);
        report.phone = this.decrypt(report.phone);
        report.description = this.decrypt(report.description);
 
        const reportJson = JSON.parse(JSON.stringify(report));
 
        const enrichedLogs = logs.map(l => {
            const logJson = JSON.parse(JSON.stringify(l));
            let details = logJson.details || '';
            if (details.includes('UA: ')) {
                const parts = details.split('UA: ');
                const ua = parts[1];
                details = `${parts[0]}Tarayıcı: ${this.parseUserAgent(ua)}`;
            }
            
            let user = logJson.user;
            if (!report.anonymous && (user === 'ANONYMOUS' || user === 'SYSTEM_ANONYMOUS')) {
                user = report.name || 'Bildirim Sahibi';
            } else if (user === 'ANONYMOUS' || user === 'SYSTEM_ANONYMOUS') {
                user = 'GİZLİ';
            }
 
            return {
                ...logJson,
                details,
                user
            };
        });
 
        return {
            ...reportJson,
            name: report.name,
            email: report.email,
            phone: report.phone,
            description: report.description,
            logs: enrichedLogs
        };
    }
 
    async queryReportByCode(trackingCode: string, ip?: string, userAgent?: string) {
        const report = await this.prisma.ethicsReport.findUnique({
            where: { trackingCode },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' },
                    include: { sender: { select: { displayName: true } } }
                },
                evidences: true,
                assignee: { select: { id: true, displayName: true } }
            }
        });
 
        if (!report) throw new NotFoundException('Bildirim bulunamadı');
 
        // Mapping for frontend compatibility with strict KVKK masking
        const reportJson = JSON.parse(JSON.stringify(report));
        const enrichedReport = {
            ...reportJson,
            name: this.maskText(this.decrypt(report.name)),
            email: this.maskEmail(this.decrypt(report.email)),
            phone: this.maskText(this.decrypt(report.phone)),
            description: this.decrypt(report.description),
            createdAt: reportJson.created_at,
            updatedAt: reportJson.updated_at,
            messages: report.messages.map((m: any) => {
                const mJson = JSON.parse(JSON.stringify(m));
                return {
                    ...mJson,
                    createdAt: mJson.created_at,
                    isAdmin: !!m.senderId
                };
            })
        };

        // PUBLIC ACCESS LOGGING with IP HASHING
        let hashedIp = 'Unknown';
        if (ip && ip !== 'Unknown') {
            try {
                hashedIp = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
            } catch (e) {
                this.logger.error('IP Hashing failed', e);
            }
        }

        try {
            await this.prisma.auditLog.create({
                data: {
                    action: 'ETHICS_QUERY',
                    details: `Takip kodu ile sorgulama yapıldı. IP Hash: ${hashedIp}, UA: ${userAgent}`,
                    user: 'ANONYMOUS',
                    targetType: 'ETHICS',
                    targetId: report.id
                }
            });
        } catch (error) {
            this.logger.error('Failed to log public query access', error);
        }

        return enrichedReport;
    }

    async addEvidence(reportId: string, file: any, uploaderIp?: string) {
        // IP Hashing for uploader if anonymous
        let hashedIp = 'Internal/Unknown';
        if (uploaderIp) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const crypto = require('crypto');
                hashedIp = crypto.createHash('sha256').update(uploaderIp).digest('hex').substring(0, 16);
            } catch (e) { /* ignore */ }
        }

        // 0. Handle Filename Encoding (Multer headers are latin1 by default)
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        // 1. Create Evidence Record
        const evidence = await this.prisma.ethicsEvidence.create({
            data: {
                reportId,
                fileName,
                fileUrl: file.path, // In a real scenario, this would be a relative path or cloud URL
                fileType: file.mimetype,
                fileSize: file.size,
                created_at: new Date()
            }
        });

        // 2. Log Action
        await this.prisma.auditLog.create({
            data: {
                action: 'EVIDENCE_UPLOADED',
                details: `Ek kanıt yüklendi: ${fileName} (${(file.size / 1024).toFixed(1)} KB). Uploader Hash: ${hashedIp}`,
                user: 'ANONYMOUS',
                targetType: 'ETHICS',
                targetId: reportId
            }
        });

        return evidence;
    }

    // ==========================================
    // EMAIL INTEGRATION METHODS
    // ==========================================

    /**
     * Handle incoming email event from IMAP service
     */
    @OnEvent('ethics.email.received')
    async handleEmailReceived(emailData: {
        messageId: string;
        from: string;
        fromName?: string;
        subject: string;
        textContent: string;
        htmlContent?: string;
        date: Date;
        attachments: Array<{ filename: string; contentType: string; size: number; content: Buffer }>;
    }) {
        this.logger.log(`Processing incoming email from ${emailData.from}: ${emailData.subject}`);

        try {
            const fs = require('fs');
            const path = require('path');

            // Save attachments and get paths
            const uploadDir = './private_uploads/ethics';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const savedAttachments = emailData.attachments?.map((att, idx) => {
                const uniqueFilename = `${Date.now()}_${idx}_${att.filename}`;
                const filePath = path.join(uploadDir, uniqueFilename);
                try {
                    fs.writeFileSync(filePath, att.content);
                } catch (writeErr) {
                    this.logger.error(`Failed to save email attachment ${att.filename}:`, writeErr);
                }
                return {
                    filename: att.filename,
                    path: filePath,
                    contentType: att.contentType,
                    size: att.size
                };
            }) || [];

            const report = await this.createReportFromEmail({
                from: emailData.from,
                fromName: emailData.fromName,
                subject: emailData.subject,
                textContent: emailData.textContent,
                htmlContent: emailData.htmlContent,
                messageId: emailData.messageId,
                attachments: savedAttachments
            });

            // Send confirmation email to reporter
            await this.emailService.sendReceiptConfirmation(emailData.from, report.trackingCode);

            // Notify ethics committee
            await this.emailService.notifyEthicsCommittee(
                emailData.textContent.substring(0, 300),
                report.trackingCode
            );

            this.logger.log(`Created ethics report ${report.trackingCode} from email`);
        } catch (error) {
            this.logger.error('Failed to process incoming email:', error);
        }
    }

    /**
     * Create ethics report from incoming email
     */
    async createReportFromEmail(emailData: {
        from: string;
        fromName?: string;
        subject: string;
        textContent: string;
        htmlContent?: string;
        messageId: string;
        attachments?: Array<{ filename: string; path: string; contentType: string; size: number }>;
    }, ipAddress?: string) {
        const trackingCode = await this.generateUniqueTrackingCode();
        const slaDeadline = new Date();
        slaDeadline.setDate(slaDeadline.getDate() + this.slaDays['Orta']); // Default to medium priority for emails

        try {
            const report = await this.prisma.ethicsReport.create({
                data: {
                    type: this.detectReportType(emailData.subject, emailData.textContent),
                    anonymous: false, // Email reports are not anonymous
                    name: this.encrypt(emailData.fromName || emailData.from.split('@')[0]),
                    email: this.encrypt(emailData.from),
                    description: this.encrypt(emailData.textContent),
                    priority: 'Orta',
                    status: 'Yeni',
                    source: 'E-posta',
                    trackingCode,
                    slaDeadline,
                    emailMessageId: emailData.messageId,
                    emailOriginalContent: emailData.htmlContent || emailData.textContent,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Log IP if available (hashed for privacy)
            if (ipAddress) {
                await this.logIpAddress(report.id, ipAddress);
            }

            // Create evidences from attachments
            if (emailData.attachments && emailData.attachments.length > 0) {
                for (const attachment of emailData.attachments) {
                    await this.prisma.ethicsEvidence.create({
                        data: {
                            reportId: report.id,
                            fileName: attachment.filename,
                            fileUrl: attachment.path,
                            fileType: attachment.contentType,
                            fileSize: attachment.size,
                            created_at: new Date()
                        }
                    });
                }
            }

            // Audit Log
            await this.prisma.auditLog.create({
                data: {
                    action: 'ETHICS_EMAIL_RECEIVED',
                    details: `E-posta ile etik bildirimi alındı: ${emailData.subject}`,
                    user: 'SYSTEM_EMAIL',
                    targetType: 'ETHICS',
                    targetId: report.id
                }
            });

            this.logger.log(`Created ethics report from email: ${trackingCode}`);
            return report;
        } catch (error) {
            this.logger.error('Failed to create ethics report from email', error);
            throw error;
        }
    }

    /**
     * Detect report type from email subject/content
     */
    private detectReportType(subject: string, content: string): string {
        const text = `${subject} ${content}`.toLowerCase();

        if (text.includes('rüşvet') || text.includes('yolsuzluk')) return 'Yolsuzluk';
        if (text.includes('taciz') || text.includes('mobbing')) return 'Taciz';
        if (text.includes('hırsızlık') || text.includes('zimmet')) return 'Hırsızlık/Zimmet';
        if (text.includes('çıkar çatışması')) return 'Çıkar Çatışması';
        if (text.includes('bilgi güvenliği') || text.includes('veri ihlali')) return 'Bilgi Güvenliği';
        if (text.includes('ayrımcılık')) return 'Ayrımcılık';

        return 'Genel Şikayet';
    }

    /**
     * Log IP address with hash (30-day retention)
     */
    private async logIpAddress(reportId: string, ipAddress: string): Promise<void> {
        try {
            const hashedIp = crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);

            await this.prisma.ethicsIpLog.create({
                data: {
                    reportId,
                    hashedIp,
                    createdAt: new Date()
                }
            });

            // Check for abuse pattern
            await this.checkAbusePattern(hashedIp);
        } catch (error) {
            this.logger.error('Failed to log IP address', error);
        }
    }

    /**
     * Check for abuse pattern: 5+ reports = warning, 10+ = critical
     */
    private async checkAbusePattern(hashedIp: string): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const count = await this.prisma.ethicsIpLog.count({
            where: {
                hashedIp,
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        if (count >= 10) {
            await this.prisma.auditLog.create({
                data: {
                    action: 'ETHICS_ABUSE_CRITICAL',
                    details: `KRİTİK: Aynı kaynaktan 30 gün içinde ${count} bildirim tespit edildi. Olası spam/abuse. IP Hash: ${hashedIp}`,
                    user: 'SYSTEM',
                    targetType: 'ETHICS_ABUSE'
                }
            });
            this.logger.warn(`CRITICAL: Abuse pattern detected - ${count} reports from same source`);
        } else if (count >= 5) {
            await this.prisma.auditLog.create({
                data: {
                    action: 'ETHICS_ABUSE_WARNING',
                    details: `UYARI: Aynı kaynaktan 30 gün içinde ${count} bildirim tespit edildi. İzlemeye alındı. IP Hash: ${hashedIp}`,
                    user: 'SYSTEM',
                    targetType: 'ETHICS_ABUSE'
                }
            });
            this.logger.warn(`WARNING: Potential abuse pattern - ${count} reports from same source`);
        }
    }

    /**
     * Cleanup old IP logs (30-day retention) - Called by Cron
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupOldIpLogs(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const result = await this.prisma.ethicsIpLog.deleteMany({
                where: {
                    createdAt: { lt: thirtyDaysAgo }
                }
            });

            if (result.count > 0) {
                this.logger.log(`Cleaned up ${result.count} IP log(s) older than 30 days`);

                // Log cleanup action (without IP hashes for privacy)
                await this.prisma.auditLog.create({
                    data: {
                        action: 'ETHICS_IP_CLEANUP',
                        details: `Gizlilik politikası gereği ${result.count} adet 30 günden eski IP kaydı silindi.`,
                        user: 'SYSTEM_CRON',
                        targetType: 'SYSTEM'
                    }
                });
            }
        } catch (error) {
            this.logger.error('Failed to cleanup old IP logs', error);
        }
    }

    /**
     * Check SLA Deadlines and Warn Assignees
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkSlaWarnings() {
        const warningThreshold = new Date();
        warningThreshold.setDate(warningThreshold.getDate() + 3); // 3 days from now

        const reports = await this.prisma.ethicsReport.findMany({
            where: {
                status: { not: 'Kapatıldı' },
                slaDeadline: { lte: warningThreshold }
            },
            include: { assignee: true }
        });

        for (const report of reports) {
            const daysLeft = Math.ceil((report.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            // Log Warning
            this.logger.warn(`SLA Warning for Report ${report.trackingCode}: ${daysLeft} days left`);

            // Send Email to Assignee
            if (report.assignee?.email) {
                await this.emailService.sendReplyEmail(
                    report.assignee.email,
                    `[SLA UYARISI] Etik Bildirim Süresi Doluyor - ${report.trackingCode}`,
                    `Sayın Müfettiş,\n\n"${report.trackingCode}" takipli etik bildiriminin çözüm süresinin dolmasına ${daysLeft} gün kalmıştır.\nLütfen incelemeyi önceliklendiriniz.\n\nSisteme Git: ${process.env.FRONTEND_URL}/audit/ethics`,
                    undefined,
                    report.trackingCode
                );
            }
        }
    }
}

