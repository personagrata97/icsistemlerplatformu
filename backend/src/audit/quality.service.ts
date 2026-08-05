import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

import { parsePaginationParams, buildPaginatedResponse, PaginationParams } from '../common/pagination.util';

@Injectable()
export class QualityService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    // ==================== METRICS ====================

    async getMetrics(period?: string, params?: PaginationParams) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(params);
        const where: Prisma.QualityMetricWhereInput = { isDeleted: false };
        if (period) {
            where.period = period;
        }
        const [items, total] = await Promise.all([
            this.prisma.qualityMetric.findMany({
                where,
                skip,
                take,
                orderBy: sortBy ? { [sortBy]: sortDir } : { created_at: 'desc' },
            }),
            this.prisma.qualityMetric.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    async getMetricById(id: string) {
        const metric = await this.prisma.qualityMetric.findFirst({ where: { id, isDeleted: false } });
        if (!metric) throw new NotFoundException('Metrik bulunamadı');
        return metric;
    }

    async createMetric(data: Prisma.QualityMetricCreateInput, user?: any) {
        const actualNum = parseFloat(data.actual.toString());
        const targetNum = parseFloat(data.target.toString());
        let status = 'İyi';
        if (actualNum < targetNum * 0.8) {
            status = 'Kritik';
        } else if (actualNum < targetNum) {
            status = 'Uyarı';
        }

        const result = await this.prisma.qualityMetric.create({
            data: {
                ...data,
                status: data.status || status,
            },
        });

        // Y2: Loglama
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Metriki Oluşturuldu',
                details: `"${data.name}" metriki oluşturuldu.`,
                targetType: 'QualityMetric',
                targetId: result.id
            });
        }
        return result;
    }

    async updateMetric(id: string, data: Prisma.QualityMetricUpdateInput, user?: any) {
        await this.getMetricById(id);

        // Recalculate status if actual or target changed
        if (data.actual !== undefined || data.target !== undefined) {
            const existing = await this.prisma.qualityMetric.findUnique({ where: { id } });
            const actualNum = parseFloat((data.actual || existing?.actual)?.toString() || '0');
            const targetNum = parseFloat((data.target || existing?.target)?.toString() || '0');

            let status = 'İyi';
            if (actualNum < targetNum * 0.8) {
                status = 'Kritik';
            } else if (actualNum < targetNum) {
                status = 'Uyarı';
            }
            data.status = data.status || status;
        }

        const updated = await this.prisma.qualityMetric.update({
            where: { id },
            data,
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Metriki Güncellendi',
                details: `"${updated.name}" metriki güncellendi.`,
                targetType: 'QualityMetric',
                targetId: id
            });
        }
        return updated;
    }

    async deleteMetric(id: string, user?: any) {
        const metric = await this.getMetricById(id);
        const result = await this.prisma.qualityMetric.update({ 
            where: { id },
            data: { isDeleted: true, deletedAt: new Date(), deletedById: user?.userId || user?.id }
        });
        // Y2: Silme loglaması
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Metriki Silindi',
                details: `"${metric.name}" metriki silindi.`,
                targetType: 'QualityMetric',
                targetId: id
            });
        }
        return result;
    }

    // ==================== ASSESSMENTS ====================

    async getAssessments(type?: string, params?: PaginationParams) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(params);
        const where: Prisma.QualityAssessmentWhereInput = { isDeleted: false };
        if (type) {
            where.type = type;
        }
        const [items, total] = await Promise.all([
            this.prisma.qualityAssessment.findMany({
                where,
                skip,
                take,
                include: {
                    actions: true,
                },
                orderBy: sortBy ? { [sortBy]: sortDir } : { date: 'desc' },
            }),
            this.prisma.qualityAssessment.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    async getAssessmentById(id: string) {
        const assessment = await this.prisma.qualityAssessment.findFirst({
            where: { id, isDeleted: false },
            include: { actions: true },
        });
        if (!assessment) throw new NotFoundException('Değerlendirme bulunamadı');
        return assessment;
    }

    async createAssessment(data: Prisma.QualityAssessmentCreateInput, user?: any) {
        const result = await this.prisma.qualityAssessment.create({
            data,
            include: { actions: true },
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Değerlendirmesi Oluşturuldu',
                details: `${data.type} tipli kalite değerlendirmesi eklendi.`,
                targetType: 'QualityAssessment',
                targetId: result.id
            });
        }
        return result;
    }

    async updateAssessment(id: string, data: Prisma.QualityAssessmentUpdateInput, user?: any) {
        await this.getAssessmentById(id);
        const updated = await this.prisma.qualityAssessment.update({
            where: { id },
            data,
            include: { actions: true },
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Değerlendirmesi Güncellendi',
                details: `Kalite değerlendirmesi (ID: ${id}) güncellendi.`,
                targetType: 'QualityAssessment',
                targetId: id
            });
        }
        return updated;
    }

    async deleteAssessment(id: string, user?: any) {
        const assessment = await this.getAssessmentById(id);
        const result = await this.prisma.qualityAssessment.update({ 
            where: { id },
            data: { isDeleted: true, deletedAt: new Date(), deletedById: user?.userId || user?.id }
        });
        // Y2: Silme loglaması
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Değerlendirmesi Silindi',
                details: `Değerlendirme silindi.`,
                targetType: 'QualityAssessment',
                targetId: id
            });
        }
        return result;
    }

    // ==================== ACTIONS ====================

    async getActions(assessmentId?: string, status?: string, params?: PaginationParams) {
        const { page, pageSize, skip, take, sortBy, sortDir } = parsePaginationParams(params);
        const where: Prisma.QualityActionWhereInput = { isDeleted: false };
        if (assessmentId) {
            where.assessmentId = assessmentId;
        }
        if (status) {
            where.status = status;
        }
        const [items, total] = await Promise.all([
            this.prisma.qualityAction.findMany({
                where,
                skip,
                take,
                include: { assessment: true },
                orderBy: sortBy ? { [sortBy]: sortDir } : { dueDate: 'asc' },
            }),
            this.prisma.qualityAction.count({ where })
        ]);
        return buildPaginatedResponse(items, total, page, pageSize);
    }

    async getActionById(id: string) {
        const action = await this.prisma.qualityAction.findFirst({
            where: { id, isDeleted: false },
            include: { assessment: true },
        });
        if (!action) throw new NotFoundException('Aksiyon bulunamadı');
        return action;
    }

    async createAction(data: Prisma.QualityActionCreateInput, user?: any) {
        const result = await this.prisma.qualityAction.create({
            data,
            include: { assessment: true },
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Aksiyonu Oluşturuldu',
                details: `"${data.title}" isimli kalite aksiyonu oluşturuldu.`,
                targetType: 'QualityAction',
                targetId: result.id
            });
        }
        return result;
    }

    async updateAction(id: string, data: Prisma.QualityActionUpdateInput, user?: any) {
        await this.getActionById(id);

        // Auto-set completedAt when status changes to Tamamlandı
        if (data.status === 'Tamamlandı' && !data.completedAt) {
            data.completedAt = new Date();
        }

        const updated = await this.prisma.qualityAction.update({
            where: { id },
            data,
            include: { assessment: true },
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Aksiyonu Güncellendi',
                details: `Kalite aksiyonu güncellendi. Durum: ${updated.status}`,
                targetType: 'QualityAction',
                targetId: id
            });
        }
        return updated;
    }

    async deleteAction(id: string, user?: any) {
        const action = await this.getActionById(id);
        const result = await this.prisma.qualityAction.update({ 
            where: { id },
            data: { isDeleted: true, deletedAt: new Date(), deletedById: user?.userId || user?.id }
        });

        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Kalite Aksiyonu Silindi',
                details: `"${action.title}" isimli kalite aksiyonu silindi.`,
                targetType: 'QualityAction',
                targetId: id
            });
        }
        return result;
    }

    // ==================== STATS ====================

    async getStats() {
        const [metrics, assessments, actions] = await Promise.all([
            this.prisma.qualityMetric.findMany({ where: { isDeleted: false } }),
            this.prisma.qualityAssessment.findMany({ where: { isDeleted: false } }),
            this.prisma.qualityAction.findMany({ where: { isDeleted: false } }),
        ]);

        const metricsByStatus = {
            iyi: metrics.filter(m => m.status === 'İyi').length,
            uyari: metrics.filter(m => m.status === 'Uyarı').length,
            kritik: metrics.filter(m => m.status === 'Kritik').length,
        };

        const assessmentsByType = {
            ic: assessments.filter(a => a.type === 'İç').length,
            dis: assessments.filter(a => a.type === 'Dış').length,
        };

        const lastInternalAssessment = assessments
            .filter(a => a.type === 'İç')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const lastExternalAssessment = assessments
            .filter(a => a.type === 'Dış')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const openActions = actions.filter(a => a.status === 'Açık').length;
        const overdueActions = actions.filter(a =>
            a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date()
        ).length;

        return {
            metrics: {
                total: metrics.length,
                ...metricsByStatus,
            },
            assessments: {
                total: assessments.length,
                ...assessmentsByType,
                lastInternal: lastInternalAssessment,
                lastExternal: lastExternalAssessment,
            },
            actions: {
                total: actions.length,
                open: openActions,
                overdue: overdueActions,
            },
        };
    }

    // ==================== AUTO-CALCULATED METRICS ====================

    async calculateAutoMetrics() {
        const [audits, findings, plans] = await Promise.all([
            this.prisma.audit.findMany({ where: { isDeleted: false } }),
            this.prisma.finding.findMany({ where: { isDeleted: false } }),
            this.prisma.auditPlan.findMany(), // AuditPlan doesn't have deletedAt or isDeleted currently
        ]);

        const totalAudits = audits.length;
        const completedAudits = audits.filter(a => a.status === 'Tamamlandı').length;
        const completionRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

        const totalFindings = findings.length;
        const resolvedFindings = findings.filter(f => f.status === 'Kapatıldı' || f.status === 'Tamamlandı' || f.status === 'Kapalı').length;
        const findingResolutionRate = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0;

        const approvedPlans = plans.filter(p => p.status === 'Onaylandı' || p.status === 'Tamamlandı').length;
        const planComplianceRate = plans.length > 0 ? Math.round((approvedPlans / plans.length) * 100) : 0;

        // Ortalama denetim süresi (tamamlanan denetimler)
        const completedWithDates = audits.filter(a => (a.status === 'Tamamlandı' || a.status === 'Kapalı') && a.startDate && a.endDate);
        let avgDuration = 0;
        if (completedWithDates.length > 0) {
            const totalDays = completedWithDates.reduce((sum, a) => {
                const start = new Date(a.startDate!);
                const end = new Date(a.endDate!);
                return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }, 0);
            avgDuration = Math.round(totalDays / completedWithDates.length);
        }

        // Bulguların zamanında kapatılma oranı
        const findingsWithDeadline = findings.filter(f => f.dueDate);
        const onTimeResolved = findingsWithDeadline.filter(f => {
            if (f.status !== 'Kapatıldı' && f.status !== 'Tamamlandı' && f.status !== 'Kapalı') return false;
            if (!f.verifiedAt || !f.dueDate) return false;
            return new Date(f.verifiedAt) <= new Date(f.dueDate);
        }).length;
        const onTimeRate = findingsWithDeadline.length > 0 ? Math.round((onTimeResolved / findingsWithDeadline.length) * 100) : 100;

        // Risk dağılımı
        const criticalFindings = findings.filter(f => f.risk === 'Kritik' && f.status !== 'Kapatıldı' && f.status !== 'Kapalı').length;
        const highFindings = findings.filter(f => f.risk === 'Yüksek' && f.status !== 'Kapatıldı' && f.status !== 'Kapalı').length;

        const getStatus = (actual: number, target: number) => {
            if (actual >= target) return 'İyi';
            if (actual >= target * 0.8) return 'Uyarı';
            return 'Kritik';
        };

        const getTrend = (actual: number, target: number): 'up' | 'down' | 'stable' => {
            if (actual >= target) return 'up';
            if (actual >= target * 0.9) return 'stable';
            return 'down';
        };

        return [
            {
                id: 'auto-completion-rate',
                name: 'Denetim Tamamlanma Oranı',
                category: 'Performans',
                target: 90,
                actual: completionRate,
                unit: '%',
                trend: getTrend(completionRate, 90),
                status: getStatus(completionRate, 90),
                isAutoCalculated: true,
            },
            {
                id: 'auto-finding-resolution',
                name: 'Bulgu Çözüm Oranı',
                category: 'Etkinlik',
                target: 85,
                actual: findingResolutionRate,
                unit: '%',
                trend: getTrend(findingResolutionRate, 85),
                status: getStatus(findingResolutionRate, 85),
                isAutoCalculated: true,
            },
            {
                id: 'auto-plan-compliance',
                name: 'Plana Uyum Oranı',
                category: 'Uyum',
                target: 95,
                actual: planComplianceRate,
                unit: '%',
                trend: getTrend(planComplianceRate, 95),
                status: getStatus(planComplianceRate, 95),
                isAutoCalculated: true,
            },
            {
                id: 'auto-avg-duration',
                name: 'Ortalama Denetim Süresi',
                category: 'Performans',
                target: 30,
                actual: avgDuration,
                unit: 'gün',
                trend: avgDuration <= 30 ? 'up' : avgDuration <= 45 ? 'stable' : 'down',
                status: avgDuration <= 30 ? 'İyi' : avgDuration <= 45 ? 'Uyarı' : 'Kritik',
                isAutoCalculated: true,
            },
            {
                id: 'auto-ontime-rate',
                name: 'Zamanında Kapatma Oranı',
                category: 'Etkinlik',
                target: 80,
                actual: onTimeRate,
                unit: '%',
                trend: getTrend(onTimeRate, 80),
                status: getStatus(onTimeRate, 80),
                isAutoCalculated: true,
            },
            {
                id: 'auto-open-critical',
                name: 'Açık Kritik/Yüksek Bulgular',
                category: 'Risk',
                target: 0,
                actual: criticalFindings + highFindings,
                unit: 'adet',
                trend: (criticalFindings + highFindings) === 0 ? 'up' : (criticalFindings + highFindings) <= 3 ? 'stable' : 'down',
                status: (criticalFindings + highFindings) === 0 ? 'İyi' : (criticalFindings + highFindings) <= 3 ? 'Uyarı' : 'Kritik',
                isAutoCalculated: true,
            },
        ];
    }

    // ==================== DOSYA GÖZDEN GEÇİRME (QUALITY REVIEWS) ====================

    async getChecklistTemplates() {
        let items = await this.prisma.qualityChecklist.findMany({
            where: { aktif: true },
            orderBy: [{ kategori: 'asc' }, { sira: 'asc' }]
        });

        if (items.length === 0) {
            const seedItems = [
                // Planlama
                { ad: 'Planlama Standartları', kategori: 'Planlama', kontrolMetni: 'Denetim alanına ilişkin risk değerlendirmesi yapıldı mı?', sira: 1 },
                { ad: 'Planlama Standartları', kategori: 'Planlama', kontrolMetni: 'Denetim kapsamı ve amaçları yeterli belirlendi mi?', sira: 2 },
                { ad: 'Planlama Standartları', kategori: 'Planlama', kontrolMetni: 'Denetim ekibi yetkinliği ve bağımsızlığı sağlandı mı?', sira: 3 },
                // Saha
                { ad: 'Saha Çalışması Kontrolleri', kategori: 'Saha', kontrolMetni: 'Denetim programı adımları eksiksiz tamamlandı mı?', sira: 1 },
                { ad: 'Saha Çalışması Kontrolleri', kategori: 'Saha', kontrolMetni: 'Çalışma kâğıtlarındaki kanıtlar yeterli ve uygun mu?', sira: 2 },
                { ad: 'Saha Çalışması Kontrolleri', kategori: 'Saha', kontrolMetni: 'Örneklem seçimi ve popülasyon temsili uygun mu?', sira: 3 },
                // Kanıt
                { ad: 'Kanıt Standartları', kategori: 'Kanıt', kontrolMetni: 'Çalışma kâğıtları müfettiş ve başmüfettiş tarafından imzalandı mı?', sira: 1 },
                { ad: 'Kanıt Standartları', kategori: 'Kanıt', kontrolMetni: 'Kanıtlar denetim izini (audit trail) izlenebilir kılıyor mu?', sira: 2 },
                // Raporlama
                { ad: 'Raporlama Kalitesi', kategori: 'Raporlama', kontrolMetni: 'Bulgular yeterli ve ikna edici kanıtlara dayanıyor mu?', sira: 1 },
                { ad: 'Raporlama Kalitesi', kategori: 'Raporlama', kontrolMetni: 'Öneriler uygulanabilir ve kök nedene yönelik mi?', sira: 2 },
                { ad: 'Raporlama Kalitesi', kategori: 'Raporlama', kontrolMetni: 'Birim yanıtı ve aksiyon planı alındı mı?', sira: 3 },
                // İzleme
                { ad: 'Takip ve İzleme', kategori: 'İzleme', kontrolMetni: 'Aksiyon planları için termin tarihi ve sorumlular belirlenip takip ediliyor mu?', sira: 1 }
            ];

            for (const seed of seedItems) {
                await this.prisma.qualityChecklist.create({ data: seed });
            }

            items = await this.prisma.qualityChecklist.findMany({
                where: { aktif: true },
                orderBy: [{ kategori: 'asc' }, { sira: 'asc' }]
            });
        }

        return items;
    }

    async getReviewsByAudit(auditId?: string) {
        const where = auditId ? { auditId } : {};
        return this.prisma.qualityReview.findMany({
            where,
            include: {
                audit: { select: { id: true, title: true, auditCode: true, status: true, department: true, creatorId: true } },
                gozdenGeciren: { select: { id: true, displayName: true, title: true, photoUrl: true } },
                items: {
                    include: {
                        sorumlu: { select: { id: true, displayName: true, title: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createReview(data: { auditId: string, tur: string }, user: any) {
        const audit = await this.prisma.audit.findUnique({
            where: { id: data.auditId, isDeleted: false },
            include: { teamMembers: true }
        });
        if (!audit) throw new NotFoundException('Denetim bulunamadı.');

        // KURAL 2: Gözden geçirme yalnızca "Tamamlandı" durumundaki denetimler için açılabilir.
        if (audit.status !== 'Tamamlandı') {
            throw new BadRequestException('Kalite gözden geçirmesi yalnızca "Tamamlandı" durumundaki denetimler için açılabilir.');
        }

        // KURAL 1: Denetimi yapan kişi kendi denetimini gözden geçiremez.
        const isCreator = audit.creatorId === user.id;
        const isTeamMember = audit.teamMembers?.some(m => m.userId === user.id && m.aktif);
        if (isCreator || isTeamMember) {
            throw new ForbiddenException('Denetimi yapan müfettiş / ekip üyesi kendi denetimini kalite gözden geçirmesinden geçiremez.');
        }

        const review = await this.prisma.qualityReview.create({
            data: {
                auditId: data.auditId,
                tur: data.tur || 'İÇ_DEĞERLENDİRME',
                gozdenGecirenId: user.id,
                durum: 'Devam'
            },
            include: {
                audit: { select: { id: true, title: true, auditCode: true } },
                gozdenGeciren: { select: { id: true, displayName: true, title: true } }
            }
        });

        await this.auditLogService.createLog({
            user: user.displayName || user.username,
            action: 'Kalite Gözden Geçirme Oluşturuldu',
            details: `"${audit.title}" denetimi için kalite gözden geçirmesi başlatıldı.`,
            targetType: 'Audit',
            targetId: data.auditId
        });

        return review;
    }

    async createFromChecklist(auditId: string, data: { tur: string }, user: any) {
        const review = await this.createReview({ auditId, tur: data.tur }, user);
        const templates = await this.getChecklistTemplates();

        for (const tmpl of templates) {
            await this.prisma.qualityReviewItem.create({
                data: {
                    reviewId: review.id,
                    kontrolBasligi: tmpl.kontrolMetni,
                    kategori: tmpl.kategori,
                    sonuc: 'Uygun'
                }
            });
        }

        return this.prisma.qualityReview.findUnique({
            where: { id: review.id },
            include: {
                audit: { select: { id: true, title: true, auditCode: true } },
                gozdenGeciren: { select: { id: true, displayName: true, title: true } },
                items: true
            }
        });
    }

    async addReviewItem(reviewId: string, data: { kontrolBasligi: string, kategori: string, sonuc?: string, bulgu?: string, oneri?: string, sorumluId?: string }, user: any) {
        const review = await this.prisma.qualityReview.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Kalite gözden geçirmesi bulunamadı.');

        // KURAL 3: "Uygun Değil" sonucu olan her madde için öneri zorunlu.
        if (data.sonuc === 'Uygun Değil' && (!data.oneri || !data.oneri.trim())) {
            throw new BadRequestException('"Uygun Değil" olarak değerlendirilen maddeler için öneri girilmesi zorunludur.');
        }

        const item = await this.prisma.qualityReviewItem.create({
            data: {
                reviewId,
                kontrolBasligi: data.kontrolBasligi,
                kategori: data.kategori,
                sonuc: data.sonuc || 'Uygun',
                bulgu: data.bulgu || null,
                oneri: data.oneri || null,
                sorumluId: data.sorumluId || null
            }
        });

        return item;
    }

    async updateReviewItem(itemId: string, data: { sonuc?: string, bulgu?: string, oneri?: string, sorumluId?: string }, user: any) {
        const item = await this.prisma.qualityReviewItem.findUnique({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Gözden geçirme maddesi bulunamadı.');

        const targetSonuc = data.sonuc !== undefined ? data.sonuc : item.sonuc;
        const targetOneri = data.oneri !== undefined ? data.oneri : item.oneri;

        // KURAL 3: "Uygun Değil" sonucu olan her madde için öneri zorunlu.
        if (targetSonuc === 'Uygun Değil' && (!targetOneri || !targetOneri.trim())) {
            throw new BadRequestException('"Uygun Değil" olarak değerlendirilen maddeler için öneri girilmesi zorunludur.');
        }

        return this.prisma.qualityReviewItem.update({
            where: { id: itemId },
            data: {
                ...(data.sonuc !== undefined ? { sonuc: data.sonuc } : {}),
                ...(data.bulgu !== undefined ? { bulgu: data.bulgu } : {}),
                ...(data.oneri !== undefined ? { oneri: data.oneri } : {}),
                ...(data.sorumluId !== undefined ? { sorumluId: data.sorumluId } : {})
            }
        });
    }

    async completeReview(reviewId: string, data: { genelSonuc: string, ozet?: string }, user: any) {
        const review = await this.prisma.qualityReview.findUnique({
            where: { id: reviewId },
            include: { items: true }
        });
        if (!review) throw new NotFoundException('Kalite gözden geçirmesi bulunamadı.');

        // KURAL 3 kontrolü: Herhangi bir madde "Uygun Değil" ise önerisi var mı?
        const invalidItem = review.items.find(i => i.sonuc === 'Uygun Değil' && (!i.oneri || !i.oneri.trim()));
        if (invalidItem) {
            throw new BadRequestException(`"${invalidItem.kontrolBasligi}" maddesi "Uygun Değil" olarak işaretlenmiş ancak öneri girilmemiştir.`);
        }

        const updated = await this.prisma.qualityReview.update({
            where: { id: reviewId },
            data: {
                durum: 'Tamamlandı',
                genelSonuc: data.genelSonuc,
                ozet: data.ozet || null,
                bitisTarihi: new Date()
            },
            include: {
                audit: true,
                items: true
            }
        });

        await this.auditLogService.createLog({
            user: user.displayName || user.username,
            action: 'Kalite Gözden Geçirme Tamamlandı',
            details: `"${updated.audit.title}" denetimi için kalite gözden geçirmesi tamamlandı. Genel Sonuc: ${data.genelSonuc}`,
            targetType: 'Audit',
            targetId: review.auditId
        });

        return updated;
    }
}
