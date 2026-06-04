import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import sqlite3 from 'sqlite3';

export interface NotificationConfigInput {
  enabled: boolean;
  recipientName: string;
  recipientPhone: string;
  minSeverity: 'pre_alert' | 'critical';
  preAlertThreshold: number;
  criticalThreshold: number;
  cooldownMinutes: number;
}

export interface NotificationConfigRecord {
  enabled: boolean;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneMasked: string;
  minSeverity: 'pre_alert' | 'critical';
  preAlertThreshold: number;
  criticalThreshold: number;
  cooldownMinutes: number;
  updatedAt: string | null;
}

interface ConfigRow {
  enabled: number;
  recipient_name: string;
  recipient_phone_encrypted: string;
  recipient_phone_last4: string;
  min_severity: 'pre_alert' | 'critical';
  pre_alert_threshold: number;
  critical_threshold: number;
  cooldown_minutes: number;
  updated_at: string | null;
}

@Injectable()
export class NotificationConfigStore implements OnModuleInit {
  private db: sqlite3.Database;
  private readonly databasePath = process.env.NOTIFICATION_DATABASE_PATH || '../data/notification_config.db';
  private readonly encryptionKey = createHash('sha256')
    .update(
      process.env.NOTIFICATION_ENCRYPTION_KEY ||
      process.env.TWILIO_AUTH_TOKEN ||
      'smart-factory-dev-notification-key-change-me',
    )
    .digest();

  async onModuleInit() {
    mkdirSync(dirname(this.databasePath), { recursive: true });
    this.db = new sqlite3.Database(this.databasePath);
    await this.run(`
      CREATE TABLE IF NOT EXISTS notification_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL DEFAULT 0,
        recipient_name TEXT NOT NULL DEFAULT '',
        recipient_phone_encrypted TEXT NOT NULL DEFAULT '',
        recipient_phone_last4 TEXT NOT NULL DEFAULT '',
        min_severity TEXT NOT NULL DEFAULT 'critical',
        pre_alert_threshold REAL NOT NULL DEFAULT 0.60,
        critical_threshold REAL NOT NULL DEFAULT 0.80,
        cooldown_minutes INTEGER NOT NULL DEFAULT 15,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `);
    await this.run(`
      CREATE TABLE IF NOT EXISTS notification_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_key TEXT NOT NULL,
        severity TEXT NOT NULL,
        recipient_phone_last4 TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_status TEXT NOT NULL,
        provider_message_id TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.run(`
      INSERT OR IGNORE INTO notification_config (id) VALUES (1)
    `);
  }

  async getConfig(): Promise<NotificationConfigRecord> {
    const row = await this.get<ConfigRow>('SELECT * FROM notification_config WHERE id = 1');

    return {
      enabled: Boolean(row?.enabled),
      recipientName: row?.recipient_name || '',
      recipientPhone: row?.recipient_phone_encrypted ? this.decrypt(row.recipient_phone_encrypted) : '',
      recipientPhoneMasked: this.maskPhone(row?.recipient_phone_last4 || ''),
      minSeverity: row?.min_severity || 'critical',
      preAlertThreshold: row?.pre_alert_threshold ?? 0.6,
      criticalThreshold: row?.critical_threshold ?? 0.8,
      cooldownMinutes: row?.cooldown_minutes ?? 15,
      updatedAt: row?.updated_at || null,
    };
  }

  async getPublicConfig() {
    const config = await this.getConfig();
    const twilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER,
    );

    return {
      enabled: config.enabled,
      recipientName: config.recipientName,
      recipientPhoneMasked: config.recipientPhoneMasked,
      minSeverity: config.minSeverity,
      preAlertThreshold: config.preAlertThreshold,
      criticalThreshold: config.criticalThreshold,
      cooldownMinutes: config.cooldownMinutes,
      updatedAt: config.updatedAt,
      provider: 'twilio_whatsapp',
      twilioConfigured,
      encryptionAtRest: true,
      encryptionKeyConfigured: Boolean(process.env.NOTIFICATION_ENCRYPTION_KEY),
      database: 'isolated_sqlite',
    };
  }

  async saveConfig(input: NotificationConfigInput) {
    const normalizedPhone = this.normalizeWhatsApp(input.recipientPhone);
    const last4 = normalizedPhone.replace(/\D/g, '').slice(-4);

    await this.run(
      `
        UPDATE notification_config
        SET enabled = ?,
            recipient_name = ?,
            recipient_phone_encrypted = ?,
            recipient_phone_last4 = ?,
            min_severity = ?,
            pre_alert_threshold = ?,
            critical_threshold = ?,
            cooldown_minutes = ?,
            updated_at = ?
        WHERE id = 1
      `,
      [
        input.enabled ? 1 : 0,
        input.recipientName.trim(),
        this.encrypt(normalizedPhone),
        last4,
        input.minSeverity,
        input.preAlertThreshold,
        input.criticalThreshold,
        input.cooldownMinutes,
        new Date().toISOString(),
      ],
    );

    return this.getPublicConfig();
  }

  async canSend(eventKey: string, severity: string, cooldownMinutes: number) {
    const row = await this.get<{ created_at: string }>(
      `
        SELECT created_at
        FROM notification_events
        WHERE event_key = ? AND severity = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [eventKey, severity],
    );

    if (!row) return true;

    const lastSentAt = new Date(row.created_at).getTime();
    return Date.now() - lastSentAt > cooldownMinutes * 60_000;
  }

  async recordEvent(event: {
    eventKey: string;
    severity: string;
    recipientPhoneLast4: string;
    provider: string;
    providerStatus: string;
    providerMessageId?: string;
    errorMessage?: string;
  }) {
    await this.run(
      `
        INSERT INTO notification_events (
          event_key,
          severity,
          recipient_phone_last4,
          provider,
          provider_status,
          provider_message_id,
          error_message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        event.eventKey,
        event.severity,
        event.recipientPhoneLast4,
        event.provider,
        event.providerStatus,
        event.providerMessageId || null,
        event.errorMessage || null,
      ],
    );
  }

  normalizeWhatsApp(value: string) {
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, '');

    if (digits.length < 12 || digits.length > 15) {
      throw new Error('Informe o telefone com codigo do pais e DDD. Exemplo: +5511912345678.');
    }

    return `whatsapp:+${digits}`;
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decrypt(value: string) {
    const [ivText, tagText, encryptedText] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, Buffer.from(ivText, 'base64'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private maskPhone(last4: string) {
    return last4 ? `whatsapp:+********${last4}` : '';
  }

  private run(sql: string, params: unknown[] = []) {
    return new Promise<void>((resolve, reject) => {
      this.db.run(sql, params, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private get<T>(sql: string, params: unknown[] = []) {
    return new Promise<T | undefined>((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) reject(error);
        else resolve(row as T | undefined);
      });
    });
  }
}
