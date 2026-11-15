# Lawyer Review Addendum — Rule-Change Email Alerts (`alerts-v2`)

**Client:** Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC  
**Contact:** Gurinder Singh (`hello@householdrebates.com.au` / `privacy@householdrebates.com.au`, alias of `hello@householdrebates.com.au`)  
**Status:** Draft for legal review — all runtime and build flags (`ALERTS_ENABLED`, `ALERTS_SEND_ENABLED`, `PUBLIC_ALERTS_ENABLED`) remain **`false`**, and go-live is technically blocked in code until `ALERTS_REVIEWED_BY` is signed and set after legal review. See also `docs/legal/legal-review-2026-11-15.md`.

---

## 1. Product Scope & Strict Separation from Quote Enquiries

This feature is a standalone **rule-change email alert list**, completely separate from the VEU installer quote form:

- **Single purpose:** Notifying subscribers when legislated or official Victorian / federal household energy upgrade rules change (including after the 28 November 2026 Victorian state election and around the changes currently scheduled for 1 January, 1 March, and 1 July 2027).
- **Fields collected:** Email address only (plus unticked consent checkbox, consent version, source page path, and temporary anti-abuse `ip_hash` / `user_agent`).
- **No sharing with installers:** Alert subscriber emails are stored in a dedicated SQLite database (`alerts.sqlite`) separate from the `leads` database, are never accessible to installer delivery code (`api/src/cli/deliver.ts`), and are never disclosed to installers, accredited providers, or commercial sponsors.
- **Double opt-in:** Submitting the form stores `status = 'pending'` and sends one transactional confirmation email (`72`-hour one-time link). No rule-change alert email can be sent until the recipient clicks the confirmation link (`status = 'confirmed'`).

---

## 2. Consent Wording Draft (`alerts-v2`)

Displayed next to an **unticked** checkbox (`required`, never pre-selected). Exact wording and its SHA-256 digest (`site/src/data/consent/alerts-v1.ts`, `api/src/alerts/consent.ts`, and `site/src/components/AlertSignupIsland.astro`, verified by `check-consent-hash.mjs`) are snapshotted in `alert_consents` with `privacy_version` and UTC timestamp:

> ☐ Email me when the rules for Victorian and federal home energy rebates change, including after the 28 November 2026 state election and around the changes currently scheduled for 1 January, 1 March and 1 July 2027. Household Rebates will email me only about rule changes, and I can unsubscribe at any time from any email.

---

## 3. APP 5 Collection Notice Draft (Displayed Directly Above Submit Button)

The sign-up component (`site/src/components/AlertSignupIsland.astro`) displays this APP 5 collection notice immediately above the submit button. Placeholders resolve at build time via `resolveAlertsApp5Notice` (`site/src/lib/alerts.ts`) from `SITE.publisher.abn`, `SITE.publisher.privacyEmail`, `PUBLIC_SERVER_COUNTRY` (default `"Malaysia"`), `PUBLIC_ALERTS_PROVIDER` (default `"Hostinger Mail (Hostinger International Ltd)"`), and `PUBLIC_ALERTS_OVERSEAS_NOTE` (default `"; it stores mail in France and Germany"`; use `"none"` if a chosen provider stores all data in Australia — vague `"outside Australia"` is rejected at build time):

> Household Rebates (Agenor Services Pty Ltd, ABN `29 644 447 263`, `privacy@householdrebates.com.au`) collects your email address only to send rule-change alerts you've asked for. If you don't give it, we can't send them. Your email address is stored on our server in Malaysia. We don't share it with installers or anyone else, except our email service provider, Hostinger Mail (Hostinger International Ltd), which sends the emails for us; it stores mail in France and Germany. Our [privacy policy](/privacy/) explains how to access or correct your details and how to complain. We're not a government website.

On the Eligibility Checker result screen (`/victoria/eligibility-checker/`), the component also displays directly beneath the form:

> This only signs you up for rule-change emails. Your checker answers aren't sent.

