import path from 'node:path';
import type { ApiConfig } from '../config.js';
import { createMailDriver, type MailDriver } from '../mail/index.js';
import {
  assertNoUnresolvedPlaceholders,
  renderAlertsSenderBlock,
  type AlertsSenderInfo,
} from '../mail/templates/alerts-sender.js';
import { isKnownAlertsConsentVersion } from './consent.js';

export interface AlertsConfig {
  nodeEnv: string;
  alertsEnabled: boolean;
  alertsSendEnabled: boolean;
  alertsDbPath: string;
  alertsConsentVersion: string;
  privacyPolicyVersion: string;
  alertsReviewedBy: string;
  alertsFrom: string;
  alertsReplyTo: string;
  alertsUnsubscribeMailto: string;
  alertsMailTransport: 'smtp' | 'graph' | 'memory';
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  graph?: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    sender: string;
  };
  alertsConfirmTtlHours: number;
  alertsSendRatePerMinute: number;
  alertsSendBatchSize: number;
  alertsRateLimitPerIpHour: number;
  alertsHashSecret: string;
  alertsTestTo: string[];
  alertsDraftsDir: string;
  sender: AlertsSenderInfo;
}

const DEFAULT_DEV_ALERTS_HASH_SECRET = 'dev-alerts-hash-secret-change-in-prod';

function deriveAlertsDbPath(env: NodeJS.ProcessEnv, baseDbPath: string): string {
  if (env.ALERTS_DB_PATH && env.ALERTS_DB_PATH.trim().length > 0) {
    return env.ALERTS_DB_PATH.trim();
  }
  if (!baseDbPath || baseDbPath === ':memory:') {
    return ':memory:';
  }
  return path.join(path.dirname(baseDbPath), 'alerts.sqlite');
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function loadAlertsConfig(
  env: NodeJS.ProcessEnv = process.env,
  baseCfg?: Pick<ApiConfig, 'nodeEnv' | 'dbPath' | 'privacyPolicyVersion'>,
): AlertsConfig {
  const nodeEnv = env.NODE_ENV || baseCfg?.nodeEnv || 'development';
  const baseDbPath = env.DB_PATH || baseCfg?.dbPath || ':memory:';
  const alertsMailTransport =
    (env.ALERTS_MAIL_TRANSPORT as 'smtp' | 'graph' | 'memory') || 'memory';

  const senderEmail = env.ALERTS_SENDER_EMAIL ?? 'privacy@householdrebates.com.au';

  const cfg: AlertsConfig = {
    nodeEnv,
    alertsEnabled: env.ALERTS_ENABLED === 'true',
    alertsSendEnabled: env.ALERTS_SEND_ENABLED === 'true',
    alertsDbPath: deriveAlertsDbPath(env, baseDbPath),
    alertsConsentVersion: env.ALERTS_CONSENT_VERSION || '',
    privacyPolicyVersion: env.PRIVACY_POLICY_VERSION || baseCfg?.privacyPolicyVersion || '',
    alertsReviewedBy: env.ALERTS_REVIEWED_BY || '',
    alertsFrom: env.ALERTS_FROM || '',
    alertsReplyTo: env.ALERTS_REPLY_TO || senderEmail,
    alertsUnsubscribeMailto: env.ALERTS_UNSUBSCRIBE_MAILTO || senderEmail,
    alertsMailTransport,
    alertsConfirmTtlHours: Number(env.ALERTS_CONFIRM_TTL_HOURS || 72),
    alertsSendRatePerMinute: Number(env.ALERTS_SEND_RATE_PER_MINUTE || 50),
    alertsSendBatchSize: Number(env.ALERTS_SEND_BATCH_SIZE || 50),
    alertsRateLimitPerIpHour: Number(env.ALERTS_RATE_LIMIT_PER_IP_HOUR || 20),
    alertsHashSecret: env.ALERTS_HASH_SECRET || DEFAULT_DEV_ALERTS_HASH_SECRET,
    alertsTestTo: parseEmailList(env.ALERTS_TEST_TO),
    alertsDraftsDir: env.ALERTS_DRAFTS_DIR || path.resolve(process.cwd(), 'drafts'),
    sender: {
      abn: env.ALERTS_SENDER_ABN ?? '29 644 447 263',
      postalOrContactAddress: env.ALERTS_SENDER_ADDRESS ?? '<<ALERTS_SENDER_ADDRESS>>',
      contactEmail: senderEmail,
    },
  };

  if (alertsMailTransport === 'smtp') {
    cfg.smtp = {
      host: env.ALERTS_SMTP_HOST || env.SMTP_HOST || '',
      port: Number(env.ALERTS_SMTP_PORT || env.SMTP_PORT || 465),
      user: env.ALERTS_SMTP_USER || env.SMTP_USER || '',
      pass: env.ALERTS_SMTP_PASS || env.SMTP_PASS || '',
    };
  } else if (alertsMailTransport === 'graph') {
    cfg.graph = {
      tenantId: env.ALERTS_GRAPH_TENANT_ID || env.GRAPH_TENANT_ID || '',
      clientId: env.ALERTS_GRAPH_CLIENT_ID || env.GRAPH_CLIENT_ID || '',
      clientSecret: env.ALERTS_GRAPH_CLIENT_SECRET || env.GRAPH_CLIENT_SECRET || '',
      sender: env.ALERTS_GRAPH_SENDER || env.GRAPH_SENDER || '',
    };
  }

  return cfg;
}

export function assertAlertsStartupGuards(cfg: AlertsConfig): void {
  if (!cfg.alertsEnabled) {
    return;
  }

  if (!cfg.alertsConsentVersion.trim()) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_CONSENT_VERSION must be set.',
    );
  }
  if (!isKnownAlertsConsentVersion(cfg.alertsConsentVersion.trim())) {
    throw new Error(
      `Refusing to start with ALERTS_ENABLED=true: unknown ALERTS_CONSENT_VERSION "${cfg.alertsConsentVersion}".`,
    );
  }

  if (!cfg.privacyPolicyVersion.trim()) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: PRIVACY_POLICY_VERSION must be set.',
    );
  }

  if (!cfg.alertsReviewedBy.trim()) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_REVIEWED_BY must be set (signed by Guri after lawyer review).',
    );
  }

  if (!cfg.alertsFrom.trim()) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_FROM must be set.',
    );
  }
  assertNoUnresolvedPlaceholders(cfg.alertsFrom, 'ALERTS_FROM');

  if (!cfg.alertsHashSecret.trim()) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_HASH_SECRET must be set.',
    );
  }
  if (
    cfg.nodeEnv === 'production' &&
    cfg.alertsHashSecret === DEFAULT_DEV_ALERTS_HASH_SECRET
  ) {
    throw new Error(
      'Refusing to start in production with ALERTS_ENABLED=true and default ALERTS_HASH_SECRET.',
    );
  }

  if (!Number.isFinite(cfg.alertsConfirmTtlHours) || cfg.alertsConfirmTtlHours <= 0) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_CONFIRM_TTL_HOURS must be > 0.',
    );
  }
  if (!Number.isFinite(cfg.alertsSendRatePerMinute) || cfg.alertsSendRatePerMinute <= 0) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_SEND_RATE_PER_MINUTE must be > 0.',
    );
  }
  if (!Number.isFinite(cfg.alertsSendBatchSize) || cfg.alertsSendBatchSize <= 0) {
    throw new Error(
      'Refusing to start with ALERTS_ENABLED=true: ALERTS_SEND_BATCH_SIZE must be > 0.',
    );
  }

  renderAlertsSenderBlock(cfg.sender);
}

