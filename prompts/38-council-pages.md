# Prompt 38: Council pages: Macedon Ranges, Mitchell, Latrobe Valley, Mildura

> Local first, then a deploy STOP. Adds **4 URLs** (map rows 57–60, wave 3). Branch: `feat/pack-38-councils`.
> **Run order:** after 34, 35a/b, 36 and 37.
> References: `docs/url-map.md` Wave 3 rows 57–60, "Dropped locations" (the ≥ 4 local facts rule) and "Method notes" (NCC zones, provider counts); `docs/postcodes.csv`; `docs/eligibility-checker-spec.md` §5.4, HPZ-5, GAS-NO; `docs/solution-design.md` §5.4.

---

## Goal

Four council pages that passed the map's local-facts test (Macedon Ranges 6 facts, Mitchell 5, Latrobe Valley 6, Mildura 5). Each one's hook is what differs from Melbourne in VEU's table: cold and zone 5 (Macedon Ranges), the metro/regional split and off-gas towns (Mitchell), Regional-but-Mild insulation and the SEC pilot (Latrobe Valley), and the Hot region (Mildura).

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

## The pages (from the map)

### Row 57: `/victoria/macedon-ranges/`

- **File:** `site/src/content/areas/vic/macedon-ranges.mdx`
- **Template (map):** Area (AreaLayout; postcode table)
- **Primary question (build the H1 and answer block on it):** Is the Macedon Ranges a cold region for VEU, and what does that mean for heating and hot water rebates?
- **Secondary questions (a section or FAQ item each):** Which towns have no mains gas? · Is Gisborne metro or regional? · Does the council run a program? · What heat pump zone am I in?
- **Priority / intent:** P2 · Intent: Medium (local; cold-climate angle)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - 12 of the shire's 13 postcodes are 'Cold' in Table A; 3430–3438 are heat pump zone 5, 3440–3446 zone 4 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - No reticulated gas: Clarkefield 3430, Bolinda 3432, Monegeetta 3433, Malmsbury 3446 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Metropolitan: Riddells Creek 3431, Romsey 3434, New Gisborne 3438, Mount Macedon 3441; Regional: Lancefield 3435, Gisborne 3437, Macedon 3440, Woodend 3442, Kyneton 3444 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - NCC climate zone 7 (cool temperate) at Gisborne, Macedon, Riddells Creek, Woodend, Kyneton, Romsey and Lancefield <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Council: Cool Changes community climate plans (Macedon/Mt Macedon, Kyneton, Gisborne, Riddells Creek, Romsey and Lancefield, Woodend, Malmsbury); Sustainable Home Kits to borrow from libraries; Empower Your Home webinars; ChangeMakers festival (Apr 2026) with home electrification events and the Riddells Creek Enviro-Energy Expo <https://www.mrsc.vic.gov.au/Live-Work/Environment/Climate-Change-and-Sustainability/Take-climate-action>
  - VEU heat pump savings are calculated with the postcode's zone 4/5 value <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/north-west-corridor/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/get-off-gas-planner/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED (6 local facts). The strongest new council page: a cold climate, zone 5, and off-gas pockets all differ from Melbourne.

### Row 58: `/victoria/mitchell/`

- **File:** `site/src/content/areas/vic/mitchell.mdx`
- **Template (map):** Area (AreaLayout; postcode table)
- **Primary question (build the H1 and answer block on it):** What energy rebates can households in Wallan, Kilmore, Broadford and Seymour get?
- **Secondary questions (a section or FAQ item each):** Is Wallan metro? · Which towns have no mains gas? · Is Solar Savers available?
- **Priority / intent:** P3 · Intent: Medium (local growth corridor)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Beveridge 3753 and Wallan 3756: Metropolitan, gas, Mild; Kilmore 3764, Broadford 3658, Seymour 3660: Regional, gas, Cold <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - 12 Mitchell-council postcodes (4 Metropolitan, 8 Regional; all heat pump zone 4) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - No reticulated gas (6): Pyalong 3521, Tooborac 3522, Seymour PO boxes 3661, Puckapunyal 3662, Wandong 3758, Bylands 3762 (Bylands is Metropolitan but Cold); Tallarook 3659 is Regional, gas, Cold <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Goulburn Murray Solar Savers (vetted providers for solar, batteries, heat pumps, insulation and more) open to Mitchell residents <https://www.gmca.org.au/>
  - NCC climate zone 6 at Wallan, Kilmore and Seymour <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Plan Melbourne places Mitchell in the Northern metropolitan region <https://planning.vic.gov.au/__data/assets/pdf_file/0026/628361/plan-melbourne-map-metro-melbourne-regions.pdf>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/melbourne-north/` · `/victoria/shepparton/` · `/victoria/get-off-gas-planner/` · `/victoria/postcode/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED (5 local facts). Wallan/Beveridge estates: stress the 2-year building rule.

