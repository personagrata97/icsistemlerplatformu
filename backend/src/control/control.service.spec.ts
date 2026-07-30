import { Test, TestingModule } from '@nestjs/testing';
import { ControlService } from './control.service';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { NotFoundException } from '@nestjs/common';

describe('ControlService - Kontrol Testleri, Otomatik Eksiklik & Mutabakat Akışı', () => {
    let service: ControlService;

    const mockPrisma = {
        controlItem: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
        },
        controlTest: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        controlDeficiency: {
            create: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        controlActionEvidence: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        controlSelfAssessment: {
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockAuditLogService = {
        createLog: jest.fn().mockResolvedValue({}),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ControlService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditLogService, useValue: mockAuditLogService },
            ],
        }).compile();

        service = module.get<ControlService>(ControlService);
        jest.clearAllMocks();
    });

    describe('1. Otomatik Eksiklik Oluşturma Mekanizması', () => {
        const mockControlItem = {
            id: 'ctrl-001',
            code: 'KNT-KRE-001',
            title: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
            department: 'Kredi Operasyonları Müdürlüğü',
        };

        it('Test sonucu ETKIN_DEGIL olduğunda Yüksek önem dereceli otomatik eksiklik kaydı oluşturulmalıdır', async () => {
            mockPrisma.controlItem.findUnique.mockResolvedValue(mockControlItem);
            mockPrisma.controlTest.create.mockResolvedValue({
                id: 'test-101',
                controlId: 'ctrl-001',
                period: '2026-Q2',
                result: 'ETKIN_DEGIL',
                deviationCount: 3,
            });
            mockPrisma.controlDeficiency.count.mockResolvedValue(5);
            mockPrisma.controlDeficiency.create.mockResolvedValue({
                id: 'def-101',
                code: 'EKS-2026-006',
                controlId: 'ctrl-001',
                severity: 'Yüksek',
                status: 'Açık',
            });

            const result = await service.createControlTest(
                {
                    controlId: 'ctrl-001',
                    period: '2026-Q2',
                    testMethod: 'Örneklem',
                    result: 'ETKIN_DEGIL',
                    deviationCount: 3,
                    description: 'Sistem limit aşımında blokaj koymadı',
                },
                'user-admin'
            );

            expect(result.test).toBeDefined();
            expect(result.autoDeficiency).toBeDefined();
            expect(mockPrisma.controlDeficiency.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    code: 'EKS-2026-006',
                    severity: 'Yüksek',
                    responsibleUnit: 'Kredi Operasyonları Müdürlüğü',
                    status: 'Açık',
                }),
            });
            expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'OTOMATIK_KONTROL_EKSIKLIGI_OLUSTURULDU',
                })
            );
        });

        it('Test sonucu KISMEN_ETKIN olduğunda Orta önem dereceli otomatik eksiklik kaydı oluşturulmalıdır', async () => {
            mockPrisma.controlItem.findUnique.mockResolvedValue(mockControlItem);
            mockPrisma.controlTest.create.mockResolvedValue({
                id: 'test-102',
                controlId: 'ctrl-001',
                result: 'KISMEN_ETKIN',
            });
            mockPrisma.controlDeficiency.count.mockResolvedValue(10);
            mockPrisma.controlDeficiency.create.mockResolvedValue({
                id: 'def-102',
                code: 'EKS-2026-011',
                severity: 'Orta',
                status: 'Açık',
            });

            const result = await service.createControlTest(
                {
                    controlId: 'ctrl-001',
                    period: '2026-Q2',
                    testMethod: 'Örneklem',
                    result: 'KISMEN_ETKIN',
                    deviationCount: 1,
                },
                'user-auditor'
            );

            expect(result.autoDeficiency).toBeDefined();
            expect(mockPrisma.controlDeficiency.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    severity: 'Orta',
                }),
            });
        });

        it('Test sonucu ETKIN olduğunda otomatik eksiklik kaydı OLUŞTURULMAMALIDIR', async () => {
            mockPrisma.controlItem.findUnique.mockResolvedValue(mockControlItem);
            mockPrisma.controlTest.create.mockResolvedValue({
                id: 'test-103',
                controlId: 'ctrl-001',
                result: 'ETKIN',
            });

            const result = await service.createControlTest(
                {
                    controlId: 'ctrl-001',
                    period: '2026-Q2',
                    testMethod: 'Otomatik',
                    result: 'ETKIN',
                },
                'user-auditor'
            );

            expect(result.test).toBeDefined();
            expect(result.autoDeficiency).toBeNull();
            expect(mockPrisma.controlDeficiency.create).not.toHaveBeenCalled();
        });

        it('Kontrol tanımı bulunamadığında NotFoundException fırlatmalıdır', async () => {
            mockPrisma.controlItem.findUnique.mockResolvedValue(null);

            await expect(
                service.createControlTest(
                    {
                        controlId: 'non-existent',
                        period: '2026-Q2',
                        testMethod: 'Örneklem',
                        result: 'ETKIN_DEGIL',
                    },
                    'user-admin'
                )
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('2. Mutabakat & Tebliğ İş Akışı (Taslak → Gönderildi → Yanıt → Tebliğ → Kapalı)', () => {
        const mockDeficiency = {
            id: 'def-500',
            code: 'EKS-2026-050',
            controlId: 'ctrl-001',
            status: 'Açık',
            responsibleUnit: 'Kredi Operasyonları',
        };

        it('Adım 1: Mutabakata Gönderilme — durumu "Mutabakata Gönderildi" yapmalıdır', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue(mockDeficiency);
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                ...mockDeficiency,
                status: 'Mutabakata Gönderildi',
                unitResponse: 'BEKLEMEDE',
            });

            const res = await service.sendToConciliation('def-500', 'user-manager');

            expect(mockPrisma.controlDeficiency.update).toHaveBeenCalledWith({
                where: { id: 'def-500' },
                data: expect.objectContaining({
                    status: 'Mutabakata Gönderildi',
                    sentToUnitById: 'user-manager',
                    unitResponse: 'BEKLEMEDE',
                }),
            });
            expect(res.status).toBe('Mutabakata Gönderildi');
        });

        it('Adım 2: Birim Yanıtı Girilmesi — durumu "Uzlaşıldı" ve unitResponse "KATILIYOR" olarak güncellemelidir', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue({
                ...mockDeficiency,
                status: 'Mutabakata Gönderildi',
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                ...mockDeficiency,
                status: 'Uzlaşıldı',
                unitResponse: 'KATILIYOR',
            });

            const res = await service.submitUnitResponse(
                'def-500',
                'KATILIYOR',
                'Tüm bulguları kabul ediyoruz ve aksiyon planı hazırlıyoruz.',
                'user-unit-lead'
            );

            expect(mockPrisma.controlDeficiency.update).toHaveBeenCalledWith({
                where: { id: 'def-500' },
                data: expect.objectContaining({
                    status: 'Uzlaşıldı',
                    unitResponse: 'KATILIYOR',
                    unitResponseReason: 'Tüm bulguları kabul ediyoruz ve aksiyon planı hazırlıyoruz.',
                }),
            });
            expect(res.status).toBe('Uzlaşıldı');
        });

        it('Adım 3: Mutabakat Kararı UZLASILDI olduğunda durumu "Uzlaşıldı" yapmalıdır', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue({
                ...mockDeficiency,
                status: 'Birim Yanıtladı',
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                ...mockDeficiency,
                status: 'Uzlaşıldı',
            });

            const res = await service.decideConciliation('def-500', 'UZLASILDI', 'Aksiyon takvimi konusunda anlaşıldı', 'user-manager');

            expect(mockPrisma.controlDeficiency.update).toHaveBeenCalledWith({
                where: { id: 'def-500' },
                data: expect.objectContaining({
                    status: 'Uzlaşıldı',
                }),
            });
            expect(res.status).toBe('Uzlaşıldı');
        });

        it('Adım 3 (Alternatif): Mutabakat Kararı UST_YONETIM olduğunda durumu "Üst Yönetim Değerlendirmesinde" yapmalıdır', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue({
                ...mockDeficiency,
                status: 'Birim Yanıtladı',
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                ...mockDeficiency,
                status: 'Üst Yönetim Değerlendirmesinde',
            });

            const res = await service.decideConciliation('def-500', 'UST_YONETIM', 'Birim bulguyu kabul etmedi, uyuşmazlık var', 'user-manager');

            expect(res.status).toBe('Üst Yönetim Değerlendirmesinde');
        });

        it('Adım 4: Resmen Tebliğ Edilmesi — durumu "Tebliğ Edildi" yapmalıdır', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue({
                ...mockDeficiency,
                status: 'Uzlaşıldı',
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                ...mockDeficiency,
                status: 'Tebliğ Edildi',
            });

            const res = await service.officiallyNotify('def-500', 'user-manager');

            expect(mockPrisma.controlDeficiency.update).toHaveBeenCalledWith({
                where: { id: 'def-500' },
                data: expect.objectContaining({
                    status: 'Tebliğ Edildi',
                }),
            });
            expect(res.status).toBe('Tebliğ Edildi');
        });

        it('Adım 5: Kanıt Onaylanıp Eksikliğin Kapatılması — kanıt ONAYLANDI ise durumu "Kapalı" yapmalıdır', async () => {
            mockPrisma.controlActionEvidence.update.mockResolvedValue({
                id: 'evid-100',
                deficiencyId: 'def-500',
                approvalStatus: 'ONAYLANDI',
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                id: 'def-500',
                status: 'Kapalı',
            });

            const res = await service.approveEvidence('evid-100', 'ONAYLANDI', undefined as any, 'user-auditor');

            expect(mockPrisma.controlActionEvidence.update).toHaveBeenCalledWith({
                where: { id: 'evid-100' },
                data: expect.objectContaining({
                    approvalStatus: 'ONAYLANDI',
                }),
            });
            expect(mockPrisma.controlDeficiency.update).toHaveBeenCalledWith({
                where: { id: 'def-500' },
                data: expect.objectContaining({
                    status: 'Kapalı',
                }),
            });
        });
    });

    describe('3. Eksiklik Durumu Manuel Güncelleme & Geçersiz Kayıt Hata Yönetimi', () => {
        it('Var olmayan eksiklik ID verildiğinde NotFoundException fırlatmalıdır', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue(null);

            await expect(
                service.sendToConciliation('invalid-id', 'user-1')
            ).rejects.toThrow(NotFoundException);
        });

        it('Aksiyon planı ile birlikte durum güncellemesi başarıyla işlenmelidir', async () => {
            mockPrisma.controlDeficiency.findUnique.mockResolvedValue({
                id: 'def-99',
                status: 'Açık',
                actionPlan: null,
            });
            mockPrisma.controlDeficiency.update.mockResolvedValue({
                id: 'def-99',
                status: 'Aksiyonda',
                actionPlan: 'Yazılım güncellemesi Q3 sonuna kadar tamamlanacak',
            });

            const res = await service.updateDeficiencyStatus(
                'def-99',
                'Aksiyonda',
                'user-1',
                'Yazılım güncellemesi Q3 sonuna kadar tamamlanacak'
            );

            expect(res.status).toBe('Aksiyonda');
            expect(res.actionPlan).toBe('Yazılım güncellemesi Q3 sonuna kadar tamamlanacak');
        });
    });
});
