# Prompt 39: Metro hubs (north, west, east, south-east) and `/victoria/melbourne/` as the inner-Melbourne hub

> Local first, then a deploy STOP. Adds **4 URLs** (map rows 61–64, wave 3) and rescopes one live page (row 14, `/victoria/melbourne/`). Branch: `feat/pack-39-metro-hubs`.
> **Run order:** after 34, 35a/b, 36, 37 and 38. Prompt 33 (internal links and footer) runs after this.
> References: `docs/url-map.md` Wave 3 rows 61–64, "Changes needed on existing pages" (`/victoria/melbourne/`, two rows), "Dropped locations" (Hume, Cardinia, the Inner South East hub) and "Method notes" (Plan Melbourne regions); `docs/postcodes.csv`; `docs/solution-design.md` §5.4.

---

## Goal

Five metro hubs grouped by Plan Melbourne region (by CSV `primary_lga`), each with a full postcode table from `postcodes.csv`, what differs in VEU's table, and the council programs with status. `/victoria/melbourne/` keeps its URL and becomes the **inner-Melbourne** hub (Inner Metro + Inner South East: Melbourne, Port Phillip, Yarra, Stonnington, Glen Eira, Boroondara, Bayside = **52 postcodes**, all Metropolitan, gas, Mild, zone 4), replacing its 6-postcode list.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## The new hubs (from the map)

{{PAGES:61-64}}

## The live page being rescoped (row 14)

`/victoria/melbourne/` (live). Changes from the map's "Changes needed on existing pages":

- Rescope as the inner-Melbourne hub: the 7 LGAs above = 52 postcodes, all Metropolitan, gas, Mild, zone 4 (list from postcodes.csv), replacing the 6-postcode list. Source: VEU Specifications v25.0 Table A; ABS allocation files.
- Add the Council Home Energy Program (Yarra, Boroondara, Glen Eira, Stonnington). Source: <https://homeenergyprogram.org.au/>. Status checked on the day (YEF-linked programs: re-check, map item 12).
- Boroondara Solar Savers: free assessment plus up to $2,000 off eligible upgrades, to 31 Dec 2026 or until funds run out. Source: <https://www.energy.gov.au/rebates/solar-savers-program>. The amount becomes a figure (`local-boroondara-solar-savers-max`, `kind: discount`, `jurisdiction: local`, `expiresOn: 2026-12-31`); "free" only as the program's own attributed description. After 31 Dec 2026 the build fails until the line is removed or re-sourced.
- Link the 4 hubs, the corridor and `/victoria/postcode/`.

## Steps

1. **Data:** every hub table comes from `postcodes.json` filtered by `primary_lga` in the hub's LGA list. Store the LGA lists once (`site/src/data/metro-regions.json`, from Plan Melbourne, sourced) so the checker's area links (35a) and the hubs agree. Counts in copy are computed, and `check-postcodes` asserts they equal the rows (checked 14 Nov 2026 while writing this prompt: north 66 / 58 Metropolitan / 8 Regional all in Mitchell / 6 without gas / 9 Cold; west 34 / all Mild and gas / Regional only 3211; east 65 / Regional only 3799 / all gas / 15 Cold / zone 5: 3139, 3140, 3158, 3160, 3770, 3775, 3777; south-east 67 / all gas / Regional only 3981 / Cold 3980 and 3981; inner 52, all Metropolitan, gas, Mild, zone 4). A mismatch is a STOP.
2. **Each hub:** answer first (what's the same as inner Melbourne, what's different); postcode table (postcode, localities, council, area, gas, climate, zone; sortable, `<table>` with caption; no links per postcode); "What's different here" from the row; council programs (`councilPrograms` status model; Hume paused, Darebin paused per review A8, YEF-linked re-checks); NCC zones with ABCB attribution; links to the area pages inside the hub (Wyndham, Casey, Whittlesea, Yarra Ranges, Frankston, Mornington Peninsula, corridor, Mitchell), `/victoria/postcode/` and the checker. `localFacts` ≥ 5.
3. **Insulation:** only the official metro-mild figure applies to most hub postcodes; Cold postcodes (east: Dandenongs and Yarra Valley; south-east: 3980 Metropolitan + Cold → metro-cold estimate; 3981 Regional + Cold → official 2,100) get their spec §5.4 figure via `<Money>`, labelled.
4. **Overlap:** the hubs' climate/gas data are similar (row 62 is marked MARGINAL). `check-overlap` (prompt 27) must pass at < 25% between every pair of hubs and between each hub and the area pages it links; the postcode table is excluded from the comparison, so the prose has to carry local facts.
5. **Melbourne rescope:** replace the 6-postcode list, keep the URL, title rule 16, `canonicalPage` for its FAQs; the old copy that implied all of Melbourne is one area goes. Its `localFacts` include the Council Home Energy Program and Boroondara Solar Savers. Its `hubs` links: the 4 new hubs and the corridor.
6. **Inbound links:** prompt 34's table (Wyndham → west, Casey → south-east, Whittlesea → north, Yarra Ranges → east); the corridor and Mitchell link their hubs. Footer regions come in prompt 33.
7. **Checker area links (35a):** postcodes with a primary LGA in a hub now link to that hub, unless a more specific enabled area page exists for the LGA (Wyndham, Casey, Whittlesea, Yarra Ranges, Frankston, Mornington Peninsula, Geelong, corridor postcodes, the four council pages).
8. Enable rows 61–64; rebuild.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs       # expect: +4 URLs; /victoria/melbourne/ unchanged URL
node scripts/check-postcodes.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs
node scripts/check-overlap.mjs      # expect: every hub pair < 25%
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs
grep -o '<tr data-postcode="3[0-9]*"' dist/victoria/melbourne/index.html | wc -l   # expect: 52
npx vitest run tests/checker -t "area link"   # expect: 3029 → /victoria/wyndham/, 3064 → /victoria/melbourne-north/, 3000 → /victoria/melbourne/
```

## What to test by hand

Guri reads the north hub (Craigieburn, Mitchell) and the rescoped Melbourne page on a phone; the tables must be usable at 375 px.

## Open decisions for Guri

- Row 62 (west) is marked MARGINAL by Venture Architect: build it (default, its value is the council programs) or hold it.
- Boroondara Solar Savers wording ("free assessment") quoted from the program, attributed (default), or left as "assessment".

{{BLOCK:deploy-stop}}

Sitemap count: +4.

## Done when

The four hubs are live and Melbourne is the inner hub after Guri's yes. Commit `feat(area): metro hubs and inner-Melbourne rescope (39)`.