### Row 59: `/victoria/latrobe-valley/`

- **File:** `site/src/content/areas/vic/latrobe-valley.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates and programs are available in Traralgon, Morwell and Moe?
- **Secondary questions (a section or FAQ item each):** Is there an SEC heat pump offer here? · What did the Morwell electrification trial find? · Which towns have no mains gas?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Moe 3825, Morwell 3840, Churchill 3842, Traralgon 3844: Regional, gas, Mild (Moe is heat pump zone 5) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - 9 Latrobe-council postcodes, all Regional and Mild <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files>
  - No reticulated gas (5): Gippsland Mail Centre 3841 (PO boxes), Glengarry 3854, Toongabbie 3856, Yinnar 3869, Boolarra 3870 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - SEC heat pump hot water one-stop-shop pilot extended to Latrobe City (Morwell, Moe, Newborough, Traralgon, Churchill) with endorsed installers and free quotes <https://www.secvictoria.com.au/news/sec-helps-latrobe-city-households-save-on-energy-bills> <https://www.premier.vic.gov.au/latrobe-valley-households-set-save-energy-bills>
  - AusNet–GCCN Electri-fair-cation trial electrified Morwell households; completed 2026 <https://www.gccn.org.au/energise_gippsland>
  - Fully electrified trial homes saw an average 44% cut in total energy bills (news report) <https://latrobevalleyexpress.com.au/news/2026/09/22/morwell-households-trial-all-electric-power/>
  - NCC climate zone 6 at Traralgon <https://data.gov.au/data/dataset/australian-climate-zone-map>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/find-an-accredited-provider/` · `/victoria/get-off-gas-planner/` · `/victoria/concession-card-holders/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED (6 local facts). The 44% figure is from a news report quoting AusNet: label it as reported, not official. The SEC pilot is the state's own installer service, so mention it openly. Insulation: Regional but Mild, so neither Energy Vic example fits; about $1,590 by the spec formula (ASSUMPTION; provider confirms).

### Row 60: `/victoria/mildura/`

- **File:** `site/src/content/areas/vic/mildura.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates suit Mildura's hot climate?
- **Secondary questions (a section or FAQ item each):** Is Mildura a 'hot' region for VEU? · Which towns have no mains gas? · Can I borrow an energy kit?
- **Priority / intent:** P3 · Intent: Medium (local; cooling angle)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - All 12 Mildura-council postcodes in postcodes.csv (incl. PO-box 3502) are Regional, 'Hot' and heat pump zone 4 in Table A, one of only 47 Hot postcodes statewide <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Gas (7): Mildura 3500, Mildura PO boxes 3502, Irymple 3498, Red Cliffs 3496, Merbein 3505, Nichols Point 3501, Colignan 3494; no reticulated gas (5): Ouyen 3490, Cowangie 3506, Walpeup 3507, Underbool 3509, Murrayville 3512 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - NCC climate zone 4 (hot dry summer, cool winter) <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Council 'Electrify your home' guidance and a Home Energy Efficiency Toolkit (thermal camera, PowerMate Lite meter) to borrow from Mildura Library <https://www.mildura.vic.gov.au/Services/Environmental-Sustainability/Electrify-your-home>
  - The Hot-region insulation savings factor (0.00546) is the lowest of the three, so expect a smaller insulation discount than in Mild or Cold areas for the same ceiling <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/air-conditioner-rebate/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/solstice-gas-shutdown-towns/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/lpg-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** INCLUDED (5 local facts). Cooling-led page. Swan Hill and Robinvale (Solstice towns) are also Hot, so cross-link.

## The rows match postcodes.csv (map revised 14 Nov 2026)

