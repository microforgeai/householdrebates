# Household Rebates — Project Wiki

## 1. What This Is & Running Locally

**Household Rebates** (`householdrebates.com.au`) is an independent Australian guide and interactive eligibility checker for Victorian Energy Upgrades (VEU) discounts, Solar Homes rebates, federal battery discounts, and Victorian home and business electrification rules, published by Agenor Services Pty Ltd. Every dollar figure and program threshold comes from a single structured registry backed by primary government sources (or clearly labelled formula estimates) with a 45-day freshness rule, and zero tracking cookies or third-party analytics scripts run on the site. Both the installer quote form and the rule-change email alert sign-up stay switched off in the information-only launch until legal review and post-election rule checks are complete.

### Local Setup, Build & Tests (Node.js 22+)

Run all commands from the repository root ([`package.json`](../package.json)):

```bash
# Install dependencies across site and api workspaces
npm ci

# Start the local Astro dev server (http://localhost:4321)
npm run dev

# Build static site (site/dist/, llms.txt, redirects, post-build checks) and API (api/dist/)
npm run build

# Run all 16 build guard scripts, astro check, site Vitest, and API TypeScript check
npm run check

# Run unit test suites across site (Vitest) and api (Vitest)
npm test

# Run Playwright end-to-end and axe-core accessibility tests
npm --workspace=site run test:e2e

# Verify live HTTP responses of official source URLs (on demand)
npm run check:sources
```

---

## 2. Architecture, Deployment & Rollback

Full system specification: [`solution-design.md`](./solution-design.md) · Checker specification: [`eligibility-checker-spec.md`](./eligibility-checker-spec.md)

- **Static site ([`site/`](../site/)):** Astro 7 static build (`output: 'static'`, [`site/astro.config.mjs`](../site/astro.config.mjs)) rendering MDX content collections (`pages`, `guides`, `areas`, `sources`, `faqs`), JSON-LD structured data ([`site/src/lib/schema.ts`](../site/src/lib/schema.ts)), [`sitemap-0.xml`](../site/astro.config.mjs), and [`llms.txt`](../site/scripts/build-llms.mjs).
- **Preact & client islands ([`site/src/components/`](../site/src/components/)):** Lightweight hydrated islands under strict gzipped bundle caps — Eligibility Checker ([`CheckerApp.tsx`](../site/src/components/CheckerApp.tsx)), VEU Postcode Lookup ([`PostcodeLookupApp.tsx`](../site/src/components/PostcodeLookupApp.tsx)), Running Costs Picker ([`RunningCostsPicker.astro`](../site/src/components/RunningCostsPicker.astro)), Heat Pump Size Guide ([`HwSizeGuide.astro`](../site/src/components/HwSizeGuide.astro)), Get-Off-Gas Planner ([`GasExitPlanner.astro`](../site/src/components/GasExitPlanner.astro)), plus gated quote ([`LeadForm.astro`](../site/src/components/LeadForm.astro)) and alert ([`AlertSignupIsland.astro`](../site/src/components/AlertSignupIsland.astro)) forms.
- **Node API + SQLite ([`api/`](../api/)):** Fastify + TypeScript service (`127.0.0.1:8787`, systemd unit [`ops/systemd/hr-leads.service`](../ops/systemd/hr-leads.service)) using two isolated SQLite databases (`leads.db` for installer enquiries and `alerts.sqlite` for rule-change email alerts — lead/installer modules cannot read alert subscribers). Daily `age`-encrypted backups run via [`ops/backup.sh`](../ops/backup.sh) ([`hr-backup.timer`](../ops/systemd/hr-backup.timer)) and nightly retention purges run via [`hr-purge.timer`](../ops/systemd/hr-purge.timer).
- **Web server & hosting ([`ops/nginx/`](../ops/nginx/)):** `nginx` on a Hostinger International Ltd VPS in **Kuala Lumpur, Malaysia**, serving static releases from `/var/www/householdrebates/current`, enforcing strict security headers ([`householdrebates-headers.conf`](../ops/nginx/householdrebates-headers.conf)) and redirects ([`householdrebates-redirects.conf`](../ops/nginx/householdrebates-redirects.conf)), and reverse-proxying `/api/*` to Fastify when enabled. Transactional/contact mail uses Hostinger Mail (stored in France and Germany).

