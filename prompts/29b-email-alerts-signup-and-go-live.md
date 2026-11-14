# Prompt 29b: "Rules are changing" email alerts, part 2: the sign-up form, collection notice, utility pages, and the go-live gate

> Local only, then two separate STOPs: (1) deploy the site with the form **hidden**; (2) go live, which needs Guri's explicit yes after the lawyer's review. Branch: `feat/review-29b-alerts-site`.
> Run after prompt 29a. The battery placement needs prompt 30; if 30 hasn't run, skip that placement and add it when 30 runs.
> Source: `docs/business-review-2026-11-14.md` §4.3 row 3, §4.4 item 2, §5 "Checker funnel" and "Email capture", §7 item 6. Checker: `docs/eligibility-checker-spec.md` §1 principle 6 ("No personal data is stored… answers stay in the browser") and §7. Design: `docs/solution-design.md` §7.3, §7.6, §10.2. Map: `docs/url-map.md` (no new indexable URLs).

---

## Context

Placements (review §7 item 6): the checker result screen, `/victoria/gas-to-electric-hot-water-2027/`, the battery page (`/victoria/battery-rebate/`, prompt 30) and the footer.

**Checker privacy.** Spec §1 says the checker stores no personal data and answers stay in the browser. The alert form on the result screen is a **separate form** that posts only the email and consent, never checker answers. Say so under the form: "This only signs you up for rule-change emails. Your checker answers aren't sent."

**Design §7.6** says "no email capture while closed". That rule is about the quote form. The alert form is a different purpose with its own flags, so §7.6 gets a note: "Rule-change alerts (§7.10) are separate and have their own flags." Log it under "Conflicts" in `docs/expansion-log.md` as resolved this way, for Guri to confirm.

The copy names the four dates (28 Nov 2026, 1 Jan 2027, 1 Mar 2027, 1 Jul 2027). Dates come from one data value (`site/src/data/alert-topics.json`), and a date in the past drops off the list automatically at build time. No `$` amounts in the form copy.

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

### Extra guards from the 14 Nov 2026 business review (prompts 24–27 add the checks; they apply to every page from then on)

14. **Labelled headline figures.** Every `<Money variant="block">` (the hero figure under the answer) needs a `label` that names the scenario (for example "Room gas heater → one split system") and the figure's `kind` (`discount | payment | threshold | rate | saving`). `check-figures` fails without them (prompt 25).
15. **Rule status.** Any page that states a 2027 rule carries `ruleStatus: election-watch` until prompt 23's re-check clears it. Every "must", "have to" or "banned" sentence about a 2027 rule says "currently legislated" (prompt 24, `check-rule-status`).
16. **Clean visible text.** No raw paths such as `/victoria/…` or `/about/` in visible text; use linked anchor text. No doubled words or phrases. No link from a page to itself (except `#` anchors). Rendered `<title>` 60 characters or fewer, with the brand at most once. Meta descriptions unique and 155 characters or fewer (prompt 26, `check-text`, `check-seo`).
17. **FAQ placement.** Each FAQ entry has one `canonicalPage`. It's shown in full, and in `FAQPage`, only there. Other pages link to it. Each page has 3–5 FAQs of its own (prompt 27, `check-faqs`, `check-overlap`).
18. **The map is the page list.** A page that isn't a row in `docs/url-map.csv` doesn't exist. Since 14 Nov 2026 the master map has **74 rows** (Wave 4, rows 65–74, holds the business pages, program pages, help in your language, the author page and LPG homes), and prompt 34 imports all of them. No prompt from 24 on adds a row. If a page seems to be missing, stop and ask Guri to get it added by Venture Architect first.
19. **postcodes.csv is read-only.** It's the master list of the 719 VEU v25.0 Table A postcodes. Copy it into `site/src/data/` unchanged. Never regenerate it (no `postcode_mkcsv.py`, no PDF re-parse). If it looks wrong, stop and tell Guri.

## Steps

1. **`AlertSignup` component** (island, under 3 KB gzipped): one email field with a visible label, an **unticked** consent box, the collection notice directly above the button, honeypot and form token (as the lead form). Renders only when `PUBLIC_ALERTS_ENABLED === 'true'`; otherwise renders nothing (no "coming soon" box). Accessible errors (`aria-describedby`). On success: "Check your inbox to confirm. Nothing is sent until you click the link."
2. **Consent wording v1** (draft; the lawyer confirms; stored as `alerts-v1` with its sha256, matching 29a):
   > ☐ Email me when the rules for Victorian energy rebates change (for example the election result, the battery discount change on 1 January 2027, the gas hot water rule on 1 March 2027 and solar moving into VEU on 1 July 2027). I can unsubscribe at any time from any email.
