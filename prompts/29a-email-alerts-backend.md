# Prompt 29a: "Rules are changing" email alerts, part 1: the back end (double opt-in, unsubscribe, suppression, Spam Act and APP 5), local only, sending off

> **Local only. This prompt changes `api/`** (the Node lead handler), which the content prompts never touch, so read it carefully. Nothing is deployed and **no email is sent to any real person**. Deploying `api/` is a server change with its own STOP. Going live (any real send) is a separate yes from Guri, in prompt 29b.
> Run after prompts 08 (lead handler), 11 (mail DNS and driver) and 12 (privacy and legal). Branch: `feat/review-29a-alerts-api`.
> Source: `docs/business-review-2026-11-14.md` §4.3 row 3, §4.4 items 2 and 5, §5 "Email capture", §7 item 6. Design: `docs/solution-design.md` §7.3 (the "no marketing emails in v1" note and its ACMA requirements), §7.4–7.9 (request flow, SQLite, mail drivers, retention, security), §12 (compliance map). Map: `docs/url-map.md` (no new URLs in 29a).

---

## Context

The review wants an owned list for four dated rule changes: the election result (28 Nov 2026), the federal battery STC factor drop (1 Jan 2027), the gas hot water rule (1 Mar 2027) and solar PV moving into VEU (1 Jul 2027). It's a separate product from the quote form:

- **Purpose:** rule-change alerts only. Not quotes, not offers, not installers.
- **Fields:** email only.
- **Consent:** an unticked box with its own wording version, recorded with a snapshot (who, what, when, form version, `ip_hash`).
- **Double opt-in:** nothing goes to a subscriber until they click the confirmation link.
- **Every alert** identifies the sender (Agenor Services Pty Ltd, ABN, contact details) and has a working unsubscribe.
- **Never shared with installers** or anyone else. Unsubscribe and suppression are permanent.

Legal anchors (from the review and design; **the lawyer confirms the wording**):

