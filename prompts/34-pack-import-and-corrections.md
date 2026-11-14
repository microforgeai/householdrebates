# Prompt 34: Import the 74-URL pack (map, postcodes.csv, checker spec) and fix the data and copy it corrects

> Local only, then a deploy STOP. Branch: `feat/pack-34-import-corrections`.
> **Run order:** straight after prompt 24 (and before 25–33 and 35–39). It's the foundation for every later prompt: it imports the 74-row map, adds `basis: estimate` figures, the council-program status model and list-format rollout. It enables **no new URL** (rows 54–74 stay off until their prompts run).
> Inputs (copy into `docs/` from the planning folder, unchanged): `url-map.md`, `url-map.csv` (74 rows, with a `facts_checked_on` column), `postcodes.csv` (all 719 VEU v25.0 Table A postcodes; the master list), `eligibility-checker-spec.md`, `business-review-2026-11-14.md`. Map sections used: "Rule changes and corrections found (13–14 Nov 2026)" items 1, 3, 11–14; "Dropped locations"; "Method notes"; "Changes needed on existing pages"; "Facts to re-check monthly". Spec: §2.1 (weather sealing), §5.2 RD-1/RD-2, §5.4 (insulation estimates), §9 (UNVERIFIED). Design: `docs/solution-design.md` §5.3, §5.4, §15.

---

## Context

Venture Architect replaced the map on 14 Nov 2026: **74 URLs = 16 live + 58 new** (Wave 1: 19, Wave 2: 12, Wave 3: 17, Wave 4: 10). The new rows are 54 `/victoria/postcode/`, 55 `/victoria/business-energy-upgrades/`, 56 `/victoria/north-west-corridor/`, 57 `/victoria/macedon-ranges/`, 58 `/victoria/mitchell/`, 59 `/victoria/latrobe-valley/`, 60 `/victoria/mildura/`, 61–64 the north, west, east and south-east Melbourne hubs, and Wave 4 (rows 65–74, from the business review): the 4 business pages, battery rebate, solar panel rebate, other VEU discounts, help in your language, `/about/gurinder-singh/` and LPG homes. Rows 1–53 changed only in added internal links (table in C9), the location rows' postcode facts (now taken from postcodes.csv; C10), Shepparton (48) and Solstice (53).

**`postcodes.csv` is the master list. Never regenerate it.** Venture Architect says `postcode_mkcsv.py` doesn't reproduce it. Prompt 16 built `src/data/vic-veu-postcodes.json` by parsing the SPEC25 PDF with `extract-veu-postcodes.mjs`. From now on the CSV is the source, and the PDF parse is only a cross-check. The map agrees (its summary: "maintained by hand and never regenerated"; the old "regenerate postcodes.csv" re-check line is gone). On a new VEU Specifications version, stop and ask Guri to get an updated CSV from Venture Architect.

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

### A. Import

