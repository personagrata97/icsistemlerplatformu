import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

import { parsePaginationParams, buildPaginatedResponse, PaginationParams } from '../common/pagination.util';

@Injectable()
export class FollowUpService {
    private readonly logger = new Logger(FollowUpService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) {}

    // ─── Aksiyon Listeleme ───────────────────────────────────────────────
    async getActionsByFinding(findingId: string, params?: PaginationParams) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(params);
        const where = { findingId };
        const [items, total] = await Promise.all([
            this.prisma.findingAction.findMany({
                where,
                skip,
                take,
                include: {
                    sorumlu: { select: { id: true, displayName: true, title: true, department: true } },
                    olusturan: { select: { id: true, displayName: true } },
                    evidences: {
                        include: {
                            yukleyen: { select: { id: true, displayName: true } },
                            onaylayan: { select: { id: true, displayName: true } },
                        },
                        orderBy: { yuklemeTarihi: 'desc' },
                    },
                },
                orderBy: sortBy ? { [sortBy]: sortDir } : { created_at: 'desc' },
            }),
            this.prisma.findingAction.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    // Tüm aksiyonları listele (follow-up dashboard için)
    async getAllActions(filters?: PaginationParams & { durum?: string; sorumluId?: string; findingId?: string }) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(filters);
        const where: any = {};
        if (filters?.durum) where.durum = filters.durum;
        if (filters?.sorumluId) where.sorumluId = filters.sorumluId;
        if (filters?.findingId) where.findingId = filters.findingId;

        const [items, total] = await Promise.all([
            this.prisma.findingAction.findMany({
                where,
                skip,
                take,
                include: {
                    finding: {
                        select: { id: true, code: true, title: true, risk: true, status: true, auditId: true },
                    },
                    sorumlu: { select: { id: true, displayName: true, title: true, department: true } },
                    olusturan: { select: { id: true, displayName: true } },
                    evidences: {
                        select: { id: true, onayDurumu: true, dosyaAdi: true },
                    },
                },
                orderBy: sortBy ? { [sortBy]: sortDir } : { terminTarihi: 'asc' },
            }),
            this.prisma.findingAction.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    // ─── Aksiyon Oluşturma ──────────────────────────────────────────────
    async createAction(data: {
        findingId: string;
        aksiyonTanimi: string;
        sorumluId: string;
        terminTarihi: string;
        olusturanId: string;
        notlar?: string;
    }) {
        const finding = await this.prisma.finding.findUnique({ where: { id: data.findingId } });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        const action = await this.prisma.findingAction.create({
            data: {
                findingId: data.findingId,
                aksiyonTanimi: data.aksiyonTanimi,
                sorumluId: data.sorumluId,
                terminTarihi: new Date(data.terminTarihi),
                olusturanId: data.olusturanId,
                notlar: data.notlar,
                durum: 'ACIK',
            },
            include: {
                sorumlu: { select: { id: true, displayName: true } },
            },
        });

        // Denetim izi
        await this.auditLogService.createLog({
            user: data.olusturanId,
            action: 'Aksiyon Planı Oluşturuldu',
            details: `Bulgu ${finding.code || finding.id} için aksiyon planı tanımlandı: "${data.aksiyonTanimi}" — Sorumlu: ${action.sorumlu.displayName} — Termin: ${data.terminTarihi}`,
            targetType: 'Finding',
            targetId: data.findingId,
        });

        return action;
    }

    // ─── Aksiyon Durum Güncelleme ───────────────────────────────────────
    async updateActionStatus(actionId: string, durum: string, userId: string) {
        const action = await this.prisma.findingAction.findUnique({ where: { id: actionId } });
        if (!action) throw new NotFoundException('Aksiyon bulunamadı');

        const updateData: any = { durum };
        if (durum === 'TAMAMLANDI' || durum === 'KAPATILDI') {
            updateData.tamamlanmaTarihi = new Date();
        }

        const updated = await this.prisma.findingAction.update({
            where: { id: actionId },
            data: updateData,
        });

        await this.auditLogService.createLog({
            user: userId,
            action: 'Aksiyon Durumu Güncellendi',
            details: `Aksiyon ${actionId} durumu "${action.durum}" → "${durum}" olarak güncellendi`,
            targetType: 'Finding',
            targetId: action.findingId,
            changeData: { oldStatus: action.durum, newStatus: durum },
        });

        return updated;
    }

    // ─── Kanıt Yükleme ─────────────────────────────────────────────────
    async uploadEvidence(data: {
        aksiyonId: string;
        dosyaAdi: string;
        dosyaYolu?: string;
        aciklama?: string;
        yukleyenId: string;
    }) {
        const action = await this.prisma.findingAction.findUnique({ where: { id: data.aksiyonId } });
        if (!action) throw new NotFoundException('Aksiyon bulunamadı');

        const evidence = await this.prisma.actionEvidence.create({
            data: {
                aksiyonId: data.aksiyonId,
                dosyaAdi: data.dosyaAdi,
                dosyaYolu: data.dosyaYolu,
                aciklama: data.aciklama,
                yukleyenId: data.yukleyenId,
                onayDurumu: 'BEKLEMEDE',
            },
        });

        // Aksiyonu kanıt bekleniyor durumuna çek
        await this.prisma.findingAction.update({
            where: { id: data.aksiyonId },
            data: { durum: 'KANIT_BEKLENIYOR' },
        });

        await this.auditLogService.createLog({
            user: data.yukleyenId,
            action: 'Aksiyon Kanıtı Yüklendi',
            details: `Aksiyon ${data.aksiyonId} için kanıt yüklendi: "${data.dosyaAdi}"`,
            targetType: 'Finding',
            targetId: action.findingId,
        });

        return evidence;
    }

    // ─── Kanıt Onaylama (Yalnızca Gözetim Sorumlusu) ────────────────────
    async approveEvidence(evidenceId: string, onaylayanId: string, onayDurumu: 'ONAYLANDI' | 'REDDEDILDI', redGerekce?: string) {
        const evidence = await this.prisma.actionEvidence.findUnique({
            where: { id: evidenceId },
            include: { aksiyon: true },
        });
        if (!evidence) throw new NotFoundException('Kanıt kaydı bulunamadı');

        const updated = await this.prisma.actionEvidence.update({
            where: { id: evidenceId },
            data: {
                onayDurumu,
                onaylayanId,
                onayTarihi: new Date(),
                redGerekce: onayDurumu === 'REDDEDILDI' ? redGerekce : null,
            },
        });

        // Onaylandıysa ve aksiyondaki tüm kanıtlar onaylıysa → aksiyonu tamamla
        if (onayDurumu === 'ONAYLANDI') {
            const allEvidences = await this.prisma.actionEvidence.findMany({
                where: { aksiyonId: evidence.aksiyonId },
            });
            const allApproved = allEvidences.every(e => e.onayDurumu === 'ONAYLANDI');

            if (allApproved) {
                await this.prisma.findingAction.update({
                    where: { id: evidence.aksiyonId },
                    data: { durum: 'TAMAMLANDI', tamamlanmaTarihi: new Date() },
                });

                // Aksiyonun bağlı olduğu bulgudaki tüm aksiyonlar tamamlandı mı kontrol et
                await this.checkAndCloseFinding(evidence.aksiyon.findingId, onaylayanId);
            }
        } else {
            // Reddedildiyse aksiyonu tekrar açık yap
            await this.prisma.findingAction.update({
                where: { id: evidence.aksiyonId },
                data: { durum: 'ACIK' },
            });
        }

        await this.auditLogService.createLog({
            user: onaylayanId,
            action: onayDurumu === 'ONAYLANDI' ? 'Kanıt Onaylandı' : 'Kanıt Reddedildi',
            details: `Kanıt ${evidenceId} (${evidence.dosyaAdi}) ${onayDurumu === 'ONAYLANDI' ? 'onaylandı' : 'reddedildi'}${redGerekce ? ` — Gerekçe: ${redGerekce}` : ''}`,
            targetType: 'Finding',
            targetId: evidence.aksiyon.findingId,
        });

        return updated;
    }

    // ─── Bulgu Kapatma Kontrolü ─────────────────────────────────────────
    private async checkAndCloseFinding(findingId: string, userId: string) {
        const actions = await this.prisma.findingAction.findMany({
            where: { findingId },
        });

        const allCompleted = actions.length > 0 && actions.every(a => a.durum === 'TAMAMLANDI' || a.durum === 'KAPATILDI');

        if (allCompleted) {
            await this.prisma.finding.update({
                where: { id: findingId },
                data: {
                    status: 'Kapalı',
                    verifiedAt: new Date(),
                    verifiedBy: userId,
                },
            });

            await this.auditLogService.createLog({
                user: userId,
                action: 'Bulgu Kapatıldı (İzleme Tamamlandı)',
                details: `Bulgu ${findingId} — tüm aksiyonlar tamamlandı ve kanıtlar onaylandı. Bulgu otomatik olarak kapatıldı.`,
                targetType: 'Finding',
                targetId: findingId,
            });
        }
    }
}
