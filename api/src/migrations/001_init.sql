PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at_utc TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS leads (
  id               INTEGER PRIMARY KEY,
  ref              TEXT NOT NULL UNIQUE,
  created_at_utc   TEXT NOT NULL,
  state            TEXT NOT NULL DEFAULT 'vic',
  activity         TEXT NOT NULL CHECK (activity IN ('rcac','hotwater')),
  current_system   TEXT NOT NULL,
  first_name       TEXT,
  last_name        TEXT,
  email            TEXT,
  phone_e164       TEXT,
  postcode         TEXT NOT NULL,
  ownership        TEXT NOT NULL,
  building_over_2y TEXT NOT NULL,
  work_started     TEXT NOT NULL,
  product_bought   INTEGER NOT NULL DEFAULT 0,
  no_js            INTEGER NOT NULL DEFAULT 0,
  message          TEXT,
  how_heard        TEXT,
  page_url         TEXT NOT NULL,
  utm_json         TEXT,
  ip_hash          TEXT,
  user_agent       TEXT,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','delivered','dud','withdrawn','erased','purged')),
  purged_at_utc    TEXT
);

CREATE TABLE IF NOT EXISTS consents (
  id                 INTEGER PRIMARY KEY,
  lead_id            INTEGER NOT NULL REFERENCES leads(id),
  version            TEXT NOT NULL,
  text_sha256        TEXT NOT NULL,
  text_snapshot      TEXT NOT NULL,
  privacy_version    TEXT NOT NULL,
  given_at_utc       TEXT NOT NULL,
  expires_at_utc     TEXT NOT NULL,
  withdrawn_at_utc   TEXT,
  withdrawn_via      TEXT
);

CREATE TABLE IF NOT EXISTS consent_scopes (
  consent_id          INTEGER NOT NULL REFERENCES consents(id),
  installer_id        TEXT NOT NULL,
  accredited_provider TEXT NOT NULL,
  channel             TEXT NOT NULL CHECK (channel IN ('phone','email','site_visit')),
  activity            TEXT NOT NULL,
  PRIMARY KEY (consent_id, installer_id, channel)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id              INTEGER PRIMARY KEY,
  lead_id         INTEGER NOT NULL REFERENCES leads(id),
  installer_id    TEXT NOT NULL,
  sent_at_utc     TEXT NOT NULL,
  message_id      TEXT,
  outcome         TEXT CHECK (outcome IN ('accepted','dud','no_response','quoted','won','lost')),
  fee_cents       INTEGER,
  updated_at_utc  TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY,
  at_utc    TEXT NOT NULL,
  lead_id   INTEGER,
  actor     TEXT NOT NULL,
  action    TEXT NOT NULL,
  detail    TEXT
);

CREATE TABLE IF NOT EXISTS rate_counters (key TEXT PRIMARY KEY, window_start_utc TEXT NOT NULL, count INTEGER NOT NULL);

CREATE INDEX IF NOT EXISTS idx_leads_created   ON leads(created_at_utc);
CREATE INDEX IF NOT EXISTS idx_leads_email     ON leads(email);
CREATE INDEX IF NOT EXISTS idx_consents_lead   ON consents(lead_id);
CREATE INDEX IF NOT EXISTS idx_consents_expiry ON consents(expires_at_utc);