1. Copy the five input files into `docs/` unchanged. Commit them on their own (`docs: 74-URL pack, 14 Nov 2026`).
2. `npm run import:urlmap`: update the script's expected totals to **74 rows (wave0 16, wave1 19, wave2 12, wave3 17, wave4 10)** and accept the `facts_checked_on` column (store it per row as `factsCheckedOn`). Gated rows: Shepparton (48) stays `gated` until Guri decides (step D6).
3. **Rollout list format:** `rollout.json` `enabledRows` becomes a list of ranges, e.g. `"1-47,49-53"` (or `"1-53"` if Shepparton was released). Update `check-urlmap`, `HubIndex`, the sitemap filter and `build-llms.mjs` to parse it. Rows 54–74 are **not** enabled here.
4. **Postcodes:** copy `docs/postcodes.csv` to `site/src/data/postcodes.csv` byte for byte (check the sha256 matches). A build step (`scripts/build-postcodes.mjs`) turns it into `src/data/postcodes.json` (all 12 columns; `dwellings_2021` and `primary_lga_share_pct` as numbers; `other_lgas` parsed into `[{lga, pct}]`). Cross-check against the existing `vic-veu-postcodes.json` from prompt 16 on the four VEU columns (area, gas, climate, heat pump zone) for all 719 postcodes. **Any mismatch: stop and tell Guri** (don't pick one). If they match, point every consumer (checker, area tables, Geelong note) at `postcodes.json` and retire `vic-veu-postcodes.json` (keep `extract-veu-postcodes.mjs` as `scripts/crosscheck-veu-postcodes.mjs` only). The CSV's freshness: its `checkedOn` is the map's 14 Nov 2026 under the 45-day rule (add `postcodes.csv` to the re-check register).
5. **Checker spec:** copy only; prompt 35 rebuilds the checker.

### B. Data model additions

1. **Estimates** (spec §5.4; map "Rule changes" item 3). Add to figures: `basis: z.enum(['official', 'estimate']).default('official')`; for `estimate`: required `method` (one sentence), `basedOn` (source id, here SPEC25 Part 48 and the Energy Victoria insulation examples), and `kind: discount`. `Money` renders an estimate as "about $1,590 (our estimate)" and the block variant adds "Our calculation from VEU Specifications v25.0, Part 48. The accredited provider confirms the amount." An estimate may never be a hero without the word "estimate" in its label (`check-figures`). Add three figures:

   | id | scenario | amount | basis |
   |---|---|---|---|
   | `vic-veu-insulation-est-regional-mild` | Ceiling insulation, 150 m², Regional + Mild postcode (e.g. Geelong, Latrobe Valley, Bacchus Marsh) | about 1,590 | estimate |
   | `vic-veu-insulation-est-metro-cold` | Ceiling insulation, 150 m², Metropolitan + Cold postcode (e.g. New Gisborne 3438, Riddells Creek 3431, Dandenong Ranges) | about 2,010 | estimate |
   | `vic-veu-insulation-est-regional-hot` | Ceiling insulation, 150 m², Regional + Hot postcode (e.g. Mildura, Swan Hill) | about 1,510 | estimate |

   Method text (from spec §5.4): "GHG savings for the climate region (Mild 0.00576, Cold 0.00771, Hot 0.00546) × area × 25 × regional factor (Metropolitan 0.98, Regional 1.04), scaled to Energy Victoria's two published examples (metro mild up to $1,500, regional cold up to $2,100)." Re-check the coefficients in SPEC25 Part 48 (Tables 48.4–48.5) before you set `checkedOn`; if they differ, stop.
2. **Council-program status** (review A8, map item 12): `areaExtra.councilPrograms: [{ name, operator?, status: 'open' | 'paused' | 'closing' | 'closed' | 'unverified', statusNote, statusCheckedOn, sourceId }]`. `check-council-status.mjs` (post-build) fails when a program is shown with `status: open` and `statusCheckedOn` older than 45 days, when `unverified` is rendered at all, or when a program's copy uses "open", "available now" or "apply now" without `status: open`. Each shown program renders "Status checked {date}".
3. **Retired activities:** `check-copy` fails on "Residential Efficiency Scorecard" unless the sentence also contains "closed" or "no longer" (map item 13: closed 23 Jun 2026, Spec Part 45).

### C. Corrections (each one: re-open the source, then change data and copy)

1. **Co-payments (map item 1; SPEC25 Part 6).** From 30 Sep 2026 the $3,000 incl GST minimum applies to **every ducted system of any capacity**, and to **multi-splits of 10 kW or more**; multi-split under 10 kW $1,000; single non-ducted 10 kW or more $1,000; single non-ducted under 10 kW $200. Check every figure `scenario` in `vic-veu-copayments`, every page that mentions co-payments (AC, reverse-cycle timing, co-payment page, ducted guides, splits guide, landlords, checker results from prompt 16) and every FAQ. Fix wording that implies size matters for ducted (e.g. "larger ducted systems", "ducted systems over 10 kW") or that groups multi-splits under 10 kW with the $3,000 band. `/victoria/veu-minimum-co-payment/` currently says "higher household co-payments apply to larger split systems, multi-splits, and all ducted…": rewrite it to the exact bands. No amount changes.
2. **Geelong insulation (map "Changes needed on existing pages").** Replace "which example applies depends on how the program treats your postcode" with: Greater Geelong's 14 postcodes (3212–3227 except 3221, Surf Coast, and 3225, Queenscliffe) are all Regional and Mild in Table A, so neither published example fits exactly; "about $1,590 (our estimate)" via `vic-veu-insulation-est-regional-mild`, with the two official examples shown for context, and "the accredited provider confirms". Never $2,100 for Geelong. Add the Geelong Sustainability Electric Homes Program 2026–27 (Greater Geelong, Surf Coast, Golden Plains, Colac Otway, Queenscliffe; EOI opened 5 Oct 2026; source GEELEHL) as a `councilPrograms` entry with its status checked. Prompt 15's "conflict" log entry about Geelong is now resolved: note it in `docs/expansion-log.md`.
3. **Hume and Yarra Energy Foundation (map item 12; review A8).** Yarra Energy Foundation is in voluntary administration (ASIC notice published 10 Nov 2026). Hume Home Energy Upgrades registrations are paused; only insulation and draught-proofing registrations made before 19 Oct 2026 continue (source HUMEUPG, checked 14 Nov 2026). The built site doesn't mention the Hume council program (the "Hume" on `/victoria/find-an-accredited-provider/` and the provider counts is Energy Victoria's **Hume region**, which is unrelated: don't touch it). So: add the program as `status: paused` data for the corridor and north hub pages (prompts 37, 39), and re-check every YEF-linked program before it's quoted (map item 12). Also record Darebin (paused) and the Macedon Ranges heat pump bulk buy (closed to enquiries 31 Oct, installs end 30 Nov 2026; t2zero) as status data for the pages that may mention them. Re-check the Council Home Energy Program used on `/victoria/whittlesea/` (it still lists 12 councils, map item 12) and set its `statusCheckedOn`.
4. **Residential Efficiency Scorecard (map item 13).** The crawl shows no mention. Keep it that way with the `check-copy` rule above; prompt 30 adds the one "no longer offered" line.
5. **Solstice towns (row 53, now with postcodes and councils).** Update `/victoria/solstice-gas-shutdown-towns/`: all 10 towns with postcode and council (Marong 3515 and Heathcote 3523, Greater Bendigo; Swan Hill 3585 and Robinvale 3549, Swan Hill; Maldon 3463, Mount Alexander; Kerang 3579, Gannawarra; Nathalia 3638, Moira; Terang 3264, Corangamite; Lakes Entrance 3909 and Orbost 3888, East Gippsland), and the Table A line (all 10 Regional with no reticulated gas; Cold: 3515, 3523, 3463, 3638; Hot: 3585, 3549, 3579; Mild: 3264, 3909, 3888). Render the postcode table from `postcodes.json`, not typed. `areaExtra.postcodes` gets all 10. This closes open decision 19 ("Solstice towns").
6. **Shepparton (row 48): re-open prompt 22's gate. Cite GMCA only.** Goulburn Murray Solar Savers is confirmed through GMCA (gmca.org.au, Feb 2026 notice, checked 14 Nov 2026; vetted providers for solar, batteries, heat pump hot water, split systems, insulation, draught proofing and assessments; Shepparton and 6 other GMCA councils). The Greater Shepparton council's own Solar Savers page is **not verified** (504 on 13 and 14 Nov 2026), and the map row and spec §9 now both say so: never cite or link it, even if it loads on the day (a newly loading page goes to Venture Architect through Guri first). Shepparton is Regional + Cold, so the regional cold insulation example applies. Do this:
   - Re-run prompt 22's **Part 1** (verification) against the new row 48 facts, using GMCA as the **only** program source (`kind: council-program`, `councilPrograms` status `open` only if the GMCA page still shows the program, with today's `statusCheckedOn`).
   - Build the page as prompt 22 describes, but leave it **gated** (`gatedApproved` unchanged).
   - **STOP: Guri decides** one of: (a) release with the GMCA-sourced program; (b) release without the program; (c) keep gated. The release is a one-line `rollout.json` change after his yes, then the deploy STOP.
