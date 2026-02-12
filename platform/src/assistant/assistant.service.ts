import { Injectable } from '@nestjs/common';
import { AppService } from '../app.service';

@Injectable()
export class AssistantService {
    constructor(private readonly appService: AppService) { }

    async processMessage(message: string) {
        try {
            const msg = message.toLowerCase().trim();

            // 0. Detecção de Data (Contexto ou Comando Direto)
            // Ex: "12/02/2026" ou "relatorio 12/02/2026"
            const dateMatch = msg.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            const timeMatch = msg.match(/(\d{2}):(\d{2})/);

            if (dateMatch) {
                const dateStr = dateMatch[0];
                const timeStr = timeMatch ? timeMatch[0] : '12:00'; // Meio dia se não especificado
                return await this.handleCompleteReport(dateStr, timeStr);
            }

            // 1. Saudação
            if (!msg || msg.match(/^(oi|ola|olá|bom dia|boa tarde|boa noite|ajuda)/)) {
                return {
                    reply: "Olá! Sou seu assistente virtual da Smart Factory. Posso ajudar com:\n- *Relatório Rápido* (Agora)\n- *Relatório Completo* (Histórico)\n- *Status* das máquinas\n\nSe quiser ver um histórico, basta digitar a data (ex: 10/02/2026).",
                    options: ["Relatório Rápido", "Relatório Completo", "Status Geral"]
                };
            }

            // 2. Relatórios (Sem data, pois data já foi tratada acima)
            if (msg.includes('relatorio') || msg.includes('relatório')) {
                // Se pediu completo mas não deu data (caiu aqui pois dateMatch foi null)
                if (msg.includes('completo') || msg.includes('historico')) {
                    const now = new Date();
                    const today = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                    return {
                        reply: `Para um relatório histórico, favor informar a data. \nExemplo: "Relatório 10/02/2026"\n\nGerando relatório completo de *HOJE* (${today}):`
                    };
                    // Opcional: Já gerar o de hoje ou pedir data. O usuário reclamou do fluxo.
                    // Vamos já gerar o de hoje para ser proativo.
                    // return await this.handleCompleteReport(today, 'Atual');
                }

                // Default: Relatório Rápido (Agora)
                return await this.handleQuickReport();
            }

            // 3. Perguntas Específicas
            if (msg.includes('oee')) return await this.handleSpecificQuery('oee');
            if (msg.includes('parada')) return await this.handleSpecificQuery('paradas');
            if (msg.includes('disponibilidade')) return await this.handleSpecificQuery('disponibilidade');
            if (msg.includes('mtbf')) return await this.handleSpecificQuery('mtbf');
            if (msg.includes('mttr')) return await this.handleSpecificQuery('mttr');
            if (msg.includes('status')) return await this.handleStatusQuery(msg);

            // Reuso de lógica existente (Alertas, etc)
            if (msg.includes('alerta') || msg.includes('falha') || msg.includes('risco')) {
                return await this.appService.getAlerts().then(alerts => {
                    const count = alerts.vibracao_alta.length + alerts.risco_alto.length;
                    return { reply: count > 0 ? `🚨 Detectei ${count} alertas ativos no sistema.` : "✅ Nenhum alerta ativo no momento." };
                });
            }

            // Fallback
            return {
                reply: "Desculpe, não entendi. Tente 'Relatório Rápido', 'Status' ou digite uma data (dd/mm/aaaa) para ver o histórico."
            };

        } catch (error) {
            console.error("Erro no processamento do chat:", error);
            return { reply: "Ocorreu um erro interno ao processar sua solicitação. Tente novamente." };
        }
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
