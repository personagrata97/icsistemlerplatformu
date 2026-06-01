import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './jwt.constants';
import { UserService } from './user.service';

export interface JwtPayload {
    sub: string;        // User ID
    username: string;
    roles: string[];
    permissions: { module: string; action: string; scope: string }[];
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(private userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req: any) => {
                    return req?.query?.token || null;
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
            passReqToCallback: true
        });
    }

    async validate(req: any, payload: JwtPayload) {
        // Token'daki user hala aktif mi kontrol et
        const user = await this.userService.findById(payload.sub);

        if (!user || !user.isActive) {
            this.logger.error('JWT_STRATEGY_ERROR: User not found or inactive', { sub: payload.sub });
            throw new UnauthorizedException('Kullanıcı bulunamadı veya deaktif edilmiş.');
        }

        // Flatten Roles and Permissions from DB User (Source of Truth)
        const roles = user.roles.map(ur => ur.role.code);

        const permissionsMap = new Map<string, any>();
        user.roles.forEach(ur => {
            ur.role.permissions.forEach(rp => {
                const key = `${rp.permission.module}:${rp.permission.action}`;
                // Simple merge: Last one wins or logic to keep 'ALL' > 'DEPARTMENT' > 'OWN'
                // For now, just accumulation is enough as AuditService checks for existence
                if (!permissionsMap.has(key)) {
                    permissionsMap.set(key, {
                        module: rp.permission.module,
                        action: rp.permission.action,
                        scope: rp.scope
                    });
                }
            });
        });
        const permissions = Array.from(permissionsMap.values());

        return {
            id: payload.sub,
            userId: payload.sub, // Added for compatibility with controllers using req.user.userId
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            roles: roles,
            permissions: permissions,
            department: user.department,
            ipAddress: req?.ip || req?.connection?.remoteAddress || '127.0.0.1',
        };
    }
}
