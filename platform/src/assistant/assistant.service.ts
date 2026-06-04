import { Injectable } from '@nestjs/common';
import { AppService } from '../app.service';

type AssistantReply = {
    reply: string;
    options?: string[];
};

type RiskResult = {
    device_id?: string;
    samples?: number;
    failure_risk?: number;
    failure_probability_24h?: number;
    anomaly_score?: number;
    is_anomaly?: boolean;
    rul_hours?: number;
    rul_days?: number;
    energy_waste?: number;
    explanation?: string[];
    model_version?: string;
};

@Injectable()
export class AssistantService {
    constructor(private readonly appService: AppService) { }

    async processMessage(message: string): Promise<AssistantReply> {
        try {
            const original = (message || '').trim();
            const msg = this.normalize(original);

            const dateMatch = original.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            const timeMatch = original.match(/(\d{2}):(\d{2})/);

            if (dateMatch) {
                const dateStr = dateMatch[0];
                const timeStr = timeMatch ? timeMatch[0] : '12:00';
                return await this.handleCompleteReport(dateStr, timeStr);
            }

            if (!msg || this.hasAny(msg, ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ajuda', 'help'])) {
                return this.handleGreeting();
            }

            if (this.hasAny(msg, ['o que voce faz', 'o que vc faz', 'como voce ajuda', 'comandos', 'duvidas', 'perguntas'])) {
                return this.handleCapabilities();
            }

            if (this.hasAny(msg, ['relatorio', 'resumo', 'diagnostico geral', 'situacao geral'])) {
                if (this.hasAny(msg, ['completo', 'historico', 'detalhado'])) {
                    const now = new Date();
                    const today = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                    return {
                        reply: `Para um relatorio historico, informe uma data no formato dd/mm/aaaa.\nExemplo: "relatorio 10/02/2026".\n\nPosso tambem analisar agora: "qual e a previsao analisada?"`,
                        options: [`Relatorio ${today}`, 'Qual e a previsao analisada?', 'Status geral']
                    };
                }

                return await this.handleQuickReport();
            }

            if (this.isPredictionIntent(msg)) {
                return await this.handlePredictionQuery(original);
            }

            if (this.hasAny(msg, ['anomalia', 'fora do padrao', 'comportamento anormal'])) {
                return await this.handleAnomalyQuery(original);
            }

            if (this.hasAny(msg, ['alerta', 'alertas', 'risco', 'falha', 'falhas', 'critico', 'critica'])) {
                return await this.handleAlertsQuery();
            }

            if (this.hasAny(msg, ['oee', 'disponibilidade', 'mtbf', 'mttr', 'kpi', 'indicador', 'indicadores'])) {
                return await this.handleKpiQuery(msg);
            }

            if (this.hasAny(msg, ['sensor', 'sensores', 'temperatura', 'vibracao', 'pressao', 'corrente', 'rotacao'])) {
                return await this.handleSensorQuery();
            }

            if (this.hasAny(msg, ['status', 'linha', 'maquina', 'equipamento', 'planta'])) {
                return await this.handleStatusQuery(original);
            }

            if (this.hasAny(msg, ['manutencao', 'preventiva', 'preditiva', 'recomendacao', 'recomenda'])) {
                return await this.handleMaintenanceQuery(original);
            }

            return {
                reply: `Nao encontrei essa intencao ainda, mas posso ajudar com:\n- previsao de falha e RUL\n- anomalias e alertas\n- OEE, MTBF, MTTR e disponibilidade\n- status dos sensores\n- relatorio rapido ou historico\n\nExemplo: "qual e a previsao analisada?"`,
                options: ['Qual e a previsao analisada?', 'Relatorio rapido', 'Status geral']
            };

        } catch (error) {
            console.error('Erro no processamento do chat:', error);
            return { reply: 'Ocorreu um erro interno ao processar sua solicitacao. Tente novamente.' };
        }
    }

    private handleGreeting(): AssistantReply {
        return {
            reply: `Ola! Sou o assistente da Smart Factory.\n\nPosso responder perguntas sobre previsao de falha, anomalias, sensores, KPIs, alertas, paradas e manutencao preditiva.\n\nPergunte, por exemplo: "qual e a previsao analisada?" ou "explique o risco atual".`,
            options: ['Qual e a previsao analisada?', 'Relatorio rapido', 'Alertas ativos']
        };
    }

    private handleCapabilities(): AssistantReply {
        return {
            reply: `Eu consigo consultar o sistema e explicar:\n\n*Operacao*\n- status geral da planta\n- ultimas leituras de sensores\n- paradas e alertas ativos\n\n*KPIs*\n- OEE\n- disponibilidade\n- MTBF\n- MTTR\n\n*IA preditiva*\n- probabilidade de falha\n- deteccao de anomalia\n- RUL, vida util restante\n- motivos da previsao\n\nTente: "qual e a previsao analisada?", "tem anomalia?", "como esta o OEE?"`,
            options: ['Como esta o OEE?', 'Tem anomalia?', 'Risco de falha']
        };
    }

    private async handleQuickReport(): Promise<AssistantReply> {
        const kpis = await this.appService.getKPIs();
        const alerts = await this.appService.getAlerts();

        const statusGeral = kpis.oee > 85 ? 'Verde - excelente' : kpis.oee > 60 ? 'Amarelo - atencao' : 'Vermelho - critico';
        const recomendacao = kpis.oee < 60
            ? 'Priorizar investigacao de paradas e manutencao.'
            : alerts.risco_alto.length > 0
                ? 'Revisar equipamentos com alto risco antes que virem parada.'
                : 'Manter monitoramento e rotina preventiva.';

        const report = `Relatorio rapido (agora)

OEE geral: ${kpis.oee}%
Status: ${statusGeral}

Paradas: ${kpis.tempo_parado_registros} ocorrencias
MTBF: ${kpis.mtbf} min
MTTR: ${kpis.mttr} min
Disponibilidade: ${kpis.disponibilidade}%

Alertas ativos:
- Vibracao alta: ${alerts.vibracao_alta.length}
- Risco ML: ${alerts.risco_alto.length}

Leitura operacional:
${recomendacao}

Para aprofundar, pergunte: "qual e a previsao analisada?"`;

        return { reply: report };
    }

    private async handlePredictionQuery(message: string): Promise<AssistantReply> {
        const deviceId = await this.resolveDeviceId(message);
        const risk = await this.appService.getEquipmentRisk(deviceId) as RiskResult;
        const alerts = await this.appService.getAlerts();

        const riskPct = this.percent(risk.failure_risk ?? risk.failure_probability_24h ?? 0);
        const anomalyPct = this.percent(risk.anomaly_score ?? 0);
        const rulHours = Number(risk.rul_hours ?? 0);
        const rulText = rulHours > 0 ? `${rulHours.toFixed(1)} horas (${Number(risk.rul_days ?? rulHours / 24).toFixed(1)} dias)` : 'sem estimativa suficiente';
        const level = this.riskLevel(risk.failure_risk ?? 0);
        const explanations = this.formatExplanations(risk.explanation);

        return {
            reply: `Previsao analisada para ${deviceId}

Risco de falha: ${riskPct}% (${level})
Anomalia: ${risk.is_anomaly ? 'sim' : 'nao'} - score ${anomalyPct}%
Vida util restante (RUL): ${rulText}
Amostras analisadas: ${risk.samples ?? 0}
Modelo: ${risk.model_version ?? 'indisponivel'}

Por que o sistema chegou nessa previsao:
${explanations}

Contexto de alertas:
- Equipamentos em alto risco ML: ${alerts.risco_alto.length}
- Alertas de vibracao: ${alerts.vibracao_alta.length}

Recomendacao:
${this.recommendationForRisk(risk.failure_risk ?? 0, Boolean(risk.is_anomaly), rulHours)}`,
            options: ['Explique o OEE', 'Tem anomalia?', `Status ${deviceId}`]
        };
    }

    private async handleAnomalyQuery(message: string): Promise<AssistantReply> {
        const deviceId = await this.resolveDeviceId(message);
        const risk = await this.appService.getEquipmentRisk(deviceId) as RiskResult;
        const score = this.percent(risk.anomaly_score ?? 0);

        return {
            reply: `Analise de anomalia para ${deviceId}

Resultado: ${risk.is_anomaly ? 'anomalia detectada' : 'sem anomalia relevante'}
Score de anomalia: ${score}%
Risco de falha associado: ${this.percent(risk.failure_risk ?? 0)}%

Explicacao:
${this.formatExplanations(risk.explanation)}

Acao sugerida:
${risk.is_anomaly ? 'Verificar tendencia de vibracao/temperatura e inspecionar o equipamento no proximo ciclo operacional.' : 'Manter monitoramento normal e acompanhar novas leituras.'}`
        };
    }

    private async handleAlertsQuery(): Promise<AssistantReply> {
        const alerts = await this.appService.getAlerts();
        const count = alerts.vibracao_alta.length + alerts.ultimas_paradas.length + alerts.risco_alto.length;

        if (count === 0) {
            return { reply: 'Nenhum alerta ativo no momento. A planta esta sem indicios recentes de vibracao alta, alto risco ML ou parada critica.' };
        }

        const highRiskDevices = alerts.risco_alto
            .map((item) => item.device_id)
            .filter(Boolean)
            .slice(0, 5)
            .join(', ') || 'nao identificado';

        return {
            reply: `Alertas ativos no sistema

Total de eventos recentes: ${count}
- Risco alto por ML: ${alerts.risco_alto.length}
- Vibracao alta: ${alerts.vibracao_alta.length}
- Ultimas paradas: ${alerts.ultimas_paradas.length}

Equipamentos em destaque:
${highRiskDevices}

Prioridade:
1. Validar equipamentos com risco ML alto.
2. Cruzar com paradas recentes.
3. Planejar inspecao preventiva antes de uma parada nao planejada.`
        };
    }

    private async handleKpiQuery(msg: string): Promise<AssistantReply> {
        const kpis = await this.appService.getKPIs();

        if (msg.includes('oee')) {
            return { reply: `OEE atual: ${kpis.oee}%.\n\nOEE mede eficiencia global do equipamento: disponibilidade x performance x qualidade. Meta industrial comum: acima de 85%. Neste momento o status e ${kpis.status_geral}.` };
        }

        if (msg.includes('mtbf')) {
            return { reply: `MTBF atual: ${kpis.mtbf} min.\n\nMTBF e o tempo medio entre falhas. Quanto maior, melhor. Um MTBF baixo indica repeticao de falhas ou paradas frequentes.` };
        }

        if (msg.includes('mttr')) {
            return { reply: `MTTR atual: ${kpis.mttr} min.\n\nMTTR e o tempo medio de reparo. Quanto menor, melhor. Ele mede rapidez de recuperacao apos uma parada.` };
        }

        if (msg.includes('disponibilidade')) {
            return { reply: `Disponibilidade atual: ${kpis.disponibilidade}%.\n\nEla indica quanto tempo a linha ficou operacional em relacao ao total monitorado.` };
        }

        return {
            reply: `KPIs atuais

OEE: ${kpis.oee}%
Disponibilidade: ${kpis.disponibilidade}%
MTBF: ${kpis.mtbf} min
MTTR: ${kpis.mttr} min
Paradas registradas: ${kpis.tempo_parado_registros}
Status geral: ${kpis.status_geral}`
        };
    }

    private async handleSensorQuery(): Promise<AssistantReply> {
        const readings = await this.appService.getLatestReadings();
        if (!readings.length) {
            return { reply: 'Ainda nao ha leituras recentes de sensores.' };
        }

        const last = readings[0];
        const avgTemp = readings.reduce((sum, item) => sum + Number(item.temperatura ?? 0), 0) / readings.length;
        const avgVib = readings.reduce((sum, item) => sum + Number(item.vibracao ?? 0), 0) / readings.length;

        return {
            reply: `Ultimas leituras de sensores

Equipamento mais recente: ${last.device_id}
Status: ${last.status}
Temperatura atual: ${Number(last.temperatura).toFixed(1)} C
Vibracao atual: ${Number(last.vibracao).toFixed(2)} mm/s
Pressao atual: ${Number(last.pressure ?? 0).toFixed(2)}

Media das ultimas ${readings.length} leituras:
- Temperatura: ${avgTemp.toFixed(1)} C
- Vibracao: ${avgVib.toFixed(2)} mm/s`
        };
    }

    private async handleStatusQuery(message: string): Promise<AssistantReply> {
        const readings = await this.appService.getLatestReadings();
        if (!readings.length) {
            return { reply: 'Sem dados recentes disponiveis para status.' };
        }

        const deviceId = this.extractDeviceId(message);
        const reading = deviceId
            ? readings.find((item) => item.device_id?.toUpperCase() === deviceId)
            : readings[0];

        const last = reading || readings[0];
        const statusText = last.status === 'rodando' || last.status === 'running' ? 'operando' : 'parado/atencao';

        return {
            reply: `Status atual

Equipamento: ${last.device_id}
Estado: ${statusText}
Temperatura: ${Number(last.temperatura).toFixed(1)} C
Vibracao: ${Number(last.vibracao).toFixed(2)} mm/s
Pressao: ${Number(last.pressure ?? 0).toFixed(2)}

Para previsao desse equipamento, pergunte: "previsao ${last.device_id}".`
        };
    }

    private async handleMaintenanceQuery(message: string): Promise<AssistantReply> {
        const deviceId = await this.resolveDeviceId(message);
        const risk = await this.appService.getEquipmentRisk(deviceId) as RiskResult;
        const rulHours = Number(risk.rul_hours ?? 0);

        return {
            reply: `Recomendacao de manutencao para ${deviceId}

Risco de falha: ${this.percent(risk.failure_risk ?? 0)}%
RUL estimado: ${rulHours > 0 ? `${rulHours.toFixed(1)} horas` : 'indisponivel'}
Anomalia: ${risk.is_anomaly ? 'sim' : 'nao'}

Acao recomendada:
${this.recommendationForRisk(risk.failure_risk ?? 0, Boolean(risk.is_anomaly), rulHours)}

Motivos:
${this.formatExplanations(risk.explanation)}`
        };
    }

    private async handleCompleteReport(date: string, time: string): Promise<AssistantReply> {
        const [day, month, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);

        if (isNaN(dateObj.getTime())) {
            return { reply: 'Data invalida. Use o formato dd/mm/aaaa.' };
        }

        const startDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 23:59:59`;

        const kpis = await this.appService.getKPIs(startDate, endDate);
        const alerts = await this.appService.getAlerts();

        const tendencia = kpis.vibracao_media_operacao > 3.0 ? 'tendencia de alta vibracao' : 'estavel';
        const probFalha = alerts.risco_alto.length > 0 ? 'elevada em equipamentos monitorados' : 'baixa/moderada';

        const report = `Relatorio completo
Data base: ${date} as ${time}

Indicadores de performance:
- OEE: ${kpis.oee}%
- Disponibilidade: ${kpis.disponibilidade}%
- MTBF: ${kpis.mtbf} min
- MTTR: ${kpis.mttr} min
- Total de paradas: ${kpis.tempo_parado_registros}

Analise preditiva:
- Tendencia: ${tendencia}
- Probabilidade de falha futura: ${probFalha}
- Vibracao media: ${kpis.vibracao_media_operacao} mm/s

Resumo de alertas:
- Risco ML: ${alerts.risco_alto.length}
- Vibracao alta: ${alerts.vibracao_alta.length}

Conclusao:
${alerts.risco_alto.length > 0 ? 'Ha equipamentos que precisam de priorizacao preventiva.' : 'Nao ha indicio critico dominante no recorte analisado.'}`;

        return { reply: report };
    }

    private isPredictionIntent(msg: string): boolean {
        return this.hasAny(msg, [
            'previsao',
            'predicao',
            'preditiva',
            'prever',
            'probabilidade',
            'chance de falha',
            'risco de falha',
            'vida util',
            'rul',
            'tempo ate falha',
            'previsao analisada',
            'analise analisada',
            'analisada',
        ]);
    }

    private async resolveDeviceId(message: string): Promise<string> {
        const explicit = this.extractDeviceId(message);
        if (explicit) {
            return explicit;
        }

        const readings = await this.appService.getLatestReadings();
        return readings[0]?.device_id || 'DEV-100';
    }

    private extractDeviceId(message: string): string | null {
        const match = message.toUpperCase().match(/DEV-\d+/);
        return match ? match[0] : null;
    }

    private normalize(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private hasAny(msg: string, terms: string[]): boolean {
        return terms.some((term) => msg.includes(term));
    }

    private percent(value: number): string {
        return (Math.max(0, Math.min(1, Number(value) || 0)) * 100).toFixed(1);
    }

    private riskLevel(value: number): string {
        if (value >= 0.80) return 'critico';
        if (value >= 0.60) return 'alto';
        if (value >= 0.35) return 'moderado';
        return 'baixo';
    }

    private recommendationForRisk(risk: number, isAnomaly: boolean, rulHours: number): string {
        if (risk >= 0.80 || rulHours > 0 && rulHours < 72) {
            return 'Prioridade alta: abrir inspecao/manutencao preventiva e avaliar parada planejada.';
        }

        if (risk >= 0.60 || isAnomaly) {
            return 'Prioridade media/alta: reforcar monitoramento, validar sensores e programar inspecao.';
        }

        if (risk >= 0.35) {
            return 'Prioridade media: acompanhar tendencia nas proximas leituras e revisar historico de manutencao.';
        }

        return 'Prioridade normal: manter rotina preventiva e monitoramento automatico.';
    }

    private formatExplanations(explanations?: string[]): string {
        if (!explanations || explanations.length === 0) {
            return '- Sem explicacao detalhada disponivel para esta leitura.';
        }

        const translated = explanations.map((item) => this.translateExplanation(item));
        return translated.slice(0, 6).map((item) => `- ${item}`).join('\n');
    }

    private translateExplanation(text: string): string {
        const dictionary: Record<string, string> = {
            'High failure risk detected by the predictive model.': 'o modelo preditivo detectou risco alto de falha.',
            'Moderate failure risk detected by the predictive model.': 'o modelo preditivo detectou risco moderado de falha.',
            'Vibration is above the historical safe range.': 'a vibracao esta acima da faixa historica segura.',
            'Vibration is rising in the latest readings.': 'a vibracao esta subindo nas leituras recentes.',
            'Temperature is close to or above the operational limit.': 'a temperatura esta proxima ou acima do limite operacional.',
            'Temperature is trending upward.': 'a temperatura apresenta tendencia de alta.',
            'Equipment has high accumulated operating hours.': 'o equipamento tem muitas horas acumuladas de operacao.',
            'Maintenance interval appears overdue.': 'o intervalo de manutencao parece vencido.',
            'Machine load is high, increasing mechanical stress.': 'a carga da maquina esta alta, aumentando o estresse mecanico.',
            'Current telemetry is outside the learned normal operating pattern.': 'a telemetria atual esta fora do padrao normal aprendido.',
            'Estimated RUL is below 72 hours.': 'a vida util restante estimada esta abaixo de 72 horas.',
            'Telemetry is within the learned normal operating envelope.': 'a telemetria esta dentro do padrao operacional aprendido.',
            'No readings available for inference.': 'nao ha leituras suficientes para inferencia.',
        };

        return dictionary[text] || text;
    }
}
