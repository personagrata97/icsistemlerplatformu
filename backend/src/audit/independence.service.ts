import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class IndependenceService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    // Get all declarations (for admin)
    async getAll(filters?: { status?: string; year?: number; userId?: string }) {
        const where: Prisma.IndependenceDeclarationWhereInput = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.year) where.year = filters.year;
        if (filters?.userId) where.userId = filters.userId;

        return this.prisma.independenceDeclaration.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        title: true,
                        department: true,
                    },
                },
                audit: {
                    select: {
                        id: true,
                        title: true,
                        auditCode: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    // Get declarations for current user
    async getMyDeclarations(userId: string) {
        return this.prisma.independenceDeclaration.findMany({
            where: { userId },
            include: {
                audit: {
                    select: {
                        id: true,
                        title: true,
                        auditCode: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    // Get pending declarations (for admin review)
    async getPending() {
        return this.prisma.independenceDeclaration.findMany({
            where: { status: 'Bekliyor' },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        title: true,
                        department: true,
                    },
                },
                audit: {
                    select: {
                        id: true,
                        title: true,
                        auditCode: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    async getById(id: string) {
        const declaration = await this.prisma.independenceDeclaration.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        title: true,
                        department: true,
                    },
                },
                audit: true,
            },
        });
        if (!declaration) throw new NotFoundException('Bağımsızlık beyanı bulunamadı');
        return declaration;
    }

    // Create new declaration
    async create(user: any, data: {
        auditId?: string;
        year?: number;
        declarationType: string;
        hasConflict: boolean;
        conflictDetails?: string;
        hasFinancialLink: boolean;
        financialDetails?: string;
        hasFamilyLink: boolean;
        familyDetails?: string;
        hasPreviousRole: boolean;
        previousRoleDetails?: string;
        hasOtherIssue: boolean;
        otherIssueDetails?: string;
        status?: string;
    }) {
        const userId = user.userId || user.id;
        // Check for existing declaration
        const existing = await this.prisma.independenceDeclaration.findFirst({
            where: {
                userId,
                ...(data.auditId ? { auditId: data.auditId } : { year: data.year }),
            },
        });

        if (existing) {
            throw new ForbiddenException('Bu denetim/yıl için zaten bir bağımsızlık beyanı mevcut');
        }

        // Determine initial status based on conflicts
        const hasAnyIssue = data.hasConflict || data.hasFinancialLink ||
            data.hasFamilyLink || data.hasPreviousRole || data.hasOtherIssue;

        // If it's a positive declaration (no issues) and tagged for auto-approval (or default for quick)
        // we set it to 'Onaylandı' immediately to support the "Smart/Quick" flow.
        const initialState = hasAnyIssue ? 'Sorun Var' : (data.status === 'Onaylandı' ? 'Onaylandı' : 'Bekliyor');

        const declaration = await this.prisma.independenceDeclaration.create({
            data: {
                userId,
                auditId: data.auditId || null,
                year: data.year || null,
                declarationType: data.declarationType,
                status: initialState,
                hasConflict: data.hasConflict,
                conflictDetails: data.conflictDetails,
                hasFinancialLink: data.hasFinancialLink,
                financialDetails: data.financialDetails,
                hasFamilyLink: data.hasFamilyLink,
                familyDetails: data.familyDetails,
                hasPreviousRole: data.hasPreviousRole,
                previousRoleDetails: data.previousRoleDetails,
                hasOtherIssue: data.hasOtherIssue,
                otherIssueDetails: data.otherIssueDetails,
                declaredAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
                audit: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        
        return declaration;
    }

    // Update declaration (before review)
    async update(id: string, user: any, data: Prisma.IndependenceDeclarationUpdateInput) {
        const userId = user.userId || user.id;
        const declaration = await this.getById(id);

        // Only owner can update unless reviewed
        if (declaration.userId !== userId) {
            throw new ForbiddenException('Bu beyanı düzenleme yetkiniz yok');
        }

        if (declaration.status === 'Onaylandı') {
            throw new ForbiddenException('Onaylanmış beyan düzenlenemez');
        }

        // Recalculate status based on conflicts
        const hasAnyIssue = (data.hasConflict ?? declaration.hasConflict) ||
            (data.hasFinancialLink ?? declaration.hasFinancialLink) ||
            (data.hasFamilyLink ?? declaration.hasFamilyLink) ||
            (data.hasPreviousRole ?? declaration.hasPreviousRole) ||
            (data.hasOtherIssue ?? declaration.hasOtherIssue);

        const updated = await this.prisma.independenceDeclaration.update({
            where: { id },
            data: {
                ...data,
                status: hasAnyIssue ? 'Sorun Var' : 'Bekliyor',
            },
        });

        // Y2: Loglama
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username || 'Sistem',
            action: 'Bağımsızlık Beyanı Güncellendi',
            details: `Beyan güncellendi. Yeni durum: ${updated.status}`,
            targetType: declaration.auditId ? 'Audit' : 'IndependenceDeclaration',
            targetId: declaration.auditId || declaration.id
        });

        return updated;
    }

    // Review declaration (admin only)
    async review(id: string, user: any, data: {
        status: 'Onaylandı' | 'Sorun Var';
        reviewNotes?: string;
    }) {
        const reviewerId = user.userId || user.id;
        const declaration = await this.getById(id);

        const reviewed = await this.prisma.independenceDeclaration.update({
            where: { id },
            data: {
                status: data.status,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                reviewNotes: data.reviewNotes,
            },
        });

        // Y2: Loglama
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username || 'Sistem',
            action: 'Bağımsızlık Beyanı İncelendi',
            details: `Bağımsızlık beyanı incelendi. Yeni durum: ${data.status}`,
            targetType: declaration.auditId ? 'Audit' : 'IndependenceDeclaration',
            targetId: declaration.auditId || declaration.id
        });

        return reviewed;
    }

    // Upload signed document
    async uploadSignedDocument(id: string, filePath: string) {
        await this.getById(id);
        return this.prisma.independenceDeclaration.update({
            where: { id },
            data: { signaturePath: filePath },
        });
    }

    // Delete declaration
    async delete(id: string, user: any, isAdmin: boolean) {
        const userId = user.userId || user.id;
        const declaration = await this.getById(id);

        if (!isAdmin && declaration.userId !== userId) {
            throw new ForbiddenException('Bu beyanı silme yetkiniz yok');
        }

        if (declaration.status === 'Onaylandı') {
            throw new ForbiddenException('Onaylanmış beyan silinemez');
        }

        const result = await this.prisma.independenceDeclaration.delete({ where: { id } });

        // Y2: Loglama (Hard delete yapıldığı için silinme olayı loglanıyor)
        await this.auditLogService.createLog({ 
            user: user.displayName || user.username || 'Sistem',
            action: 'Bağımsızlık Beyanı Silindi',
            details: `Bağımsızlık beyanı silindi.`,
            targetType: declaration.auditId ? 'Audit' : 'IndependenceDeclaration',
            targetId: declaration.auditId || declaration.id // Silinmiş ID referans amaçlı loglanıyor
        });

        return result;
    }

    // Get stats
    async getStats() {
        const currentYear = new Date().getFullYear();
        const [all, pending, approved, withIssues] = await Promise.all([
            this.prisma.independenceDeclaration.count(),
            this.prisma.independenceDeclaration.count({ where: { status: 'Bekliyor' } }),
            this.prisma.independenceDeclaration.count({ where: { status: 'Onaylandı' } }),
            this.prisma.independenceDeclaration.count({ where: { status: 'Sorun Var' } }),
        ]);

        // Users who haven't declared this year
        const usersWithDeclarations = await this.prisma.independenceDeclaration.findMany({
            where: { year: currentYear },
            select: { userId: true },
        });
        const userIdsWithDeclarations = new Set(usersWithDeclarations.map(d => d.userId));

        const allAuditors = await this.prisma.user.findMany({
            where: {
                isActive: true,
                roles: {
                    some: {
                        role: {
                            code: { in: ['AUDITOR', 'AUDIT_MANAGER'] },
                        },
                    },
                },
            },
        });

        const pendingUsers = allAuditors.filter(u => !userIdsWithDeclarations.has(u.id));

        return {
            total: all,
            pending,
            approved,
            withIssues,
            currentYear,
            pendingUserCount: pendingUsers.length,
            pendingUsers: pendingUsers.map(u => ({
                id: u.id,
                displayName: u.displayName,
                email: u.email,
            })),
        };
    }
}
