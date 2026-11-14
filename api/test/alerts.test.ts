import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { signFormToken } from '../src/antispam.js';
import { loadAlertsConfig, type AlertsConfig } from '../src/alerts/config.js';
import { ALERTS_CONSENT_VERSION_V1 } from '../src/alerts/consent.js';
import { writeAlertDraft } from '../src/alerts/drafts.js';
import { sendAlertDraft } from '../src/alerts/send.js';
import type { ApiConfig } from '../src/config.js';
import { renderAlertsSenderBlock } from '../src/mail/templates/alerts-sender.js';
import { buildServer } from '../src/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_SRC_DIR = path.resolve(__dirname, '../src');

function makeBaseApiConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 0,
    dbPath: ':memory:',
    leadsEnabled: false,
    autoDeliver: false,
    siteOrigin: 'https://householdrebates.com.au',
    ipHashSecret: 'test-ip-secret-12345',
    formTokenSecret: 'test-form-token-secret-67890',
    mailTransport: 'memory',
    mailFrom: 'Household Rebates <quotes@householdrebates.com.au>',
    leadsNotifyTo: 'info@householdrebates.com.au',
    privacyPolicyVersion: '2026-11-13-v1',
    consentReviewedBy: '',
    installersPath: 'installers.json',
    ...overrides,
  };
}

function makeLiveAlertsConfig(overrides: Partial<AlertsConfig> = {}): AlertsConfig {
  return {
    nodeEnv: 'test',
    alertsEnabled: true,
    alertsSendEnabled: false,
    alertsDbPath: ':memory:',
    alertsConsentVersion: ALERTS_CONSENT_VERSION_V1,
    privacyPolicyVersion: '2026-11-13-v1',
    alertsReviewedBy: 'Gurinder Singh (after legal review 2026-12-01)',
    alertsFrom: 'Household Rebates <alerts@householdrebates.com.au>',
    alertsReplyTo: 'privacy@householdrebates.com.au',
    alertsUnsubscribeMailto: 'privacy@householdrebates.com.au',
    alertsMailTransport: 'memory',
    alertsConfirmTtlHours: 72,
    alertsSendRatePerMinute: 50,
    alertsSendBatchSize: 50,
    alertsRateLimitPerIpHour: 50,
    alertsHashSecret: 'test-alerts-hmac-secret-abcdef123456',
    alertsTestTo: ['guri-test@householdrebates.com.au'],
    alertsDraftsDir: os.tmpdir(),
    sender: {
      abn: '29 644 447 263',
      postalOrContactAddress: 'PO Box 100, Melbourne VIC 3000',
      contactEmail: 'privacy@householdrebates.com.au',
    },
    ...overrides,
  };
}