### Deploying & Rolling Back

1. **Deploy static site ([`ops/deploy-site.sh`](../ops/deploy-site.sh)):**
   - Must run from a clean working tree on `main`.
   - Sets `RELEASE_ID` (`YYYYMMDD-HHMM-<sha>`), runs `npm ci`, `npm run check`, `npm run test`, and `npm --workspace=site run build`.
   - Syncs `site/dist/` to `/var/www/householdrebates/releases/$REL/`, atomically swaps the `current` symlink, prunes releases older than the newest 5, and verifies the live `RELEASE_ID` meta tag over HTTPS (auto-rolling back if the smoke check fails).
2. **Deploy API ([`ops/deploy-api.sh`](../ops/deploy-api.sh)):**
   - Syncs and builds `api/` into `/opt/householdrebates-api/releases/$REL/`, swaps `current`, restarts `hr-leads`, and checks `http://127.0.0.1:8787/health`.
3. **Rollback ([`ops/rollback.sh`](../ops/rollback.sh)):**
   - Static site: `./ops/rollback.sh site` (atomically points `/var/www/householdrebates/current` back to the previous release directory and checks HTTP 200).
   - Backend API: `./ops/rollback.sh api` (repoints `/opt/householdrebates-api/current`, restarts `hr-leads`, and verifies `/health`).

---

## 3. Content, Figures & Build Guard Scripts

### Updating a Figure and Its Source

[`site/src/content/figures/vic-veu.yaml`](../site/src/content/figures/vic-veu.yaml) is the **only** source of dollar amounts, percentages, and program counts on the site. Never type raw dollar amounts (`$1,400`, `AUD`, etc.) into MDX prose, page titles, FAQ answers, alert emails, or JSON-LD — `<Money>`, `<FigureTable>`, `<HeroBlock>`, and the checker read directly from `vic-veu.yaml`.

To update a figure:
1. Check the primary government page or specification PDF and update `checkedOn` (plus `url` or `pageLastUpdated` if changed) in the matching file under [`site/src/content/sources/`](../site/src/content/sources/).
2. Update the figure entry in [`site/src/content/figures/vic-veu.yaml`](../site/src/content/figures/vic-veu.yaml): set the verified number (`amount`, `min`/`max`, or `percent`), `basis` (`official` or `estimate` with `method` and `inputs`), `kind` (`discount | payment | threshold | rate | saving | count`), `audience` (`household | business | both`), `sourceId`, `checkedOn` (must be within `MAX_FIGURE_AGE_DAYS`, default `45`), and any `reviewBy` or `expiresOn` date.
3. Run `npm run build && npm run check` (which also runs the checker spec and example tests in [`site/tests/checker/`](../site/tests/checker/)).

Note: [`docs/postcodes.csv`](./postcodes.csv) (`719` Victorian VEU postcodes) is the master postcode table; do not regenerate it from a script — cross-check it against VEU Specifications v25 with [`crosscheck-veu-postcodes.mjs`](../site/scripts/crosscheck-veu-postcodes.mjs).

### Build Guard Scripts ([`site/scripts/`](../site/scripts/))