7. **Electrification-standards URL (map "Rule changes" item 5 from 13 Nov; live as of 14 Nov 2026 per Venture Architect).** Confirm source `energyvic-electrification` and its sub-pages (EVEXIST, EVNEW, EVRENTAL) use `https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings…`, that `check-sources` gets 200 (or a CHALLENGE you open by hand), and that no old `/households/electric-and-efficiency-standards-for-buildings` URL remains anywhere (`grep -RIl`).
8. **Weather sealing by home type (EVSEAL, page updated 11 Nov 2026; spec §2.1, RD-1, RD-2).** Energy Victoria's examples depend on the home type, each at a 2-year / 5-year minimum warranty: **apartment $70 / $140; townhouse $280 / $560; house $350 / $700**. The site's house figures (`vic-veu-sealing-house-*`, prompt 16) are right. Add the apartment and townhouse figures (`vic-veu-sealing-apartment-2yr|5yr`, `vic-veu-sealing-townhouse-2yr|5yr`, `kind: discount`, source EVSEAL, `checkedOn` the day you re-open it) and render all three as one labelled `FigureTable` on `/victoria/draught-proofing-rebate/` and wherever weather sealing amounts appear (renters, landlords, apartments, Casey). Never show $700 alone; apartments see the apartment row first on the apartments page. Add the exclusion (spec RD-2, message N-SEAL-GAS): homes with an open-flued gas space heater, an open-flued ducted heater in a cupboard, an indoor open-flued water heater or a flueless space heater can't get the discount (carbon monoxide risk); the provider checks appliances first. If the page shows different amounts on the day, stop and tell Guri.
9. **Internal links the new map adds to built pages** (rows 17–53). Add the ones whose target is already built now; the rest become required automatically when their target's row is enabled (`check-urlmap`):

   | Built by prompt | Row | Page | Links added by the 14 Nov map |
   |---|---|---|---|
   | 17 | 18 | `/victoria/ducted-gas-to-ducted-reverse-cycle/` | `/victoria/electric-heater-to-reverse-cycle/` (now) |
   | 17 | 20 | `/victoria/gas-room-heater-to-split-system/` | `/victoria/electric-heater-to-reverse-cycle/` (now) |
   | 17 | 26 | `/victoria/ceiling-insulation-rebate/` | `/victoria/postcode/` (prompt 36) |
   | 18 | 27 | `/victoria/what-is-a-veec/` | `/victoria/business-energy-upgrades/` (prompt 28) |
