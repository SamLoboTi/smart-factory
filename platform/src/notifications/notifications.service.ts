import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NotificationConfigInput,
  NotificationConfigStore,
} from './notification-config.store';

type NotificationSeverity = 'pre_alert' | 'critical';

interface DispatchInput {
  eventKey: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly store: NotificationConfigStore) { }

  getPublicConfig() {
    return this.store.getPublicConfig();
  }

  async saveConfig(input: Partial<NotificationConfigInput>) {
    const current = await this.store.getConfig();
    const validated = this.validateConfig({
      ...input,
      recipientPhone: input.recipientPhone || current.recipientPhone,
    });
    return this.store.saveConfig(validated);
  }

  async sendTest() {
    const config = await this.store.getConfig();

    if (!config.recipientPhone) {
      throw new BadRequestException('Configure um destinatario antes de enviar o teste.');
    }

    return this.dispatch({
      eventKey: 'manual-test',
      severity: 'pre_alert',
      title: 'Teste de notificacao Smart Factory',
      message: [
        'Teste de notificacao do Smart Factory.',
        `Destinatario: ${config.recipientName || 'operador responsavel'}`,
        'Canal: WhatsApp via Twilio',
      ].join('\n'),
    }, true);
  }

  async notifyAlert(input: DispatchInput) {
    const config = await this.store.getConfig();

    if (!config.enabled || !config.recipientPhone) {
      return { sent: false, reason: 'notifications_disabled' };
    }

    if (config.minSeverity === 'critical' && input.severity !== 'critical') {
      return { sent: false, reason: 'severity_below_configured_minimum' };
    }

    const canSend = await this.store.canSend(input.eventKey, input.severity, config.cooldownMinutes);
    if (!canSend) {
      return { sent: false, reason: 'cooldown_active' };
    }

    return this.dispatch(input);
  }

  private async dispatch(input: DispatchInput, force = false) {
    const config = await this.store.getConfig();
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;
    const providerConfigured = Boolean(accountSid && authToken && from);
    const recipientLast4 = config.recipientPhone.replace(/\D/g, '').slice(-4);
    const body = `[${input.severity.toUpperCase()}] ${input.title}\n\n${input.message}`;

    if (!providerConfigured) {
      await this.store.recordEvent({
        eventKey: input.eventKey,
        severity: input.severity,
        recipientPhoneLast4: recipientLast4,
        provider: 'twilio_whatsapp',
        providerStatus: 'simulated',
      });

      return {
        sent: true,
        simulated: true,
        provider: 'twilio_whatsapp',
        recipient: config.recipientPhoneMasked,
        warning: 'Twilio nao configurado no servidor. Mensagem registrada em modo simulacao.',
      };
    }

    if (!force) {
      const canSend = await this.store.canSend(input.eventKey, input.severity, config.cooldownMinutes);
      if (!canSend) return { sent: false, reason: 'cooldown_active' };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const form = new URLSearchParams({
      From: from as string,
      To: config.recipientPhone,
      Body: body,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result?.message || `Twilio retornou HTTP ${response.status}`;
        await this.store.recordEvent({
          eventKey: input.eventKey,
          severity: input.severity,
          recipientPhoneLast4: recipientLast4,
          provider: 'twilio_whatsapp',
          providerStatus: 'failed',
          errorMessage: message,
        });
        throw new BadRequestException(message);
      }

      await this.store.recordEvent({
        eventKey: input.eventKey,
        severity: input.severity,
        recipientPhoneLast4: recipientLast4,
        provider: 'twilio_whatsapp',
        providerStatus: 'sent',
        providerMessageId: result?.sid,
      });

      return {
        sent: true,
        simulated: false,
        provider: 'twilio_whatsapp',
        recipient: config.recipientPhoneMasked,
        providerMessageId: result?.sid,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Falha ao enviar WhatsApp.');
    }
  }

  private validateConfig(input: Partial<NotificationConfigInput>): NotificationConfigInput {
    const preAlertThreshold = Number(input.preAlertThreshold ?? 0.6);
    const criticalThreshold = Number(input.criticalThreshold ?? 0.8);
    const cooldownMinutes = Number(input.cooldownMinutes ?? 15);
    const minSeverity = input.minSeverity === 'pre_alert' ? 'pre_alert' : 'critical';

    if (!input.recipientName || input.recipientName.trim().length < 2) {
      throw new BadRequestException('Informe o nome do responsavel.');
    }

    if (!input.recipientPhone) {
      throw new BadRequestException('Informe o WhatsApp do destinatario.');
    }

    if (preAlertThreshold < 0.1 || preAlertThreshold > 0.95) {
      throw new BadRequestException('O pre-alerta deve estar entre 10% e 95%.');
    }

    if (criticalThreshold < 0.2 || criticalThreshold > 0.99) {
      throw new BadRequestException('O alerta critico deve estar entre 20% e 99%.');
    }

    if (preAlertThreshold >= criticalThreshold) {
      throw new BadRequestException('O pre-alerta precisa ser menor que o alerta critico.');
    }

    if (cooldownMinutes < 1 || cooldownMinutes > 1440) {
      throw new BadRequestException('O cooldown deve estar entre 1 minuto e 24 horas.');
    }

    return {
      enabled: Boolean(input.enabled),
      recipientName: input.recipientName.trim(),
      recipientPhone: input.recipientPhone,
      minSeverity,
      preAlertThreshold,
      criticalThreshold,
      cooldownMinutes,
    };
  }
}
