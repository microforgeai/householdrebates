# Prompt 31: "Help in your language" page (map row 72, Wave 4), footer link, and links from the scams and concession pages

> Local only, then a deploy STOP. Branch: `feat/review-31-languages`.
> Run after prompt 34 (map import). Source: `docs/business-review-2026-11-14.md` §2 rows 5 and 7, §7 item 8. Map: `docs/url-map.md` / `docs/url-map.csv` row 72 (corrected 14 Nov 2026) and the Wyndham row (council webinars in six languages). Design: `docs/solution-design.md` §4.4 (accessibility), §10.2.

---

## Context

No page links the official translations. TIS National (131 450) appears only on the scams page. Scams hit multicultural communities and seniors hard. The review's ask is small and specific: **link the official translated material**, give the interpreter number, and show each language name in its own script so people can find their language. **No machine-translated pages.** Any later summary in Punjabi or Hindi is a separate map row and must be written or reviewed by a fluent human.

Also from the review (§2 row 7, seniors): add a short "Seniors: avoid pressure sales" box to the scams and concession pages, linking the translated consumer-rights factsheet. No new page.

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

Page-specific rules:

- **List only what each source shows (corrected 14 Nov 2026).** The two publishers list different languages, so they get separate tables and are never merged into one "available in" list:
  - **Energy Victoria** (VEU consumer-rights factsheet): the page *says* 13 languages but **lists 11**: Arabic, Chinese (Simplified), Chinese (Traditional), Filipino, Greek, Hazaragi, Hindi, Italian, Khmer, Turkish, Vietnamese. There is **no Punjabi or Sinhalese** factsheet. Show the 11 listed; don't repeat the "13" claim. Page last updated 23 Aug 2024 (show that date).
  - **Solar Victoria** (Solar Homes summaries): **14 languages**: Arabic, Dinka, Greek, Hindi, Italian, Nuer, Punjabi, Simplified Chinese, Sinhalese, Spanish, Tamil, Traditional Chinese, Turkish, Vietnamese (plus English). Punjabi and Sinhalese appear here only.
  - Re-open both pages on the day you build. If either list differs from the above, use what the page shows and tell Guri.
  - **ECCV** (the go-electric brochure "in 11 languages"): **UNVERIFIED** (fetch failed 14 Nov 2026). It stays out of the copy, links and FAQ; log it as a TODO.
- **Own-script names from the source only.** Copy each language's own-script name only if the official page shows it. Otherwise use the English name and add the language to the TODO list for a fluent reviewer. Don't type or machine-generate a script name yourself.
- Each own-script name gets the right `lang` attribute (e.g. `lang="pa"` for Punjabi, `lang="hi"`, `lang="zh-Hans"`, `lang="zh-Hant"`, `lang="vi"`, `lang="ar"` with `dir="rtl"`), so screen readers pronounce it.
- Language counts (Energy Victoria 11 listed, Solar Victoria 14) are `count` figures with source and date, or leave the counts out.
- TIS National 131 450: cite Solar Victoria's community languages page, which the row gives as the source. Use the same source on the scams page if it has none.

## Steps

1. Row 72 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.
2. Enable it. `navGroup: support-guides`.
3. Build the page:

### Row 72: `/victoria/help-in-your-language/`

