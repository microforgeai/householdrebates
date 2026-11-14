import type Database from 'better-sqlite3';
import { renderAlertConsentSnapshot } from './consent.js';
import { generateAlertToken, hashAlertEmail, hashAlertToken } from './db.js';

export type UnsubscribeMethod = 'one-click' | 'link' | 'reply' | 'cli';

export type SubscribeOutcome =
  | { action: 'suppressed' | 'already_confirmed' | 'duplicate_pending' }
  | {
      action: 'created_pending';
      subscriberId: number;
      rawConfirmToken: string;
      expiresAtUtc: string;
    };

export interface AlertRecipient {
  id: number;
  email: string;
}

export interface AlertsStats {
  byStatus: {
    pending: number;
    confirmed: number;
    unsubscribed: number;
    erased: number;
    expired: number;
  };
  suppressedHashes: number;
  completedSends: number;
}

export interface AlertsPurgeResult {
  expiredPendingPurged: number;
  ipHashesNulled: number;
  consentsDeleted: number;
}

export class AlertsRepository {
  constructor(
    private readonly db: Database.Database,
    private readonly hashSecret: string,
  ) {}

  incrementHoneypot(now: Date = new Date()): void {
    const dayKey = `alerts_honeypot:${now.toISOString().slice(0, 10)}`;
    this.db
      .prepare(
        `INSERT INTO rate_counters (key, window_start_utc, count)
         VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET count = count + 1`,
      )
      .run(dayKey, now.toISOString());
  }

  checkAndIncrementIpLimit(
    ipHash: string,
    maxPerHour: number,
    now: Date = new Date(),
  ): boolean {
    const hourKey = `alerts_ip:${ipHash}:${now.toISOString().slice(0, 13)}`;
    const tx = this.db.transaction(() => {
      const existing = this.db
        .prepare('SELECT count FROM rate_counters WHERE key = ?')
        .get(hourKey) as { count: number } | undefined;
      if (existing && existing.count >= maxPerHour) {
        return false;
      }
      this.db
        .prepare(
          `INSERT INTO rate_counters (key, window_start_utc, count)
           VALUES (?, ?, 1)
           ON CONFLICT(key) DO UPDATE SET count = count + 1`,
        )
        .run(hourKey, now.toISOString());
      return true;
    });
    return tx();
  }