| Script | What it guards |
|---|---|
| [`check-figures.mjs`](../site/scripts/check-figures.mjs) | Every figure has a valid source, `kind`, `audience`, and `checkedOn <= 45` days; no expired `reviewBy`/`expiresOn`; zero raw `$` amounts in prose, titles, FAQs, or schema; labelled `<HeroBlock>` figures and labelled `"our estimate"` disclosures; household vs business figure separation. |
| [`check-postcodes.mjs`](../site/scripts/check-postcodes.mjs) | Built postcode JSON and every area page's frontmatter and rendered `<tr data-postcode>` rows match [`docs/postcodes.csv`](./postcodes.csv) 1-to-1 with zero Council/zone drift. |
| [`crosscheck-veu-postcodes.mjs`](../site/scripts/crosscheck-veu-postcodes.mjs) | Cross-checks `postcodes.csv` against the VEU Specifications v25.0 Location Variable List PDF. |
| [`check-council-status.mjs`](../site/scripts/check-council-status.mjs) | Every council program in [`council-programs.json`](../site/src/data/council-programs.json) and area MDX has a verified source, valid status (`open`, `paused`, `closed`), and fresh `statusCheckedOn` (`<= 45` days for `open`). |
| [`check-rule-status.mjs`](../site/scripts/check-rule-status.mjs) | [`rule-status.json`](../site/src/data/rule-status.json) freshness, `RuleStatusNotice` banner presence on election-watch and figure pages while `electionWatch.status === "pending"`, and qualified `"currently legislated"` wording on 2027 obligations. |
| [`check-urlmap.mjs`](../site/scripts/check-urlmap.mjs) | Built indexable pages, `sitemap-0.xml`, and `llms.txt` match [`rollout.json`](../site/src/data/rollout.json) and [`url-map.json`](../site/src/data/url-map.json); zero orphan pages; every guide has at least 6 contextual inbound `<main>` links. |
| [`check-copy.mjs`](../site/scripts/check-copy.mjs) | Blocks banned marketing/government-impersonation phrases and retired program claims (such as retired Home Energy Rating Scorecard VEU rebates). |
| [`check-answers.mjs`](../site/scripts/check-answers.mjs) | Every indexable page renders a 2–4 sentence `AnswerBlock` at the top and carries the strict Content-Security-Policy meta/header rules. |
| [`check-faqs.mjs`](../site/scripts/check-faqs.mjs) | Single canonical page per FAQ (`canonicalPage`), 3–5 canonical FAQs per guide/area page, fresh `checkedOn`, and zero `$` characters in FAQ answers. |
| [`check-overlap.mjs`](../site/scripts/check-overlap.mjs) | Hard 25% cap on both 5-gram Jaccard similarity and containment across all built pages to prevent duplicate or doorway pages. |
| [`check-seo.mjs`](../site/scripts/check-seo.mjs) | `<title> <= 60` chars, meta description `<= 155` chars, no duplicate titles/descriptions/brand suffixes, canonical URLs, and author-page `noindex` rules. |
| [`check-text.mjs`](../site/scripts/check-text.mjs) | Scans rendered HTML for raw URL paths in prose, doubled words, self-links, `undefined`/`NaN`/`null`, or leaked template tokens. |
| [`check-links.mjs`](../site/scripts/check-links.mjs) | Verifies every internal `href` and fragment anchor across all built HTML files resolves cleanly. |
| [`check-schema.mjs`](../site/scripts/check-schema.mjs) | Validates every JSON-LD `@graph`: allow-listed `@type` values only, zero `$`/`AUD`/`offers`, zero unresolved placeholders, and no unsigned `reviewedBy` or unpublished `Person` nodes. |
| [`check-bundles.mjs`](../site/scripts/check-bundles.mjs) | Enforces gzipped JS size budgets per client island (including combined checker + postcode lookup `< 15 KB` gz and alert island `< 3 KB` gz). |
| [`check-consent-hash.mjs`](../site/scripts/check-consent-hash.mjs) | Verifies SHA-256 parity between rendered Astro form consent text (`LeadForm.astro` and `AlertSignupIsland.astro`), `site` consent templates, and `api` consent templates. |
| [`check-installers.mjs`](../site/scripts/check-installers.mjs) | Ensures active installer records in `site/src/content/installers/` match `api/installers.json` word-for-word. |
| [`check-legal.mjs`](../site/scripts/check-legal.mjs) | Blocks production builds if legal pages contain `<<...>>` placeholders, blocks `PUBLIC_LEADS_ENABLED=true` and `PUBLIC_ALERTS_ENABLED=true` until lawyer sign-off, post-election re-check, and sender/provider settings are complete, and enforces author/reviewer publishing rules. |
| [`check-sources.mjs`](../site/scripts/check-sources.mjs) | On-demand live HTTP check of all source URLs (`npm run check:sources`), distinguishing real 4xx/5xx failures from anti-bot challenges. |