- **File:** `site/src/content/guides/vic/help-in-your-language.mdx`
- **Template (map):** Guide – support (trust)
- **Primary question (build the H1 and answer block on it):** Where can I get information about energy rebates in my language?
- **Secondary questions (a section or FAQ item each):** Which languages are available? · Can I get an interpreter on the phone? · Where is the VEU consumer-rights factsheet in my language? · How do I avoid scams?
- **Priority / intent:** P2 · Intent: Medium (trust; Wyndham, Hume, Melton, Casey)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Energy Victoria says its VEU consumer-rights factsheet is translated into 13 languages; the page lists 11: Arabic, Chinese (Simplified), Chinese (Traditional), Filipino, Greek, Hazaragi, Hindi, Italian, Khmer, Turkish, Vietnamese (no Punjabi or Sinhalese factsheet listed; page last updated 23 Aug 2024) <https://www.energy.vic.gov.au/households/translations>
  - Solar Victoria publishes Solar Homes summaries in 14 languages: Arabic, Dinka, Greek, Hindi, Italian, Nuer, Punjabi, Simplified Chinese, Sinhalese, Spanish, Tamil, Traditional Chinese, Turkish, Vietnamese (plus English) <https://www.solar.vic.gov.au/community-languages>
  - ECCV go-electric brochure in 11 languages: UNVERIFIED (fetch failed 14 Nov 2026), leave off until checked <https://eccv.org.au/projects/empowering-multicultural-communities-at-home/>
  - Free National Translating and Interpreting Service: 131 450 (Solar Victoria page) <https://www.solar.vic.gov.au/community-languages>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/veu-scams-cold-calls/` · `/victoria/concession-card-holders/` · `/victoria/wyndham/` · `/how-quotes-work/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Links only; no machine-translated pages. Any later Punjabi or Hindi summary is a separate map row and must be reviewed by a fluent human. Language names in their own scripts, copied from the official pages. Corrected 14 Nov 2026: Energy Vic lists 11 factsheet languages (not Punjabi/Sinhalese), Solar Victoria lists 14 languages; ECCV UNVERIFIED.

   - Layout: a short answer; "Call an interpreter" (TIS 131 450, how it works in one line); a table per publisher (language in its own script, English name, link to the PDF or page, file type and size if shown); "Avoid scams" (link the translated factsheet and `/victoria/veu-scams-cold-calls/`). No FAQ amounts.
   - Links to PDFs say "(PDF)" in the link text.
4. **Footer:** a site-wide "Help in your language" link.
5. **Inbound links:** from `/victoria/veu-scams-cold-calls/`, `/victoria/concession-card-holders/` and `/victoria/wyndham/` (which already mentions interpreted webinars).
6. **Seniors box** on the scams and concession pages: "Seniors: avoid pressure sales". Three short points from the ESC cold-call ban source the scams page already uses (cold calls and door-knocking banned without express prior consent; take your time; check the provider is accredited), plus the factsheet link.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run build
node scripts/check-urlmap.mjs && node scripts/check-text.mjs && node scripts/check-faqs.mjs && node scripts/check-figures.mjs   # expect: pass; URL count + 1
grep -c 'lang="' dist/victoria/help-in-your-language/index.html        # expect: ≥ the number of own-script names shown
grep -ci 'eccv' dist/victoria/help-in-your-language/index.html          # expect: 0 (UNVERIFIED)
# Energy Victoria table: 11 rows, no Punjabi or Sinhalese; Solar Victoria table: 14 rows
grep -c 'href="/victoria/help-in-your-language/"' dist/victoria/veu-scams-cold-calls/index.html   # expect: ≥ 1 in <main>
npx pa11y-ci dist/victoria/help-in-your-language/index.html            # expect: 0 errors (or the a11y tool from prompt 13)
```

## What to test by hand

- Open every linked PDF and page: it exists, it's the language claimed, and it's the official version.
- Ask a Punjabi or Hindi reader (Guri may know one) to check those two own-script names render correctly. Punjabi appears only in the Solar Victoria table.

## TODO (log it)

- Any language whose own-script name isn't shown on the official page.
- ECCV's multilingual brochure: UNVERIFIED until its page loads and shows the languages; then it needs a map change through Venture Architect before it goes on the page.
- A human-reviewed Punjabi or Hindi summary page: later, as a new map row through Venture Architect.

## Open decisions for Guri

- Who the fluent reviewer is for any future summary page, and whether that costs anything (no spend without his yes).

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

Sitemap count: the previous count + 1.

## Done when

The page links every official translation with correct `lang` attributes, the footer and three pages link to it, the seniors box is on two pages, every check passes and Guri has said yes. Commit `feat(review): help in your language page (31)`.