- **Spam Act 2003** (ACMA, <https://www.acma.gov.au/avoid-sending-spam>): consent; accurate sender identification; a functional unsubscribe in every message that works for at least 30 days after sending, and requests honoured within **5 business days**. This design processes one-click unsubscribes immediately; reply or email requests are handled with a CLI the same business day where possible, and never later than 5 business days.
- **APP 5** (OAIC; Agenor is covered even as a small business because it trades in personal information, <https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/trading-in-personal-information>): a collection notice at the form, covering who we are, how to contact us, why we collect the email, what happens if you don't give it, who we disclose it to (our email service provider only), whether it goes overseas (see the decision below), and how to access, correct or complain (privacy policy link).

The existing lead tables and `LEADS_ENABLED` are **not** reused. Alerts get their own tables, flags and CLIs, so the quote form stays off and unchanged.

## Rules for every page and file in this prompt

These are the build guards from prompts 03–10. They don't relax for the expansion.

1. **Source of truth.** Use the row for the page in `docs/url-map.csv`, which is copied below. For live pages, use the "Changes needed on existing pages" table in `docs/url-map.md`. Use **only** the facts and sources in that row, plus figures already in `site/src/content/figures/vic-veu.yaml`. Don't invent numbers, dates, counts or program names. Before you write a fact, re-open its source. If the source now says something different, **stop and tell Guri**. Don't pick a number yourself.
2. **UNVERIFIED stays off the page.** Anything the map marks UNVERIFIED, "confirm", "trade site", "per search" or "stale" goes in the TODO list at the end of this prompt. It doesn't go in copy, an FAQ, a figure or schema.
3. **Figures only from the data file.** Render every dollar amount through `<Money id>` or `<FigureTable group>`. Render every percentage and every volatile count (provider counts, rebate counts) the same way, using `unit: percent | count` (prompt 15). List every id in the page's `figures` frontmatter. Never type a `$` amount into MDX, a title, a description, an FAQ answer, alt text or JSON-LD. `check-figures` fails the build if you do.
4. **Freshness.** A figure's `checkedOn` must be 45 days old or less (`MAX_FIGURE_AGE_DAYS=45`), or the build fails. Set `checkedOn` on new figures to the day Guri re-checks the source, not to the map date, if those differ.
5. **Answer first.** The H1 is followed by an `answer` of 2–4 sentences that stands alone if quoted (`check-answers`). One H1 per page.
6. **Wording.** Write in Australian English: plain, second person, short sentences, no hype and no exclamation marks. Say "discount" for VEU, and use "indicative", "up to", "Energy Victoria lists…" and "the accredited provider confirms". Never write "you will get", "you qualify", "guaranteed", "free" (unless you're quoting an official program's own name or description, attributed and linked), "claim now" or "government rebate approved" (`check-copy`). Never imply that we're the government or part of VEU. `IndependenceNotice` appears on every page.
7. **Titles and meta.** Titles are 60 characters or fewer and descriptions are 70–160 characters, with no dollar amounts in either (`check-seo`).
8. **FAQ and schema.** Every new page has a visible FAQ of 3–5 entries in `content/faqs/` and a matching `FAQPage`. FAQ answers carry no `$` amounts; link to the section instead. The allowed schema types are `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`, and `HowTo` only where the page is a genuine step-by-step. Never use `LocalBusiness`, `Offer`, `Product` with a price, `GovernmentService` or `AggregateRating`. No currency anywhere in JSON-LD (`check-schema`).
9. **Links.** Include every internal link in the row. Put at least 2 of them in the body copy, and put the rest in the `RelatedLinks` block from prompt 17. Every page links to `/victoria/eligibility-checker/`. External links go only to the sources in the row.
10. **The quote form stays off.** Use `leadForm: false` on every new page. Don't change `PUBLIC_LEADS_ENABLED`, `LEADS_ENABLED`, `api/installers.json`, `site/src/content/installers/` or the API. The CTA is the eligibility checker.
11. **No pages beyond the map.** Don't add suburb, postcode or town pages that aren't rows in `docs/url-map.csv` (`check-urlmap` fails on extras).
12. **Metadata.** Use `author: Gurinder Singh`. Set `publishedOn`, `updatedOn` and `checkedOn` to the day Guri checks the page.
13. **Conflicts.** If the map conflicts with itself, with `docs/solution-design.md` or with a live source, write it in `docs/expansion-log.md` under "Conflicts", leave that point off the page, and tell Guri. Don't guess.

## Steps

1. **Flags** (API env and site build, both default **false**):
   - `ALERTS_ENABLED` (API): when false, every `/api/alerts/*` POST returns 503 and nothing is stored or sent.
   - `ALERTS_SEND_ENABLED` (API): when false, `alerts:send` can only write drafts and send to the internal test list (`ALERTS_TEST_TO`). Real sends need it true **and** `--confirm <draft-sha256>`.
   - `PUBLIC_ALERTS_ENABLED` (site, prompt 29b): when false, the sign-up form isn't rendered.
   The API refuses to start with `ALERTS_ENABLED=true` unless `ALERTS_CONSENT_VERSION`, `PRIVACY_POLICY_VERSION`, `ALERTS_REVIEWED_BY` (the lawyer or Guri's name and date) and `ALERTS_FROM` are set, and the mail transport passes its self-test.
2. **Migration** `api/src/migrations/00X_alerts.sql` (next free number):

   ```sql
   CREATE TABLE alert_subscribers (
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
     ip_hash TEXT, user_agent TEXT
   );
   CREATE TABLE alert_consents (
     id INTEGER PRIMARY KEY,
     subscriber_id INTEGER NOT NULL REFERENCES alert_subscribers(id),
     version TEXT NOT NULL, text_sha256 TEXT NOT NULL, text_snapshot TEXT NOT NULL,
     privacy_version TEXT NOT NULL, given_at_utc TEXT NOT NULL
   );
   CREATE TABLE alert_tokens (                     -- confirm and unsubscribe tokens
     token_hash TEXT PRIMARY KEY, subscriber_id INTEGER NOT NULL REFERENCES alert_subscribers(id),
     kind TEXT NOT NULL CHECK (kind IN ('confirm','unsubscribe')), expires_at_utc TEXT, used_at_utc TEXT
   );
   CREATE TABLE alert_sends (
     id INTEGER PRIMARY KEY, draft_sha256 TEXT NOT NULL, subject TEXT NOT NULL,
     approved_by TEXT NOT NULL, sent_at_utc TEXT NOT NULL, recipients INTEGER NOT NULL
   );
   CREATE TABLE alert_suppression (email_hash TEXT PRIMARY KEY, reason TEXT NOT NULL, added_at_utc TEXT NOT NULL);
   ```
3. **Endpoints** (same Fastify app, same nginx `/api/` location, same Origin, size, rate-limit, honeypot and form-token rules as `/api/leads`, design §7.4):
   - `POST /api/alerts/subscribe` `{ email, consent: true, consentVersion, formToken, website }` → validate; if the hash is suppressed or already confirmed, return the **same** 202 response (no account enumeration) and send nothing; else store `pending`, store the consent snapshot, send the confirmation email (transactional: no marketing content), 202.
   - `GET /api/alerts/confirm?t=` → one-time token, valid for `ALERTS_CONFIRM_TTL_HOURS` (default 72, decision below) → `confirmed`, 303 to `/alerts/confirmed/`. Expired tokens → 303 `/alerts/expired/`. Unconfirmed rows expire after the TTL and are purged nightly.
   - `GET /api/alerts/unsubscribe?t=` → a page with one button (no login, no questions); `POST` the same → `unsubscribed`, hash into suppression, 303 `/alerts/unsubscribed/`.
   - `POST /api/alerts/unsubscribe-one-click` → RFC 8058 one-click (for the `List-Unsubscribe-Post` header) → same effect, 200.
   - Unsubscribe tokens don't expire (they must work for at least 30 days after any send; non-expiring is simpler and safe because they only unsubscribe).
4. **Emails** (`api/src/mail/templates/alerts-*.ts`, plain text and simple HTML):
   - Confirmation: what you asked for, the one purpose, the confirm link, "If you didn't ask for this, ignore it; we won't email you again", sender block.
   - Alert template: subject without `$` amounts; body links to the site page with the figures (no amounts typed in emails, so the 45-day rule stays the single source); "We're not a government website" line; sender block; unsubscribe link; `List-Unsubscribe` (mailto and https) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers.
   - Sender block on every email: "Household Rebates is run by Agenor Services Pty Ltd, ABN <<ABN>>, <<postal or contact address>>, <<contact email>>." Fill the placeholders from env at send time; the build fails if a placeholder is unresolved.
5. **CLIs** (`npm run -w api …`, run on the VPS as `hrapi` later; locally now):
   - `alerts:draft -- --topic <id> --page <url>` writes `drafts/<date>-<topic>.md` and prints its sha256.
   - `alerts:send -- --draft <file>` sends to `ALERTS_TEST_TO` only. With `--confirm <sha256>` and `ALERTS_SEND_ENABLED=true`, it sends to all `confirmed` subscribers not in suppression, in batches (decision: batch size and rate, from the mail provider's limits found in prompt 11), and writes `alert_sends`.
   - `alerts:unsubscribe -- --email x@y` (for reply or email requests) → same as the link; logs `unsubscribe_method=cli`.
   - `alerts:export -- --email`, `alerts:erase -- --email` (APP access and erasure; erase nulls the email, keeps the hash in suppression so it's never re-added).
   - `alerts:stats` → counts by status only. **There is no CLI that exports the list**, and the installer delivery code can't read these tables (separate module, separate DB handle, a unit test proves it).
6. **Retention** (proposal, lawyer confirms; add to design §7.8): confirmed subscribers kept until unsubscribe; pending rows purged after the TTL; consent snapshots kept for 24 months after unsubscribe; suppression hashes kept indefinitely; `ip_hash` and `user_agent` nulled after 30 days.
7. **Tests** (`vitest` + `fastify.inject`, all with a fake mail transport):
   - subscribe → one confirmation email, row `pending`; no alert email possible before confirm;
   - duplicate, suppressed and confirmed emails get the identical 202 and no email;
   - confirm with a valid, expired and re-used token;
   - unsubscribe by link, by one-click POST and by CLI; then `alerts:send` skips them; re-subscribing a suppressed address sends nothing;
   - every alert email has the sender block, the unsubscribe link and both `List-Unsubscribe` headers; none contains `$`;
   - `ALERTS_ENABLED=false` → 503 and nothing stored; `ALERTS_SEND_ENABLED=false` → only the test list gets mail; `--confirm` with the wrong hash → refuses;
   - the installer delivery module can't import the alerts repository.
8. **Docs:** update design §7 with a new §7.10 "Rule-change alerts" (flow, tables, flags, retention) and §12 (compliance map rows for the Spam Act and APP 5 alert notice). Add the alert consent wording and collection notice drafts to the lawyer pack from prompt 12 (`docs/legal/alerts-consent-v1.md`).

## Acceptance checks

```bash
npm run -w api migrate && npm run -w api test
# expect: all pass, including the alerts suite (subscribe, confirm, unsubscribe x3, suppression, headers, flags, isolation)
ALERTS_ENABLED=false npm run -w api start & sleep 2; curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:8787/api/alerts/subscribe -d 'email=test@example.com'; kill %1
# expect: 503
grep -RIn 'alert_subscribers' api/src | grep -v 'alerts/' | wc -l   # expect: 0 (only the alerts module touches the table)
grep -RIn '\$[0-9]' api/src/mail/templates/alerts-* | wc -l           # expect: 0
```

## What to test by hand (local, fake transport or the test mailbox only)

- Subscribe, confirm and unsubscribe once each with Guri's own test address in `ALERTS_TEST_TO`. Check Gmail and Outlook show the one-click unsubscribe.
- Read the confirmation and a sample alert against the ACMA checklist: consent, identify, unsubscribe.

## Open decisions for Guri

- Confirmation link lifetime (default 72 hours).
- Mail transport for alerts: the same Hostinger SMTP or Graph mailbox as the leads (prompt 11), or a separate sender address such as `alerts@`. Microsoft 365 may store mail outside Australia; the APP 5 notice must say so if it does (lawyer).
- Batch size and send rate (from the provider's limits).
- Retention periods above (lawyer).
- Who signs `ALERTS_REVIEWED_BY` (the lawyer, or Guri after the lawyer's comments).

## STOP: Guri's approval before anything leaves your machine

Everything above is local. Don't do any of these without Guri typing **yes** for that specific step:

- Push to the remote or open a PR. Show the branch name and `git log --oneline` first.
- Deploy `api/` to the VPS, run the migration there, or change `/etc/householdrebates/api.env`. That's a server change: show the diff of the env keys (names only, never values), the migration SQL and the systemd restart command first. The flags stay **false** on the server after this prompt.
- Send any email to anyone except the internal test address.
- Never, in this prompt: edit nginx, DNS or systemd units, turn on `LEADS_ENABLED`/`PUBLIC_LEADS_ENABLED`, or touch installer files.

## Done when

The alerts module, tables, endpoints, emails and CLIs pass their tests locally with every flag off, the design and lawyer pack are updated, and nothing has been deployed or sent. Commit `feat(review): rule-change alerts back end, flags off (29a)`.
