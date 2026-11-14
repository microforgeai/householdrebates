# Prompt 28: Business section: the `/victoria/business-energy-upgrades/` hub (map row 55) plus 4 business pages (map rows 65–68, Wave 4)

> Local only, then a deploy STOP. Branch: `feat/review-28-business`.
> **Run after prompt 34** (74-URL map import, figure `basis`, list-format `rollout.json`) **and prompt 35** (checker rebuilt to `eligibility-checker-spec.md`, including the business figures and the Business path). This prompt also covers item (c) of the 14 Nov pack, "the /victoria/business-energy-upgrades/ landing page".
> Source: `docs/business-review-2026-11-14.md` §0, §2 rows 1–2, §4.3 row 2, §7 item 5. Checker: `docs/eligibility-checker-spec.md` §2.4 (business scope), §4.2 (business fields), §5.3 (business rules), §6 (N-SCHED, N-LIGHT, N-COLD, N-PRV, N-PV-30, N-BIZ-RES), §7 (business CTAs), §8 examples 5–6. Map: `docs/url-map.md` / `docs/url-map.csv` row 55 and Wave 4 rows 65–68. Design: `docs/solution-design.md` §5.3 (business figures rule), §6.

---

## Context

VEU business discounts are larger than household ones but the site barely covers them (review §0). The map has `/victoria/business-energy-upgrades/` (row 55) as the landing page for the checker's Business path, and since 14 Nov 2026 the 4 business pages the review asked for (rows 65–68, Wave 4). Row 55 is the business hub and links the 4 pages. There is no separate `/victoria/business/` hub.

**Alignment with `eligibility-checker-spec.md`** (replaces the earlier "DEPENDENCY" note; the spec now exists):

- The spec's §7 CTA for "Business, any Likely/Possibly" is `/victoria/business-energy-upgrades/`, and every business "not eligible" message in §6 links there. So the hub must carry an anchored section for each message: `#scheduled-premises` (N-SCHED), `#indoor-lighting-fluorescent-only` (N-LIGHT), `#cold-room-rules` (N-COLD), `#pre-rinse-spray-valves` (N-PRV), `#business-solar-30-200-kw` (N-PV-30), `#household-only-products` (N-BIZ-RES), `#custom-upgrades` (BX-1, BM-2, BP-3).
- Each business result line also gets a "Read more" link to its topic page. That's an **addition** to spec §7 (which names only the hub). Implement it as one mapping object, `BUSINESS_RESULT_LINKS` in `site/src/lib/checker/links.ts`, so it can be changed or removed in one place, and record it in `docs/expansion-log.md` under "Spec additions" for Venture Architect:

  | Spec rule ids | Topic page |
  |---|---|
  | BH-1..7 | `/victoria/business-heating-cooling/` |
  | BL-1..4 | `/victoria/business-led-lighting/` |
  | BR-1..4 | `/victoria/business-cold-rooms-refrigeration/` |
  | BW-1..3, BM-1..2, BK-1..2 | `/victoria/business-hot-water-motors/` |
  | BP-1..3, BX-1, BG-1, BB-1, B-OC, B-RES-ONLY | hub sections |

- Figures on these pages use the **same figure ids** that prompt 35 created for spec §2.4 and §5.3 (`audience: business`). Don't create a second copy. If an id is missing, add it the way prompt 35 does (one figure per published amount, with source and `checkedOn`) and tell Guri.
- Nothing from spec §9 (UNVERIFIED) appears: no consumer figure for display cabinets, fan motors, C&I heat pumps, boilers or custom upgrades; business ceiling insulation is treated as household-only.

**Slugs (settled by the map).** The review proposed `/victoria/business/` plus nested pages. Venture Architect's master map settles it: `/victoria/business-energy-upgrades/` is the hub, the 4 pages are flat (`/victoria/business-heating-cooling/`, `/victoria/business-led-lighting/`, `/victoria/business-cold-rooms-refrigeration/`, `/victoria/business-hot-water-motors/`), and there is no `/victoria/business/` hub. Farm content is a section on the hub (not a fifth page) unless Guri asks for one.