  subscribePending(input: {
    email: string;
    sourcePage: string;
    ipHash: string;
    userAgent: string;
    consentVersion: string;
    privacyVersion: string;
    confirmTtlHours: number;
    now?: Date;
  }): SubscribeOutcome {
    const now = input.now ?? new Date();
    const nowUtc = now.toISOString();
    const cleanEmail = input.email.trim().toLowerCase();
    const emailHash = hashAlertEmail(cleanEmail, this.hashSecret);
    const consentRendered = renderAlertConsentSnapshot(input.consentVersion);
    const expiresAtUtc = new Date(
      now.getTime() + input.confirmTtlHours * 60 * 60 * 1000,
    ).toISOString();

    const tx = this.db.transaction((): SubscribeOutcome => {
      const suppressed = this.db
        .prepare('SELECT email_hash FROM alert_suppression WHERE email_hash = ?')
        .get(emailHash) as { email_hash: string } | undefined;
      if (suppressed) {
        return { action: 'suppressed' };
      }

      const existing = this.db
        .prepare('SELECT id, status FROM alert_subscribers WHERE email_hash = ?')
        .get(emailHash) as { id: number; status: string } | undefined;

      if (existing) {
        if (existing.status === 'confirmed') {
          return { action: 'already_confirmed' };
        }
        if (existing.status === 'unsubscribed' || existing.status === 'erased') {
          return { action: 'suppressed' };
        }
        if (existing.status === 'pending') {
          const activeToken = this.db
            .prepare(
              `SELECT token_hash FROM alert_tokens
               WHERE subscriber_id = ?
                 AND kind = 'confirm'
                 AND used_at_utc IS NULL
                 AND expires_at_utc > ?`,
            )
            .get(existing.id, nowUtc) as { token_hash: string } | undefined;
          if (activeToken) {
            return { action: 'duplicate_pending' };
          }
        }

        // Previously expired unconfirmed row (never confirmed and not suppressed): refresh pending state
        const { rawToken, tokenHash } = generateAlertToken();
        this.db
          .prepare(
            `UPDATE alert_subscribers
             SET email = ?,
                 status = 'pending',
                 created_at_utc = ?,
                 source_page = ?,
                 ip_hash = ?,
                 user_agent = ?
             WHERE id = ?`,
          )
          .run(cleanEmail, nowUtc, input.sourcePage, input.ipHash, input.userAgent, existing.id);

        this.db
          .prepare(
            `INSERT INTO alert_consents (
               subscriber_id, version, text_sha256, text_snapshot, privacy_version, given_at_utc
             ) VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            existing.id,
            consentRendered.version,
            consentRendered.textSha256,
            consentRendered.textSnapshot,
            input.privacyVersion,
            nowUtc,
          );

        this.db
          .prepare(
            `INSERT INTO alert_tokens (token_hash, subscriber_id, kind, expires_at_utc, used_at_utc)
             VALUES (?, ?, 'confirm', ?, NULL)`,
          )
          .run(tokenHash, existing.id, expiresAtUtc);

        return {
          action: 'created_pending',
          subscriberId: existing.id,
          rawConfirmToken: rawToken,
          expiresAtUtc,
        };
      }

      const { rawToken, tokenHash } = generateAlertToken();
      const subRes = this.db
        .prepare(
          `INSERT INTO alert_subscribers (
             email, email_hash, status, topics, created_at_utc, source_page, ip_hash, user_agent
           ) VALUES (?, ?, 'pending', 'rule-changes', ?, ?, ?, ?)`,
        )
        .run(cleanEmail, emailHash, nowUtc, input.sourcePage, input.ipHash, input.userAgent);

      const subscriberId = Number(subRes.lastInsertRowid);

      this.db
        .prepare(
          `INSERT INTO alert_consents (
             subscriber_id, version, text_sha256, text_snapshot, privacy_version, given_at_utc
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          subscriberId,
          consentRendered.version,
          consentRendered.textSha256,
          consentRendered.textSnapshot,
          input.privacyVersion,
          nowUtc,
        );

      this.db
        .prepare(
          `INSERT INTO alert_tokens (token_hash, subscriber_id, kind, expires_at_utc, used_at_utc)
           VALUES (?, ?, 'confirm', ?, NULL)`,
        )
        .run(tokenHash, subscriberId, expiresAtUtc);

      return {
        action: 'created_pending',
        subscriberId,
        rawConfirmToken: rawToken,
        expiresAtUtc,
      };
    });

    return tx();
  }

  confirmByToken(
    rawToken: string,
    now: Date = new Date(),
  ): { outcome: 'confirmed' | 'expired' | 'invalid' } {
    if (!rawToken || !rawToken.trim()) {
      return { outcome: 'invalid' };
    }
    const tokenHash = hashAlertToken(rawToken);
    const nowUtc = now.toISOString();

    const tx = this.db.transaction((): { outcome: 'confirmed' | 'expired' | 'invalid' } => {
      const tok = this.db
        .prepare(
          `SELECT token_hash, subscriber_id, kind, expires_at_utc, used_at_utc
           FROM alert_tokens
           WHERE token_hash = ?`,
        )
        .get(tokenHash) as
        | {
            token_hash: string;
            subscriber_id: number;
            kind: string;
            expires_at_utc: string | null;
            used_at_utc: string | null;
          }
        | undefined;

      if (!tok || tok.kind !== 'confirm') {
        return { outcome: 'invalid' };
      }

      // One-time token: re-used confirm tokens are rejected
      if (tok.used_at_utc !== null) {
        return { outcome: 'invalid' };
      }

      if (!tok.expires_at_utc || tok.expires_at_utc <= nowUtc) {
        this.db
          .prepare(
            `UPDATE alert_subscribers
             SET status = 'expired'
             WHERE id = ? AND status = 'pending'`,
          )
          .run(tok.subscriber_id);
        return { outcome: 'expired' };
      }

      const sub = this.db
        .prepare('SELECT id, email_hash, status FROM alert_subscribers WHERE id = ?')
        .get(tok.subscriber_id) as
        | { id: number; email_hash: string; status: string }
        | undefined;

      if (!sub || sub.status === 'unsubscribed' || sub.status === 'erased') {
        return { outcome: 'invalid' };
      }

      const suppressed = this.db
        .prepare('SELECT email_hash FROM alert_suppression WHERE email_hash = ?')
        .get(sub.email_hash) as { email_hash: string } | undefined;
      if (suppressed) {
        return { outcome: 'invalid' };
      }

      this.db
        .prepare('UPDATE alert_tokens SET used_at_utc = ? WHERE token_hash = ?')
        .run(nowUtc, tokenHash);

      this.db
        .prepare(
          `UPDATE alert_subscribers
           SET status = 'confirmed', confirmed_at_utc = ?
           WHERE id = ?`,
        )
        .run(nowUtc, sub.id);

      return { outcome: 'confirmed' };
    });

    return tx();
  }

  issueUnsubscribeToken(subscriberId: number): string {
    const { rawToken, tokenHash } = generateAlertToken();
    this.db
      .prepare(
        `INSERT INTO alert_tokens (token_hash, subscriber_id, kind, expires_at_utc, used_at_utc)
         VALUES (?, ?, 'unsubscribe', NULL, NULL)`,
      )
      .run(tokenHash, subscriberId);
    return rawToken;
  }

  verifyUnsubscribeToken(rawToken: string): boolean {
    if (!rawToken || !rawToken.trim()) {
      return false;
    }
    const tokenHash = hashAlertToken(rawToken);
    const row = this.db
      .prepare(
        `SELECT token_hash FROM alert_tokens
         WHERE token_hash = ? AND kind = 'unsubscribe'`,
      )
      .get(tokenHash) as { token_hash: string } | undefined;
    return Boolean(row);
  }

  unsubscribeByToken(
    rawToken: string,
    method: 'link' | 'one-click',
    now: Date = new Date(),
  ): { ok: boolean } {
    if (!rawToken || !rawToken.trim()) {
      return { ok: false };
    }
    const tokenHash = hashAlertToken(rawToken);
    const nowUtc = now.toISOString();

    const tx = this.db.transaction((): { ok: boolean } => {
      const tok = this.db
        .prepare(
          `SELECT token_hash, subscriber_id, kind
           FROM alert_tokens
           WHERE token_hash = ?`,
        )
        .get(tokenHash) as
        | { token_hash: string; subscriber_id: number; kind: string }
        | undefined;

      if (!tok || tok.kind !== 'unsubscribe') {
        return { ok: false };
      }

      const sub = this.db
        .prepare('SELECT id, email_hash, status FROM alert_subscribers WHERE id = ?')
        .get(tok.subscriber_id) as
        | { id: number; email_hash: string; status: string }
        | undefined;

      if (!sub) {
        return { ok: false };
      }

      this.db
        .prepare(
          'UPDATE alert_tokens SET used_at_utc = COALESCE(used_at_utc, ?) WHERE token_hash = ?',
        )
        .run(nowUtc, tokenHash);

      if (sub.status !== 'erased') {
        this.db
          .prepare(
            `UPDATE alert_subscribers
             SET status = 'unsubscribed',
                 unsubscribed_at_utc = COALESCE(unsubscribed_at_utc, ?),
                 unsubscribe_method = COALESCE(unsubscribe_method, ?)
             WHERE id = ?`,
          )
          .run(nowUtc, method, sub.id);
      }

      this.db
        .prepare(
          `INSERT OR IGNORE INTO alert_suppression (email_hash, reason, added_at_utc)
           VALUES (?, ?, ?)`,
        )
        .run(sub.email_hash, `unsubscribed:${method}`, nowUtc);

      return { ok: true };
    });

    return tx();
  }

  unsubscribeByEmail(
    email: string,
    method: 'cli' | 'reply' = 'cli',
    now: Date = new Date(),
  ): { suppressed: true; subscriberUpdated: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const emailHash = hashAlertEmail(cleanEmail, this.hashSecret);
    const nowUtc = now.toISOString();

    const tx = this.db.transaction(() => {
      const sub = this.db
        .prepare('SELECT id, status FROM alert_subscribers WHERE email_hash = ?')
        .get(emailHash) as { id: number; status: string } | undefined;

      let subscriberUpdated = false;
      if (sub && sub.status !== 'erased') {
        this.db
          .prepare(
            `UPDATE alert_subscribers
             SET status = 'unsubscribed',
                 unsubscribed_at_utc = COALESCE(unsubscribed_at_utc, ?),
                 unsubscribe_method = ?
             WHERE id = ?`,
          )
          .run(nowUtc, method, sub.id);
        subscriberUpdated = true;
      }

      this.db
        .prepare(
          `INSERT OR IGNORE INTO alert_suppression (email_hash, reason, added_at_utc)
           VALUES (?, ?, ?)`,
        )
        .run(emailHash, `unsubscribed:${method}`, nowUtc);

      return { suppressed: true as const, subscriberUpdated };
    });

    return tx();
  }

  listConfirmedUnsuppressedRecipients(): AlertRecipient[] {
    return this.db
      .prepare(
        `SELECT s.id, s.email
         FROM alert_subscribers s
         LEFT JOIN alert_suppression sup ON sup.email_hash = s.email_hash
         WHERE s.status = 'confirmed'
           AND s.email IS NOT NULL
           AND sup.email_hash IS NULL
         ORDER BY s.id ASC`,
      )
      .all() as AlertRecipient[];
  }

  recordAlertSend(input: {
    draftSha256: string;
    subject: string;
    approvedBy: string;
    sentAtUtc: string;
    recipients: number;
  }): number {
    const res = this.db
      .prepare(
        `INSERT INTO alert_sends (draft_sha256, subject, approved_by, sent_at_utc, recipients)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        input.draftSha256,
        input.subject,
        input.approvedBy,
        input.sentAtUtc,
        input.recipients,
      );
    return Number(res.lastInsertRowid);
  }

  exportPersonalData(email: string, now: Date = new Date()): Record<string, unknown> {
    const cleanEmail = email.trim().toLowerCase();
    const emailHash = hashAlertEmail(cleanEmail, this.hashSecret);

    const subscriber = this.db
      .prepare('SELECT * FROM alert_subscribers WHERE email_hash = ?')
      .get(emailHash) as Record<string, unknown> | undefined;

    const suppression = this.db
      .prepare('SELECT reason, added_at_utc FROM alert_suppression WHERE email_hash = ?')
      .get(emailHash) as { reason: string; added_at_utc: string } | undefined;

    const consents = subscriber
      ? this.db
          .prepare('SELECT * FROM alert_consents WHERE subscriber_id = ? ORDER BY id ASC')
          .all((subscriber as { id: number }).id)
      : [];

    const tokens = subscriber
      ? this.db
          .prepare(
            `SELECT kind, expires_at_utc, used_at_utc
             FROM alert_tokens
             WHERE subscriber_id = ?`,
          )
          .all((subscriber as { id: number }).id)
      : [];

    return {
      exportedAtUtc: now.toISOString(),
      email: cleanEmail,
      subscriber: subscriber ?? null,
      consents,
      tokens,
      suppressed: Boolean(suppression),
      suppression: suppression ?? null,
    };
  }

  erasePersonalData(
    email: string,
    now: Date = new Date(),
  ): { erasedCount: number; suppressed: true } {
    const cleanEmail = email.trim().toLowerCase();
    const emailHash = hashAlertEmail(cleanEmail, this.hashSecret);
    const nowUtc = now.toISOString();

    const tx = this.db.transaction(() => {
      const res = this.db
        .prepare(
          `UPDATE alert_subscribers
           SET email = NULL,
               ip_hash = NULL,
               user_agent = NULL,
               status = 'erased',
               unsubscribed_at_utc = COALESCE(unsubscribed_at_utc, ?),
               unsubscribe_method = COALESCE(unsubscribe_method, 'cli')
           WHERE email_hash = ?`,
        )
        .run(nowUtc, emailHash);

      this.db
        .prepare(
          `INSERT OR IGNORE INTO alert_suppression (email_hash, reason, added_at_utc)
           VALUES (?, 'erased', ?)`,
        )
        .run(emailHash, nowUtc);

      return { erasedCount: res.changes, suppressed: true as const };
    });

    return tx();
  }

  getStats(): AlertsStats {
    const rows = this.db
      .prepare('SELECT status, COUNT(*) as cnt FROM alert_subscribers GROUP BY status')
      .all() as { status: string; cnt: number }[];

    const byStatus = {
      pending: 0,
      confirmed: 0,
      unsubscribed: 0,
      erased: 0,
      expired: 0,
    };
    for (const r of rows) {
      if (r.status in byStatus) {
        byStatus[r.status as keyof typeof byStatus] = r.cnt;
      }
    }

    const supRow = this.db
      .prepare('SELECT COUNT(*) as cnt FROM alert_suppression')
      .get() as { cnt: number };
    const sendsRow = this.db
      .prepare('SELECT COUNT(*) as cnt FROM alert_sends')
      .get() as { cnt: number };

    return {
      byStatus,
      suppressedHashes: supRow.cnt,
      completedSends: sendsRow.cnt,
    };
  }

  runRetentionPurge(confirmTtlHours: number, now: Date = new Date()): AlertsPurgeResult {
    const minusTtl = new Date(
      now.getTime() - confirmTtlHours * 60 * 60 * 1000,
    ).toISOString();
    const minus30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const minus24m = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString();

    const tx = this.db.transaction((): AlertsPurgeResult => {
      // 1. Purge unconfirmed (pending / expired) subscribers past the confirmation TTL
      const staleUnconfirmed = this.db
        .prepare(
          `SELECT id FROM alert_subscribers
           WHERE status IN ('pending', 'expired') AND created_at_utc < ?`,
        )
        .all(minusTtl) as { id: number }[];

      for (const s of staleUnconfirmed) {
        this.db.prepare('DELETE FROM alert_tokens WHERE subscriber_id = ?').run(s.id);
        this.db.prepare('DELETE FROM alert_consents WHERE subscriber_id = ?').run(s.id);
        this.db.prepare('DELETE FROM alert_subscribers WHERE id = ?').run(s.id);
      }

      // Also clean up expired one-time confirm tokens on remaining rows
      this.db
        .prepare(
          `DELETE FROM alert_tokens
           WHERE kind = 'confirm' AND expires_at_utc IS NOT NULL AND expires_at_utc < ?`,
        )
        .run(minusTtl);

      // 2. Null ip_hash and user_agent older than 30 days
      const ipRes = this.db
        .prepare(
          `UPDATE alert_subscribers
           SET ip_hash = NULL, user_agent = NULL
           WHERE created_at_utc < ? AND (ip_hash IS NOT NULL OR user_agent IS NOT NULL)`,
        )
        .run(minus30d);

      // 3. Delete consent snapshots 24 months after unsubscribe (confirmed kept until unsubscribe; suppression hashes kept indefinitely)
      const consentRes = this.db
        .prepare(
          `DELETE FROM alert_consents
           WHERE subscriber_id IN (
             SELECT id FROM alert_subscribers
             WHERE status IN ('unsubscribed', 'erased')
               AND unsubscribed_at_utc IS NOT NULL
               AND unsubscribed_at_utc < ?
           )`,
        )
        .run(minus24m);

      return {
        expiredPendingPurged: staleUnconfirmed.length,
        ipHashesNulled: ipRes.changes,
        consentsDeleted: consentRes.changes,
      };
    });

    return tx();
  }
}
