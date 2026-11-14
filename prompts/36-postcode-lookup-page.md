# Prompt 36: One postcode lookup page (`/victoria/postcode/`), not 719 pages

> Local first, then a deploy STOP. Adds **1 URL** (map row 54, wave 2). Branch: `feat/pack-36-postcode`.
> **Run order:** after 34 (postcodes.json) and 35a (shared `area.ts`). Before 37–39, whose hubs link here.
> References: `docs/url-map.md` Wave 2 row 54 and "Method notes" (postcodes.csv); `docs/postcodes.csv` (master, read-only); `docs/eligibility-checker-spec.md` §4 R2 ("Your area" card) and §5.4 (insulation by postcode); `docs/solution-design.md` §4.3 (no doorway pages), §5.4.

---

## Goal

A single static page that answers "Is my postcode metro or regional for VEU, and does it have mains gas?" for all 719 VEU Table A postcodes, with a client-side search. It does **not** generate a page per postcode (doorway risk; map note). The checker reuses the same data and card.

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

Rule 11 applies with force here: no `/victoria/postcode/3427/`-style URLs, no query-string pages in the sitemap, `noindex` isn't a workaround. `check-urlmap` fails on any built path under `/victoria/postcode/` other than the page itself.

## The page (from the map)

### Row 54: `/victoria/postcode/`

- **File:** `postcode.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/postcode/` by the same route
- **Template (map):** Tool – postcode lookup (static; data from postcodes.csv)
- **Primary question (build the H1 and answer block on it):** Is my postcode metro or regional for VEU, and does it have mains gas?
- **Secondary questions (a section or FAQ item each):** What climate region is my postcode? · Which heat pump zone am I in? · Which council am I in? · Which insulation figure applies to me?
- **Priority / intent:** P1 · Intent: High (every visitor's first local question)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - VEU Specifications v25.0 Table A lists 719 Victorian postcodes: 281 Metropolitan / 438 Regional; 406 with reticulated gas / 313 without; climate 404 Mild / 268 Cold / 47 Hot; heat pump zone 4: 608, zone 5: 111 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Locality and council for each postcode from ABS mesh-block allocation files, weighted by 2021 Census dwellings (25 PO-box postcodes have no dwellings; council shown as indicative) <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - Insulation savings use climate region (Mild 0.00576, Cold 0.00771, Hot 0.00546 t CO2-e/m²/yr) × regional factor (Metropolitan 0.98, Regional 1.04) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Energy Vic's insulation examples: up to $1,500 metro (mild), up to $2,100 regional (cold) for a 150 m² house <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/eligibility-checker/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/get-off-gas-planner/` · `/victoria/lpg-homes/` · `/victoria/melbourne/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** One page with a client-side search over postcodes.csv. Result card: area, gas, climate, HP zone, localities, council, then a link to the matching hub or council page. Don't generate 719 per-postcode pages (doorway risk). The checker reuses the same data at its postcode step.

## Steps

1. **Static content first (works without JS):**
   - H1 and a 2–4 sentence answer: Victoria's VEU Specifications classify every postcode as Metropolitan or Regional, with or without mains (reticulated) gas, in a Mild, Cold or Hot climate region and heat pump zone 4 or 5; these change some discount calculations; enter your postcode below.
   - The statewide counts from the row (719 postcodes: 281 Metropolitan / 438 Regional; 406 with reticulated gas / 313 without; 404 Mild / 268 Cold / 47 Hot; zone 4: 608, zone 5: 111) rendered from `postcodes.json` at build time, not typed, and `check-postcodes` asserts they equal the row's numbers (a mismatch is a STOP: the map and CSV disagree).
   - "What each column means": VEU area, gas, climate region, heat pump zone, council (ABS allocation, weighted by 2021 dwellings; 25 PO-box postcodes have no dwellings and their council is indicative), with what each changes (spec §5.4: insulation; heat pump zone: hot water savings; no gas: the gas-related lines).
   - Insulation by postcode type: the two official Energy Victoria examples via `<Money>` and the three prompt-34 estimates, labelled "(our estimate)", with the method disclosure. No other pairing gets a number.
   - A no-JS fallback: a `<details>` per VEU area/climate combination listing its postcodes as plain numbers (no links, no localities). Postcodes aren't links to anywhere.
2. **Search (Preact island, under 15 KB gzipped):** one input (4 digits, numeric keypad) or a locality name (typeahead over the CSV `localities`). Fetches the same compact `/data/postcodes.v{hash}.json` as the checker (35b). Result card = the checker's "Your area" card component (shared): localities, council(s) with share, area, gas, climate, zone, then:
   - "Check your discounts for this postcode" → `/victoria/eligibility-checker/?pc=3427` (the checker pre-fills R2 and starts at S1; the query string is excluded from the sitemap and canonical).
   - "More about your area" → the area/hub page for the CSV `primary_lga` from 35a `links.ts` (enabled rows only).
   - A no-gas postcode adds the GAS-NO line from the spec (link to `/victoria/lpg-homes/` once enabled, else `/victoria/get-off-gas-planner/`); a zone-5 postcode adds the HPZ-5 note. Text from the spec, no figures.
   - Not found → spec message X1.
   - Nothing typed is stored, logged or sent.
3. **Freshness and source:** "From VEU Specifications v25.0 Table A; councils from ABS ASGS Edition 3 allocation files, weighted by 2021 Census dwellings. Checked {date}." The page's `checkedOn` is the CSV's (14 Nov 2026) and the 45-day rule applies; a stale CSV fails the build like a stale figure.
4. **Schema:** BreadcrumbList, FAQPage. No `Dataset`, `Place` or `LocalBusiness`. No `$`.
5. **FAQ (3–5, with `canonicalPage`):** the row's secondary questions (climate region, heat pump zone, council, which insulation figure applies). Answers link to sections; no amounts.
6. **Inbound links:** every row that lists `/victoria/postcode/` (row 26 from prompt 34's table, 56–64, the LPG page (row 74), the checker, the footer from prompt 33). At least 2 inbound links on enable.
7. **Enable row 54** in `rollout.json` and run the checks.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs     # expect: +1 URL; 0 paths under /victoria/postcode/ besides the page
find dist/victoria/postcode -name index.html | wc -l      # expect: 1
node scripts/check-postcodes.mjs  # expect: 719 rows; counts 281/438, 406/313, 404/268/47, 608/111 match the row
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-figures.mjs
grep -c '<a [^>]*href="/victoria/postcode/3' dist/victoria/postcode/index.html   # expect: 0
npx playwright test tests/e2e/postcode.spec.ts
# expect: 3427 → Diggers Rest card + corridor link (or fallback); 3438 → Cold, zone 5, estimate line; 3430 → no gas line; "Gisborne" typeahead → 3437; 2000 → X1; works with JS off (details lists)
```

## What to test by hand

Guri looks up 3427 and two postcodes he knows on a phone and compares the card with the CSV row.

## Open decisions for Guri

- Locality typeahead: include it (default) or postcode-only.

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

Sitemap count: +1.

## Done when

`/victoria/postcode/` is live after Guri's yes, with no per-postcode URLs. Commit `feat(postcode): single postcode lookup page (36)`.