**No business lead capture** until a business AP agreement is signed and the lawyer has reviewed it (review §7 item 5, §8 spend gate). The CTA is the checker's Business path plus Energy Victoria's provider lists.

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

Exceptions for this prompt only:

- Design §5.3 says business figures may appear only on `/victoria/veu-minimum-co-payment/`. Change it to: business figures (`audience: business`) may appear only on pages with `navGroup: business` and on the co-payment page. Household pages still can't show them (`check-figures` enforces both ways).
- The C&I solar amounts (50–200 kW) are calculated by Energy Victoria at a $70 VEEC price. Show that basis next to them, exactly as the spec does.

## Steps

### A. Map and structure

1. Rows 55 and 65–68 are already in `docs/url-map.csv` (imported by prompt 34; the map says `navGroup business` for 65–68). Don't edit the map. Check `npm run import:urlmap` reports 74 rows.
2. `NavGroup` gets `business`. The hub page and the 4 pages use it. `HubIndex` on `/victoria/` gets a "Business" group after "Audience". `llms.txt` gets a "Business" section after "Audience".
3. Enable rows 55 and 65–68 in `rollout.json`.
4. Footer: add "Business" (to the hub) next to "Areas covered".

### B. Pages

Write each page from its row. Business pages open with who can apply (the 2-year building rule, scheduled premises exclusion) before any amount. Every amount uses `<Money>` or `<FigureTable>` with a label and kind (prompt 25) and the words "indicative" and "the accredited provider confirms". Show size tables, never the largest figure alone.

### Row 55: `/victoria/business-energy-upgrades/`

- **File:** `site/src/content/guides/vic/business-energy-upgrades.mdx`
- **Template (map):** Guide – audience (business)
- **Primary question (build the H1 and answer block on it):** What Victorian Energy Upgrades discounts can a business get?
- **Secondary questions (a section or FAQ item each):** Which products are business-only? · Are large energy users excluded? · What is a custom (M&V) upgrade? · Can a business get a battery discount?
- **Priority / intent:** P3 · Intent: Medium (B2B; separate audience)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Business-only VEU products: commercial and industrial lighting, C&I solar PV, cold rooms, pre-rinse spray valves, high-efficiency motors <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
  - Business heating/cooling examples: non-ducted gas heater → 3–9 kW RCAC $420 to $1,050; ducted gas → 56 kW ducted up to $8,820 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Hot water: businesses can upgrade up to 5 systems; larger C&I heat pumps have no limit; $10,000 minimum contribution for larger C&I upgrades <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Motors up to $2,380 (185 kW premium), $200 minimum contribution <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/upgrade-your-motor>
  - Cold rooms: $420 / $1,540 / $4,620 indicative, at least 4 m², $500 minimum contribution <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/cold-room-discounts>
  - C&I solar 30–200 kW, non-residential premises: 50 kW $4,550 up to 200 kW $34,300 at a $70 VEEC price <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/solar-pv>
  - Indoor lighting only if the existing lights are fluorescent <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/lighting-discounts>
  - Pre-rinse spray valve $210 each <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/pre-rinse-spray-valve-discounts>
  - Sites on the ESC Register of Scheduled Activity Premises are excluded unless they opt in <https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses>
  - Custom (M&V) upgrades: process heat and steam, HVAC, refrigeration, fans and motors, renewables <https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses/custom-upgrades>
  - Federal Cheaper Home Batteries covers households, businesses and community organisations, 5–100 kWh <https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/business-heating-cooling/` · `/victoria/business-led-lighting/` · `/victoria/business-cold-rooms-refrigeration/` · `/victoria/business-hot-water-motors/` · `/victoria/battery-rebate/` · `/victoria/eligibility-checker/` · `/victoria/find-an-accredited-provider/` · `/victoria/what-is-a-veec/` · `/victoria/veu-minimum-co-payment/` · `/victoria/veu-scams-cold-calls/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** NEW. Business hub (14 Nov 2026): links the 4 Wave 4 business pages; no separate /victoria/business/ hub. This is the landing page for the checker's Business branch. Keep figures as 'indicative'. No lead capture for business yet.

