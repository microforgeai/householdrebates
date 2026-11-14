import type Database from 'better-sqlite3';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashIp, verifyFormToken } from '../antispam.js';
import type { MailDriver } from '../mail/index.js';
import { buildAlertsConfirmationEmail } from '../mail/templates/alerts-confirm.js';
import { escapeHtml } from '../mail/templates/alerts-sender.js';
import type { AlertsConfig } from './config.js';
import { isKnownAlertsConsentVersion } from './consent.js';
import { AlertsRepository } from './repository.js';

export interface RegisterAlertRoutesOptions {
  alertsDb: Database.Database;
  alertsConfig: AlertsConfig;
  siteOrigin: string;
  ipHashSecret: string;
  formTokenSecret: string;
  alertsMail: MailDriver;
}

const IDENTICAL_SUBSCRIBE_202_BODY = {
  ok: true,
  message: 'Check your inbox to confirm. Nothing is sent until you click the link.',
} as const;

const EmailSchema = z.string().trim().toLowerCase().email().max(254);

function isConsentChecked(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 'on' || raw === '1';
}

function extractSourcePage(rawSourcePage: unknown, referer: string, siteOrigin: string): string {
  if (typeof rawSourcePage === 'string') {
    const trimmed = rawSourcePage.trim();
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && trimmed.length <= 200) {
      return trimmed;
    }
  }
  if (referer.startsWith(`${siteOrigin}/`)) {
    try {
      const u = new URL(referer);
      return u.pathname.slice(0, 200) || '/';
    } catch {
      return '/';
    }
  }
  return '/';
}

