import { Injectable } from '@nestjs/common';
import { AppService } from '../app.service';

@Injectable()
export class AssistantService {
    constructor(private readonly appService: AppService) { }

    async processMessage(message: string) {
        const msg = message.toLowerCase().trim();

        // 1. Saudação
        if (!msg || msg.match(/^(oi|ola|olá|bom dia|boa tarde|boa noite|ajuda)/)) {
            return {
                reply: "Olá! Sou seu assistente virtual da Smart Factory. Posso fornecer relatórios de status, KPIs, alertas e histórico. Como posso ajudar?",
                options: ["Relatório Rápido", "Relatório Completo", "Status das Máquinas", "Alertas Ativos"]
            };
        }

        // 2. Relatórios
        if (msg.includes('relatorio') || msg.includes('relatório')) {
            // Tipo 1: Rápido
            if (msg === 'relatorio' || msg === 'relatório' || msg.includes('rapido') || msg.includes('rápido') || msg.includes('agora')) {
                return await this.handleQuickReport();
            }

            // Tipo 2: Completo
            if (msg.includes('completo')) {
                // Tenta extrair data e hora
                const dateMatch = msg.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                const timeMatch = msg.match(/(\d{2}):(\d{2})/);

                if (dateMatch) {
                    const dateStr = dateMatch[0];
                    const timeStr = timeMatch ? timeMatch[0] : '00:00';
                    return await this.handleCompleteReport(dateStr, timeStr);
                } else {
                    // Se pediu completo mas não passou data, usa data atual
                    const now = new Date();
                    const today = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    return await this.handleCompleteReport(today, time);
                }
            }
        }

        // 3. Perguntas Específicas (NLP Simples)
        if (msg.includes('oee')) return await this.handleSpecificQuery('oee');
        if (msg.includes('parada')) return await this.handleSpecificQuery('paradas');
        if (msg.includes('disponibilidade')) return await this.handleSpecificQuery('disponibilidade');
        if (msg.includes('performance')) return await this.handleSpecificQuery('performance');
        if (msg.includes('qualidade')) return await this.handleSpecificQuery('qualidade');
        if (msg.includes('mtbf')) return await this.handleSpecificQuery('mtbf');
        if (msg.includes('mttr')) return await this.handleSpecificQuery('mttr');
        if (msg.includes('status')) return await this.handleStatusQuery(msg);
        if (msg.includes('alerta') || msg.includes('falha') || msg.includes('risco')) return await this.appService.processChat(message); // Reusa ou implementa novo

        // Fallback
        return {
            reply: "Desculpe, não entendi. Tente 'Relatório', 'Relatório Completo', 'Status da máquina' ou pergunte sobre 'OEE', 'MTBF', etc."
        };
    }

    private async handleQuickReport() {
        const kpis = await this.appService.getKPIs();
        const alerts = await this.appService.getAlerts();
        const lastReadings = await this.appService.getLatestReadings();

        // Status Geral baseado no OEE
        const statusGeral = kpis.oee > 85 ? '🟢 Excelente' : kpis.oee > 60 ? '🟡 Atenção' : '🔴 Crítico';

        const report = `📊 *Relatório Rápido (Agora)*

*OEE Geral:* ${kpis.oee}%
*Status:* ${statusGeral}

*Paradas:* ${kpis.tempo_parado_registros} ocorrências
*MTBF:* ${kpis.mtbf} min | *MTTR:* ${kpis.mttr} min

*Alertas Ativos:*
- Vibração Alta: ${alerts.vibracao_alta.length}
- Risco (ML): ${alerts.risco_alto.length}

_Para detalhes históricos, digite 'relatorio completo'._`;

        return { reply: report };
    }

    private async handleCompleteReport(date: string, time: string) {
        // Validar data
        const [day, month, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);

        if (isNaN(dateObj.getTime())) {
            return { reply: "❌ Data inválida. Use o formato dd/mm/aaaa." };
        }

        // Filtro de data para KPI (Simulado: AppService aceita strings startDate/endDate)
        // Vamos definir o dia todo para o relatório completo daquele dia
        const startDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 23:59:59`;

        const kpis = await this.appService.getKPIs(startDate, endDate);
        const alerts = await this.appService.getAlerts(); // Alertas geralmente são os atuais, se precisar de histórico teria que alterar AppService

        // Análise de Tendência (Simulada)
        const tendencia = kpis.vibracao_media_operacao > 3.0 ? "Tendência de Alta Vibração 📈" : "Estável ➡️";
        const probFalha = kpis.vibracao_media_operacao > 4.0 ? "ALTA (Requer Manutenção)" : "Baixa";

        const report = `📑 *Relatório Completo*
📅 Data Base: ${date} às ${time}

*Indicadores de Performance (KPIs)*
- **OEE:** ${kpis.oee}%
- Disponibilidade: ${kpis.disponibilidade}%
- Performance: 100% (Simulado)
- Qualidade: 98% (Simulado)

*Confiabilidade*
- MTBF: ${kpis.mtbf} min
- MTTR: ${kpis.mttr} min
- Total Paradas: ${kpis.tempo_parado_registros}

*Análise Preditiva*
- Tendência: ${tendencia}
- Probabilidade de Falha Futura: ${probFalha}
- Vibração Média: ${kpis.vibracao_media_operacao} mm/s

*Resumo de Alertas (Do Dia)*
- Críticos: ${alerts.risco_alto.length}
- Avisos: ${alerts.vibracao_alta.length}

_Fim do relatório._`;

        return { reply: report };
    }

    private async handleSpecificQuery(topic: string) {
        const kpis = await this.appService.getKPIs();

        switch (topic) {
            case 'oee':
                return { reply: `O OEE atual da planta é de **${kpis.oee}%**. (Meta: >85%)` };
            case 'paradas':
                return { reply: `Registramos **${kpis.tempo_parado_registros}** paradas hoje.` };
            case 'disponibilidade':
                return { reply: `A disponibilidade operacional está em **${kpis.disponibilidade}%**.` };
            case 'mtbf':
                return { reply: `O MTBF (Tempo Médio Entre Falhas) atual é de **${kpis.mtbf}** minutos.` };
            case 'mttr':
                return { reply: `O MTTR (Tempo Médio de Reparo) atual é de **${kpis.mttr}** minutos.` };
            default:
                return { reply: "Dado não encontrado." };
        }
    }

    private async handleStatusQuery(msg: string) {
        // Tenta extrair ID da máquina
        const match = msg.match(/(maquina|máquina|linha) (\d+)/i);
        const deviceId = match ? `DEV-00${match[2]}` : null; // Exemplo simples

        const readings = await this.appService.getLatestReadings();

        if (deviceId && match) {
            // Buscar específico (filtrando na memória pois getLatestReadings retorna 20 ultimos gerais)
            // Idealmente teria um getStatusByDevice no AppService
            return { reply: `Status da ${match[0]}: Operando normalmente (Simulado - Integração pendente).` };
        }

        // Status Geral
        const last = readings[0];
        const status = last?.status === 'rodando' ? '🟢 Operando' : '🔴 Parado';
        return { reply: `Status Geral da Linha: ${status}. Temperatura: ${last?.temperatura.toFixed(1)}°C.` };
    }
}
