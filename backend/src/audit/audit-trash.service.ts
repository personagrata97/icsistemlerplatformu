import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditTrashService {
    private readonly logger = new Logger(AuditTrashService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    async getDeletedAudits() {
        return this.prisma.audit.findMany({
            where: { isDeleted: true },
            orderBy: { deletedAt: 'desc' }
        });
    }

    async getDeletedFindings() {
        return this.prisma.finding.findMany({
            where: { isDeleted: true },
            orderBy: { deletedAt: 'desc' }
        });
    }

    async restoreAudit(id: string) {
        const audit = await this.prisma.audit.findUnique({ where: { id } });
        const result = await this.prisma.audit.update({
            where: { id },
            data: { isDeleted: false, deletedAt: null, deletedById: null, status: 'Devam Ediyor' }
        });

        await this.auditLogService.createLog({
            user: 'Sistem',
            action: 'Denetim Geri Yüklendi',
            details: `Denetim "${audit?.auditCode || audit?.title || id}" çöp kutusundan geri yüklendi.`,
            targetType: 'Audit',
            targetId: id
        });

        return result;
    }

    async restoreFinding(id: string) {
        const finding = await this.prisma.finding.findUnique({ where: { id } });
        const result = await this.prisma.finding.update({
            where: { id },
            data: { isDeleted: false, deletedAt: null, deletedById: null, status: 'Açık' }
        });

        await this.auditLogService.createLog({
            user: 'Sistem',
            action: 'Bulgu Geri Yüklendi',
            details: `Bulgu "${finding?.code || finding?.title || id}" çöp kutusundan geri yüklendi.`,
            targetType: 'Finding',
            targetId: id
        });

        return result;
    }

    async permanentDeleteAudit(id: string, user: any) {
        const audit = await this.prisma.audit.findUnique({ where: { id } });
        const userName = user?.displayName || user?.username || 'Sistem';

        // Kalıcı silme öncesi log kaydı oluştur (silindikten sonra referans kaybolur)
        await this.auditLogService.createLog({
            user: userName,
            action: 'Denetim Kalıcı Silindi',
            details: `Denetim "${audit?.auditCode || audit?.title || id}" ve tüm ilişkili verileri (bulgular, çalışma kağıtları, testler) kalıcı olarak silindi. GERİ ALINAMAZ.`,
            targetType: 'Audit',
            targetId: id,
            changeData: audit ? JSON.stringify({ auditCode: audit.auditCode, title: audit.title, department: audit.department, status: audit.status }) : null
        });

        // First delete derived data to prevent FK errors
        await this.prisma.finding.deleteMany({ where: { auditId: id } });
        await this.prisma.auditWorkpaper.deleteMany({ where: { auditId: id } });
        await this.prisma.auditTest.deleteMany({ where: { auditId: id } });

        return this.prisma.audit.delete({ where: { id } });
    }

    async permanentDeleteFinding(id: string, user: any) {
        const finding = await this.prisma.finding.findUnique({ where: { id } });
        const userName = user?.displayName || user?.username || 'Sistem';

        // Kalıcı silme öncesi log kaydı oluştur
        await this.auditLogService.createLog({
            user: userName,
            action: 'Bulgu Kalıcı Silindi',
            details: `Bulgu "${finding?.code || finding?.title || id}" ve tüm ilişkili verileri (takipler, uzatma talepleri, mutabakat kayıtları) kalıcı olarak silindi. GERİ ALINAMAZ.`,
            targetType: 'Finding',
            targetId: id,
            changeData: finding ? JSON.stringify({ code: finding.code, title: finding.title, risk: finding.risk, department: finding.department }) : null
        });

        await this.prisma.auditFollowUp.deleteMany({ where: { findingId: id } });
        await this.prisma.extensionRequest.deleteMany({ where: { findingId: id } });
        await this.prisma.auditConciliation.deleteMany({ where: { findingId: id } });
        await this.prisma.conciliationMessage.deleteMany({ where: { findingId: id } });

        return this.prisma.finding.delete({ where: { id } });
    }

    async emptyTrash(user: any) {
        const userName = user?.displayName || user?.username || user?.id || 'Sistem';

        // Silme öncesi sayıları al
        const deletedFindingsCount = await this.prisma.finding.count({ where: { isDeleted: true } });
        const deletedAuditsCount = await this.prisma.audit.count({ where: { isDeleted: true } });

        if (deletedFindingsCount > 0 || deletedAuditsCount > 0) {
            await this.auditLogService.createLog({
                user: userName,
                action: 'Çöp Kutusu Boşaltıldı',
                details: `Çöp kutusu boşaltıldı. Kalıcı olarak silinen: ${deletedAuditsCount} denetim, ${deletedFindingsCount} bulgu. GERİ ALINAMAZ.`,
                targetType: 'System',
                targetId: 'TRASH_EMPTY'
            });
        }

        await this.prisma.finding.deleteMany({ where: { isDeleted: true } });
        await this.prisma.audit.deleteMany({ where: { isDeleted: true } });
        return { success: true };
    }
}
