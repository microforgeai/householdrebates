import type Database from 'better-sqlite3';
import { loadConfig } from '../config.js';
import { openDatabase } from '../db.js';

export function exportPersonalData(
  db: Database.Database,
  email: string,
): Record<string, unknown> {
  const cleanEmail = email.trim().toLowerCase();
  const leads = db
    .prepare('SELECT * FROM leads WHERE email = ?')
    .all(cleanEmail) as Record<string, any>[];

  const records = leads.map((lead) => {
    const consents = db.prepare('SELECT * FROM consents WHERE lead_id = ?').all(lead.id);
    const deliveries = db.prepare('SELECT * FROM deliveries WHERE lead_id = ?').all(lead.id);
    const events = db.prepare('SELECT * FROM events WHERE lead_id = ?').all(lead.id);
    return {
      lead,
      consents,
      deliveries,
      events,
    };
  });

  return {
    exportedAtUtc: new Date().toISOString(),
    email: cleanEmail,
    records,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
  if (!email) {
    console.error('Usage: npm run export -- --email user@example.com');
    process.exit(1);
  }
  const cfg = loadConfig();
  const db = openDatabase(cfg.dbPath);
  console.log(JSON.stringify(exportPersonalData(db, email), null, 2));
}
