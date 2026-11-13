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

{{BLOCK:rules}}

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

{{PAGES:46-47}}

{{PAGES:49-53}}

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

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **52** (Shepparton is still gated).

## Done when

52 URLs build with every check passing, Shepparton isn't built, and Guri has read each local page against its sources. Commit `feat(wave3): 7 location pages`.
