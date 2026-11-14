# Prompt 39: Metro hubs (north, west, east, south-east) and `/victoria/melbourne/` as the inner-Melbourne hub

> Local first, then a deploy STOP. Adds **4 URLs** (map rows 61–64, wave 3) and rescopes one live page (row 14, `/victoria/melbourne/`). Branch: `feat/pack-39-metro-hubs`.
> **Run order:** after 34, 35a/b, 36, 37 and 38. Prompt 33 (internal links and footer) runs after this.
> References: `docs/url-map.md` Wave 3 rows 61–64, "Changes needed on existing pages" (`/victoria/melbourne/`, two rows), "Dropped locations" (Hume, Cardinia, the Inner South East hub) and "Method notes" (Plan Melbourne regions); `docs/postcodes.csv`; `docs/solution-design.md` §5.4.

---

## Goal

Five metro hubs grouped by Plan Melbourne region (by CSV `primary_lga`), each with a full postcode table from `postcodes.csv`, what differs in VEU's table, and the council programs with status. `/victoria/melbourne/` keeps its URL and becomes the **inner-Melbourne** hub (Inner Metro + Inner South East: Melbourne, Port Phillip, Yarra, Stonnington, Glen Eira, Boroondara, Bayside = **52 postcodes**, all Metropolitan, gas, Mild, zone 4), replacing its 6-postcode list.

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

## The new hubs (from the map)

### Row 61: `/victoria/melbourne-north/`

