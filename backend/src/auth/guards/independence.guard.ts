import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

/**
 * IIA Standart 1100 — Bağımsızlık ve Objektiflik Hard-Blocker.
 * 
 * Bu guard, denetim modülü (AUDIT) endpoint'lerine erişim isteyen kullanıcıların
 * o yıla ait bağımsızlık beyanı (IndependenceDeclaration) olup olmadığını kontrol eder.
 * Beyanı olmayan veya "Sorun Var" statüsündeki kullanıcılar denetim verilerine erişemez.
 * 
 * BDDK Bilgi Sistemleri Tebliği Madde 14: Görevler Ayrılığı kapsamında da
 * çıkar çatışması bulunan personelin ilgili denetime erişimini engeller.
 */
@Injectable()
export class IndependenceGuard implements CanActivate {
    private readonly logger = new Logger(IndependenceGuard.name);

    constructor(
        private prisma: PrismaService,
        private reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Public route'ları atla
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Kullanıcı yoksa (JWT guard zaten yakalamış olmalı)
        if (!user) return true;

        // Admin kullanıcılar için bağımsızlık kontrolü atlanabilir (Denetim Komitesi üyeleri vb.)
        const roleCodes = (user.roles || []).map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code);
        if (roleCodes.includes('ADMIN') || roleCodes.includes('AUDIT_COMMITTEE')) {
            return true;
        }

        // Sadece AUDITOR ve AUDIT_MANAGER rollerini kontrol et
        const isAuditor = roleCodes.includes('AUDITOR') || roleCodes.includes('AUDIT_MANAGER');
        if (!isAuditor) {
            // Denetçi olmayan kullanıcılar (birim kullanıcıları vb.) bu guard'dan muaf
            return true;
        }

        // Bu yılın bağımsızlık beyanını kontrol et
        const currentYear = new Date().getFullYear();
        const userId = user.userId || user.id;

        const declaration = await this.prisma.independenceDeclaration.findFirst({
            where: {
                userId,
                year: currentYear,
                status: { in: ['Onaylandı', 'Bekliyor'] }
            }
        });

        if (!declaration) {
            this.logger.warn(
                `[IIA 1100 HARD-BLOCKER] Kullanıcı ${user.displayName || user.username} (${userId}) ` +
                `${currentYear} yılı bağımsızlık beyanı olmadan denetim verilerine erişmeye çalıştı.`
            );
            throw new ForbiddenException(
                `${currentYear} yılına ait bağımsızlık beyanınız bulunmamaktadır. ` +
                `Denetim verilerine erişebilmek için önce Bağımsızlık Beyanı modülünden beyanınızı tamamlayınız. ` +
                `(IIA Standart 1100 — Bağımsızlık ve Objektiflik)`
            );
        }

        // Beyanı "Sorun Var" ise özel uyarı
        if (declaration.status === 'Sorun Var') {
            this.logger.warn(
                `[IIA 1130] Kullanıcı ${user.displayName || user.username} bağımsızlık beyanında çıkar çatışması bildirmiş.`
            );
            // Çıkar çatışması olan kullanıcıya okuma izni ver ama uyar
            // (Tam engel yerine audit-bazlı engel daha doğru olabilir — şimdilik geçiyor)
        }

        // Denetim-bazlı bağımsızlık kontrolü (URL'de auditId varsa)
        const auditId = request.params?.auditId || request.params?.id;
        if (auditId && declaration.hasConflict) {
            // Bu spesifik denetim için bağımsızlık sorunu var mı?
            const auditDeclaration = await this.prisma.independenceDeclaration.findFirst({
                where: {
                    userId,
                    auditId,
                    hasConflict: true
                }
            });

            if (auditDeclaration) {
                throw new ForbiddenException(
                    `Bu denetime (${auditId}) yönelik çıkar çatışması beyanınız bulunmaktadır. ` +
                    `Bağımsızlık ilkesi gereği bu denetim verilerine erişiminiz engellenmiştir. ` +
                    `(IIA Standart 1130)`
                );
            }
        }

        return true;
    }
}
