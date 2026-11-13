# Prompt 15: Priority fixes to existing pages (co-payments, Solar Homes caps, verified 2027 exemptions), new sources and the URL map import

> Local only. This prompt changes data, schemas and five existing pages, and adds a URL-map import script. It deploys nothing. The deploy STOP at the end needs Guri's yes.
> Run it after prompts 01–13. It works whether or not Launch A (prompt 14A) has happened. Branch: `feat/expansion-15-priority-fixes`.

---

## Context

Guri approved growing Household Rebates from 16 to 53 URLs (13 Nov 2026). Venture Architect's URL map is the source of truth for the expansion: `url-map.md` and `url-map.csv` (53 rows: 16 live, then Wave 1 = 19, Wave 2 = 10, Wave 3 = 8). While building it, Venture Architect found rule changes that make some live pages wrong or incomplete. This prompt fixes those first, before any new page is written.

The changes this prompt acts on (all from `docs/url-map.md`, "Rule changes and corrections found", checked 13 Nov 2026):

1. **New VEU minimum co-payments from 30 Sep 2026.** The source is VEU Specifications v25.0, Part 6, activities 6A–6G (PDF: <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>; page: <https://www.energy.vic.gov.au/victorian-energy-upgrades/installers/industry-specifications>). All amounts include GST and apply per installed product:
   - all ducted air conditioners (any size): $3,000 (was $1,000 until 29 Sep 2026)
   - multi-split with total rated cooling capacity of 10 kW or more: $3,000
   - multi-split below 10 kW: $1,000
   - other non-ducted (single split) of 10 kW or more: $1,000
   - other non-ducted below 10 kW: $200

   Energy Victoria's consumer heating and cooling page doesn't show this yet, so cite the spec PDF.
2. **The 2027 gas hot water exemptions are verified.** The source is Building and Plumbing Amendment Regulations 2025 (SR 140/2025), reg 6, which inserts new reg 45E: AustLII <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>, with authority on legislation.vic.gov.au <https://www.legislation.vic.gov.au/as-made/statutory-rules/building-and-plumbing-amendment-regulations-2025>. The live gas 2027 page lists only the three Gazette exemptions.
3. **Solar Homes hot water rebate:** income cap $150,000 from 1 Jul 2026 (was $210,000), property value under $3m, existing system at least 3 years old (<https://www.solar.vic.gov.au/hot-water-rebate>, <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance>).
4. **Ceiling insulation** is a new VEU product: up to $1,500 metro and $2,100 regional (Energy Victoria's 150 m² examples). Geelong postcodes are "Regional" in the VEU postcode table, so the Geelong page can mention it, but **must not promise $2,100** (see the conflict below).
5. **A source URL moved.** The Energy Victoria electrification standards page is now `/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings` (it was `/households/electric-and-efficiency-standards-for-buildings`).
6. **Stale official summary pages: don't use them.** Energy Victoria's "Latest discounts and rebates" page (<https://www.energy.vic.gov.au/households/latest-discounts-and-rebates>, updated 24 Jul 2026) shows ducted savings "up to $1,410" and PV "up to $2,800". The product pages say $1,140 and $1,400. Product pages beat summary pages.

The map's "Changes needed on existing pages" table, which this prompt carries out:

| Existing URL | Change |
|---|---|
| `/victoria/air-conditioner-rebate/` | Add the new co-payments. |
| `/victoria/reverse-cycle-vs-gas-heater/` | Add the same co-payment note where ducted systems are discussed. |
| `/victoria/gas-to-electric-hot-water-2027/` | Replace the "unverified" exemptions note with the verified reg 45E list. The link to the new exemptions page is added in prompt 18. |
| `/victoria/heat-pump-rebate/` | Add the Solar Homes $150,000 income cap (from 1 Jul 2026), the property value under $3m and the system age of at least 3 years. |
| `/victoria/geelong/` | Postcodes 3216/3218/3220 are "Regional" (climatic region Mild) in the VEU postcode table, so the regional insulation figure **may** apply. The provider confirms. Don't promise $2,100. |
| `/victoria/eligibility-checker/` | Prompt 16 (separate). |
| `/` (home) | Link the hub and the Wave 1 pages. This is done in prompts 17–18, because those URLs don't exist yet and `check-links` would fail. |

**Conflict to log (don't resolve it yourself):** Energy Victoria's insulation page labels its examples "metro Melbourne (mild climate zone)" and "regional Victoria (cold climate zone)". The VEU postcode table gives metro/regional **and** mild/cold as separate columns, and Geelong is Regional + Mild. Which column sets the amount is not stated. So the site shows both examples and says the provider confirms. Log it in `docs/expansion-log.md`.

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

## Goal

1. The URL map is in the repo and machine-readable (`site/src/data/url-map.json`), and validated at 53 rows.
2. Figure and source schemas handle minimums, GST, effective dates, percentages and counts.
3. There are 52 new sources (65 in total), and one source URL is corrected.
4. There are 16 new figures (40 in total).
5. The five existing pages are corrected, and every check passes.

## Steps

1. **Bring the map into the repo.**
   - Copy `url-map.md` and `url-map.csv` into `docs/` unchanged. Copy the updated `solution-design.md` over `docs/solution-design.md`, because §1, §4, §5, §6 and §10 changed for the expansion.
   - Create `docs/expansion-log.md` with four headings: `Conflicts`, `UNVERIFIED (kept off pages)`, `Decisions for Guri`, `Done`. Seed it with the conflicts and TODOs listed at the end of this prompt.
2. **`site/scripts/import-url-map.mjs`** (Node, no dependencies beyond `csv-parse`, which is already allowed as a dev dependency) reads `docs/url-map.csv` and writes `site/src/data/url-map.json`:
   ```json
   [{ "row": 17, "url": "/victoria/", "wave": 1, "status": "new", "template": "Hub …", "question": "…",
      "internalLinks": ["*"], "cta": "…", "priority": "P1", "gated": false }]
   ```
   - `wave`: `0` for `0 (live)`, otherwise the number.
   - `internalLinks`: split on `;` and trim. The hub's free-text value becomes `["*"]`, meaning "every /victoria/ page".
   - `gated: true` only for `/victoria/shepparton/` (prompt 22).
   - The script fails, with a message, if any of these is wrong: rows ≠ 53; wave counts ≠ 16/19/10/8; duplicate URLs; a URL that doesn't match `^/([a-z0-9-]+/)*$`; an internal link that isn't a URL in the map.
   - Add `"import:urlmap": "node scripts/import-url-map.mjs"` to `site/package.json`. Commit the JSON, and re-run the script whenever Venture Architect changes the CSV.
3. **Schema changes** (`site/src/content.config.ts`, `site/src/lib/figures.ts`). Update docs/solution-design §5.3 to match.
   - `qualifier`: `up-to | range | exact | about | about-range | minimum | more-than | almost`. `formatFigure` output:
     - `minimum` → "at least $3,000"
     - `more-than` → "more than $400"
     - `almost` → "almost 60%"
     - `about-range` → "about $350 to $400"
   - `unit`: `AUD | percent | count`, default `AUD`. Formatting:
     - percent → "17.5%" (one decimal only when it's not a whole number)
     - count → "31" (en-AU grouping, so "27,000")
     - `currency` stays `AUD` for money and is omitted for percent and count.
   - `display`: `standard | cents | compact`, default `standard`.
     - `cents` → "$171.60"
     - `compact` → "$3 million" for 3,000,000 and "$150,000" stays as is (compact only applies at 1,000,000 or more)
   - `gstIncluded: boolean` (optional). When it's true, `<Money>` appends " (including GST)".
   - `effectiveFrom` / `effectiveTo` (optional dates). `<FigureTable>` shows "From 30 Sep 2026" / "Until 29 Sep 2026" in the row.
   - `check-figures` treats a figure with `effectiveTo` in the past as **historical**: it can be used only on a page that also uses the figure that replaced it (`supersededBy: <id>`, required when `effectiveTo` is set).
   - `audience`: keep `household | business`. Business figures are allowed only on `/victoria/veu-minimum-co-payment/`.
   - `Activity` enum: add `insulation | induction | sealing | glazing`. These are used by prompt 16. Lead form activities stay `rcac | hotwater`.
   - `sources`: add optional `mapKey` (the key in the map's source index, e.g. `SPEC25`) and `kind: legislation | regulator | department | council | council-program | state-owned | network-business | national-agency`. Figures may cite only sources with `official: true`.
   - Unit tests in `tests/unit/figures.test.ts` for every new qualifier, unit, display and the historical rule.
4. **Sources.** Correct `energyvic-electrification.yaml`:
   - `url` → <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings>
   - `pageLastUpdated: 2026-10-09`
   - `mapKey: EVSTD`

   Add `mapKey` to the existing ones: `energyvic-heating-cooling` = EVHC, `energyvic-hot-water` = EVHW, `energyvic-about-veu` = EVABOUT, `vicplanning-gas-roadmap` = PLANLPG, `vic-gazette-s654-2025` = GAZ.

   Then add these 52 files, all with `checkedOn` set to the day you re-open them (map: 13 Nov 2026), `state: vic` (except CER, ABCB = `national`) and the page date from the map's source index where it has one. URLs are exactly as in the map's source index (`docs/url-map.md`, "Source index").

   | id | mapKey | kind | official |
   |---|---|---|---|
   | `energyvic-induction` | EVIND | department | true |
   | `energyvic-insulation` | EVINS | department | true |
   | `energyvic-weather-sealing` | EVSEAL | department | true |
   | `energyvic-window-glazing` | EVGLAZ | department | true |
   | `energyvic-veu-products` | EVPROD | department | true |
   | `energyvic-retrospective` | EVRETRO | department | true |
   | `energyvic-your-rights` | EVRIGHTS | department | true |
   | `energyvic-renters-landlords` | EVRENT | department | true |
   | `energyvic-existing-homes` | EVEXIST | department | true |
   | `energyvic-new-buildings` | EVNEW | department | true |
   | `energyvic-rental-efficiency` | EVRENTAL | department | true |
   | `energyvic-veu-specifications-page` | EVSPEC | department | true |
   | `vic-veu-spec-v25` | SPEC25 | department | true |
   | `energyvic-hw-factsheet` | EVHWFACT | department | true |
   | `energyvic-rcac-buyers-guide` | EVRCGUIDE | department | true |
   | `energyvic-veu-work-program` | EVMKT | department | true |
   | `energyvic-energy-assistance` | EVEAP | department | true |
   | `esc-veecs` | ESCVEEC | regulator | true |
   | `esc-consumer-rights` | ESCRIGHTS | regulator | true |
   | `esc-cold-call-bans` | ESCBANS | regulator | true |
   | `esc-report-non-compliance` | ESCREPORT | regulator | true |
   | `esc-veu-legislation` | ESCLEG | regulator | true |
   | `esc-gas-distribution-code` | ESCGAS | regulator | true |
   | `solarvic-hot-water-rebate` | SVHW | department | true |
   | `solarvic-pv-rebate` | SVPV | department | true |
   | `solarvic-income-cap-news` | SVINCOME | department | true |
   | `solarvic-pv-into-veu` | SVPVVEU | department | true |
   | `solarvic-solstice` | SVSOL | department | true |
   | `solarvic-apartments` | SVAPT | department | true |
   | `solarvic-apartments-news` | SVAPTN | department | true |
   | `solarvic-insulation-news` | SVINSN | department | true |
   | `austlii-reg-45e` | REG45E | legislation | true |
   | `legvic-bpar-2025` | LEGVIC | legislation | true |
   | `cav-min-energy-standards` | CAVMEES | regulator | true |
   | `cav-renter-changes` | CAVCHG | regulator | true |
   | `bpc-plumbing-compliance` | BPC | regulator | true |
   | `ausnet-gas-abolishment` | AUSNET | network-business | false |
   | `cer-heat-pumps` | CERHW | national-agency | true |
   | `dffh-electricity-concession` | DFFHAEC | department | true |
   | `dffh-winter-gas-concession` | DFFHGAS | department | true |
   | `sec-easy-electric` | SEC | state-owned | false |
   | `sec-easy-electric-faq` | SECFAQ | state-owned | false |
   | `abcb-climate-zones-data` | ABCB | national-agency | true |
   | `abcb-climate-map` | ABCBMAP | national-agency | true |
   | `ballarat-electrify` | BALL | council | true |
   | `bendigo-saving-energy` | BEND | council | true |
   | `bendigo-solstice` | BENDSOL | council | true |
   | `wyndham-energy-smart-homes` | WYN | council | true |
   | `casey-home-energy-rebates` | CASEY | council | true |
   | `whittlesea-home-energy-news` | WHIT | council | true |
   | `whittlesea-home-energy-program` | WHITHEP | council-program | **ask Guri** (see decisions) |
   | `yarra-ranges-sustainable-homes` | YARRA | council | true |

   - Add `attribution: "Contains data from the Australian Building Codes Board climate zone map, CC BY 4.0"` to `abcb-climate-zones-data`. It must appear on any page that uses an NCC zone.
   - **Do not add** EVLATEST (stale), MELTON (location dropped) or SHEPP (gated; prompt 22 adds it).
5. **Figures.** Append these 16 rows to `site/src/content/figures/vic-veu.yaml`, with `state: vic` and `checkedOn` set to the day you re-check the source. Re-open each source and confirm each amount before saving. If anything differs, **stop and tell Guri**.

   | id | group | scenario | qualifier | unit | min | max | extra | source |
   |---|---|---|---|---|---|---|---|---|
   | `vic-veu-copay-ducted` | `vic-veu-copayments` | Any ducted reverse-cycle air conditioner, per installed product (activities 6A–6C) | minimum | AUD | | 3000 | gstIncluded, effectiveFrom 2026-09-30 | vic-veu-spec-v25 |
   | `vic-veu-copay-ducted-until-sep-2026` | `vic-veu-copayments-history` | Ducted reverse-cycle, before 30 Sep 2026 | minimum | AUD | | 1000 | gstIncluded, effectiveTo 2026-09-29, supersededBy vic-veu-copay-ducted | vic-veu-spec-v25 |
   | `vic-veu-copay-multisplit-10kw-plus` | `vic-veu-copayments` | Multi-split, total rated cooling capacity 10 kW or more | minimum | AUD | | 3000 | gstIncluded, effectiveFrom 2026-09-30 | vic-veu-spec-v25 |
   | `vic-veu-copay-multisplit-under-10kw` | `vic-veu-copayments` | Multi-split, total rated cooling capacity below 10 kW | minimum | AUD | | 1000 | gstIncluded, effectiveFrom 2026-09-30 | vic-veu-spec-v25 |
   | `vic-veu-copay-nonducted-10kw-plus` | `vic-veu-copayments` | Other non-ducted system, 10 kW or more | minimum | AUD | | 1000 | gstIncluded, effectiveFrom 2026-09-30 | vic-veu-spec-v25 |
   | `vic-veu-copay-split-under-10kw` | `vic-veu-copayments` | Other non-ducted (single split) system, below 10 kW | minimum | AUD | | 200 | gstIncluded, effectiveFrom 2026-09-30 | vic-veu-spec-v25 |
   | `vic-veu-copay-insulation` | `vic-veu-copayments` | Ceiling insulation (activity 48) | minimum | AUD | | 200 | gstIncluded | vic-veu-spec-v25 |
   | `vic-veu-copay-induction` | `vic-veu-copayments` | Induction cooktop, per product | minimum | AUD | | 200 | gstIncluded | vic-veu-spec-v25 |
   | `vic-veu-insulation-metro` | `vic-veu-insulation-household` | Average 150 m² house, metro Melbourne (mild climate zone) | up-to | AUD | | 1500 | | energyvic-insulation |
   | `vic-veu-insulation-regional` | `vic-veu-insulation-household` | Average 150 m² house, regional Victoria (cold climate zone) | up-to | AUD | | 2100 | | energyvic-insulation |
   | `vic-solar-homes-hw-rebate` | `vic-solar-homes-hotwater` | Solar Homes hot water rebate | up-to | AUD | | 1000 | | solarvic-hot-water-rebate |
   | `vic-solar-homes-hw-rebate-local` | `vic-solar-homes-hotwater` | Solar Homes hot water rebate, eligible locally made product | up-to | AUD | | 1400 | | solarvic-hot-water-rebate |
   | `vic-solar-homes-hw-share` | `vic-solar-homes-hotwater` | Share of the product price the rebate covers | exact | percent | | 50 | | solarvic-hot-water-rebate |
   | `vic-solar-homes-income-cap` | `vic-solar-homes-eligibility` | Combined household taxable income cap | exact | AUD | | 150000 | effectiveFrom 2026-07-01 | solarvic-income-cap-news |
   | `vic-solar-homes-income-cap-until-jun-2026` | `vic-solar-homes-eligibility-history` | Income cap before 1 Jul 2026 | exact | AUD | | 210000 | effectiveTo 2026-06-30, supersededBy vic-solar-homes-income-cap | solarvic-income-cap-news |
   | `vic-solar-homes-property-cap` | `vic-solar-homes-eligibility` | Property value cap | exact | AUD | | 3000000 | display compact | solarvic-hot-water-rebate |

   The existing `vic-veu-min-contribution` ($200, hot water) stays as it is. Add `conditions: ["Activities 1 and 3"]` to it, and add `vic-veu-spec-v25` to the sources of the pages that use it.
6. **Page edits.**
   - **`/victoria/air-conditioner-rebate/`:**
     - New section "The minimum you pay (from 30 September 2026)". It has `<FigureTable group="vic-veu-copayments">`, filtered to the five heating and cooling rows. Use a `rows` prop: add it to `FigureTable`, taking a list of ids.
     - One sentence: "For ducted systems this went up from `<Money id="vic-veu-copay-ducted-until-sep-2026"/>`."
     - Plain explanation: the discount comes off the price, but you still pay at least this amount, so an offer of a "free" or near-free ducted system can't be a legitimate VEU offer.
     - Cite `vic-veu-spec-v25` in the text: "VEU Specifications version 25.0, Part 6".
     - Add one FAQ, "Is there a minimum I have to pay for a ducted system?", answered without `$`; it links to the section.
     - Don't change the existing `answer`.
   - **`/victoria/reverse-cycle-vs-gas-heater/`:** where ducted systems come up, add one or two sentences with `<Money id="vic-veu-copay-ducted"/>` and the link to the AC page section. Don't add the full table.
   - **`/victoria/heat-pump-rebate/`:**
     - Replace "if eligible, link Solar Victoria, don't explain Solar Homes rules we haven't verified" with a short "Solar Homes hot water rebate" section. It says: up to `vic-solar-homes-hw-rebate` (`vic-solar-homes-hw-rebate-local` for an eligible locally made product), `vic-solar-homes-hw-share` of the price, calculated after STCs and VEECs. You must be an owner-occupier with household income under `vic-solar-homes-income-cap` ("from 1 July 2026; it was `vic-solar-homes-income-cap-until-jun-2026`"), the property must be valued under `vic-solar-homes-property-cap`, and the existing system must be at least 3 years old. You get pre-approval first, then install within 120 days.
     - Sources: `solarvic-hot-water-rebate`, `solarvic-income-cap-news`.
     - Keep the combined figures (`vic-hw-veu-plus-solar-homes`, `-local`) as they are.
   - **`/victoria/gas-to-electric-hot-water-2027/`:**
     - Replace the exemptions paragraph (and its "other exemptions are listed in the Plumbing Regulations" line) with a section headed "Exemptions in the regulation (reg 45E)". It uses plain wording of the reg 45E list, grouped as the regulation groups it:
       - **Practical limits (45E(3)):** not enough space inside, or no suitable outdoor space, for an electric water heater; a Class 2 building (apartments) or a pool served by a centralised gas system; an electric option would be unlawful under another law; it would need the main switchboard or a distribution board altered; it would need the electricity network augmented beyond a basic or standard connection.
       - **Kinds of work (45E(4)):** temporary disconnection and reconnection; like-for-like replacement where the gas water heater doesn't need an electricity connection to run; replacement within the warranty period.
       - **Timing (45E(5)):** work under a contract signed before 1 March 2027, if done within 3 months after that date; building work under s10(1) or (2) of the Building Act carried out before 1 March 2027; rectification orders issued before 1 March 2027.
       - Then: "The rule applies to plumbers, and a plumber who breaches it faces a penalty of 20 penalty units. This is a plain-English summary, not legal advice. Your licensed plumber decides whether an exemption applies."
     - Sources: `austlii-reg-45e` (text) and `legvic-bpar-2025` (authority), named in the copy as "the Plumbing Regulations, as amended by the Building and Plumbing Amendment Regulations 2025".
     - Remove any "unverified" marker. Keep the Gazette source.
     - **Before you save, Guri reads the AustLII text and confirms each bullet** (the wording is a summary of a regulation). If AustLII is unreachable, use legislation.vic.gov.au.
     - Write "within 3 months after 1 March 2027". **Don't** write "by 1 June 2027" (UNVERIFIED wording; see the TODO list).
   - **`/victoria/geelong/`:**
     - Add a local fact: "In the VEU postcode table (VEU Specifications v25.0, Location Variable List), postcodes 3216, 3218 and 3220 are listed as Regional, with a Mild climatic region." Source: `vic-veu-spec-v25`.
     - Then one sentence with both insulation examples (`vic-veu-insulation-metro`, `vic-veu-insulation-regional`): "Which example applies depends on how the program treats your postcode. The accredited provider confirms the amount in your quote."
     - Don't say Geelong gets the regional amount.
     - The ceiling insulation guide link is added in prompt 17.
   - Update `updatedOn` and `checkedOn` on all five pages to the day Guri checks them. Update `/sources/` (it's generated from the collection; confirm it lists 65).
7. **`check-sources.mjs` hardening** (the map's method note: energy.vic.gov.au is behind Cloudflare and rate-limits parallel fetches):
   - Fetch one URL at a time, with 3 seconds between requests, a browser-like `User-Agent` and `Accept`, and a timeout of 30 seconds. Retry once after 10 seconds.
   - A Cloudflare challenge page (title "Just a moment...") is reported as `CHALLENGE <url> (check by hand)`. It's not a pass and not a failure. It goes into the summary, and Guri opens those URLs by hand before a deploy.
   - A PDF URL passes when the response starts with `%PDF`.
   - Add a deny list `site/src/data/stale-sources.json` containing the EVLATEST URL. Fail the build if any source, page or figure references it.
8. Run `npm run build -w site` and all post-build checks. Fix anything that fails.

## Acceptance checks

```bash
cd site
npm run import:urlmap
# expect: "url-map: 53 rows (wave0 16, wave1 19, wave2 10, wave3 8); 0 errors"
node -e "const m=require('./src/data/url-map.json');console.log(m.length, m.filter(r=>r.gated).map(r=>r.url))"
# expect: 53 [ '/victoria/shepparton/' ]
npm run check            # expect: astro check 0 errors; vitest all pass (incl. new qualifier/unit/display tests)
npm run build && node scripts/check-figures.mjs
# expect: "check-figures: 40 figures, 0 stale, 0 raw amounts, 0 schema amounts"
ls src/content/sources/*.yaml | wc -l                       # expect: 65
grep -c "save-with-all-electric-home/electric-and-efficiency-standards-for-buildings$" src/content/sources/energyvic-electrification.yaml   # expect: 1
grep -o 'data-figure="vic-veu-copay-[a-z0-9-]*"' dist/victoria/air-conditioner-rebate/index.html | sort -u | wc -l   # expect: 6 (5 rows + the historical ducted figure)
grep -c 'data-figure="vic-veu-copay-ducted"' dist/victoria/reverse-cycle-vs-gas-heater/index.html    # expect: ≥ 1
grep -c 'data-figure="vic-solar-homes-income-cap"' dist/victoria/heat-pump-rebate/index.html        # expect: ≥ 1
grep -ci "unverified" dist/victoria/gas-to-electric-hot-water-2027/index.html                       # expect: 0
grep -c "45E" dist/victoria/gas-to-electric-hot-water-2027/index.html                               # expect: ≥ 1
grep -c "1 June 2027" dist/victoria/gas-to-electric-hot-water-2027/index.html                       # expect: 0
grep -c 'data-figure="vic-veu-insulation-regional"' dist/victoria/geelong/index.html                # expect: 1
grep -RIl "latest-discounts-and-rebates" src dist | wc -l                                            # expect: 0
node scripts/check-sources.mjs
# expect: "check-sources: 65 checked, 0 failed, N challenge (listed)". Guri opens any CHALLENGE URLs by hand.
```

Negative tests (each must fail as described, then revert):

- Add `https://www.energy.vic.gov.au/households/latest-discounts-and-rebates` to any source → `check-sources` fails with "stale source".
- Use `vic-veu-copay-ducted-until-sep-2026` on a page without `vic-veu-copay-ducted` → `check-figures` fails with "historical figure without its replacement".
- Type `at least $3,000` into the AC page MDX → `check-figures` fails, naming the file.

## What to test by hand

- Read the AC page co-payment table against SPEC25 Part 6 (page 29, "Applicable from 30 September 2026").
- Read the reg 45E summary against the AustLII text, line by line, with Guri.
- Keyboard and screen reader: the new table has a caption and header cells.

## TODO: UNVERIFIED (keep off every page; log in `docs/expansion-log.md`)

- Exempt-work end date wording "by 1 June 2027": confirm against the reg 45E text before using a date. Until then, write "within 3 months after 1 March 2027".
- The multi-split "at most 20 kW" calculation limit (trade sites). SPEC25 v25.0 Part 6 appears to contain a "maximum input for installations in residential premises is 20 kW" line from 30 Sep 2026, but the map marks it UNVERIFIED. Venture Architect or Guri must confirm it and update the map before it goes on a page.
- The LPG hot water discount amount (prompt 16 handles the checker wording).

## Conflicts and decisions to log

- **Co-payment wording.** The brief said "ducted reverse-cycle and multi-split systems of 10 kW or more". SPEC25 says **all** ducted systems (any size) are $3,000; multi-split is $3,000 at 10 kW or more and $1,000 below. The site uses the SPEC25 tiers.
- **Insulation:** is it metro/regional or mild/cold? See Context. Geelong is Regional + Mild.
- **`whittlesea-home-energy-program`** (homeenergyprogram.org.au, funded by the City of Whittlesea) backs a dollar figure in prompt 21 (assessments valued up to $575). Guri decides whether a council-funded program page counts as `official: true`. If not, that figure stays off the page.

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

Sitemap count for this prompt: **16** (no new URLs).

## Done when

All checks pass, the negative tests fail as designed, Guri has read the reg 45E summary and the co-payment table against the sources, and `docs/expansion-log.md` lists the conflicts above. Commit `fix(content): 30 Sep 2026 co-payments, Solar Homes caps, reg 45E exemptions, sources`.