export function createAlertsMailDriver(alertsCfg: AlertsConfig, baseCfg?: ApiConfig): MailDriver {
  const syntheticApiCfg: ApiConfig = {
    nodeEnv: alertsCfg.nodeEnv,
    host: baseCfg?.host || '127.0.0.1',
    port: baseCfg?.port || 8787,
    dbPath: alertsCfg.alertsDbPath,
    leadsEnabled: false,
    autoDeliver: false,
    siteOrigin: baseCfg?.siteOrigin || 'https://householdrebates.com.au',
    ipHashSecret: baseCfg?.ipHashSecret || '',
    formTokenSecret: baseCfg?.formTokenSecret || '',
    mailTransport: alertsCfg.alertsMailTransport,
    smtp: alertsCfg.smtp,
    graph: alertsCfg.graph,
    mailFrom: alertsCfg.alertsFrom || 'Household Rebates <alerts@householdrebates.com.au>',
    leadsNotifyTo: baseCfg?.leadsNotifyTo || '',
    privacyPolicyVersion: alertsCfg.privacyPolicyVersion,
    consentReviewedBy: '',
    serverCountry: baseCfg?.serverCountry || '',
    leadsEmailProviderNote: baseCfg?.leadsEmailProviderNote || '',
    installersPath: baseCfg?.installersPath || 'installers.json',
  };

  return createMailDriver(syntheticApiCfg);
}
