import type Database from 'better-sqlite3';
import { loadConfig } from '../config.js';
import { openDatabase } from '../db.js';

export function erasePersonalData(
  db: Database.Database,
  email: string,
  now: Date = new Date(),
): { erasedCount: number } {
  const cleanEmail = email.trim().toLowerCase();
  const leads = db
    .prepare('SELECT id, ref FROM leads WHERE email = ?')
    .all(cleanEmail) as { id: number; ref: string }[];

  const nowUtc = now.toISOString();

  const tx = db.transaction(() => {
    for (const l of leads) {
      db.prepare(
        `UPDATE leads
         SET first_name = NULL,
             last_name = NULL,
             email = NULL,
             phone_e164 = NULL,
             message = NULL,
             ip_hash = NULL,
             user_agent = NULL,
             status = 'erased',
             purged_at_utc = ?
         WHERE id = ?`,
      ).run(nowUtc, l.id);

      db.prepare(
        `INSERT INTO events (at_utc, lead_id, actor, action, detail)
         VALUES (?, ?, 'cli:erase', 'personal_data_erased', ?)`,
      ).run(nowUtc, l.id, JSON.stringify({ ref: l.ref }));
    }
  });

  tx();
  return { erasedCount: leads.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
  if (!email) {
    console.error('Usage: npm run erase -- --email user@example.com');
    process.exit(1);
  }
  const cfg = loadConfig();
  const db = openDatabase(cfg.dbPath);
  const res = erasePersonalData(db, email);
  console.log(`Erased personal fields for ${res.erasedCount} lead(s).`);
}
