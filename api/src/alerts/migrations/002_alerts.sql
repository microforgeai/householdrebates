PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_subscribers (
  id INTEGER PRIMARY KEY,
  email TEXT,                                   -- lower-cased; nulled on erase
  email_hash TEXT NOT NULL UNIQUE,              -- HMAC-SHA256(email, ALERTS_HASH_SECRET)
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','unsubscribed','erased','expired')),
  topics TEXT NOT NULL DEFAULT 'rule-changes',  -- one purpose only in v1
  created_at_utc TEXT NOT NULL,
  confirmed_at_utc TEXT,
  unsubscribed_at_utc TEXT,
  unsubscribe_method TEXT,                      -- one-click | link | reply | cli
  source_page TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS alert_consents (
  id INTEGER PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES alert_subscribers(id),
  version TEXT NOT NULL,
  text_sha256 TEXT NOT NULL,
  text_snapshot TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  given_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_tokens (       -- confirm and unsubscribe tokens
  token_hash TEXT PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES alert_subscribers(id),
  kind TEXT NOT NULL CHECK (kind IN ('confirm','unsubscribe')),
  expires_at_utc TEXT,
  used_at_utc TEXT
);

CREATE TABLE IF NOT EXISTS alert_sends (
  id INTEGER PRIMARY KEY,
  draft_sha256 TEXT NOT NULL,
  subject TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  sent_at_utc TEXT NOT NULL,
  recipients INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_suppression (
  email_hash TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  added_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_counters (
  key TEXT PRIMARY KEY,
  window_start_utc TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_subscribers_status ON alert_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_alert_subscribers_created ON alert_subscribers(created_at_utc);
CREATE INDEX IF NOT EXISTS idx_alert_consents_subscriber ON alert_consents(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_alert_tokens_subscriber_kind ON alert_tokens(subscriber_id, kind);
