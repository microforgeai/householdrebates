# Prompt 19: Wave 2a: 5 audience pages and 2 support guides

> Local only. This adds 7 URLs (map rows 36–40, 44, 45). The deploy STOP at the end needs Guri's yes.
> Run it after prompt 18. Branch: `feat/expansion-19-wave2a`.

---

## Context

Wave 2 has 10 URLs: audience pages (renters, landlords, concession card holders, new homes, apartments), 3 tools (prompt 20) and 2 support guides (draught proofing, finding an accredited provider). This prompt does the 7 non-tool pages.

Three of them carry sensitive content:

- **Landlords (row 37)** summarises the rental minimum standards. It's not legal advice: summarise, then point to CAV.
- **Draught proofing (row 44)** must lead with the carbon monoxide safety rule.
- **Find an accredited provider (row 45)** must mention **Easy Electric SEC** openly. It's a free, state-owned quote-matching service that competes with our lead model. Hiding it would hurt trust. Whatever Guri decides about the lead model, the page mentions it.

Any map note that says "the checker has no … path" is out of date: prompt 16 added those paths.

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

1. Set `rollout.json` → `"enabledRows": "1-40,44-45"`.
2. **Figures:** append 11 rows (re-open each source; stop on any difference):

   | id | group | scenario | qualifier | unit | display | min | max | source |
   |---|---|---|---|---|---|---|---|---|
   | `vic-concession-electricity-rate` | `vic-concessions` | Annual electricity concession, share of usage and service costs | exact | percent | | | 17.5 | dffh-electricity-concession |
   | `vic-concession-electricity-excluded` | `vic-concessions` | First part of the yearly electricity bill the concession doesn't apply to | exact | AUD | cents | | 171.60 | dffh-electricity-concession |
   | `vic-concession-gas-rate` | `vic-concessions` | Winter gas concession (1 May to 31 Oct), share of costs | exact | percent | | | 17.5 | dffh-winter-gas-concession |
   | `vic-concession-gas-excluded` | `vic-concessions` | First part of the gas bill the winter concession doesn't apply to | exact | AUD | cents | | 62.40 | dffh-winter-gas-concession |
   | `vic-new-home-electric-saving` | `vic-electrify-savings` | New all-electric home, Energy Victoria's estimated yearly saving | exact | AUD | | | 990 | energyvic-new-buildings |
   | `vic-new-home-electric-solar-saving` | `vic-electrify-savings` | New all-electric home with solar, estimated yearly saving | exact | AUD | | | 1920 | energyvic-new-buildings |
   | `vic-solar-apartments-per-apartment` | `vic-solar-apartments` | Solar for Apartments, per apartment | up-to | AUD | | | 2800 | solarvic-apartments |
   | `vic-solar-apartments-per-property` | `vic-solar-apartments` | Solar for Apartments, per property | up-to | AUD | | | 140000 | solarvic-apartments |
   | `vic-veu-glazing-double` | `vic-veu-glazing-household` | Example: double glazing, per 10 m² | exact | AUD | | | 210 | energyvic-window-glazing |
   | `vic-veu-glazing-secondary` | `vic-veu-glazing-household` | Example: secondary glazing, per 10 m² | exact | AUD | | | 140 | energyvic-window-glazing |
   | `casey-diy-draught-rebate` | `casey-council` | City of Casey rebate for DIY draught-proofing products, one per household | up-to | AUD | | | 200 | casey-home-energy-rebates |

   - `casey-diy-draught-rebate` uses `program: "City of Casey"`. Add `program` values to the enum if it's an enum.
   - The apartment figures are Solar Victoria's. **Don't** confuse them with the stale "PV up to $2,800": that's a different program. Write the program name next to the figure every time.
3. Write the 7 pages below. Set `navGroup`: rows 36–40 → `audience`; rows 44–45 → `support-guides`.
4. **Links that the new pages make possible:** solar hot water guide → landlords page; insulation guide → renters and landlords pages; the checker's `RESULT_LINKS.sealing.internal = '/victoria/draught-proofing-rebate/'`; the hub shows the two new groups.
5. Run the checks and fix anything that fails.