Venture Architect corrected these rows against `postcodes.csv`, so prompt 34's `check-postcodes` is expected to pass for all four: Mildura has **12** council postcodes (3490, 3494, 3496, 3498, 3500, 3501, 3502, 3505, 3506, 3507, 3509, 3512, all Regional and Hot); Mitchell's no-gas list includes **3661**; Latrobe's includes **3841**; Macedon Ranges has 13 postcodes, 12 Cold (Clarkefield 3430 is the Mild one). Tables still render from the CSV, never typed. If `check-postcodes` reports any difference, stop and tell Guri (rule 19); don't edit the CSV or the copy to force a pass.

## Steps (all four pages)

1. **Answer first**, about the page's hook, in 2–4 sentences. No amount in the answer unless via `<Money>`.
2. **Postcode table** from `postcodes.json` for the council's postcodes (filter by CSV `primary_lga`; list `other_lgas` where shared). Counts and lists in copy are computed from the CSV, never typed. `check-postcodes` asserts the rendered counts equal the CSV.
3. **What it changes**, from the spec: insulation figure for the postcode type (spec §5.4 table: official or prompt-34 estimate, labelled); HPZ-5 note where zone 5; GAS-NO line where no reticulated gas (LPG amount UNVERIFIED: "provider confirms"; link to `/victoria/lpg-homes/` once enabled).
4. **Council programs** with the prompt-34 status model and "Status checked {date}".
5. **NCC climate zones** with ABCB attribution and "confirm on the ABCB Climate Map".
6. `localFacts` ≥ 5, each with an official source id. FAQ 3–5 from the row's secondary questions. Schema BreadcrumbList + FAQPage; no `$`; no LocalBusiness.
7. Links: every row link; plus the inbound links prompt 34's table adds (size guide → Macedon Ranges; running costs → Mildura; get-off-gas → Latrobe Valley and Mitchell; Ballarat → Latrobe Valley; Solstice → Mildura).
8. Enable rows 57–60.

### Page-specific

- **Macedon Ranges (57):** the Cool Changes plans, Sustainable Home Kits and Empower Your Home webinars as council resources (not rebates; no status needed unless dated). The heat pump bulk buy only if still current (review A8: installs end 30 Nov 2026). Heat pump section: zone 4 vs 5 by postcode, link to `/victoria/heat-pump-hot-water-size-guide/`. Insulation: Regional + Cold postcodes (e.g. Gisborne 3437) → the official 2,100 figure; Metropolitan + Cold postcodes (3431, 3432, 3433, 3434, 3438, 3441 in the CSV) → the metro-cold estimate; Clarkefield 3430 is Metropolitan + Mild → the official 1,500 figure.
- **Mitchell (58):** stress the 2-year building rule for Wallan/Beveridge estates (map note); Goulburn Murray Solar Savers via GMCA as a `councilPrograms` entry (status checked on the day); Plan Melbourne places Mitchell in the Northern region → link `/victoria/melbourne-north/` when enabled.
- **Latrobe Valley (59):** mention the SEC heat pump hot water pilot openly (it's the state-owned installer service; link its source). The 44% bill cut is a news report quoting AusNet (map note), so it can't be a figure (`basis` allows only official or estimate). Default: leave it off; it's an open decision. Insulation: Regional + Mild → `vic-veu-insulation-est-regional-mild` (about 1,590, estimate). Energise Gippsland is YEF-linked: re-check it before any mention (map item 12).
- **Mildura (60):** cooling-led page (reverse-cycle cooling, the hot-region insulation factor 0.00546 being the lowest, so expect a smaller insulation discount: give the regional-hot estimate via `<Money>`); the council's Electrify your home guidance and the library Home Energy Efficiency Toolkit; cross-link Swan Hill and Robinvale on the Solstice page.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs      # expect: +4 URLs
node scripts/check-postcodes.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs   # overlap < 25% between the four
grep -c '44%' dist/victoria/latrobe-valley/index.html    # expect: 0 unless Guri chose to quote it (then 1, with attribution)
```

## What to test by hand

Guri reads one page (Macedon Ranges) against its row and the CSV.

## Open decisions for Guri

- Latrobe Valley 44% (news report quoting AusNet): leave off (default) or quote with attribution as text.
- Spec §7 links 3430–3438 (all Macedon Ranges shire) to the corridor page. Keep that (default, per spec), or send Macedon Ranges postcodes north of 3427 to `/victoria/macedon-ranges/` once it's live (needs a spec change from Venture Architect).

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

The four pages are live after Guri's yes. Commit `feat(area): Macedon Ranges, Mitchell, Latrobe Valley, Mildura (38)`.
