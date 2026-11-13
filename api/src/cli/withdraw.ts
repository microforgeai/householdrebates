import type Database from 'better-sqlite3';
import { loadConfig, loadInstallers, type InstallerRecord } from '../config.js';
import { openDatabase } from '../db.js';
import { createMailDriver, type MailDriver } from '../mail/index.js';
import { buildWithdrawalNoticeEmail } from '../mail/templates.js';

export async function withdrawConsent(
  db: Database.Database,
  mail: MailDriver,
  installers: InstallerRecord[],
  query: { email?: string; ref?: string },
  via = 'cli',
  now: Date = new Date(),
): Promise<{ withdrawnRefs: string[]; notifiedInstallers: number }> {
  let leads: Record<string, any>[] = [];
  if (query.ref) {
    leads = db
      .prepare('SELECT * FROM leads WHERE ref = ?')
      .all(query.ref.trim()) as Record<string, any>[];
  } else if (query.email) {
    leads = db
      .prepare('SELECT * FROM leads WHERE email = ?')
      .all(query.email.trim().toLowerCase()) as Record<string, any>[];
  } else {
    throw new Error('Must provide --ref or --email');
  }

  if (leads.length === 0) {
    throw new Error('No matching leads found to withdraw.');
  }

  const nowUtc = now.toISOString();
  const installerMap = new Map(installers.map((i) => [i.id, i]));
  const withdrawnRefs: string[] = [];
  let notifiedInstallers = 0;

  for (const lead of leads) {
    db.prepare(`UPDATE leads SET status = 'withdrawn' WHERE id = ?`).run(lead.id);
    db.prepare(
      `UPDATE consents
       SET withdrawn_at_utc = COALESCE(withdrawn_at_utc, ?),
           withdrawn_via = COALESCE(withdrawn_via, ?)
       WHERE lead_id = ?`,
    ).run(nowUtc, via, lead.id);

    const deliveries = db
      .prepare('SELECT DISTINCT installer_id FROM deliveries WHERE lead_id = ?')
      .all(lead.id) as { installer_id: string }[];

    for (const del of deliveries) {
      const inst = installerMap.get(del.installer_id);
      if (inst) {
        const msg = buildWithdrawalNoticeEmail({
          ref: lead.ref,
          installerTradingName: inst.tradingName,
          withdrawnAtUtc: nowUtc,
        });
        await mail.send({
          to: inst.contactEmailForLeads,
          subject: msg.subject,
          text: msg.text,
          html: msg.html,
        });
        notifiedInstallers++;
      }
    }

    db.prepare(
      `INSERT INTO events (at_utc, lead_id, actor, action, detail)
       VALUES (?, ?, 'cli:withdraw', 'consent_withdrawn', ?)`,
    ).run(nowUtc, lead.id, JSON.stringify({ via, notifiedInstallers }));

    withdrawnRefs.push(lead.ref);
  }

  return { withdrawnRefs, notifiedInstallers };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const refIdx = args.indexOf('--ref');
  const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
  const ref = refIdx >= 0 ? args[refIdx + 1] : undefined;

  const cfg = loadConfig();
  const installers = loadInstallers(cfg.installersPath);
  const db = openDatabase(cfg.dbPath);
  const mail = createMailDriver(cfg);

  withdrawConsent(db, mail, installers, { email, ref })
    .then((res) => {
      console.log(
        `Withdrew consent for ${res.withdrawnRefs.join(', ')}; notified ${res.notifiedInstallers} installer(s).`,
      );
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