## Pages (map rows 36–40, 44–45)

### Row 36: `/victoria/renters/`

- **File:** `site/src/content/guides/vic/renters.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** Can renters get VEU discounts in Victoria?
- **Secondary questions (a section or FAQ item each):** Do I need my landlord's permission? · What changes can I make without permission? · What must my landlord upgrade from 2027?
- **Priority / intent:** P2 · Intent: Medium (informational; large audience)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Renters are eligible; check with your landlord as permission may be needed <https://www.energy.vic.gov.au/victorian-energy-upgrades/homes/renters-landlords-and-body-corporate>
  - Heating and cooling: private rentals eligible; landlords and tenants should work together <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Without permission: LED bulbs (no new fittings), low-flow showerheads (keep the original), non-permanent window film <https://www.consumer.vic.gov.au/housing/renting/repairs-alterations-safety-and-pets/renters-making-changes-to-the-property>
  - Draughtproofing is a 'reasonable change' a landlord can't refuse without good reason, in a property without gas appliances; with gas, a gas safety check first <https://www.consumer.vic.gov.au/housing/renting/repairs-alterations-safety-and-pets/renters-making-changes-to-the-property>
  - Rental standards from 1 Mar 2027 <https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/landlords-rental-standards-2027/` · `/victoria/draught-proofing-rebate/` · `/victoria/gas-room-heater-to-split-system/` · `/victoria/concession-card-holders/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Solar Homes hot water is owner-occupier only (except Solstice towns) (source: <https://www.solar.vic.gov.au/hot-water-rebate>) (source: <https://www.solar.vic.gov.au/supporting-solstice-customers>).
- **Figure ids:** none required.
- Solar Homes hot water is for owner-occupiers (except in the Solstice towns). Link `/victoria/solstice-gas-shutdown-towns/` only once it's built; `RelatedLinks` handles that.

### Row 37: `/victoria/landlords-rental-standards-2027/`

- **File:** `site/src/content/guides/vic/landlords-rental-standards-2027.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** What do Victorian landlords have to upgrade under the 2027 rental energy efficiency standards?
- **Secondary questions (a section or FAQ item each):** When does each standard start? · What discounts can rental providers claim? · Exemptions?
- **Priority / intent:** P1 · Intent: High (compliance-driven, commercial)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Ceiling insulation R5.0 where none is present (new lease from 1 Mar 2027); 4-star WELS showerheads (new lease from 1 Mar 2027); efficient electric hot water when the old one fails (1 Mar 2027); RCAC heating in main living area when the heater fails (1 Mar 2027); cooling at a new lease from 1 Mar 2027 and for all rentals from 1 Jul 2030; draughtproofing from 1 Jul 2027 <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/energy-efficiency-for-rental-properties-in-victoria>
  - Heating needs a 2-star+ GEMS heating rating (non-ducted) or HSPF ≥ 3.2 (ducted) for the climate area; cooling 3-star+ or TCSPF ≥ 3.8 <https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards>
  - Exemptions incl centralised systems, no space for compressor, heritage or owners-corporation rules <https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards>
  - Rental providers: up to $1,610 (room gas → RCAC), up to $5,530 (ducted), $560 gas hot water → heat pump; PV up to $1,400 on up to 2 rentals per financial year <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/energy-efficiency-for-rental-properties-in-victoria>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/renters/` · `/victoria/ceiling-insulation-rebate/` · `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** The rental page shows 'up to $5,530' without the size caveat. On our site always attach the 22.4 kW scenario. Every standard's upgrade is VEU-eligible, per CAV (source: <https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards>).
- **Figure ids:** `vic-veu-rcac-room-room-gas`, `vic-veu-rcac-ducted-gas-22kw` (always with the 22.4 kW label), `vic-veu-hw-gas-to-heatpump`, `vic-solar-homes-pv-rebate`.
- A timeline table of the standards (dates are fine as text; star ratings, HSPF and TCSPF values are technical thresholds, not money, so they go in text with the CAV source).
- Not legal advice. Exemptions are summarised, and the reader is pointed to CAV.

