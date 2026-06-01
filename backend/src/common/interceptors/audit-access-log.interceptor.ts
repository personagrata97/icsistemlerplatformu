import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma.service';

/**
 * Veri Erişim Loglaması Interceptor'ı
 * 
 * Hassas endpoint'lere yapılan GET isteklerini loglar.
 * Kimin hangi kaydı görüntülediğini takip eder.
 * 
 * Loglanan endpoint'ler:
 * - /audit/findings/:id (Bulgu detayı)
 * - /audit/ethics/:id (Etik rapor detayı)
 * - /audit/staff/:id (Personel profili)
 * - /audit/:id (Denetim detayı)
 */
@Injectable()
export class AuditAccessLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditAccessLogInterceptor.name);

    // Loglama yapılacak endpoint pattern'leri
    private readonly sensitivePatterns = [
        { pattern: /^\/audit\/findings\/[^\/]+$/, targetType: 'Finding' },
        { pattern: /^\/audit\/ethics\/reports/, targetType: 'EthicsReport' },
        { pattern: /^\/audit\/staff\/[^\/]+$/, targetType: 'Staff' },
        { pattern: /^\/audit\/[^\/]+$/, targetType: 'Audit' },
    ];

    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // Sadece GET isteklerini logla
        if (request.method !== 'GET') {
            return next.handle();
        }

        const url = request.url?.split('?')[0]; // Query string'i temizle
        const user = request.user;

        // Hassas endpoint mi kontrol et
        const matchedPattern = this.sensitivePatterns.find(p => p.pattern.test(url));

        if (!matchedPattern || !user) {
            return next.handle();
        }

        // URL'den target ID'yi çıkar
        const urlParts = url.split('/');
        const targetId = urlParts[urlParts.length - 1];

        return next.handle().pipe(
            tap({
                next: () => {
                    // Başarılı erişimi logla (fire-and-forget)
                    this.prisma.auditLog.create({
                        data: {
                            user: user.displayName || user.username || 'Unknown',
                            action: 'VIEW',
                            details: `${user.username} kullanıcısı ${matchedPattern.targetType} kaydını görüntüledi.`,
                            targetType: matchedPattern.targetType,
                            targetId: targetId !== matchedPattern.targetType.toLowerCase() ? targetId : null,
                            ipAddress: request.ip || request.connection?.remoteAddress,
                        }
                    }).catch(err => {
                        this.logger.error('Erişim logu yazılamadı:', err.message);
                    });
                },
            }),
        );
    }
}
