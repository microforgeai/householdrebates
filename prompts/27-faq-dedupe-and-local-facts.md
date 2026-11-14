# Prompt 27: Split up the shared FAQ library: each Q&A on one canonical page, 3–5 unique FAQs per page, overlap below 25%

> Local only, then a deploy STOP. Branch: `feat/review-27-faq-dedupe`.
> Run after prompt 26 (FAQ answers already support links). Best after prompt 34 too, so Geelong's insulation estimate is in the data file.
> Source: `docs/business-review-2026-11-14.md` §6 "Near-duplicates" and "Schema", §7 item 4, Appendix B (method). Map: `docs/url-map.md` (no new URLs; Melbourne's rescope is in prompt 39). Design: `docs/solution-design.md` §5.5 (`faqs`), §10.2 (`FAQPage` only where the Q&As are visible). Data: `docs/postcodes.csv` (read-only).

---

## Context

The review measured overlap with 6-word shingles after removing shingles found on more than 30% of pages (site-wide boilerplate). Results on the 14 Nov crawl: `/` vs `/faq/` **53%**; Frankston vs Melbourne 44%; Frankston vs Geelong 43%; Geelong vs Mornington Peninsula 41%; `/faq/` vs `/victoria/heat-pump-rebate/` 42%. The cause is the shared FAQ library: the same 5–6 Q&As ("Can I claim after installation?", "Why does the discount vary?", "Are rentals eligible?" and similar) repeat across about 25 pages, each with its own `FAQPage` markup. 48 of the 52 crawled pages carry `FAQPage`.

The review doesn't say which overlap formula it used. This prompt uses **Jaccard** (|A∩B| / |A∪B|) on the filtered shingle sets and also prints containment (|A∩B| / min(|A|,|B|)) for information. The target applies to Jaccard. If Guri or Venture Architect prefers containment, change one constant.

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

1. **Schema** (`faqs` in `content.config.ts`, update design §5.5): replace `pages: string[]` with `canonicalPage: string` (one URL) plus optional `alsoLinkFrom: string[]`. A FAQ renders in full, and goes into `FAQPage`, only on its `canonicalPage`. On an `alsoLinkFrom` page it renders as a one-line link ("Can I claim after installation? →") to `canonicalPage#faq-<id>`, and it is **not** in that page's `FAQPage`.
2. **Assign canonicals.** Rules:
   - General VEU questions → `/faq/` (e.g. "Is this a government website?", "How do you make money?", "How often are the figures checked?").
   - Topic questions → their topic page: "Can I claim after installation?" → `/victoria/already-installed-retrospective-discount/`; "Why does the discount vary?" → `/victoria/what-is-a-veec/`; "Are rentals eligible?" → `/victoria/renters/`; "Do I have to pay something?" → `/victoria/veu-minimum-co-payment/`; "Will someone call me?" → `/victoria/veu-scams-cold-calls/`.
   - `/` keeps no copy of a `/faq/` Q&A; it links to `/faq/`. Home gets 3 questions of its own about the site's scope (which state, which programs, what the checker does).
   Put the full assignment table in the PR for Guri.
3. **Write unique FAQs.** Each page ends with 3–5 FAQs whose `canonicalPage` is that page. Build each question from the page's map row (secondary questions first) and answer only from the row's facts and the page's sources. No `$` in answers (link to the section that shows the figure). Location pages get local questions (council program, postcode classification, gas network status), not generic VEU ones.
4. **Local facts on the four original location pages** (`areaExtra.localFacts` min 5 for them; raise the schema min from 4 to 5 for every area page and fix any that fall short):
   - **Frankston:** from `postcodes.csv`, its 5 postcodes with localities and council share, all Metropolitan, mains gas, Mild, heat pump zone 4; plus the page's existing sourced council facts.
   - **Mornington Peninsula:** from `postcodes.csv`, its 25 postcodes (localities, council share; all Metropolitan, mains gas, Mild, zone 4); plus existing sourced facts.
   - **Geelong:** from `postcodes.csv`, its 14 Greater Geelong postcodes: Regional, Mild, zone 4, with **one postcode listed as having no reticulated gas** (name it from the CSV); Geelong Sustainability's Electric Homes Program 2026–27 (map, "Changes needed on existing pages", source GEELEHL); and the insulation estimate from prompt 34 (labelled "our estimate").
   - **Melbourne:** leave its local facts to prompt 39 (the inner-Melbourne rescope to 52 postcodes). Only remove its shared FAQs here.
   Table A classification facts count as local only when they differ from inner Melbourne or are listed per postcode (design §5.4 rule). If a page still has fewer than 5 sourced local facts, stop and log it for Venture Architect; don't pad.
5. **Overlap check** `site/scripts/check-overlap.mjs` (post-build): visible text of `<main>` per page, lower-cased, 6-word shingles; drop shingles on more than 30% of pages; Jaccard per pair. Fail if any pair is 25% or more. Print the top 10 pairs with Jaccard and containment. Allow-list file `site/scripts/overlap-allow.json` (start empty; every entry needs a reason and Guri's initials).
6. **FAQ check** (extend `check-schema` or add `check-faqs.mjs`): each FAQ id appears in exactly one page's `FAQPage`; every `FAQPage` question is visible on that page; every built page with a FAQ has 3–5 canonical FAQs; no `$` in any answer.
7. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run build && node scripts/check-overlap.mjs
# expect: "check-overlap: <n> pages, max Jaccard < 0.25 (pair …), 0 allow-listed"
node scripts/check-faqs.mjs     # expect: "check-faqs: <n> FAQs, each in exactly 1 FAQPage, 0 pages outside 3–5, 0 $ answers"
node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-figures.mjs && node scripts/check-urlmap.mjs && node scripts/check-rule-status.mjs
# expect: all pass; URL count unchanged
node -e "const a=require('./dist/_overlap.json');console.log(a.find(p=>p.a==='/'&&p.b==='/faq/'))"   # expect: jaccard < 0.25 (was 0.53 by the review's method)
```

## What to test by hand

- Read the FAQ block on `/`, `/faq/`, Frankston, Geelong and Mornington Peninsula. No question repeats in full across them.
- Follow 5 "→" FAQ links: each lands on the right answer (`#faq-<id>`) and the answer is visible.
- Validate 3 pages' `FAQPage` with validator.schema.org.

## Open decisions for Guri

- Jaccard vs containment as the 25% metric (Jaccard by default).
- The canonical assignment table (PR).

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

Sitemap count: unchanged.

## Done when

Every Q&A lives on one page, each page has 3–5 of its own, the four original area pages have at least 5 sourced local facts (Melbourne via prompt 39), overlap is below 25%, every check passes and Guri has said yes. Commit `refactor(review): one canonical page per FAQ, unique FAQs, overlap check (27)`.
