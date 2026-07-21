import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLogService } from './audit-log.service';

// Not: Prisma client'ı PostgreSQL migrasyonu sonrası yeniden üretilene kadar
// yeni modeller için 'any' tipi kullanılmaktadır.
// `npx prisma generate` çalıştırıldığında bu tip kısıtları otomatik çözülecektir.

@Injectable()
export class KvkkService {
    private readonly logger = new Logger(KvkkService.name);
    // PostgreSQL migrasyonu sonrası Prisma client yenilenene kadar geçici tip
    private get db(): any { return this.prisma; }

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) {}

    // ============================================================
    // VERİ SAKLAMA POLİTİKALARI (Data Retention)
    // ============================================================

    async getRetentionPolicies() {
        return this.db.dataRetentionPolicy.findMany({
            orderBy: { dataCategory: 'asc' },
        });
    }

    async createRetentionPolicy(data: any, user: any) {
        const policy = await this.db.dataRetentionPolicy.create({
            data: {
                dataCategory: data.dataCategory,
                dataDescription: data.dataDescription,
                legalBasis: data.legalBasis,
                retentionPeriod: data.retentionPeriod,
                destructionMethod: data.destructionMethod,
                responsibleUnit: data.responsibleUnit,
                notes: data.notes,
                nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
            },
        });

        await this.auditLogService.createLog({
            user: user?.displayName || user?.username || 'Sistem',
            action: 'KVKK_POLITIKA_OLUSTURULDU',
            details: `Veri saklama politikası oluşturuldu: ${data.dataDescription}`,
            targetType: 'DataRetentionPolicy',
            targetId: policy.id,
        });

        return policy;
    }

    async updateRetentionPolicy(id: string, data: any, user: any) {
        const policy = await this.db.dataRetentionPolicy.findUnique({ where: { id } });
        if (!policy) throw new NotFoundException('Politika bulunamadı');

        const updated = await this.db.dataRetentionPolicy.update({
            where: { id },
            data: {
                ...data,
                lastReviewDate: new Date(),
                nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
            },
        });

        await this.auditLogService.createLog({
            user: user?.displayName || user?.username || 'Sistem',
            action: 'KVKK_POLITIKA_GUNCELLENDI',
            details: `Veri saklama politikası güncellendi: ${updated.dataDescription}`,
            targetType: 'DataRetentionPolicy',
            targetId: id,
        });

        return updated;
    }

    /**
     * Otomatik Periyodik İmha Kontrolü
     * Her gün gece yarısı çalışır ve süresi dolan verileri tespit eder
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkRetentionExpiry() {
        this.logger.log('KVKK: Periyodik veri saklama süresi kontrolü başlatıldı...');

        const policies = await this.db.dataRetentionPolicy.findMany({
            where: { status: 'Aktif' },
        });

        const now = new Date();

        for (const policy of policies) {
            const createdAt = new Date(policy.created_at);
            const expiryDate = new Date(createdAt);
            expiryDate.setMonth(expiryDate.getMonth() + policy.retentionPeriod);

            if (now >= expiryDate) {
                await this.db.dataRetentionPolicy.update({
                    where: { id: policy.id },
                    data: { status: 'Süresi Dolmuş' },
                });

                await this.auditLogService.createLog({
                    user: 'Sistem (KVKK Otomatik İmha)',
                    action: 'KVKK_SURE_DOLDU',
                    details: `"${policy.dataDescription}" kategorisindeki verilerin saklama süresi dolmuştur. İmha yöntemi: ${policy.destructionMethod}`,
                    targetType: 'DataRetentionPolicy',
                    targetId: policy.id,
                });

                this.logger.warn(`KVKK: Saklama süresi dolmuş politika tespit edildi — ${policy.dataDescription}`);
            }
        }
    }

    // ============================================================
    // VERİ SAHİBİ BAŞVURU TAKİP (KVKK Madde 11)
    // ============================================================

    async getDataSubjectRequests(filters?: { status?: string }) {
        const where: any = {};
        if (filters?.status) where.status = filters.status;

        return this.db.dataSubjectRequest.findMany({
            where,
            orderBy: { receivedDate: 'desc' },
        });
    }

    async createDataSubjectRequest(data: any, user: any) {
        const requestCode = `KVKK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        // Yasal süre: 30 gün
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const request = await this.db.dataSubjectRequest.create({
            data: {
                requestCode,
                applicantName: data.applicantName,
                applicantIdentity: data.applicantIdentity,
                applicantContact: data.applicantContact,
                requestType: data.requestType,
                requestDetails: data.requestDetails,
                dueDate,
                assignedTo: data.assignedTo,
                assignedToName: data.assignedToName,
                legalBasis: data.legalBasis,
                notes: data.notes,
            },
        });

        await this.auditLogService.createLog({
            user: user?.displayName || user?.username || 'Sistem',
            action: 'KVKK_BASVURU_ALINDI',
            details: `Veri sahibi başvurusu alındı: ${requestCode} — Tür: ${data.requestType}, Başvuran: ${data.applicantName}`,
            targetType: 'DataSubjectRequest',
            targetId: request.id,
        });

        return request;
    }

    async updateDataSubjectRequest(id: string, data: any, user: any) {
        const request = await this.db.dataSubjectRequest.findUnique({ where: { id } });
        if (!request) throw new NotFoundException('Başvuru bulunamadı');

        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.response) updateData.response = data.response;
        if (data.assignedTo) updateData.assignedTo = data.assignedTo;
        if (data.assignedToName) updateData.assignedToName = data.assignedToName;
        if (data.legalBasis) updateData.legalBasis = data.legalBasis;
        if (data.notes) updateData.notes = data.notes;

        if (data.status === 'Yanıtlandı' || data.status === 'Reddedildi' || data.status === 'Kısmen Yanıtlandı') {
            updateData.responseDate = new Date();
        }

        const updated = await this.db.dataSubjectRequest.update({
            where: { id },
            data: updateData,
        });

        await this.auditLogService.createLog({
            user: user?.displayName || user?.username || 'Sistem',
            action: 'KVKK_BASVURU_GUNCELLENDI',
            details: `Veri sahibi başvurusu güncellendi: ${request.requestCode} — Yeni durum: ${data.status || 'Güncelleme'}`,
            targetType: 'DataSubjectRequest',
            targetId: id,
        });

        return updated;
    }

    async getDataSubjectRequestStats() {
        const [total, pending, overdue, responded] = await Promise.all([
            this.db.dataSubjectRequest.count(),
            this.db.dataSubjectRequest.count({ where: { status: { in: ['Alındı', 'İnceleniyor'] } } }),
            this.db.dataSubjectRequest.count({
                where: {
                    status: { in: ['Alındı', 'İnceleniyor'] },
                    dueDate: { lt: new Date() },
                },
            }),
            this.db.dataSubjectRequest.count({ where: { status: { in: ['Yanıtlandı', 'Kısmen Yanıtlandı'] } } }),
        ]);

        return { total, pending, overdue, responded };
    }

    /**
     * Yasal Süre Aşımı Uyarı Kontrolü
     * Her gün sabah 08:00'de çalışır
     */
    @Cron('0 8 * * *')
    async checkOverdueRequests() {
        const overdueRequests = await this.db.dataSubjectRequest.findMany({
            where: {
                status: { in: ['Alındı', 'İnceleniyor'] },
                dueDate: { lt: new Date() },
            },
        });

        if (overdueRequests.length > 0) {
            this.logger.error(`KVKK UYARI: ${overdueRequests.length} adet veri sahibi başvurusu yasal süreyi aşmıştır!`);

            for (const req of overdueRequests) {
                await this.auditLogService.createLog({
                    user: 'Sistem (KVKK Süre Kontrolü)',
                    action: 'KVKK_SURE_ASIMI',
                    details: `YASAL SÜRE AŞIMI: Başvuru ${req.requestCode} (${req.applicantName}) 30 günlük yasal yanıt süresi dolmuştur! Acil işlem gereklidir.`,
                    targetType: 'DataSubjectRequest',
                    targetId: req.id,
                });
            }
        }
    }
}
