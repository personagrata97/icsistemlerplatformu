import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationService } from '../common/notification/notification.service';
import { AuditLogService } from '../audit/audit-log.service';
import { parsePaginationParams, buildPaginatedResponse, PaginationParams } from '../common/pagination.util';

@Injectable()
export class AlertService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private auditLogService: AuditLogService
    ) { }

    /**
     * Risk limitlerini kontrol et ve uyarı oluştur
     */
    async checkLimitsAndCreateAlerts(kpiCode: string, value: number, scenarioCode: string, riskLevel: string) {
        const limitler = await this.prisma.riskLimit.findMany({
            where: { kpi_kodu: kpiCode },
        });

        for (const limit of limitler) {
            const esikDeger = Number(limit.esik_deger);
            let limitAsimi = false;

            switch (limit.karsilastirma) {
                case 'GT':
                    limitAsimi = value > esikDeger;
                    break;
                case 'LT':
                    limitAsimi = value < esikDeger;
                    break;
                case 'EQ':
                    limitAsimi = Math.abs(value - esikDeger) < 0.0001;
                    break;
            }

            if (limitAsimi) {
                const yeniUyari = await this.prisma.uyari.create({
                    data: {
                        kpi_kodu: kpiCode,
                        senaryo_kodu: scenarioCode,
                        esik_deger: esikDeger,
                        gerceklesen_deger: value,
                        risk_seviyesi: limit.seviye,
                        durum: 'OPEN',
                        mesaj: `${kpiCode} limiti aşıldı: ${value.toFixed(4)} (Eşik: ${esikDeger})`,
                    },
                });

                await this.notificationService.notifyByRole('Risk Uzmanı', {
                    title: 'Risk Limiti Aşıldı',
                    description: `${kpiCode} göstergesinde limit aşımı tespit edildi. Gerçekleşen: ${value.toFixed(4)}, Sınır: ${esikDeger}`,
                    type: 'warning',
                    module: 'risk',
                    link: `/risk/alerts`
                });

                await this.notificationService.notifyByRole('Risk Yöneticisi', {
                    title: 'Risk Limiti Aşıldı',
                    description: `${kpiCode} göstergesinde limit aşımı tespit edildi. Gerçekleşen: ${value.toFixed(4)}, Sınır: ${esikDeger}`,
                    type: 'warning',
                    module: 'risk',
                    link: `/risk/alerts`
                });

                if (limit.seviye === 'KRITIK' || limit.seviye === 'YUKSEK' || limit.seviye === 'RED') {
                    try {
                        let audit = await this.prisma.audit.findFirst({
                            where: { title: 'Risk Yönetimi ve Uyum Kontrolleri', isDeleted: false }
                        });

                        if (!audit) {
                            audit = await this.prisma.audit.create({
                                data: {
                                    title: 'Risk Yönetimi ve Uyum Kontrolleri',
                                    type: 'Risk ve Uyum',
                                    status: 'Devam Ediyor',
                                    startDate: new Date().toISOString().split('T')[0],
                                    auditCode: 'RISK-UYUM'
                                }
                            });
                        }

                        const titlePattern = `${kpiCode} Risk Limiti İhlali`;
                        const existingFinding = await this.prisma.finding.findFirst({
                            where: {
                                auditId: audit.id,
                                title: titlePattern,
                                status: { in: ['Taslak', 'Onay Bekliyor', 'Onaylandı', 'Tebliğ Edildi', 'Açık', 'Süresi Geçti'] },
                                isDeleted: false
                            }
                        });

                        if (!existingFinding) {
                            const currentYear = new Date().getFullYear();
                            const sequenceCount = await this.prisma.finding.count({
                                where: { findingCode: { startsWith: `BUL-${currentYear}` } }
                            });
                            const findingCode = `BUL-${currentYear}-${String(sequenceCount + 1).padStart(3, '0')}`;

                            const finding = await this.prisma.finding.create({
                                data: {
                                    auditId: audit.id,
                                    findingCode,
                                    title: titlePattern,
                                    category: 'Mevzuat ve Risk Limiti İhlali',
                                    severity: limit.seviye === 'RED' || limit.seviye === 'KRITIK' ? 'Kritik' : 'Yüksek',
                                    status: 'Tebliğ Edildi',
                                    description: `Risk göstergesi ${kpiCode} için tanımlanan threshold aşıldı. Gerçekleşen Değer: ${value.toFixed(4)}, Eşik Değer: ${esikDeger}`,
                                    impact: 'Mevzuat ve finansal rasyo limit ihlali riski',
                                    rootCause: 'Limit aşımı tespit edildi.',
                                    recommendation: 'İlgili birim derhal aksiyon alarak rasyonun güvenli seviyeye çekilmesini sağlamalıdır.',
                                }
                            });

                            await this.notificationService.notifyByRole('Teftiş Müdürü', {
                                title: 'Risk Uyarısı İle Otomatik Bulgu Oluşturuldu',
                                description: `${titlePattern} kapsamında teftiş bulgusu otomatik oluşturuldu.`,
                                type: 'error',
                                module: 'risk',
                                link: `/audit/findings/${finding.id}`
                            });
                        }
                    } catch (err) {
                        console.error('Otomatik bulgu oluşturma hatası:', err);
                    }
                }
            }
        }
    }

    /**
     * Açık uyarıları listele
     */
    async getOpenAlerts(query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const where = { durum: 'OPEN' };
        const total = await this.prisma.uyari.count({ where });
        const uyarilar = await this.prisma.uyari.findMany({
            where,
            include: {
                kpi: true,
                senaryo: true,
            },
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { tarih: 'desc' },
            skip,
            take,
        });

        return buildPaginatedResponse(uyarilar, total, page, pageSize);
    }

    /**
     * Tüm uyarıları listele (filtreleme ile)
     */
    async getAllAlerts(filters?: { durum?: string; risk_seviyesi?: string; birimId?: string }, query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const where: any = {};

        if (filters?.durum) where.durum = filters.durum;
        if (filters?.risk_seviyesi) where.risk_seviyesi = filters.risk_seviyesi;
        if (filters?.birimId) where.birimId = filters.birimId;

        const total = await this.prisma.uyari.count({ where });
        const items = await this.prisma.uyari.findMany({
            where,
            include: {
                kpi: true,
                senaryo: true,
            },
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { tarih: 'desc' },
            skip,
            take,
        });

        // Fetch actions for each alert
        const alertIds = items.map(i => i.uyari_id);
        const actions = await this.prisma.riskAction.findMany({
            where: { alertId: { in: alertIds } },
            include: { evidences: true }
        });

        const actionsMap = new Map();
        actions.forEach(a => {
            if (!actionsMap.has(a.alertId)) actionsMap.set(a.alertId, []);
            actionsMap.get(a.alertId).push(a);
        });

        const itemsWithActions = items.map(item => ({
            ...item,
            actions: actionsMap.get(item.uyari_id) || []
        }));

        return buildPaginatedResponse(itemsWithActions, total, page, pageSize);
    }

    /**
     * Uyarıyı sorumlu birime ata
     */
    async assignAlert(alertId: string, birimId: string, atananId?: string, userId?: string) {
        const alert = await this.prisma.uyari.update({
            where: { uyari_id: alertId },
            data: {
                birimId,
                atananId,
                durum: 'ASSIGNED'
            }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ALERT_ASSIGNED',
            details: `Risk uyarısı (${alertId}) ${birimId} birimine atandı.`,
            targetType: 'RiskAlert',
            targetId: alertId
        });

        await this.notificationService.notifyByRole('Risk Uzmanı', {
            title: 'Risk Uyarısı Atandı',
            description: `Risk uyarısı ${birimId} birimine atandı.`,
            type: 'info',
            module: 'risk',
            link: '/risk/alerts'
        });

        return alert;
    }

    /**
     * Birim yanıtı gönderme
     */
    async submitUnitResponse(alertId: string, birimYaniti: string, yanitGerekcesi?: string, userId?: string) {
        const alert = await this.prisma.uyari.update({
            where: { uyari_id: alertId },
            data: {
                birimYaniti,
                yanitGerekcesi,
                yanitTarihi: new Date(),
                durum: 'RESPONSE_SUBMITTED'
            }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ALERT_UNIT_RESPONSE',
            details: `Risk uyarısına birim yanıtı verildi: ${birimYaniti}`,
            targetType: 'RiskAlert',
            targetId: alertId
        });

        return alert;
    }

    /**
     * Aksiyon oluştur
     */
    async createAction(alertId: string, aksiyonTanimi: string, sorumluId?: string, sorumluBirimId?: string, terminTarihi?: Date, userId?: string) {
        const action = await this.prisma.riskAction.create({
            data: {
                alertId,
                aksiyonTanimi,
                sorumluId,
                sorumluBirimId,
                terminTarihi,
                durum: 'Planlandı',
                olusturanId: userId
            }
        });

        await this.prisma.uyari.update({
            where: { uyari_id: alertId },
            data: { durum: 'IN_ACTION' }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ACTION_CREATED',
            details: `Risk uyarısına aksiyon eklendi: ${aksiyonTanimi}`,
            targetType: 'RiskAction',
            targetId: action.id
        });

        return action;
    }

    /**
     * Aksiyonları getirme
     */
    async getActions(filters?: { alertId?: string; durum?: string; sorumluBirimId?: string }, query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const where: any = {};

        if (filters?.alertId) where.alertId = filters.alertId;
        if (filters?.durum) where.durum = filters.durum;
        if (filters?.sorumluBirimId) where.sorumluBirimId = filters.sorumluBirimId;

        const total = await this.prisma.riskAction.count({ where });
        const items = await this.prisma.riskAction.findMany({
            where,
            include: { evidences: true },
            orderBy: { created_at: 'desc' },
            skip,
            take,
        });

        return buildPaginatedResponse(items, total, page, pageSize);
    }

    /**
     * Aksiyon durumunu güncelleme
     */
    async updateActionStatus(actionId: string, durum: string, tamamlanmaTarihi?: Date, userId?: string) {
        const action = await this.prisma.riskAction.update({
            where: { id: actionId },
            data: {
                durum,
                tamamlanmaTarihi: durum === 'Tamamlandı' ? (tamamlanmaTarihi || new Date()) : null
            }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ACTION_STATUS_UPDATED',
            details: `Risk aksiyon durumu güncellendi: ${durum}`,
            targetType: 'RiskAction',
            targetId: actionId
        });

        return action;
    }

    /**
     * Aksiyon kanıtı yükleme
     */
    async uploadActionEvidence(actionId: string, dosyaId: string, aciklama: string, userId: string) {
        const evidence = await this.prisma.riskActionEvidence.create({
            data: {
                actionId,
                dosyaId,
                aciklama,
                yukleyenId: userId,
                onayDurumu: 'BEKLEMEDE'
            }
        });

        await this.auditLogService.createLog({
            user: userId,
            action: 'RISK_ACTION_EVIDENCE_UPLOADED',
            details: `Risk aksiyonuna kanıt yüklendi: ${dosyaId}`,
            targetType: 'RiskActionEvidence',
            targetId: evidence.id
        });

        return evidence;
    }

    /**
     * Aksiyon kanıtı onaylama / reddetme (Self-approval prohibition rule)
     */
    async approveActionEvidence(evidenceId: string, onayDurumu: 'ONAYLANDI' | 'REDDEDILDI', rejectionReason?: string, userId?: string) {
        const existing = await this.prisma.riskActionEvidence.findUnique({ where: { id: evidenceId } });
        if (!existing) throw new NotFoundException('Kanıt kaydı bulunamadı.');

        if (existing.yukleyenId === userId) {
            throw new BadRequestException('Kanıtı yükleyen kişi kendi kanıtını onaylayamaz.');
        }

        const evidence = await this.prisma.riskActionEvidence.update({
            where: { id: evidenceId },
            data: {
                onayDurumu,
                onaylayanId: userId,
                onayTarihi: new Date(),
                rejectionReason: onayDurumu === 'REDDEDILDI' ? rejectionReason : null
            }
        });

        if (onayDurumu === 'ONAYLANDI') {
            await this.prisma.riskAction.update({
                where: { id: evidence.actionId },
                data: { durum: 'Tamamlandı', tamamlanmaTarihi: new Date() }
            });
        }

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ACTION_EVIDENCE_APPROVED',
            details: `Risk kanıtı kararı: ${onayDurumu}`,
            targetType: 'RiskActionEvidence',
            targetId: evidenceId
        });

        return evidence;
    }

    /**
     * Kanıtlı Uyarı Kapatma (Gerekçe zorunlu, tüm aksiyonlar tamamlanmış olmalı)
     */
    async closeAlertWithEvidence(alertId: string, kapanisGerekcesi: string, userId?: string) {
        if (!kapanisGerekcesi || !kapanisGerekcesi.trim()) {
            throw new BadRequestException('Uyarı kapatılırken gerekçe yazılması zorunludur.');
        }

        const actions = await this.prisma.riskAction.findMany({
            where: { alertId }
        });

        const pendingActions = actions.filter(a => a.durum !== 'Tamamlandı');
        if (pendingActions.length > 0) {
            throw new BadRequestException('Tamamlanmamış aksiyonlar bulunmaktadır. Uyarı kapatılamaz.');
        }

        const alert = await this.prisma.uyari.update({
            where: { uyari_id: alertId },
            data: {
                durum: 'CLOSED',
                kapanisGerekcesi
            }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'RISK_ALERT_CLOSED',
            details: `Risk uyarısı kapatıldı. Gerekçe: ${kapanisGerekcesi}`,
            targetType: 'RiskAlert',
            targetId: alertId
        });

        await this.notificationService.notifyByRole('Risk Yöneticisi', {
            title: 'Risk Uyarısı Kapatıldı',
            description: `Risk uyarısı (${alertId}) başarıyla kapatıldı.`,
            type: 'info',
            module: 'risk',
            link: '/risk/alerts'
        });

        return alert;
    }

    /**
     * Eski kapatma metodu
     */
    async closeAlert(uyariId: string) {
        return this.prisma.uyari.update({
            where: { uyari_id: uyariId },
            data: { durum: 'CLOSED' },
        });
    }
}
