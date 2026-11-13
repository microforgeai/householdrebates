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

### Row 41: `/victoria/gas-vs-heat-pump-running-costs/`

- **File:** `gas-vs-heat-pump-running-costs.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/gas-vs-heat-pump-running-costs/` by the same route
- **Template (map):** Tool – calculator (ToolLayout island)
- **Primary question (build the H1 and answer block on it):** How much would I save a year by switching from gas hot water or heating to a heat pump?
- **Secondary questions (a section or FAQ item each):** Hot water vs heating savings? · With solar? · With a concession?
- **Priority / intent:** P2 · Intent: Medium–High (tool; link magnet)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Gas → electric hot water saves around $400 a year <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Room gas heater → RCAC up to $460 a year; ducted gas → RCAC up to $1,140 a year <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Existing home all-electric about $1,900 a year, $2,230 with solar <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings>
  - Removing all gas appliances avoids about $350–$400 a year in supply charges <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/get-off-gas-planner/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/concession-card-holders/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** MVP = show Energy Vic's published savings by scenario (no own modelling). Any tariff-based mode needs user-entered tariffs; default tariffs (e.g. Victorian Default Offer) are UNVERIFIED here. Fetch them from the ESC at build time if used.
- **Figure ids:** `vic-electrify-hw-saving`, `vic-rcac-saving-room-gas`, `vic-rcac-saving-ducted-gas`, `vic-existing-home-electric-saving` (new, about 1,900), `vic-existing-home-electric-solar-saving` (new, about 2,230), `vic-gas-supply-saving`.
- MVP only: a scenario picker that shows Energy Victoria's published savings for that scenario. No tariff inputs, no default tariffs, no own modelling.

### Row 42: `/victoria/heat-pump-hot-water-size-guide/`

- **File:** `heat-pump-hot-water-size-guide.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/heat-pump-hot-water-size-guide/` by the same route
- **Template (map):** Tool – sizing guide (static table + small island)
- **Primary question (build the H1 and answer block on it):** What size heat pump hot water system do I need for my household?
- **Secondary questions (a section or FAQ item each):** Does a timer/solar change the size? · Cold climate? · Noise and placement?
- **Priority / intent:** P2 · Intent: Medium (pre-purchase)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - 1–2 bedrooms: 150–225 L; 3 bedrooms: 225–300 L; 4+: more than 300 L <https://www.energy.vic.gov.au/__data/assets/pdf_file/0018/710280/VEU-water-heating-consumer-factsheet.pdf>
  - Size up for long or frequent showers, baths, simultaneous showers, no low-flow heads, plumbed hot water appliances <https://www.energy.vic.gov.au/__data/assets/pdf_file/0018/710280/VEU-water-heating-consumer-factsheet.pdf>
  - Heat pumps make noise comparable to an air conditioner <https://www.energy.vic.gov.au/__data/assets/pdf_file/0018/710280/VEU-water-heating-consumer-factsheet.pdf>
  - Cooler climates: consider frost protection <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
  - STCs only for heat pumps < 425 L <https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-renewable-energy-systems/solar-water-heaters-and-air-source-heat-pumps>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/electric-hot-water-to-heat-pump/` · `/victoria/heat-pump-rebate/` · `/victoria/ballarat/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Pure lookup, no lead capture. Add a 'cold area' note fed by the VEU postcode table (heat pump climatic zone 4 or 5).
- **Figure ids:** none (litres aren't money). The size table comes from `site/src/data/tools/hw-size-guide.json` with `sourceId: energyvic-hw-factsheet` and `checkedOn`, and the 45-day freshness check covers it.
- Cold-area note: postcode input → `vic-veu-postcodes.json` → 'In the VEU postcode table, {postcode} is in heat pump climatic zone {4|5}.' Then the frost-protection advice from `energyvic-existing-homes`. No lead capture.

### Row 43: `/victoria/get-off-gas-planner/`

- **File:** `get-off-gas-planner.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/get-off-gas-planner/` by the same route
- **Template (map):** Tool – planner (ToolLayout island)
- **Primary question (build the H1 and answer block on it):** What does it cost to get completely off gas in Victoria, and in what order?
- **Secondary questions (a section or FAQ item each):** Which appliance first? · How do I abolish my gas meter, and what does it cost? · What discounts apply to each step?
- **Priority / intent:** P2 · Intent: Medium (planning)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Discounts per step: hot water $560 (gas → heat pump) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>; room heater $630–$1,610 / ducted up to $5,530 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>; induction $140 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Supply charges saved about $350–$400 a year once the last gas appliance goes <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Abolishment is requested through your gas retailer; meter removal 2 business days; cut-and-cap up to 15 business days (AusNet) <https://www.ausnetservices.com.au/gas/connections/requesting-a-gas-disconnection-reconnection-or-abolishment>
  - Distributors must publish abolishment information <https://www.esc.vic.gov.au/electricity-and-gas/codes-guidelines-and-policies/gas-distribution-system-code-practice/reviewing-gas-distribution-system-code-practice>
  - Existing homes need not replace gas heating or cooktops <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
  - Bendigo study: 4-bed partial electrification pays back in about 3–4 years vs LPG <https://www.bendigo.vic.gov.au/community-services/environment/support-solstice-energy-impacted-customers>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-cooktop-to-induction/` · `/victoria/gas-vs-heat-pump-running-costs/` · `/victoria/how-long-does-an-upgrade-take/` · `/victoria/solstice-gas-shutdown-towns/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Abolishment fee $: UNVERIFIED (AusNet's page points to its yearly tariff schedule; trade sites quote about $270). Pull each distributor's published fee at build time, or link only. Don't present the Bendigo payback as statewide.
- **Figure ids:** `vic-veu-hw-gas-to-heatpump`, `vic-veu-rcac-room-room-gas`, `vic-veu-rcac-ducted-gas-22kw` (with its label), `vic-veu-induction`, `vic-gas-supply-saving`.
- No abolishment fee (TODO). Link to the distributors' pages instead. The Bendigo payback goes on the Bendigo and Solstice pages only, not here as a statewide claim.

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

Sitemap count after this prompt: **45** (Wave 2 complete).

## Done when

45 URLs build with every check passing, the island budgets hold, and Guri has tried each tool. Commit `feat(wave2b): running costs, size guide, get-off-gas planner`.
