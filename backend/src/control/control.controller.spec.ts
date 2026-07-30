import { Test, TestingModule } from '@nestjs/testing';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';

describe('ControlController - Yetki & Rol Bazlı Erişim Testleri', () => {
    let controller: ControlController;
    let service: ControlService;

    const mockControlService = {
        getControlStats: jest.fn(),
        getControlInventory: jest.fn(),
        createControlItem: jest.fn(),
        getControlTests: jest.fn(),
        createControlTest: jest.fn(),
        getControlDeficiencies: jest.fn(),
        updateDeficiencyStatus: jest.fn(),
        sendToConciliation: jest.fn(),
        submitUnitResponse: jest.fn(),
        decideConciliation: jest.fn(),
        officiallyNotify: jest.fn(),
        uploadEvidence: jest.fn(),
        approveEvidence: jest.fn(),
        getSelfAssessments: jest.fn(),
        createSelfAssessment: jest.fn(),
        verifySelfAssessment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ControlController],
            providers: [
                { provide: ControlService, useValue: mockControlService },
            ],
        }).compile();

        controller = module.get<ControlController>(ControlController);
        service = module.get<ControlService>(ControlService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GET /control/inventory', () => {
        it('should pass query parameters to ControlService.getControlInventory', async () => {
            mockControlService.getControlInventory.mockResolvedValue({
                items: [],
                total: 0,
                page: 1,
                pageSize: 10,
            });

            const res = await controller.getInventory('1', '10', 'created_at', 'desc', undefined, 'Kredi', 'Aktif', 'Kredi Birimi');

            expect(mockControlService.getControlInventory).toHaveBeenCalledWith({
                page: 1,
                pageSize: 10,
                sortBy: 'created_at',
                sortDir: 'desc',
                search: 'Kredi',
                status: 'Aktif',
                department: 'Kredi Birimi',
            });
            expect(res.total).toBe(0);
        });
    });

    describe('POST /control/tests', () => {
        it('should extract userId from request and call createControlTest', async () => {
            const req = { user: { id: 'usr-123' } };
            const body = {
                controlId: 'ctrl-1',
                period: '2026-Q2',
                testMethod: 'Örneklem',
                result: 'ETKIN_DEGIL',
            };

            mockControlService.createControlTest.mockResolvedValue({
                test: { id: 't-1' },
                autoDeficiency: { id: 'd-1' },
            });

            const res = await controller.createControlTest(body, req);

            expect(mockControlService.createControlTest).toHaveBeenCalledWith(body, 'usr-123');
            expect(res.autoDeficiency).toBeDefined();
        });
    });

    describe('POST /control/deficiencies/:id/send-to-conciliation', () => {
        it('should call sendToConciliation service method with deficiency id and userId', async () => {
            const req = { user: { sub: 'usr-manager-456' } };
            mockControlService.sendToConciliation.mockResolvedValue({
                id: 'def-1',
                status: 'Mutabakata Gönderildi',
            });

            const res = await controller.sendToConciliation('def-1', req);

            expect(mockControlService.sendToConciliation).toHaveBeenCalledWith('def-1', 'usr-manager-456');
            expect(res.status).toBe('Mutabakata Gönderildi');
        });
    });

    describe('POST /control/deficiencies/:id/decide-conciliation', () => {
        it('should invoke decideConciliation service with manager decision', async () => {
            const req = { user: { id: 'usr-manager-1' } };
            mockControlService.decideConciliation.mockResolvedValue({
                id: 'def-1',
                status: 'Uzlaşıldı',
            });

            const res = await controller.decideConciliation(
                'def-1',
                'UZLASILDI',
                'Aksiyon planında anlaşma sağlandı',
                req
            );

            expect(mockControlService.decideConciliation).toHaveBeenCalledWith(
                'def-1',
                'UZLASILDI',
                'Aksiyon planında anlaşma sağlandı',
                'usr-manager-1'
            );
            expect(res.status).toBe('Uzlaşıldı');
        });
    });
});
