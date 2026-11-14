# Prompt 36: One postcode lookup page (`/victoria/postcode/`), not 719 pages

> Local first, then a deploy STOP. Adds **1 URL** (map row 54, wave 2). Branch: `feat/pack-36-postcode`.
> **Run order:** after 34 (postcodes.json) and 35a (shared `area.ts`). Before 37–39, whose hubs link here.
> References: `docs/url-map.md` Wave 2 row 54 and "Method notes" (postcodes.csv); `docs/postcodes.csv` (master, read-only); `docs/eligibility-checker-spec.md` §4 R2 ("Your area" card) and §5.4 (insulation by postcode); `docs/solution-design.md` §4.3 (no doorway pages), §5.4.

---

## Goal

A single static page that answers "Is my postcode metro or regional for VEU, and does it have mains gas?" for all 719 VEU Table A postcodes, with a client-side search. It does **not** generate a page per postcode (doorway risk; map note). The checker reuses the same data and card.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

Rule 11 applies with force here: no `/victoria/postcode/3427/`-style URLs, no query-string pages in the sitemap, `noindex` isn't a workaround. `check-urlmap` fails on any built path under `/victoria/postcode/` other than the page itself.

## The page (from the map)

{{PAGES:54-54}}

## Steps

1. **Static content first (works without JS):**
   - H1 and a 2–4 sentence answer: Victoria's VEU Specifications classify every postcode as Metropolitan or Regional, with or without mains (reticulated) gas, in a Mild, Cold or Hot climate region and heat pump zone 4 or 5; these change some discount calculations; enter your postcode below.
   - The statewide counts from the row (719 postcodes: 281 Metropolitan / 438 Regional; 406 with reticulated gas / 313 without; 404 Mild / 268 Cold / 47 Hot; zone 4: 608, zone 5: 111) rendered from `postcodes.json` at build time, not typed, and `check-postcodes` asserts they equal the row's numbers (a mismatch is a STOP: the map and CSV disagree).
   - "What each column means": VEU area, gas, climate region, heat pump zone, council (ABS allocation, weighted by 2021 dwellings; 25 PO-box postcodes have no dwellings and their council is indicative), with what each changes (spec §5.4: insulation; heat pump zone: hot water savings; no gas: the gas-related lines).
   - Insulation by postcode type: the two official Energy Victoria examples via `<Money>` and the three prompt-34 estimates, labelled "(our estimate)", with the method disclosure. No other pairing gets a number.
   - A no-JS fallback: a `<details>` per VEU area/climate combination listing its postcodes as plain numbers (no links, no localities). Postcodes aren't links to anywhere.
2. **Search (Preact island, under 15 KB gzipped):** one input (4 digits, numeric keypad) or a locality name (typeahead over the CSV `localities`). Fetches the same compact `/data/postcodes.v{hash}.json` as the checker (35b). Result card = the checker's "Your area" card component (shared): localities, council(s) with share, area, gas, climate, zone, then:
   - "Check your discounts for this postcode" → `/victoria/eligibility-checker/?pc=3427` (the checker pre-fills R2 and starts at S1; the query string is excluded from the sitemap and canonical).
   - "More about your area" → the area/hub page for the CSV `primary_lga` from 35a `links.ts` (enabled rows only).
   - A no-gas postcode adds the GAS-NO line from the spec (link to `/victoria/lpg-homes/` once enabled, else `/victoria/get-off-gas-planner/`); a zone-5 postcode adds the HPZ-5 note. Text from the spec, no figures.
   - Not found → spec message X1.
   - Nothing typed is stored, logged or sent.
3. **Freshness and source:** "From VEU Specifications v25.0 Table A; councils from ABS ASGS Edition 3 allocation files, weighted by 2021 Census dwellings. Checked {date}." The page's `checkedOn` is the CSV's (14 Nov 2026) and the 45-day rule applies; a stale CSV fails the build like a stale figure.
4. **Schema:** BreadcrumbList, FAQPage. No `Dataset`, `Place` or `LocalBusiness`. No `$`.
5. **FAQ (3–5, with `canonicalPage`):** the row's secondary questions (climate region, heat pump zone, council, which insulation figure applies). Answers link to sections; no amounts.
6. **Inbound links:** every row that lists `/victoria/postcode/` (row 26 from prompt 34's table, 56–64, the LPG page (row 74), the checker, the footer from prompt 33). At least 2 inbound links on enable.
7. **Enable row 54** in `rollout.json` and run the checks.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs     # expect: +1 URL; 0 paths under /victoria/postcode/ besides the page
find dist/victoria/postcode -name index.html | wc -l      # expect: 1
node scripts/check-postcodes.mjs  # expect: 719 rows; counts 281/438, 406/313, 404/268/47, 608/111 match the row
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-figures.mjs
grep -c '<a [^>]*href="/victoria/postcode/3' dist/victoria/postcode/index.html   # expect: 0
npx playwright test tests/e2e/postcode.spec.ts
# expect: 3427 → Diggers Rest card + corridor link (or fallback); 3438 → Cold, zone 5, estimate line; 3430 → no gas line; "Gisborne" typeahead → 3437; 2000 → X1; works with JS off (details lists)
```

## What to test by hand

Guri looks up 3427 and two postcodes he knows on a phone and compares the card with the CSV row.

## Open decisions for Guri

- Locality typeahead: include it (default) or postcode-only.

{{BLOCK:deploy-stop}}

Sitemap count: +1.

## Done when

`/victoria/postcode/` is live after Guri's yes, with no per-postcode URLs. Commit `feat(postcode): single postcode lookup page (36)`.
