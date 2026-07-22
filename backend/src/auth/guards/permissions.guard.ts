import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuditLogService } from '../../audit/audit-log.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(
        private reflector: Reflector,
        @Optional() private auditLogService?: AuditLogService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Skip permission check for public routes
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()]
        );

        // Eğer belirli bir yetki gerekli değilse, geçiş izni ver
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;
        
        // GOD MODE: Eğer kullanıcı AUDIT_ADMIN, ADMIN veya SYSTEM_ADMIN ise her şeye izin ver
        if (user && user.roles && (user.roles.includes('AUDIT_ADMIN') || user.roles.includes('ADMIN') || user.roles.includes('SYSTEM_ADMIN'))) {
            const path = request.url || request.path || 'Bilinmeyen Uç Nokta';
            const userName = user.displayName || user.username || 'Sistem Yöneticisi';
            this.logger.warn(`[PRIVILEGED_ACCESS_BYPASS] God Mode Yetki Geçişi: Kullanıcı: ${userName}, Uç: ${path}`);
            
            // Log privileged access bypass for compliance auditability
            this.auditLogService?.createLog({
                user: userName,
                action: 'AYRICALIKLI_ERISIM_BYPASS',
                details: `Yönetici ayrıcalığı (God Mode) ile yetki kontrolü doğrudan onaylandı. Uç Nokta: ${path}, Gerekli Yetkiler: ${requiredPermissions.map(p => `${p.module}:${p.action}`).join(', ')}`,
                targetType: 'SystemAccess',
                targetId: path
            })?.catch(err => this.logger.warn('Privileged access log kaydı başarısız:', err));

            return true;
        }

        if (!user || !user.permissions) {
            throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
        }

        // IP Adresini Audit Log için user nesnesine ekle
        user.ipAddress = request.ip || request.connection?.remoteAddress || 'Bilinmiyor';

        const hasPermission = requiredPermissions.some(required =>
            user.permissions.some((userPerm: { module: string; action: string }) =>
                (userPerm.module === required.module || userPerm.module === 'ALL') &&
                (userPerm.action === required.action || userPerm.action === 'ALL')
            )
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `Bu işlem için gerekli yetki: ${requiredPermissions.map(p => `${p.module}:${p.action}`).join(', ')}`
            );
        }

        return true;
    }
}
