import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UserService, UserWithRoles } from './user.service';
import { jwtConstants } from './jwt.constants';
import { PrismaService } from '../common/prisma.service';
import { LdapService } from './ldap.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

// ============================================
// SABİTLER
// ============================================
const MAX_FAILED_ATTEMPTS = 5;       // 5 başarısız deneme
const LOCK_DURATION_MINUTES = 15;     // 15 dakika kilitleme
const MAX_CONCURRENT_SESSIONS = 2;    // Kullanıcı başına maks 2 eşzamanlı oturum (PC + mobil)

export interface TokenPayload {
    sub: string;
    username: string;
    displayName: string;
    roles: string[];
    permissions: { module: string; action: string; scope: string }[];
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
        id: string;
        username: string;
        displayName: string;
        email: string | null;
        department: string | null;
        roles: string[];
        permissions: { module: string; action: string; scope: string }[];
    };
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private ldapService: LdapService,
    ) { }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const user = await this.userService.findByUsername(loginDto.username);

        if (!user) {
            throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı.');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Bu hesap pasife alınmıştır. Lütfen sistem yöneticisiyle iletişime geçin.');
        }

        // ============================================
        // BRUTE-FORCE KORUMASI: Hesap kilitleme kontrolü
        // ============================================
        if ((user as any).lockedUntil && new Date((user as any).lockedUntil) > new Date()) {
            const remainingMs = new Date((user as any).lockedUntil).getTime() - Date.now();
            const remainingMin = Math.ceil(remainingMs / 60000);
            this.logger.warn(`Kilitli hesaba giriş denemesi: ${user.username}`);
            throw new UnauthorizedException(
                `Hesabınız çok fazla başarısız giriş denemesi nedeniyle kilitlenmiştir. ${remainingMin} dakika sonra tekrar deneyin.`
            );
        }

        // AD kullanıcısı değilse local şifre kontrolü yap
        if (!user.isAdUser) {
            if (!user.passwordHash) {
                throw new UnauthorizedException('Bu hesap için şifre tanımlanmamış.');
            }

            const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
            if (!isPasswordValid) {
                await this.handleFailedLogin(user);
                throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı.');
            }
        } else {
            // AD kullanıcısı: LDAP bind ile şirket bilgisayar şifresi doğrulaması
            const isLdapValid = await this.ldapService.authenticate(
                loginDto.username,
                loginDto.password,
            );
            if (!isLdapValid) {
                await this.handleFailedLogin(user);
                throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı.');
            }
        }

        // Başarılı giriş: Sayacı sıfırla
        await this.resetFailedAttempts(user.id);

        // Son giriş zamanını güncelle
        await this.userService.updateLastLogin(user.id);

        // Sisteme Giriş Logu Ekle
        try {
            await this.prisma.auditLog.create({
                data: {
                    user: user.displayName || user.username,
                    action: 'Sisteme Giriş',
                    details: `${user.username} kullanıcı adıyla sisteme başarılı giriş (veya MFA adımı) başladı.`,
                    targetType: 'Auth',
                    targetId: user.id
                }
            });
        } catch (logError) {
            this.logger.error('AuditLog insert error:', logError);
        }

        // Token'ları oluştur
        return this.generateTokens(user);
    }

    // ============================================
    // BRUTE-FORCE: Başarısız giriş işleme
    // ============================================
    private async handleFailedLogin(user: UserWithRoles): Promise<void> {
        const currentAttempts = ((user as any).failedLoginAttempts || 0) + 1;

        const updateData: any = {
            failedLoginAttempts: currentAttempts,
        };

        // 5. başarısız denemede hesabı kilitle
        if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
            updateData.lockedUntil = lockUntil;

            this.logger.warn(`Hesap kilitlendi: ${user.username} (${currentAttempts} başarısız deneme)`);

            // Kilitleme olayını logla
            try {
                await this.prisma.auditLog.create({
                    data: {
                        user: 'SYSTEM',
                        action: 'HESAP_KİLİTLENDİ',
                        details: `${user.username} hesabı ${currentAttempts} başarısız giriş denemesi nedeniyle ${LOCK_DURATION_MINUTES} dakika süreyle kilitlendi.`,
                        targetType: 'Auth',
                        targetId: user.id
                    }
                });
            } catch (e) {
                this.logger.error('Kilitleme logu yazılamadı:', e);
            }
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });
    }

    // Başarılı girişte sayacı sıfırla
    private async resetFailedAttempts(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
    }

    private async generateTokens(user: UserWithRoles): Promise<AuthResponse> {
        // Kullanıcının rol ve yetki bilgilerini hazırla
        const roles = user.roles.map(ur => ur.role.code);
        const permissions = await this.userService.getUserPermissions(user.id);

        const payload: TokenPayload = {
            sub: user.id,
            username: user.username,
            displayName: user.displayName,
            roles,
            permissions,
        };

        // Access token oluştur
        const accessToken = this.jwtService.sign(payload);

        // ============================================
        // EŞZAMANLI OTURUM SINIRI: Maks 3 aktif oturum
        // ============================================
        const existingTokens = await this.prisma.refreshToken.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' },
        });

        if (existingTokens.length >= MAX_CONCURRENT_SESSIONS) {
            // En eski oturumları kapat (sadece limiti aşanları)
            const tokensToRemove = existingTokens.slice(0, existingTokens.length - MAX_CONCURRENT_SESSIONS + 1);
            await this.prisma.refreshToken.deleteMany({
                where: {
                    id: { in: tokensToRemove.map(t => t.id) },
                },
            });
            this.logger.log(`Eşzamanlı oturum limiti aşıldı. ${tokensToRemove.length} eski oturum kapatıldı (Kullanıcı: ${user.username}).`);
        }

        // Refresh token oluştur (database'e kaydet)
        const refreshTokenValue = randomBytes(64).toString('hex');
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 gün

        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshTokenValue,
                expiresAt: refreshTokenExpiry,
            },
        });

        return {
            access_token: accessToken,
            refresh_token: refreshTokenValue,
            expires_in: 900, // 15 dakika (saniye cinsinden)
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                department: user.department,
                roles,
                permissions,
            },
        };
    }

    async refreshToken(refreshTokenValue: string): Promise<AuthResponse> {
        // Refresh token'ı bul
        const refreshToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshTokenValue },
        });

        if (!refreshToken) {
            throw new UnauthorizedException('Geçersiz refresh token.');
        }

        // Token süresi dolmuş mu?
        if (refreshToken.expiresAt < new Date()) {
            // Eski token'ı sil
            await this.prisma.refreshToken.delete({ where: { id: refreshToken.id } });
            throw new UnauthorizedException('Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.');
        }

        // Kullanıcıyı bul
        const user = await this.userService.findById(refreshToken.userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Kullanıcı bulunamadı veya hesabı pasife alınmış.');
        }

        // Eski refresh token'ı sil
        await this.prisma.refreshToken.delete({ where: { id: refreshToken.id } });

        // Yeni token'ları oluştur
        return this.generateTokens(user);
    }

    async logout(userId: string, refreshTokenValue?: string): Promise<void> {
        const user = await this.userService.findById(userId);

        if (refreshTokenValue) {
            // Sadece belirtilen token'ı sil
            await this.prisma.refreshToken.deleteMany({
                where: { userId, token: refreshTokenValue },
            });
        } else {
            // Tüm refresh token'ları sil (tüm cihazlardan çıkış)
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }

        if (user) {
            try {
                await this.prisma.auditLog.create({
                    data: {
                        user: user.displayName || user.username,
                        action: 'Sistemden Çıkış',
                        details: `${user.username} kullanıcı adıyla sistemden çıkış yapıldı.`,
                        targetType: 'Auth',
                        targetId: user.id
                    }
                });
            } catch (logError) {
                this.logger.error('AuditLog insert error:', logError);
            }
        }
    }

    async validateToken(token: string): Promise<TokenPayload | null> {
        try {
            return this.jwtService.verify<TokenPayload>(token);
        } catch {
            return null;
        }
    }

}
