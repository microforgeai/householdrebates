# Prompt 38: Council pages: Macedon Ranges, Mitchell, Latrobe Valley, Mildura

> Local first, then a deploy STOP. Adds **4 URLs** (map rows 57–60, wave 3). Branch: `feat/pack-38-councils`.
> **Run order:** after 34, 35a/b, 36 and 37.
> References: `docs/url-map.md` Wave 3 rows 57–60, "Dropped locations" (the ≥ 4 local facts rule) and "Method notes" (NCC zones, provider counts); `docs/postcodes.csv`; `docs/eligibility-checker-spec.md` §5.4, HPZ-5, GAS-NO; `docs/solution-design.md` §5.4.

---

## Goal

Four council pages that passed the map's local-facts test (Macedon Ranges 6 facts, Mitchell 5, Latrobe Valley 6, Mildura 5). Each one's hook is what differs from Melbourne in VEU's table: cold and zone 5 (Macedon Ranges), the metro/regional split and off-gas towns (Mitchell), Regional-but-Mild insulation and the SEC pilot (Latrobe Valley), and the Hot region (Mildura).

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## The pages (from the map)

{{PAGES:57-60}}

## The rows match postcodes.csv (map revised 14 Nov 2026)

Venture Architect corrected these rows against `postcodes.csv`, so prompt 34's `check-postcodes` is expected to pass for all four: Mildura has **12** council postcodes (3490, 3494, 3496, 3498, 3500, 3501, 3502, 3505, 3506, 3507, 3509, 3512, all Regional and Hot); Mitchell's no-gas list includes **3661**; Latrobe's includes **3841**; Macedon Ranges has 13 postcodes, 12 Cold (Clarkefield 3430 is the Mild one). Tables still render from the CSV, never typed. If `check-postcodes` reports any difference, stop and tell Guri (rule 19); don't edit the CSV or the copy to force a pass.

## Steps (all four pages)

1. **Answer first**, about the page's hook, in 2–4 sentences. No amount in the answer unless via `<Money>`.
2. **Postcode table** from `postcodes.json` for the council's postcodes (filter by CSV `primary_lga`; list `other_lgas` where shared). Counts and lists in copy are computed from the CSV, never typed. `check-postcodes` asserts the rendered counts equal the CSV.
3. **What it changes**, from the spec: insulation figure for the postcode type (spec §5.4 table: official or prompt-34 estimate, labelled); HPZ-5 note where zone 5; GAS-NO line where no reticulated gas (LPG amount UNVERIFIED: "provider confirms"; link to `/victoria/lpg-homes/` once enabled).
4. **Council programs** with the prompt-34 status model and "Status checked {date}".
5. **NCC climate zones** with ABCB attribution and "confirm on the ABCB Climate Map".
6. `localFacts` ≥ 5, each with an official source id. FAQ 3–5 from the row's secondary questions. Schema BreadcrumbList + FAQPage; no `$`; no LocalBusiness.
7. Links: every row link; plus the inbound links prompt 34's table adds (size guide → Macedon Ranges; running costs → Mildura; get-off-gas → Latrobe Valley and Mitchell; Ballarat → Latrobe Valley; Solstice → Mildura).
8. Enable rows 57–60.

### Page-specific

- **Macedon Ranges (57):** the Cool Changes plans, Sustainable Home Kits and Empower Your Home webinars as council resources (not rebates; no status needed unless dated). The heat pump bulk buy only if still current (review A8: installs end 30 Nov 2026). Heat pump section: zone 4 vs 5 by postcode, link to `/victoria/heat-pump-hot-water-size-guide/`. Insulation: Regional + Cold postcodes (e.g. Gisborne 3437) → the official 2,100 figure; Metropolitan + Cold postcodes (3431, 3432, 3433, 3434, 3438, 3441 in the CSV) → the metro-cold estimate; Clarkefield 3430 is Metropolitan + Mild → the official 1,500 figure.
- **Mitchell (58):** stress the 2-year building rule for Wallan/Beveridge estates (map note); Goulburn Murray Solar Savers via GMCA as a `councilPrograms` entry (status checked on the day); Plan Melbourne places Mitchell in the Northern region → link `/victoria/melbourne-north/` when enabled.
- **Latrobe Valley (59):** mention the SEC heat pump hot water pilot openly (it's the state-owned installer service; link its source). The 44% bill cut is a news report quoting AusNet (map note), so it can't be a figure (`basis` allows only official or estimate). Default: leave it off; it's an open decision. Insulation: Regional + Mild → `vic-veu-insulation-est-regional-mild` (about 1,590, estimate). Energise Gippsland is YEF-linked: re-check it before any mention (map item 12).
- **Mildura (60):** cooling-led page (reverse-cycle cooling, the hot-region insulation factor 0.00546 being the lowest, so expect a smaller insulation discount: give the regional-hot estimate via `<Money>`); the council's Electrify your home guidance and the library Home Energy Efficiency Toolkit; cross-link Swan Hill and Robinvale on the Solstice page.

## Acceptance checks

```bash
cd site
npm run build
node scripts/check-urlmap.mjs      # expect: +4 URLs
node scripts/check-postcodes.mjs && node scripts/check-figures.mjs && node scripts/check-council-status.mjs
node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs   # overlap < 25% between the four
grep -c '44%' dist/victoria/latrobe-valley/index.html    # expect: 0 unless Guri chose to quote it (then 1, with attribution)
```

## What to test by hand

Guri reads one page (Macedon Ranges) against its row and the CSV.

## Open decisions for Guri

- Latrobe Valley 44% (news report quoting AusNet): leave off (default) or quote with attribution as text.
- Spec §7 links 3430–3438 (all Macedon Ranges shire) to the corridor page. Keep that (default, per spec), or send Macedon Ranges postcodes north of 3427 to `/victoria/macedon-ranges/` once it's live (needs a spec change from Venture Architect).

{{BLOCK:deploy-stop}}

Sitemap count: +4.

## Done when

The four pages are live after Guri's yes. Commit `feat(area): Macedon Ranges, Mitchell, Latrobe Valley, Mildura (38)`.
