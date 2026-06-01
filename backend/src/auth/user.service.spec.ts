import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';

// Prisma için mock
const mockPrismaService = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
    }
};

describe('UserService', () => {
    let service: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrismaService }
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        jest.clearAllMocks();
    });

    it('UserService tanımlı olmalı', () => {
        expect(service).toBeDefined();
    });

    describe('validatePasswordPolicy (Şifre Karmaşıklık Kontrolü)', () => {
        it('8 karakterden kısa şifreleri reddetmeli', () => {
            const result = service.validatePasswordPolicy('A1!b2');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('en az 8 karakter');
        });

        it('Büyük harf içermeyen şifreleri reddetmeli', () => {
            const result = service.validatePasswordPolicy('a1!b2c3d4');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('en az 1 büyük harf');
        });

        it('Küçük harf içermeyen şifreleri reddetmeli', () => {
            const result = service.validatePasswordPolicy('A1!B2C3D4');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('en az 1 küçük harf');
        });

        it('Rakam içermeyen şifreleri reddetmeli', () => {
            const result = service.validatePasswordPolicy('Aa!BbCcDd');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('en az 1 rakam');
        });

        it('Özel karakter içermeyen şifreleri reddetmeli', () => {
            const result = service.validatePasswordPolicy('Aa1Bb2Cc3');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('en az 1 özel karakter');
        });

        it('Tüm kurallara uyan güçlü şifreyi kabul etmeli', () => {
            const result = service.validatePasswordPolicy('Guclu1Sifre!');
            expect(result.valid).toBe(true);
            expect(result.message).toBe('');
        });
    });

    describe('hashPassword (Şifre Hashleme)', () => {
        it('Güçlü şifreyi başarıyla hashlemeli', async () => {
            const mockHash = 'hashed_string';
            jest.spyOn(bcrypt, 'hash').mockImplementation(async () => mockHash);

            const result = await service.hashPassword('Guclu1Sifre!');
            expect(result).toBe(mockHash);
            expect(bcrypt.hash).toHaveBeenCalledWith('Guclu1Sifre!', 10);
        });

        it('Zayıf şifreyi hashlemeyi reddetmeli', async () => {
            await expect(service.hashPassword('zayifsifre')).rejects.toThrow('Şifre en az 1 büyük harf içermelidir.');
        });
    });

    describe('validatePassword (Şifre Doğrulama)', () => {
        it('Doğru şifre için true dönmeli', async () => {
            jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
            const result = await service.validatePassword('plain', 'hashed');
            expect(result).toBe(true);
        });

        it('Yanlış şifre için false dönmeli', async () => {
            jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
            const result = await service.validatePassword('plain', 'hashed');
            expect(result).toBe(false);
        });
    });

    describe('find methods', () => {
        it('findByUsername should call prisma with correct includes', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', username: 'test' });
            await service.findByUsername('test');
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { username: 'test' },
                    include: expect.anything()
                })
            );
        });

        it('findById should call prisma with correct includes', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });
            await service.findById('1');
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '1' },
                    include: expect.anything()
                })
            );
        });
    });

    describe('updateLastLogin', () => {
        it('should update lastLoginAt field', async () => {
            await service.updateLastLogin('user-id');
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                data: { lastLoginAt: expect.any(Date) }
            });
        });
    });

    describe('getAllUsers', () => {
        it('should fetch all users with roles', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            await service.getAllUsers();
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.anything(),
                    orderBy: { displayName: 'asc' }
                })
            );
        });
    });

    describe('createUser', () => {
        it('should hash password and create user with roles', async () => {
            const userData = {
                username: 'newuser',
                password: 'Guclu1Sifre!',
                displayName: 'New User',
                roleIds: ['role1', 'role2']
            };
            mockPrismaService.user.create.mockResolvedValue({ id: 'new-id' });
            jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_pw');

            await service.createUser(userData);

            expect(mockPrismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        username: 'newuser',
                        passwordHash: 'hashed_pw',
                        roles: {
                            create: [{ roleId: 'role1' }, { roleId: 'role2' }]
                        }
                    })
                })
            );
        });

        it('should handle AD users without password', async () => {
            const adUser = {
                username: 'aduser',
                displayName: 'AD User',
                isAdUser: true,
                roleIds: []
            };
            mockPrismaService.user.create.mockResolvedValue({ id: 'ad-id' });
            
            await service.createUser(adUser);
            
            expect(mockPrismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        passwordHash: null,
                        isAdUser: true
                    })
                })
            );
        });
    });

    describe('getUserPermissions (Yetki Kontrolü)', () => {
        it('Kullanıcının rollerine göre yetkilerini getirmeli ve en güçlü scope u seçmeli', async () => {
            const mockUser = {
                id: '1',
                roles: [
                    {
                        role: {
                            permissions: [
                                { scope: 'OWN', permission: { module: 'Audit', action: 'Create' } },
                                { scope: 'ALL', permission: { module: 'Audit', action: 'Read' } }
                            ]
                        }
                    },
                    {
                        role: {
                            permissions: [
                                { scope: 'DEPARTMENT', permission: { module: 'Audit', action: 'Read' } },
                                { scope: 'ALL', permission: { module: 'Audit', action: 'Create' } }
                            ]
                        }
                    }
                ]
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const permissions = await service.getUserPermissions('1');

            const createPerm = permissions.find(p => p.action === 'Create');
            expect(createPerm?.scope).toBe('ALL');

            const readPerm = permissions.find(p => p.action === 'Read');
            expect(readPerm?.scope).toBe('ALL');
        });

        it('Kullanıcı bulunamazsa boş array dönmeli', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            const permissions = await service.getUserPermissions('1');
            expect(permissions).toEqual([]);
        });
    });

    describe('hasPermission (Yetki Var Mı)', () => {
        it('Kullanıcının yetkisi varsa true dönmeli', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([
                { module: 'Audit', action: 'Create', scope: 'ALL' }
            ]);

            const result = await service.hasPermission('1', 'Audit', 'Create');
            expect(result).toBe(true);
        });

        it('Kullanıcının yetkisi yoksa false dönmeli', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([
                { module: 'Audit', action: 'Read', scope: 'ALL' }
            ]);

            const result = await service.hasPermission('1', 'Audit', 'Create');
            expect(result).toBe(false);
        });

        it('ALL modülü veya ALL actionı için true dönmeli', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([
                { module: 'ALL', action: 'VIEW', scope: 'ALL' }
            ]);

            const result = await service.hasPermission('1', 'Audit', 'VIEW');
            expect(result).toBe(true);
        });
    });
});