---

## 4. Feature Flags & Go-Live Gates

All interactive collection features default to **`false`** for the information-only site release:

- **`PUBLIC_LEADS_ENABLED` (site) / `LEADS_ENABLED` (API) — default `false`:**
  - While `false`, pages render `FormClosedNotice` pointing to official government directories and `/leads` returns `503` / `303`.
  - **Before switching to `true`:**
    1. Complete the post-28 November 2026 Victorian election re-check so `electionWatch.status` in [`rule-status.json`](../site/src/data/rule-status.json) is no longer `"pending"`.
    2. Complete Australian legal review of the 5 documents in [`lawyer-pack.md`](./lawyer-pack.md) and set `legalReviewed: true` in [`privacy.mdx`](../site/src/content/pages/privacy.mdx) and [`terms.mdx`](../site/src/content/pages/terms.mdx).
    3. Sign at least one licensed participating installer agreement (`agreementSignedOn` + named VEU accredited provider) and sync `site/src/content/installers/` with `api/installers.json`.
    4. Set `PRIVACY_POLICY_VERSION` and `CONSENT_REVIEWED_BY` in `/etc/householdrebates/api.env` on the VPS, deploy the API, and obtain explicit go-live approval.
- **`PUBLIC_ALERTS_ENABLED` (site) / `ALERTS_ENABLED` & `ALERTS_SEND_ENABLED` (API) — default `false`:**
  - While `false`, `AlertSignup` emits zero HTML/JS on pages and `/api/alerts/*` returns `503`.
  - **Before switching to `true`:**
    1. Complete the post-election re-check (`electionWatch.status !== "pending"`).
    2. Complete legal review and set `legalReviewed: true` (`privacy.mdx` and `terms.mdx`) plus `alertsLegalReviewed: true` (`privacy.mdx`).
    3. Replace `<<ALERTS_SENDER_ADDRESS>>` (`ALERTS_SENDER_ADDRESS`) with a PO box or Agenor's registered office (never a private home address), valid for at least 30 days after every send.
    4. Configure `ALERTS_FROM`, `ALERTS_CONSENT_VERSION`, `PRIVACY_POLICY_VERSION`, `ALERTS_HASH_SECRET`, `ALERTS_MAIL_TRANSPORT`, and `ALERTS_REVIEWED_BY` in `/etc/householdrebates/api.env`, run an end-to-end subscribe/confirm/unsubscribe test, and obtain separate explicit approval (`ALERTS_SEND_ENABLED` stays `false` except during SHA-256-confirmed broadcast sends).
- **`legalReviewed` & `alertsLegalReviewed` (frontmatter in `privacy.mdx` and `terms.mdx`) — currently `false`:**
  - Guarded by [`check-legal.mjs`](../site/scripts/check-legal.mjs). Keep `false` (and keep `CONSENT_REVIEWED_BY` / `ALERTS_REVIEWED_BY` empty) until formal legal review is finished.
- **Author page gate ([`site/src/data/people.json`](../site/src/data/people.json) & `PUBLIC_AUTHOR_LIVE`):**
  - While `people.json["gurinder-singh"].bio` is empty, `/about/gurinder-singh/` is excluded from `dist/`, `sitemap-0.xml`, and `llms.txt`, and `Article.author` references `#publisher`. Supplying an approved bio and setting `noindex: false` unlocks the author profile page.

---

## 5. Legal & Privacy Documents

