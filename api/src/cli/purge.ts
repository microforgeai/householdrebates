import type Database from 'better-sqlite3';
import { loadConfig } from '../config.js';
import { openDatabase } from '../db.js';

export function runRetentionPurge(
  db: Database.Database,
  now: Date = new Date(),
): {
  ipHashesNulled: number;
  leadsPurged: number;
  consentsDeleted: number;
} {
  const nowUtc = now.toISOString();
  const minus30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const minus12m = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const minus24m = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString();

  const tx = db.transaction(() => {
    // 1. Null ip_hash and user_agent older than 30 days
    const ipRes = db
      .prepare(
        `UPDATE leads
         SET ip_hash = NULL, user_agent = NULL
         WHERE created_at_utc < ? AND (ip_hash IS NOT NULL OR user_agent IS NOT NULL)`,
      )
      .run(minus30d);

    // 2. Null personal contact details older than 12 months
    const leadRes = db
      .prepare(
        `UPDATE leads
         SET first_name = NULL,
             last_name = NULL,
             email = NULL,
             phone_e164 = NULL,
             message = NULL,
             ip_hash = NULL,
             user_agent = NULL,
             status = 'purged',
             purged_at_utc = ?
         WHERE created_at_utc < ? AND status NOT IN ('erased', 'purged')`,
      )
      .run(nowUtc, minus12m);

    // 3. Delete consents 24 months after expiry or withdrawal
    const oldConsents = db
      .prepare(
        `SELECT id FROM consents
         WHERE COALESCE(withdrawn_at_utc, expires_at_utc) < ?`,
      )
      .all(minus24m) as { id: number }[];

    for (const c of oldConsents) {
      db.prepare('DELETE FROM consent_scopes WHERE consent_id = ?').run(c.id);
      db.prepare('DELETE FROM consents WHERE id = ?').run(c.id);
    }

    db.prepare(
      `INSERT INTO events (at_utc, actor, action, detail)
       VALUES (?, 'cli:purge', 'retention_purge', ?)`,
    ).run(
      nowUtc,
      JSON.stringify({
        ipHashesNulled: ipRes.changes,
        leadsPurged: leadRes.changes,
        consentsDeleted: oldConsents.length,
      }),
    );

    return {
      ipHashesNulled: ipRes.changes,
      leadsPurged: leadRes.changes,
      consentsDeleted: oldConsents.length,
    };
  });

  return tx();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const db = openDatabase(cfg.dbPath);
  const res = runRetentionPurge(db);
  console.log(JSON.stringify(res, null, 2));
}
