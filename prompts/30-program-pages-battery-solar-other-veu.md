# Prompt 30: Program pages: batteries, solar panels and other VEU discounts (map rows 69–71, Wave 4), plus Midday Power Saver, the multi-split cap check and the two official combined hot water figures

> Local only, then a deploy STOP. Branch: `feat/review-30-programs`.
> Run after prompt 34 (74-URL map import and list-format `rollout.json`) and prompt 25 (labels). **Time-sensitive:** the battery page's main fact changes on 1 Jan 2027, so deploy it in December 2026 if Guri agrees.
> Source: `docs/business-review-2026-11-14.md` §1.2 A3 and A4, §3 rows 1–3 and 5, §7 item 7. Checker: `docs/eligibility-checker-spec.md` §2.2 (Solar Homes PV), §2.3 (FEDERAL), §9 (UNVERIFIED). Map: `docs/url-map.md` "Rule changes" items 5–6. Design: `docs/solution-design.md` §5.6 (the reserved `/solar-battery/` section).

---

## Context

People search for batteries and solar alongside VEU. The site has one page that touches solar (`/victoria/veu-vs-solar-homes/`) and nothing on batteries. Design §5.6 reserved a `/solar-battery/` section behind `SOLAR_SECTION_ENABLED=false`. The review recommends **one page each, inside `/victoria/`**, not a sub-site. So this prompt uses flat `/victoria/` URLs and leaves the reserved section switched off (update design §5.6 to say so).

Also in this prompt (all from the review):

