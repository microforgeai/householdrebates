import crypto from 'node:crypto';
import type { MailDriver } from '../mail/index.js';
import { buildAlertsRuleChangeEmail } from '../mail/templates/alerts-rule-change.js';
import type { AlertsConfig } from './config.js';
import { parseAlertDraftFile } from './drafts.js';
import type { AlertsRepository } from './repository.js';

export interface SendAlertDraftOptions {
  draftPath: string;
  confirmSha256?: string;
  alertsConfig: AlertsConfig;
  siteOrigin: string;
  repo: AlertsRepository;
  mail: MailDriver;
  now?: Date;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface SendAlertDraftResult {
  mode: 'test' | 'live';
  draftSha256: string;
  recipients: number;
  batches: number;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashesMatchConstantTime(a: string, b: string): boolean {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(cleanA) || !/^[0-9a-f]{64}$/.test(cleanB)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(cleanA, 'utf8'), Buffer.from(cleanB, 'utf8'));
}

export async function sendAlertDraft(
  opts: SendAlertDraftOptions,
): Promise<SendAlertDraftResult> {
  const draft = parseAlertDraftFile(opts.draftPath);
  const baseOrigin = opts.siteOrigin.replace(/\/+$/, '');
  const now = opts.now ?? new Date();
  const sleep = opts.sleepFn ?? defaultSleep;

  // Always verify --confirm hash first if supplied
  if (opts.confirmSha256 !== undefined) {
    if (!hashesMatchConstantTime(opts.confirmSha256, draft.sha256)) {
      throw new Error(
        `Refusing alert send: --confirm hash does not match draft SHA-256 (${draft.sha256}).`,
      );
    }
  }

  // Test-only mode whenever ALERTS_SEND_ENABLED is false OR --confirm was not supplied
  if (!opts.alertsConfig.alertsSendEnabled || opts.confirmSha256 === undefined) {
    const testRecipients = opts.alertsConfig.alertsTestTo;
    let sent = 0;

    for (const testEmail of testRecipients) {
      const previewUnsubUrl = `${baseOrigin}/api/alerts/unsubscribe?t=test-preview-token`;
      const previewOneClickUrl = `${baseOrigin}/api/alerts/unsubscribe-one-click?t=test-preview-token`;
      const msg = buildAlertsRuleChangeEmail({
        subject: draft.subject,
        paragraphs: draft.paragraphs,
        pageUrl: draft.pageUrl,
        unsubscribeUrl: previewUnsubUrl,
        oneClickUnsubscribeUrl: previewOneClickUrl,
        unsubscribeMailto: opts.alertsConfig.alertsUnsubscribeMailto,
        siteOrigin: baseOrigin,
        sender: opts.alertsConfig.sender,
      });

      await opts.mail.send({
        from: opts.alertsConfig.alertsFrom || undefined,
        to: testEmail,
        replyTo: opts.alertsConfig.alertsReplyTo || undefined,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        headers: msg.headers,
      });
      sent++;
    }

    return {
      mode: 'test',
      draftSha256: draft.sha256,
      recipients: sent,
      batches: sent > 0 ? 1 : 0,
    };
  }

  // Live send gates: ALERTS_SEND_ENABLED=true AND valid --confirm <sha256>
  if (!opts.alertsConfig.alertsReviewedBy.trim()) {
    throw new Error(
      'Refusing live alert send: ALERTS_REVIEWED_BY must be set (signed by Guri after lawyer review).',
    );
  }
  if (!opts.alertsConfig.alertsFrom.trim()) {
    throw new Error('Refusing live alert send: ALERTS_FROM must be set.');
  }
  if (!opts.alertsConfig.privacyPolicyVersion.trim()) {
    throw new Error('Refusing live alert send: PRIVACY_POLICY_VERSION must be set.');
  }

  const recipients = opts.repo.listConfirmedUnsuppressedRecipients();
  const batchSize = Math.max(1, Math.floor(opts.alertsConfig.alertsSendBatchSize));
  const ratePerMinute = Math.max(1, opts.alertsConfig.alertsSendRatePerMinute);
  const minDelayBetweenEmailsMs = Math.ceil(60_000 / ratePerMinute);

  let sentCount = 0;
  let batches = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches++;
    const batch = recipients.slice(i, i + batchSize);
    for (let j = 0; j < batch.length; j++) {
      const recipient = batch[j];
      if (sentCount > 0 && minDelayBetweenEmailsMs > 0) {
        await sleep(minDelayBetweenEmailsMs);
      }

      const rawUnsubToken = opts.repo.issueUnsubscribeToken(recipient.id);
      const unsubUrl = `${baseOrigin}/api/alerts/unsubscribe?t=${encodeURIComponent(rawUnsubToken)}`;
      const oneClickUrl = `${baseOrigin}/api/alerts/unsubscribe-one-click?t=${encodeURIComponent(rawUnsubToken)}`;

      const msg = buildAlertsRuleChangeEmail({
        subject: draft.subject,
        paragraphs: draft.paragraphs,
        pageUrl: draft.pageUrl,
        unsubscribeUrl: unsubUrl,
        oneClickUnsubscribeUrl: oneClickUrl,
        unsubscribeMailto: opts.alertsConfig.alertsUnsubscribeMailto,
        siteOrigin: baseOrigin,
        sender: opts.alertsConfig.sender,
      });

      await opts.mail.send({
        from: opts.alertsConfig.alertsFrom,
        to: recipient.email,
        replyTo: opts.alertsConfig.alertsReplyTo || undefined,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        headers: msg.headers,
      });

      sentCount++;
    }
  }

  opts.repo.recordAlertSend({
    draftSha256: draft.sha256,
    subject: draft.subject,
    approvedBy: opts.alertsConfig.alertsReviewedBy.trim(),
    sentAtUtc: now.toISOString(),
    recipients: sentCount,
  });

  return {
    mode: 'live',
    draftSha256: draft.sha256,
    recipients: sentCount,
    batches,
  };
}
