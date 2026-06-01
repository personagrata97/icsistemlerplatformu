import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        return next.handle().pipe(
            map((data) => {
                if (!data) return data;

                // 1. Yetkili veya denetim rollerinden birine sahipse maskeleme YAPMA
                const privilegedRoles = ['ADMIN', 'AUDIT_ADMIN', 'MANAGER', 'YÖNETİCİ', 'SUPERVISOR', 'AUDIT_SUPERVISOR', 'AUDIT_INSPECTOR', 'DENETİM_MÜDÜRÜ'];
                
                let hasPrivilege = false;
                if (user && user.roles && Array.isArray(user.roles)) {
                    hasPrivilege = user.roles.some((r: string) => privilegedRoles.includes(r.toUpperCase()));
                } else if (user && user.role) {
                    hasPrivilege = privilegedRoles.includes(user.role.toUpperCase());
                }

                if (hasPrivilege) {
                    return data;
                }

                // 2. Kullanıcı kendi verisini görüyorsa maskeleme YAPMA (Selim Kaya kontrolü)
                // Eğer dönen veri bir nesneyse ve 'id' veya 'userId' alanı kullanıcının ID'si ile eşleşiyorsa
                if (user && !Array.isArray(data) && typeof data === 'object') {
                    const dataId = data.id || data.userId || data.staffId;
                    if (dataId === user.id) {
                        return data;
                    }
                }

                // 3. Diğer durumlarda hassas verileri maskele
                return this.maskSensitiveData(data);
            }),
        );
    }

    private maskSensitiveData(data: any): any {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.maskSensitiveData(item));
        }

        const maskedData = { ...data };
        const sensitiveFields = [
            'tcNo',
            'phone',
            'email',
            'birthDate',
            'address',
            'salary',
            'iban',
            'password',
        ];

        for (const key in maskedData) {
            if (sensitiveFields.includes(key) && typeof maskedData[key] === 'string') {
                maskedData[key] = this.maskString(maskedData[key]);
            } else if (typeof maskedData[key] === 'object') {
                maskedData[key] = this.maskSensitiveData(maskedData[key]);
            }
        }

        return maskedData;
    }

    private maskString(str: string): string {
        if (!str || str.length < 4) return '***';
        return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
    }
}
