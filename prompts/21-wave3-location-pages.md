# Prompt 21: Wave 3: 7 location pages (Shepparton excluded and gated, see prompt 22)

> Local only. This adds 7 URLs (map rows 46, 47, 49–53). **Don't build `/victoria/shepparton/` (row 48) here.** The deploy STOP at the end needs Guri's yes.
> Run it after prompt 20. Branch: `feat/expansion-21-wave3`.

---

## Context

Wave 3 has 8 location pages. Each one passed the map's anti-doorway test: at least 4 verified, genuinely local facts. Melton was dropped because it had fewer than 4.

- **Included here:** Ballarat, Bendigo, Wyndham (marginal: its value is the council program), Casey, Whittlesea, Yarra Ranges, and a multi-town page for the 10 towns whose Solstice compressed natural gas networks are closing.
- **Shepparton** is gated until its council program (Goulburn Murray Solar Savers) is verified (prompt 22).

The local facts come from three places:

- **The VEU postcode table** (`vic-veu-postcodes.json`, from SPEC25 Table A, prompt 16): Metropolitan/Regional, reticulated gas, climatic region, and heat pump zone, for the postcodes the map lists.
- **NCC climate zones** from the ABCB shapefile (CC BY 4.0, attribution required). Venture Architect checked them by point at town centres. On the page, tell readers to confirm their own postcode on the ABCB Climate Map.
- **Council pages** and the regional provider counts on Energy Victoria's lists. The counts change often: re-check them monthly, or drop them.