3. **Collection notice** (APP 5; draft for the lawyer): "Household Rebates (Agenor Services Pty Ltd, ABN <<ABN>>) collects your email address only to send rule-change alerts you've asked for. If you don't give it, we can't send them. We don't share it with installers or anyone else, except our email service provider, <<provider>>, which sends the emails for us<<; it may store data outside Australia>>. Our [privacy policy](/privacy/) explains how to access or correct your details and how to complain. We're not a government website." The placeholders must resolve from config before build, or the build fails.
4. **Placements:** checker result screen (below the result lines and CTAs, not above them); `/victoria/gas-to-electric-hot-water-2027/` (after the answer and the rule-status notice from prompt 24, not inside the answer); `/victoria/battery-rebate/` (after the 1 Jan 2027 section); site footer (compact variant). No pop-ups, no interstitials, no pre-ticked boxes.
5. **Utility pages** (noindex, `robots` disallow not needed, excluded from the sitemap, `llms.txt` and `check-urlmap` like `/thanks/` and `/form-error/`): `/alerts/confirmed/`, `/alerts/expired/`, `/alerts/unsubscribed/`. Each says what happened in one sentence and links to `/victoria/`.
6. **Privacy policy:** add an "Email alerts" section (purpose, legal basis = consent, retention from 29a, unsubscribe, no sharing, provider, overseas if applicable). `legalReviewed` stays false until the lawyer signs; `check-legal` already blocks `LEADS_ENABLED`; extend it to block `PUBLIC_ALERTS_ENABLED=true` while the privacy policy's alert section isn't reviewed.
7. **Schema:** none for the form. No `Offer`, no `SubscribeAction` (keep the allowed types list unchanged).
8. Tests: unit (consent unticked by default; notice placeholders resolved; past dates dropped); e2e (Playwright) with a mocked API: submit → success message; the request body has exactly `email`, `consent`, `consentVersion`, `formToken`, `website`; nothing from `sessionStorage` is sent.

## Acceptance checks

```bash
cd site
npm run check && npm run test:e2e -- alerts   # expect: pass
PUBLIC_ALERTS_ENABLED=false npm run build && grep -RIl 'data-alert-signup' dist | wc -l   # expect: 0
PUBLIC_ALERTS_ENABLED=true  npm run build && grep -RIl 'data-alert-signup' dist | wc -l   # expect: every page (footer) — and check-legal FAILS while the alert privacy section isn't reviewed
node scripts/check-urlmap.mjs     # expect: unchanged count; the 3 /alerts/ pages are noindex and not in the sitemap
grep -c 'type="checkbox"[^>]*checked' dist/victoria/gas-to-electric-hot-water-2027/index.html   # expect: 0
```

## What to test by hand

- With the API from 29a running locally (flags on locally only, fake transport): sign up from each placement, confirm, unsubscribe.
- Keyboard and screen reader through the form; error states; 200% zoom.

## Open decisions for Guri

- Go live before 28 Nov 2026 (the review's suggestion) or after the election re-check. Going live needs the lawyer's review of the consent and notice first, so before 28 Nov is only possible if the lawyer is quick.
- The footer placement (site-wide) vs only the three content placements.
- The email provider name and whether data goes overseas (for the notice).

## STOP 1: deploy with the form hidden

## STOP: Guri's approval before anything leaves your machine

Everything above is local: branch, build, tests. Don't run any of the following without Guri typing **yes** for this specific step:

- Push to the remote or open a PR. Show the branch name and `git log --oneline` first.
- Deploy. Use `./ops/deploy-site.sh` only, with the form **off**:
  - Before Launch A (prompt 14A), deploy to the password-protected preview: `PUBLIC_LEADS_ENABLED=false ./ops/deploy-site.sh`.
  - After Launch A, deploy publicly: `PUBLIC_LEADS_ENABLED=false RELEASE_MODE=launch ./ops/deploy-site.sh`.
  - Before you ask for approval, show Guri: the list of new and changed URLs, the summary line of every check, the sitemap URL count, and the diff of `vic-veu.yaml`.
- Never, in this prompt: edit nginx or systemd, DNS, `api/`, env flags on the server, installer files, or run `certbot`. If something seems to need one of these, stop and ask.

After a deploy that Guri approved, run these checks and paste the output:

```bash
# While the preview password is on, add --netrc (credentials in ~/.netrc, never pasted into chat)
URL=https://householdrebates.com.au/victoria/air-conditioner-rebate/    # use any page this prompt added or changed
curl -sI "$URL" | head -1                                              # expect: HTTP/2 200
curl -s https://householdrebates.com.au/sitemap-0.xml | grep -c '<loc>'  # expect: the sitemap count given in this prompt's acceptance checks
```

If anything is wrong, run `./ops/rollback.sh site` and tell Guri.

Deploy with `PUBLIC_ALERTS_ENABLED=false`. Sitemap count: unchanged.

## STOP 2: going live (a separate yes from Guri, never bundled with STOP 1)

Only after all of these are true, and Guri types **yes, alerts live**:

1. The lawyer has reviewed the consent wording, the collection notice, the privacy policy section and the email templates, and `ALERTS_REVIEWED_BY` is set.
2. Prompt 29a's `api/` is deployed (its own server STOP) with `ALERTS_ENABLED=true`, `ALERTS_SEND_ENABLED=false`.
3. A live test: Guri subscribes, confirms and unsubscribes with his own address, and the suppression works.
4. Then the site is rebuilt with `PUBLIC_ALERTS_ENABLED=true` and deployed.
5. **Sending a real alert** is yet another yes, per send: show Guri the draft and its sha256; he replies **yes, send <sha256>**; only then set `ALERTS_SEND_ENABLED=true` for that run and use `--confirm`.

## Done when

The form, notice and utility pages are built and tested with the form hidden in production, the privacy section is in the lawyer pack, and the go-live checklist is written down. Commit `feat(review): rule-change alerts sign-up, hidden until approved (29b)`.
