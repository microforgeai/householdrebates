# Prompt 08 — Lead form and Node lead handler (form stays OFF)

> Local only. The API is built and tested on your machine. It is **not** deployed here, and the form stays disabled (`LEADS_ENABLED=false`, `PUBLIC_LEADS_ENABLED=false`) until prompt 14, after a signed installer agreement exists.

---

## Context

Household Rebates passes quote requests to installers for a fee. Under the VEU code of conduct, lead generation is a regulated action; cold calls and doorknocking are banned unless the person gave **express prior consent**, and the ESC says a consent record should show the person's identity, who may contact them, for which activity, by phone and/or visit, when consent expires (3 months by default) and when it was withdrawn; it recommends naming the installation partner in the consent form (ESC bans FAQ Q14–Q18). Passing details to someone else for a fee is "trading in personal information" (OAIC), so we get express consent naming the recipient and treat the Australian Privacy Principles as applying. Full design: `docs/solution-design.md` §7 (fields, consent text, flow, SQLite schema, retention, security). Recommended stack: Node + Fastify + better-sqlite3 + nodemailer (one toolchain with the site; reasons in §7.1).

## Rules

- No real personal data in tests or fixtures; use `example.com` / `example.org` addresses and `0400 000 000`-style numbers.
- No secrets in Git or chat. `.env` local only; `.env.example` with placeholders.
- No marketing email code path. Transactional emails only.

## Goal

`api/` implements `POST /leads`, `GET /health`, CLIs (`deliver`, `withdraw`, `export`, `erase`, `purge`, `status`, `mail-test`), SQLite migrations, two mail drivers (SMTP and Microsoft Graph), and full tests. `site/` gets `LeadForm.astro` + `lead-form.client.ts`, `/thanks/`, `/form-error/`, and a shared consent-wording module.

## Steps

### A. Shared consent wording

1. `site/src/data/consent/vic-v1.ts` exports `CONSENT_VERSIONS = { 'vic-rcac-v1': {...}, 'vic-hotwater-v1': {...} }`, each a function `render({ installers, channels })` → exact plain-text string, using the draft in solution-design §7.3 (installer trading name + accredited provider name, fee disclosure, not-government line, 3-month expiry, how to withdraw, privacy link). Also export `COLLECTION_NOTICE_V1`.
2. `api/src/consent.ts` imports the same file via a relative path or a tiny `packages/shared` workspace (pick one and document it). `site/scripts/check-consent-hash.mjs` asserts the site and API produce byte-identical text for a fixture.

### B. API

3. `config.ts`: parse env with defaults from `.env.example`; **fail closed**: if `LEADS_ENABLED=true` then require ≥ 1 `active` installer in `installers.json` with `agreementSignedOn` + `accreditedProvider`, plus `PRIVACY_POLICY_VERSION`, `CONSENT_REVIEWED_BY`, mail settings; otherwise exit(1) with a clear message.
4. `db.ts` + `migrations/001_init.sql` — schema exactly as solution-design §7.5; run migrations at start inside a transaction; `PRAGMA journal_mode=WAL; foreign_keys=ON; busy_timeout=5000`.
5. `schema.ts` — validation per solution-design §7.2 (enums, lengths, AU phone → E.164, postcode `^3\d{3}$`, `contactPrefs` ≥ 1, `consent === 'yes'`, `workStarted` not "installed"). Accept `application/x-www-form-urlencoded` (register `@fastify/formbody`) and JSON.
6. `antispam.ts` — honeypot `website`; `formToken` = `base64url(ts).HMAC(ts)` issued by `GET /form-token` (JSON `{token}`, `Cache-Control: no-store`) and fetched by the form script on load; checked as min 4 s, max 2 h old. A plain-HTML post with **no** token (JS off) is accepted only if the honeypot is empty and the rate limits pass, and is stored with `no_js = 1` so Guri can spot abuse (add `no_js INTEGER NOT NULL DEFAULT 0` to `leads`); a token that is present but invalid is always rejected; IP hash `HMAC-SHA256(ip, IP_HASH_SECRET)`; counters in `rate_counters` (≤ 3 accepted per ip_hash per 24 h; ≤ 2 per email per 30 days).
7. `routing.ts` — `route(postcode, activity)` → active installers covering it (max `MAX_INSTALLERS_PER_LEAD`, default 1). Request must carry the same `recipientIds` the page showed, else 409.
8. `server.ts` — routes per solution-design §7.4 flow, Origin check against `SITE_ORIGIN`, `bodyLimit 8192`, `trustProxy '127.0.0.1'`, generic errors, 303 redirects for form posts and JSON for `Accept: application/json`. `GET /health` → `{ ok, db: 'ok', leadsEnabled }`. `GET /routing?postcode=&activity=` → `{ installers: [{id, tradingName, accreditedProvider}] }` (no emails) so the form can render names before consent.
9. `mail/` — `send()` interface; `smtp.ts` (nodemailer, TLS required); `graph.ts` (client-credentials token from `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`, scope `https://graph.microsoft.com/.default`, then `POST https://graph.microsoft.com/v1.0/users/{sender}/sendMail`); `templates.ts` — internal notice (no names in subject), confirmation to the person, installer delivery (lead + consent snapshot + "this consent expires on …; do not contact by channels not ticked; do not on-sell"). All templates include "Agenor Services Pty Ltd, ABN …, contact …".
10. CLIs in `src/cli/` (run with `node dist/cli/<name>.js`, wrapped as npm scripts):
    - `deliver <ref>` — checks consent valid, not withdrawn/expired, status `new`; sends to each recipient; writes `deliveries`; status `delivered`.
    - `withdraw --email|--ref` — sets `withdrawn_at_utc`, emails each installer already sent to, status `withdrawn`.
    - `export --email` — JSON of everything held (APP 12 request).
    - `erase --email` — nulls personal fields, status `erased`, keeps the minimum audit row.
    - `purge` — retention per solution-design §7.8 (12 months PII; 30 days ip_hash/UA; consent 24 months after expiry/withdrawal).
    - `status` — counts by status/activity for the last 7/30 days.
    - `mail-test --to <addr> [--template notice|confirmation|installer]` — sends a test email (fake data) through the configured driver.
    - `outcome <ref> <installerId> accepted|dud|quoted|won|lost [--fee-cents N]`.

