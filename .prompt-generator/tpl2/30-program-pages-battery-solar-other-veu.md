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

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

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

{{PAGES:69-71}}

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

{{BLOCK:deploy-stop}}

Sitemap count: the previous count + 3.

## Done when

The three pages are built from their rows, the Midday Power Saver and A4 changes are on the existing pages, A3 is either verified in the spec or logged, every check passes, and Guri has fact-checked and approved the deploy. Commit `feat(review): battery, solar and other VEU program pages (30)`.
