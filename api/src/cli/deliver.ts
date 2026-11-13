import type Database from 'better-sqlite3';
import { loadConfig, loadInstallers, type InstallerRecord } from '../config.js';
import { openDatabase } from '../db.js';
import { createMailDriver, type MailDriver } from '../mail/index.js';
import { buildInstallerDeliveryEmail } from '../mail/templates.js';

export async function deliverLeadByRef(
  db: Database.Database,
  mail: MailDriver,
  installers: InstallerRecord[],
  ref: string,
  now: Date = new Date(),
): Promise<{ deliveredCount: number }> {
  const lead = db
    .prepare('SELECT * FROM leads WHERE ref = ?')
    .get(ref.trim()) as Record<string, any> | undefined;

  if (!lead) {
    throw new Error(`Lead "${ref}" not found.`);
  }
  if (lead.status === 'withdrawn' || lead.status === 'erased' || lead.status === 'purged') {
    throw new Error(`Cannot deliver lead "${ref}" with status "${lead.status}".`);
  }

  const consent = db
    .prepare('SELECT * FROM consents WHERE lead_id = ?')
    .get(lead.id) as Record<string, any> | undefined;

  if (!consent) {
    throw new Error(`No consent record found for lead "${ref}".`);
  }
  if (consent.withdrawn_at_utc) {
    throw new Error(`Consent for lead "${ref}" was withdrawn at ${consent.withdrawn_at_utc}.`);
  }
  if (new Date(consent.expires_at_utc).getTime() <= now.getTime()) {
    throw new Error(`Consent for lead "${ref}" expired at ${consent.expires_at_utc}.`);
  }

  const scopes = db
    .prepare('SELECT * FROM consent_scopes WHERE consent_id = ?')
    .all(consent.id) as {
    installer_id: string;
    accredited_provider: string;
    channel: string;
  }[];

  const byInstaller = new Map<string, string[]>();
  for (const s of scopes) {
    const arr = byInstaller.get(s.installer_id) ?? [];
    arr.push(s.channel);
    byInstaller.set(s.installer_id, arr);
  }

  const installerMap = new Map(installers.map((i) => [i.id, i]));
  let deliveredCount = 0;
  const nowUtc = now.toISOString();

  for (const [installerId, channels] of byInstaller.entries()) {
    const inst = installerMap.get(installerId);
    if (!inst || !inst.active) {
      throw new Error(`Installer "${installerId}" is missing or inactive.`);
    }

    const emailContent = buildInstallerDeliveryEmail({
      ref: lead.ref,
      installerTradingName: inst.tradingName,
      accreditedProvider: inst.accreditedProvider,
      activity: lead.activity,
      currentSystem: lead.current_system,
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phoneE164: lead.phone_e164,
      postcode: lead.postcode,
      ownership: lead.ownership,
      buildingOver2Years: lead.building_over_2y,
      workStarted: lead.work_started,
      productBought: lead.product_bought,
      message: lead.message,
      channels,
      consentVersion: consent.version,
      consentSha256: consent.text_sha256,
      consentSnapshot: consent.text_snapshot,
      givenAtUtc: consent.given_at_utc,
      expiresAtUtc: consent.expires_at_utc,
    });

    const sendRes = await mail.send({
      to: inst.contactEmailForLeads,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    db.prepare(
      `INSERT INTO deliveries (lead_id, installer_id, sent_at_utc, message_id, updated_at_utc)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(lead.id, inst.id, nowUtc, sendRes.messageId, nowUtc);

    deliveredCount++;
  }

  db.prepare(`UPDATE leads SET status = 'delivered' WHERE id = ?`).run(lead.id);
  db.prepare(
    `INSERT INTO events (at_utc, lead_id, actor, action, detail)
     VALUES (?, ?, 'cli:deliver', 'lead_delivered', ?)`,
  ).run(nowUtc, lead.id, JSON.stringify({ deliveredCount }));

  return { deliveredCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Usage: npm run deliver -- HR-XXXXXX');
    process.exit(1);
  }
  const cfg = loadConfig();
  const installers = loadInstallers(cfg.installersPath);
  const db = openDatabase(cfg.dbPath);
  const mail = createMailDriver(cfg);

  deliverLeadByRef(db, mail, installers, ref)
    .then((res) => {
      console.log(`Delivered ${ref} to ${res.deliveredCount} installer(s).`);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