function extractTokenFromUrl(text: string, routePath: string): string {
  const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\?t=([A-Za-z0-9_~%-]+)`);
  const m = text.match(re);
  if (!m) {
    throw new Error(`Could not find token for ${routePath} in:\n${text}`);
  }
  return decodeURIComponent(m[1]);
}

describe('Rule-Change Email Alerts Backend (Prompt 29a)', () => {
  it('defaults all alert flags to false, TTL to 72h, send rate to 50/min, and memory transport with no provider wired', () => {
    const cfg = loadAlertsConfig({});
    expect(cfg.alertsEnabled).toBe(false);
    expect(cfg.alertsSendEnabled).toBe(false);
    expect(cfg.alertsConfirmTtlHours).toBe(72);
    expect(cfg.alertsSendRatePerMinute).toBe(50);
    expect(cfg.alertsMailTransport).toBe('memory');
    expect(cfg.alertsReviewedBy).toBe('');
    expect(cfg.alertsFrom).toBe('');
  });

  it('returns 503 and stores/sends nothing when ALERTS_ENABLED=false', async () => {
    const { app, alertsDb, alertsMail } = await buildServer({
      config: makeBaseApiConfig(),
      alertsConfig: makeLiveAlertsConfig({
        alertsEnabled: false,
        alertsReviewedBy: '',
        alertsFrom: '',
      }),
    });

    const subRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'person@example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
      },
    });
    expect(subRes.statusCode).toBe(503);

    const unsubRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/unsubscribe-one-click?t=anything',
    });
    expect(unsubRes.statusCode).toBe(503);

    const cnt = alertsDb
      .prepare('SELECT COUNT(*) as c FROM alert_subscribers')
      .get() as { c: number };
    expect(cnt.c).toBe(0);
    expect(alertsMail.sentMessages?.length ?? 0).toBe(0);
    await app.close();
  });

  it('blocks server startup with ALERTS_ENABLED=true when ALERTS_REVIEWED_BY, ALERTS_CONSENT_VERSION, PRIVACY_POLICY_VERSION, ALERTS_FROM, or sender placeholders are invalid', async () => {
    await expect(
      buildServer({
        config: makeBaseApiConfig(),
        alertsConfig: makeLiveAlertsConfig({ alertsReviewedBy: '' }),
      }),
    ).rejects.toThrow(/ALERTS_REVIEWED_BY must be set/);

    await expect(
      buildServer({
        config: makeBaseApiConfig(),
        alertsConfig: makeLiveAlertsConfig({ alertsConsentVersion: '' }),
      }),
    ).rejects.toThrow(/ALERTS_CONSENT_VERSION must be set/);

    await expect(
      buildServer({
        config: makeBaseApiConfig({ privacyPolicyVersion: '' }),
        alertsConfig: makeLiveAlertsConfig({ privacyPolicyVersion: '' }),
      }),
    ).rejects.toThrow(/PRIVACY_POLICY_VERSION must be set/);

    await expect(
      buildServer({
        config: makeBaseApiConfig(),
        alertsConfig: makeLiveAlertsConfig({ alertsFrom: '' }),
      }),
    ).rejects.toThrow(/ALERTS_FROM must be set/);

    expect(() =>
      renderAlertsSenderBlock({
        abn: '29 644 447 263',
        postalOrContactAddress: '<<postal or contact address>>',
        contactEmail: 'privacy@householdrebates.com.au',
      }),
    ).toThrow(/Unresolved placeholder/);
  });

  it('subscribes as pending (1 confirm email, 0 alert emails before confirm) and returns identical 202 with 0 emails on duplicate, confirmed, suppressed, and honeypot', async () => {
    const baseCfg = makeBaseApiConfig();
    const alertsCfg = makeLiveAlertsConfig({ alertsSendEnabled: true });
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hr-alerts-29a-'));
    const { app, alertsDb, alertsRepo, alertsMail } = await buildServer({
      config: baseCfg,
      alertsConfig: { ...alertsCfg, alertsDraftsDir: tmpDir },
    });

    const validFormToken = signFormToken(baseCfg.formTokenSecret, Date.now() - 10_000);

    // 1. Unticked consent is rejected with 422
    const untickedRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'reader@example.com.au',
        consent: false,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: '',
      },
    });
    expect(untickedRes.statusCode).toBe(422);

    // 2. Honeypot returns identical 202, stores nothing, sends nothing
    const honeypotRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'bot@example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: 'https://spam.example',
      },
    });
    expect(honeypotRes.statusCode).toBe(202);
    expect(alertsMail.sentMessages?.length).toBe(0);

    // 3. Valid subscribe -> 202, status='pending', consent snapshot stored, 1 confirmation email
    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'Reader@Example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: '',
        sourcePage: '/victoria/gas-to-electric-hot-water-2027/',
      },
    });
    expect(firstRes.statusCode).toBe(202);
    expect(firstRes.body).toBe(honeypotRes.body);
    expect(alertsMail.sentMessages?.length).toBe(1);

    const confirmEmail = alertsMail.sentMessages![0];
    expect(confirmEmail.to).toBe('reader@example.com.au');
    expect(confirmEmail.text).toContain("If you didn't ask for this, ignore it; we won't email you again.");
    expect(confirmEmail.text).toContain('Household Rebates is run by Agenor Services Pty Ltd, ABN 29 644 447 263');
    expect(confirmEmail.text).not.toContain('$');

    const subRow = alertsDb
      .prepare('SELECT * FROM alert_subscribers WHERE email = ?')
      .get('reader@example.com.au') as Record<string, unknown>;
    expect(subRow.status).toBe('pending');
    expect(subRow.topics).toBe('rule-changes');

    // Verify raw confirm token is NOT stored in alert_tokens (only SHA-256 hash)
    const rawConfirmToken = extractTokenFromUrl(confirmEmail.text, '/api/alerts/confirm');
    const storedTokenRow = alertsDb
      .prepare('SELECT token_hash FROM alert_tokens WHERE subscriber_id = ?')
      .get(subRow.id) as { token_hash: string };
    expect(storedTokenRow.token_hash).not.toBe(rawConfirmToken);

    // 4. Duplicate pending subscribe -> identical 202, NO new email
    const dupPendingRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'reader@example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: '',
      },
    });
    expect(dupPendingRes.statusCode).toBe(202);
    expect(dupPendingRes.body).toBe(firstRes.body);
    expect(alertsMail.sentMessages?.length).toBe(1);

    // 5. Before confirm, alerts:send sends 0 alert emails to pending subscribers
    const draft = writeAlertDraft({
      topic: 'gas-hot-water-2027',
      page: '/victoria/gas-to-electric-hot-water-2027/',
      siteOrigin: baseCfg.siteOrigin,
      draftsDir: tmpDir,
    });
    const sendBeforeConfirm = await sendAlertDraft({
      draftPath: draft.filePath,
      confirmSha256: draft.sha256,
      alertsConfig: alertsCfg,
      siteOrigin: baseCfg.siteOrigin,
      repo: alertsRepo,
      mail: alertsMail,
    });
    expect(sendBeforeConfirm.mode).toBe('live');
    expect(sendBeforeConfirm.recipients).toBe(0);
    expect(alertsMail.sentMessages?.length).toBe(1);

    // 6. Confirm -> 303 /alerts/confirmed/, then subscribing already-confirmed address returns identical 202 and sends nothing
    const confirmRes = await app.inject({
      method: 'GET',
      url: `/api/alerts/confirm?t=${encodeURIComponent(rawConfirmToken)}`,
    });
    expect(confirmRes.statusCode).toBe(303);
    expect(confirmRes.headers.location).toBe('/alerts/confirmed/');

    const alreadyConfirmedRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'reader@example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: '',
      },
    });
    expect(alreadyConfirmedRes.statusCode).toBe(202);
    expect(alreadyConfirmedRes.body).toBe(firstRes.body);
    expect(alertsMail.sentMessages?.length).toBe(1);

    // 7. Suppressed address -> identical 202 and sends nothing
    alertsRepo.unsubscribeByEmail('suppressed-user@example.com.au', 'cli');
    const suppressedRes = await app.inject({
      method: 'POST',
      url: '/api/alerts/subscribe',
      headers: {
        origin: 'https://householdrebates.com.au',
        'content-type': 'application/json',
      },
      payload: {
        email: 'suppressed-user@example.com.au',
        consent: true,
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        formToken: validFormToken,
        website: '',
      },
    });
    expect(suppressedRes.statusCode).toBe(202);
    expect(suppressedRes.body).toBe(firstRes.body);
    expect(alertsMail.sentMessages?.length).toBe(1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
    await app.close();
  });

  it('handles confirm with valid, expired (>72h), and re-used tokens correctly', async () => {
    const { app, alertsDb, alertsRepo } = await buildServer({
      config: makeBaseApiConfig(),
      alertsConfig: makeLiveAlertsConfig(),
    });

    const t0 = new Date('2026-11-14T10:00:00.000Z');
    const created1 = alertsRepo.subscribePending({
      email: 'valid@example.com.au',
      sourcePage: '/',
      ipHash: 'ip1',
      userAgent: 'vitest',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: t0,
    });
    expect(created1.action).toBe('created_pending');
    if (created1.action !== 'created_pending') throw new Error('expected created_pending');

    // Valid token -> confirmed + 303 /alerts/confirmed/
    const validRes = await app.inject({
      method: 'GET',
      url: `/api/alerts/confirm?t=${encodeURIComponent(created1.rawConfirmToken)}`,
    });
    expect(validRes.statusCode).toBe(303);
    expect(validRes.headers.location).toBe('/alerts/confirmed/');

    // Re-used token -> 303 /alerts/expired/ (even if subscriber later unsubscribed, never re-confirms)
    alertsRepo.unsubscribeByEmail('valid@example.com.au', 'cli');
    const reusedRes = await app.inject({
      method: 'GET',
      url: `/api/alerts/confirm?t=${encodeURIComponent(created1.rawConfirmToken)}`,
    });
    expect(reusedRes.statusCode).toBe(303);
    expect(reusedRes.headers.location).toBe('/alerts/expired/');
    const afterReuse = alertsDb
      .prepare('SELECT status FROM alert_subscribers WHERE email = ?')
      .get('valid@example.com.au') as { status: string };
    expect(afterReuse.status).toBe('unsubscribed');

    // Expired token (>72h old) -> 303 /alerts/expired/ and status='expired'
    const pastT0 = new Date(Date.now() - 73 * 60 * 60 * 1000);
    const createdExpired = alertsRepo.subscribePending({
      email: 'late@example.com.au',
      sourcePage: '/',
      ipHash: 'ip2',
      userAgent: 'vitest',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: pastT0,
    });
    if (createdExpired.action !== 'created_pending') throw new Error('expected created_pending');

    const expiredRes = await app.inject({
      method: 'GET',
      url: `/api/alerts/confirm?t=${encodeURIComponent(createdExpired.rawConfirmToken)}`,
    });
    expect(expiredRes.statusCode).toBe(303);
    expect(expiredRes.headers.location).toBe('/alerts/expired/');

    const expRow = alertsDb
      .prepare('SELECT status FROM alert_subscribers WHERE email = ?')
      .get('late@example.com.au') as { status: string };
    expect(expRow.status).toBe('expired');

    await app.close();
  });

  it('supports unsubscribe by link (GET button + POST 303), RFC 8058 one-click POST (200), and CLI; verifies headers, zero $, batch rate pacing, test-only mode, wrong hash refusal, and permanent suppression', async () => {
    const baseCfg = makeBaseApiConfig();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hr-alerts-send-'));
    const alertsCfg = makeLiveAlertsConfig({
      alertsSendEnabled: false,
      alertsSendBatchSize: 2,
      alertsSendRatePerMinute: 50,
      alertsDraftsDir: tmpDir,
    });
    const { app, alertsDb, alertsRepo, alertsMail } = await buildServer({
      config: baseCfg,
      alertsConfig: alertsCfg,
    });

    // Seed 4 confirmed subscribers
    const emails = [
      'u1-link@example.com.au',
      'u2-oneclick@example.com.au',
      'u3-cli@example.com.au',
      'u4-stays@example.com.au',
    ];
    for (const em of emails) {
      const sub = alertsRepo.subscribePending({
        email: em,
        sourcePage: '/victoria/eligibility-checker/',
        ipHash: 'ip-seed',
        userAgent: 'vitest',
        consentVersion: ALERTS_CONSENT_VERSION_V1,
        privacyVersion: '2026-11-13-v1',
        confirmTtlHours: 72,
      });
      if (sub.action !== 'created_pending') throw new Error('expected created_pending');
      expect(alertsRepo.confirmByToken(sub.rawConfirmToken).outcome).toBe('confirmed');
    }

    const draft = writeAlertDraft({
      topic: 'battery-stc-2027',
      page: '/victoria/battery-rebate/',
      siteOrigin: baseCfg.siteOrigin,
      draftsDir: tmpDir,
    });

    // 1. ALERTS_SEND_ENABLED=false -> ONLY ALERTS_TEST_TO gets mail
    const testRun = await sendAlertDraft({
      draftPath: draft.filePath,
      alertsConfig: alertsCfg,
      siteOrigin: baseCfg.siteOrigin,
      repo: alertsRepo,
      mail: alertsMail,
    });
    expect(testRun.mode).toBe('test');
    expect(testRun.recipients).toBe(1);
    expect(alertsMail.sentMessages?.length).toBe(1);
    expect(alertsMail.sentMessages![0].to).toBe('guri-test@householdrebates.com.au');
    alertsMail.sentMessages!.length = 0;

    // 2. --confirm with wrong hash -> refuses
    const liveAlertsCfg: AlertsConfig = { ...alertsCfg, alertsSendEnabled: true };
    await expect(
      sendAlertDraft({
        draftPath: draft.filePath,
        confirmSha256: '0'.repeat(64),
        alertsConfig: liveAlertsCfg,
        siteOrigin: baseCfg.siteOrigin,
        repo: alertsRepo,
        mail: alertsMail,
      }),
    ).rejects.toThrow(/--confirm hash does not match/);

    // 3. ALERTS_REVIEWED_BY unset -> refuses live send
    await expect(
      sendAlertDraft({
        draftPath: draft.filePath,
        confirmSha256: draft.sha256,
        alertsConfig: { ...liveAlertsCfg, alertsReviewedBy: '' },
        siteOrigin: baseCfg.siteOrigin,
        repo: alertsRepo,
        mail: alertsMail,
      }),
    ).rejects.toThrow(/ALERTS_REVIEWED_BY must be set/);

    // 4. First live send to all 4 confirmed subscribers (2 batches of 2, 50/min => 1200ms pacing)
    const delays: number[] = [];
    const firstLive = await sendAlertDraft({
      draftPath: draft.filePath,
      confirmSha256: draft.sha256,
      alertsConfig: liveAlertsCfg,
      siteOrigin: baseCfg.siteOrigin,
      repo: alertsRepo,
      mail: alertsMail,
      sleepFn: async (ms) => {
        delays.push(ms);
      },
    });
    expect(firstLive.mode).toBe('live');
    expect(firstLive.recipients).toBe(4);
    expect(firstLive.batches).toBe(2);
    expect(delays).toEqual([1200, 1200, 1200]);
    expect(alertsMail.sentMessages?.length).toBe(4);

    // Check every sent alert email has sender block, independence line, unsubscribe link, both List-Unsubscribe headers, and zero '$'
    for (const msg of alertsMail.sentMessages!) {
      expect(msg.subject).not.toContain('$');
      expect(msg.text).not.toContain('$');
      expect(msg.html).not.toContain('$');
      expect(msg.text).toContain(
        'Household Rebates is run by Agenor Services Pty Ltd, ABN 29 644 447 263, PO Box 100, Melbourne VIC 3000, privacy@householdrebates.com.au.',
      );
      expect(msg.text).toContain("We're not a government website");
      expect(msg.text).toContain('/api/alerts/unsubscribe?t=');
      expect(msg.headers?.['List-Unsubscribe']).toMatch(
        /^<mailto:privacy@householdrebates\.com\.au\?subject=unsubscribe>, <https:\/\/householdrebates\.com\.au\/api\/alerts\/unsubscribe-one-click\?t=[^>]+>$/,
      );
      expect(msg.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    }

    // Extract tokens for u1 (web link) and u2 (RFC 8058 one-click)
    const u1Token = extractTokenFromUrl(
      alertsMail.sentMessages![0].text,
      '/api/alerts/unsubscribe',
    );
    const u2OneClickToken = extractTokenFromUrl(
      alertsMail.sentMessages![1].headers!['List-Unsubscribe'],
      '/api/alerts/unsubscribe-one-click',
    );

    // 5a. Unsubscribe u1 by link: GET renders 1-button page without mutating; POST unsubscribes -> 303 /alerts/unsubscribed/
    const getUnsubPage = await app.inject({
      method: 'GET',
      url: `/api/alerts/unsubscribe?t=${encodeURIComponent(u1Token)}`,
    });
    expect(getUnsubPage.statusCode).toBe(200);
    expect(getUnsubPage.body).toContain('<button type="submit"');
    const u1BeforePost = alertsDb
      .prepare('SELECT status FROM alert_subscribers WHERE email = ?')
      .get('u1-link@example.com.au') as { status: string };
    expect(u1BeforePost.status).toBe('confirmed');

    const postUnsubLink = await app.inject({
      method: 'POST',
      url: `/api/alerts/unsubscribe?t=${encodeURIComponent(u1Token)}`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: `t=${encodeURIComponent(u1Token)}`,
    });
    expect(postUnsubLink.statusCode).toBe(303);
    expect(postUnsubLink.headers.location).toBe('/alerts/unsubscribed/');

    // Verify unsubscribe token remains valid >30 days later (idempotent, non-expiring)
    expect(
      alertsRepo.unsubscribeByToken(
        u1Token,
        'link',
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      ).ok,
    ).toBe(true);

    // 5b. Unsubscribe u2 by RFC 8058 one-click POST (no Origin header, List-Unsubscribe=One-Click body) -> 200
    const oneClickRes = await app.inject({
      method: 'POST',
      url: `/api/alerts/unsubscribe-one-click?t=${encodeURIComponent(u2OneClickToken)}`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'List-Unsubscribe=One-Click',
    });
    expect(oneClickRes.statusCode).toBe(200);

    // 5c. Unsubscribe u3 by CLI -> logs unsubscribe_method='cli'
    alertsRepo.unsubscribeByEmail('u3-cli@example.com.au', 'cli');
    const u3Row = alertsDb
      .prepare('SELECT status, unsubscribe_method FROM alert_subscribers WHERE email = ?')
      .get('u3-cli@example.com.au') as { status: string; unsubscribe_method: string };
    expect(u3Row).toEqual({ status: 'unsubscribed', unsubscribe_method: 'cli' });

    // 6. Next alerts:send skips u1, u2, u3 and sends ONLY to u4-stays@example.com.au
    alertsMail.sentMessages!.length = 0;
    const secondLive = await sendAlertDraft({
      draftPath: draft.filePath,
      confirmSha256: draft.sha256,
      alertsConfig: liveAlertsCfg,
      siteOrigin: baseCfg.siteOrigin,
      repo: alertsRepo,
      mail: alertsMail,
      sleepFn: async () => {},
    });
    expect(secondLive.recipients).toBe(1);
    expect(alertsMail.sentMessages?.length).toBe(1);
    expect(alertsMail.sentMessages![0].to).toBe('u4-stays@example.com.au');

    // 7. Re-subscribing any of the unsubscribed/suppressed addresses returns 202 and sends nothing
    alertsMail.sentMessages!.length = 0;
    for (const unsubEmail of [
      'u1-link@example.com.au',
      'u2-oneclick@example.com.au',
      'u3-cli@example.com.au',
    ]) {
      const reSub = await app.inject({
        method: 'POST',
        url: '/api/alerts/subscribe',
        headers: {
          origin: 'https://householdrebates.com.au',
          'content-type': 'application/json',
        },
        payload: {
          email: unsubEmail,
          consent: true,
          consentVersion: ALERTS_CONSENT_VERSION_V1,
          website: '',
        },
      });
      expect(reSub.statusCode).toBe(202);
    }
    expect(alertsMail.sentMessages?.length).toBe(0);

    // Verify alert_sends audit table recorded the two live sends
    const sendRows = alertsDb.prepare('SELECT * FROM alert_sends ORDER BY id ASC').all() as {
      recipients: number;
      approved_by: string;
    }[];
    expect(sendRows.map((r) => r.recipients)).toEqual([4, 1]);
    expect(sendRows[0].approved_by).toContain('Gurinder Singh');

    fs.rmSync(tmpDir, { recursive: true, force: true });
    await app.close();
  });

  it('supports export, erase, stats, and the accepted retention schedule (72h pending purge, 30d ip_hash null, 24m post-unsubscribe consent delete, indefinite suppression)', async () => {
    const { app, alertsDb, alertsRepo } = await buildServer({
      config: makeBaseApiConfig(),
      alertsConfig: makeLiveAlertsConfig(),
    });

    const t0 = new Date('2026-11-14T00:00:00.000Z');

    // Pending user (never confirms)
    alertsRepo.subscribePending({
      email: 'pending-only@example.com.au',
      sourcePage: '/',
      ipHash: 'ip-p',
      userAgent: 'ua-p',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: t0,
    });

    // Confirmed user (kept until unsubscribe)
    const conf = alertsRepo.subscribePending({
      email: 'active@example.com.au',
      sourcePage: '/',
      ipHash: 'ip-c',
      userAgent: 'ua-c',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: t0,
    });
    if (conf.action !== 'created_pending') throw new Error('expected created_pending');
    alertsRepo.confirmByToken(conf.rawConfirmToken, t0);

    // Unsubscribed user + erased user
    const unsub = alertsRepo.subscribePending({
      email: 'former@example.com.au',
      sourcePage: '/',
      ipHash: 'ip-u',
      userAgent: 'ua-u',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: t0,
    });
    if (unsub.action !== 'created_pending') throw new Error('expected created_pending');
    alertsRepo.confirmByToken(unsub.rawConfirmToken, t0);
    alertsRepo.unsubscribeByEmail('former@example.com.au', 'cli', t0);

    const toErase = alertsRepo.subscribePending({
      email: 'erase-me@example.com.au',
      sourcePage: '/',
      ipHash: 'ip-e',
      userAgent: 'ua-e',
      consentVersion: ALERTS_CONSENT_VERSION_V1,
      privacyVersion: '2026-11-13-v1',
      confirmTtlHours: 72,
      now: t0,
    });
    if (toErase.action !== 'created_pending') throw new Error('expected created_pending');
    alertsRepo.confirmByToken(toErase.rawConfirmToken, t0);

    // Export individual data before erase
    const exported = alertsRepo.exportPersonalData('erase-me@example.com.au', t0);
    expect((exported.subscriber as Record<string, unknown>).email).toBe('erase-me@example.com.au');
    expect((exported.consents as unknown[]).length).toBe(1);

    // Erase nulls email, keeps hash in suppression
    const eraseRes = alertsRepo.erasePersonalData('erase-me@example.com.au', t0);
    expect(eraseRes).toEqual({ erasedCount: 1, suppressed: true });
    const erasedRow = alertsDb
      .prepare("SELECT email, ip_hash, user_agent, status FROM alert_subscribers WHERE status = 'erased'")
      .get() as Record<string, unknown>;
    expect(erasedRow).toEqual({
      email: null,
      ip_hash: null,
      user_agent: null,
      status: 'erased',
    });

    // Stats outputs counts only (no emails)
    const statsJson = JSON.stringify(alertsRepo.getStats());
    expect(statsJson).not.toContain('@');

    // Retention at +35 days: pending purged (>72h), ip_hash/user_agent nulled (>30d), consents still kept (<24m), confirmed kept, suppression kept
    const tPlus35d = new Date(t0.getTime() + 35 * 24 * 60 * 60 * 1000);
    const purge35d = alertsRepo.runRetentionPurge(72, tPlus35d);
    expect(purge35d.expiredPendingPurged).toBe(1);
    expect(purge35d.ipHashesNulled).toBe(2); // active + former (erase-me already had null ip_hash)
    expect(purge35d.consentsDeleted).toBe(0);

    // Retention at +735 days (>24 months): unsubscribed/erased consents deleted; active confirmed subscriber & suppression hashes still kept!
    const tPlus735d = new Date(t0.getTime() + 735 * 24 * 60 * 60 * 1000);
    const purge735d = alertsRepo.runRetentionPurge(72, tPlus735d);
    expect(purge735d.consentsDeleted).toBe(2); // former + erase-me

    const finalStats = alertsRepo.getStats();
    expect(finalStats.byStatus.confirmed).toBe(1);
    expect(finalStats.suppressedHashes).toBe(2); // kept indefinitely

    await app.close();
  });

  it('proves strict isolation: installer delivery and lead modules cannot import alerts or read alert_subscribers on the leads DB handle', async () => {
    // 1. Separate DB handle proof: leads db has no alert_subscribers table
    const { app, db, alertsDb } = await buildServer({
      config: makeBaseApiConfig(),
      alertsConfig: makeLiveAlertsConfig(),
    });
    expect(db).not.toBe(alertsDb);
    expect(() => db.prepare('SELECT * FROM alert_subscribers').all()).toThrow(
      /no such table: alert_subscribers/i,
    );
    await app.close();

    // 2. Module boundary proof: no lead/installer CLI or module imports from alerts/
    const leadFiles = [
      'db.ts',
      'config.ts',
      'consent.ts',
      'routing.ts',
      'schema.ts',
      'cli/deliver.ts',
      'cli/withdraw.ts',
      'cli/export.ts',
      'cli/erase.ts',
      'cli/purge.ts',
      'cli/status.ts',
    ];
    for (const rel of leadFiles) {
      const src = fs.readFileSync(path.join(API_SRC_DIR, rel), 'utf8');
      expect(src, `${rel} must not import alerts module`).not.toMatch(/alerts\//);
      expect(src, `${rel} must not reference alert_subscribers`).not.toContain(
        'alert_subscribers',
      );
    }

    // 3. No CLI script exports the full alert subscriber list
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(API_SRC_DIR, '../package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };
    expect(Object.keys(pkg.scripts)).not.toContain('alerts:list');
    expect(Object.keys(pkg.scripts)).not.toContain('alerts:dump');
  });
});