### C. Site form

11. `LeadForm.astro` (+ `lead-form.client.ts`): fields per solution-design §7.2, labels and errors accessible; consent box unticked; channel ticks separate; renders installer names from `/api/routing` once a valid postcode is entered (until then the submit stays disabled and the consent text says "Enter your postcode to see who would contact you"). Plain HTML `action="/api/leads" method="post"` as no-JS fallback: at build time the consent text and hidden `recipientIds` list the active installers for that activity (and that area, on area pages); if the API routes the postcode to a different set it returns 409 and `/form-error/?reason=stale` asks the person to turn on JavaScript or pick from the named installers. Consent must never be submitted without names on screen. Prefills from `sessionStorage['hr-checker']`.
12. When `PUBLIC_LEADS_ENABLED !== 'true'` the component renders `FormClosedNotice` instead — no inputs at all.
13. `thanks.astro` (shows ref from query, what happens next, how to withdraw), `form-error.astro` (reasons: closed, invalid, limit, stale).

### D. Tests (vitest + `fastify.inject`)

14. Must cover: health; disabled → 503; honeypot → 303 and nothing stored; token too fast / expired → 400; each validation rule → 422; Origin mismatch → 403; rate limits → 429; routing mismatch → 409; happy path stores lead + consent (version, sha256, snapshot, expiry = +3 months) + one `consent_scopes` row per installer × ticked channel; mail failure keeps the lead and logs an event; `deliver` refuses withdrawn and expired consent; `withdraw` notifies installers; `erase` nulls PII; `purge` respects each period (use a fake clock); config refuses `LEADS_ENABLED=true` without a signed installer; consent hash identical between site and API.
15. Local end-to-end: run the API with a **test** installer in a temporary `installers.json` (agreement date set, clearly named "TEST INSTALLER — not real") and a local SMTP catcher (`npx -y maildev` or `mailpit`), `PUBLIC_LEADS_ENABLED=true npm run dev -w site`, submit once, see three emails in the catcher. Then restore the empty `installers.json` and both flags to false.

## Acceptance checks

```bash
npm run check -w api            # expect: tsc clean; vitest ≥ 30 tests passing, 0 failing
npm run build -w api            # expect: api/dist/server.js and api/dist/cli/*.js
node site/scripts/check-consent-hash.mjs    # expect: "consent hash match: vic-rcac-v1, vic-hotwater-v1"
cat api/installers.json         # expect: []
grep -E "^(LEADS_ENABLED|AUTO_DELIVER)=" api/.env.example     # expect: both =false
LEADS_ENABLED=true node api/dist/server.js; echo "exit=$?"
# expect: error "refusing to start: no active installer with a signed agreement" and exit=1
PUBLIC_LEADS_ENABLED=false npm run build -w site && grep -c 'name="email"' site/dist/index.html   # expect: 0 (form closed → no inputs)
sqlite3 /tmp/hr-test.db ".schema consents" | grep -c expires_at_utc    # (after the local e2e) expect: 1
```

## What to test

- Submit with JS off (plain HTML post) and with JS on.
- Tab through the form; errors are announced; the consent text names the test installer and its accredited provider.
- Read the three caught emails: correct sender identity, no names in the internal subject, withdrawal instructions present.

## STOP

Show Guri the consent text as rendered, the three test emails, and the test summary. He forwards the consent text, collection notice and email templates to the lawyer in prompt 12. Nothing is deployed.