Approved placements (per Guri's Prompt 29b and Prompt 30 decisions): the Eligibility Checker result screen (below result lines and CTAs), `/victoria/gas-to-electric-hot-water-2027/` (after the answer block and election-watch notice), and `/victoria/battery-rebate/` (wired in Prompt 30 after the 1 January 2027 section). There is no site-wide footer placement, no pop-up, no interstitial, and no pre-ticked checkbox.

---

## 4. Spam Act 2003 Mechanics (Identification, Unsubscribe & Suppression)

1. **Express, verifiable consent:** Unticked `alerts-v2` checkbox + double opt-in confirmation link (`72`-hour TTL). If an address is unconfirmed when the `72`-hour TTL expires, no further mail is sent and the unconfirmed record is purged.
2. **Accurate sender identification on every email** (`api/src/mail/templates/alerts-sender.ts`, build/send fails if any placeholder is unresolved):
   > Household Rebates is run by Agenor Services Pty Ltd, ABN `<<ABN>>`, `<<postal or contact address>>`, `<<contact email>>`.
   - **Important:** When configuring `ALERTS_SENDER_ADDRESS` (default `<<ALERTS_SENDER_ADDRESS>>`, blocked until set), use a **PO box or Agenor's registered office**, never a private family home address. Sender details must stay accurate for at least 30 days after each send.
   - Every email also carries:
   > We're not a government website and we are not affiliated with, endorsed by, or representing the Victorian Government, Energy Victoria, Solar Victoria, the Department of Energy, Environment and Climate Action (DEECA), the Essential Services Commission (ESC), the Australian Government, the Clean Energy Regulator or any council.
3. **Functional unsubscribe (>= 30 days; honoured immediately or within <= 5 business days):**
   - **Clear body link:** Displayed in normal-size body text (not `<small>`): `"Don't want these emails? Unsubscribe in one click."`
   - **Web link (`GET` + `POST /api/alerts/unsubscribe?t=`):** Renders a `noindex` one-button page (no login, no questions, safe against email-security link scanners); `POST` immediately sets `status = 'unsubscribed'`, invalidates any unused confirm tokens, and adds the HMAC email hash to `alert_suppression`.
   - **RFC 8058 One-Click (`POST /api/alerts/unsubscribe-one-click`):** Paired with `List-Unsubscribe` (`mailto:` and `https:`) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers for native one-click unsubscription in Gmail, Outlook, and Apple Mail; honoured immediately.
   - **Reply / email requests (`npm run -w api alerts:unsubscribe -- --email ...`):** Processed same business day where possible and never later than 5 business days (Spam Act limit).
   - **Token lifetime:** Unsubscribe tokens do not expire, exceeding the Spam Act minimum of 30 days after sending.
   - **Suppression & intentional re-opt-in:** `alert_suppression` stores `HMAC-SHA256(email, ALERTS_HASH_SECRET)` so suppressed or erased addresses are skipped on every send without retaining cleartext email addresses after erasure. If a formerly unsubscribed person later submits the sign-up form again and clicks a **fresh** confirmation link within 72 hours, `confirmByToken` clears the suppression row so we never email them again unless they sign up again and confirm.
4. **No currency figures in emails:** Alert emails contain zero dollar figures and link readers to the canonical Household Rebates guide page so the 45-day freshness check remains the single source of truth.

---

## 5. Retention, Access & Erasure Schedule (For Legal Confirmation)

| Record | Retention Period | Action at Expiry / Request |
|---|---|---|
| `confirmed` subscriber (`email`, `email_hash`, timestamps) | Until the subscriber unsubscribes or requests erasure | Unsubscribe sets `status = 'unsubscribed'` and writes `email_hash` to `alert_suppression`; `alerts:erase` nulls `email`, `ip_hash`, `user_agent` and sets `status = 'erased'` |
| `pending` / `expired` unconfirmed subscriber | `72` hours (`ALERTS_CONFIRM_TTL_HOURS`) | Purged nightly by `alerts:purge` (tokens, unconfirmed consent row, and unconfirmed subscriber row deleted; abandoned re-signups revert to `unsubscribed`/`erased` preserving the 24-month audit window) |
| `alert_consents` (consent snapshot, version, SHA-256, `privacy_version`, timestamp) | `24` months after `unsubscribed_at_utc` | Deleted by `alerts:purge` |
| `alert_suppression` (`email_hash`, `reason`, `added_at_utc`) | Indefinitely unless cleared by a fresh confirmed double opt-in | Non-reversible HMAC hash kept so we never email unsubscribed or erased addresses unless they sign up again and confirm |
| `ip_hash`, `user_agent` on `alert_subscribers` | `30` days from `created_at_utc` | Nulled by `alerts:purge` |
| Encrypted database backups (`age`) | `30` days rolling | Overwritten automatically after 30 days |

Individual APP 12 access and APP erasure requests are served via `npm run -w api alerts:export -- --email <addr>` and `npm run -w api alerts:erase -- --email <addr>`. No CLI exists to export the subscriber list in bulk.

---

## 6. Privacy Policy Section (`site/src/content/pages/privacy.mdx`)

Section 4 (*Email alerts (rule-change notifications)*), Section 6 (*Storage, security, and retention schedule*), and Section 8 (*Overseas storage and disclosure*) in `privacy.mdx` document:
- Single purpose (rule-change update emails only) and express consent legal basis (`alerts-v2`) + `72`-hour double opt-in confirmation window;
- Checker privacy separation (checker answers stay in `sessionStorage` in the browser and are never sent with the alert sign-up);
- Strict non-disclosure to installers, VEU accredited providers, or commercial sponsors;
- Server country (`<<SERVER_COUNTRY>>`) and named email service provider + overseas countries (`<<EMAIL_PROVIDER>>` / `<<EMAIL_PROVIDER_COUNTRIES>>`);
- Immediate link / RFC 8058 one-click unsubscription + `<= 5` business-day email unsubscription and keyed `HMAC-SHA256` suppression hash (cleared only by a fresh confirmed double opt-in);
- Retention periods (`confirmed` until unsubscribe/erasure; `72` h unconfirmed purge; `30` d `ip_hash` / `user_agent` nulling; `30` d encrypted backup overwrite; `24` m post-unsubscribe consent retention; suppression hash until fresh confirmed re-signup).

Both `legalReviewed` and `alertsLegalReviewed` in `privacy.mdx` remain `false` until legal sign-off.

---

## 7. Questions for Legal Sign-Off

1. Does the `alerts-v2` checkbox wording + double opt-in flow (including clearing suppression on a fresh confirmed double opt-in) satisfy express consent under the *Spam Act 2003* (Cth) and *Spam Regulations 2021*?
2. Does the APP 5 collection notice draft (once `PUBLIC_SERVER_COUNTRY`, `PUBLIC_ALERTS_PROVIDER`, and named countries in `PUBLIC_ALERTS_OVERSEAS_NOTE` under APP 8 / APP 5.2(i)–(j) are populated) cover all required matters under APP 5.2?
3. Are the retention periods in §5 and `privacy.mdx` §6 appropriate under APP 11.2 and *Spam Act* consent-evidence obligations?

---

## 8. Two-Stage Go-Live Gate & Checklist (STOP 1 vs STOP 2)

### STOP 1 — Site deploy with the form hidden (`PUBLIC_ALERTS_ENABLED=false`)
- Requires all `<<...>>` placeholders in `privacy.mdx` and `terms.mdx` (such as `<<SERVER_COUNTRY>>`) to be resolved first (`check-legal.mjs` blocks production builds when `RELEASE_ID` is set while any `<<...>>` placeholder remains) and Guri's explicit **yes** for site deployment (`./ops/deploy-site.sh` with `PUBLIC_LEADS_ENABLED=false` and `PUBLIC_ALERTS_ENABLED=false`).
- `AlertSignup` emits zero HTML or JS into the deployed pages; the three `noindex` utility pages (`/alerts/confirmed/`, `/alerts/expired/`, `/alerts/unsubscribed/`) are excluded from `sitemap-0.xml` and `llms.txt`.

### STOP 2 — Going live (separate explicit `yes, alerts live` from Guri — never bundled with STOP 1)
All of the following must be true before `PUBLIC_ALERTS_ENABLED=true` (and similarly before `PUBLIC_LEADS_ENABLED=true`):
1. **Lawyer sign-off recorded:** Qualified Australian legal review completed on the `alerts-v2` consent wording, APP 5 collection notice, `privacy.mdx` Email alerts section (`legalReviewed: true` and `alertsLegalReviewed: true`, plus `terms.mdx` `legalReviewed: true`), and email templates; Gurinder Singh sets `ALERTS_REVIEWED_BY` on the API.
2. **Post-election re-check completed:** `site/src/data/rule-status.json` `electionWatch.status` updated from `"pending"` after the post-election verification pass (`check-legal.mjs` blocks **both** `PUBLIC_LEADS_ENABLED=true` and `PUBLIC_ALERTS_ENABLED=true` while `status === "pending"`).
3. **Server country, provider & data-residency configured:** `PUBLIC_SERVER_COUNTRY`, `PUBLIC_ALERTS_PROVIDER`, and named countries in `PUBLIC_ALERTS_OVERSEAS_NOTE` set for the site build (and all `<<...>>` placeholders resolved in `privacy.mdx`), and matching `ALERTS_MAIL_TRANSPORT`, `ALERTS_FROM`, and `ALERTS_SENDER_ADDRESS` (PO box or registered office, never family home address) configured in `/etc/householdrebates/api.env`.
4. **API deployed and verified (its own server STOP):** `api/` deployed with `ALERTS_ENABLED=true` and `ALERTS_SEND_ENABLED=false`.
5. **End-to-end live test by Guri:** Guri subscribes, confirms within TTL, and unsubscribes using his own email address, verifying `/alerts/confirmed/`, `/alerts/unsubscribed/`, suppression, and fresh re-opt-in confirmation.
6. **Site rebuilt and deployed:** Only after steps 1–5 pass and Guri replies **`yes, alerts live`**, rebuild with `PUBLIC_ALERTS_ENABLED=true` (`npm run check` passes `check-legal.mjs`) and deploy.
7. **Per-send approval gate:** Every real rule-change broadcast requires its own separate approval — run `alerts:draft` + dry-run test send first, show Guri the draft text and its SHA-256 digest, wait for Guri to reply **`yes, send <sha256>`**, and only then run `ALERTS_SEND_ENABLED=true npm run -w api alerts:send -- --draft <path> --confirm <sha256>`.