| 18 | 30 | `/victoria/veu-vs-solar-homes/` | `/victoria/battery-rebate/`, `/victoria/solar-panel-rebate/` (prompt 30) |
| 18 | 31 | `/victoria/veu-scams-cold-calls/` | `/victoria/help-in-your-language/` (prompt 31) |
   | 18 | 29 | `/victoria/can-you-claim-veu-twice/` | `/victoria/already-installed-retrospective-discount/` (now) |
   | 18 | 32 | `/victoria/gas-hot-water-broken-before-or-after-march-2027/` | `/victoria/already-installed-retrospective-discount/` (now) |
   | 19 | 36 | `/victoria/renters/` | `/victoria/already-installed-retrospective-discount/` (now) |
   | 19 | 38 | `/victoria/concession-card-holders/` | `/victoria/electric-heater-to-reverse-cycle/` (now) |
   | 19 | 39 | `/victoria/new-homes-all-electric-2027/` | `/victoria/north-west-corridor/` (prompt 37) |
   | 20 | 41 | `/victoria/gas-vs-heat-pump-running-costs/` | `/victoria/mildura/` (prompt 38) |
   | 20 | 42 | `/victoria/heat-pump-hot-water-size-guide/` | `/victoria/macedon-ranges/` (prompt 38) |
   | 20 | 43 | `/victoria/get-off-gas-planner/` | `/victoria/latrobe-valley/`, `/victoria/mitchell/` (prompt 38) |
| 19 | 44 | `/victoria/draught-proofing-rebate/` | `/victoria/other-veu-discounts/` (prompt 30) |
   | 21 | 46 | `/victoria/ballarat/` | `/victoria/business-energy-upgrades/` (28), `/victoria/latrobe-valley/` (38) |
   | 21 | 47 | `/victoria/bendigo/` | `/victoria/shepparton/` (when released) |
   | 21 | 49 | `/victoria/wyndham/` | `/victoria/melbourne-west/` (39) |
   | 21 | 50 | `/victoria/casey/` | `/victoria/melbourne-south-east/` (39) |
   | 21 | 51 | `/victoria/whittlesea/` | `/victoria/melbourne-north/` (39) |
   | 21 | 52 | `/victoria/yarra-ranges/` | `/victoria/melbourne-east/` (39) |
   | 21 | 53 | `/victoria/solstice-gas-shutdown-towns/` | `/victoria/shepparton/` (when released), `/victoria/mildura/` (38) |

10. **Location rows now match postcodes.csv (map revised 14 Nov 2026).** Venture Architect corrected the postcode facts in the location rows, so the cross-check is expected to **pass**. Rebuild each live area page's postcode table from `postcodes.json` (filter by `primary_lga`), not typed:
    - Ballarat (46): 8 postcodes, all Regional and Cold (3353 and 3354 are PO-box postcodes with no reticulated gas).
    - Bendigo (47): 11 postcodes, all Regional, Cold, zone 4 (no reticulated gas: 3515, 3523, 3557, 3558, 3570 and PO-box 3552, 3554).
    - Shepparton (48, gated): 13 postcodes, all Regional, Cold, zone 4.
    - Yarra Ranges (52): 26 postcodes, all on gas, 15 Cold, zone 5 at 3139, 3140, 3158, 3160, 3770, 3775, 3777; Warburton 3799 the only Regional one.
    - Geelong (live): Greater Geelong's 14 postcodes, 3212–3227 **excluding 3221 (Surf Coast) and 3225 (Queenscliffe)**.
    - Rows 57–60 (built in prompt 38): Mildura 12 postcodes; Mitchell includes 3661 (no reticulated gas); Latrobe includes 3841 (no reticulated gas).

    Add `scripts/check-postcodes.mjs`: for every location row, the postcodes, counts and gas/climate/zone values stated in the row's facts must equal `postcodes.csv`. Expected result today: **0 differences**. A difference from now on is a STOP (tell Guri; he sends it to Venture Architect); never edit the CSV or the row to make it pass.
