import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

// Kullanıcı servisi için mock metodları
const mockUserService = {
    findByUsername: jest.fn(),
    validatePassword: jest.fn(),
    handleFailedLogin: jest.fn(),
    resetFailedAttempts: jest.fn(),
    updateLastLogin: jest.fn(),
    findById: jest.fn(),
    getUserPermissions: jest.fn()
};

// JWT servisi için mock metodları
const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn()
};

const mockPrismaService = {
    refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn()
    },
    user: {
        update: jest.fn()
    },
    auditLog: {
        create: jest.fn()
    }
};

import { AuditLogService } from '../audit/audit-log.service';
import { LdapService } from './ldap.service';

const mockAuditLogService = {
    createLog: jest.fn().mockResolvedValue({})
};

const mockLdapService = {
    authenticate: jest.fn()
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: mockUserService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: AuditLogService, useValue: mockAuditLogService },
                { provide: LdapService, useValue: mockLdapService }
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        // Her testten önce mock'ları temizle
        jest.clearAllMocks();
    });

    it('AuthService tanımlı olmalı', () => {
        expect(service).toBeDefined();
    });

    describe('login (Oturum Açma İşlemi)', () => {
        const loginDto = { username: 'testuser', password: 'password123' };

        beforeEach(() => {
            mockUserService.getUserPermissions.mockResolvedValue([]);
        });

        it('Geçersiz kullanıcı adı girildiğinde UnauthorizedException fırlatmalı', async () => {
            mockUserService.findByUsername.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Kullanıcı adı veya şifre hatalı.');
        });

        it('Geçersiz şifre girildiğinde giriş denemesini kaydedip UnauthorizedException fırlatmalı', async () => {
            const mockUser = {
                id: '1',
                username: 'testuser',
                failedLoginAttempts: 0,
                isActive: true,
                isAdUser: false,
                passwordHash: 'hashed_password',
                roles: []
            };
            mockUserService.findByUsername.mockResolvedValue(mockUser);

            // spyOn bcrypt.compare
            const bcryptSpy = jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: mockUser.id },
                data: { failedLoginAttempts: 1 }
            }));

            bcryptSpy.mockRestore();
        });

        it('Hesap kilitliyse (lockedUntil ileride bir tarihse) giriş engellenmeli', async () => {
            const futureDate = new Date();
            futureDate.setMinutes(futureDate.getMinutes() + 10);

            const lockedUser = {
                id: '1',
                username: 'testuser',
                isActive: true, // AKTIF yapıyoruz ki deaktif kontrolüne değil, locked kontrolüne girsin
                lockedUntil: futureDate,
                failedLoginAttempts: 5,
                isAdUser: false,
                passwordHash: 'hashed_password',
                roles: []
            };

            mockUserService.findByUsername.mockResolvedValue(lockedUser);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow(/Hesabınız çok fazla başarısız giriş denemesi nedeniyle kilitlenmiştir/);

            // Şifre kontrolüne hiç girilmemeli
            expect(mockUserService.validatePassword).not.toHaveBeenCalled();
        });

        it('Aktif olmayan hesap için giriş engellenmeli', async () => {
            const inactiveUser = {
                id: '1',
                username: 'testuser',
                isActive: false
            };
            mockUserService.findByUsername.mockResolvedValue(inactiveUser);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Bu hesap pasife alınmıştır');
        });

        it('Maksimum oturum sınırına ulaşıldığında en eski oturum silinmeli ve login işlemi başarılı olmalı', async () => {
            const validUser = {
                id: '1',
                username: 'testuser',
                isActive: true,
                roles: [],
                failedLoginAttempts: 0,
                isAdUser: false,
                passwordHash: 'hashed_password'
            };

            mockUserService.findByUsername.mockResolvedValue(validUser);
            const bcryptSpy = jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

            // Kullanıcının hali hazırda 2 oturumu var (MAX_CONCURRENT_SESSIONS limite ulaşıldı)
            mockPrismaService.refreshToken.findMany.mockResolvedValue([{ id: 'old_1' }, { id: 'old_2' }, { id: 'old_3' }]);
            mockJwtService.sign.mockReturnValue('mocked_token');
            mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mocked_refresh_token' });
            mockPrismaService.refreshToken.findUnique.mockResolvedValue({ id: 'old_token_id' }); // Dummy result

            const result = await service.login(loginDto);

            // Limit aşıldığı için eski oturumların silinme metodu çağrılmış olmalı. 
            // Mock deleteMany testini yapıyoruz.
            expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalled();
            expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: validUser.id },
                data: { failedLoginAttempts: 0, lockedUntil: null }
            }));
            expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(validUser.id);
            expect(result).toHaveProperty('access_token', 'mocked_token');
            expect(result.refresh_token).toBeDefined();

            bcryptSpy.mockRestore();
        });

        it('Başarılı girişte sayaç sıfırlanmalı, tokenlar dönmeli ve son giriş tarihi güncellenmeli', async () => {
            const validUser = {
                id: '1',
                username: 'testuser',
                isActive: true,
                roles: [],
                failedLoginAttempts: 2,
                isAdUser: false,
                passwordHash: 'hashed_password'
            };

            mockUserService.findByUsername.mockResolvedValue(validUser);
            const bcryptSpy = jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
            mockPrismaService.refreshToken.findMany.mockResolvedValue([]);
            mockJwtService.sign.mockReturnValue('mocked_token');
            mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mocked_refresh_token' });

            const result = await service.login(loginDto);

            expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: validUser.id },
                data: { failedLoginAttempts: 0, lockedUntil: null }
            }));
            expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(validUser.id);

            expect(result.access_token).toBe('mocked_token');
            expect(result.refresh_token).toBeDefined();
            expect(result.user.username).toBe('testuser');

            bcryptSpy.mockRestore();
        });
    });

    describe('refreshToken (Token Yenileme İşlemi)', () => {
        it('Geçersiz refresh token (veritabanında yok) kullanıldığında hata vermeli', async () => {
            mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

            await expect(service.refreshToken('invalid_token')).rejects.toThrow(UnauthorizedException);
            await expect(service.refreshToken('invalid_token')).rejects.toThrow('Geçersiz refresh token');
        });

        it('Süresi dolmuş refresh token kullanıldığında hata vermeli', async () => {
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1);

            const expiredToken = {
                id: '1',
                token: 'expired_token',
                userId: 'user1',
                expiresAt: pastDate
            };

            mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

            await expect(service.refreshToken('expired_token')).rejects.toThrow(UnauthorizedException);
        });

        it('Geçerli refresh token gönderildiğinde yeni tokenlar oluşturulmalı ve eski token silinmeli', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const validToken = {
                id: '1',
                token: 'valid_refresh_token',
                userId: 'user1',
                expiresAt: futureDate,
                user: {
                    id: 'user1',
                    username: 'testuser',
                    isActive: true,
                    roles: []
                }
            };

            mockPrismaService.refreshToken.findUnique.mockResolvedValue(validToken);
            mockUserService.findById.mockResolvedValue({ id: 'user1', username: 'testuser', isActive: true, roles: [] });
            mockUserService.getUserPermissions.mockResolvedValue([]);
            mockPrismaService.refreshToken.findMany.mockResolvedValue([]);
            mockJwtService.sign.mockReturnValue('new_access_token');
            mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'new_refresh_token' });

            const result = await service.refreshToken('valid_refresh_token');

            // Eski token'ı silmiş mi kontrol et
            expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });

            expect(result.access_token).toBe('new_access_token');
            expect(result.refresh_token).toBeDefined();
        });
    });

    describe('logout (Oturum Kapatma)', () => {
        it('Belirli bir cihazdan (refresh token ile) çıkış yapıldığında sadece o token silinmeli', async () => {
            mockUserService.findById.mockResolvedValue({ id: 'user1', username: 'test' });
            await service.logout('user1', 'token_to_delete');

            expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user1', token: 'token_to_delete' },
            });
        });

        it('Refresh token olmadan çıkış yapıldığında kulanıcının TÜM oturumları kapatılmalı', async () => {
            mockUserService.findById.mockResolvedValue({ id: 'user1', username: 'test' });
            await service.logout('user1');

            expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user1' },
            });
        });
    });
});
