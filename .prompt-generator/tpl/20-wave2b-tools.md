# Prompt 20: Wave 2b: three tools (running costs, hot water size guide, get-off-gas planner)

> Local only. This adds 3 URLs (map rows 41–43) and completes Wave 2 (10 URLs). The deploy STOP at the end needs Guri's yes.
> Run it after prompt 19. Branch: `feat/expansion-20-tools`.

---

## Context

The map asks for three small tools on `ToolLayout`, each a static page with a small island, like the checker:

- **Gas vs heat pump running costs (row 41).** MVP = show Energy Victoria's **published** savings for the scenario the person picks. No modelling of our own and no default tariffs: the Victorian Default Offer and similar are UNVERIFIED here.
- **Heat pump hot water size guide (row 42).** A pure lookup from Energy Victoria's water heating factsheet, plus a "cold area" note from the VEU postcode table (prompt 16). No lead capture.
- **Get-off-gas planner (row 43).** The discount for each step, the supply-charge saving once the last gas appliance goes, and how abolishment works. **The map gives no official "right order"** for the primary question "in what order?". So the planner shows facts per appliance plus the one sourced trigger: the 1 March 2027 rule applies when a gas water heater needs replacing. It doesn't recommend a sequence of its own. This is logged as a conflict.

The tools follow the same rules as the checker:

- No network calls, and nothing leaves the browser.
- Figures come from the embedded `<script type="application/json" id="figures">` and render with `data-figure`.
- Each island's JS is under 15 KB gzipped.
- The page works with JS off: the full table or list is server-rendered and the island only filters it.

{{BLOCK:rules}}

## Steps

1. Set `rollout.json` → `"enabledRows": "1-45"`.
2. **Figures:** append 2 rows (re-open the source; stop on any difference):

   | id | group | scenario | qualifier | max | source |
   |---|---|---|---|---|---|
   | `vic-existing-home-electric-saving` | `vic-electrify-savings` | Existing home going all-electric, Energy Victoria's estimated yearly saving | about | 1900 | energyvic-electrification |
   | `vic-existing-home-electric-solar-saving` | `vic-electrify-savings` | Existing home going all-electric with solar, estimated yearly saving | about | 2230 | energyvic-electrification |

3. **Size guide data:** `site/src/data/tools/hw-size-guide.json`:
   ```json
   { "sourceId": "energyvic-hw-factsheet", "checkedOn": "<date>",
     "rows": [ { "bedrooms": "1–2", "litres": "150–225" }, { "bedrooms": "3", "litres": "225–300" }, { "bedrooms": "4 or more", "litres": "more than 300" } ],
     "sizeUpIf": ["long or frequent showers", "baths", "showers at the same time", "no low-flow showerheads", "appliances plumbed to hot water"] }
   ```
   - Copy the exact words from the factsheet PDF.
   - Extend `check-figures` so `checkedOn` here is held to the same 45-day rule, and so `sourceId` must resolve to an official source.
4. **Islands:**
   - `RunningCostsPicker`: a radio list of the four published scenarios (gas → electric hot water; room gas heater → RCAC; ducted gas → RCAC; whole home all-electric, with and without solar), then shows that figure with its checked-on line. Under it: "These are Energy Victoria's estimates, not a calculation for your home. Your saving depends on your tariffs, usage and the product." No inputs for tariffs.
   - `HwSizeGuide`: bedrooms select → litres row. Optional postcode → `vic-veu-postcodes.json` → "heat pump climatic zone {4|5}" with the frost-protection note. Note that STCs apply only to heat pumps under 425 L (CER).
   - `GasExitPlanner`: tick the gas appliances you have (hot water, room heater, ducted heater, cooktop). For each, show the VEU discount figure(s) and a link to the swap guide. Once all are ticked, show `vic-gas-supply-saving` and the abolishment steps: through your retailer; AusNet example times for meter removal and cut-and-cap; other distributors may differ. Link to `/victoria/how-long-does-an-upgrade-take/`. No fee amount.
5. Write the 3 pages below with `navGroup: tools`. Each has an answer block, an explanation of where the numbers come from, a FAQ, and sources.
6. Link `/victoria/gas-cooktop-to-induction/` and `/victoria/gas-hot-water-to-heat-pump/` to the new tools where the rows' links ask for it. `RelatedLinks` adds most of these automatically.
7. Unit tests for each island's pure logic (`tests/unit/tools.test.ts`), plus e2e: keyboard use, the JS-off fallback, and zero network requests.

## Pages (map rows 41–43)

{{PAGES:41-43}}

## Acceptance checks

```bash
cd site
npm run test && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 70 figures, 0 stale, 0 raw amounts, 0 schema amounts" (+ "tool data: 1 file, 0 stale")
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 45 URLs (expected 45), 0 extra, 0 missing links, 0 orphans, sitemap 45, llms 45"
grep -c '<loc>' dist/sitemap-0.xml                                                   # expect: 45
grep -ci 'tariff' dist/victoria/gas-vs-heat-pump-running-costs/index.html           # expect: only in the "depends on your tariffs" sentence (≤ 2)
grep -c '<input[^>]*type="number"' dist/victoria/gas-vs-heat-pump-running-costs/index.html   # expect: 0 (no tariff inputs)
grep -c 'abolish' dist/victoria/get-off-gas-planner/index.html                       # expect: ≥ 1
grep -c '\$270' dist/victoria/get-off-gas-planner/index.html                         # expect: 0
for f in dist/_astro/*Picker*.js dist/_astro/*SizeGuide*.js dist/_astro/*Planner*.js; do gzip -c "$f" | wc -c; done   # expect: each < 15360
npx playwright test tests/e2e/tools.spec.ts                                          # expect: all pass
```

## What to test by hand

- Each tool on a phone, keyboard only, and with JS off.
- The size guide's wording matches the factsheet exactly.
- The planner never implies a required order. It reads as "here's what each step gets you".

## TODO: UNVERIFIED (kept out of the tools; log it)

- Default tariffs (Victorian Default Offer or others): not verified. A tariff mode needs user-entered tariffs, or ESC-published tariffs fetched at build time. That's a separate prompt, and only if Guri wants it.
- The gas meter abolishment fee (trade sites say about $270; AusNet points to its yearly tariff schedule). Link only.
- The Bendigo payback study stays on the Bendigo and Solstice pages, not in the planner.

## Conflicts to log

- Row 43's primary question asks for an order ("in what order?"). No row source gives one. The page answers with the sourced facts per step and the 2027 hot water trigger, and says there's no single official order.

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **45** (Wave 2 complete).

## Done when

45 URLs build with every check passing, the island budgets hold, and Guri has tried each tool. Commit `feat(wave2b): running costs, size guide, get-off-gas planner`.
