import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AdminService {
    private get db(): any { return this.prisma; }

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    // ROLES
    async getAllRoles() {
        return this.db.role.findMany({
            where: { isDeleted: false },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getDeletedRoles() {
        return this.db.role.findMany({
            where: { isDeleted: true },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: { deletedAt: 'desc' }
        });
    }

    async createRole(data: { code: string; name: string; description?: string }, user?: any) {
        const role = await this.db.role.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                description: data.description,
                isSystem: false,
                isDeleted: false
            }
        });

        const performerName = user?.displayName || user?.username || 'Sistem Yöneticisi';
        await this.auditLogService.createLog({
            user: performerName,
            action: 'ROL_OLUSTURULDU',
            details: `Yeni rol oluşturuldu: ${role.name} (${role.code})`,
            targetType: 'Role',
            targetId: role.id
        });

        return role;
    }

    async getRoleById(id: string) {
        return this.db.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    }

    async deleteRole(id: string, user?: any, reason?: string) {
        const role = await this.db.role.findUnique({ where: { id } });
        if (!role) throw new Error('Rol bulunamadı');
        if (role.isSystem) throw new Error('Sistem rolleri silinemez');

        const performerName = user?.displayName || user?.username || 'Sistem Yöneticisi';

        // Soft-delete role instead of hard delete (prevents data corruption and enables auditability & recovery)
        const result = await this.db.role.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: performerName
            }
        });

        await this.auditLogService.createLog({
            user: performerName,
            action: 'ROL_SILINDI',
            details: `"${role.name}" (${role.code}) rolü silindi (Geri Dönüşüm Kutusuna Taşındı). ${reason ? `Gerekçe: ${reason}` : ''}`,
            targetType: 'Role',
            targetId: id
        });

        return result;
    }

    async restoreRole(id: string, user?: any) {
        const role = await this.db.role.findUnique({ where: { id } });
        if (!role) throw new Error('Rol bulunamadı');
        if (!role.isDeleted) throw new Error('Bu rol zaten aktif durumda');

        const performerName = user?.displayName || user?.username || 'Sistem Yöneticisi';

        const result = await this.db.role.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null
            }
        });

        await this.auditLogService.createLog({
            user: performerName,
            action: 'ROL_GERI_YUKLENDI',
            details: `"${role.name}" (${role.code}) rolü Geri Dönüşüm Kutusundan başarıyla geri yüklendi ve aktif hale getirildi.`,
            targetType: 'Role',
            targetId: id
        });

        return result;
    }

    async updateRolePermissions(roleId: string, permissions: { permissionId: string; scope: string }[], user?: any) {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        
        // Clear existing permissions
        await this.prisma.rolePermission.deleteMany({
            where: { roleId }
        });

        // Add new permissions
        const result = await this.prisma.rolePermission.createMany({
            data: permissions.map(p => ({
                roleId,
                permissionId: p.permissionId,
                scope: p.scope || 'ALL'
            }))
        });

        const performerName = user?.displayName || user?.username || 'Sistem Yöneticisi';
        await this.auditLogService.createLog({
            user: performerName,
            action: 'ROL_YETKILERI_GUNCELLESTI',
            details: `"${role?.name || roleId}" rolüne ait yetkiler güncellendi. Toplam ${permissions.length} yetki atandı.`,
            targetType: 'Role',
            targetId: roleId,
            changeData: JSON.stringify(permissions)
        });

        return result;
    }

    // PERMISSIONS
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }]
        });
    }

    // USERS
    async getAllUsers() {
        return this.prisma.user.findMany({
            where: {
                isDeleted: false,
                isActive: true
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                department: true,
                title: true,
                isActive: true,
                roles: {
                    include: {
                        role: true
                    }
                }
            },
            orderBy: { displayName: 'asc' }
        });
    }

    async updateUserRoles(userId: string, roleIds: string[], user?: any) {
        const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
        
        await this.prisma.userRole.deleteMany({
            where: { userId }
        });

        const result = await this.prisma.userRole.createMany({
            data: roleIds.map(roleId => ({
                userId,
                roleId
            }))
        });

        // Fetch assigned roles names for clear details
        const roles = await this.prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { name: true }
        });
        const roleNames = roles.map(r => r.name).join(', ');

        const performerName = user?.displayName || user?.username || 'Sistem Yöneticisi';
        await this.auditLogService.createLog({
            user: performerName,
            action: 'KULLANICI_ROLLERINI_GUNCELLE',
            details: `"${targetUser?.displayName || targetUser?.username || userId}" kullanıcısının rolleri güncellendi. Yeni Roller: ${roleNames || 'Hiçbiri'}`,
            targetType: 'User',
            targetId: userId,
            changeData: JSON.stringify(roleIds)
        });

        return result;
    }
}
