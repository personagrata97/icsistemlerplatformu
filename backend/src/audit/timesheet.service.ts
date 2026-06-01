import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class TimesheetService {
    private readonly logger = new Logger(TimesheetService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    async getTimesheets(userId: string, weekStart?: string) {
        let dateFilter: any = {};

        if (weekStart) {
            const start = new Date(weekStart);
            const end = new Date(weekStart);
            end.setDate(start.getDate() + 7);

            dateFilter = {
                gte: start.toISOString().split('T')[0],
                lt: end.toISOString().split('T')[0]
            };
        } else {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter = {
                gte: thirtyDaysAgo.toISOString().split('T')[0]
            };
        }

        return this.prisma.auditTimesheet.findMany({
            where: {
                userId: userId,
                date: dateFilter
            },
            include: {
                audit: {
                    select: { title: true, auditCode: true }
                },
                user: {
                    select: { id: true, displayName: true }
                }
            },
            orderBy: { date: 'desc' }
        });
    }

    async logTime(userId: string, data: any, userObj?: any) {
        const result = await this.prisma.auditTimesheet.create({
            data: {
                userId: userId,
                auditId: (data.auditId && data.auditId !== "") ? data.auditId : null,
                date: data.date || new Date().toISOString().split('T')[0],
                hours: data.hours ? parseFloat(data.hours) : 0,
                activityType: data.activityType,
                description: data.description,
                status: 'Taslak'
            }
        });

        const userName = userObj ? (userObj.displayName || userObj.username) : userId;
        await this.auditLogService.createLog({ 
            user: userName,
            action: 'Efor Kaydı Eklendi',
            details: `${data.hours} saat efor (${data.activityType}) eklendi.`,
            targetType: 'Timesheet',
            targetId: result.id,
            auditId: result.auditId
        });
        return result;
    }

    async updateTimeEntry(id: string, userId: string, data: any, userObj?: any) {
        const entry = await this.prisma.auditTimesheet.findFirst({
            where: { id, userId }
        });

        if (!entry) throw new Error('Efor kaydı bulunamadı veya yetkiniz yok.');

        // Onaylanmış giriş düzenlenemez
        if (entry.status === 'Onaylandı') {
            throw new Error('Onaylanmış efor kaydı düzenlenemez. Yöneticinizle iletişime geçin.');
        }

        const updated = await this.prisma.auditTimesheet.update({
            where: { id },
            data: {
                auditId: (data.auditId && data.auditId !== "") ? data.auditId : null,
                date: data.date,
                hours: data.hours ? parseFloat(data.hours) : 0,
                activityType: data.activityType,
                description: data.description,
                status: 'Taslak' // Düzenleme yapılırsa taslağa döner
            }
        });

        const userName = userObj ? (userObj.displayName || userObj.username) : userId;
        await this.auditLogService.createLog({ 
            user: userName,
            action: 'Efor Kaydı Güncellendi',
            details: `Efor kaydı (ID: ${id}) düzenlendi.`,
            targetType: 'Timesheet',
            targetId: id,
            auditId: updated.auditId
        });
        return updated;
    }

    async deleteTimeEntry(id: string, userId: string, userObj?: any) {
        const entry = await this.prisma.auditTimesheet.findFirst({
            where: { id, userId }
        });
        if (!entry) throw new Error('Efor kaydı bulunamadı.');

        // Onaylanmış giriş silinemez
        if (entry.status === 'Onaylandı') {
            throw new Error('Onaylanmış efor kaydı silinemez.');
        }

        const result = await this.prisma.auditTimesheet.deleteMany({
            where: {
                id: id,
                userId: userId
            }
        });

        const userName = userObj ? (userObj.displayName || userObj.username) : userId;
        await this.auditLogService.createLog({ 
            user: userName,
            action: 'Efor Kaydı Silindi',
            details: `Efor kaydı (ID: ${id}) silindi.`,
            targetType: 'Timesheet',
            targetId: id,
            auditId: entry.auditId
        });
        return result;
    }

    // ============================================
    // YÖNETİCİ ONAY WORKFLOW'U
    // ============================================

    /**
     * Denetçi: Haftalık girişleri onaya gönderir.
     * Statü: Taslak → Onay Bekliyor
     */
    async submitForApproval(userId: string, weekStart: string, userObj?: any) {
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        end.setDate(start.getDate() + 7);

        const result = await this.prisma.auditTimesheet.updateMany({
            where: {
                userId,
                date: {
                    gte: start.toISOString().split('T')[0],
                    lt: end.toISOString().split('T')[0]
                },
                status: 'Taslak'
            },
            data: {
                status: 'Onay Bekliyor'
            }
        });

        this.logger.log(`${userId} kullanıcısının ${weekStart} haftası girişleri onaya gönderildi (${result.count} kayıt)`);

        const userName = userObj ? (userObj.displayName || userObj.username) : userId;
        if (result.count > 0) {
            await this.auditLogService.createLog({ 
                user: userName,
                action: 'Efor Onaya Gönderildi',
                details: `${weekStart} haftasına ait ${result.count} efor kaydı onaya gönderildi.`,
                targetType: 'Timesheet',
                targetId: userId // Toplu işlem olduğu için user ID'yi hedef yapıyoruz
            });
        }
        return { submittedCount: result.count };
    }

    /**
     * Yönetici: Seçilen girişleri toplu onaylar.
     * Statü: Onay Bekliyor → Onaylandı
     */
    async approveTimesheets(entryIds: string[], approverId: string, userObj?: any) {
        const result = await this.prisma.auditTimesheet.updateMany({
            where: {
                id: { in: entryIds },
                status: 'Onay Bekliyor'
            },
            data: {
                status: 'Onaylandı',
                approvedById: approverId,
                approvedAt: new Date()
            }
        });

        this.logger.log(`${approverId} yöneticisi ${result.count} efor kaydını onayladı`);

        const approverName = userObj ? (userObj.displayName || userObj.username) : approverId;
        if (result.count > 0) {
            await this.auditLogService.createLog({ 
                user: approverName,
                action: 'Efor Onaylandı',
                details: `${result.count} adet efor kaydı onaylandı.`,
                targetType: 'Timesheet',
                targetId: approverId // Toplu işlem
            });
        }
        return { approvedCount: result.count };
    }

    /**
     * Yönetici: Girişi ret eder ve denetçiye geri gönderir.
     * Statü: Onay Bekliyor → Taslak (revizyon notu ile)
     */
    async rejectTimesheet(entryId: string, approverId: string, reason: string, userObj?: any) {
        const entry = await this.prisma.auditTimesheet.findUnique({ where: { id: entryId } });
        if (!entry) throw new Error('Efor kaydı bulunamadı.');

        const updated = await this.prisma.auditTimesheet.update({
            where: { id: entryId },
            data: {
                status: 'Taslak',
                description: `${entry.description || ''}\n[Ret Notu — ${new Date().toLocaleDateString('tr-TR')}]: ${reason}`
            }
        });

        const approverName = userObj ? (userObj.displayName || userObj.username) : approverId;
        await this.auditLogService.createLog({ 
            user: approverName,
            action: 'Efor Reddedildi',
            details: `Efor kaydı (ID: ${entryId}) reddedildi. Red sebebi: ${reason}`,
            targetType: 'Timesheet',
            targetId: entryId
        });
        return updated;
    }

    /**
     * Yönetici: Onay bekleyen tüm girişleri görüntüler.
     */
    async getPendingApprovals() {
        return this.prisma.auditTimesheet.findMany({
            where: {
                status: 'Onay Bekliyor'
            },
            include: {
                user: { select: { id: true, displayName: true, department: true } },
                audit: { select: { title: true, auditCode: true } }
            },
            orderBy: { date: 'desc' }
        });
    }

    async getStats(userId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const entries = await this.prisma.auditTimesheet.findMany({
            where: {
                userId,
                date: {
                    gte: thirtyDaysAgo.toISOString().split('T')[0]
                }
            }
        });

        const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
        const billable = entries.filter(e => e.activityType !== 'İdari / İzin' && e.activityType !== 'Eğitim').reduce((sum, e) => sum + Number(e.hours), 0);
        const approved = entries.filter(e => e.status === 'Onaylandı').length;
        const pending = entries.filter(e => e.status === 'Onay Bekliyor').length;
        const draft = entries.filter(e => e.status === 'Taslak' || !e.status).length;

        return {
            totalHours,
            billableHours: billable,
            utilizationRate: totalHours ? Math.round((billable / totalHours) * 100) : 0,
            approvedCount: approved,
            pendingCount: pending,
            draftCount: draft
        };
    }

    /**
     * Get specific timesheets for an audit.
     */
    async getAuditTimesheets(auditId: string) {
        return this.prisma.auditTimesheet.findMany({
            where: { auditId },
            include: {
                user: { select: { id: true, displayName: true } }
            },
            orderBy: { date: 'desc' }
        });
    }

    /**
     * IIA Std 2030: Denetim bazlı efor özeti.
     * Belirli bir denetim için toplam saat, kişi bazlı ve aktivite bazlı dağılımı döndürür.
     */
    async getAuditTimesheetSummary(auditId: string) {
        const entries = await this.prisma.auditTimesheet.findMany({
            where: { auditId },
            include: {
                user: { select: { id: true, displayName: true } }
            },
            orderBy: { date: 'desc' }
        });

        const totalHours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);

        // Kişi bazlı dağılım
        const byPerson: Record<string, { name: string; hours: number }> = {};
        entries.forEach(e => {
            const name = e.user?.displayName || 'Bilinmeyen';
            if (!byPerson[e.userId]) byPerson[e.userId] = { name, hours: 0 };
            byPerson[e.userId].hours += Number(e.hours || 0);
        });

        // Aktivite bazlı dağılım
        const byActivity: Record<string, number> = {};
        entries.forEach(e => {
            const act = e.activityType || 'Diğer';
            byActivity[act] = (byActivity[act] || 0) + Number(e.hours || 0);
        });

        return {
            totalHours,
            entryCount: entries.length,
            byPerson: Object.values(byPerson),
            byActivity: Object.entries(byActivity).map(([activity, hours]) => ({ activity, hours }))
        };
    }
}