- **File:** `site/src/content/areas/vic/melbourne-north.mdx`
- **Template (map):** Area – metro hub (Plan Melbourne Northern region; postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates apply in Melbourne's north (Hume, Whittlesea, Darebin, Banyule, Merri-bek, Nillumbik, Mitchell)?
- **Secondary questions (a section or FAQ item each):** Which northern postcodes are 'Cold' or off-gas? · Which council programs are open? · Is Hume's program paused?
- **Priority / intent:** P2 · Intent: Medium (metro local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - 66 postcodes: 58 Metropolitan, 8 Regional (all in Mitchell); 6 without reticulated gas; 9 Cold <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - Region as defined by Plan Melbourne <https://planning.vic.gov.au/__data/assets/pdf_file/0026/628361/plan-melbourne-map-metro-melbourne-regions.pdf>
  - Council Home Energy Program covers Merri-bek and Whittlesea <https://homeenergyprogram.org.au/>; Whittlesea offers free home energy assessments to June 2027 <https://homeenergyprogram.org.au/councils/whittlesea/>
  - Hume Home Energy Upgrades paused <https://humeenergyupgrades.org.au/>
  - Goulburn Murray Solar Savers covers Mitchell <https://www.gmca.org.au/>
  - NCC climate zone 6 at Craigieburn, Mernda and Wallan <https://data.gov.au/data/dataset/australian-climate-zone-map>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/whittlesea/` · `/victoria/mitchell/` · `/victoria/north-west-corridor/` · `/victoria/postcode/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED. List all 66 postcodes with localities from postcodes.csv.

### Row 62: `/victoria/melbourne-west/`

- **File:** `site/src/content/areas/vic/melbourne-west.mdx`
- **Template (map):** Area – metro hub (Plan Melbourne Western region; postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates apply in Melbourne's west (Wyndham, Melton, Brimbank, Hobsons Bay, Maribyrnong, Moonee Valley)?
- **Secondary questions (a section or FAQ item each):** Is anywhere in the west 'regional'? · Which councils run programs? · Are there webinars in my language?
- **Priority / intent:** P2 · Intent: Medium (metro local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - 34 postcodes: all Mild and on reticulated gas; all Metropolitan except Little River 3211 (Regional) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - Region as defined by Plan Melbourne <https://planning.vic.gov.au/__data/assets/pdf_file/0026/628361/plan-melbourne-map-metro-melbourne-regions.pdf>
  - Council Home Energy Program covers Brimbank <https://homeenergyprogram.org.au/>
  - Wyndham Energy Smart Homes and interpreted 'Home Energy in Your Language' webinars run for six western councils <https://www.wyndham.vic.gov.au/services/environment-and-sustainability/sustainable-living/energy-smart-homes>
  - Melton Living Green: Power-Mate meter loans <https://www.melton.vic.gov.au/Services/Environment-and-sustainability/Living-Green>
  - NCC climate zone 6 at Werribee, Melton and Caroline Springs <https://data.gov.au/data/dataset/australian-climate-zone-map>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/wyndham/` · `/victoria/north-west-corridor/` · `/victoria/concession-card-holders/` · `/victoria/postcode/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED, MARGINAL: the climate and gas data match inner Melbourne, so the local value is the council programs.

### Row 63: `/victoria/melbourne-east/`

- **File:** `site/src/content/areas/vic/melbourne-east.mdx`
- **Template (map):** Area – metro hub (Plan Melbourne Eastern region; postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates apply in Melbourne's east and the Dandenongs?
- **Secondary questions (a section or FAQ item each):** Which eastern postcodes are 'Cold'? · Which are heat pump zone 5? · Which councils run programs?
- **Priority / intent:** P2 · Intent: Medium (metro local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - 65 postcodes: 64 Metropolitan (Warburton 3799 Regional); all on reticulated gas; 15 Cold (Dandenongs and Yarra Valley, e.g. Olinda 3788, Healesville 3777); 7 heat pump zone 5 (incl. Lilydale 3140, Belgrave 3160) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - Region as defined by Plan Melbourne <https://planning.vic.gov.au/__data/assets/pdf_file/0026/628361/plan-melbourne-map-metro-melbourne-regions.pdf>
  - Council Home Energy Program covers Knox, Maroondah, Monash and Yarra Ranges <https://homeenergyprogram.org.au/>
  - SEC heat pump hot water pilot available in Maroondah and the Yarra Ranges <https://www.premier.vic.gov.au/latrobe-valley-households-set-save-energy-bills>
  - NCC climate zone 7 in the Yarra Ranges towns <https://data.gov.au/data/dataset/australian-climate-zone-map>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/yarra-ranges/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/postcode/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED. The Cold/zone 5 split inside one metro region is the hook.

### Row 64: `/victoria/melbourne-south-east/`

- **File:** `site/src/content/areas/vic/melbourne-south-east.mdx`
- **Template (map):** Area – metro hub (Plan Melbourne Southern region; postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates apply in Melbourne's south-east (Casey, Cardinia, Dandenong, Kingston, Frankston, Mornington Peninsula)?
- **Secondary questions (a section or FAQ item each):** Is Pakenham metro? · Which councils offer rebates? · Is Koo Wee Rup regional?
- **Priority / intent:** P2 · Intent: Medium (metro local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - 67 postcodes: all on reticulated gas; 66 Metropolitan (Koo Wee Rup 3981 Regional); 65 Mild (Tooradin 3980 and Koo Wee Rup 3981 Cold) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - Region as defined by Plan Melbourne <https://planning.vic.gov.au/__data/assets/pdf_file/0026/628361/plan-melbourne-map-metro-melbourne-regions.pdf>
  - Council Home Energy Program covers Kingston <https://homeenergyprogram.org.au/>
  - Casey home energy efficiency rebate <https://www.casey.vic.gov.au/home-energy-rebates>
  - SEC's installer network is open to Casey households <https://www.premier.vic.gov.au/latrobe-valley-households-set-save-energy-bills>
  - NCC climate zone 6 at Pakenham, Officer and Cranbourne <https://data.gov.au/data/dataset/australian-climate-zone-map>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/casey/` · `/victoria/frankston/` · `/victoria/mornington-peninsula/` · `/victoria/postcode/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED. Cardinia is covered here, not on a page of its own (see dropped).

## The live page being rescoped (row 14)

`/victoria/melbourne/` (live). Changes from the map's "Changes needed on existing pages":

- Rescope as the inner-Melbourne hub: the 7 LGAs above = 52 postcodes, all Metropolitan, gas, Mild, zone 4 (list from postcodes.csv), replacing the 6-postcode list. Source: VEU Specifications v25.0 Table A; ABS allocation files.
- Add the Council Home Energy Program (Yarra, Boroondara, Glen Eira, Stonnington). Source: <https://homeenergyprogram.org.au/>. Status checked on the day (YEF-linked programs: re-check, map item 12).
- Boroondara Solar Savers: free assessment plus up to $2,000 off eligible upgrades, to 31 Dec 2026 or until funds run out. Source: <https://www.energy.gov.au/rebates/solar-savers-program>. The amount becomes a figure (`local-boroondara-solar-savers-max`, `kind: discount`, `jurisdiction: local`, `expiresOn: 2026-12-31`); "free" only as the program's own attributed description. After 31 Dec 2026 the build fails until the line is removed or re-sourced.
- Link the 4 hubs, the corridor and `/victoria/postcode/`.

## Steps

1. **Data:** every hub table comes from `postcodes.json` filtered by `primary_lga` in the hub's LGA list. Store the LGA lists once (`site/src/data/metro-regions.json`, from Plan Melbourne, sourced) so the checker's area links (35a) and the hubs agree. Counts in copy are computed, and `check-postcodes` asserts they equal the rows (checked 14 Nov 2026 while writing this prompt: north 66 / 58 Metropolitan / 8 Regional all in Mitchell / 6 without gas / 9 Cold; west 34 / all Mild and gas / Regional only 3211; east 65 / Regional only 3799 / all gas / 15 Cold / zone 5: 3139, 3140, 3158, 3160, 3770, 3775, 3777; south-east 67 / all gas / Regional only 3981 / Cold 3980 and 3981; inner 52, all Metropolitan, gas, Mild, zone 4). A mismatch is a STOP.
2. **Each hub:** answer first (what's the same as inner Melbourne, what's different); postcode table (postcode, localities, council, area, gas, climate, zone; sortable, `<table>` with caption; no links per postcode); "What's different here" from the row; council programs (`councilPrograms` status model; Hume paused, Darebin paused per review A8, YEF-linked re-checks); NCC zones with ABCB attribution; links to the area pages inside the hub (Wyndham, Casey, Whittlesea, Yarra Ranges, Frankston, Mornington Peninsula, corridor, Mitchell), `/victoria/postcode/` and the checker. `localFacts` ≥ 5.
3. **Insulation:** only the official metro-mild figure applies to most hub postcodes; Cold postcodes (east: Dandenongs and Yarra Valley; south-east: 3980 Metropolitan + Cold → metro-cold estimate; 3981 Regional + Cold → official 2,100) get their spec §5.4 figure via `<Money>`, labelled.
4. **Overlap:** the hubs' climate/gas data are similar (row 62 is marked MARGINAL). `check-overlap` (prompt 27) must pass at < 25% between every pair of hubs and between each hub and the area pages it links; the postcode table is excluded from the comparison, so the prose has to carry local facts.
   - **TODO (from Prompt 27 review):** Once `/victoria/melbourne/` is rescoped here, promote **containment (25%)** from a non-failing warning to a hard gate in `site/scripts/check-overlap.mjs` alongside Jaccard.
5. **Melbourne rescope:** replace the 6-postcode list, keep the URL, title rule 16, `canonicalPage` for its FAQs; the old copy that implied all of Melbourne is one area goes. Its `localFacts` include the Council Home Energy Program and Boroondara Solar Savers. Its `hubs` links: the 4 new hubs and the corridor.
6. **Inbound links:** prompt 34's table (Wyndham → west, Casey → south-east, Whittlesea → north, Yarra Ranges → east); the corridor and Mitchell link their hubs. Footer regions come in prompt 33.
7. **Checker area links (35a):** postcodes with a primary LGA in a hub now link to that hub, unless a more specific enabled area page exists for the LGA (Wyndham, Casey, Whittlesea, Yarra Ranges, Frankston, Mornington Peninsula, Geelong, corridor postcodes, the four council pages).
8. Enable rows 61–64; rebuild.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs       # expect: +4 URLs; /victoria/melbourne/ unchanged URL
node scripts/check-postcodes.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs
node scripts/check-overlap.mjs      # expect: every hub pair < 25%
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs
grep -o '<tr data-postcode="3[0-9]*"' dist/victoria/melbourne/index.html | wc -l   # expect: 52
npx vitest run tests/checker -t "area link"   # expect: 3029 → /victoria/wyndham/, 3064 → /victoria/melbourne-north/, 3000 → /victoria/melbourne/
```

## What to test by hand

Guri reads the north hub (Craigieburn, Mitchell) and the rescoped Melbourne page on a phone; the tables must be usable at 375 px.

## Open decisions for Guri

- Row 62 (west) is marked MARGINAL by Venture Architect: build it (default, its value is the council programs) or hold it.
- Boroondara Solar Savers wording ("free assessment") quoted from the program, attributed (default), or left as "assessment".

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

Sitemap count: +4.

## Done when

The four hubs are live and Melbourne is the inner hub after Guri's yes. Commit `feat(area): metro hubs and inner-Melbourne rescope (39)`.
