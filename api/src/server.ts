import Fastify, { type FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody';
import {
  assertStartupGuards,
  loadConfig,
  loadInstallers,
  type ApiConfig,
  type InstallerRecord,
} from './config.js';
import {
  checkSubmissionLimits,
  generateLeadRef,
  incrementHoneypotCounter,
  openDatabase,
} from './db.js';
import { hashIp, signFormToken, verifyFormToken } from './antispam.js';
import { routeInstallers, toPublicSummaries } from './routing.js';
import { validateLeadPayload } from './schema.js';
import {
  CONSENT_VERSIONS,
  PRIVACY_POLICY_VERSION,
  computeExpiryUtc,
  renderConsentSnapshot,
} from './consent.js';
import { createMailDriver, type MailDriver } from './mail/index.js';
import {
  buildConsumerConfirmationEmail,
  buildInternalNoticeEmail,
} from './mail/templates.js';
import {
  assertAlertsStartupGuards,
  createAlertsMailDriver,
  loadAlertsConfig,
  type AlertsConfig,
} from './alerts/config.js';
import { openAlertsDatabase } from './alerts/db.js';
import { registerAlertRoutes } from './alerts/routes.js';
import type { AlertsRepository } from './alerts/repository.js';

export interface BuildServerOptions {
  config?: ApiConfig;
  installers?: InstallerRecord[];
  mailDriver?: MailDriver;
  alertsConfig?: AlertsConfig;
  alertsMailDriver?: MailDriver;
}

export async function buildServer(opts: BuildServerOptions = {}): Promise<{
  app: FastifyInstance;
  db: ReturnType<typeof openDatabase>;
  alertsDb: ReturnType<typeof openAlertsDatabase>;
  alertsRepo: AlertsRepository;
  mail: MailDriver;
  alertsMail: MailDriver;
  config: ApiConfig;
  alertsConfig: AlertsConfig;
}> {
  const config = opts.config ?? loadConfig();
  const installers = opts.installers ?? loadInstallers(config.installersPath);
  const alertsConfig = opts.alertsConfig ?? loadAlertsConfig(process.env, config);

  assertStartupGuards(config, installers);
  assertAlertsStartupGuards(alertsConfig);

  const mail = opts.mailDriver ?? createMailDriver(config);
  if (config.leadsEnabled) {
    await mail.verify();
  }

  const alertsMail =
    opts.alertsMailDriver ?? opts.mailDriver ?? createAlertsMailDriver(alertsConfig, config);
  if (alertsConfig.alertsEnabled) {
    await alertsMail.verify();
  }

  const db = openDatabase(config.dbPath);
  const alertsDb = openAlertsDatabase(alertsConfig.alertsDbPath);

  const app = Fastify({
    logger: config.nodeEnv !== 'test',
    bodyLimit: 8192,
    trustProxy: '127.0.0.1',
  });

  await app.register(formbody);

  app.setErrorHandler((_err, _req, reply) => {
    reply.status(500).send({ error: 'Internal server error' });
  });

  app.get('/health', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { ok: true, leadsEnabled: config.leadsEnabled };
  });

  app.get('/form-token', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
    const token = signFormToken(config.formTokenSecret);
    return { token };
  });

  app.get('/routing', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    const q = req.query as Record<string, string | undefined>;
    const postcode = (q.postcode || '').trim();
    const activity = q.activity === 'hotwater' ? 'hotwater' : 'rcac';
    const matched = routeInstallers(installers, postcode, activity);
    return { installers: toPublicSummaries(matched) };
  });

  app.post('/leads', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    const ct = (req.headers['content-type'] || '').toLowerCase();
    const isHtmlPost = ct.includes('application/x-www-form-urlencoded');
    const isJsonPost = ct.includes('application/json');

    if (!isHtmlPost && !isJsonPost) {
      return reply.status(415).send({ error: 'Unsupported Content-Type' });
    }

    // Origin / Referer check
    const originHeader = req.headers.origin || '';
    const refererHeader = req.headers.referer || '';
    const validOrigin =
      originHeader === config.siteOrigin || refererHeader.startsWith(`${config.siteOrigin}/`);
    if (!validOrigin) {
      return reply.status(403).send({ error: 'Forbidden origin' });
    }

    // Step 3: LEADS_ENABLED check
    if (!config.leadsEnabled) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=closed', 303);
      }
      return reply.status(503).send({ error: 'Quote requests are currently closed' });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    // Step 4: Honeypot check
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      incrementHoneypotCounter(db);
      if (isHtmlPost) {
        return reply.redirect('/thanks/', 303);
      }
      return reply.status(200).send({ ok: true, ref: 'HR-000000' });
    }

    // Step 5: Form token check (missing allowed with no_js=1; present but invalid -> 400)
    let noJs = 0;
    const rawToken = typeof body.formToken === 'string' ? body.formToken.trim() : '';
    if (!rawToken) {
      noJs = 1;
    } else {
      const tokenCheck = verifyFormToken(rawToken, config.formTokenSecret);
      if (!tokenCheck.valid) {
        if (isHtmlPost) {
          return reply.redirect('/form-error/?reason=invalid', 303);
        }
        return reply.status(400).send({ error: 'Invalid or expired form token' });
      }
    }

    // Step 6: Validate fields
    const validation = validateLeadPayload(body);
    if (!validation.ok || !validation.data) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=invalid', 303);
      }
      return reply.status(422).send({ error: 'Validation failed', fields: validation.errors });
    }

    const d = validation.data;
    const ipHash = hashIp(req.ip || '127.0.0.1', config.ipHashSecret);

    // Step 7: Rate limits (<=3 per ip_hash per 24h; <=2 per email per 30d)
    const limitCheck = checkSubmissionLimits(db, ipHash, d.email);
    if (!limitCheck.allowed) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=rate_limit', 303);
      }
      return reply.status(429).send({ error: 'Submission limit reached' });
    }

    // Step 8: Routing check — submitted recipientIds must equal routed set
    const routed = routeInstallers(installers, d.postcode, d.activity);
    if (routed.length === 0) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=unserviced', 303);
      }
      return reply.status(409).send({ error: 'No active installer covers this postcode and activity' });
    }

    const routedIds = routed.map((r) => r.id).sort();
    const submittedIds = [...d.recipientIds].sort();
    if (
      routedIds.length !== submittedIds.length ||
      routedIds.some((id, idx) => id !== submittedIds[idx])
    ) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=stale', 303);
      }
      return reply.status(409).send({ error: 'Recipient installer list is stale; please reload' });
    }

    // Step 9: Consent version check & snapshot rebuild
    const expectedVersion = CONSENT_VERSIONS[d.activity];
    if (d.consentVersion !== expectedVersion) {
      if (isHtmlPost) {
        return reply.redirect('/form-error/?reason=consent_version', 303);
      }
      return reply.status(400).send({ error: 'Unknown consent version' });
    }

    const consentRendered = renderConsentSnapshot({
      activity: d.activity,
      recipients: toPublicSummaries(routed),
      channels: d.contactPrefs,
      serverCountry: config.serverCountry,
      emailProviderAndCountry: config.leadsEmailProviderNote,
    });

    const now = new Date();
    const nowUtc = now.toISOString();
    const expiresAtUtc = computeExpiryUtc(now, 3);
    const ref = generateLeadRef();
    const privacyVer = config.privacyPolicyVersion || PRIVACY_POLICY_VERSION;
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500);

    // Step 10: Single transaction for leads, consents, consent_scopes, events
    const tx = db.transaction(() => {
      const leadRes = db
        .prepare(
          `INSERT INTO leads (
            ref, created_at_utc, state, activity, current_system,
            first_name, last_name, email, phone_e164, postcode,
            ownership, building_over_2y, work_started, product_bought, no_js,
            message, how_heard, page_url, utm_json, ip_hash, user_agent, status
          ) VALUES (?, ?, 'vic', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
        )
        .run(
          ref,
          nowUtc,
          d.activity,
          d.currentSystem,
          d.firstName,
          d.lastName,
          d.email,
          d.phoneE164,
          d.postcode,
          d.ownership,
          d.buildingOver2Years,
          d.workStarted,
          d.productBought,
          noJs,
          d.message,
          d.howHeard,
          d.pageUrl,
          d.utmJson,
          ipHash,
          userAgent,
        );

      const leadId = Number(leadRes.lastInsertRowid);

      const consentRes = db
        .prepare(
          `INSERT INTO consents (
            lead_id, version, text_sha256, text_snapshot, privacy_version,
            given_at_utc, expires_at_utc
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          leadId,
          consentRendered.version,
          consentRendered.textSha256,
          consentRendered.textSnapshot,
          privacyVer,
          nowUtc,
          expiresAtUtc,
        );

      const consentId = Number(consentRes.lastInsertRowid);

      const scopeStmt = db.prepare(
        `INSERT INTO consent_scopes (
          consent_id, installer_id, accredited_provider, channel, activity
        ) VALUES (?, ?, ?, ?, ?)`,
      );

      for (const inst of routed) {
        for (const ch of d.contactPrefs) {
          scopeStmt.run(consentId, inst.id, inst.accreditedProvider, ch, d.activity);
        }
      }

      db.prepare(
        `INSERT INTO events (at_utc, lead_id, actor, action, detail)
         VALUES (?, ?, 'api', 'lead_created', ?)`,
      ).run(nowUtc, leadId, JSON.stringify({ ref, recipientIds: routedIds, noJs }));

      return leadId;
    });

    const leadId = tx();

    // Step 11: Send internal notice & consumer confirmation (mail failures after commit are logged, lead kept)
    try {
      const notice = buildInternalNoticeEmail({
        ref,
        activity: d.activity,
        postcode: d.postcode,
        recipientIds: routedIds,
        createdAtUtc: nowUtc,
      });
      await mail.send({
        to: config.leadsNotifyTo,
        subject: notice.subject,
        text: notice.text,
        html: notice.html,
      });

      const confirm = buildConsumerConfirmationEmail({
        ref,
        firstName: d.firstName,
        activity: d.activity,
        installers: toPublicSummaries(routed),
        channels: d.contactPrefs,
        expiresAtUtc,
      });
      await mail.send({
        to: d.email,
        subject: confirm.subject,
        text: confirm.text,
        html: confirm.html,
        replyTo: 'privacy@householdrebates.com.au',
      });
    } catch (mailErr) {
      db.prepare(
        `INSERT INTO events (at_utc, lead_id, actor, action, detail)
         VALUES (?, ?, 'api', 'mail_error', ?)`,
      ).run(
        new Date().toISOString(),
        leadId,
        mailErr instanceof Error ? mailErr.message : 'Mail send failed',
      );
    }

    // Step 12: Redirect or JSON
    if (isHtmlPost) {
      return reply.redirect(`/thanks/?ref=${encodeURIComponent(ref)}`, 303);
    }
    return reply.status(200).send({ ok: true, ref });
  });

  const alertsRepo = registerAlertRoutes(app, {
    alertsDb,
    alertsConfig,
    siteOrigin: config.siteOrigin,
    ipHashSecret: config.ipHashSecret,
    formTokenSecret: config.formTokenSecret,
    alertsMail,
  });

  app.addHook('onClose', (_instance, done) => {
    try {
      if (alertsDb.open) alertsDb.close();
      if (db.open) db.close();
    } catch {
      // ignore close errors
    }
    done();
  });

  return { app, db, alertsDb, alertsRepo, mail, alertsMail, config, alertsConfig };
}

// Entrypoint when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer()
    .then(async ({ app, config }) => {
      await app.listen({ host: config.host, port: config.port });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
