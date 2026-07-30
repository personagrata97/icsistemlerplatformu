import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

import { parsePaginationParams, buildPaginatedResponse, PaginationParams } from '../common/pagination.util';

@Injectable()
export class ConciliationService {
    private readonly logger = new Logger(ConciliationService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) {}

    // ─── İtiraz Listeleme ───────────────────────────────────────────────
    async getObjectionsByFinding(findingId: string, params?: PaginationParams) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(params);
        const where = { findingId };
        const [items, total] = await Promise.all([
            this.prisma.findingObjection.findMany({
                where,
                skip,
                take,
                include: {
                    itirazEden: { select: { id: true, displayName: true, title: true, department: true } },
                    kararVeren: { select: { id: true, displayName: true, title: true } },
                },
                orderBy: sortBy ? { [sortBy]: sortDir } : { itirazTarihi: 'desc' },
            }),
            this.prisma.findingObjection.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    // Tüm itirazları listele (uzlaşma dashboard)
    async getAllObjections(filters?: PaginationParams & { durum?: string; findingId?: string }) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(filters);
        const where: any = {};
        if (filters?.durum) where.durum = filters.durum;
        if (filters?.findingId) where.findingId = filters.findingId;

        const [items, total] = await Promise.all([
            this.prisma.findingObjection.findMany({
                where,
                skip,
                take,
                include: {
                    finding: {
                        select: { id: true, code: true, title: true, risk: true, status: true, auditId: true },
                    },
                    itirazEden: { select: { id: true, displayName: true, title: true, department: true } },
                    kararVeren: { select: { id: true, displayName: true, title: true } },
                },
                orderBy: sortBy ? { [sortBy]: sortDir } : { itirazTarihi: 'desc' },
            }),
            this.prisma.findingObjection.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    // ─── İtiraz Oluşturma ───────────────────────────────────────────────
    async createObjection(data: {
        findingId: string;
        itirazEdenId: string;
        itirazGerekce: string;
    }) {
        const finding = await this.prisma.finding.findUnique({ where: { id: data.findingId } });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        const objection = await this.prisma.findingObjection.create({
            data: {
                findingId: data.findingId,
                itirazEdenId: data.itirazEdenId,
                itirazGerekce: data.itirazGerekce,
                durum: 'BEKLEMEDE',
            },
            include: {
                itirazEden: { select: { id: true, displayName: true } },
            },
        });

        await this.auditLogService.createLog({
            user: data.itirazEdenId,
            action: 'Bulgu İtirazı Oluşturuldu',
            details: `Bulgu ${finding.code || finding.id} için itiraz kaydı oluşturuldu — İtiraz Eden: ${objection.itirazEden.displayName} — Gerekçe: "${data.itirazGerekce}"`,
            targetType: 'Finding',
            targetId: data.findingId,
        });

        return objection;
    }

    // ─── Müfettiş Görüşü Ekleme ────────────────────────────────────────
    async addAuditorOpinion(objectionId: string, mufettisGorusu: string, userId: string) {
        const objection = await this.prisma.findingObjection.findUnique({ where: { id: objectionId } });
        if (!objection) throw new NotFoundException('İtiraz kaydı bulunamadı');

        const updated = await this.prisma.findingObjection.update({
            where: { id: objectionId },
            data: { mufettisGorusu },
        });

        await this.auditLogService.createLog({
            user: userId,
            action: 'İtiraz Müfettiş Görüşü Eklendi',
            details: `İtiraz ${objectionId} için müfettiş görüşü eklendi: "${mufettisGorusu}"`,
            targetType: 'Finding',
            targetId: objection.findingId,
        });

        return updated;
    }

    // ─── İtiraz Kararı (Yalnızca Gözetim Sorumlusu) ─────────────────────
    async decideObjection(objectionId: string, data: {
        durum: 'KABUL_EDILDI' | 'REDDEDILDI';
        kararVerenId: string;
        kararGerekce: string;
    }) {
        const objection = await this.prisma.findingObjection.findUnique({
            where: { id: objectionId },
            include: { finding: true },
        });
        if (!objection) throw new NotFoundException('İtiraz kaydı bulunamadı');

        const updated = await this.prisma.findingObjection.update({
            where: { id: objectionId },
            data: {
                durum: data.durum,
                kararVerenId: data.kararVerenId,
                kararTarihi: new Date(),
                kararGerekce: data.kararGerekce,
            },
        });

        // İtiraz kabul edildiyse → bulguyu riskin kabulü ile güncelle
        if (data.durum === 'KABUL_EDILDI') {
            await this.prisma.finding.update({
                where: { id: objection.findingId },
                data: {
                    isRiskAccepted: true,
                    riskAcceptanceJustification: data.kararGerekce,
                    riskAcceptedBy: data.kararVerenId,
                    riskAcceptedAt: new Date(),
                    status: 'Risk Kabul Edildi',
                },
            });
        }

        await this.auditLogService.createLog({
            user: data.kararVerenId,
            action: data.durum === 'KABUL_EDILDI' ? 'İtiraz Kabul Edildi (Risk Kabulü)' : 'İtiraz Reddedildi',
            details: `İtiraz ${objectionId} — Bulgu ${objection.finding.code || objection.findingId}: ${data.durum === 'KABUL_EDILDI' ? 'KABUL EDİLDİ — Risk kabulü yapıldı' : 'REDDEDİLDİ'} — Gerekçe: "${data.kararGerekce}"`,
            targetType: 'Finding',
            targetId: objection.findingId,
            changeData: {
                itirazDurum: data.durum,
                kararGerekce: data.kararGerekce,
            },
        });

        return updated;
    }
}