- **Hub build notes (row 55):**
  - Sections in this order: who can apply (2-year rule; `#scheduled-premises`: the ESC Register of Scheduled Activity Premises exclusion unless opted in); what's covered (cards linking the 4 pages); `#business-solar-30-200-kw` (C&I solar figures from the row, at a $70 VEEC, plus "STCs (≤ 100 kW) or LGCs (> 100 kW) may add", spec BP-1); windows (`EVGLAZ`, "most businesses", up to $210 per 10 m²); batteries (FEDERAL Cheaper Home Batteries covers businesses, 5–100 kWh, around 30%); `#custom-upgrades` (process heat, steam, HVAC, refrigeration, fans and motors, renewables, via M&V; no figure); `#household-only-products` (ceiling insulation, induction cooktops, weather sealing and in-home displays: the spec's N-BIZ-RES wording). Heat pump clothes dryers are **not** household-only: ESC lists Part 25 for residential and non-residential premises, so the hub says a business dryer is "possibly, up to $70 (figure), the provider confirms" (spec B-RES-ONLY); `#indoor-lighting-fluorescent-only`, `#cold-room-rules`, `#pre-rinse-spray-valves` (short, each linking its topic page); savings framing ("small businesses can save up to $500 a year, larger ones up to $74,000", EVBIZ, as figures with kind `saving`).
  - **Farms and rural businesses** section (review §2 row 2): business VEU activities apply to farm sheds, cool rooms, motors and pumps; link the cold rooms and motors pages. The On-Farm Energy and Electrification Demonstration Program ($5m; grants of $200,000–$750,000; closes 11 Dec 2026; <https://business.gov.au/grants-and-programs/onfarm-energy-and-electrification-demonstration-program-vic>) goes in as a dated news item with `reviewBy: 2026-12-11`. Its amounts are figures with source and date. It's a grant for large demonstration projects, so say so. After 11 Dec 2026 the item is removed (the build fails on a passed `reviewBy` until it is).
  - An honest line on the SEC: Easy Electric SEC is for households; don't claim it does or doesn't serve businesses unless its FAQ says so (source SECFAQ in the map).

### Row 65: `/victoria/business-heating-cooling/`

- **File:** `site/src/content/guides/vic/business-heating-cooling.mdx`
- **Template (map):** Guide – business (navGroup business)
- **Primary question (build the H1 and answer block on it):** What VEU discounts can a Victorian business get for heating and cooling?
- **Secondary questions (a section or FAQ item each):** Which business sizes are listed (16, 25, 32, 56 kW)? · What is the minimum the business pays? · Can a new building get it? · Are large energy users excluded?
- **Priority / intent:** P2 · Intent: Medium-High (B2B, commercial)
- **CTA:** Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - All Victorian households and businesses are eligible for a heating and cooling discount <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Business examples: non-ducted gas heater → 3–9 kW RCAC $420 to $1,050; ducted gas → 4 splits up to $1,680; ducted gas → multi-split 10 kW up to $1,820; ducted gas → ducted 16 / 25 / 32 / 56 kW up to $2,590 / $3,850 / $6,230 / $8,820; central electric ducted 16–56 kW up to $4,060; existing ducted RCAC $910 / $1,400 / $3,010 / $3,290; existing non-ducted RCAC $210 to $490; hard-wired electric room heater up to $490; no product decommissioned: ducted up to $1,820, room $70 to $140 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Same Part 6 minimum co-payments as homes from 30 Sep 2026: $3,000 incl GST for any ducted system; multi-split $3,000 at 10 kW or more, $1,000 below <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Replacement discounts need a building more than 2 years old <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Sites on the ESC Register of Scheduled Activity Premises are excluded unless they opt in <https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/business-energy-upgrades/` · `/victoria/veu-minimum-co-payment/` · `/victoria/find-an-accredited-provider/` · `/victoria/veu-scams-cold-calls/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** From the business review §7 item 5 and eligibility-checker-spec.md §2.4 and §5.3 (BH-1..7). Show the size table, never the largest figure alone. Checker result lines BH-* link here.

### Row 66: `/victoria/business-led-lighting/`

- **File:** `site/src/content/guides/vic/business-led-lighting.mdx`
- **Template (map):** Guide – business (navGroup business)
- **Primary question (build the H1 and answer block on it):** Can a Victorian business still get a VEU discount for LED lighting?
- **Secondary questions (a section or FAQ item each):** Why only fluorescent indoor lights? · What about car parks and outdoor lighting? · Can councils get street lighting discounts? · Do apartment common areas count?
- **Priority / intent:** P2 · Intent: Medium (B2B)
- **CTA:** Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Commercial and industrial lighting is a business-only VEU product <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
  - Indoor lighting upgrades now only qualify when the existing lights are fluorescent <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/lighting-discounts>
  - Examples: 100 × 24 W fluorescent tubes → 50 LED $1,260; 20 metal halide car park lights → LED high bays $3,150; 100 street lights $21,350 (councils and road authorities) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/lighting-discounts>
  - Public lighting is Spec Part 27; Part 34 lists Class 2 common areas, so apartment common-area lighting is possible and the provider confirms <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/business-energy-upgrades/` · `/victoria/apartments-and-units/` · `/victoria/find-an-accredited-provider/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Spec rules BL-1..4 and message N-LIGHT. The fluorescent-only rule goes in the answer block. Common areas: "possibly, provider confirms" only.

### Row 67: `/victoria/business-cold-rooms-refrigeration/`

- **File:** `site/src/content/guides/vic/business-cold-rooms-refrigeration.mdx`
- **Template (map):** Guide – business (navGroup business)
- **Primary question (build the H1 and answer block on it):** What VEU discounts are there for cold rooms and commercial refrigeration in Victoria?
- **Secondary questions (a section or FAQ item each):** Does my cool room qualify (size and temperature)? · What is the minimum contribution? · What about display fridges and fan motors? · Can a cafe, butcher or grocer apply?
- **Priority / intent:** P2 · Intent: Medium (B2B; cafes, butchers, grocers, farms)
- **CTA:** Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Cold rooms: walk-in, at least 4 m² floor area, storing goods below 7 °C or running as a freezer; indicative small / medium / large $420 / $1,540 / $4,620; $500 minimum contribution <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/cold-room-discounts>
  - Household-type fridges and freezers (250–700 L, at least 5.5 stars for fridges and 4 stars for freezers) up to $70, open to businesses too <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/refrigerator-and-freezer-discounts>
  - Refrigerated display cabinets (Part 32) and refrigeration fan motors (Part 33) are VEU activities with no published consumer figure; the provider confirms <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Cold rooms are a business-only VEU product <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/business-energy-upgrades/` · `/victoria/business-hot-water-motors/` · `/victoria/find-an-accredited-provider/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Spec rules BR-1..4 and message N-COLD. Display cabinets and fan motors: no figure, "provider confirms".

### Row 68: `/victoria/business-hot-water-motors/`

- **File:** `site/src/content/guides/vic/business-hot-water-motors.mdx`
- **Template (map):** Guide – business (navGroup business)
- **Primary question (build the H1 and answer block on it):** What VEU discounts can a business get for hot water, motors and commercial kitchen spray valves?
- **Secondary questions (a section or FAQ item each):** How many hot water systems can a business upgrade? · What changes for large commercial heat pumps? · Which motor sizes are listed? · What is a pre-rinse spray valve discount?
- **Priority / intent:** P3 · Intent: Medium (B2B)
- **CTA:** Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Businesses can upgrade up to 5 standard hot water systems at the household figures (electric → heat pump $630, electric → solar-boosted $910, gas → heat pump $560, gas → solar-boosted $700), $200 minimum each <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Larger commercial and industrial heat pumps have no limit on number, no published consumer figure, and a $10,000 minimum contribution (Spec Part 44) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Motors: e.g. 15 kW premium $280; 75 kW high-efficiency $560 or premium $1,120; up to $2,380 (185 kW premium); $200 minimum <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/upgrade-your-motor>
  - Motors over 185 kW: ask about a custom (M&V) upgrade <https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses/custom-upgrades>
  - Pre-rinse spray valves $210 each, where a valve or fitting is already installed <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/pre-rinse-spray-valve-discounts>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/business-energy-upgrades/` · `/victoria/business-cold-rooms-refrigeration/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/find-an-accredited-provider/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Spec rules BW-1..3, BM-1..2, BK-1..2 and message N-PRV. No figure for large C&I heat pumps.

### C. Checker wiring (minimal and replaceable)

1. `BUSINESS_RESULT_LINKS` as above. The result screen shows the spec's primary CTA (the hub) first and the topic link second.
2. The six business N-messages link to the hub anchors listed above. Add a unit test that every anchor in `BUSINESS_RESULT_LINKS` and in the N-message links exists in the built hub HTML.
3. Don't change any spec rule, status, figure or wording. If the pages need something the spec doesn't say, log it under "Spec additions".

## Acceptance checks

```bash
cd site
npm run import:urlmap        # expect: "url-map: 74 rows …; 0 errors"
npm run check                # expect: 0 errors; vitest pass (incl. the anchor test and spec example 5)
npm run build && node scripts/check-figures.mjs
# expect: 0 stale, 0 raw amounts, 0 unlabelled heroes, 0 business figures on household pages
node scripts/check-urlmap.mjs   # expect: URL count = enabled rows (previous + 5), 0 extra, 0 missing links, 0 orphans
for a in scheduled-premises indoor-lighting-fluorescent-only cold-room-rules pre-rinse-spray-valves business-solar-30-200-kw household-only-products custom-upgrades; do
  grep -c "id=\"$a\"" dist/victoria/business-energy-upgrades/index.html; done   # expect: 1 each
grep -c 'data-figure="vic-veu-copay-business-large"' dist/victoria/business-hot-water-motors/index.html   # expect: ≥ 1 (the $10,000 large C&I minimum)
grep -ci 'fluorescent' dist/victoria/business-led-lighting/index.html          # expect: ≥ 2 (answer and body)
grep -c 'leadForm\|<form' dist/victoria/business-*/index.html dist/victoria/business-energy-upgrades/index.html   # expect: 0
node scripts/check-text.mjs && node scripts/check-faqs.mjs && node scripts/check-overlap.mjs && node scripts/check-schema.mjs && node scripts/check-rule-status.mjs   # expect: pass
```

Negative tests (each must fail, then revert): put a business figure on `/victoria/heat-pump-rebate/`; delete the `#cold-room-rules` anchor (the anchor unit test fails); show the 56 kW figure as a hero without the size table.

## What to test by hand

- Run spec examples 5 and 6 in the checker: the result lines link to the hub and the right topic page, and the anchors land on the right section.
- Read every business amount against its Energy Victoria page (Guri, with the PR's fact-check sheet).

## Open decisions for Guri

- Farms as a hub section (default) or a fifth page (needs a map row).
- Business lead fees ($100–$250 per lead in the review) are an **[Assumption]**; nothing on these pages depends on them, and business lead capture stays off until an AP agreement and the lawyer's review.

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

Sitemap count: the previous count + 5 (rows 55, 65–68).

## Done when

The hub and the 4 pages are built from the rows, the checker's Business path lands on the hub with working anchors and topic links, no business figure leaks onto a household page, every check passes, and Guri has fact-checked the pages and said yes to the deploy. Commit `feat(review): business hub and 4 business pages (28)`.
