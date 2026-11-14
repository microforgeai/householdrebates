# Prompt 37: North-west corridor page (Sunbury, Diggers Rest, Melton, Gisborne)

> Local first, then a deploy STOP. Adds **1 URL** (map row 56, wave 3). Branch: `feat/pack-37-corridor`.
> **Run order:** after 34, 35a/b and 36.
> References: `docs/url-map.md` Wave 3 row 56 and "Dropped locations" (Melton, Hume); `docs/postcodes.csv`; `docs/eligibility-checker-spec.md` §5.4 and §8 example 1 (3427); `docs/solution-design.md` §5.4 (area pages).

---

## Goal

The pack asks for "north-west corridor pages for Sunbury, Diggers Rest, Melton and Gisborne". The map has **one** page for all four (row 56, `/victoria/north-west-corridor/`), and Melton and Hume are dropped as standalone pages. So this prompt builds one page with a section per town. It adds no town URLs (rule 11; logged as a conflict to Guri).

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

## The page (from the map)

### Row 56: `/victoria/north-west-corridor/`

- **File:** `site/src/content/areas/vic/north-west-corridor.mdx`
- **Template (map):** Area – corridor hub (AreaLayout variant with a postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates apply in Sunbury, Diggers Rest, Melton and Gisborne?
- **Secondary questions (a section or FAQ item each):** Is Diggers Rest in Melton or Hume? · Why is Gisborne 'regional' but Sunbury 'metro'? · Is the Hume council program open? · Can a new estate home get VEU?
- **Priority / intent:** P1 · Intent: Medium-High (local; Guri's own area, fast-growing estates)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Diggers Rest 3427, Sunbury 3429, Bulla 3428, Melton 3335–3338, Caroline Springs 3023: Metropolitan, reticulated gas, Mild, heat pump zone 4 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - North of Sunbury the table changes: New Gisborne 3438 and Riddells Creek 3431 are Metropolitan but Cold (zone 5); Gisborne 3437 is Regional, Cold, zone 5; Clarkefield 3430 has no reticulated gas <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Diggers Rest 3427 spans two councils: about 93% of dwellings in Melton, 7% in Hume <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - NCC climate zone 6 at Diggers Rest, Sunbury and Melton; zone 7 at Gisborne, Riddells Creek, Macedon, Woodend and Kyneton <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Hume Home Energy Upgrades registrations are paused after Yarra Energy Foundation went into voluntary administration; only insulation and draught-proofing registrations made before 19 Oct 2026 continue <https://humeenergyupgrades.org.au/>
  - Hume has a Household Energy Officer for bill help <https://www.hume.vic.gov.au/Residents/Environment/Home-Energy-Help/Energy-bill-support>
  - Replacing a heater or hot water system needs a building more than 2 years old (relevant in new estates) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - From 1 Jan 2027 all new homes must be built all-electric <https://www.solar.vic.gov.au/solar-panel-rebate>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/macedon-ranges/` · `/victoria/melbourne-west/` · `/victoria/melbourne-north/` · `/victoria/postcode/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED. Melton now passes as part of the corridor, not as a page of its own. Insulation: Gisborne 3437 (Regional, Cold) fits Energy Vic's $2,100 example; New Gisborne 3438 (Metropolitan, Cold) fits neither example: about $2,010 by the spec formula (ASSUMPTION: same 150 m² house; provider confirms).

## Steps

1. **Answer first:** the corridor's postcodes aren't all alike in VEU's table: Diggers Rest, Sunbury, Bulla, Melton and Caroline Springs are Metropolitan, gas and Mild; north of Sunbury, New Gisborne and Riddells Creek are Metropolitan but Cold (zone 5), Gisborne is Regional and Cold, and Clarkefield has no reticulated gas. Check yours on `/victoria/postcode/`.
2. **Postcode table** rendered from `postcodes.json` for the row's postcodes (3427, 3429, 3428, 3335–3338, 3023, 3438, 3431, 3437, 3430), with localities and council share (3427: Melton 93% / Hume 7%). Not typed. A `check-postcodes` assertion compares each rendered row with the row's facts; a mismatch is a STOP.
3. **Town sections** (H2 each): Sunbury and Bulla; Diggers Rest (the two-council split); Melton and Caroline Springs; Gisborne, New Gisborne and Riddells Creek (cold, zone 5). Each: what's different in Table A, what that changes (spec §5.4, HPZ-5), and a link to the checker pre-filled with the postcode.
4. **Insulation by postcode:** Gisborne 3437 → the official regional-cold figure; New Gisborne 3438 → `vic-veu-insulation-est-metro-cold` (about 2,010, "(our estimate)", method disclosure); Diggers Rest/Sunbury/Melton → the official metro-mild figure. All via `<Money>`.
5. **New homes:** the 2-year building rule (row fact) and a link to `/victoria/new-homes-all-electric-2027/` (row 39 links here; prompt 34 table).
6. **Council programs** (`councilPrograms`, prompt 34 model): Hume Home Energy Upgrades `status: paused` (YEF voluntary administration; only insulation and draught-proofing registrations made before 19 Oct 2026 continue); Hume Household Energy Officer for bill help (row fact); Melton Living Green Power-Mate loans (map "Dropped locations"); the Macedon Ranges heat pump bulk buy only if still current on the day (review A8: closed to enquiries 31 Oct, installs end 30 Nov 2026; after 30 Nov leave it off). Each with "Status checked {date}".
7. **NCC climate zones** from the row (zone 6: Diggers Rest, Sunbury, Melton; zone 7: Gisborne, Riddells Creek, Macedon, Woodend, Kyneton) with ABCB attribution (CC BY 4.0) and "confirm on the ABCB Climate Map".
8. Links: every row link (macedon-ranges, melbourne-west, melbourne-north, postcode, ceiling-insulation, checker), using `RelatedLinks` for targets not yet enabled; they become required when enabled. `localFacts` ≥ 5 (prompt 27).
9. FAQ 3–5 from the row's secondary questions; schema BreadcrumbList + FAQPage; no `$`.
10. Enable row 56; the checker's area link for 3427, 3428, 3429, 3335–3338, 3430–3438 now resolves here (35a).

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs && node scripts/check-postcodes.mjs
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs
grep -c 'data-figure="vic-veu-insulation-est-metro-cold"' dist/victoria/north-west-corridor/index.html   # expect: ≥ 1
ls dist/victoria | grep -E '^(sunbury|diggers-rest|melton|gisborne|hume)$' | wc -l                      # expect: 0
npx vitest run tests/checker -t "3427"       # expect: example 1 area link = /victoria/north-west-corridor/
```

## What to test by hand

Guri (Diggers Rest) reads the 3427 section and runs the checker from it.

## Open decisions for Guri

- The pack says "pages"; the map has one page. Default: one page with town sections. Separate town pages would need Venture Architect to add rows with ≥ 4 local facts each.
- Whether to mention the Macedon Ranges bulk buy at all given it ends 30 Nov 2026 (default: leave it off if this ships after 30 Nov).

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

The corridor page is live after Guri's yes and the checker links 3427 to it. Commit `feat(area): north-west corridor page (37)`.
