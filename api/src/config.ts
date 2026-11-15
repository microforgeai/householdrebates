import fs from 'node:fs';
import path from 'node:path';

export interface InstallerRecord {
  id: string;
  tradingName: string;
  legalName: string;
  abn: string;
  accreditedProvider: string;
  isAccreditedProvider: boolean;
  activities: ('rcac' | 'hotwater')[];
  postcodes: string[];
  licence: { type: string; number: string };
  agreementSignedOn: string;
  agreementVersion: string;
  contactEmailForLeads: string;
  publicBlurb: string;
  active: boolean;
}

export interface ApiConfig {
  nodeEnv: string;
  host: string;
  port: number;
  dbPath: string;
  leadsEnabled: boolean;
  autoDeliver: boolean;
  siteOrigin: string;
  ipHashSecret: string;
  formTokenSecret: string;
  mailTransport: 'smtp' | 'graph' | 'memory';
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
  mailFrom: string;
  leadsNotifyTo: string;
  privacyPolicyVersion: string;
  consentReviewedBy: string;
  serverCountry: string;
  leadsEmailProviderNote: string;
  installersPath: string;
}

export function loadInstallers(installersPath: string): InstallerRecord[] {
  if (!fs.existsSync(installersPath)) {
    return [];
  }
  const raw = fs.readFileSync(installersPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('installers.json must be a JSON array');
  }
  return parsed as InstallerRecord[];
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const leadsEnabled = env.LEADS_ENABLED === 'true';
  const installersPath =
    env.INSTALLERS_PATH || path.resolve(process.cwd(), 'installers.json');

  const cfg: ApiConfig = {
    nodeEnv: env.NODE_ENV || 'development',
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT || 8787),
    dbPath: env.DB_PATH || ':memory:',
    leadsEnabled,
    autoDeliver: env.AUTO_DELIVER === 'true',
    siteOrigin: env.SITE_ORIGIN || 'https://householdrebates.com.au',
    ipHashSecret: env.IP_HASH_SECRET || 'dev-ip-hash-secret-change-in-prod',
    formTokenSecret: env.FORM_TOKEN_SECRET || 'dev-form-token-secret-change-in-prod',
    mailTransport: (env.MAIL_TRANSPORT as 'smtp' | 'graph' | 'memory') || 'memory',
    mailFrom: env.MAIL_FROM || 'Household Rebates <quotes@householdrebates.com.au>',
    leadsNotifyTo: env.LEADS_NOTIFY_TO || 'hello@householdrebates.com.au',
    privacyPolicyVersion: env.PRIVACY_POLICY_VERSION || '',
    consentReviewedBy: env.CONSENT_REVIEWED_BY || '',
    serverCountry:
      env.SERVER_COUNTRY || env.PUBLIC_SERVER_COUNTRY || 'Malaysia',
    leadsEmailProviderNote:
      env.LEADS_EMAIL_PROVIDER_NOTE ||
      env.PUBLIC_LEADS_EMAIL_PROVIDER_NOTE ||
      'Hostinger Mail, which stores mail in France and Germany',
    installersPath,
  };

  if (cfg.mailTransport === 'smtp') {
    cfg.smtp = {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT || 465),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
    };
  } else if (cfg.mailTransport === 'graph') {
    cfg.graph = {
      tenantId: env.GRAPH_TENANT_ID || '',
      clientId: env.GRAPH_CLIENT_ID || '',
      clientSecret: env.GRAPH_CLIENT_SECRET || '',
      sender: env.GRAPH_SENDER || '',
    };
  }

  return cfg;
}

export function assertStartupGuards(cfg: ApiConfig, installers: InstallerRecord[]): void {
  if (!cfg.leadsEnabled) {
    return;
  }

  const validInstallers = installers.filter(
    (i) =>
      i.active &&
      typeof i.agreementSignedOn === 'string' &&
      i.agreementSignedOn.trim().length > 0 &&
      typeof i.accreditedProvider === 'string' &&
      i.accreditedProvider.trim().length > 0,
  );

  if (validInstallers.length === 0) {
    throw new Error(
      'Refusing to start with LEADS_ENABLED=true: installers.json has no active installer with agreementSignedOn and accreditedProvider.',
    );
  }

  if (!cfg.privacyPolicyVersion.trim()) {
    throw new Error(
      'Refusing to start with LEADS_ENABLED=true: PRIVACY_POLICY_VERSION must be set.',
    );
  }

  if (!cfg.consentReviewedBy.trim()) {
    throw new Error(
      'Refusing to start with LEADS_ENABLED=true: CONSENT_REVIEWED_BY must be set.',
    );
  }

  if (!cfg.serverCountry.trim() || /\u003c\u003c|\u003e\u003e/.test(cfg.serverCountry)) {
    throw new Error(
      'Refusing to start with LEADS_ENABLED=true: SERVER_COUNTRY must be set without \u003c\u003c...\u003e\u003e placeholders.',
    );
  }

  if (!cfg.leadsEmailProviderNote.trim() || /\u003c\u003c|\u003e\u003e/.test(cfg.leadsEmailProviderNote)) {
    throw new Error(
      'Refusing to start with LEADS_ENABLED=true: LEADS_EMAIL_PROVIDER_NOTE must be set without \u003c\u003c...\u003e\u003e placeholders.',
    );
  }
}
