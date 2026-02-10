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

  // 4. CHAT LOGIC (Hybrid: TS Heuristic + Python Core)
  async processChat(message: string) {
    const msg = message.toLowerCase();

    // 1. Heurísticas Rápidas (TS)
    if (msg.includes('ola') || msg.includes('oi') || msg.includes('ajuda')) {
      return { reply: "🤖 Olá! Sou o assistente da Smart Factory. Pergunte sobre 'status <id>', 'oee <id>', 'falhas' ou 'vibração'." };
    }

    // Lógica de Alertas
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

    if (msg.includes('temperatura') || msg.includes('vibra')) {
      const readings = await this.getLatestReadings();
      if (!readings.length) return { reply: "Sem dados nos sensores ainda." };
      const last = readings[0];
      return { reply: `📊 Última leitura: ${last.temperatura.toFixed(1)}°C / ${last.vibracao.toFixed(2)}mm/s` };
    }

    // 2. Inteligência Avançada (Python)
    try {
      const { stdout } = await execAsync(`python ../src/assistant.py "${message}"`);
      if (stdout && stdout.trim()) {
        return { reply: stdout.trim() };
      }
    } catch (error) {
      console.error("Assistant Error:", error);
    }

    return { reply: "🤔 Não entendi. Tente perguntar sobre 'status [id]', 'oee [id]' ou 'falhas'." };
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