### Row 38: `/victoria/concession-card-holders/`

- **File:** `site/src/content/guides/vic/concession-card-holders.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** What energy discounts can pensioners and concession card holders get in Victoria?
- **Secondary questions (a section or FAQ item each):** Does VEU have an income test? · What happens to my gas concession if I go electric? · Who can help with bills?
- **Priority / intent:** P2 · Intent: Medium (informational)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Annual electricity concession: 17.5% of usage and service costs, not on the first $171.60 a year; Pensioner Concession, Health Care or DVA Gold card <https://services.dffh.vic.gov.au/annual-electricity-concession>
  - Winter gas concession: 17.5%, 1 May–31 Oct, not on the first $62.40 <https://services.dffh.vic.gov.au/winter-gas-concession>
  - Energy Assistance Program: free Victorian Government help with plans, concessions and payment difficulty <https://www.energy.vic.gov.au/households/help-paying-your-energy-bills/energy-assistance-program>
  - VEU product pages show no income test <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Solar Homes cap $150,000 household income <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/veu-vs-solar-homes/` · `/victoria/get-off-gas-planner/` · `/victoria/renters/` · `/victoria/veu-scams-cold-calls/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** The $100 Power Saving Bonus round closed 31 Mar 2026 (energy.gov.au, per search). Don't promote it; re-check for a new round. Excess-bill thresholds ($4,038.82 electricity, $2,598.58 gas) change yearly.
- **Figure ids:** `vic-concession-electricity-rate` (17.5 percent), `vic-concession-electricity-excluded` (171.60, display cents), `vic-concession-gas-rate` (17.5 percent), `vic-concession-gas-excluded` (62.40, display cents), `vic-solar-homes-income-cap`.
- **Don't** mention the Power Saving Bonus, and don't give the excess-bill thresholds (they're in the map notes only, change yearly and have no row source).

### Row 39: `/victoria/new-homes-all-electric-2027/`

- **File:** `site/src/content/guides/vic/new-homes-all-electric-2027.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** Do new homes in Victoria have to be all-electric from 2027, and can new homes get rebates?
- **Secondary questions (a section or FAQ item each):** Does my building permit date matter? · Can a new home get VEU discounts? · Solar rebate while building?
- **Priority / intent:** P2 · Intent: Medium (informational; growth-corridor audience)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - From 1 Jan 2027 new homes and most new commercial buildings (incl knock-down rebuilds) must be all-electric; applies to building permits issued on or after 1 Jan 2027; substantial-design-progress certification exception <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/new-buildings-residential-and-most-commercial>
  - Existing buildings without gas can't connect from 1 Jan 2027 <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/new-buildings-residential-and-most-commercial>
  - New homes: RCAC discount typically $70–$140 (no decommissioning) <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/new-buildings-residential-and-most-commercial>
  - Solar PV rebate up to $1,400 for homes under construction; install within 270 days <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/new-buildings-residential-and-most-commercial> <https://www.solar.vic.gov.au/solar-panel-rebate>
  - Most VEU replacement discounts need a building > 2 years old <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - New all-electric homes save $990 a year, $1,920 with solar <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/new-buildings-residential-and-most-commercial>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-to-electric-hot-water-2027/` · `/victoria/air-conditioner-rebate/` · `/victoria/veu-vs-solar-homes/` · `/victoria/wyndham/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Explains why many homes in growth areas (Wyndham, Casey, Whittlesea) can't get replacement discounts if they're under 2 years old.
- **Figure ids:** `vic-veu-rcac-room-no-decommission`, `vic-solar-homes-pv-rebate`, `vic-new-home-electric-saving` (new, 990), `vic-new-home-electric-solar-saving` (new, 1,920).

### Row 40: `/victoria/apartments-and-units/`

