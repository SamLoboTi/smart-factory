import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { AppService } from '../app.service';

describe('AssistantService', () => {
    let service: AssistantService;
    let appService: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssistantService,
                {
                    provide: AppService,
                    useValue: {
                        processChat: jest.fn().mockResolvedValue({ reply: 'Mocked Chat' }),
                        getKPIs: jest.fn().mockResolvedValue({
                            oee: 80, mtbf: 100, mttr: 10, tempo_parado_registros: 5, disponibilidade: 90, vibracao_media_operacao: 2.5
                        }),
                        getAlerts: jest.fn().mockResolvedValue({ vibracao_alta: [], risco_alto: [], ultimas_paradas: [] }),
                        getLatestReadings: jest.fn().mockResolvedValue([{ status: 'rodando', temperatura: 50, vibracao: 1.5, device_id: 'DEV-001' }])
                    },
                },
            ],
        }).compile();

        service = module.get<AssistantService>(AssistantService);
        appService = module.get<AppService>(AppService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return quick report', async () => {
        const result = await service.processMessage('relatorio rapido');
        expect(result.reply).toContain('Relatório Rápido');
        expect(result.reply).toContain('80%'); // Valor do OEE mockado
    });

    it('should parse date for complete report', async () => {
        const result = await service.processMessage('relatorio completo 10/02/2025 14:00');
        expect(result.reply).toContain('Relatório Completo');
        expect(result.reply).toContain('10/02/2025');
        expect(result.reply).toContain('14:00');
    });

    it('should handle invalid date', async () => {
        const result = await service.processMessage('relatorio completo 99/99/2025');
        expect(result.reply).toContain('Data inválida');
    });

    it('should verify status query', async () => {
        const result = await service.processMessage('status da linha');
        expect(result.reply).toContain('Status Geral');
    });

    it('should handle specific machine status', async () => {
        const result = await service.processMessage('status da maquina 2');
        expect(result.reply).toContain('Status da '); // maquina 2
        expect(result.reply).toContain('Operando normalmente');
    });
});
