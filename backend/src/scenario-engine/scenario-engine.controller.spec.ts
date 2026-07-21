import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioEngineController } from './scenario-engine.controller';
import { ScenarioEngineService } from './scenario-engine.service';

describe('ScenarioEngineController', () => {
    let controller: ScenarioEngineController;
    let service: ScenarioEngineService;

    const mockScenarioService = {
        runAllScenarios: jest.fn(),
        getScenarioParameters: jest.fn(),
        getScenarioSummary: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ScenarioEngineController],
            providers: [
                { provide: ScenarioEngineService, useValue: mockScenarioService },
            ],
        }).compile();

        controller = module.get<ScenarioEngineController>(ScenarioEngineController);
        service = module.get<ScenarioEngineService>(ScenarioEngineService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('runAllScenarios', () => {
        it('should call scenarioService.runAllScenarios and return output', async () => {
            const mockResult = { message: 'Tüm senaryolar çalıştırıldı', tarih: new Date() };
            mockScenarioService.runAllScenarios.mockResolvedValue(mockResult);

            const result = await controller.runAllScenarios();

            expect(service.runAllScenarios).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockResult);
        });
    });

    describe('getParameters', () => {
        it('should call scenarioService.getScenarioParameters and return parameters', async () => {
            const mockParams = { key: 'val' };
            mockScenarioService.getScenarioParameters.mockResolvedValue(mockParams);

            const result = await controller.getParameters('SC-1');

            expect(service.getScenarioParameters).toHaveBeenCalledWith('SC-1');
            expect(result).toBe(mockParams);
        });
    });

    describe('getSummary', () => {
        it('should call scenarioService.getScenarioSummary with date when date query param is provided', async () => {
            const mockSummary = [{ id: 1 }];
            mockScenarioService.getScenarioSummary.mockResolvedValue(mockSummary);

            const result = await controller.getSummary('SC-1', '2026-03-24');

            expect(service.getScenarioSummary).toHaveBeenCalledWith('SC-1', new Date('2026-03-24'));
            expect(result).toBe(mockSummary);
        });

        it('should call scenarioService.getScenarioSummary without explicit date when query param is omitted', async () => {
            const mockSummary = [{ id: 1 }];
            mockScenarioService.getScenarioSummary.mockResolvedValue(mockSummary);

            const result = await controller.getSummary('SC-1');

            expect(service.getScenarioSummary).toHaveBeenCalledWith('SC-1', expect.any(Date));
            expect(result).toBe(mockSummary);
        });
    });
});