- **File:** `site/src/content/guides/vic/apartments-and-units.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** Can apartments and units get VEU discounts or solar rebates in Victoria?
- **Secondary questions (a section or FAQ item each):** Body corporate approval? · Central gas hot water and the 2027 rule? · Solar for Apartments?
- **Priority / intent:** P2 · Intent: Medium (informational)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Owners corporations are eligible as residential (Class 1, 2, 3 or 4) or commercial, depending on classification <https://www.energy.vic.gov.au/victorian-energy-upgrades/homes/renters-landlords-and-body-corporate>
  - 2027 rule exemption: Class 2 building on a centralised gas system <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - Rental heating/cooling exemptions: centralised systems, no space for the compressor, owners-corporation rules <https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards>
  - Solar for Apartments: up to $2,800 per apartment, $140,000 per property, until 30 Jun 2027 or until exhausted <https://www.solar.vic.gov.au/apartments>
  - Expansion: up to 150 lots and no median property value limit <https://www.solar.vic.gov.au/expanding-solar-savings-more-victorians>
  - Weather sealing example for an apartment: $70 (2-year warranty) / $140 (5-year) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/weather-sealing-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-hot-water-ban-exemptions/` · `/victoria/landlords-rental-standards-2027/` · `/victoria/draught-proofing-rebate/` · `/victoria/veu-vs-solar-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** CONFLICT: the Solar for Apartments eligibility section still says 3–50 lots, while the 26 Oct 2026 news says 150. Show 'expanding: check current rules' until the program page updates.
- **Figure ids:** `vic-solar-apartments-per-apartment` (new, up to 2,800), `vic-solar-apartments-per-property` (new, up to 140,000), `vic-veu-sealing-apartment-2yr`, `vic-veu-sealing-apartment-5yr`.
- Lot limit CONFLICT (program page says 3–50; news says up to 150): write 'Solar Victoria is expanding the program. Check the current eligibility rules on its page.' Give neither number.

### Row 44: `/victoria/draught-proofing-rebate/`

- **File:** `site/src/content/guides/vic/draught-proofing-rebate.mdx`
- **Template (map):** Guide – upgrade swap (efficiency)
- **Primary question (build the H1 and answer block on it):** Is there a VEU discount for draught proofing (weather sealing) in Victoria?
- **Secondary questions (a section or FAQ item each):** What can be sealed? · Why don't homes with some gas heaters qualify? · Council rebates?
- **Priority / intent:** P3 · Intent: Medium (low ticket)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Examples: apartment $70/$140; townhouse $280/$560; house $350/$700 (2-year / 5-year warranty) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/weather-sealing-discounts>
  - Doors, windows, exhaust fans, wall vents, chimneys, evaporative cooler vents <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/weather-sealing-discounts>
  - Homes with open-flued or flueless gas heaters / open-flued water heaters indoors don't qualify (carbon monoxide risk) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/weather-sealing-discounts>
  - Window glazing: $210 (double-glazed) / $140 (secondary glazing) per 10 m² example <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/window-glazing-discounts>
  - Casey residents: separate council DIY rebate up to $200 <https://www.casey.vic.gov.au/home-energy-rebates>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ceiling-insulation-rebate/` · `/victoria/renters/` · `/victoria/casey/` · `/victoria/landlords-rental-standards-2027/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Safety copy is mandatory (CO risk). Rental draughtproofing standard starts 1 Jul 2027.
- **Figure ids:** the six `vic-veu-sealing-*` rows, `vic-veu-glazing-double` (new, 210), `vic-veu-glazing-secondary` (new, 140), `casey-diy-draught-rebate` (new, up to 200, council).
- Safety copy (carbon monoxide risk) is mandatory and goes before the amounts.

### Row 45: `/victoria/find-an-accredited-provider/`

- **File:** `site/src/content/guides/vic/find-an-accredited-provider.mdx`
- **Template (map):** Guide – question (trust)
- **Primary question (build the H1 and answer block on it):** How do I find a genuine VEU accredited provider near me?
- **Secondary questions (a section or FAQ item each):** What's the difference between a provider and an installer? · What is Easy Electric SEC? · Council programs?
- **Priority / intent:** P2 · Intent: Medium–High (bottom-funnel)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Only accredited providers can apply the discount; your own installer must partner with one before work starts <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Energy Vic lists providers by region (Barwon South West, Gippsland, Grampians, Greater Melbourne, Hume, Loddon Mallee); not all offer every upgrade at present <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Easy Electric SEC: free state tool with SEC-endorsed installers who contact you within one business day <https://www.secvictoria.com.au/news/going-electric-at-home-is-now-easy-as-with-sec> <https://www.secvictoria.com.au/households/help-centre/easy-electric-sec-online-tool/easy-electric-sec-faqs>
  - Council-backed programs exist in several LGAs (see area pages) <https://homeenergyprogram.org.au/councils/whittlesea/> <https://www.yarraranges.vic.gov.au/Our-services/Climate-and-environment/Sustainable-communities/Sustainable-homes>
- **Internal links (every one required; `check-urlmap` fails without them):** `/how-quotes-work/` · `/victoria/veu-scams-cold-calls/` · `/victoria/whittlesea/` · `/victoria/yarra-ranges/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** COMMERCIAL FLAG: SEC (state-owned) runs a free quote-matching service that competes with our lead model. Mention it honestly. Hiding it would hurt trust and EEAT.
- **Figure ids:** none.
- Mention Easy Electric SEC openly and fairly: what it is, that it's free, and that it's run by the state-owned SEC. Do this whatever Guri decides about the lead model, because hiding it would hurt trust. The quote form stays off.

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 68 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 42 URLs (expected 42), 0 extra, 0 missing links, 0 orphans, sitemap 42, llms 42"
grep -c '<loc>' dist/sitemap-0.xml                                                   # expect: 42
grep -c 'data-figure="vic-concession-electricity-excluded"' dist/victoria/concession-card-holders/index.html   # expect: 1
grep -c '\$171\.60' dist/victoria/concession-card-holders/index.html              # expect: ≥ 1 (cents display, inside the data-figure element)
grep -ci 'power saving bonus' dist/victoria/concession-card-holders/index.html      # expect: 0
grep -c '4,038\|2,598' dist/victoria/concession-card-holders/index.html             # expect: 0
grep -ci 'easy electric' dist/victoria/find-an-accredited-provider/index.html       # expect: ≥ 1
grep -c '3–50\|3-50\|150 lots' dist/victoria/apartments-and-units/index.html        # expect: 0 (lot limit conflict kept off)
grep -ci 'carbon monoxide' dist/victoria/draught-proofing-rebate/index.html         # expect: ≥ 1
grep -c 'vic-veu-rcac-ducted-gas-22kw' dist/victoria/landlords-rental-standards-2027/index.html   # expect: ≥ 1, shown with its 22.4 kW label
```

## What to test by hand

- Row 37: Guri checks the standards timeline against the Energy Victoria rental page and the CAV page.
- Row 44: the safety section comes before any amount, and reads clearly to someone who doesn't know what "open-flued" means.
- Row 45: the SEC mention is fair and factual: what it is, who runs it, and that it's free. It doesn't run down SEC.

## TODO: UNVERIFIED (kept off these pages; log it)

- The $100 Power Saving Bonus (round closed 31 Mar 2026, per a search result, not an official row source). Re-check it for a new round, and only add it from an official source.
- The excess-bill thresholds ($4,038.82 electricity, $2,598.58 gas) appear only in the map notes and the re-check list, with no row fact. They change yearly. Add them only if Guri wants them, from the DFFH pages, as figures.
- The Solar for Apartments lot limit (3–50 on the program page vs 150 in the 26 Oct 2026 news). Re-check it monthly, and give the number once the program page updates.

## Decisions for Guri

- **Easy Electric SEC vs our lead-fee model:** the map recommends mentioning it openly on row 45 (this prompt does). Guri should weigh it in the installer and lead-fee decisions before the form is ever turned on.

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

Sitemap count after this prompt: **42**.

## Done when

42 URLs build with every check passing, and Guri has read the landlords and draught-proofing pages against their sources. Commit `feat(wave2a): audience pages and support guides`.