function renderOneButtonUnsubscribeHtml(rawToken: string): string {
  const safeToken = escapeHtml(rawToken);
  const encodedQueryToken = encodeURIComponent(rawToken);
  return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Unsubscribe | Household Rebates</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:34rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1c1b18;">
  <main>
    <h1 style="font-size:1.4rem;">Unsubscribe from rule-change alerts</h1>
    <p>Select the button below to stop receiving Victorian energy rebate rule-change emails from Household Rebates.</p>
    <form method="post" action="/api/alerts/unsubscribe?t=${encodedQueryToken}">
      <input type="hidden" name="t" value="${safeToken}" />
      <button type="submit" style="padding:0.65rem 1.2rem;font-size:1rem;cursor:pointer;">Unsubscribe</button>
    </form>
  </main>
</body>
</html>`;
}

export function registerAlertRoutes(
  app: FastifyInstance,
  opts: RegisterAlertRoutesOptions,
): AlertsRepository {
  const repo = new AlertsRepository(opts.alertsDb, opts.alertsConfig.alertsHashSecret);
  const baseOrigin = opts.siteOrigin.replace(/\/+$/, '');

  app.post('/api/alerts/subscribe', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');

    // Step 1: when ALERTS_ENABLED=false, every /api/alerts/* POST returns 503 and nothing is stored or sent
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }

    const ct = (req.headers['content-type'] || '').toLowerCase();
    const isHtmlPost = ct.includes('application/x-www-form-urlencoded');
    const isJsonPost = ct.includes('application/json');
    if (!isHtmlPost && !isJsonPost) {
      return reply.status(415).send({ error: 'Unsupported Content-Type' });
    }

    const originHeader = req.headers.origin || '';
    const refererHeader = req.headers.referer || '';
    const validOrigin =
      originHeader === baseOrigin || refererHeader.startsWith(`${baseOrigin}/`);
    if (!validOrigin) {
      return reply.status(403).send({ error: 'Forbidden origin' });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    // Honeypot: identical 202 response, nothing stored or sent
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      repo.incrementHoneypot();
      return reply.status(202).send(IDENTICAL_SUBSCRIBE_202_BODY);
    }

    // Form token check (same rule as /leads: missing allowed for no-JS; present & invalid -> 400)
    const rawToken = typeof body.formToken === 'string' ? body.formToken.trim() : '';
    if (rawToken) {
      const tokenCheck = verifyFormToken(rawToken, opts.formTokenSecret);
      if (!tokenCheck.valid) {
        return reply.status(400).send({ error: 'Invalid or expired form token' });
      }
    }

    // Validate email, unticked-by-default consent=true, and consentVersion
    const fieldErrors: Record<string, string> = {};
    const emailParsed = EmailSchema.safeParse(body.email);
    if (!emailParsed.success) {
      fieldErrors.email = 'Enter a valid email address.';
    }
    if (!isConsentChecked(body.consent)) {
      fieldErrors.consent = 'Tick the consent box to receive rule-change alerts.';
    }
    const rawConsentVersion =
      typeof body.consentVersion === 'string' ? body.consentVersion.trim() : '';
    const expectedVersion = opts.alertsConfig.alertsConsentVersion.trim();
    if (
      !rawConsentVersion ||
      !isKnownAlertsConsentVersion(rawConsentVersion) ||
      (expectedVersion && rawConsentVersion !== expectedVersion)
    ) {
      fieldErrors.consentVersion = 'Invalid or outdated consent version.';
    }

    if (Object.keys(fieldErrors).length > 0 || !emailParsed.success) {
      return reply.status(422).send({ error: 'Validation failed', fields: fieldErrors });
    }

    const ipHash = hashIp(req.ip || '127.0.0.1', opts.ipHashSecret);
    if (!repo.checkAndIncrementIpLimit(ipHash, opts.alertsConfig.alertsRateLimitPerIpHour)) {
      return reply.status(429).send({ error: 'Too many requests; please try again later.' });
    }

    const sourcePage = extractSourcePage(body.sourcePage, refererHeader, baseOrigin);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500);

    const outcome = repo.subscribePending({
      email: emailParsed.data,
      sourcePage,
      ipHash,
      userAgent,
      consentVersion: rawConsentVersion,
      privacyVersion: opts.alertsConfig.privacyPolicyVersion,
      confirmTtlHours: opts.alertsConfig.alertsConfirmTtlHours,
    });

    // Suppressed, already confirmed, or duplicate pending -> identical 202 and NO email sent
    if (outcome.action !== 'created_pending') {
      return reply.status(202).send(IDENTICAL_SUBSCRIBE_202_BODY);
    }

    const confirmUrl = `${baseOrigin}/api/alerts/confirm?t=${encodeURIComponent(outcome.rawConfirmToken)}`;
    const confirmEmail = buildAlertsConfirmationEmail({
      confirmUrl,
      confirmTtlHours: opts.alertsConfig.alertsConfirmTtlHours,
      siteOrigin: baseOrigin,
      sender: opts.alertsConfig.sender,
    });

    await opts.alertsMail.send({
      from: opts.alertsConfig.alertsFrom || undefined,
      to: emailParsed.data,
      replyTo: opts.alertsConfig.alertsReplyTo || undefined,
      subject: confirmEmail.subject,
      text: confirmEmail.text,
      html: confirmEmail.html,
    });

    return reply.status(202).send(IDENTICAL_SUBSCRIBE_202_BODY);
  });

  app.get('/api/alerts/confirm', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }

    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const rawToken = (q.t || '').trim();
    const res = repo.confirmByToken(rawToken);
    if (res.outcome === 'confirmed') {
      return reply.redirect('/alerts/confirmed/', 303);
    }
    return reply.redirect('/alerts/expired/', 303);
  });

  app.get('/api/alerts/unsubscribe', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Robots-Tag', 'noindex');
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }

    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const rawToken = (q.t || '').trim();
    if (!repo.verifyUnsubscribeToken(rawToken)) {
      return reply.status(400).type('text/html; charset=utf-8').send('<!doctype html><html lang="en-AU"><body><p>Invalid unsubscribe link.</p></body></html>');
    }

    return reply
      .status(200)
      .type('text/html; charset=utf-8')
      .send(renderOneButtonUnsubscribeHtml(rawToken));
  });

  app.post('/api/alerts/unsubscribe', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }

    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawToken =
      (typeof q.t === 'string' && q.t.trim()) ||
      (typeof body.t === 'string' && body.t.trim()) ||
      '';

    const res = repo.unsubscribeByToken(rawToken, 'link');
    if (!res.ok) {
      return reply.status(400).send({ error: 'Invalid unsubscribe token' });
    }

    return reply.redirect('/alerts/unsubscribed/', 303);
  });

  app.get('/api/alerts/unsubscribe-one-click', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }
    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const rawToken = (q.t || '').trim();
    return reply.redirect(`/api/alerts/unsubscribe?t=${encodeURIComponent(rawToken)}`, 303);
  });

  app.post('/api/alerts/unsubscribe-one-click', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!opts.alertsConfig.alertsEnabled) {
      return reply.status(503).send({ error: 'Rule-change alerts are currently disabled' });
    }

    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawToken =
      (typeof q.t === 'string' && q.t.trim()) ||
      (typeof body.t === 'string' && body.t.trim()) ||
      '';

    const res = repo.unsubscribeByToken(rawToken, 'one-click');
    if (!res.ok) {
      return reply.status(400).send({ error: 'Invalid unsubscribe token' });
    }

    return reply.status(200).send({ ok: true });
  });

  return repo;
}
