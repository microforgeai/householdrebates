# Prompt 37: North-west corridor page (Sunbury, Diggers Rest, Melton, Gisborne)

> Local first, then a deploy STOP. Adds **1 URL** (map row 56, wave 3). Branch: `feat/pack-37-corridor`.
> **Run order:** after 34, 35a/b and 36.
> References: `docs/url-map.md` Wave 3 row 56 and "Dropped locations" (Melton, Hume); `docs/postcodes.csv`; `docs/eligibility-checker-spec.md` §5.4 and §8 example 1 (3427); `docs/solution-design.md` §5.4 (area pages).

---

## Goal

The pack asks for "north-west corridor pages for Sunbury, Diggers Rest, Melton and Gisborne". The map has **one** page for all four (row 56, `/victoria/north-west-corridor/`), and Melton and Hume are dropped as standalone pages. So this prompt builds one page with a section per town. It adds no town URLs (rule 11; logged as a conflict to Guri).

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## The page (from the map)

{{PAGES:56-56}}

## Steps

1. **Answer first:** the corridor's postcodes aren't all alike in VEU's table: Diggers Rest, Sunbury, Bulla, Melton and Caroline Springs are Metropolitan, gas and Mild; north of Sunbury, New Gisborne and Riddells Creek are Metropolitan but Cold (zone 5), Gisborne is Regional and Cold, and Clarkefield has no reticulated gas. Check yours on `/victoria/postcode/`.
2. **Postcode table** rendered from `postcodes.json` for the row's postcodes (3427, 3429, 3428, 3335–3338, 3023, 3438, 3431, 3437, 3430), with localities and council share (3427: Melton 93% / Hume 7%). Not typed. A `check-postcodes` assertion compares each rendered row with the row's facts; a mismatch is a STOP.
3. **Town sections** (H2 each): Sunbury and Bulla; Diggers Rest (the two-council split); Melton and Caroline Springs; Gisborne, New Gisborne and Riddells Creek (cold, zone 5). Each: what's different in Table A, what that changes (spec §5.4, HPZ-5), and a link to the checker pre-filled with the postcode.
4. **Insulation by postcode:** Gisborne 3437 → the official regional-cold figure; New Gisborne 3438 → `vic-veu-insulation-est-metro-cold` (about 2,010, "(our estimate)", method disclosure); Diggers Rest/Sunbury/Melton → the official metro-mild figure. All via `<Money>`.
5. **New homes:** the 2-year building rule (row fact) and a link to `/victoria/new-homes-all-electric-2027/` (row 39 links here; prompt 34 table).
6. **Council programs** (`councilPrograms`, prompt 34 model): Hume Home Energy Upgrades `status: paused` (YEF voluntary administration; only insulation and draught-proofing registrations made before 19 Oct 2026 continue); Hume Household Energy Officer for bill help (row fact); Melton Living Green Power-Mate loans (map "Dropped locations"); the Macedon Ranges heat pump bulk buy only if still current on the day (review A8: closed to enquiries 31 Oct, installs end 30 Nov 2026; after 30 Nov leave it off). Each with "Status checked {date}".
7. **NCC climate zones** from the row (zone 6: Diggers Rest, Sunbury, Melton; zone 7: Gisborne, Riddells Creek, Macedon, Woodend, Kyneton) with ABCB attribution (CC BY 4.0) and "confirm on the ABCB Climate Map".
8. Links: every row link (macedon-ranges, melbourne-west, melbourne-north, postcode, ceiling-insulation, checker), using `RelatedLinks` for targets not yet enabled; they become required when enabled. `localFacts` ≥ 5 (prompt 27).
9. FAQ 3–5 from the row's secondary questions; schema BreadcrumbList + FAQPage; no `$`.
10. Enable row 56; the checker's area link for 3427, 3428, 3429, 3335–3338, 3430–3438 now resolves here (35a).

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs && node scripts/check-postcodes.mjs
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs
grep -c 'data-figure="vic-veu-insulation-est-metro-cold"' dist/victoria/north-west-corridor/index.html   # expect: ≥ 1
ls dist/victoria | grep -E '^(sunbury|diggers-rest|melton|gisborne|hume)$' | wc -l                      # expect: 0
npx vitest run tests/checker -t "3427"       # expect: example 1 area link = /victoria/north-west-corridor/
```

## What to test by hand

Guri (Diggers Rest) reads the 3427 section and runs the checker from it.

## Open decisions for Guri

- The pack says "pages"; the map has one page. Default: one page with town sections. Separate town pages would need Venture Architect to add rows with ≥ 4 local facts each.
- Whether to mention the Macedon Ranges bulk buy at all given it ends 30 Nov 2026 (default: leave it off if this ships after 30 Nov).

{{BLOCK:deploy-stop}}

Sitemap count: +1.

## Done when

The corridor page is live after Guri's yes and the checker links 3427 to it. Commit `feat(area): north-west corridor page (37)`.