- **Privacy Policy & APP 5 Collection Notice:** [`site/src/content/pages/privacy.mdx`](../site/src/content/pages/privacy.mdx)
- **Website Terms of Use:** [`site/src/content/pages/terms.mdx`](../site/src/content/pages/terms.mdx)
- **Plain-English Compliance Review (15 Nov 2026, not legal advice):** [`legal/legal-review-2026-11-15.md`](./legal/legal-review-2026-11-15.md)
- **Fixed-Fee Lawyer Review Brief & Open Questions:** [`lawyer-pack.md`](./lawyer-pack.md)
- **Rule-Change Email Alerts Legal & Spam Act Specification (`alerts-v2`):** [`legal/alerts-consent-v1.md`](./legal/alerts-consent-v1.md)
- **Participating Installer Lead Supply Agreement Draft:** [`installer-agreement-draft.md`](./installer-agreement-draft.md)
- **Data Breach Response Plan:** [`data-breach-response-plan.md`](./data-breach-response-plan.md)

---

## 6. Operations, URL Map & Prompt History

- **Go-Live Checklist:** [`CHECKLIST.md`](./CHECKLIST.md)
- **Expansion Log (decisions, resolved conflicts, unverified exclusions & scheduled re-checks):** [`expansion-log.md`](./expansion-log.md)
- **URL Map & Content Architecture (`74` rows, `72` live indexable URLs):** [`url-map.md`](./url-map.md) · [`url-map.csv`](./url-map.csv) · [`site/src/data/rollout.json`](../site/src/data/rollout.json)
- **Master VEU Postcode Table (`719` postcodes):** [`postcodes.csv`](./postcodes.csv)
- **Business Content Review:** [`business-review-2026-11-14.md`](./business-review-2026-11-14.md)
- **Prompt Runbook:** [`prompts/RUN-24-39.md`](../prompts/RUN-24-39.md)

### Prompts 24–41 History ([`prompts/`](../prompts/))