Area rules from design §5.4 still hold: at least 4 `localFacts`, each with an official `sourceId`; `postcodes` match `^3\d{3}$`; no LocalBusiness schema; no form (it's off anyway).

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

## Steps

1. Set `rollout.json` → `"enabledRows": "1-47,49-53"`. Row 48 stays off.
2. **Area schema** (`content.config.ts`; update design §5.4):
   - Add `variant: standard | multi-town` (default `standard`).
   - For `multi-town`, add `towns: string[]` (at least 2), and make `councils` optional. The map doesn't list the councils for the Solstice towns, so don't invent them.
   - Add `veuPostcodeTable: boolean` (default `true`). When it's true, `AreaLayout` renders a table of the page's `postcodes` from `vic-veu-postcodes.json`, captioned "Source: VEU Specifications v25.0, Location Variable List (Table A). Checked {date}." The build fails if a listed postcode isn't in the table.
   - Add `nccZone?: { zone: number, places: string[] }`. When it's set, render the ABCB attribution line and the ABCB Climate Map link.
   - The "Other areas" list in `AreaLayout` links every enabled area (prompt 17 step A5).
   - `AreaLayout` renders each local fact as an element with `data-local-fact` and its source link. The acceptance checks count these.
3. **Figures:** append these rows (re-open each source; stop on any difference). Provider counts are `unit: count`, `qualifier: exact`, with a scenario like "Accredited providers listed for hot water, Grampians region". Re-check them monthly.

   | id | max | source |
   |---|---|---|
   | `vic-veu-providers-grampians-hw` | 31 | energyvic-hot-water |
   | `vic-veu-providers-grampians-hc` | 46 | energyvic-heating-cooling |
   | `vic-veu-providers-loddon-mallee-hw` | 26 | energyvic-hot-water |
   | `vic-veu-providers-loddon-mallee-hc` | 42 | energyvic-heating-cooling |
   | `vic-solstice-topup` (AUD, exact; "Solar Victoria top-up for Solstice customers who don't meet the VEU criteria") | 600 | solarvic-solstice |
   | `whittlesea-assessment-value` (AUD, up-to; "Value of a free home energy assessment, City of Whittlesea program") | 575 | whittlesea-home-energy-program. **Only if Guri accepted that source as official in prompt 15.** Otherwise skip this row. |

4. Write the 7 pages below with `navGroup: areas`. For each page:
   - Use the postcodes the row lists, and only those.
   - Give at least 4 `localFacts` from the row.
   - The answer block names the area and the council program first, then the VEU basics.
5. **Links:**
   - Every area links to the guides its row lists.
   - The Bendigo and Solstice pages link each other.
   - `/victoria/draught-proofing-rebate/` → `/victoria/casey/`.
   - `/victoria/find-an-accredited-provider/` → `/victoria/whittlesea/` and `/victoria/yarra-ranges/`.
   - `/victoria/renters/` → `/victoria/solstice-gas-shutdown-towns/`.

   `RelatedLinks` covers most of these. Check that `check-urlmap` reports 0 missing.
6. Run the checks and fix anything that fails.

## Pages (map rows 46–47, 49–53)

### Row 46: `/victoria/ballarat/`

- **File:** `site/src/content/areas/vic/ballarat.mdx`
- **Template (map):** Area (AreaLayout; ≥4 sourced localFacts)
- **Primary question (build the H1 and answer block on it):** What energy rebates and discounts can Ballarat households get?
- **Secondary questions (a section or FAQ item each):** Is Ballarat 'regional' for the insulation discount? · Do heat pumps work in Ballarat winters? · Council program?
- **Priority / intent:** P2 · Intent: Medium (local commercial)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU postcode table: 3350/3352/3355/3356/3357 = Regional, reticulated gas, 'Cold' climatic region, heat pump climatic zone 5 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - NCC climate zone 7 (cool temperate) for central Ballarat (ABCB shapefile, point check 13 Nov 2026) <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Insulation: regional (cold) example up to $2,100 vs $1,500 metro <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - City of Ballarat 'Electrify Your Home' with Geelong Sustainability's Electric Homes Program <https://www.ballarat.vic.gov.au/news/new-initiative-help-ballarat-homeowners-lower-their-energy-bills>
  - Grampians region: 31 hot water and 46 heating/cooling providers listed on 13 Nov 2026 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Frost protection advice for cooler climates <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ceiling-insulation-rebate/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/geelong/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED. The council news is from Mar 2025 and its rebate trial is reported closed: describe the program, not a rebate. Re-check monthly.
- **Figure ids:** `vic-veu-insulation-metro`, `vic-veu-insulation-regional`, `vic-veu-providers-grampians-hw` (new count 31), `vic-veu-providers-grampians-hc` (new count 46).
- Describe the council program. Don't call it a rebate: the trial is reported closed. Add the ABCB attribution line.

### Row 47: `/victoria/bendigo/`

- **File:** `site/src/content/areas/vic/bendigo.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates can Bendigo households get, including Marong and Heathcote?
- **Secondary questions (a section or FAQ item each):** What happened to Solstice gas in Marong/Heathcote? · Free in-home energy advice? · Is Bendigo regional?
- **Priority / intent:** P2 · Intent: Medium (local commercial)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU postcode table: 3550/3551/3555/3556 = Regional, reticulated gas, Cold; 3515 (Marong) and 3523 (Heathcote) = non-reticulated <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Solstice CNG decommissioning: Marong after 2 Aug 2026; Heathcote after 16 Aug 2026 <https://www.bendigo.vic.gov.au/community-services/environment/support-solstice-energy-impacted-customers>
  - Solstice exemptions: no $150k income cap, any-age hot water system, rental providers can apply, $600 top-up if VEU criteria not met <https://www.solar.vic.gov.au/supporting-solstice-customers>
  - Council Home Energy Empowerment Program with In-Home Energy Snapshots and DIY workshops <https://www.bendigo.vic.gov.au/community-services/environment/saving-energy>
  - Marong study: LPG running costs at least 2.5× partly/fully electric; 4-bed partial electrification payback about 3–4 years <https://www.bendigo.vic.gov.au/community-services/environment/support-solstice-energy-impacted-customers>
  - NCC zone 6; Loddon Mallee region providers: 26 hot water / 42 heating-cooling <https://data.gov.au/data/dataset/australian-climate-zone-map> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/solstice-gas-shutdown-towns/` · `/victoria/get-off-gas-planner/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED. The strongest local page of the set.
- **Figure ids:** `vic-solstice-topup` (new, 600), `vic-solar-homes-income-cap`, `vic-veu-providers-loddon-mallee-hw` (new count 26), `vic-veu-providers-loddon-mallee-hc` (new count 42).
- The Marong payback and the 2.5× running-cost comparison are council study findings. Attribute them to the City of Greater Bendigo and don't generalise.

### Row 49: `/victoria/wyndham/`

- **File:** `site/src/content/areas/vic/wyndham.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates and help can Wyndham (Werribee, Point Cook, Tarneit) households get?
- **Secondary questions (a section or FAQ item each):** Council Energy Smart Homes? · Can I borrow an energy kit? · Help in Punjabi/other languages? · New homes under 2 years?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Wyndham City 'Energy Smart Homes' program with workshop recordings and a 'Your Go Electric Plan' <https://www.wyndham.vic.gov.au/services/environment-and-sustainability/sustainable-living/energy-smart-homes>
  - Borrowable My Home Energy and Water Efficiency Kits at local libraries <https://www.wyndham.vic.gov.au/services/environment-and-sustainability/sustainable-living/energy-smart-homes>
  - Interpreted 'Home Energy in Your Language' webinars (Arabic, Mandarin, Cantonese, Vietnamese, Sgaw Karen, Punjabi) by WAGA for six western councils incl Wyndham <https://www.wyndham.vic.gov.au/services/environment-and-sustainability/sustainable-living/energy-smart-homes>
  - VEU postcode table: 3024/3029/3030 = Metropolitan, reticulated gas, Mild <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Most replacement discounts need a building > 2 years old (relevant in new estates) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/new-homes-all-electric-2027/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/melbourne/` · `/victoria/concession-card-holders/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED (marginal: climate and gas status are the same as Melbourne; the local value is the council program). Wyndham's residents' survey to 30 Nov 2026 came from a local-media search: UNVERIFIED.
- **Figure ids:** none required.
- Name the six languages. Don't mention the residents' survey (TODO).

### Row 50: `/victoria/casey/`

- **File:** `site/src/content/areas/vic/casey.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates can City of Casey households get (Narre Warren, Berwick, Cranbourne)?
- **Secondary questions (a section or FAQ item each):** Council $200 draught proofing rebate? · Can a tradesperson install it? · How does it fit with VEU weather sealing?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Council rebate up to $200 for DIY draught-proofing products, one per household, receipts within 6 months, claimed via rebately.co <https://www.casey.vic.gov.au/home-energy-rebates>
  - Not claimable for paying a tradesperson, insulation batts, double glazing or heating upgrades <https://www.casey.vic.gov.au/home-energy-rebates>
  - Energy and Water Efficiency Home Audit Kit available to hire <https://www.casey.vic.gov.au/home-energy-rebates>
  - VEU weather sealing (provider-installed) is a separate discount: house example up to $700 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/weather-sealing-discounts>
  - VEU postcode table: 3805/3806/3976/3977/3978 = Metropolitan, reticulated gas, Mild <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/draught-proofing-rebate/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/gas-room-heater-to-split-system/` · `/victoria/melbourne/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED. 'May pause when budget exhausted': re-check monthly.
- **Figure ids:** `casey-diy-draught-rebate`, `vic-veu-sealing-house-5yr`.
- Explain that the council rebate (DIY products) and the VEU weather-sealing discount (provider-installed) are separate. Re-check the council budget monthly.

### Row 51: `/victoria/whittlesea/`

- **File:** `site/src/content/areas/vic/whittlesea.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates and free help can City of Whittlesea households get?
- **Secondary questions (a section or FAQ item each):** Free home energy assessment? · Who installs electrification upgrades? · Council net zero target?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - City of Whittlesea Home Energy Program launched (news 20 Oct 2026) with events, 'speed date' sessions and a Home Energy Expo <https://www.whittlesea.vic.gov.au/About-us/News/Latest-news/Save-money-and-stay-comfortable-with-the-Home-Energy-Program>
  - Free home energy assessments valued up to $575, until June 2027 or until funds run out; one per property; not if assessed in the last 5 years <https://homeenergyprogram.org.au/councils/whittlesea/>
  - Electrification upgrades routed to Easy Electric SEC installers <https://homeenergyprogram.org.au/councils/whittlesea/> <https://www.secvictoria.com.au/news/going-electric-at-home-is-now-easy-as-with-sec>
  - Council target: net zero community emissions by 2036 <https://www.whittlesea.vic.gov.au/About-us/News/Latest-news/Save-money-and-stay-comfortable-with-the-Home-Energy-Program>
  - VEU postcode table: 3076/3750/3752/3754/3757 = Metropolitan, reticulated gas, Mild <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/find-an-accredited-provider/` · `/victoria/get-off-gas-planner/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/melbourne/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED. Council's 'Energy Smart Homes Grant' page returned 403: UNVERIFIED, leave out.
- **Figure ids:** `whittlesea-assessment-value` (new, up to 575). Only if Guri accepted `whittlesea-home-energy-program` as `official: true` in prompt 15; otherwise describe the free assessment with no amount.
- Don't mention the 'Energy Smart Homes Grant' (TODO).

### Row 52: `/victoria/yarra-ranges/`

- **File:** `site/src/content/areas/vic/yarra-ranges.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates can Yarra Ranges households get (Lilydale, Healesville, the Dandenongs)?
- **Secondary questions (a section or FAQ item each):** Is the Dandenongs a 'cold' area for VEU? · Council Home Energy Program? · Local community energy groups?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU postcode table: Dandenongs and Healesville postcodes (3770, 3775, 3777, 3786–3788, 3795, 3796) = 'Cold' climatic region; 3139, 3140, 3770, 3775 and 3777 = heat pump zone 5; 3799 (Warburton) = Regional <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - NCC climate zone 7 at Lilydale, Healesville, Olinda and Warburton (point checks) <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Yarra Ranges Home Energy Program: draught proofing, insulation, assessments; electrification via Easy Electric SEC <https://www.yarraranges.vic.gov.au/Our-services/Climate-and-environment/Sustainable-communities/Sustainable-homes>
  - Council: pre-1990 Victorian homes average a 1.5-star rating <https://www.yarraranges.vic.gov.au/Our-services/Climate-and-environment/Sustainable-communities/Sustainable-homes>
  - Community groups: Healesville CoRE, Repower the Dandenongs <https://www.yarraranges.vic.gov.au/Our-services/Climate-and-environment/Sustainable-communities/Sustainable-homes>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ceiling-insulation-rebate/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/find-an-accredited-provider/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED. A mixed shire: show a postcode table rather than one claim for the whole shire.
- **Figure ids:** none required.
- Show a postcode table from `vic-veu-postcodes.json` for the listed postcodes, not one claim for the whole shire. Add the ABCB attribution line.

### Row 53: `/victoria/solstice-gas-shutdown-towns/`

- **File:** `site/src/content/areas/vic/solstice-gas-shutdown-towns.mdx`
- **Template (map):** Area – multi-town (AreaLayout variant)
- **Primary question (build the H1 and answer block on it):** My town's Solstice compressed natural gas network is closing. What rebates can I get to go electric?
- **Secondary questions (a section or FAQ item each):** Which towns? · Which exemptions apply? · Electric vs LPG costs?
- **Priority / intent:** P2 · Intent: High for a small audience (problem-aware)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Solstice CNG networks in Marong, Heathcote, Swan Hill, Maldon, Robinvale, Kerang, Nathalia, Terang, Lakes Entrance and Orbost to shut by mid-to-late 2026 <https://www.solar.vic.gov.au/supporting-solstice-customers>
  - Exemptions: no $150k income cap; hot water of any age; rental providers eligible; $600 top-up when VEU rules (home < 2 years, recent system) aren't met <https://www.solar.vic.gov.au/supporting-solstice-customers>
  - 8 accredited providers confirmed availability for the 10 towns <https://www.solar.vic.gov.au/supporting-solstice-customers>
  - Marong study: LPG at least 2.5× running cost of electric <https://www.bendigo.vic.gov.au/community-services/environment/support-solstice-energy-impacted-customers>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/bendigo/` · `/victoria/get-off-gas-planner/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/veu-vs-solar-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** NEW LOCATION FIND: genuinely local and officially sourced. Time-limited: once the networks close, move it to an archive or 'what happened' page. The Solstice page's 'PV up to $2,800' is stale (PV is $1,400).
- **Figure ids:** `vic-solstice-topup`, `vic-solar-homes-income-cap`.
- Postcodes: the map gives only Marong 3515 and Heathcote 3523, so use those two. Don't add others (see the conflict log). `variant: multi-town` with `towns: [10 names]`.
- Never use PV $2,800 (stale on the Solstice page). Add `reviewBy` = the date Solar Victoria gives for the last network closure, or 2027-01-31 if none is stated, for the archive decision.

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 76 figures, …" (75 if the Whittlesea figure was skipped), 0 stale, 0 raw amounts, 0 schema amounts
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 52 URLs (expected 52), 0 extra, 0 missing links, 0 orphans, sitemap 52, llms 52"
grep -c '<loc>' dist/sitemap-0.xml                                       # expect: 52
test ! -e dist/victoria/shepparton/index.html && echo "shepparton not built"   # expect: shepparton not built
grep -c 'shepparton' dist/sitemap-0.xml dist/llms.txt                     # expect: 0 and 0
grep -RIl 'LocalBusiness' dist | wc -l                                    # expect: 0
for a in ballarat bendigo wyndham casey whittlesea yarra-ranges solstice-gas-shutdown-towns; do grep -c 'data-local-fact' dist/victoria/$a/index.html; done   # expect: each ≥ 4
grep -c 'CC BY 4.0' dist/victoria/ballarat/index.html dist/victoria/yarra-ranges/index.html   # expect: ≥ 1 each
grep -ci 'energy smart homes grant' dist/victoria/whittlesea/index.html  # expect: 0
grep -ci 'survey' dist/victoria/wyndham/index.html                        # expect: 0
grep -c '2,800' dist/victoria/solstice-gas-shutdown-towns/index.html     # expect: 0
grep -ci 'rebate' dist/victoria/ballarat/index.html                       # check by eye: the council program is never called a rebate
```

## What to test by hand

- Each page's postcode table matches the SPEC25 PDF rows (spot-check 2 postcodes per page).
- Read every local fact against its council page today. Council programs change fast.
- Yarra Ranges: the page doesn't make one claim for the whole shire. The postcode table carries the detail.

## TODO: UNVERIFIED (kept off these pages; log it)

- Wyndham residents' survey to 30 Nov 2026 (local media search only).
- Whittlesea "Energy Smart Homes Grant" (the council page returned 403).
- Postcodes for the 8 Solstice towns other than Marong (3515) and Heathcote (3523). The map doesn't list them. Add them only after Venture Architect adds them to the map with a source.
- Councils for the Solstice towns (not in the map).
- Ballarat's council rebate trial is "reported closed". Describe the program only.

## Conflicts to log

- **Area schema vs multi-town page:** design §5.4 requires `councils` (at least 1) and sourced postcodes. The Solstice row gives 10 towns but only 2 postcodes and no councils. This prompt makes `councils` optional for `multi-town` and uses only the 2 postcodes. Guri or Venture Architect can add the rest later through the map.

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

Sitemap count after this prompt: **52** (Shepparton is still gated).

## Done when

52 URLs build with every check passing, Shepparton isn't built, and Guri has read each local page against its sources. Commit `feat(wave3): 7 location pages`.
