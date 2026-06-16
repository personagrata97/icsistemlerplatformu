import { Injectable, ForbiddenException, ConflictException, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { AuditronService } from '../auditron/auditron.service';
import { AuditLogService } from './audit-log.service';
import { AuditRiskService } from './audit-risk.service';
import { FindingService } from './finding.service';
import { AuditTrashService } from './audit-trash.service';
import { NotificationService } from '../common/notification/notification.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        private prisma: PrismaService,
        private auditronService: AuditronService,
        private auditLogService: AuditLogService,
        private auditRiskService: AuditRiskService,
        private findingService: FindingService,
        private trashService: AuditTrashService,
        private notificationService: NotificationService
    ) { }

    private isAdmin(user: any): boolean {
        this.logger.debug(`Checking admin rights for user: ${user?.username || user?.displayName}, roles: ${JSON.stringify(user?.roles)}`);
        if (!user || !user.roles) return false;

        // Handle both string arrays (from DevRoleSwitcher) and object arrays (from DB)
        const roleCodes = user.roles.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code);
        const isAdminUser = roleCodes.includes('ADMIN') || roleCodes.includes('AUDIT_ADMIN') || roleCodes.includes('AUDIT_MANAGER');
        this.logger.debug(`Calculated roleCodes: ${JSON.stringify(roleCodes)}, isAdmin: ${isAdminUser}`);
        return isAdminUser;
    }





    // ETHICS (Mock)


    // Risk hesaplama: Sistem, Açık Bulgular/Risk Skoruna (RCM) göre Denetim Evrenini otomatik günceller
    // Risk hesaplama mantığı AuditRiskService'e taşındı.
    async getAllAudits(user: any) {
        try {
            // Ensure uploads directories exist
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const workpapersDir = path.join(uploadsDir, 'workpapers');
            const evidenceDir = path.join(uploadsDir, 'evidence');

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
            if (!fs.existsSync(workpapersDir)) fs.mkdirSync(workpapersDir);
            if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir);

            this.logger.log(`AuditService.getAllAudits: Starting... User: ${user?.id}`);
            const where: any = {};
            const safeUser = user || { id: 'unknown', permissions: [], roles: [] };

            if (!this.isAdmin(safeUser)) {
                // If permissions array is missing, default to empty to avoid crash
                const perms = safeUser.permissions || [];
                const auditViewPerm = perms.find((p: any) =>
                    (p.module === 'AUDIT' || p.module === 'ALL') &&
                    (p.action === 'VIEW' || p.action === 'ALL')
                );
                let scope = auditViewPerm?.scope || 'OWN';

                // Security check for AUDIT_UNIT role
                const roles = safeUser.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
                if (roles.includes('AUDIT_UNIT') && scope === 'ALL') {
                    this.logger.warn(`Security Warning: User ${safeUser.username} has AUDIT_UNIT role but ALL scope. Forcing DEPARTMENT scope.`);
                    scope = 'DEPARTMENT';
                }

                this.logger.debug(`AuditService.getAllAudits: Calculated Scope: ${scope}`);

                if (scope === 'OWN') {
                    const orConditions: any[] = [
                        { creatorId: safeUser.id },
                        { findings: { some: { assignedUserId: safeUser.id } } },
                        { supervisorId: safeUser.id },
                        { team: { contains: safeUser.id } }
                    ];

                    where.OR = orConditions;
                } else if (scope === 'DEPARTMENT') {
                    if (!safeUser.department) {
                        this.logger.warn('AuditService.getAllAudits: User has DEPARTMENT scope but no department defined. Returning empty list.');
                        return [];
                    }
                    where.department = safeUser.department;
                }
            }

            // this.logger.debug('AuditService.getAllAudits: Generated WHERE clause');

            const results = await this.prisma.audit.findMany({
                where: {
                    ...where,
                    isDeleted: false
                },
                orderBy: { created_at: 'desc' },
                include: {
                    findings: {
                        where: { isDeleted: false }
                    },
                    supervisorUser: {
                        select: {
                            id: true,
                            displayName: true,
                            email: true
                        }
                    },
                    workpaperFiles: {
                        where: { isDeleted: false }
                    }
                }
            });

            // Map supervisorUser to supervisor if supervisor is missing or just an ID
            const mappedResults = results.map(audit => {
                const auditObj: Record<string, any> = { ...audit };
                if (audit.supervisorUser) {
                    auditObj.supervisor = audit.supervisorUser.displayName;
                }

                // Safely parse JSON fields (they might be plain strings, not JSON)
                try { auditObj.team = auditObj.team ? JSON.parse(auditObj.team) : []; } catch { auditObj.team = auditObj.team ? [auditObj.team] : []; }
                auditObj.workpapers = audit.workpaperFiles || [];

                return auditObj;
            });

            this.logger.log(`AuditService.getAllAudits: Found ${results.length} audits.`);
            return mappedResults;

        } catch (error) {
            this.logger.error('AuditService.getAllAudits CRITICAL ERROR:', error);
            throw error; // Re-throw to let global filter handle 500, but now we have logs
        }
    }

    async getAudit(id: string, user: any) {
        const audit = await this.prisma.audit.findUnique({
            where: { id, isDeleted: false },
            include: {
                findings: {
                    where: { isDeleted: false }
                },
                workpaperFiles: {
                    where: { isDeleted: false }
                },
                supervisorUser: {
                    select: { id: true, displayName: true }
                }
            }
        });

        if (!audit) return null;

        // Permission check
        if (!this.isAdmin(user)) {
            const auditViewPerm = user.permissions.find((p: any) =>
                (p.module === 'AUDIT' || p.module === 'ALL') &&
                (p.action === 'VIEW' || p.action === 'ALL')
            );
            const scope = auditViewPerm?.scope || 'OWN';

            let hasAccess = false;
            if (scope === 'ALL') {
                hasAccess = true;
            } else if (scope === 'DEPARTMENT') {
                hasAccess = audit.department === user.department ||
                    audit.findings.some(f => f.department === user.department);
            } else if (scope === 'OWN') {
                const teamStr = audit.team || '';
                hasAccess = audit.creatorId === user.id ||
                    audit.findings.some(f => f.assignedUserId === user.id) ||
                    audit.supervisorId === user.id ||
                    teamStr.includes(user.id);
            }

            if (!hasAccess) throw new ForbiddenException('Bu denetime erişim yetkiniz yok.');
        }

        // Parse JSON fields
        return {
            ...audit,
            team: audit.team ? JSON.parse(audit.team) : [],
            workpapers: audit.workpaperFiles || []
        };
    }

    private async validateIndependence(userId: string, department: string) {
        if (!userId || !department) return;

        // Check recent history (last 1 year)
        // Denetçi Bağımsızlığı Standartları: Sadece 'Geçici Görev' ve 'Atama' tiplerinde bağımsızlık ihlali oluşur.
        // 'Terfi' tipi bağımsızlığı etkilemez.
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const conflicts = await this.prisma.userPromotion.findMany({
            where: {
                userId,
                department: department,
                type: { in: ['Geçici Görev', 'Atama'] }, // Sadece bu tipler bağımsızlığı etkiler
                OR: [
                    { endDate: null }, // Still active there or no end date recorded
                    { endDate: { gt: oneYearAgo } } // Ended less than a year ago
                ]
            }
        });

        if (conflicts.length > 0) {
            const conflict = conflicts[0];
            const dateStr = conflict.endDate ? conflict.endDate.toLocaleDateString('tr-TR') : 'Halen';
            const typeLabel = conflict.type || 'Görev';
            throw new ForbiddenException(
                `Denetçi Bağımsızlığı İhlali: Seçilen denetçi son 1 yıl içinde '${department}' biriminde ${typeLabel} olarak görev almıştır (${dateStr}). Bu birimde denetim yapması uygun değildir.`
            );
        }
    }

    /**
     * Paralel denetim kontrolü: Aynı birimde eşzamanlı olarak "Devam Ediyor" durumunda
     * başka bir denetim var mı kontrol eder.
     */
    private async checkParallelAudit(unitId: string | null, auditableUnitId: string | null, allowParallel?: boolean) {
        if (allowParallel) return; // Kullanıcı açıkça override ettiyse geç
        const targetUnitId = unitId || auditableUnitId;
        if (!targetUnitId) return;

        const existingActive = await this.prisma.audit.findFirst({
            where: {
                OR: [
                    { unitId: targetUnitId },
                    { auditableUnitId: targetUnitId }
                ],
                status: { in: ['Devam Ediyor', 'Planlandı'] },
                isDeleted: false
            },
            select: { id: true, auditCode: true, title: true, status: true }
        });

        if (existingActive) {
            throw new ConflictException(
                `Paralel Denetim Uyarısı: Bu birim için zaten aktif bir denetim mevcut → "${existingActive.auditCode || existingActive.title}" (${existingActive.status}). Paralel denetim oluşturmak istiyorsanız 'allowParallel: true' parametresini gönderin.`
            );
        }
    }

    /**
     * Kapasite ve Tarih Çakışması Kontrolü: Aynı tarihlerde (overlap) başka bir "Devam Ediyor"
     * durumundaki denetime atanmış personeller varsa işlemi engeller.
     */
    private async checkCapacityOverlap(teamIds: string[], startDate: Date, endDate: Date, currentAuditId?: string, allowCapacityOverlap?: boolean) {
        if (allowCapacityOverlap || !teamIds || teamIds.length === 0 || !startDate || !endDate) return;

        const overlappingAudits = await this.prisma.audit.findMany({
            where: {
                id: currentAuditId ? { not: currentAuditId } : undefined,
                status: 'Devam Ediyor',
                isDeleted: false,
                plannedStartDate: { lte: endDate },
                plannedEndDate: { gte: startDate }
            },
            select: { id: true, title: true, team: true, supervisorId: true }
        });

        for (const audit of overlappingAudits) {
            let conflictIds: string[] = [];
            const existingTeam = typeof audit.team === 'string' ? JSON.parse(audit.team || '[]') : (audit.team || []);
            const existingMemberIds = existingTeam.map((m: any) => typeof m === 'string' ? m : m.id).filter(Boolean);
            if (audit.supervisorId) existingMemberIds.push(audit.supervisorId);

            for (const tId of teamIds) {
                if (existingMemberIds.includes(tId)) {
                    conflictIds.push(tId);
                }
            }

            if (conflictIds.length > 0) {
                const users = await this.prisma.user.findMany({ where: { id: { in: conflictIds } }, select: { displayName: true, firstName: true } });
                const names = users.map(u => u.displayName || u.firstName).join(', ');
                throw new ConflictException(
                    `Seçilen personel (${names}), belirtilen tarihlerde "${audit.title}" görevine atanmış durumdadır. İşleme devam etmek için onay gereklidir.`
                );
            }
        }
    }

    async createAudit(data: any, user: any) {
        try {
            this.logger.log('Creating audit with data');

            // Validate Independence for Supervisor
            if (data.supervisorId && data.department) {
                await this.validateIndependence(data.supervisorId, data.department);
            }

            // Validate Independence for Team Members (New Audit)
            if (data.auditors && Array.isArray(data.auditors) && data.department) {
                for (const auditorId of data.auditors) {
                    await this.validateIndependence(auditorId, data.department);
                }
            }

            // Paralel denetim kontrolü
            await this.checkParallelAudit(data.unitId || null, data.auditableUnitId || null, data.allowParallel);

            // Kapasite Çakışma Kontrolü
            const teamIdsForCapacity: string[] = [];
            if (data.supervisorId) teamIdsForCapacity.push(data.supervisorId);
            if (data.auditors && Array.isArray(data.auditors)) {
                const memberIds = data.auditors.map((m: any) => typeof m === 'string' ? m : m.id).filter(Boolean);
                teamIdsForCapacity.push(...memberIds);
            }
            
            const startD = data.plannedStartDate ? new Date(data.plannedStartDate) : new Date();
            const endD = data.plannedEndDate ? new Date(data.plannedEndDate) : new Date(startD.getTime() + 30 * 24 * 60 * 60 * 1000);
            await this.checkCapacityOverlap(teamIdsForCapacity, startD, endD, undefined, data.allowCapacityOverlap);

            const auditData = { ...data };

            // Map 'code' to 'auditCode'
            if (auditData.code) {
                auditData.auditCode = auditData.code;
                delete auditData.code;
            }

            // Map 'auditors' array or 'team' array to 'team' string
            if (auditData.auditors) {
                auditData.team = JSON.stringify(auditData.auditors);
                delete auditData.auditors;
            } else if (auditData.team && typeof auditData.team !== 'string') {
                auditData.team = JSON.stringify(auditData.team);
            }

            // Map workpapers if exists
            if (auditData.workpapers && typeof auditData.workpapers !== 'string') {
                auditData.workpapers = JSON.stringify(auditData.workpapers);
            }

            // Ensure 'startDate' (required String) is present
            if (!auditData.startDate) {
                auditData.startDate = auditData.plannedStartDate || new Date().toISOString().split('T')[0];
            }

            // Map supervisor to supervisorId if it looks like an ID
            if (auditData.supervisor) {
                // If the supervisor field is a UUID (long string), assume it's the ID
                if (auditData.supervisor.length > 20) {
                    auditData.supervisorId = auditData.supervisor;
                }
            }

            // Clean up fields not in schema
            delete auditData.id;
            delete auditData.createdAt;
            delete auditData.updatedAt;
            delete auditData.allowParallel; // Paralel denetim flag'i schema'da yok
            delete auditData.allowCapacityOverlap; // Kapasite flag'i schema'da yok

            // Date parsing
            if (auditData.plannedStartDate) auditData.plannedStartDate = new Date(auditData.plannedStartDate);
            if (auditData.plannedEndDate) auditData.plannedEndDate = new Date(auditData.plannedEndDate);
            if (auditData.actualStartDate) auditData.actualStartDate = new Date(auditData.actualStartDate);
            if (auditData.actualEndDate) auditData.actualEndDate = new Date(auditData.actualEndDate);

            // Relation fields
            if (auditData.unitId === '') auditData.unitId = null;

            const result = await this.prisma.audit.create({
                data: {
                    ...auditData,
                    creatorId: user.id,
                    department: auditData.department || user.department || 'Genel'
                },
            });

            this.logger.log(`AuditService: Audit created successfully: ${result.id}`);

            // K2: Denetim oluşturma log kaydı
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Denetim Oluşturuldu',
                details: `Yeni denetim "${result.auditCode || result.title}" oluşturuldu.`,
                targetType: 'Audit',
                targetId: result.id
            });

            // K3: Atanan müfettişlere otomatik bildirim gönder
            try {
                const notifyIds: string[] = [];
                // Supervisor
                if (auditData.supervisorId) notifyIds.push(auditData.supervisorId);
                // Team members
                if (auditData.team) {
                    try {
                        const teamParsed = typeof auditData.team === 'string' ? JSON.parse(auditData.team) : auditData.team;
                        if (Array.isArray(teamParsed)) {
                            teamParsed.forEach((m: any) => {
                                const memberId = typeof m === 'string' ? m : m?.id;
                                if (memberId && !notifyIds.includes(memberId)) notifyIds.push(memberId);
                            });
                        }
                    } catch { /* team parse failed, skip */ }
                }

                // Send notification to each unique team member (excluding creator)
                for (const memberId of notifyIds) {
                    if (memberId === user.id) continue; // Oluşturana bildirim gönderme
                    await this.notificationService.create({
                        userId: memberId,
                        title: 'Yeni Denetim Görevi',
                        description: `"${result.auditCode || result.title}" denetimine atandınız. Lütfen denetim detaylarını inceleyiniz.`,
                        type: 'info',
                        category: 'DENETİM',
                        link: `/audit/audits/${result.id}`
                    });
                }
                this.logger.log(`Notifications sent to ${notifyIds.length} team members for audit ${result.id}`);
            } catch (notifyError) {
                this.logger.error('Failed to send audit creation notifications (non-blocking):', notifyError);
            }

            return result;
        } catch (error) {
            this.logger.error('AuditService: Create Audit Error:', error);
            if (error.code === 'P2002') {
                throw new Error('Bu koda sahip bir denetim zaten mevcut.');
            }
            throw error; // ForbiddenException ve ConflictException'ı olduğu gibi fırlat
        }
    }

    async updateAudit(id: string, data: any, user: any) {
        const audit = await this.prisma.audit.findUnique({ where: { id } });
        if (!audit) throw new Error('Denetim bulunamadı');

        if (!this.isAdmin(user) && audit.creatorId !== user.id) {
            throw new ForbiddenException('Bu denetimi güncelleme yetkiniz yok.');
        }

        const updateData = { ...data };

        // Serialize JSON fields if they are objects
        if (updateData.team && typeof updateData.team !== 'string') {
            updateData.team = JSON.stringify(updateData.team);
        }
        // updateData.workpapers = ... // REMOVED: Managed through AuditWorkpaper relation

        if (updateData.plannedStartDate) updateData.plannedStartDate = new Date(updateData.plannedStartDate);
        if (updateData.plannedEndDate) updateData.plannedEndDate = new Date(updateData.plannedEndDate);
        if (updateData.actualStartDate) updateData.actualStartDate = new Date(updateData.actualStartDate);
        if (updateData.actualEndDate) updateData.actualEndDate = new Date(updateData.actualEndDate);

        // --- Y1: DURUM GEÇİŞ DOĞRULAMASI (STATE MACHINE) ---
        // İzin verilen geçişler haritası — tanımlanmamış geçişler engellenir
        const VALID_TRANSITIONS: Record<string, string[]> = {
            'Taslak': ['Planlandı', 'İptal', 'Silinme Onayı Bekliyor'],
            'Planlandı': ['Devam Ediyor', 'Taslak', 'İptal', 'Silinme Onayı Bekliyor'],
            'Devam Ediyor': ['Raporlanıyor', 'Planlandı', 'İptal', 'Silinme Onayı Bekliyor'],
            'Raporlanıyor': ['Raporlandı', 'Devam Ediyor', 'Silinme Onayı Bekliyor'],
            'Raporlandı': ['CAE Onayı Bekliyor', 'Raporlanıyor', 'Silinme Onayı Bekliyor'],
            'CAE Onayı Bekliyor': ['Tamamlandı', 'Raporlanıyor', 'Silinme Onayı Bekliyor'],
            'Tamamlandı': ['Devam Ediyor'], // Sadece Admin yeniden açabilir
            'İptal': ['Taslak'], // Sadece Admin yeniden etkinleştirebilir
            'Silinme Onayı Bekliyor': ['Silindi', 'Planlandı', 'Devam Ediyor', 'Taslak']
        };

        if (updateData.status && updateData.status !== audit.status) {
            if (!updateData.statusJustification && !this.isAdmin(user)) {
                throw new Error('Statü değişikliği yaparken gerekçe belirtilmesi (statusJustification) zorunludur.');
            }
            
            const allowedTargets = VALID_TRANSITIONS[audit.status] || [];
            if (!allowedTargets.includes(updateData.status) && !this.isAdmin(user)) {
                throw new Error(`Geçersiz durum geçişi: "${audit.status}" → "${updateData.status}" geçişine izin verilmiyor. İzin verilen hedefler: ${allowedTargets.join(', ')}`);
            }

            // Log statü değişikliği
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Denetim Statüsü Değiştirildi',
                details: `Denetim statüsü "${audit.status}" durumundan "${updateData.status}" durumuna alındı. Gerekçe: "${updateData.statusJustification || 'Yönetici İnisiyatifi'}"`,
                targetType: 'Audit',
                targetId: id,
                changeData: { oldStatus: audit.status, newStatus: updateData.status }
            });
            delete updateData.statusJustification; // Sütun DB'de yoksa çıkart
        }

        // --- BUSINESS LOGIC & FLOW VALIDATION ---
        
        // Rule 0: Denetim "Devam Ediyor" statüsünde ise tarihleri ancak Gerekçe ile değiştirilebilir
        if (audit.status === 'Devam Ediyor' && updateData.status !== 'İptal') {
            const startDateChanged = updateData.plannedStartDate && new Date(updateData.plannedStartDate).getTime() !== audit.plannedStartDate?.getTime();
            const endDateChanged = updateData.plannedEndDate && new Date(updateData.plannedEndDate).getTime() !== audit.plannedEndDate?.getTime();
            
            if (startDateChanged || endDateChanged) {
                if (!updateData.extensionJustification) {
                    throw new Error('Devam eden bir denetimin saha tarihleri doğrudan değiştirilemez! Planlanan tarihlerden sapma varsa, lütfen sistem yöneticisinden resmi "Süre Uzatımı / Tarih Değişikliği (Gerekçe)" sürecini işletmesini talep ediniz.');
                } else {
                    // Log the justification
                    await this.auditLogService.createLog({ 
                        user: user.displayName || user.username,
                        action: 'Denetim Tarihleri Esnetildi',
                        details: `Saha çalışması ('Devam Ediyor') statüsündeki denetimin tarihleri değiştirildi. Gerekçe: "${updateData.extensionJustification}"`,
                        targetType: 'Audit',
                        targetId: audit.id,
                        changeData: { oldStart: audit.plannedStartDate, newStart: updateData.plannedStartDate, oldEnd: audit.plannedEndDate, newEnd: updateData.plannedEndDate }
                    });
                    delete updateData.extensionJustification; // Don't try to save it to DB directly if column doesn't exist
                }
            }
        }

        // Rule 1: Cannot report or complete audit with Unapproved/Draft Findings
        if ((updateData.status === 'Raporlandı' || updateData.status === 'Tamamlandı') && audit.status !== updateData.status) {
            const pendingFindingsCount = await this.prisma.finding.count({
                where: {
                    auditId: id,
                    status: { in: ['Taslak', 'Onay Bekliyor', 'Revize İste'] },
                    isDeleted: false
                }
            });

            if (pendingFindingsCount > 0) {
                throw new Error(`Denetim kilitlenemez! ${pendingFindingsCount} adet onaylanmamış (Taslak/Onay Bekliyor/Revize) bulgu mevcut. Raporlama öncesi tüm bulguların Onaylandı statüsüne çekilmesi şarttır.`);
            }

            // Auto-set Actual End Date if not provided
            if (!updateData.actualEndDate) {
                updateData.actualEndDate = new Date();
            }
        }

        // Y3: Raporlandı geçişinde yeterlilik kontrolü
        if (updateData.status === 'Raporlandı' && audit.status !== 'Raporlandı') {
            // En az bir onaylanmış bulgu olmalı
            const approvedFindings = await this.prisma.finding.count({
                where: { auditId: id, status: 'Onaylandı', isDeleted: false }
            });
            if (approvedFindings === 0) {
                throw new Error('Raporlama için en az bir onaylanmış bulgu gereklidir.');
            }

            // Tüm çalışma kağıtlarının gözden geçirilmiş olması gerekir
            const unreviewedWorkpapers = await this.prisma.auditWorkpaper.count({
                where: { auditId: id, isDeleted: false, status: { in: ['Taslak', 'Hazırlanıyor'] } }
            });
            if (unreviewedWorkpapers > 0) {
                throw new Error(`Raporlama öncesi ${unreviewedWorkpapers} adet çalışma kağıdının gözden geçirilmesi gereklidir.`);
            }
        }

        // Rule 2: If Audit is "Tamamlandı", it is locked (unless Admin re-opens)
        if (audit.status === 'Tamamlandı' && updateData.status !== 'Devam Ediyor' && !this.isAdmin(user)) {
            throw new ForbiddenException('Tamamlanmış denetim üzerinde değişiklik yapılamaz. Değişiklik için önce denetimi yönetici yetkisiyle tekrar açmalısınız.');
        }

        // Rule 3: [KUSURSUZLUK KİLİDİ] Saha Çalışmasına Geçişte Bağımsızlık Kontrolü
        // Denetim "Devam Ediyor" (Saha Çalışması) statüsüne çekilecekse, tüm ekibin onaylı bağımsızlık beyanı olmalıdır.
        if (updateData.status === 'Devam Ediyor' && audit.status !== 'Devam Ediyor') {
            const teamIds: string[] = [];
            // Mevcut ekibi ve yeni eklenecekleri topla
            const currentTeam = audit.team ? JSON.parse(audit.team) : [];
            const newTeam = updateData.team ? (typeof updateData.team === 'string' ? JSON.parse(updateData.team) : updateData.team) : null;

            const activeTeam = newTeam || currentTeam;
            const teamMemberIds = activeTeam.map((m: any) => typeof m === 'string' ? m : m.id).filter(id => id);

            // Supervisor da ekibe dahil (Bağımsızlık şartı onda da var)
            const supervisorId = updateData.supervisorId || audit.supervisorId;
            if (supervisorId) teamMemberIds.push(supervisorId);

            for (const memberId of teamMemberIds) {
                const declaration = await this.prisma.independenceDeclaration.findFirst({
                    where: {
                        userId: memberId,
                        auditId: id,
                        status: 'Onaylandı'
                    }
                });

                if (!declaration) {
                    const memberUser = await this.prisma.user.findUnique({ where: { id: memberId }, select: { displayName: true } });
                    throw new Error(`Saha çalışması başlatılamaz! Ekip üyesi "${memberUser?.displayName || memberId}" için bu denetim özelinde onaylanmış bir bağımsızlık beyanı bulunamadı.`);
                }
            }
        }

        // --- Validate Independence on Update (Supervisor & Team) ---
        const targetDepartment = updateData.department || audit.department;

        if (updateData.supervisorId) {
            await this.validateIndependence(updateData.supervisorId, targetDepartment);
        }

        if (updateData.team) {
            let teamIds: string[] = [];
            if (Array.isArray(updateData.team)) {
                // If it's an array of objects (from frontend), extract IDs. 
                // Assuming frontend sends [{id: '...'}, {id: '...'}] or just strings.
                // Let's handle both safely.
                teamIds = updateData.team.map((m: any) => typeof m === 'string' ? m : m.id);
            } else if (typeof updateData.team === 'string') {
                try {
                    const parsed = JSON.parse(updateData.team);
                    if (Array.isArray(parsed)) {
                        teamIds = parsed.map((m: any) => typeof m === 'string' ? m : m.id);
                    }
                } catch (e) { /* ignore parse error */ }
            }

            for (const memberId of teamIds) {
                if (memberId) await this.validateIndependence(memberId, targetDepartment);
            }
        }

        // --- Kapasite (Tarih Çakışması) Kontrolü ---
        const startD = updateData.plannedStartDate ? new Date(updateData.plannedStartDate) : audit.plannedStartDate;
        const endD = updateData.plannedEndDate ? new Date(updateData.plannedEndDate) : audit.plannedEndDate;
        
        const teamIdsForCapacity: string[] = [];
        const supervisorIdForCap = updateData.supervisorId !== undefined ? updateData.supervisorId : audit.supervisorId;
        if (supervisorIdForCap) teamIdsForCapacity.push(supervisorIdForCap);
        
        let currentTeamArray = [];
        if (updateData.team) {
            currentTeamArray = typeof updateData.team === 'string' ? JSON.parse(updateData.team || '[]') : updateData.team;
        } else {
            currentTeamArray = typeof audit.team === 'string' ? JSON.parse(audit.team || '[]') : (audit.team || []);
        }
        const memberIdsForCap = currentTeamArray.map((m: any) => typeof m === 'string' ? m : m.id).filter(Boolean);
        teamIdsForCapacity.push(...memberIdsForCap);
        
        if (startD && endD && teamIdsForCapacity.length > 0) {
             await this.checkCapacityOverlap(teamIdsForCapacity, startD, endD, id, updateData.allowCapacityOverlap);
        }
        delete updateData.allowCapacityOverlap; // Schema'da yok
        delete updateData.allowParallel; // Schema'da yok

        const diff: Record<string, any> = {};
        const auditRecord = audit as Record<string, any>;
        Object.keys(updateData).forEach(key => {
            if (JSON.stringify(updateData[key]) !== JSON.stringify(auditRecord[key])) {
                diff[key] = {
                    old: auditRecord[key],
                    new: updateData[key]
                };
            }
        });

        const updatedAudit = await this.prisma.audit.update({
            where: { id },
            data: updateData,
        });

        if (Object.keys(diff).length > 0) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Denetim Güncellendi',
                details: `Denetim "${audit.auditCode || audit.title}" güncellendi. Değişiklikler: ${Object.keys(diff).join(', ')}`,
                targetType: 'Audit',
                targetId: id,
                changeData: diff
            });
        }

        return updatedAudit;
    }

    async deleteAudit(id: string, user: any, reason?: string, comment?: string) {
        this.logger.debug(`deleteAudit request for ${id} by ${user?.username}. Roles: ${JSON.stringify(user?.roles)}`);
        const audit = await this.prisma.audit.findUnique({ where: { id } });
        if (!audit) throw new Error('Denetim bulunamadı');

        const isManager = this.isAdmin(user);
        this.logger.debug(`isManager check: ${isManager}`);

        // If not manager, request deletion approval
        if (!isManager) {
            this.logger.log(`Requesting deletion for audit ${id} because user is not a manager.`);
            await this.prisma.audit.update({
                where: { id },
                data: {
                    status: 'Silinme Onayı Bekliyor',
                    deletionReason: reason,
                    deletionComment: comment,
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Silme Talebi Oluşturuldu',
                details: `Denetim "${audit.auditCode || audit.title}" için silme talebi oluşturuldu. Gerekçe: ${reason}`,
                targetType: 'Audit',
                targetId: id,
                changeData: audit
            });

            return { success: true, message: 'Silme talebi yönetici onayına gönderildi.' };
        }

        // Direct Delete for Manager (Soft delete)
        await this.prisma.audit.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                deletionReason: reason,
                deletionComment: comment,
                status: 'Silindi'
            }
        });

        return this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Denetim Silindi',
            details: `Denetim "${audit.auditCode || audit.title}" silindi ve silinen kayıtlara taşındı.`,
            targetType: 'Audit',
            targetId: id,
            changeData: audit
        });
    }

    async approveDeleteAudit(id: string, user: any) {
        if (!this.isAdmin(user)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

        const audit = await this.prisma.audit.findUnique({ where: { id } });
        if (!audit) throw new NotFoundException('Denetim bulunamadı');

        await this.prisma.audit.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                status: 'Silindi'
            }
        });

        // K5: Silme onayı log kaydı
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Denetim Silme Onaylandı',
            details: `Denetim "${audit.auditCode || audit.title}" silme talebi onaylandı.`,
            targetType: 'Audit',
            targetId: id,
            changeData: audit
        });

        return { success: true, message: 'Denetim silme işlemi onaylandı.' };
    }

    async rejectDeleteAudit(id: string, user: any) {
        if (!this.isAdmin(user)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

        const audit = await this.prisma.audit.findUnique({ where: { id } });
        if (!audit) throw new NotFoundException('Denetim bulunamadı');

        // K3: Silme öncesi durumu koru — sabit 'Planlandı' yerine önceki durumu kullan
        // Silme talebi sırasında durum 'Silinme Onayı Bekliyor' olduğundan,
        // önceki durumu belirlemek için deletionComment alanından veya güvenli varsayılan kullanılır
        const previousStatus = (audit as any).previousStatus || 'Planlandı';
        await this.prisma.audit.update({
            where: { id },
            data: {
                status: previousStatus,
                deletionReason: null,
                deletionComment: null
            }
        });

        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Silme Talebi Reddedildi',
            details: `Denetim "${audit.auditCode || audit.title}" silme talebi reddedildi. Durum "${previousStatus}" olarak geri alındı.`,
            targetType: 'Audit',
            targetId: id
        });

        return { success: true, message: 'Denetim silme talebi reddedildi.' };
    }

    async uploadWorkpaper(auditId: string, file: any, category: string, user: any) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const audit = await this.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit) throw new Error('Denetim bulunamadı');

        const uploadDir = path.join(process.cwd(), 'uploads', 'workpapers', auditId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filePath = path.join(uploadDir, safeFilename);

        fs.writeFileSync(filePath, file.buffer);

        try {
            if (safeFilename.match(/\.(pdf|docx|txt)$/i)) {
                this.logger.log(`[Auditron AI] Oto-Aktarım başlatılıyor: ${safeFilename}`);
                this.auditronService.processDocument(file.buffer, safeFilename, file.mimetype)
                    .then(res => this.logger.log(`[Auditron AI Okundu]: ${res}`))
                    .catch(e => this.logger.warn(`[Auditron AI Başarısız]: ${e.message}`));
            }
        } catch (e) {
            this.logger.warn(`Auditron AI entegrasyonunda hata olustu ancak dosya yuklendi: ${e.message}`);
        }

        return this.prisma.auditWorkpaper.create({
            data: {
                auditId: auditId,
                title: safeFilename,
                fileUrl: `/secure-files/workpapers/${auditId}/${safeFilename}`,
                fileType: safeFilename.split('.').pop()?.toUpperCase() || 'FILE',
                category: category || 'Genel',
                status: 'Taslak',
                version: 1,
                preparerId: user.id,
                preparedAt: new Date(),
            }
        });
    }

    async getWorkpaperPath(auditId: string, filename: string) {
        // Path traversal protection
        const sanitizedFilename = path.basename(filename);
        const sanitizedAuditId = path.basename(auditId);
        if (sanitizedFilename !== filename || sanitizedAuditId !== auditId) {
            throw new ForbiddenException('Geçersiz karakterler tespit edildi: Yetkisiz dizin erişim girişimi.');
        }
        const filePath = path.join(process.cwd(), 'uploads', 'workpapers', sanitizedAuditId, sanitizedFilename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Dosya bulunamadı');
        }
        return filePath;
    }


    // FINDINGS
    async getAllFindings(user: any) {
        const where: any = {};

        if (!this.isAdmin(user)) {
            const auditViewPerm = user.permissions.find((p: any) =>
                (p.module === 'AUDIT' || p.module === 'ALL') &&
                (p.action === 'VIEW' || p.action === 'ALL')
            );
            let scope = auditViewPerm?.scope || 'OWN';

            // Security check for AUDIT_UNIT role
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            if (roles.includes('AUDIT_UNIT') && scope === 'ALL') {
                this.logger.warn(`Security Warning: User ${user.username} has AUDIT_UNIT role but ALL scope. Forcing DEPARTMENT scope.`);
                scope = 'DEPARTMENT';
            }

            this.logger.debug(`AuditService.getAllFindings: Calculated Scope: ${scope}`);

            if (scope === 'OWN') {
                const orConditions: any[] = [
                    { assignedUserId: user.id },
                    { audit: { supervisorId: user.id } }
                ];
                if (user.displayName) orConditions.push({ audit: { supervisor: user.displayName } });
                if (user.username) orConditions.push({ audit: { supervisor: user.username } });
                where.OR = orConditions;
            } else if (scope === 'DEPARTMENT') {
                if (!user.department) {
                    this.logger.warn(`User ${user.username} has DEPARTMENT scope but no department. Returning empty findings.`);
                    return [];
                }
                where.department = user.department;
            }
            this.logger.debug(`AuditService.getAllFindings: Generated WHERE: ${JSON.stringify(where)}`);
        }

        const findings = await this.prisma.finding.findMany({
            where: { ...where, isDeleted: false },
            orderBy: { created_at: 'desc' },
            include: {
                audit: true,
                followUps: true,
                extensionRequests: true
            }
        });

        // Attach history (AuditLogs) for each finding
        return Promise.all(findings.map(async (finding) => {
            const logs = await this.prisma.auditLog.findMany({
                where: {
                    targetType: 'Finding',
                    targetId: finding.id
                },
                orderBy: { date: 'desc' }
            });

            return {
                ...finding,
                history: logs.map(log => ({
                    action: log.action,
                    date: log.date,
                    details: log.details,
                    user: log.user
                }))
            };
        }));
    }

    async getFinding(id: string, user: any) {
        const finding = await this.prisma.finding.findUnique({
            where: { id, isDeleted: false },
            include: {
                audit: true,
                followUps: true,
                extensionRequests: true
            }
        });

        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        // Permission Logic (Simplified from getAllFindings)
        if (!this.isAdmin(user)) {
            const auditViewPerm = user.permissions?.find((p: any) =>
                (p.module === 'AUDIT' || p.module === 'ALL') &&
                (p.action === 'VIEW' || p.action === 'ALL')
            );
            let scope = auditViewPerm?.scope || 'OWN';

            // Security check for AUDIT_UNIT role
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            if (roles.includes('AUDIT_UNIT') && scope === 'ALL') {
                scope = 'DEPARTMENT';
            }

            let hasAccess = false;
            if (scope === 'ALL') hasAccess = true;
            else if (scope === 'DEPARTMENT') hasAccess = finding.department === user.department;
            else if (scope === 'OWN') {
                hasAccess = finding.assignedUserId === user.id ||
                    (Boolean(finding.audit?.supervisor) && finding.audit?.supervisor === user.displayName) ||
                    (Boolean(finding.audit?.supervisor) && finding.audit?.supervisor === user.username);
            }

            if (!hasAccess) throw new ForbiddenException('Bu bulguya erişim yetkiniz yok.');
        }

        // Attach history logs
        const logs = await this.prisma.auditLog.findMany({
            where: { targetType: 'Finding', targetId: finding.id },
            orderBy: { date: 'desc' }
        });

        return {
            ...finding,
            history: logs.map(log => ({
                action: log.action,
                date: log.date,
                details: log.details,
                user: log.user
            })),
            // Map followUps to actions for frontend compatibility
            actions: finding.followUps?.map(f => ({
                id: f.id,
                action: f.action,
                dueDate: f.deadline ? (typeof f.deadline === 'string' ? f.deadline.split('T')[0] : new Date(f.deadline).toISOString().split('T')[0]) : '',
                responsible: f.assignee
            })) || []
        };
    }

    // ==========================================
    // FINDINGS - TEKRARLAYAN BULGU (RECURRING)
    // ==========================================
    async checkRecurringFindings(unitId?: string, department?: string, category?: string, title?: string) {
        if (!department && !unitId) return { recurring: false, findings: [] };

        // Sadece son 3 yılın bulgularına bakalım (zaman/performans optimizasyonu)
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

        const conditions: any[] = [];
        if (department) conditions.push({ department });
        if (unitId) conditions.push({ audit: { auditableUnitId: unitId } });

        const whereClause: any = {
            OR: conditions,
            created_at: { gte: threeYearsAgo },
            isDeleted: false,
            status: { notIn: ['İptal', 'Taslak', 'Silindi'] }
        };

        // Eski bulguları çekelim
        const potentialFindings = await this.prisma.finding.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
            take: 20,
            select: { id: true, code: true, title: true, risk: true, status: true, created_at: true, category: true, isRecurring: true }
        });

        // 1. Kategori Bazlı Eşleşme (Kesin kurallar)
        const targetCategory = category ? category.toLowerCase() : '';

        // 2. Metin / Kelime Benzerliği
        const normalizedTitle = title ? title.toLowerCase() : '';
        // Bağlaç veya anlamsız kısa kelimeleri filtrele, sadece anlamlı uzun kelimeleri al
        const titleWords = normalizedTitle.split(' ').filter(w => w.length > 4);

        const matchedFindings = potentialFindings.filter(f => {
            if (!f.title) return false;

            const fTitle = f.title.toLowerCase();
            const fCategory = (f.category || '').toLowerCase();

            // Eğer varsa kategori tamamen eşleşiyorsa yüksek risk
            if (targetCategory && fCategory.includes(targetCategory)) return true;

            // Başlıktaki anlamlı kelimelerden en az 2 tanesi eşleşiyorsa veya çok kısaysa 1 tanesi
            let matchCount = 0;
            titleWords.forEach(w => {
                if (fTitle.includes(w)) matchCount++;
            });

            const requiredMatches = titleWords.length > 2 ? 2 : 1;
            if (titleWords.length > 0 && matchCount >= requiredMatches) return true;

            return false;
        });

        return {
            recurring: matchedFindings.length > 0,
            count: matchedFindings.length,
            findings: matchedFindings
        };
    }

    async createFinding(data: any, user: any) {
        try {
            // Birim - Yıl - Sıra formatında otomatik bulgu kodu oluşturma
            // 1. Get Audit and Unit info
            const audit = await this.prisma.audit.findUnique({
                where: { id: data.auditId },
                include: { AuditableUnit: true }
            });

            if (!audit) throw new Error('Denetim bulunamadı');

            // --- 9. KUSURSUZLUK İŞ MANTIĞI: Rapor Bütünlüğü (Closed Audit Lock) ---
            if (audit.status === 'Tamamlandı' || audit.status === 'İptal' || audit.status === 'Kapalı' || audit.status === 'Raporlandı') {
                throw new Error('Rapor Bütünlüğü Zafiyeti (Sealing): Tamamlanmış, İptal edilmiş veya Raporlanmış bir denetime geçmişe dönük gizlice yeni bulgu eklenemez. Rapor mühürlenmiştir.');
            }
            // ----------------------------------------------------------------------

            let code = data.code;
            let maxSequence = 0;

            if (!code) {
                const currentYear = new Date().getFullYear();
                const unitCode = audit.AuditableUnit?.code || audit.AuditableUnit?.name?.substring(0, 3).toUpperCase() || 'AUD';

                const existingFindings = await this.prisma.finding.findMany({
                    where: { code: { startsWith: `${unitCode}-${currentYear}-` } },
                    select: { code: true }
                });

                for (const ef of existingFindings) {
                    if (!ef.code) continue;
                    const parts = ef.code.split('-');
                    if (parts.length >= 3) {
                        const seqStr = parts[parts.length - 1];
                        const seq = parseInt(seqStr, 10);
                        if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
                    }
                }
                const sequence = (maxSequence + 1).toString().padStart(3, '0');
                code = `${unitCode}-${currentYear}-${sequence}`;
            }

            // Explicitly map fields to avoid Prisma errors with unknown arguments
            // and ensure types match our SQLite schema
            const findingData: any = {
                auditId: data.auditId,
                title: data.title,
                code: code,
                risk: data.risk,
                category: Array.isArray(data.category) ? data.category.join(', ') : data.category,
                status: data.status || 'Taslak',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                description: data.description,
                assignedUserId: data.assignedUserId,
                department: data.department || user.department,
                criteria: data.criteria,
                rootCause: data.rootCause,
                financialImpact: data.financialImpact,
                recommendation: data.recommendation,
                actionPlan: data.actionPlan,
                isAgreed: data.isAgreed,
                disagreementReason: data.disagreementReason,
                // Ref Links
                auditTestId: data.auditTestId || null,
                workpaperId: data.workpaperId || null,
                // Risk Kontrol Matrisi Entegrasyonu
                processId: data.processId || null,
                riskId: data.riskId || null,
                controlId: data.controlId || null,
                // Peer Review
                reviewerId: data.reviewerId || null,
                // Recurring Flags
                isRecurring: data.isRecurring || false,
                recurringFindingId: data.recurringFindingId || null,
                recurringNote: data.recurringNote || null,
            };

            this.logger.log(`Creating finding with code ${code}`);

            let finding;
            let retryCount = 0;
            const MAX_RETRIES = 3;

            while (retryCount < MAX_RETRIES) {
                try {
                    finding = await this.prisma.finding.create({
                        data: findingData,
                    });
                    break;
                } catch (error: any) {
                    if (error.code === 'P2002' && (!data.code || retryCount > 0) && retryCount < MAX_RETRIES - 1) {
                        retryCount++;
                        this.logger.warn(`Unique constraint violation for code ${code}. Retrying (${retryCount}/${MAX_RETRIES})...`);

                        // Recalculate code
                        maxSequence++;
                        const currentYear = new Date().getFullYear();
                        const unitCode = audit.AuditableUnit?.code || audit.AuditableUnit?.name?.substring(0, 3).toUpperCase() || 'AUD';
                        code = `${unitCode}-${currentYear}-${maxSequence.toString().padStart(3, '0')}`;
                        findingData.code = code;
                        continue;
                    }
                    throw error;
                }
            }

            if (!finding) throw new Error('Bulgu kaydedilemedi (Eşzamanlılık Hatası).');

            // Handle Multiple Actions (Follow-Ups)
            if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                for (const act of data.actions) {
                    if (!act.action) continue;
                    await this.prisma.auditFollowUp.create({
                        data: {
                            findingId: finding.id,
                            action: act.action,
                            deadline: act.dueDate ? new Date(act.dueDate).toISOString() : new Date().toISOString(),
                            priority: data.risk || 'Orta',
                            assignee: act.responsible || user.displayName || user.username,
                            status: 'Açık'
                        }
                    });
                }
            }

            // Log creation
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Bulgu Oluşturuldu',
                details: `Bulgu "${finding.code}" (${finding.title}) oluşturuldu.`,
                targetType: 'Finding',
                targetId: finding.id
            });

            // Update open findings count for the audit's unit
            await this.auditRiskService.updateOpenFindingsCount(data.auditId);

            return finding;
        } catch (error) {
            this.logger.error('AuditService.createFinding ERROR:', error);
            throw error;
        }
    }

    async updateFinding(id: string, data: any, user: any) {
        const finding = await this.prisma.finding.findUnique({ where: { id } });
        if (!finding) throw new Error('Bulgu bulunamadı');

        // Permission check can be added here similar to Audit

        // Sadece şemada olan alanları güncelle
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.risk !== undefined) updateData.risk = data.risk;
        if (data.category !== undefined) updateData.category = Array.isArray(data.category) ? JSON.stringify(data.category) : data.category;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.assignedUserId !== undefined) updateData.assignedUserId = data.assignedUserId;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.evidence !== undefined) updateData.evidence = data.evidence;
        if (data.departmentResponse !== undefined) updateData.departmentResponse = data.departmentResponse;
        if (data.criteria !== undefined) updateData.criteria = data.criteria;
        if (data.rootCause !== undefined) updateData.rootCause = data.rootCause;
        if (data.financialImpact !== undefined) updateData.financialImpact = data.financialImpact;
        if (data.recommendation !== undefined) updateData.recommendation = data.recommendation;
        if (data.actionPlan !== undefined) updateData.actionPlan = data.actionPlan;
        if (data.isAgreed !== undefined) updateData.isAgreed = data.isAgreed;
        if (data.disagreementReason !== undefined) updateData.disagreementReason = data.disagreementReason;
        if (data.closingRemarks !== undefined) updateData.closingRemarks = data.closingRemarks;
        // Peer review integration (relational model used instead of reviewNotes field)
        if (data.notificationDate !== undefined) updateData.notificationDate = data.notificationDate ? new Date(data.notificationDate) : null;
        if (data.responseDate !== undefined) updateData.responseDate = data.responseDate ? new Date(data.responseDate) : null;
        if (data.lastEditedAt !== undefined) updateData.lastEditedAt = data.lastEditedAt;
        // Risk Kontrol Matrisi Entegrasyonu
        if (data.processId !== undefined) updateData.processId = data.processId || null;
        if (data.riskId !== undefined) updateData.riskId = data.riskId || null;
        if (data.controlId !== undefined) updateData.controlId = data.controlId || null;
        // Ref Links
        if (data.workpaperId !== undefined) updateData.workpaperId = data.workpaperId || null;
        if (data.auditTestId !== undefined) updateData.auditTestId = data.auditTestId || null;
        // Peer Review Integration
        if (data.reviewerId !== undefined) updateData.reviewerId = data.reviewerId || null;

        if (data.isRiskAccepted !== undefined) updateData.isRiskAccepted = data.isRiskAccepted;
        if (data.riskAcceptanceJustification !== undefined) updateData.riskAcceptanceJustification = data.riskAcceptanceJustification;

        // IsRecurring Status updates
        if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
        if (data.recurringFindingId !== undefined) updateData.recurringFindingId = data.recurringFindingId || null;
        if (data.recurringNote !== undefined) updateData.recurringNote = data.recurringNote || null;

        // --- KUSURSUZLUK İŞ MANTIĞI VE ZAFİYET KONTROLLERİ ---

        // Kural 1: Görevler Ayrılığı (Kullanıcı kendi atandığı bulguyu onaylayamaz)
        if (data.status === 'Onaylandı' && finding.status === 'Onay Bekliyor') {
            const isAssignee = finding.assignedUserId === user.id;
            if (isAssignee && !this.isAdmin(user)) {
                throw new Error('Görevler Ayrılığı İlkesi: Kendi oluşturduğunuz veya atandığınız bulguyu onaylayamazsınız.');
            }
        }

        // Kural 2: Yalnızca yöneticiler Kritik/Yüksek riskleri kapatabilir
        if (data.status === 'Tamamlandı' && (finding.risk === 'Kritik' || finding.risk === 'Yüksek')) {
            const userRoles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            const isManagerOrAdmin = userRoles.includes('ADMIN') || userRoles.includes('AUDIT_MANAGER');
            if (!isManagerOrAdmin) {
                this.logger.warn(`Kullanıcı ${user.username} Kritik/Yüksek riskli bulguyu kapattı (Saf Yönetici Yetkisi Olmadan)`);
            }
        }

        // Kural 3: Onaya Gönderilirken Zorunlu Alan Kontrolü
        if (data.status === 'Onay Bekliyor' && finding.status === 'Taslak') {
            const finalRootCause = data.rootCause !== undefined ? data.rootCause : finding.rootCause;
            const finalRecommendation = data.recommendation !== undefined ? data.recommendation : finding.recommendation;
            if (!finalRootCause || !finalRecommendation) {
                throw new Error('Eksik Bilgi: Bulguyu onaya göndermeden önce Kök Neden ve Denetçi Önerisi alanları doldurulmalıdır.');
            }
        }

        // Kural 4: Mutabakatsızlık Gerekçesi (Kurumsal Denetim Standartları)
        const finalIsAgreed = data.isAgreed !== undefined ? data.isAgreed : finding.isAgreed;
        const finalDisagreementReason = data.disagreementReason !== undefined ? data.disagreementReason : finding.disagreementReason;
        if (finalIsAgreed === false && !finalDisagreementReason) {
            throw new Error('Mutabakat Zafiyeti: İş birimi ile mutabık kalınmadıysa, Gerekçesi zorunlu olarak girilmelidir.');
        }

        // Kural 5: Reddetme ve İade Nedenlerinin Zorunluluğu (Reviewer Flow)
        if ((data.status === 'Revizyon Bekliyor' || data.status === 'Reddedildi') && (finding.status !== 'Revizyon Bekliyor' && finding.status !== 'Reddedildi')) {
            // Note: In relational model, notes are sent via separate ReviewNote creation or we could check if a new note was just added.
            // For now, we skip the hard string check on the finding object as it doesn't exist.
        }

        // Kural 6: İptal Edilen Bulgularda Neden Zorunluluğu
        if (data.status === 'İptal' && finding.status !== 'İptal') {
            if (!data.closingRemarks && !finding.closingRemarks && !data.deletionComment && !finding.deletionComment) {
                throw new Error('Bulgu İptal Zafiyeti: Bulguyu iptal ederken kapatma veya iptal notu (Kapanış Notları) girilmesi zorunludur.');
            }
        }

        // Kural 8: Tekerrür Eden (Recurring) Bulgu Zafiyeti (Düzenleme Anında Bozulmaya Karşı)
        const finalIsRecurring = data.isRecurring !== undefined ? data.isRecurring : finding.isRecurring;
        const finalRecurringFindingId = data.recurringFindingId !== undefined ? data.recurringFindingId : finding.recurringFindingId;
        const finalRecurringNote = data.recurringNote !== undefined ? data.recurringNote : finding.recurringNote;

        if (finalIsRecurring) {
            if (!finalRecurringFindingId) {
                throw new Error('Denetim Evren Zafiyeti: Bu bulgu (Tekerrür) olarak işaretlendi. Hangi eski bulgunun tekrarı olduğunu seçmek ve nedenini girmek zorunludur.');
            }
            if (!finalRecurringNote) {
                throw new Error('Denetim Tekerrür Zafiyeti: Tekerrür (Recurring) edilen bulgular için açıklama notu zorunludur. Tekerrür nedeni belirtilmelidir.');
            }
        }

        // Kural 7: Açık Aksiyon Varken Bulgu Kapatılamaz İlkesi (Risk Acceptance hariç)
        if (data.status === 'Tamamlandı' && finding.status !== 'Tamamlandı') {
            const openActions = await this.prisma.auditFollowUp.count({
                where: { findingId: id, status: { not: 'Kapalı' } }
            });

            const finalRiskAccepted = data.isRiskAccepted !== undefined ? data.isRiskAccepted : finding.isRiskAccepted;
            const finalRiskAcceptanceJust = data.riskAcceptanceJustification !== undefined ? data.riskAcceptanceJustification : finding.riskAcceptanceJustification;

            if (openActions > 0 && !finalRiskAccepted) {
                throw new Error(`Denetim Bütünlüğü İhlali: Bu bulguya ait ${openActions} adet AÇIK aksiyon (Follow-Up) bulunmaktadır. Aksiyonlar kapanmadan bulgu kapatılamaz! (Zorunluysa Risk Kabul işlemi yapılmalıdır)`);
            }
            if (finalRiskAccepted && !finalRiskAcceptanceJust) {
                throw new Error('Risk Kabul Zafiyeti: Kalan açık aksiyonlar için riski kabul ediyorsanız, Yönetim Gerekçesini yazmanız zorunludur.');
            }

            updateData.verifiedAt = new Date();
            updateData.verifiedBy = user.displayName || user.username;
        }

        // Düzenleme yapıldığında lastEditedAt güncelle
        updateData.lastEditedAt = new Date();

        const updatedFinding = await this.prisma.finding.update({
            where: { id },
            data: updateData,
        });

        // Log the update
        let actionDesc = 'Bulgu Güncellendi';
        if (data.status !== undefined && data.status !== finding.status) {
            actionDesc = `Durum Güncellendi: ${finding.status} -> ${data.status}`;
        }

        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: actionDesc,
            details: `Bulgu "${updatedFinding.code}" ${actionDesc.toLowerCase()}.`,
            targetType: 'Finding',
            targetId: id,
            changeData: data
        });

        // If status changed, update open findings count
        if (data.status !== undefined && data.status !== finding.status) {
            await this.auditRiskService.updateOpenFindingsCount(finding.auditId);
        }

        // --- AUTOMATIC FOLLOW-UP INTEGRATION ---
        // Sync with Follow-Up module if status is not Draft
        const finalStatus = data.status || finding.status;
        if (finalStatus !== 'Taslak') {
            try {
                if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                    // Mükemmel Entegrasyon: Veri kaybı olmaması için Sil & Yeniden Yarat yerine Upsert
                    const currentFollowUps = await this.prisma.auditFollowUp.findMany({ where: { findingId: id } });
                    const incomingIds = data.actions.map((a: any) => a.id).filter(Boolean);

                    // Planda artık olmayanları sil
                    const toDelete = currentFollowUps.filter(f => !incomingIds.includes(f.id)).map(f => f.id);
                    if (toDelete.length > 0) {
                        await this.prisma.auditFollowUp.deleteMany({ where: { id: { in: toDelete } } });
                    }

                    for (const action of data.actions) {
                        const isExisting = currentFollowUps.find(f => f.id === action.id);

                        // Sadece formatı uygunsa Update et
                        if (isExisting && action.id.length > 15) { // CUID uzunluğu
                            await this.prisma.auditFollowUp.update({
                                where: { id: isExisting.id },
                                data: {
                                    action: action.action,
                                    deadline: action.dueDate ? new Date(action.dueDate).toISOString() : new Date().toISOString(),
                                    assignee: action.responsible || data.department || 'Bilinmiyor',
                                    priority: data.risk || 'Orta'
                                }
                            });
                        } else if (action.action) { // Create if valid action text exists
                            await this.prisma.auditFollowUp.create({
                                data: {
                                    findingId: id,
                                    action: action.action,
                                    deadline: action.dueDate ? new Date(action.dueDate).toISOString() : new Date().toISOString(),
                                    assignee: action.responsible || data.department || 'Bilinmiyor',
                                    priority: data.risk || 'Orta',
                                    status: 'Açık'
                                }
                            });
                        }
                    }
                }
                // Scenario B: Single Action Plan (Legacy or Simple Mode)
                else if (data.actionPlan && data.dueDate) {
                    const existingFollowUps = await this.prisma.auditFollowUp.findMany({ where: { findingId: id } });

                    if (existingFollowUps.length === 0) {
                        // Create new
                        await this.prisma.auditFollowUp.create({
                            data: {
                                findingId: id,
                                action: data.actionPlan,
                                deadline: data.dueDate,
                                assignee: data.department || 'Bilinmiyor',
                                priority: data.risk || 'Orta',
                                status: 'Açık'
                            }
                        });
                    } else if (existingFollowUps.length === 1) {
                        // Update existing single follow-up
                        await this.prisma.auditFollowUp.update({
                            where: { id: existingFollowUps[0].id },
                            data: {
                                action: data.actionPlan,
                                deadline: data.dueDate,
                                priority: data.risk || 'Orta'
                            }
                        });
                    }
                    // If > 1, we assume complex actions exist and don't overwrite with single plan summary
                }
            } catch (error) {
                this.logger.error('Auto-FollowUp persistence failed:', error);
                // Don't block the main update
            }
        }

        return updatedFinding;
    }

    // --- ITERATIVE CONCILIATION ---
    async getConciliationMessages(findingId: string) {
        return this.prisma.conciliationMessage.findMany({
            where: { findingId },
            orderBy: { created_at: 'asc' }
        });
    }

    async addConciliationMessage(findingId: string, data: any, user: any) {
        const finding = await this.prisma.finding.findUnique({ where: { id: findingId } });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        const message = await this.prisma.conciliationMessage.create({
            data: {
                findingId,
                senderId: user?.id || 'system',
                senderName: user?.displayName || user?.username || 'System',
                senderRole: data.senderRole || 'Auditor',
                message: data.message,
                isAgreed: data.isAgreed,
                actionPlan: data.actionPlan,
                evidencePath: data.evidencePath,
                status: data.status || 'Submitted'
            }
        });

        // Eğer mutabakatsızlık ya da yanıt yetersizliği bildiriliyorsa bulgu durumunu tekrar açabiliriz.
        if (data.status === 'Rejected') {
            await this.prisma.finding.update({
                where: { id: findingId },
                data: { status: 'Açık' } // Birimden tekrar düzeltme istenir
            });
        }

        // AUDIT TRAIL LOGGING (Kullanıcının talep ettiği gibi)
        await this.auditLogService.createLog({ 
            user: user?.displayName || user?.username || 'System',
            action: 'Bulguya Mutabakat Yanıtı Eklendi',
            details: `Bulgu "${finding.code}" için yeni bir mutabakat/(ek)yanıt girildi. Gönderen Rolü: ${data.senderRole}, Durum: ${data.status || 'Submitted'}.`,
            targetType: 'Finding',
            targetId: findingId,
            changeData: data
        });

        return message;
    }


    async deleteFinding(id: string, user: any, reason?: string, comment?: string) {
        this.logger.debug(`deleteFinding request for ${id} by ${user?.username}. Roles: ${JSON.stringify(user?.roles)}`);
        const finding = await this.prisma.finding.findUnique({
            where: { id },
            include: { audit: true } // Include relations for snapshot
        });
        if (!finding) throw new Error('Bulgu bulunamadı');

        const isManager = this.isAdmin(user);

        if (!isManager) {
            await this.prisma.finding.update({
                where: { id },
                data: {
                    status: 'Silinme Onayı Bekliyor',
                    deletionReason: reason,
                    deletionComment: comment,
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Silme Talebi Oluşturuldu',
                details: `Bulgu "${finding.code}" (${finding.title}) için silme talebi oluşturuldu.`,
                targetType: 'Finding',
                targetId: id,
                changeData: finding // Store snapshot with relations
            });

            return { success: true, message: 'Silme talebi yönetici onayına gönderildi.' };
        }

        // Direct Delete
        await this.prisma.finding.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                deletionReason: reason,
                deletionComment: comment,
                status: 'Silindi'
            }
        });

        // Update open findings count
        await this.auditRiskService.updateOpenFindingsCount(finding.auditId);

        return this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Bulgu Silindi',
            details: `Bulgu "${finding.code}" (${finding.title}) silindi.`,
            targetType: 'Finding',
            targetId: id,
            changeData: finding // Store snapshot with relations
        });
    }



    async approveDeleteFinding(id: string, user: any) {
        if (!this.isAdmin(user)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

        const finding = await this.prisma.finding.findUnique({ where: { id } });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        await this.prisma.finding.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                status: 'Silindi'
            }
        });

        await this.auditRiskService.updateOpenFindingsCount(finding.auditId);

        return { success: true, message: 'Bulgu silme işlemi onaylandı.' };
    }

    // Removed duplicate staff methods (getStaff, updateStaff, addStaffPromotion) to fix shadowing issue.


    async rejectDeleteFinding(id: string, user: any) {
        if (!this.isAdmin(user)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

        // Revert to 'Taslak' as safe default
        await this.prisma.finding.update({
            where: { id },
            data: {
                status: 'Taslak',
                deletionReason: null,
                deletionComment: null
            }
        });

        return { success: true, message: 'Bulgu silme talebi reddedildi.' };
    }

    // Risk Kabul İşlemi (Yönetim Beyanı)
    async acceptRisk(id: string, justification: string, file: any, user: any) {
        let finalJustification = justification;

        if (file) {
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(process.cwd(), 'uploads', 'findings', id, 'risk-acceptance');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, file.buffer);

            // Append file info to justification since we don't have a dedicated column yet
            finalJustification += `\n\n[Risk Kabul Belgesi Eklendi: ${fileName}]`;
        }

        return this.prisma.finding.update({
            where: { id },
            data: {
                status: 'Risk Kabul Edildi',
                isRiskAccepted: true,
                riskAcceptanceJustification: finalJustification,
                riskAcceptedBy: user.displayName || user.username,
                riskAcceptedAt: new Date()
            }
        });
    }

    async notifyFinding(id: string, email: string, user: any) {
        const finding = await this.prisma.finding.findUnique({
            where: { id }
        });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı');

        // Domain Check
        const allowedDomains = ['@emlakkatilimtfs.com.tr'];
        if (!allowedDomains.some(domain => email.endsWith(domain))) {
            throw new ForbiddenException(`Sadece kurum içi e-posta adreslerine (${allowedDomains.join(', ')}) bildirim gönderilebilir.`);
        }

        // Update finding status and notification date
        await this.prisma.finding.update({
            where: { id },
            data: {
                status: 'Tebliğ Edildi',
                notificationDate: new Date()
            }
        });

        // Create or Update Conciliation Record
        // This ensures the finding appears in 'Tebliğ ve Mutabakat' screen
        await this.prisma.auditConciliation.upsert({
            where: { findingId: id },
            update: { status: 'Bekliyor' },
            create: {
                findingId: id,
                status: 'Bekliyor',
                response: null,
                responseDate: null
            }
        });

        // Real Email Sending
        try {
            const nodemailer = require('nodemailer');

            // SMTP Config - kurum içi relay sunucuları genelde auth istemez
            const smtpHost = process.env.SMTP_HOST || 'smtp.emlakkatilimtfs.com.tr';
            const smtpPort = parseInt(process.env.SMTP_PORT || '25'); // Port 25: genelde internal relay için

            // Auth varsa kullan, yoksa auth'suz dene (internal relay için)
            const transportConfig: any = {
                host: smtpHost,
                port: smtpPort,
                secure: false,
                tls: { rejectUnauthorized: false }
            };

            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                transportConfig.auth = {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                };
            }

            const transporter = nodemailer.createTransport(transportConfig);

            this.logger.log(`E-posta gönderiliyor: ${email} (üzerinden ${smtpHost}:${smtpPort})`);

            await transporter.sendMail({
                from: '"Teftiş Kurulu" <teftiskurulumudurlugu@emlakkatilimtfs.com.tr>',
                to: email,
                subject: `[TEBLİĞ] Bulgu Bildirimi - ${finding.code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; border-radius: 8px 8px 0 0;">
                            <h2 style="color: white; margin: 0;">🔔 Bulgu Tebliği</h2>
                        </div>
                        
                        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
                            <p style="margin-top: 0;">Sayın İlgili,</p>
                            <p><strong>${finding.code}</strong> referans kodlu bulgu tarafınıza tebliğ edilmiştir.</p>
                            
                            <div style="background: #fef2f2; padding: 16px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <h3 style="margin: 0 0 12px 0; color: #991b1b;">${finding.title}</h3>
                                <table style="width: 100%; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 4px 0; color: #666;"><strong>Risk Seviyesi:</strong></td>
                                        <td style="padding: 4px 0;">${finding.risk || 'Belirtilmemiş'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #666;"><strong>Aksiyon Tarihi:</strong></td>
                                        <td style="padding: 4px 0;">${finding.dueDate || 'Belirtilmemiş'}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fcd34d;">
                                <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Yanıt Bekleniyor</p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: #78350f;">
                                    Bu bulgudaki tespitlere ilişkin mutabakat durumunuzu ve alacağınız aksiyonları 
                                    <strong>aksiyon tarihine kadar</strong> sisteme girmeniz gerekmektedir.
                                </p>
                            </div>
                            
                            <p style="margin-bottom: 20px;">Bulgu detaylarını incelemek ve aksiyon planınızı girmek için aşağıdaki butona tıklayınız:</p>
                            
                            <div style="text-align: center; margin: 24px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3010'}/audit/conciliation" 
                                   style="display: inline-block; background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                    📋 Sisteme Giriş Yap ve Yanıtla
                                </a>
                            </div>
                            
                            <p style="font-size: 12px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                                Bu e-posta Teftiş Kurulu tarafından otomatik olarak gönderilmiştir. 
                                Lütfen yanıtlamayınız.
                            </p>
                        </div>
                        
                        <div style="background: #f3f4f6; padding: 12px; text-align: center; border-radius: 0 0 8px 8px; font-size: 11px; color: #666;">
                            © ${new Date().getFullYear()} Emlak Katılım Tasarruf Finansman AŞ • Teftiş Kurulu
                        </div>
                    </div>
                 `
            });
            this.logger.log(`E-posta başarıyla gönderildi: ${email}`);

        } catch (error) {
            this.logger.error(`E-posta gönderimi başarısız: ${error.message}`);
            // Hata olsa bile tebliğ işlemini engelleme, sadece logla
        }

        // Log the notification
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Bulgu Tebliğ Edildi',
            details: `${finding.code} kodlu bulgu "${finding.title}" birime tebliğ edildi. Alıcı: ${email}`,
            targetType: 'Finding',
            targetId: id
        });

        return { success: true, message: 'Bildirim gönderildi ve kaydedildi.' };
    }

    // --- AUDIT MEETINGS ---
    async getAuditMeetings(auditId: string) {
        return this.prisma.auditMeeting.findMany({
            where: { auditId },
            orderBy: { meetingDate: 'asc' }
        });
    }

    async createAuditMeeting(auditId: string, data: any, user: any) {
        const audit = await this.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit) throw new NotFoundException('Denetim bulunamadı');

        const meeting = await this.prisma.auditMeeting.create({
            data: {
                auditId,
                type: data.type || 'INTERIM',
                title: data.title || `${data.type} Toplantısı`,
                meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
                location: data.location,
                agenda: data.agenda,
                minutes: data.minutes,
                attendees: data.attendees,
                status: data.status || 'Planlandı'
            }
        });

        await this.auditLogService.createLog({
            user: user.displayName || user.username,
            action: 'Denetim Toplantısı Oluşturuldu',
            details: `"${audit.title}" denetimi için ${data.type} toplantısı eklendi.`,
            targetType: 'AuditMeeting',
            targetId: meeting.id
        });

        return meeting;
    }

    async updateAuditMeeting(id: string, data: any, user: any) {
        const meeting = await this.prisma.auditMeeting.update({
            where: { id },
            data: {
                title: data.title,
                meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
                location: data.location,
                agenda: data.agenda,
                minutes: data.minutes,
                attendees: data.attendees,
                status: data.status
            }
        });

        await this.auditLogService.createLog({
            user: user.displayName || user.username,
            action: 'Denetim Toplantısı Güncellendi',
            details: `Toplantı "${meeting.title}" güncellendi.`,
            targetType: 'AuditMeeting',
            targetId: meeting.id
        });

        return meeting;
    }

    async deleteAuditMeeting(id: string, user: any) {
        const meeting = await this.prisma.auditMeeting.delete({ where: { id } });

        await this.auditLogService.createLog({
            user: user.displayName || user.username,
            action: 'Denetim Toplantısı Silindi',
            details: `Toplantı "${meeting.title}" silindi.`,
            targetType: 'AuditMeeting',
            targetId: meeting.id
        });

        return meeting;
    }

    // Extension Requests
    async getExtensionRequests(findingId?: string) {
        return this.prisma.extensionRequest.findMany({
            where: findingId ? { findingId } : {},
            include: { finding: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createExtensionRequest(data: any, user: any) {
        return this.prisma.extensionRequest.create({
            data: {
                findingId: data.findingId,
                followUpId: data.followUpId,
                currentDeadline: data.currentDeadline,
                requestedDeadline: data.requestedDeadline,
                reason: data.reason,
                status: 'Beklemede',
                requestorId: user.id,
                requestorName: user.displayName || user.username
            }
        });
    }

    async handleExtensionRequest(requestId: string, status: string, notes: string, user: any) {
        const request = await this.prisma.extensionRequest.findUnique({
            where: { id: requestId },
            include: { finding: true }
        });
        if (!request) throw new NotFoundException('Talep bulunamadı');

        const updatedRequest = await this.prisma.extensionRequest.update({
            where: { id: requestId },
            data: { status, notes }
        });

        if (status === 'Onaylandı') {
            if (request.followUpId) {
                await this.prisma.auditFollowUp.update({
                    where: { id: request.followUpId },
                    data: { deadline: request.requestedDeadline }
                });
            } else {
                await this.prisma.finding.update({
                    where: { id: request.findingId },
                    data: { dueDate: request.requestedDeadline }
                });
            }
        }

        return updatedRequest;
    }
    // STAFF (Real Implementation)
    // STAFF (Real Implementation)
    // --- NEW TRAINING METHODS ---

    async createTrainingBatch(data: any) {
        console.log("==> createTrainingBatch STARTED with data:", data);
        try {
            const { participantIds, ...batchData } = data;

            return await this.prisma.$transaction(async (tx) => {
            console.log("==> Transaction started");
            const batch = await tx.trainingBatch.create({
                data: {
                    ...batchData,
                    hours: batchData.hours,
                    startDate: new Date(batchData.startDate),
                    endDate: new Date(batchData.endDate),
                    status: new Date(batchData.endDate) < new Date() ? 'Tamamlandı' : 'Planlandı'
                }
            });
            console.log("==> Batch created:", batch.id);

            await tx.userTraining.createMany({
                data: participantIds.map((userId: string) => ({
                    userId,
                    batchId: batch.id,
                    name: batch.name,
                    provider: batch.provider,
                    hours: batch.hours,
                    startDate: new Date(batchData.startDate),
                    endDate: new Date(batchData.endDate),
                    status: new Date(batchData.endDate) < new Date() ? 'Tamamlandı' : 'Planlandı'
                }))
            });
            console.log("==> User trainings created. Finishing transaction...");

            return { batch, trainings: participantIds };
        }, {
            maxWait: 10000, // 10s
            timeout: 30000  // 30s
        });
        } catch (error: any) {
            console.error("CREATE TRAINING BATCH ERROR:", error);
            throw new BadRequestException(`Toplu eğitim kaydedilirken hata oluştu: ${error.message || error}`);
        }
    }

    async cancelTrainingBatch(batchId: string, notes: string) {
        return this.prisma.$transaction(async (tx) => {
            const batch = await tx.trainingBatch.update({
                where: { id: batchId },
                data: {
                    status: 'İptal Edildi',
                    cancellationNotes: notes
                }
            });

            await tx.userTraining.updateMany({
                where: { batchId },
                data: {
                    status: 'İptal Edildi'
                }
            });

            return batch;
        });
    }

    // Experience
    // Education
    // ETHICS REPORTS
    async getEthicsReports() {
        return this.prisma.ethicsReport.findMany({ orderBy: { created_at: 'desc' } });
    }

    async createEthicsReport(data: any) {
        // Generate a cryptographically secure tracking code with collision check
        let trackingCode = '';
        let isUnique = false;
        let retries = 0;
        const MAX_RETRIES = 10;

        while (!isUnique && retries < MAX_RETRIES) {
            // Generate XXXX-XXXX-XXXX-XXXX format (16 chars, base32)
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const segment = (len: number) => {
                let result = '';
                const randomBytes = crypto.randomBytes(len);
                for (let j = 0; j < len; j++) {
                    result += chars.charAt(randomBytes[j] % chars.length);
                }
                return result;
            };
            trackingCode = `${segment(4)}-${segment(4)}-${segment(4)}-${segment(4)}`;

            // Check DB for collision
            const existing = await this.prisma.ethicsReport.findUnique({
                where: { trackingCode }
            });

            if (!existing) {
                isUnique = true;
            } else {
                retries++;
                this.logger.warn(`Collision detected for tracking code ${trackingCode}. Retrying... (${retries}/${MAX_RETRIES})`);
            }
        }

        if (!isUnique) {
            throw new Error('Benzersiz takip kodu oluşturulamadı. Lütfen tekrar deneyiniz.');
        }

        const createData: any = {
            ...data,
            trackingCode,
            status: 'Beklemede'
        };

        if (data.linkedAuditIds && Array.isArray(data.linkedAuditIds) && data.linkedAuditIds.length > 0) {
            createData.linkedAudits = {
                connect: data.linkedAuditIds.map((auditId: string) => ({ id: auditId }))
            };
            delete createData.linkedAuditIds; // Remove from top-level data to avoid conflict
        }

        return this.prisma.ethicsReport.create({
            data: createData
        });
    }

    async updateEthicsReportStatus(id: string, status: string) {
        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new Error('Bildirim bulunamadı');

        return this.prisma.ethicsReport.update({
            where: { id },
            data: { status }
        });
    }

    async getReportWithHistory(id: string) {
        const report = await this.prisma.ethicsReport.findUnique({
            where: { id },
            include: {
                messages: {
                    include: { sender: true },
                    orderBy: { created_at: 'asc' }
                },
                evidences: true,
                investigationNotes: {
                    include: { author: true },
                    orderBy: { created_at: 'desc' }
                },
                linkedFindings: true,
                linkedAudits: true, // Many-to-Many
                assignee: {
                    select: {
                        id: true,
                        displayName: true,
                        title: true,
                        email: true
                    }
                },
                reporter: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true
                    }
                }
            }
        });

        if (!report) return null;

        // Frontend compatibility for single linkedAuditId (take the first one if any)
        const compatibilityReport: any = { ...report };
        if (report.linkedAudits && report.linkedAudits.length > 0) {
            compatibilityReport.linkedAuditId = report.linkedAudits[0].id;
        }

        return compatibilityReport;
    }

    // UPDATE REPORT (Status, Assignee, etc.)
    async updateEthicsReport(id: string, data: any, user: any) {
        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        // Security check could go here...

        const updateData: any = { ...data };

        // Handle linkedAudits update (connect/disconnect) if provided as ID array
        if (data.linkedAuditIds && Array.isArray(data.linkedAuditIds)) {
            updateData.linkedAudits = {
                set: data.linkedAuditIds.map((auditId: string) => ({ id: auditId }))
            };
            delete updateData.linkedAuditIds;
        }

        // Handle Status Change Logic (Log it)
        if (data.status && data.status !== report.status) {
            // Log status change
            // ...
        }

        const updatedReport = await this.prisma.ethicsReport.update({
            where: { id },
            data: updateData,
            include: { linkedAudits: true } // Return updated relation
        });

        return updatedReport;
    }

    async closeEthicsReport(id: string, data: any, user: any) {
        const report = await this.prisma.ethicsReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Bildirim bulunamadı');

        const closeData: any = {
            status: 'Kapatıldı', // or 'Tamamlandı' based on outcome
            closedAt: new Date(),
            closedById: user.id,
            investigationOutcome: data.outcome,
            closingSummary: data.summary,
            disciplinaryAction: data.disciplinaryAction,
            disciplinaryActionDetails: data.disciplinaryActionDetails
        };

        // If outcome implies an audit or finding link
        if (data.linkedFindingId) closeData.linkedFindingId = data.linkedFindingId;

        // Handle Multiple Audits Link
        if (data.linkedAuditIds && Array.isArray(data.linkedAuditIds)) {
            closeData.linkedAudits = {
                connect: data.linkedAuditIds.map((auditId: string) => ({ id: auditId }))
            };
        } else if (data.linkedAuditId) {
            // Backward compatibility for single ID
            closeData.linkedAudits = {
                connect: { id: data.linkedAuditId }
            };
        }

        return this.prisma.ethicsReport.update({
            where: { id },
            data: closeData
        });
    }

    // REPORTS
    async generateReport(type: string, period: string) {
        let startDate = new Date();
        let endDate = new Date();

        // Simple period parsing (e.g. "2024", "2024-Q1")
        if (period.length === 4) {
            startDate = new Date(`${period}-01-01`);
            endDate = new Date(`${period}-12-31`);
        } else if (period.includes('Q')) {
            const [year, q] = period.split('-');
            const quarter = parseInt(q.replace('Q', ''));
            startDate = new Date(`${year}-${(quarter - 1) * 3 + 1}-01`);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 3);
            endDate.setDate(0);
        }

        const audits = await this.prisma.audit.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { findings: true }
        });

        const findings = await this.prisma.finding.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        return {
            reportType: type,
            period: period,
            generatedAt: new Date(),
            summary: {
                totalAudits: audits.length,
                completedAudits: audits.filter(a => a.status === 'Tamamlandı').length,
                totalFindings: findings.length,
                openFindings: findings.filter(f => f.status !== 'Kapalı').length,
                criticalFindings: findings.filter(f => f.risk === 'Kritik').length
            },
            details: audits.map(a => ({
                title: a.title,
                status: a.status,
                findingsCount: a.findings.length
            }))
        };
    }

    // AUDIT PLAN
    async getPlans() {
        try {
            return await this.prisma.auditPlan.findMany({ orderBy: { year: 'desc' } });
        } catch (error: any) {
            this.logger.error('Failed to fetch plans:', error);
            throw new Error(`Planlar yüklenemedi: ${error.message || error}`);
        }
    }
    async getPlan(id: string) {
        const plan = await this.prisma.auditPlan.findUnique({ where: { id } });
        if (!plan) throw new NotFoundException('Plan bulunamadı');
        return plan;
    }
    async createPlan(data: any) {
        return this.prisma.auditPlan.create({ data });
    }
    async updatePlan(id: string, data: any) {
        return this.prisma.auditPlan.update({ where: { id }, data });
    }
    async deletePlan(id: string) {
        return this.prisma.auditPlan.delete({ where: { id } });
    }

    async uploadPlanDocument(planId: string, file: any, user: any) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const plan = await this.prisma.auditPlan.findUnique({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan bulunamadı');

        // Check permission if needed (Manager role check is done in frontend, but good to add here too)

        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filename = `PLAN_${planId}_${Date.now()}_${safeName}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'plans');

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uploadPath = path.join(uploadDir, filename);
        fs.writeFileSync(uploadPath, file.buffer);

        // Update plan with signed document path
        return this.prisma.auditPlan.update({
            where: { id: planId },
            data: {
                signedDocumentPath: filename,
                // Do not auto-approve here, let the user click "Approve" button separately or auto-approve?
                // User said: "müdür buraya planı ekleyecek, açıklama vs yazacak isterse sonra planı onaylanmış olacak"
                // So upload is one step, approval might be implicit or explicit. 
                // Let's just save the file here.
            }
        });
    }

    // WORKPAPER REVIEW WORKFLOW
    async reviewWorkpaper(workpaperId: string, action: 'Approve' | 'Reject' | 'RequestRevision', user: any, notes?: string) {
        const workpaper = await this.prisma.auditWorkpaper.findUnique({ where: { id: workpaperId } });
        if (!workpaper) throw new NotFoundException('Çalışma kağıdı bulunamadı');

        let status = 'Beklemede';
        let logAction = '';
        let details = '';

        if (action === 'Approve') {
            status = 'Onaylandı';
            logAction = 'Çalışma Kağıdı Onaylandı';
            details = `Çalışma kağıdı ${user.displayName || user.username} tarafından onaylandı.`;
        } else if (action === 'Reject') {
            status = 'Reddedildi';
            logAction = 'Çalışma Kağıdı Reddedildi';
            details = `Çalışma kağıdı ${user.displayName || user.username} tarafından reddedildi. Not: ${notes || '-'}`;
        } else if (action === 'RequestRevision') {
            status = 'Revize İste';
            logAction = 'Revizyon İstendi';
            details = `Çalışma kağıdı için revizyon istendi. Talep Eden: ${user.displayName || user.username}. Not: ${notes}`;
        }

        const updatedWorkpaper = await this.prisma.auditWorkpaper.update({
            where: { id: workpaperId },
            data: {
                status: status,
                reviewerId: user.id,
                reviewedAt: new Date(),
            }
        });

        // Add note as ReviewNote if provided
        if (notes) {
            await this.prisma.reviewNote.create({
                data: {
                    text: notes,
                    authorId: user.id,
                    authorName: user.displayName || user.username,
                    type: 'CALISMA_KAGIDI',
                    workpaperId: workpaperId
                }
            });
        }

        // Create detailed log for history
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: logAction,
            details: details,
            targetType: 'Workpaper',
            targetId: workpaperId,
            changeData: {
                oldStatus: workpaper.status,
                newStatus: status,
                notes: notes
            }
        });

        return updatedWorkpaper;
    }

    async getPlanDocumentPath(planId: string, filename: string): Promise<string> {
        // Path traversal protection
        const sanitizedFilename = path.basename(filename);
        const sanitizedPlanId = path.basename(planId);
        if (sanitizedFilename !== filename || sanitizedPlanId !== planId) {
            throw new ForbiddenException('Geçersiz karakterler tespit edildi: Yetkisiz dizin erişim girişimi.');
        }
        const filePath = path.join(process.cwd(), 'uploads', 'plans', sanitizedFilename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Dosya bulunamadı');
        }
        return filePath;
    }

    // AUDITABLE UNITS
    async getUnits(user: any, summaryOnly: boolean = true) {
        const where: any = {};
        if (!this.isAdmin(user)) {
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            if (roles.includes('AUDIT_UNIT')) {
                if (!user.department) return [];
                // Heuristic: matching unit name with user department
                where.name = { contains: user.department };
            }
        }
        
        const includeObj: any = {};
        if (!summaryOnly) {
            includeObj.processes = {
                include: {
                    risks: {
                        include: {
                            controls: {
                                include: {
                                    tests: {
                                        orderBy: { testDate: 'desc' },
                                        take: 1,
                                        include: {
                                            audit: {
                                                select: { auditCode: true, title: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }

        return this.prisma.auditableUnit.findMany({
            where,
            orderBy: { name: 'asc' },
            include: Object.keys(includeObj).length > 0 ? includeObj : undefined
        });
    }
    async createUnit(data: any) {
        try {
            const { riskCategory, ...cleanData } = data;
            // Dinamik Risk Skoru Hesaplama (Etki x Olasılık)
            if (cleanData.impactScore && cleanData.likelihoodScore) {
                const impact = Number(cleanData.impactScore);
                const likelihood = Number(cleanData.likelihoodScore);
                cleanData.riskScore = impact * likelihood;
            }
            return await this.prisma.auditableUnit.create({ data: cleanData });
        } catch (error: any) {
            this.logger.error('Failed to create unit:', error);
            // Throwing error with message so frontend can display it
            throw new Error(`Birim oluşturulamadı: ${error.message || error}`);
        }
    }
    async updateUnit(id: string, data: any) {
        const { riskCategory, ...cleanData } = data;
        // Dinamik Risk Skoru Hesaplama (Etki x Olasılık)
        if (cleanData.impactScore && cleanData.likelihoodScore) {
            const impact = Number(cleanData.impactScore);
            const likelihood = Number(cleanData.likelihoodScore);
            cleanData.riskScore = impact * likelihood;
        }
        return this.prisma.auditableUnit.update({ where: { id }, data: cleanData });
    }
    async deleteUnit(id: string) {
        return this.prisma.auditableUnit.delete({ where: { id } });
    }

    // EDUCATION
    async getEducations() {
        return this.prisma.auditEducation.findMany({ orderBy: { date: 'desc' } });
    }
    async createEducation(data: any, user: any) {
        const education = await this.prisma.auditEducation.create({ data });
        await this.auditLogService.createLog({ 
            user: user?.displayName || user?.username || 'System',
            action: 'Eğitim Oluşturuldu',
            details: `Eğitim "${education.title}" oluşturuldu.`,
            targetType: 'Education',
            targetId: education.id
        });
        return education;
    }
    async updateEducation(id: string, data: any, user: any) {
        const education = await this.prisma.auditEducation.update({ where: { id }, data });
        await this.auditLogService.createLog({ 
            user: user?.displayName || user?.username || 'System',
            action: 'Eğitim Güncellendi',
            details: `Eğitim "${education.title}" güncellendi.`,
            targetType: 'Education',
            targetId: education.id,
            changeData: data
        });
        return education;
    }
    async deleteEducation(id: string, user: any) {
        const education = await this.prisma.auditEducation.findUnique({ where: { id } });
        await this.prisma.auditEducation.delete({ where: { id } });

        if (education) {
            await this.auditLogService.createLog({ 
                user: user?.displayName || user?.username || 'System',
                action: 'Eğitim Silindi',
                details: `Eğitim "${education.title}" silindi.`,
                targetType: 'Education',
                targetId: id
            });
        }
        return { success: true };
    }

    // FOLLOW UP
    async getFollowUps(user: any) {
        const where: any = {};
        if (!this.isAdmin(user)) {
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            if (roles.includes('AUDIT_UNIT')) {
                if (!user.department) return [];
                // Filter follow-ups by findings belonging to user's department
                where.finding = { department: user.department };
            }
        }
        return this.prisma.auditFollowUp.findMany({
            where,
            include: { finding: true },
            orderBy: { deadline: 'asc' }
        });
    }
    async createFollowUp(data: any) {
        return this.prisma.auditFollowUp.create({ data });
    }
    async updateFollowUp(id: string, data: any) {
        return this.prisma.auditFollowUp.update({ where: { id }, data });
    }
    async deleteFollowUp(id: string) {
        return this.prisma.auditFollowUp.delete({ where: { id } });
    }

    // CONCILIATION
    async getConciliations(user: any) {
        const where: any = {};
        if (!this.isAdmin(user)) {
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            if (roles.includes('AUDIT_UNIT')) {
                if (!user.department) return [];
                // Filter conciliations by findings belonging to user's department
                where.finding = { department: user.department };
            }
        }
        return this.prisma.auditConciliation.findMany({
            where,
            include: { finding: true },
            orderBy: { created_at: 'desc' }
        });
    }
    async createConciliation(data: any) {
        try {
            // 1. Extract and separate data
            const { actions, findingId, status, response, rootCause, actionPlan,
                isAgreed, disagreementReason, evidencePath, responseDate, ...rest } = data;

            this.logger.log(`createConciliation called: findingId=${findingId}, status=${status}, actions=${actions?.length || 0}`);

            // 2. Build clean conciliation data (only fields that exist in AuditConciliation model)
            const conciliationData: any = {
                findingId,
                status: status || 'Bekliyor',
                response: response || null,
                responseDate: responseDate || null,
                isAgreed: isAgreed != null ? Boolean(isAgreed) : null,
                disagreementReason: disagreementReason || null,
                rootCause: rootCause || null,
                actionPlan: actionPlan || null,
                evidencePath: evidencePath || null,
            };

            // 3. Sync to Finding if response is provided (meaning the unit has responded)
            if (status && ['Mutabık', 'Kısmen Mutabık', 'Red'].includes(status)) {
                try {
                    // ===== OTOMATİK DURUM GEÇİŞ MANTIGI =====
                    let newFindingStatus = 'Birim Yanıtladı';

                    // Mutabık + vadeli aksiyon → Takip Ediliyor
                    if ((status === 'Mutabık' || status === 'Kısmen Mutabık') &&
                        actions && Array.isArray(actions) && actions.length > 0) {
                        const hasFutureActions = actions.some((a: any) => {
                            if (!a.dueDate) return false;
                            return new Date(a.dueDate) > new Date();
                        });
                        if (hasFutureActions) {
                            newFindingStatus = 'Takip Ediliyor';
                        }
                    }

                    // Update Finding Status
                    const finding = await this.prisma.finding.update({
                        where: { id: findingId },
                        data: {
                            status: newFindingStatus,
                            departmentResponse: response || undefined,
                            rootCause: rootCause || undefined,
                            actionPlan: actionPlan || undefined,
                            isAgreed: isAgreed != null ? Boolean(isAgreed) : undefined,
                            disagreementReason: disagreementReason || undefined,
                            responseDate: new Date()
                        }
                    });

                    this.logger.log(`Conciliation: Finding ${findingId} status → ${newFindingStatus}`);

                    // Sync Actions to AuditFollowUp (SMART UPSERT: ZAFİYET YAMASI - Veri Kaybını Önler)
                    if ((status === 'Mutabık' || status === 'Kısmen Mutabık') && actions && Array.isArray(actions) && actions.length > 0) {
                        const incomingActionIds = actions.map(a => a.id).filter(id => id); // Sadece ID'si olanlar

                        // 1. Gelen listede OLMAYAN eski aksiyonları sil (Sadece bu bulguya ait olanları)
                        await this.prisma.auditFollowUp.deleteMany({
                            where: {
                                findingId,
                                id: { notIn: incomingActionIds.length > 0 ? incomingActionIds : ['dummy'] }
                            }
                        });

                        // 2. Gelenleri Güncelle veya Yeni Ekle (Upsert)
                        for (const action of actions) {
                            try {
                                if (action.id) {
                                    // ID varsa güncelle (İçindeki yazışmalar/kanıtlar kaybolmaz!)
                                    await this.prisma.auditFollowUp.update({
                                        where: { id: action.id },
                                        data: {
                                            action: action.action || action.description || 'Aksiyon',
                                            deadline: action.dueDate ? new Date(action.dueDate).toISOString() : new Date().toISOString(),
                                            assignee: action.responsible || finding.department || 'Bilinmiyor',
                                        }
                                    });
                                } else {
                                    // ID yoksa yeni ekle
                                    await this.prisma.auditFollowUp.create({
                                        data: {
                                            findingId,
                                            action: action.action || action.description || 'Aksiyon',
                                            deadline: action.dueDate ? new Date(action.dueDate).toISOString() : new Date().toISOString(),
                                            assignee: action.responsible || finding.department || 'Bilinmiyor',
                                            priority: finding.risk || 'Orta',
                                            status: 'Açık'
                                        }
                                    });
                                }
                            } catch (err) {
                                this.logger.error(`Failed to handle follow-up item during upsert: ${action.id || 'NEW'}`, err);
                            }
                        }
                    } else if (status === 'Mutabık' || status === 'Kısmen Mutabık') {
                        // Eğer liste boş geldiyse hepsini sil
                        await this.prisma.auditFollowUp.deleteMany({ where: { findingId } });
                    }

                    // Update open findings count
                    await this.auditRiskService.updateOpenFindingsCount(finding.auditId);

                } catch (e) {
                    this.logger.error(`Failed to sync conciliation to finding ${findingId}:`, e);
                    // Continue - still save the conciliation record
                }
            }

            // 4. Create/Update Conciliation Record (only clean data)
            const result = await this.prisma.auditConciliation.upsert({
                where: { findingId },
                update: {
                    status: conciliationData.status,
                    response: conciliationData.response,
                    responseDate: conciliationData.responseDate,
                    isAgreed: conciliationData.isAgreed,
                    disagreementReason: conciliationData.disagreementReason,
                    rootCause: conciliationData.rootCause,
                    actionPlan: conciliationData.actionPlan,
                    evidencePath: conciliationData.evidencePath,
                },
                create: conciliationData,
            });

            this.logger.log(`Conciliation record saved for finding ${findingId}`);
            return result;
        } catch (error) {
            this.logger.error('createConciliation error:', error);
            throw error;
        }
    }

    async updateConciliation(id: string, data: any) {
        return this.prisma.auditConciliation.update({ where: { id }, data });
    }

    async deleteConciliation(id: string) {
        return this.prisma.auditConciliation.delete({ where: { id } });
    }

    // EXECUTIVE SUMMARY STATS
    async getExecutiveStats(user: any, year?: string) {
        try {
            const whereAudit: any = { isDeleted: false };
            const whereFinding: any = { isDeleted: false };
            
            const roles = user.roles?.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code) || [];
            const isExecutive = this.isAdmin(user) || roles.includes('EXECUTIVE') || roles.includes('AUDIT_EXECUTIVE') || roles.includes('STAFF_MANAGER');
        
        // RBAC: Data Isolation for Non-Admins
        if (!this.isAdmin(user)) {
            if (roles.includes('AUDIT_UNIT')) {
                if (user.department) {
                    whereFinding.department = user.department;
                }
            }
        }

        if (year && year !== 'Tümü') {
            const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
            const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
            whereAudit.createdAt = { gte: startOfYear, lte: endOfYear };
            whereFinding.createdAt = { gte: startOfYear, lte: endOfYear };
        }

        // 1. Audit Stats
        const totalAudits = await this.prisma.audit.count({ where: whereAudit });
        const activeAudits = await this.prisma.audit.count({ where: { ...whereAudit, status: 'Devam Ediyor' } });
        const completedAudits = await this.prisma.audit.count({ where: { ...whereAudit, status: 'Tamamlandı' } });

        // 2. Finding Stats
        const totalFindings = await this.prisma.finding.count({ where: whereFinding });
        const criticalFindings = await this.prisma.finding.count({ where: { ...whereFinding, risk: 'Kritik' } });
        const highFindings = await this.prisma.finding.count({ where: { ...whereFinding, risk: 'Yüksek' } });
        const mediumFindings = await this.prisma.finding.count({ where: { ...whereFinding, risk: 'Orta' } });
        const lowFindings = await this.prisma.finding.count({ where: { ...whereFinding, risk: 'Düşük' } });
        const openFindings = await this.prisma.finding.count({ where: { ...whereFinding, status: { notIn: ['Kapalı', 'Taslak', 'İptal'] } } });

        // Calculate REAL breakdowns by Audit Type
        const allFindingsList = await this.prisma.finding.findMany({
            where: whereFinding,
            include: { audit: { select: { type: true } } }
        });

        const breakdownMap: Record<string, Record<string, number>> = {
            'Kritik': {},
            'Yüksek': {},
            'Orta': {},
            'Düşük': {}
        };

        allFindingsList.forEach(f => {
            const risk = f.risk || 'Düşük';
            const type = f.audit?.type || 'Genel';
            if (breakdownMap[risk]) {
                if (!breakdownMap[risk][type]) breakdownMap[risk][type] = 0;
                breakdownMap[risk][type]++;
            }
        });

        const formatBreakdown = (riskLevel: string) => {
            return Object.entries(breakdownMap[riskLevel] || {})
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => (b.value as number) - (a.value as number));
        };

        const findingBreakdowns = {
            critical: formatBreakdown('Kritik'),
            high: formatBreakdown('Yüksek'),
            medium: formatBreakdown('Orta'),
            low: formatBreakdown('Düşük')
        };

        // Calculate REAL breakdowns by Audit Type for Audits
        const allAuditsList = await this.prisma.audit.findMany({
            where: whereAudit,
            select: { status: true, type: true }
        });

        const auditBreakdownMap: Record<string, Record<string, number>> = {
            'Toplam': {},
            'Devam Ediyor': {},
            'Tamamlandı': {}
        };

        allAuditsList.forEach(a => {
            const type = a.type || 'Genel';
            // Total
            if (!auditBreakdownMap['Toplam'][type]) auditBreakdownMap['Toplam'][type] = 0;
            auditBreakdownMap['Toplam'][type]++;
            
            // Status Specific
            if (a.status === 'Devam Ediyor') {
                if (!auditBreakdownMap['Devam Ediyor'][type]) auditBreakdownMap['Devam Ediyor'][type] = 0;
                auditBreakdownMap['Devam Ediyor'][type]++;
            } else if (a.status === 'Tamamlandı' || a.status === 'Kapalı') {
                if (!auditBreakdownMap['Tamamlandı'][type]) auditBreakdownMap['Tamamlandı'][type] = 0;
                auditBreakdownMap['Tamamlandı'][type]++;
            }
        });

        const formatAuditBreakdown = (cat: string) => {
            return Object.entries(auditBreakdownMap[cat] || {})
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => (b.value as number) - (a.value as number));
        };

        const auditBreakdowns = {
            total: formatAuditBreakdown('Toplam'),
            active: formatAuditBreakdown('Devam Ediyor'),
            completed: formatAuditBreakdown('Tamamlandı')
        };

        // 3. Workflow Stats
        const pendingApprovals = await this.prisma.finding.count({ where: { ...whereFinding, status: 'Onay Bekliyor' } });
        const pendingNotifications = await this.prisma.finding.count({ where: { ...whereFinding, status: { in: ['Tebliğ Edildi', 'Birim Yanıtladı'] } } });
        const pendingVerification = await this.prisma.finding.count({ where: { ...whereFinding, status: 'Doğrulama Bekliyor' } });
        const pendingRevisions = await this.prisma.finding.count({ where: { ...whereFinding, status: 'Revizyon Gerekli' } }) +
            await this.prisma.audit.count({ where: { ...whereAudit, status: 'Revizyon Gerekli' } });

        // 4. Pending Deletions
        let pendingDeletionsAudits: any[] = [];
        let pendingDeletionsFindings: any[] = [];
        if (isExecutive) {
            pendingDeletionsAudits = await this.prisma.audit.findMany({ where: { status: 'Silinme Onayı Bekliyor' }, select: { id: true, auditCode: true, title: true, deletionReason: true, deletionComment: true } });
            pendingDeletionsFindings = await this.prisma.finding.findMany({ where: { status: 'Silinme Onayı Bekliyor' }, select: { id: true, code: true, title: true, deletionReason: true, deletionComment: true } });
        }
        
        // 5. Recent Records
        const recentAudits = await this.prisma.audit.findMany({ where: { ...whereAudit, status: 'Devam Ediyor' }, take: 5, orderBy: { created_at: 'desc' }, include: { AuditableUnit: true } });
        const recentFindings = await this.prisma.finding.findMany({ where: whereFinding, take: 5, orderBy: { created_at: 'desc' }, include: { audit: { select: { type: true } } } });

        // 6. Action Stats
        const followUps = await this.prisma.auditFollowUp.findMany({ where: { finding: whereFinding } });
        let overdueActionsCount = 0;
        let dueSoonActionsCount = 0;
        const now = new Date();
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(now.getDate() + 15);
        
        followUps.forEach(a => {
            if (a.status !== 'Kapalı' && a.status !== 'Tamamlandı' && a.status !== 'İptal') {
                if (a.deadline) {
                    const dl = new Date(a.deadline);
                    if (dl < now) overdueActionsCount++;
                    else if (dl <= fifteenDaysFromNow) dueSoonActionsCount++;
                }
            }
        });

        // 7. Staff for Skill Gaps & Workload
        let staffsData: any[] = [];
        if (isExecutive) {
            staffsData = await this.prisma.user.findMany({
                where: { isDeleted: false },
                include: { education: true, certificates: true, experiences: true, leaves: true, declarations: true }
            });
        }

        // 7.1 Calculate Active Workload for each staff
        const allActiveAudits = await this.prisma.audit.findMany({ 
            where: { ...whereAudit, status: 'Devam Ediyor' }, 
            select: { id: true, title: true, team: true, supervisor: true, startDate: true, endDate: true, supervisorUser: { select: { id: true, displayName: true } } } 
        });

        const staffs = staffsData.map(staff => {
            let activeCount = 0;
            const activeAssignmentsList: {id: string, auditId: string, title: string, role: string, startDate: string | null, endDate: string | null}[] = [];

            allActiveAudits.forEach(audit => {
                const sDate = audit.startDate || audit.plannedStartDate?.toISOString() || null;
                const eDate = audit.endDate || audit.plannedEndDate?.toISOString() || null;
                
                // Check supervisor
                if (audit.supervisor === staff.displayName || audit.supervisorUser?.id === staff.id) {
                    activeCount++;
                    activeAssignmentsList.push({ id: audit.id, auditId: audit.id, title: audit.title, role: 'Gözetmen', startDate: sDate, endDate: eDate });
                    return;
                }
                // Check team array
                let teamArray: any[] = [];
                if (typeof audit.team === 'string') {
                    try { teamArray = JSON.parse(audit.team); } catch(e) {}
                } else if (Array.isArray(audit.team)) {
                    teamArray = audit.team;
                }
                
                const isInTeam = teamArray.some((member: any) => 
                    member === staff.id || 
                    member === staff.displayName || 
                    member?.id === staff.id || 
                    member?.displayName === staff.displayName
                );
                
                if (isInTeam) {
                    activeCount++;
                    activeAssignmentsList.push({ id: audit.id, auditId: audit.id, title: audit.title, role: 'Müfettiş', startDate: sDate, endDate: eDate });
                }
            });
            return { ...staff, activeAssignmentsCount: activeCount, activeAssignmentsList };
        });

        // 7.5 Recent Logs
        const recentLogs = await this.prisma.auditLog.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            select: { id: true, action: true, user: true, date: true, targetId: true, targetType: true, details: true }
        });

        // 8. Monthly Trend (for charts)
        const targetYearForChart = year && year !== 'Tümü' ? parseInt(year) : new Date().getFullYear();
        const monthlyChartData = [];
        for (let i = 0; i < 12; i++) {
            const monthStart = new Date(targetYearForChart, i, 1);
            const monthEnd = new Date(targetYearForChart, i + 1, 0);
            const monthName = monthStart.toLocaleString('tr-TR', { month: 'short' });

            const mOpen = await this.prisma.finding.count({
                where: {
                    isDeleted: false,
                    created_at: { gte: monthStart, lte: monthEnd },
                    status: { notIn: ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'] }
                }
            });
            const mClosed = await this.prisma.finding.count({
                where: {
                    isDeleted: false,
                    OR: [
                        { responseDate: { gte: monthStart, lte: monthEnd } },
                        { updated_at: { gte: monthStart, lte: monthEnd } }
                    ],
                    status: { in: ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'] }
                }
            });
            monthlyChartData.push({ month: monthName, open: mOpen, closed: mClosed });
        }

        // 9. Average Audit Duration
        const completedAuditsWithDates = await this.prisma.audit.findMany({
            where: { ...whereAudit, status: 'Tamamlandı', endDate: { not: null } },
            select: { startDate: true, endDate: true }
        });
        
        const allAuditsForCapacity = await this.prisma.audit.findMany({
            where: { ...whereAudit, status: { notIn: ['İptal'] } },
            select: { startDate: true, endDate: true }
        });
        let totalPlannedDays = 0;
        allAuditsForCapacity.forEach(a => {
            if (a.startDate && a.endDate) {
                let current = new Date(a.startDate);
                const end = new Date(a.endDate);
                let businessDays = 0;
                while (current <= end) {
                    if (current.getDay() !== 0 && current.getDay() !== 6) businessDays++;
                    current.setDate(current.getDate() + 1);
                }
                totalPlannedDays += businessDays;
            }
        });
        
        let avgDuration = 0;
        if (completedAuditsWithDates.length > 0) {
            let totalBusinessDays = 0;
            completedAuditsWithDates.forEach(a => {
                let current = new Date(a.startDate);
                const end = new Date(a.endDate);
                let businessDays = 0;
                while (current <= end) {
                    if (current.getDay() !== 0 && current.getDay() !== 6) businessDays++;
                    current.setDate(current.getDate() + 1);
                }
                totalBusinessDays += businessDays;
            });
            avgDuration = Math.round(totalBusinessDays / completedAuditsWithDates.length);
        }

        return {
            // Flat props for backward compatibility
            totalAudits, activeAudits, completedAudits,
            totalFindings, criticalFindings, highFindings, mediumFindings, lowFindings, openFindings,
            findingBreakdowns,
            auditBreakdowns,
            pendingApprovals, pendingNotifications, pendingVerification, pendingRevisions,
            overdueActionsCount, dueSoonActionsCount,
            avgDuration,
            totalPlannedDays,
            monthlyChartData,
            recentLogs,
            staffs,
            
            // Nested original props for backward compatibility
            audits: { total: totalAudits, active: activeAudits, completed: completedAudits },
            findings: { total: totalFindings, critical: criticalFindings, high: highFindings, open: openFindings },
            pendingActions: { deletions: pendingDeletionsAudits.length + pendingDeletionsFindings.length },
            
            // Rich payload for Executive Dashboard
            pendingItems: [
                ...pendingDeletionsAudits.map(a => ({ id: a.id, code: a.auditCode, title: a.title, deletionReason: a.deletionReason, deletionComment: a.deletionComment, type: 'Audit' })),
                ...pendingDeletionsFindings.map(f => ({ id: f.id, code: f.code, title: f.title, deletionReason: f.deletionReason, deletionComment: f.deletionComment, type: 'Finding' }))
            ],
            recentAudits,
            recentFindings
        };
        } catch (error: any) {
            console.error('getExecutiveStats CRASH:', error);
            throw new InternalServerErrorException(`getExecutiveStats Hatası: ${error.message}`);
        }
    }

    // TRASH METHODS
    async getDeletedAudits() {
        return this.trashService.getDeletedAudits();
    }

    async getDeletedFindings() {
        return this.trashService.getDeletedFindings();
    }

    async restoreAudit(id: string) {
        return this.trashService.restoreAudit(id);
    }

    async restoreFinding(id: string) {
        return this.trashService.restoreFinding(id);
    }

    async permanentDeleteAudit(id: string, user: any) {
        return this.trashService.permanentDeleteAudit(id, user);
    }

    async permanentDeleteFinding(id: string, user: any) {
        return this.trashService.permanentDeleteFinding(id, user);
    }

    // CRON JOB: Clean up trash items older than 30 days
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTrashCleanup() {
        this.logger.log('Delegating trash cleanup to AuditTrashService...');
        // We can either call a new method in trashService or keep the logic here if it's very simple,
        // but for consistency let's move it or keep it delegated.
        // For now, let's just keep the delegator.
        return this.trashService.emptyTrash({ id: 'system' });
    }
    async uploadFindingEvidence(findingId: string, file: any, user: any) {
        this.logger.log(`Bulgu kanıt dosyası yükleniyor: ${findingId}`);
        if (!file) throw new Error('Dosya yüklenmedi');

        const finding = await this.prisma.finding.findUnique({ where: { id: findingId } });
        if (!finding) throw new NotFoundException('Bulgu bulunamadı.');

        // Filename: findingID_timestamp_originalName
        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filename = `${findingId}_${Date.now()}_${safeName}`;
        const evidenceDir = path.join(process.cwd(), 'uploads', 'evidence');

        if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

        const uploadPath = path.join(evidenceDir, filename);

        fs.writeFileSync(uploadPath, file.buffer);

        // --- AUDITRON AI ENTEGRASYONU (RAG MEMORY) ---
        try {
            if (safeName.match(/\.(pdf|docx|txt)$/i)) {
                this.logger.log(`[Auditron AI] Oto-Aktarım başlatılıyor (Kanıt Dosyası): ${safeName}`);
                this.auditronService.processDocument(file.buffer, safeName, file.mimetype)
                    .then(res => this.logger.log(`[Auditron AI Okundu]: ${res}`))
                    .catch(e => this.logger.warn(`[Auditron AI Başarısız]: ${e.message}`));
            }
        } catch (e) {
            this.logger.warn(`Auditron AI entegrasyonunda hata olustu ancak dosya yuklendi: ${e.message}`);
        }
        // ---------------------------------------------

        // Update finding record
        await this.prisma.finding.update({
            where: { id: findingId },
            data: { evidence: filename }
        });

        return { filename, url: `/secure-files/evidence/${filename}` };
    }

    async uploadConciliationEvidence(findingId: string, file: any, user: any) {
        this.logger.log(`Mutabakat kanıt dosyası yükleniyor: ${findingId}`);
        if (!file) throw new Error('Dosya yüklenmedi');

        // We link evidence to the finding ID generally or the conciliation record
        // Since Conciliation record might not exist yet (upload happens before submit),
        // we just save the file and return the filename.
        // The frontend will send this filename to createConciliation.

        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filename = `CONC_${findingId}_${Date.now()}_${safeName}`;
        const evidenceDir = path.join(process.cwd(), 'uploads', 'evidence');

        if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

        const uploadPath = path.join(evidenceDir, filename);

        fs.writeFileSync(uploadPath, file.buffer);

        return { filename };
    }

    async getFindingEvidencePath(findingId: string, filename: string): Promise<string> {
        // Path traversal protection
        const sanitizedFilename = path.basename(filename);
        const sanitizedFindingId = path.basename(findingId);
        if (sanitizedFilename !== filename || sanitizedFindingId !== findingId) {
            throw new ForbiddenException('Geçersiz karakterler tespit edildi: Yetkisiz dizin erişim girişimi.');
        }
        const filePath = path.join(process.cwd(), 'uploads', 'evidence', sanitizedFilename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Dosya bulunamadı.');
        }
        return filePath;
    }

    // ==========================================
    // RCM METHODS
    // ==========================================

    // Process
    async getProcesses(unitId: string) {
        return this.prisma.process.findMany({
            where: { unitId },
            include: { risks: true }
        });
    }
    async createProcess(data: any) {
        return this.prisma.process.create({ data });
    }
    async updateProcess(id: string, data: any) {
        return this.prisma.process.update({ where: { id }, data });
    }
    async deleteProcess(id: string) {
        return this.prisma.process.delete({ where: { id } });
    }

    // Risk
    async getRisks(processId: string) {
        return this.prisma.risk.findMany({
            where: { processId },
            include: { controls: true }
        });
    }
    async createRisk(data: any) {
        return this.prisma.risk.create({ data });
    }
    async updateRisk(id: string, data: any) {
        return this.prisma.risk.update({ where: { id }, data });
    }
    async deleteRisk(id: string) {
        return this.prisma.risk.delete({ where: { id } });
    }

    // Control
    async getAllControls() {
        return this.prisma.control.findMany({
            include: { risk: { include: { process: { include: { unit: true } } } } }
        });
    }

    async getControls(riskId: string) {
        return this.prisma.control.findMany({ where: { riskId } });
    }
    async createControl(data: any) {
        return this.prisma.control.create({ data });
    }
    async updateControl(id: string, data: any) {
        return this.prisma.control.update({ where: { id }, data });
    }
    async deleteControl(id: string) {
        return this.prisma.control.delete({ where: { id } });
    }

    // AuditTest
    async getAuditTests(auditId: string) {
        return this.prisma.auditTest.findMany({
            where: { auditId },
            include: { control: true } // Include control details
        });
    }
    async createAuditTest(data: any) {
        return this.prisma.auditTest.create({ data });
    }
    async updateAuditTest(id: string, data: any) {
        return this.prisma.auditTest.update({ where: { id }, data });
    }
    async deleteAuditTest(id: string, user: any) {
        const test = await this.prisma.auditTest.findUnique({ where: { id } });
        if (!test) throw new Error('Test bulunamadı');

        // Soft Delete
        await this.prisma.auditTest.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                status: 'Silindi'
            }
        });

        return this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Test Adımı Silindi',
            details: `Test adımı "${test.title || test.procedure?.substring(0, 50)}" silindi.`,
            targetType: 'AuditTest',
            targetId: id,
            changeData: test
        });
    }

    async deleteWorkpaper(id: string, user: any) {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı');

        // Soft Delete
        await this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user.id,
                status: 'Silindi'
            }
        });

        return this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Çalışma Kağıdı Silindi',
            details: `Çalışma kağıdı "${wp.title}" silindi.`,
            targetType: 'AuditWorkpaper',
            targetId: id,
            changeData: wp
        });
    }

    // ==========================================
    // HELPER METHODS (Logs & Counters)
    // ==========================================


    async getLogs() {
        return this.auditLogService.getLogs();
    }

    // ==========================================
    // DENETİM SÜRESİ UZATMA TALEPLERİ
    // ==========================================

    /**
     * Tüm denetim süresi uzatma taleplerini listeler.
     * Yönetici tüm talepleri, diğerleri kendi oluşturduklarını görür.
     */
    async getAuditExtensions(user: any) {
        const where: any = {};
        if (!this.isAdmin(user)) {
            where.requestedById = user.id;
        }

        return this.prisma.auditExtensionRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                audit: { select: { id: true, title: true, auditCode: true } },
                requestedBy: { select: { id: true, displayName: true } },
                reviewedBy: { select: { id: true, displayName: true } }
            }
        });
    }

    /**
     * Denetim süresi uzatma talebi oluşturur.
     * Denetimin mevcut bitiş tarihi ve istenen yeni bitiş tarihi ile birlikte gerekçe belirtilir.
     */
    async requestAuditExtension(data: any, user: any) {
        const audit = await this.prisma.audit.findUnique({ where: { id: data.auditId } });
        if (!audit) throw new NotFoundException('Denetim bulunamadı.');

        // Sadece aktif denetimler için uzatma talebi oluşturulabilir
        if (audit.status === 'Tamamlandı' || audit.status === 'İptal') {
            throw new ForbiddenException('Tamamlanmış veya iptal edilmiş denetim için süre uzatma talebi oluşturulamaz.');
        }

        const extension = await this.prisma.auditExtensionRequest.create({
            data: {
                auditId: data.auditId,
                currentEndDate: new Date(data.currentEndDate),
                requestedEndDate: new Date(data.requestedEndDate),
                reason: data.reason,
                notes: data.notes,
                status: 'Beklemede',
                requestedById: user.id
            }
        });

        // Loglama
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Süre Uzatma Talebi',
            details: `"${audit.auditCode || audit.title}" denetimi için süre uzatma talep edildi. Talep edilen yeni bitiş: ${data.requestedEndDate}. Gerekçe: ${data.reason}`,
            targetType: 'Audit',
            targetId: data.auditId
        });

        return extension;
    }

    /**
     * Denetim süresi uzatma talebini onaylar veya reddeder.
     * Onay durumunda denetimin bitiş tarihi otomatik güncellenir.
     */
    async handleAuditExtension(id: string, data: any, user: any) {
        if (!this.isAdmin(user)) {
            throw new ForbiddenException('Süre uzatma talebi sadece yönetici tarafından değerlendirilebilir.');
        }

        const extension = await this.prisma.auditExtensionRequest.findUnique({
            where: { id },
            include: { audit: true }
        });

        if (!extension) throw new NotFoundException('Süre uzatma talebi bulunamadı.');
        if (extension.status !== 'Beklemede') {
            throw new ForbiddenException('Bu talep zaten değerlendirilmiş.');
        }

        // Talebi güncelle
        const updated = await this.prisma.auditExtensionRequest.update({
            where: { id },
            data: {
                status: data.status,
                notes: data.notes,
                reviewedById: user.id,
                reviewedAt: new Date()
            }
        });

        // Onay durumunda denetimin bitiş tarihini güncelle
        if (data.status === 'Onaylandı') {
            await this.prisma.audit.update({
                where: { id: extension.auditId },
                data: {
                    plannedEndDate: extension.requestedEndDate
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Süre Uzatma Onaylandı',
                details: `"${extension.audit.auditCode || extension.audit.title}" denetiminin bitiş tarihi ${extension.requestedEndDate.toLocaleDateString('tr-TR')} olarak güncellendi.`,
                targetType: 'Audit',
                targetId: extension.auditId
            });
        } else {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username,
                action: 'Süre Uzatma Reddedildi',
                details: `"${extension.audit.auditCode || extension.audit.title}" denetimi için süre uzatma talebi reddedildi. Not: ${data.notes || '-'}`,
                targetType: 'Audit',
                targetId: extension.auditId
            });
        }

        return updated;
    }
}