- **Midday Power Saver** (review §3 row 3): from 1 Oct 2026, three hours of free electricity, 11am–2pm daily, opt in through your retailer (<https://www.energy.vic.gov.au/households/save-energy-and-money/victorian-midday-power-saver>). "Free" is the program's own description: quote and attribute it. Add a short section to `/victoria/gas-vs-heat-pump-running-costs/` and the heat pump guides (`/victoria/heat-pump-rebate/`, `/victoria/gas-hot-water-to-heat-pump/`, `/victoria/electric-hot-water-to-heat-pump/`): "run a heat pump on a timer in that window". No savings number (none is published).
- **A3, the 20 kW multi-split cap.** The review cites a DEECA proposal reported by HVAC&R News (<https://hvacrnews.com.au/regulations/changes-planned-for-heating-and-cooling-incentives/>), a trade source, and says to confirm against VEU Spec v25.0 Part 6. **Treat it as UNVERIFIED until you find it in the spec.** Open SPEC25 Part 6. If it states that residential multi-split incentives are calculated on at most 20 kW, add the rule (no dollar amount) to `/victoria/ducted-gas-to-split-systems/`, `/victoria/air-conditioner-rebate/` and `/victoria/veu-minimum-co-payment/`, citing the spec page and clause. If it doesn't, log it as a TODO and add nothing.
- **A4, two official combined hot water figures.** Energy Victoria says VEU + Solar Homes is "up to $1,560 … a further $400 … up to $1,960". Solar Victoria says "up to $1,960 … locally made or up to $1,630 … another system". `/victoria/can-you-claim-veu-twice/` shows only $1,560. Show both, each with its source, and explain that the two agencies calculate the combined figure differently and the provider confirms. Pages: `/victoria/can-you-claim-veu-twice/`, `/victoria/heat-pump-rebate/`, `/victoria/gas-hot-water-to-heat-pump/`. New figures: `vic-hw-combined-solarvic-other` (1,630) and `vic-hw-combined-solarvic-local` (1,960), `kind: discount`, source Solar Victoria's hot water rebate page (re-open it and find the exact wording first; if it isn't there, stop).

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

Program-specific rules:

- **FEDERAL** label (spec §2.3): every Cheaper Home Batteries figure and statement carries a visible "FEDERAL" tag, and figures use `state: national`, `program: "Cheaper Home Batteries"`.
- **Nothing from spec §9:** no Victorian battery rebate (whether one exists is UNVERIFIED, so say nothing about it either way); no STC dollar amounts for household PV or heat pumps; no detailed rental PV criteria (link Solar Victoria instead).
- The battery STC factors (6.8, 5.7) and taper percentages (100%, 60%, 15%) are figures (`unit: count` for the factor, `percent` for the taper), with source and `checkedOn`, so they fall under the 45-day rule.
- The review's "install before 31 Dec" hook becomes a dated statement: "The factor drops from 6.8 to 5.7 on 1 January 2027; the installation date sets the rate." No urgency language ("hurry", "don't miss out").

## Steps

### A. Map

1. Rows 69–71 are in the master map (Wave 4), imported by prompt 34. Don't edit the map.
2. Enable them in `rollout.json`. `navGroup`: `rebate-guides` for the battery and solar pages, `question-pages` for other VEU discounts.

### B. Data

1. Sources: DCCEEW Cheaper Home Batteries, CER "battery rebates are changing 1 May 2026", Solar Victoria PV, PV transition, income cap, electrification grants, Energy Victoria products, glazing, fridge and freezer, Midday Power Saver, ESC activity overview (all official). Re-open each.
2. Figures (one per published value, `kind` per prompt 25): battery factor May–Dec 2026 and from 1 Jan 2027; taper 100/60/15; "around 30%"; PV rebate (existing `vic-solar-homes-pv-rebate`); income and property caps (existing); Residential Electrification Grants PV and hot water (1,400 each, `program: "Residential Electrification Grants"`); glazing (existing `vic-veu-glazing-*`); each "up to $70" appliance (dryer, shower head, fridge or freezer, in-home display, TV) as separate figures in group `vic-veu-appliances` (reuse prompt 35a's ids if it has run). Set `audience` per the row and the ESC activity overview: in-home display household only (Part 30); clothes dryer (Part 25), shower head (17), fridge or freezer (22) and TV (24) household and business; the two Solar Victoria combined figures above.

### C. Pages

### Row 69: `/victoria/battery-rebate/`

- **File:** `site/src/content/guides/vic/battery-rebate.mdx`
- **Template (map):** Guide – program (federal, label FEDERAL)
- **Primary question (build the H1 and answer block on it):** Is there a battery rebate in Victoria, and how does the federal Cheaper Home Batteries discount work?
- **Secondary questions (a section or FAQ item each):** How much is the discount? · Why does the size matter (14, 28, 50 kWh)? · What changes on 1 Jan 2027? · Do I need solar panels? · Can a business get it?
- **Priority / intent:** P1 · Intent: High (hard date: 1 Jan 2027)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Cheaper Home Batteries: households, businesses and community organisations; small-scale batteries 5–100 kWh connected to new or existing solar PV; accredited installer; discount through STCs; around 30% off the upfront cost <https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries>
  - STC factor 6.8 per kWh for May–Dec 2026, 5.7 from 1 Jan 2027, then lower every 6 months to 2030; the installation date sets the rate <https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries>
  - Taper since 1 May 2026: 100% of the factor up to 14 kWh, 60% for 14–28 kWh, 15% for 28–50 kWh <https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries> <https://cer.gov.au/news-and-media/media/2026/march/battery-rebates-are-changing-1-may-2026>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/solar-panel-rebate/` · `/victoria/veu-vs-solar-homes/` · `/victoria/business-energy-upgrades/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Label the program FEDERAL. A Victorian battery rebate is UNVERIFIED (spec §9): say nothing about one. A report of further cuts (Finder) is unconfirmed: keep it off the page. The alert sign-up (prompt 29b) sits here. Not a battery sub-site.

### Row 70: `/victoria/solar-panel-rebate/`

- **File:** `site/src/content/guides/vic/solar-panel-rebate.mdx`
- **Template (map):** Guide – program (Solar Homes)
- **Primary question (build the H1 and answer block on it):** How much is the Victorian solar panel rebate, and what changes on 1 July 2027?
- **Secondary questions (a section or FAQ item each):** Who is eligible (income, property value, 10-year rule)? · Is the interest-free loan still offered? · Can I get it on a home under construction? · What about rentals? · What about businesses?
- **Priority / intent:** P1 · Intent: High
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Solar Homes PV rebate up to $1,400 plus an optional interest-free loan of the same amount; owner-occupier of an existing home or one under construction; approval before install <https://www.solar.vic.gov.au/solar-panel-rebate>
  - Combined owners taxable income under $150,000 from 1 Jul 2026 (was $210,000); property under $3m <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance> <https://www.solar.vic.gov.au/solar-panel-rebate>
  - Not available where the address had a Solar Homes PV or battery rebate, or where solar was installed in the last 10 years <https://www.solar.vic.gov.au/solar-panel-rebate>
  - Rental properties are eligible and the $150,000 cap applies to rentals too (detailed landlord and tenant criteria: see Solar Victoria) <https://www.solar.vic.gov.au/solar-panel-rebate> <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance>
  - PV support moves into VEU from 1 Jul 2027; current arrangements stay until 30 Jun 2027 <https://www.solar.vic.gov.au/solar-support-continue-through-victorian-energy-upgrades-program>
  - Residential Electrification Grants through approved providers (including Six Star Plus, Metricon Homes and Henley): up to $1,400 for PV and $1,400 for hot water; the projects target households including low-income households, retirement-home residents and first home buyers <https://www.solar.vic.gov.au/electrification-grants>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/veu-vs-solar-homes/` · `/victoria/battery-rebate/` · `/victoria/apartments-and-units/` · `/victoria/new-homes-all-electric-2027/` · `/victoria/business-energy-upgrades/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Business solar (30–200 kW) is on the business hub, not here. Rental criteria detail is UNVERIFIED: link Solar Victoria, no detail. Don't use the stale "up to $2,800" on Energy Vic's Latest discounts page or the Solstice page.

### Row 71: `/victoria/other-veu-discounts/`

- **File:** `site/src/content/guides/vic/other-veu-discounts.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** What other VEU discounts are there for Victorian homes (windows, dryers, fridges, shower heads, TVs)?
- **Secondary questions (a section or FAQ item each):** How much is each? · Can businesses get any of them? · Is the Residential Efficiency Scorecard still part of VEU? · Is there a pool pump or EV charger discount?
- **Priority / intent:** P3 · Intent: Medium (completes the topic for AI answers)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Window glazing: up to $210 per 10 m² to double glaze windows <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>; $210 double-glazed / $140 secondary glazing per 10 m² example <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/window-glazing-discounts>
  - Heat pump dryer, shower head, fridge or freezer, in-home display and TV: up to $70 each (Energy Vic says shower heads, fridges/freezers and TVs are for homes or businesses; in-home displays are residential-only per ESC; ESC lists clothes dryers, Part 25, for both) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
  - Fridges and freezers: 250–700 L, at least 5.5 stars (fridge) or 4 stars (freezer) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/refrigerator-and-freezer-discounts>
  - The Residential Efficiency Scorecard closed on 23 Jun 2026 and is no longer a VEU activity (Spec Part 45) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Pool pumps (Part 26) are listed by the ESC as an activity but have no current consumer discount page; pool heat pumps are not on Energy Victoria's product list <https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/overview-veu-activities> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
  - ESC: in-home displays (Part 30) residential only; clothes dryers (Part 25), shower roses (17), fridges (22), TVs (24), windows (13/14) residential and non-residential <https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/overview-veu-activities>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/draught-proofing-rebate/` · `/victoria/gas-cooktop-to-induction/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/what-is-a-veec/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Low value each. The EV charger FAQ is a decision for Guri (the review found no household EV charger rebate; Solar Victoria gives guidance only).

- **Battery page notes:** sections: how the discount works (STCs, accredited installer, connected solar); the size taper as a table; what changes on 1 Jan 2027 (and "then lower every 6 months to 2030"); businesses and community organisations are covered (link the business hub); the alert sign-up (prompt 29b, hidden until live). Not a battery comparison or a product page.
- **Solar page notes:** answer first: the rebate, the loan, the caps, and that PV moves into VEU from 1 Jul 2027. A "What changes on 1 July 2027" section. A "Building a new home" section for the under-construction rule (link `/victoria/new-homes-all-electric-2027/`). A separate "Residential Electrification Grants" section, worded exactly as the row: grants go through approved providers (including Six Star Plus, Metricon Homes and Henley), up to the PV and hot water figures, and the projects **target households including low-income households, retirement-home residents and first home buyers**. Don't describe them as a general new-home grant or imply every buyer qualifies; link Solar Victoria's electrification grants page for eligibility. Link `/victoria/veu-vs-solar-homes/` both ways so the two don't compete: that page compares programs; this one is the PV how-to.
- **Other VEU discounts notes:** a table of the products with their figures; a short "No longer offered" note on the Residential Efficiency Scorecard; one FAQ "Is there a VEU discount for pool pumps?" (no current consumer discount page). The EV charger FAQ only if Guri says yes (decision below).

### D. Existing pages

1. Midday Power Saver sections (4 pages, above).
2. A3 (only if verified in the spec) and A4 changes (above).
3. Add inbound contextual links: `/victoria/veu-vs-solar-homes/` → solar and battery pages; `/victoria/apartments-and-units/` → solar page; `/victoria/draught-proofing-rebate/` and `/victoria/gas-cooktop-to-induction/` → other VEU discounts.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run check
npm run build && node scripts/check-figures.mjs && node scripts/check-urlmap.mjs && node scripts/check-text.mjs && node scripts/check-faqs.mjs && node scripts/check-overlap.mjs && node scripts/check-schema.mjs
# expect: all pass; URL count = previous + 3
grep -c 'FEDERAL' dist/victoria/battery-rebate/index.html                 # expect: ≥ 2
grep -ci 'victorian battery rebate\|solar homes battery' dist/victoria/battery-rebate/index.html   # expect: 0 (UNVERIFIED stays off)
grep -o 'data-figure="vic-hw-combined-solarvic-[a-z]*"' dist/victoria/can-you-claim-veu-twice/index.html | sort -u | wc -l   # expect: 2
grep -ci 'midday power saver' dist/victoria/gas-vs-heat-pump-running-costs/index.html   # expect: ≥ 1
grep -ci '20 kW' dist/victoria/ducted-gas-to-split-systems/index.html   # expect: ≥ 1 only if the cap was found in SPEC25 (else 0, and a TODO logged)
```

## What to test by hand

- Read every battery figure on the DCCEEW page with Guri (factor, taper, dates).
- Read the A4 wording: a reader understands why two official figures differ.

## TODO: UNVERIFIED (kept off these pages; log it)

- A Victorian battery rebate (spec §9).
- Further battery rebate cuts reported by Finder (unconfirmed).
- The 20 kW multi-split cap, unless found in SPEC25 Part 6.
- STC dollar amounts for household PV and heat pumps.
- Rental PV criteria beyond "rentals eligible; $150,000 cap applies".

## Open decisions for Guri

- The EV charger FAQ ("no household EV charger rebate found in Victoria; Solar Victoria gives guidance only"): add it or not.
- Deploy timing for the battery page (before 1 Jan 2027 is when it's most useful).
- Whether the parked householdbattery.com.au idea should point here (review §3 row 1); no domain purchase is implied.

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

Sitemap count: the previous count + 3.

## Done when

The three pages are built from their rows, the Midday Power Saver and A4 changes are on the existing pages, A3 is either verified in the spec or logged, every check passes, and Guri has fact-checked and approved the deploy. Commit `feat(review): battery, solar and other VEU program pages (30)`.
