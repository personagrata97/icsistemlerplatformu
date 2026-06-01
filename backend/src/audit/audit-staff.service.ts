import { Injectable, Logger, ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditStaffService {
    private readonly logger = new Logger(AuditStaffService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) {}

    private isAdmin(user: any) {
        return user?.roles?.includes('ADMIN') || user?.roles?.includes('SYSTEM_ADMIN') || user?.roles?.includes('AUDIT_MANAGER') || user?.roles?.includes('AUDIT_ADMIN') || user?.roles?.includes('BOARD') || user?.roles?.includes('AUDIT_SUPERVISOR');
    }

    async getStaff() {
        try {
            // Fetch users who have audit-related roles or are in the Audit department
            const users = await this.prisma.user.findMany({
                where: {
                    isDeleted: false, // Only active staff
                    OR: [
                        { department: 'Teftiş Kurulu' },
                        { department: 'İç Denetim' },
                        { roles: { some: { role: { code: { in: ['AUDIT_ADMIN', 'AUDIT_INSPECTOR', 'AUDIT_UNIT', 'ADMIN', 'AUDIT_VIEWER', 'AUDIT_SUPERVISOR'] } } } } }
                    ]
                },
                include: {
                    roles: {
                        include: {
                            role: true
                        }
                    },
                    promotions: {
                        orderBy: { promotionDate: 'desc' }
                    }
                },
                orderBy: { displayName: 'asc' }
            });

            // Map to frontend-friendly format
            return users.map(user => {
                // Determine primary role for display
                const roleObj = user.roles?.find((r: any) => r.role?.code.startsWith('AUDIT_')) || user.roles?.[0];
                let roleName = 'Müfettiş'; // Default
                if (roleObj && roleObj.role) {
                    if (roleObj.role.code === 'AUDIT_ADMIN') roleName = 'Teftiş Kurulu Müdürü';
                    else if (roleObj.role.code === 'ADMIN') roleName = 'Sistem Yöneticisi';
                    else if (roleObj.role.code === 'AUDIT_VIEWER') roleName = 'İzleyici';
                    else if (roleObj.role.code === 'AUDIT_SUPERVISOR') roleName = 'Gözetim Sorumlusu';
                }

                let certs = [];
                try {
                    if (user.certifications) {
                        // Handle case where it might be double stringified or just a string
                        if (typeof user.certifications === 'string') {
                            if (user.certifications.startsWith('[')) {
                                certs = JSON.parse(user.certifications);
                            } else {
                                // Assume simplified comma separated or single value if not JSON array
                                certs = [user.certifications];
                            }
                        }
                    }
                } catch (e) {
                    this.logger.warn(`Failed to parse certifications for user ${user.username}: ${e}`);
                    certs = [];
                }

                return {
                    id: user.id,
                    firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                    lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                    name: user.displayName || user.username,
                    title: user.title || '',
                    employeeId: user.registerNumber || user.username,
                    hireDate: user.jobStartDate || '',
                    email: user.email || '',
                    username: user.username, // Added for frontend filtering
                    phone: user.phoneNumber || '',
                    department: user.department || '',
                    status: user.isActive ? 'Aktif' : 'Pasif',
                    certifications: certs,
                    role: roleName,
                    photoUrl: user.photoUrl,
                    jobDescription: user.jobDescription || '',
                    promotions: user.promotions || []
                };
            });
        } catch (error) {
            this.logger.error('Failed to get staff list:', error);
            throw new Error('Personel listesi alınırken bir hata oluştu');
        }
    }

    async getCpeStats(year: number) {
        try {
            const staffList = await this.prisma.user.findMany({
                where: {
                    isDeleted: false,
                    OR: [
                        { department: 'Teftiş Kurulu' },
                        { department: 'İç Denetim' },
                        { roles: { some: { role: { code: { in: ['AUDIT_ADMIN', 'AUDIT_INSPECTOR', 'AUDIT_UNIT', 'ADMIN', 'AUDIT_VIEWER', 'AUDIT_SUPERVISOR'] } } } } }
                    ]
                },
                include: {
                    trainings: {
                        where: {
                            status: 'Tamamlandı'
                        }
                    }
                },
                orderBy: { displayName: 'asc' }
            });

            return staffList.map(staff => {
                // Filter current year
                const currentYearTrainings = staff.trainings.filter(t => new Date(t.startDate).getFullYear() === year);
                // Filter previous year
                const prevYearTrainings = staff.trainings.filter(t => new Date(t.startDate).getFullYear() === (year - 1));

                const currentYearHours = currentYearTrainings.reduce((sum, t) => sum + (t.hours || 0), 0);
                const prevYearHours = prevYearTrainings.reduce((sum, t) => sum + (t.hours || 0), 0);

                let trend = 'same';
                if (currentYearHours > prevYearHours) trend = 'up';
                else if (currentYearHours < prevYearHours) trend = 'down';

                return {
                    id: staff.id,
                    name: staff.displayName || staff.username,
                    title: staff.title || 'Belirtilmemiş',
                    totalHours: currentYearHours,
                    previousYearHours: prevYearHours,
                    trend: trend,
                    trainings: currentYearTrainings
                };
            });
        } catch (error) {
            this.logger.error('Failed to get CPE stats:', error);
            throw new Error('CPE istatistikleri alınırken bir hata oluştu');
        }
    }

    async createStaff(data: any) {
        // Map frontend role name to DB Role Code
        let roleCode = 'AUDIT_INSPECTOR'; // Default
        if (data.role === 'Teftiş Kurulu Müdürü' || data.role === 'Yönetici') roleCode = 'AUDIT_ADMIN';
        else if (data.role === 'Sistem Yöneticisi' || data.role === 'Admin') roleCode = 'ADMIN';
        else if (data.role === 'İzleyici') roleCode = 'AUDIT_VIEWER';
        else if (data.role === 'Gözetim Sorumlusu') roleCode = 'AUDIT_SUPERVISOR';

        const role = await this.prisma.role.findFirst({ where: { code: roleCode } });
        if (!role) {
            this.logger.warn(`Role ${roleCode} not found, defaulting to basic user creation without explicit role link if fallback fails.`);
        }

        try {
            const newUser = await this.prisma.user.create({
                data: {
                    username: data.employeeId, // Assuming employeeId is unique username
                    displayName: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    department: 'Teftiş Kurulu',
                    title: data.title,
                    registerNumber: data.employeeId,
                    phoneNumber: data.phone,
                    jobStartDate: data.hireDate,
                    jobDescription: data.jobDescription,
                    certifications: JSON.stringify(data.certifications || []),
                    isActive: data.status === 'Aktif',
                    isAdUser: false,
                    // Create relationship directly if role exists
                    roles: role ? {
                        create: {
                            roleId: role.id
                        }
                    } : undefined
                }
            });


            // Log creation
            try {
                // Ensure createLog is available or use a safe wrapper
                await this.auditLogService.createLog({ 
                    user: 'System', // Or current user if passed
                    action: 'Personel Oluşturuldu',
                    details: `Personel "${newUser.displayName}" (${newUser.username}) oluşturuldu.`,
                    targetType: 'Staff',
                    targetId: newUser.id
                });
            } catch (e) {
                this.logger.warn('Failed to log staff creation: ' + e.message);
            }

            return newUser;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException('Bu sicil numarası ile kayıtlı bir kullanıcı zaten mevcut.');
            }
            this.logger.error('Personel oluşturulurken hata:', error);
            throw new Error('Personel oluşturulamadı. Lütfen tekrar deneyiniz.');
        }
    }

    async updateStaff(id: string, data: any, user: any) {
        const userId = user?.id || user?.sub || user?.userId;
        const isSelfUpdate = userId === id;
        const isAdmin = this.isAdmin(user);

        if (!isAdmin && !isSelfUpdate) {
            this.logger.warn(`Unauthorized staff update attempt. Actor: ${userId}, Target: ${id}`);
            throw new ForbiddenException('Bu işlem sadece yöneticiler veya profil sahibi içindir.');
        }

        const staff = await this.prisma.user.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Personel bulunamadı');

        // Check if status is changing to 'Pasif'
        const isStaffActive = staff.isActive;
        const currentStatus = isStaffActive ? 'Aktif' : 'Pasif';

        if (data.status === 'Pasif' && currentStatus !== 'Pasif') {
            // Create a history record for leaving the department/role
            await this.prisma.userPromotion.create({
                data: {
                    userId: id,
                    title: staff.title || 'Belirtilmemiş',
                    previousTitle: staff.title,
                    department: staff.department, // Record the department they are leaving
                    type: data.passiveReason || 'Pasif',
                    promotionDate: new Date(),
                    endDate: new Date(),
                    notes: `Durum Pasif'e çekildi. Nedeni: ${data.passiveReason || 'Belirtilmedi'}`
                }
            });
        }

        try {
            // Update basic info
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    registerNumber: data.employeeId || data.registerNumber,
                    email: data.email,
                    phoneNumber: data.phone || data.phoneNumber,
                    displayName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.displayName,
                    title: data.title,
                    department: data.department,
                    isActive: data.status === 'Aktif' || data.isActive,
                    jobStartDate: data.hireDate ? new Date(data.hireDate).toISOString() : (data.jobStartDate || null),
                    summary: data.summary,
                    jobDescription: data.jobDescription,
                    photoUrl: data.photoUrl,
                    skills: data.skills,
                    certifications: data.certifications ? (typeof data.certifications === 'string' ? data.certifications : JSON.stringify(data.certifications)) : '[]'
                },
            });

            // Log basic update
            const currentUser = user || { username: 'System' };
            await this.auditLogService.createLog({ 
                user: currentUser.displayName || currentUser.username || 'System',
                action: 'Personel Güncellendi',
                details: `Personel "${updatedUser.displayName}" (${updatedUser.username}) bilgileri güncellendi.`,
                targetType: 'Staff',
                targetId: updatedUser.id,
                changeData: data
            });

            // Handle Role Update if provided
            if (data.role) {
                let roleCode = 'AUDIT_INSPECTOR';
                if (data.role === 'Teftiş Kurulu Müdürü' || data.role === 'Yönetici') roleCode = 'AUDIT_ADMIN';
                else if (data.role === 'Sistem Yöneticisi' || data.role === 'Admin') roleCode = 'ADMIN';
                else if (data.role === 'İzleyici') roleCode = 'AUDIT_VIEWER';
                else if (data.role === 'Gözetim Sorumlusu') roleCode = 'AUDIT_SUPERVISOR';

                const role = await this.prisma.role.findFirst({ where: { code: roleCode } });

                if (role) {
                    // Wipe existing roles and set new one
                    await this.prisma.userRole.deleteMany({ where: { userId: id } });
                    await this.prisma.userRole.create({
                        data: {
                            userId: id,
                            roleId: role.id
                        }
                    });
                }
            }

            return updatedUser;
        } catch (error) {
            this.logger.error('Personel güncellenirken hata:', error);
            throw new Error('Personel güncellenemedi.');
        }
    }

    async addStaffPromotion(id: string, data: any, user: any) {
        if (!this.isAdmin(user)) throw new ForbiddenException('Yetkisiz işlem. Sadece yöneticiler terfi ekleyebilir.');

        const staff = await this.prisma.user.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Personel bulunamadı');

        try {
            // 1. Create Promotion Record
            const promotion = await this.prisma.userPromotion.create({
                data: {
                    userId: id,
                    title: data.newTitle || data.title, // Handle both just in case
                    previousTitle: data.previousTitle || staff.title || 'Belirtilmemiş',
                    department: data.department || staff.department,
                    promotionDate: new Date(data.date || data.promotionDate),
                    type: data.type || 'Terfi',
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    notes: data.notes
                }
            });

            // 2. Update User's current title ONLY if not a temporary assignment (no endDate)
            if (!data.endDate) {
                await this.prisma.user.update({
                    where: { id },
                    data: {
                        title: data.newTitle || data.title,
                        department: data.department || staff.department
                    }
                });
            }

            // 3. Log it
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Terfi Eklendi',
                details: `Personel terfi etti: ${data.newTitle || data.title} (Eski: ${staff.title || '-'})`,
                targetType: 'Staff',
                targetId: id
            });

            return promotion;
        } catch (error) {
            this.logger.error('Terfi eklenirken hata:', error);
            throw new Error('Terfi eklenemedi.');
        }
    }

    async updateStaffPromotion(id: string, data: any, user: any) {
        const promo = await this.prisma.userPromotion.findUnique({ where: { id } });
        if (!promo) throw new NotFoundException('Terfi kaydı bulunamadı');
        // Permission check
        if (!this.isAdmin(user)) throw new ForbiddenException('Yetkisiz işlem.');

        try {
            const updatedPromo = await this.prisma.userPromotion.update({
                where: { id },
                data: {
                    title: data.title,
                    previousTitle: data.previousTitle,
                    type: data.type,
                    promotionDate: new Date(data.promotionDate),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    notes: data.notes
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Terfi Güncellendi',
                details: `Personel terfi kaydı güncellendi: ${updatedPromo.title}`,
                targetType: 'Staff',
                targetId: promo.userId,
                changeData: data
            });

            return updatedPromo;
        } catch (error) {
            this.logger.error('Terfi güncellenirken hata:', error);
            throw new Error('Terfi güncellenemedi.');
        }
    }

    async deleteStaffPromotion(id: string, user: any) {
        const promo = await this.prisma.userPromotion.findUnique({ where: { id } });
        if (!promo) throw new NotFoundException('Terfi kaydı bulunamadı');
        if (!this.isAdmin(user)) throw new ForbiddenException('Yetkisiz işlem.');

        try {
            await this.prisma.userPromotion.delete({ where: { id } });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Terfi Silindi',
                details: `Personel terfi kaydı silindi: ${promo.title}`,
                targetType: 'Staff',
                targetId: promo.userId
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Terfi silinirken hata:', error);
            throw new Error('Terfi silinemedi.');
        }
    }

    async getStaffProfile(id: string) {
        const staff = await this.prisma.user.findUnique({
            where: { id },
            include: {
                roles: { include: { role: true } },
                promotions: { orderBy: { promotionDate: 'desc' } },
                experiences: { orderBy: { startDate: 'desc' } },
                education: { orderBy: { graduationYear: 'desc' } },
                trainings: {
                    orderBy: { startDate: 'desc' },
                    include: { batch: true }
                }
            }
        });
        if (!staff) throw new NotFoundException('Personel bulunamadı');

        // Determine primary role for display
        const roleObj = staff.roles?.find((r: any) => r.role?.code.startsWith('AUDIT_')) || staff.roles?.[0];
        let roleName = 'Müfettiş';
        if (roleObj && roleObj.role) {
            if (roleObj.role.code === 'AUDIT_ADMIN') roleName = 'Teftiş Kurulu Müdürü';
            else if (roleObj.role.code === 'ADMIN') roleName = 'Sistem Yöneticisi';
            else if (roleObj.role.code === 'AUDIT_VIEWER') roleName = 'İzleyici';
            else if (roleObj.role.code === 'AUDIT_SUPERVISOR') roleName = 'Gözetim Sorumlusu';
        }

        let certs = [];
        try {
            if (staff.certifications) {
                if (typeof staff.certifications === 'string') {
                    if (staff.certifications.trim().startsWith('[')) {
                        certs = JSON.parse(staff.certifications);
                    } else if (staff.certifications.trim() !== '') {
                        certs = [staff.certifications];
                    }
                } else if (Array.isArray(staff.certifications)) {
                    certs = staff.certifications;
                }
            }
        } catch (e) {
            this.logger.warn(`Failed to parse certifications for user ${staff.username}: ${e}`);
            certs = [];
        }

        // 5. Training merging (legacy + new)
        let trainings: any[] = staff.trainings || [];
        try {
            // Check for legacy trainings if needed
            const legacyTrainings = await this.prisma.auditEducation.findMany({
                where: { status: 'Tamamlandı' }
            });
            const participantLegacy = legacyTrainings.filter(edu => {
                try {
                    const participants = JSON.parse(edu.participantList || '[]');
                    return Array.isArray(participants) && participants.includes(id);
                } catch { return false; }
            }).map(edu => ({
                id: `legacy-${edu.id}`,
                name: edu.title,
                provider: edu.provider,
                startDate: edu.date,
                endDate: edu.date,
                status: edu.status,
                isLegacy: true
            }));
            trainings = [...trainings, ...participantLegacy];
        } catch (e) {
            this.logger.warn(`Failed to fetch legacy trainings: ${e.message}`);
        }

        return {
            ...staff,
            firstName: staff.displayName ? staff.displayName.split(' ')[0] : '',
            lastName: staff.displayName ? staff.displayName.split(' ').slice(1).join(' ') : '',
            name: staff.displayName || staff.username,
            title: staff.title || '',
            employeeId: staff.registerNumber || staff.username,
            hireDate: staff.jobStartDate || '',
            email: staff.email || '',
            phone: staff.phoneNumber || '',
            status: staff.isActive ? 'Aktif' : 'Pasif',
            certifications: staff.certifications || '',
            jobDescription: staff.jobDescription || '',
            role: roleName,
            trainings: trainings
        };
    }

    async addStaffTraining(userId: string, data: any, user?: any) {
        if (user && !this.isAdmin(user) && user.id !== userId) {
            throw new ForbiddenException('Yetkisiz işlem: Başka bir personelin eğitim bilgisini ekleyemezsiniz.');
        }

        const training = await this.prisma.userTraining.create({
            data: {
                ...data,
                userId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            }
        });

        const actorName = user?.displayName || user?.username || 'System';
        await this.auditLogService.createLog({
            user: actorName,
            action: 'PERSONEL_EGITIMI_EKLENDI',
            details: `Personele yeni eğitim kaydı eklendi: "${training.name}" (${training.hours} Saat)`,
            targetType: 'Staff',
            targetId: userId,
            changeData: JSON.stringify(data)
        });

        return training;
    }

    async updateStaffTraining(id: string, data: any, user?: any) {
        const training = await this.prisma.userTraining.findUnique({ where: { id } });
        if (!training) throw new NotFoundException('Eğitim bulunamadı');

        if (user && !this.isAdmin(user) && user.id !== training.userId) {
            throw new ForbiddenException('Yetkisiz işlem: Bu eğitim kaydını güncelleme yetkiniz bulunmamaktadır.');
        }

        const updated = await this.prisma.userTraining.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            }
        });

        const actorName = user?.displayName || user?.username || 'System';
        await this.auditLogService.createLog({
            user: actorName,
            action: 'PERSONEL_EGITIMI_GUNCELLESTI',
            details: `Personel eğitim kaydı güncellendi: "${updated.name}"`,
            targetType: 'Staff',
            targetId: training.userId,
            changeData: JSON.stringify(data)
        });

        return updated;
    }

    async deleteStaffTraining(id: string, user: any) {
        const training = await this.prisma.userTraining.findUnique({ where: { id } });
        if (!training) throw new NotFoundException('Eğitim bulunamadı');
        if (!this.isAdmin(user) && user.id !== training.userId) {
            throw new ForbiddenException('Eğitim silme işlemi için yetkiniz bulunmamaktadır.');
        }

        const deleted = await this.prisma.userTraining.delete({
            where: { id }
        });

        const actorName = user?.displayName || user?.username || 'System';
        await this.auditLogService.createLog({
            user: actorName,
            action: 'PERSONEL_EGITIMI_SILINDI',
            details: `Personel eğitim kaydı silindi: "${training.name}"`,
            targetType: 'Staff',
            targetId: training.userId
        });

        return deleted;
    }

    async addStaffExperience(userId: string, data: any, user: any) {
        if (!this.isAdmin(user) && user.id !== userId) throw new ForbiddenException('Yetkisiz işlem.');
        try {
            const exp = await this.prisma.userExperience.create({
                data: {
                    userId,
                    companyName: data.companyName,
                    position: data.position,
                    department: data.department,
                    startDate: new Date(data.startDate),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    description: data.description,
                    careerPaths: data.careerPaths || '[]',
                    isCurrent: !!data.isCurrent
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Deneyimi Eklendi',
                details: `Yeni iş deneyimi eklendi: ${exp.companyName} - ${exp.position}`,
                targetType: 'Staff',
                targetId: userId,
                changeData: data
            });

            return exp;
        } catch (error) {
            throw new Error('Deneyim eklenirken hata oluştu.');
        }
    }

    async updateStaffExperience(id: string, data: any, user: any) {
        const exp = await this.prisma.userExperience.findUnique({ where: { id } });
        if (!exp) throw new NotFoundException('Deneyim bulunamadı');
        if (!this.isAdmin(user) && user.id !== exp.userId) throw new ForbiddenException('Yetkisiz işlem.');

        try {
            const updatedExp = await this.prisma.userExperience.update({
                where: { id },
                data: {
                    companyName: data.companyName,
                    position: data.position,
                    department: data.department,
                    startDate: new Date(data.startDate),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    description: data.description,
                    careerPaths: data.careerPaths || '[]',
                    isCurrent: !!data.isCurrent
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Deneyimi Güncellendi',
                details: `İş deneyimi güncellendi: ${updatedExp.companyName} - ${updatedExp.position}`,
                targetType: 'Staff',
                targetId: exp.userId,
                changeData: data
            });

            return updatedExp;
        } catch (error) {
            throw new Error('Deneyim güncellenirken hata oluştu.');
        }
    }

    async deleteStaffExperience(id: string, user: any) {
        const exp = await this.prisma.userExperience.findUnique({ where: { id } });
        if (!exp) throw new NotFoundException('Deneyim bulunamadı');
        if (!this.isAdmin(user) && user.id !== exp.userId) throw new ForbiddenException('Yetkisiz işlem.');
        try {
            await this.prisma.userExperience.delete({ where: { id } });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Deneyimi Silindi',
                details: `İş deneyimi silindi: ${exp.companyName} - ${exp.position}`,
                targetType: 'Staff',
                targetId: exp.userId
            });

            return { success: true };
        } catch (error) {
            throw new Error('Deneyim silinirken hata oluştu.');
        }
    }

    async addStaffEducation(userId: string, data: any, user: any) {
        if (!this.isAdmin(user) && user.id !== userId) throw new ForbiddenException('Yetkisiz işlem.');
        try {
            const edu = await this.prisma.userEducation.create({
                data: {
                    userId,
                    schoolName: data.schoolName,
                    faculty: data.faculty,
                    department: data.department,
                    degree: data.degree,
                    graduationYear: data.graduationYear ? parseInt(data.graduationYear) : null,
                    startDate: data.startDate ? new Date(data.startDate) : null,
                    endDate: data.endDate ? new Date(data.endDate) : null
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Eğitimi Eklendi',
                details: `Yeni eğitim bilgisi eklendi: ${edu.schoolName} - ${edu.department}`,
                targetType: 'Staff',
                targetId: userId,
                changeData: data
            });

            return edu;
        } catch (error) {
            throw new Error('Eğitim eklenirken hata oluştu.');
        }
    }

    async updateStaffEducation(id: string, data: any, user: any) {
        const edu = await this.prisma.userEducation.findUnique({ where: { id } });
        if (!edu) throw new NotFoundException('Eğitim bilgisi bulunamadı');
        if (!this.isAdmin(user) && user.id !== edu.userId) throw new ForbiddenException('Yetkisiz işlem.');

        try {
            const updatedEdu = await this.prisma.userEducation.update({
                where: { id },
                data: {
                    schoolName: data.schoolName,
                    faculty: data.faculty,
                    department: data.department,
                    degree: data.degree,
                    graduationYear: data.graduationYear ? parseInt(data.graduationYear) : null,
                    startDate: data.startDate ? new Date(data.startDate) : null,
                    endDate: data.endDate ? new Date(data.endDate) : null
                }
            });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Eğitimi Güncellendi',
                details: `Eğitim bilgisi güncellendi: ${updatedEdu.schoolName} - ${updatedEdu.department}`,
                targetType: 'Staff',
                targetId: edu.userId,
                changeData: data
            });

            return updatedEdu;
        } catch (error) {
            throw new Error('Eğitim güncellenirken hata oluştu.');
        }
    }

    async deleteStaffEducation(id: string, user: any) {
        const edu = await this.prisma.userEducation.findUnique({ where: { id } });
        if (!edu) throw new NotFoundException('Eğitim bilgisi bulunamadı');
        if (!this.isAdmin(user) && user.id !== edu.userId) throw new ForbiddenException('Yetkisiz işlem.');
        try {
            await this.prisma.userEducation.delete({ where: { id } });

            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'System',
                action: 'Personel Eğitimi Silindi',
                details: `Eğitim bilgisi silindi: ${edu.schoolName} - ${edu.department}`,
                targetType: 'Staff',
                targetId: edu.userId
            });

            return { success: true };
        } catch (error) {
            throw new Error('Eğitim silinirken hata oluştu.');
        }
    }

    async deleteStaff(id: string, user: any) {
        if (!this.isAdmin(user)) {
            throw new ForbiddenException('Personel silme işlemi için yetkiniz bulunmamaktadır.');
        }

        const staffUser = await this.prisma.user.findUnique({ where: { id } });
        if (!staffUser) throw new Error('Personel bulunamadı');

        try {
            await this.prisma.user.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    // deletedById: ... (Need context)
                    isActive: false // Also deactivate login
                }
            });

            // Log deletion
            await this.auditLogService.createLog({ 
                user: user?.displayName || user?.username || 'System',
                action: 'Personel Silindi',
                details: `Personel "${staffUser.displayName}" silindi (Çöp Kutusuna taşındı).`,
                targetType: 'Staff',
                targetId: id
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Personel silinirken hata:', error);
            throw new Error('Personel silinemedi.');
        }
    }

    async getDeletedStaff() {
        // For Trash Page
        const users = await this.prisma.user.findMany({
            where: {
                isDeleted: true,
                // Optional: Filter only Audit staff if needed, but deleted staff is deleted staff.
                // Keeping it safe by filtering generic audit roles or dept if possible,
                // but usually trash shows all deleted items relevant to context.
                // Let's stick to same logic as getStaff but isDeleted: true
                OR: [
                    { department: 'Teftiş Kurulu' },
                    { department: 'İç Denetim' },
                    { roles: { some: { role: { code: { in: ['AUDIT_ADMIN', 'AUDIT_INSPECTOR', 'AUDIT_UNIT', 'ADMIN', 'AUDIT_VIEWER'] } } } } }
                ]
            },
            orderBy: { deletedAt: 'desc' }
        });

        return users.map(user => ({
            id: user.id,
            name: user.displayName || user.username,
            deletedAt: user.deletedAt,
            // deletedBy: ...
            type: 'Personel',
            originalData: user
        }));
    }

    async restoreStaff(id: string) {
        await this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null,
                isActive: true
            }
        });

        await this.auditLogService.createLog({ 
            user: 'System',
            action: 'Personel Geri Yüklendi',
            details: `Personel ID: ${id} geri yüklendi.`,
            targetType: 'Staff',
            targetId: id
        });

        return { success: true };
    }

    async uploadStaffPhoto(file: any) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filename = `AVATAR_${Date.now()}_${safeName}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uploadPath = path.join(uploadDir, filename);
        fs.writeFileSync(uploadPath, file.buffer);

        // Return the URL path
        // Assuming there is a static file serve setup or we return the path to use with a getter
        // For now, let's return a special URL format that frontend can use via a proxy or direct static serve
        // If the backend serves static files from 'uploads', then:
        return { url: `/uploads/avatars/${filename}`, filename };
    }
}