- **24** ([`24-election-notice-rule-status.md`](../prompts/24-election-notice-rule-status.md)): Added `rule-status.json`, `RuleStatusNotice.astro`, `"currently legislated"` 2027 wording, and `check-rule-status.mjs` for the 28 Nov 2026 Victorian election caretaker period.
- **25** ([`25-headline-figure-labels.md`](../prompts/25-headline-figure-labels.md)): Added `kind` tags to every figure in `vic-veu.yaml` and labelled `<HeroBlock>` headline callouts across guide, area, and tool pages.
- **26** ([`26-text-defects-and-checks.md`](../prompts/26-text-defects-and-checks.md)): Fixed prose defects (raw URL paths, doubled words, self-links, title/description lengths) and added `check-text.mjs` and `check-seo.mjs`.
- **27** ([`27-faq-dedupe-and-local-facts.md`](../prompts/27-faq-dedupe-and-local-facts.md)): Enforced one canonical page per FAQ (`3–5` FAQs per page with cross-page links) and added `check-faqs.mjs` and `check-overlap.mjs`.
- **28** ([`28-business-hub-and-pages.md`](../prompts/28-business-hub-and-pages.md)): Built `/victoria/business-energy-upgrades/` and four Wave 4 business guides (heating/cooling, LED lighting, cold rooms, hot water/motors) with household/business figure guards.
- **29a** ([`29a-email-alerts-backend.md`](../prompts/29a-email-alerts-backend.md)): Built the isolated Fastify + SQLite double-opt-in rule-change email alerts backend (`alerts.sqlite`), CLI tools, RFC 8058 one-click unsubscribe, and HMAC suppression list with all flags `false`.
- **29b** ([`29b-email-alerts-signup-and-go-live.md`](../prompts/29b-email-alerts-signup-and-go-live.md)): Built the hidden-by-default `AlertSignup` island (`< 3 KB` gz), `noindex` `/alerts/*` utility pages, APP 5 collection notice resolver, and `check-legal.mjs` go-live gates.
- **30** ([`30-program-pages-battery-solar-other-veu.md`](../prompts/30-program-pages-battery-solar-other-veu.md)): Authored `/victoria/battery-rebate/` (with `FEDERAL` badges), `/victoria/solar-panel-rebate/`, and `/victoria/other-veu-discounts/`, plus Midday Power Saver and 20 kW multi-split cap updates.
- **31** ([`31-help-in-your-language.md`](../prompts/31-help-in-your-language.md)): Published `/victoria/help-in-your-language/` covering Energy Victoria (11 languages), Solar Victoria (14 own-script languages), TIS `131 450`, and senior scam-prevention callouts.
- **32** ([`32-eeat-author-reviewer-schema.md`](../prompts/32-eeat-author-reviewer-schema.md)): Added `people.json`, `Article`/`WebPage`/`WebApplication` JSON-LD, signed-reviewer slots, and empty-bio suppression keeping `/about/gurinder-singh/` out of public output until a bio is supplied.
- **33** ([`33-internal-links-footer-lpg.md`](../prompts/33-internal-links-footer-lpg.md)): Published `/victoria/lpg-homes/` (`313` of `719` non-gas postcodes), dynamic 20-area footer groups, `>= 6` inbound `<main>` links per guide, and zero allow-listed overlap pairs.
- **34** ([`34-pack-import-and-corrections.md`](../prompts/34-pack-import-and-corrections.md)): Imported the 74-row URL map and 719-row master `postcodes.csv`, added SPEC25 Part 48 ceiling insulation estimates (`basis: estimate`), added `council-programs.json`, and kept `/victoria/shepparton/` gated.
- **35a** ([`35a-checker-rules-engine.md`](../prompts/35a-checker-rules-engine.md)): Implemented the pure TypeScript eligibility checker engine covering all 75 rules and 22 messages in `eligibility-checker-spec.md` with full unit and 6-example fixture coverage.
- **35b** ([`35b-checker-ui-and-results.md`](../prompts/35b-checker-ui-and-results.md)): Built the interactive Preact `Checker` UI with Residential and Business paths, `#a=` shareable state links, keyboard/WCAG AA support, and print styling.
- **36** ([`36-postcode-lookup-page.md`](../prompts/36-postcode-lookup-page.md)): Published `/victoria/postcode/` with instant postcode and locality typeahead across all 719 Victorian VEU postcodes while keeping combined checker + postcode JS under `15 KB` gz.
- **37** ([`37-north-west-corridor.md`](../prompts/37-north-west-corridor.md)): Published `/victoria/north-west-corridor/` covering Sunbury, Diggers Rest, Melton, and Gisborne on one corridor hub with dual NCC zones (6 and 7) and rendered postcode-row checks.
- **38** ([`38-council-pages.md`](../prompts/38-council-pages.md)): Published council area guides for `/victoria/macedon-ranges/`, `/victoria/mitchell/`, `/victoria/latrobe-valley/`, and `/victoria/mildura/` with verified local council and SEC pilot programs.
- **39** ([`39-metro-hubs-and-melbourne.md`](../prompts/39-metro-hubs-and-melbourne.md)): Published `/victoria/melbourne-north/`, `melbourne-west`, `melbourne-east`, and `melbourne-south-east`, rescoped `/victoria/melbourne/` to inner Melbourne (52 postcodes), added sortable mobile postcode tables, and made 25% containment a hard build gate.
- **40** ([`40-legal-fixes.md`](../prompts/40-legal-fixes.md)): Applied all 28 compliance-review findings across `privacy.mdx`, `terms.mdx`, `about.mdx`, `CONSENT_TEMPLATE_V2`, `alerts-v2`, rendered-form SHA-256 checks, and `lawyer-pack.md` with operator placeholders held behind `check-legal.mjs`.
- **41** (Release branch `feat/release-41`): Filled confirmed operator facts (Malaysia VPS, Hostinger Mail in France and Germany, `hello@` / `privacy@` contacts, 24-month mailbox retention, small-business APPs §1 wording flagged for lawyer check) while keeping forms/alerts off and `<<ALERTS_SENDER_ADDRESS>>` gated for info-only deployment.
