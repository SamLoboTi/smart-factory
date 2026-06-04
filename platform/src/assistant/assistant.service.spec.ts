import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { AppService } from '../app.service';

describe('AssistantService', () => {
    let service: AssistantService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssistantService,
                {
                    provide: AppService,
                    useValue: {
                        getKPIs: jest.fn().mockResolvedValue({
                            oee: 80,
                            mtbf: 100,
                            mttr: 10,
                            tempo_parado_registros: 5,
                            disponibilidade: 90,
                            vibracao_media_operacao: 2.5,
                            status_geral: 'Alerta',
                        }),
                        getAlerts: jest.fn().mockResolvedValue({
                            vibracao_alta: [],
                            risco_alto: [],
                            ultimas_paradas: [],
                        }),
                        getLatestReadings: jest.fn().mockResolvedValue([
                            {
                                status: 'rodando',
                                temperatura: 50,
                                vibracao: 1.5,
                                pressure: 10,
                                device_id: 'DEV-001',
                            },
                        ]),
                        getEquipmentRisk: jest.fn().mockResolvedValue({
                            device_id: 'DEV-001',
                            samples: 20,
                            failure_risk: 0.72,
                            anomaly_score: 0.44,
                            is_anomaly: false,
                            rul_hours: 120,
                            rul_days: 5,
                            model_version: 'v1',
                            explanation: [
                                'High failure risk detected by the predictive model.',
                                'Vibration is above the historical safe range.',
                            ],
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AssistantService>(AssistantService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return quick report', async () => {
        const result = await service.processMessage('relatorio rapido');
        expect(result.reply).toContain('Relatorio rapido');
        expect(result.reply).toContain('80%');
    });

    it('should parse standalone date as complete report', async () => {
        const result = await service.processMessage('10/02/2026');
        expect(result.reply).toContain('Relatorio completo');
        expect(result.reply).toContain('10/02/2026');
    });

    it('should prioritize date in mixed commands', async () => {
        const result = await service.processMessage('relatorio rapido 15/03/2026');
        expect(result.reply).toContain('Relatorio completo');
        expect(result.reply).toContain('15/03/2026');
    });

    it('should parse date for complete report command', async () => {
        const result = await service.processMessage('relatorio completo 10/02/2025 14:00');
        expect(result.reply).toContain('Relatorio completo');
        expect(result.reply).toContain('10/02/2025');
        expect(result.reply).toContain('14:00');
    });

    it('should handle invalid date format gracefully', async () => {
        const result = await service.processMessage('99-99-2025');
        expect(result.reply).toContain('Nao encontrei');
    });

    it('should verify status query', async () => {
        const result = await service.processMessage('status da linha');
        expect(result.reply).toContain('Status atual');
    });

    it('should handle specific machine status', async () => {
        const result = await service.processMessage('status DEV-001');
        expect(result.reply).toContain('Status atual');
        expect(result.reply).toContain('DEV-001');
    });

    it('should answer natural predictive maintenance questions', async () => {
        const result = await service.processMessage('qual e a previsao analisada');
        expect(result.reply).toContain('Previsao analisada');
        expect(result.reply).toContain('Risco de falha');
        expect(result.reply).toContain('Vida util restante');
    });

    it('should explain KPI questions', async () => {
        const result = await service.processMessage('como esta o OEE?');
        expect(result.reply).toContain('OEE atual');
        expect(result.reply).toContain('80%');
    });
});
