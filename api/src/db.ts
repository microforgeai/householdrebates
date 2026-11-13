import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function openDatabase(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

export function runMigrations(db: Database.Database): void {
  const migrationPath = path.resolve(__dirname, 'migrations/001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  db.exec(sql);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO schema_migrations (version, applied_at_utc) VALUES (?, ?)',
  ).run('001_init', now);
}

export function generateLeadRef(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `HR-${code}`;
}

export function checkSubmissionLimits(
  db: Database.Database,
  ipHash: string,
  email: string,
  now: Date = new Date(),
): { allowed: boolean; reason?: 'ip_limit' | 'email_limit' } {
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const minus30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const ipRow = db
    .prepare(
      'SELECT COUNT(*) as cnt FROM leads WHERE ip_hash = ? AND created_at_utc >= ?',
    )
    .get(ipHash, minus24h) as { cnt: number };

  if (ipRow.cnt >= 3) {
    return { allowed: false, reason: 'ip_limit' };
  }

  const emailRow = db
    .prepare(
      'SELECT COUNT(*) as cnt FROM leads WHERE email = ? AND created_at_utc >= ?',
    )
    .get(email, minus30d) as { cnt: number };

  if (emailRow.cnt >= 2) {
    return { allowed: false, reason: 'email_limit' };
  }

  return { allowed: true };
}

export function incrementHoneypotCounter(db: Database.Database, now: Date = new Date()): void {
  const dayKey = `honeypot:${now.toISOString().slice(0, 10)}`;
  db.prepare(
    `INSERT INTO rate_counters (key, window_start_utc, count)
     VALUES (?, ?, 1)
     ON CONFLICT(key) DO UPDATE SET count = count + 1`,
  ).run(dayKey, now.toISOString());
}
