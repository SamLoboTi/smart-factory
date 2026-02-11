import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorLeitura } from './sensor-leitura.entity';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(SensorLeitura)
    private sensorRepo: Repository<SensorLeitura>,
  ) { }

  // 1. /sensores: Últimas 20 leituras
  async getLatestReadings() {
    return this.sensorRepo.find({
      order: { id: 'DESC' },
      take: 20,
    });
  }

  // 2. /kpis: Cálculos agregados
  async getKPIs(startDate?: string, endDate?: string) {
    const queryBuilder = this.sensorRepo.createQueryBuilder('sensor');

    if (startDate) {
      queryBuilder.andWhere('sensor.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('sensor.timestamp <= :endDate', { endDate });
    }

    const totalReadings = await queryBuilder.getCount();

    const downtimeReadings = await queryBuilder
      .clone()
      .andWhere("sensor.status = 'parado'")
      .getCount();

    const operationalReadings = totalReadings - downtimeReadings;

    const disponibilidade = totalReadings > 0
      ? (operationalReadings / totalReadings) * 100
      : 0;

    const { avg: vibracaoMedia } = await queryBuilder
      .clone()
      .select('AVG(sensor.vibracao)', 'avg')
      .andWhere("sensor.status = 'rodando'")
      .getRawOne();

    const avgVib = parseFloat(vibracaoMedia?.toFixed(2) || '0');

    // --- OEE CALCULATION ---
    // Availability
    const availability = totalReadings > 0 ? (operationalReadings / totalReadings) : 0;

    // Performance (Simulated: vib < 2 is 100%, vib > 10 is 0%)
    const performance = Math.max(0, 1 - (avgVib / 10));

    // Quality (Simulated: vib < 5 is 98%, else 85%)
    const quality = avgVib < 5 ? 0.98 : 0.85;

    const oee = availability * performance * quality;

    // --- MTBF & MTTR ESTIMATION ---
    // Approximating "failures" as downtimeReadings / 3 (assuming avg stop duration = 3 ticks)
    // In a real scenario, we would count distinct 'stop' events.
    const estimatedFailures = Math.max(1, Math.ceil(downtimeReadings / 3));

    const mtbf = estimatedFailures > 0 ? (operationalReadings / estimatedFailures) : operationalReadings;
    const mttr = estimatedFailures > 0 ? (downtimeReadings / estimatedFailures) : 0;

    return {
      oee: Math.round(oee * 100), // Percent
      mtbf: parseFloat(mtbf.toFixed(1)), // Ticks/Minutes
      mttr: parseFloat(mttr.toFixed(1)), // Ticks/Minutes
      disponibilidade: parseFloat((availability * 100).toFixed(2)),
      leituras_totais: totalReadings,
      tempo_parado_registros: downtimeReadings,
      vibracao_media_operacao: avgVib,
      status_geral: oee > 0.85 ? 'Excelente' : oee > 0.60 ? 'Alerta' : 'Crítico'
    };
  }

  // 3. /alertas
  async getAlerts() {
    const readings = await this.sensorRepo.find({
      order: { id: 'DESC' },
      take: 100
    });

    const vibrationAlerts = readings.filter(r => r.vibracao > 4.5 && r.status === 'rodando');
    const riskAlerts = readings.filter(r => r.riskScore > 0.7);

    const stops = readings.filter(r => r.status === 'parado').slice(0, 5);

    const criticalVib = vibrationAlerts.length > 2; // More than 2 high vib events
    const criticalRisk = riskAlerts.length > 0;
    const criticalStops = stops.length > 2;

    return {
      vibracao_alta: vibrationAlerts.slice(0, 50),
      risco_alto: riskAlerts.slice(0, 50),
      ultimas_paradas: stops,
      critical_state: criticalVib || criticalRisk || criticalStops
    };
  }

  // 4. CHAT LOGIC (Native TypeScript - No Python Dependency)
  async processChat(message: string) {
    const msg = message.toLowerCase().trim();

    // 1. Greeting
    if (!msg || msg.includes('ola') || msg.includes('oi') || msg.includes('ajuda')) {
      return { reply: "Olá! Sou seu assistente inteligente. Monitorando a planta em tempo real. Como posso ajudar você hoje?" };
    }

    // 2. Report Requests
    if (msg.includes('relatorio') || msg.includes('relatório')) {
      // Quick Report
      if (msg.includes('rapido') || msg.includes('rápido') || msg.includes('atual') || msg.includes('agora')) {
        return await this.generateQuickReport();
      }

      // Complete Report
      if (msg.includes('completo') || msg.includes('historico') || msg.includes('histórico')) {
        return { reply: "Para o relatório completo, por favor informe a data e hora (dd/mm/aaaa hh:mm)." };
      }

      // General report inquiry
      return { reply: "Você gostaria de um relatório **Rápido** (situação atual) ou **Completo** (histórico)? Por favor, especifique." };
    }

    // 3. Status Check
    if (msg.includes('status')) {
      const readings = await this.getLatestReadings();
      if (!readings.length) return { reply: "Sem dados recentes disponíveis." };

      const last = readings[0];
      const statusIcon = last.status === 'rodando' ? '🟢' : '🔴';
      return {
        reply: `${statusIcon} [AGORA] ${last.device_id}: ${last.status}. Temperatura: ${last.temperatura.toFixed(1)}°C.`
      };
    }

    // 4. Alerts
    if (msg.includes('falha') || msg.includes('alerta') || msg.includes('parada') || msg.includes('erro') || msg.includes('risco')) {
      const alerts = await this.getAlerts();
      const count = alerts.vibracao_alta.length + alerts.ultimas_paradas.length + alerts.risco_alto.length;

      if (count === 0) return { reply: "✅ Nenhuma anomalia detectada recentemente." };

      let reply = `🚨 Atenção: Detectei ${count} eventos recentes. `;
      if (alerts.risco_alto.length > 0) {
        reply += `⚠️ HÁ ${alerts.risco_alto.length} INDICAÇÕES DE ALTO RISCO DE FALHA (ML)! `;
      }
      return { reply };
    }

    // 5. Temperature/Vibration
    if (msg.includes('temperatura') || msg.includes('vibra')) {
      const readings = await this.getLatestReadings();
      if (!readings.length) return { reply: "Sem dados nos sensores ainda." };
      const last = readings[0];
      return { reply: `📊 Última leitura: ${last.temperatura.toFixed(1)}°C / ${last.vibracao.toFixed(2)}mm/s` };
    }

    // Fallback
    return {
      reply: "Desculpe, não entendi o comando. Tente:\n- 'Status'\n- 'Relatório rápido'\n- 'Relatório completo'\n- 'Alertas'"
    };
  }

  // Generate Quick Report (Native TypeScript)
  async generateQuickReport() {
    const readings = await this.sensorRepo.find({
      order: { id: 'DESC' },
      take: 5
    });

    if (!readings.length) {
      return { reply: "Sem dados recentes disponíveis." };
    }

    const last = readings[0];
    const deviceId = last.device_id || 'DEV-100';

    // Calculate risk score (simple heuristic)
    const tempRatio = last.temperatura / 85.0;
    const vibRatio = last.vibracao / 4.5;
    const riskScore = Math.max(tempRatio, vibRatio);
    const riskPct = Math.min(100, riskScore * 100);

    // Determine status
    let status: string;
    let analysis: string;
    let recommendation: string;

    if (riskPct < 30) {
      status = "Normal (Operação Estável)";
      analysis = "Parâmetros operacionais dentro da normalidade.";
      recommendation = "Manter monitoramento padrão.";
    } else if (riskPct < 70) {
      status = "Preventivo (antes do modo crítico)";
      analysis = "Tendência de aumento de risco detectada.";
      recommendation = "Inspeção preventiva e monitoramento reforçado.";
    } else {
      status = "CRÍTICO";
      analysis = "Deterioração acelerada e alta probabilidade de falha.";
      recommendation = "PARADA IMEDIATA para manutenção.";
    }

    // Determine primary sensor
    const sensor = vibRatio > tempRatio ? "Vibração" : "Temperatura";
    const value = vibRatio > tempRatio ? last.vibracao : last.temperatura;
    const limit = vibRatio > tempRatio ? 4.5 : 85.0;
    const unit = vibRatio > tempRatio ? "mm/s" : "°C";

    // Format timestamp
    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} – ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Build report
    const report = `⚠️ RELATÓRIO RÁPIDO (AGORA)

Status: ${status}
Data/Hora: ${timestamp}
Equipamento: ${deviceId}
Sensor: ${sensor}
Valor Atual: ${value.toFixed(2)} ${unit}
Limite Operacional: ${limit} ${unit}
Risco Estimado (IA): ${riskPct.toFixed(1)}%

Análise:
${analysis}

Recomendação:
${recommendation}`;

    return { reply: report };
  }

  // 5. REPORT GENERATION
  async generateFullReport() {
    const kpis = await this.getKPIs();
    const alerts = await this.getAlerts();

    // Simulating fetching RUL from python or DB (here simple aggregation)
    // Ideally we would query the new 'predicted_rul' column if we exposed it via TypeORM entity
    // For now, we wrap the existing data.

    const report = {
      generated_at: new Date().toISOString(),
      title: "Relatório Consolidado Smart Factory",
      kpis: kpis,
      critical_events: alerts.risco_alto.length + alerts.vibracao_alta.length,
      alerts: {
        high_risk_devices: alerts.risco_alto.map(a => a.device_id),
        vibration_warnings: alerts.vibracao_alta.length
      },
      energy_efficiency: "Analysis Not Integrated yet (Requires DB schema update in NestJS)"
    };

    return report;
  }
}
