import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function openAlertsDatabase(alertsDbPath: string): Database.Database {
  if (alertsDbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(alertsDbPath), { recursive: true });
  }
  const db = new Database(alertsDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runAlertsMigrations(db);
  return db;
}

export function runAlertsMigrations(db: Database.Database): void {
  const migrationPath = path.resolve(__dirname, 'migrations/002_alerts.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  db.exec(sql);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO schema_migrations (version, applied_at_utc) VALUES (?, ?)',
  ).run('002_alerts', now);
}

export function hashAlertEmail(email: string, secret: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHmac('sha256', secret).update(normalized, 'utf8').digest('hex');
}

export function generateAlertToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  return {
    rawToken,
    tokenHash: hashAlertToken(rawToken),
  };
}

export function hashAlertToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim(), 'utf8').digest('hex');
}