11. **Prompt 23 changes** (prompt 23 now ends with a "14 Nov 2026 addendum" that says the same; record the change in `docs/expansion-log.md` too): its URL counts ("52 or 53") become "the enabled row count"; step 3.2 no longer re-runs the PDF extract as a generator (postcodes.csv is the master; a new spec version means a STOP to get a new CSV from Venture Architect); its register also covers `rule-status.json` (prompt 24), estimate figures (method re-check), `councilPrograms` statuses and the checker rules' sources (prompt 35).
12. **The rest of the map's "Changes needed on existing pages" table.** Confirm each is already done (prompts 15 and 18 covered them); fix any that isn't: `/victoria/heat-pump-rebate/` states the Solar Homes $150,000 income cap (from 1 Jul 2026), property under $3m and system at least 3 years old; `/victoria/gas-to-electric-hot-water-2027/` has no UNVERIFIED exemptions note and links `/victoria/gas-hot-water-ban-exemptions/`; the home page links `/victoria/` and the Wave 1 money pages. The `/victoria/melbourne/` rescope is prompt 39; the checker rebuild is prompt 35.
13. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run import:urlmap
# expect: "url-map: 74 rows (wave0 16, wave1 19, wave2 12, wave3 17, wave4 10); 0 errors"
sha256sum ../docs/postcodes.csv src/data/postcodes.csv       # expect: identical
node scripts/build-postcodes.mjs && node scripts/crosscheck-veu-postcodes.mjs
# expect: "postcodes: 719 rows; 0 mismatches against the SPEC25 parse"
npm run check && npm run build
node scripts/check-figures.mjs      # expect: 0 stale, 0 unlabelled heroes, 3 estimates, every estimate labelled
node scripts/check-postcodes.mjs    # expect: every location row matches postcodes.csv (0 differences; Mildura 12, Mitchell incl. 3661, Latrobe incl. 3841, Geelong 14 without 3221/3225)
grep -c 'data-figure="vic-veu-sealing-apartment-2yr"' dist/victoria/draught-proofing-rebate/index.html   # expect: ≥ 1 (all three home types shown)
grep -ci 'open-flued\|flueless' dist/victoria/draught-proofing-rebate/index.html                           # expect: ≥ 1 (RD-2)
grep -rl 'greatershepparton.com.au' dist | wc -l                                                                # expect: 0 (GMCA only)
node scripts/check-urlmap.mjs       # expect: URL count unchanged (52, or 53 if Shepparton released), 0 missing links to enabled targets
node scripts/check-council-status.mjs && node scripts/check-copy.mjs && node scripts/check-sources.mjs
grep -c 'data-figure="vic-veu-insulation-est-regional-mild"' dist/victoria/geelong/index.html   # expect: ≥ 1
grep -c '2,100' dist/victoria/geelong/index.html          # expect: only inside the "official examples for context" block (inspect)
grep -o '3[0-9]\{3\}' dist/victoria/solstice-gas-shutdown-towns/index.html | sort -u | wc -l     # expect: ≥ 10
grep -RIl 'households/electric-and-efficiency-standards-for-buildings' src dist | wc -l           # expect: 0
grep -RIn 'larger ducted\|ducted systems over' dist | wc -l                                        # expect: 0
```

## What to test by hand

- Guri reads the co-payment wording on the co-payment page and the AC page against SPEC25 Part 6 (page 29).
- Guri reads the Geelong estimate and its method text.

## Open decisions for Guri

- **Shepparton release:** (a) with the GMCA-sourced program, (b) without it, (c) keep gated.
- Geelong wording: the spec's "about $1,590 (our estimate)" (default) or the map's "about $1,500–$1,600, provider confirms".

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

Sitemap count: unchanged (52, or 53 if Guri released Shepparton).

## Done when

The pack is in `docs/`, the map imports at 74 rows, postcodes come from the CSV and match the PDF parse, the corrections are made and Guri has decided on Shepparton and approved the deploy. Commit `feat(pack): import 74-URL pack and apply its corrections (34)`.
