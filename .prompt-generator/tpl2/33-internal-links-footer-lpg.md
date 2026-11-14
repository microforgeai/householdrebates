# Prompt 33: Internal links, the areas footer, and the missing pages: LPG homes (map row 74, Wave 4); corridor and Shepparton pointers

> Local only, then a deploy STOP. Branch: `feat/review-33-links`.
> **Run last of the review prompts**, after the area pages from prompts 37–39 exist (so the footer and link targets are real), and after prompt 34 (map import, council-program status check) and 36 (`/victoria/postcode/`, which the LPG page links).
> Source: `docs/business-review-2026-11-14.md` §1.2 A8–A9, §2 rows 3–4, §6 "Orphans and weak links", §7 item 10. Map: `docs/url-map.md` / `docs/url-map.csv` (Wave 3 incl. the 14 Nov expansion; "Dropped locations"; Wave 4 row 74). Data: `docs/postcodes.csv` (read-only).

---

## Context

From the 14 Nov crawl:

- No true orphans, but weakly linked pages (3 or fewer inbound links, counting home): `/victoria/already-installed-retrospective-discount/`, `/victoria/electric-heater-to-reverse-cycle/`, `/victoria/new-homes-all-electric-2027/`. Four or fewer: `/victoria/apartments-and-units/`, `/victoria/can-you-claim-veu-twice/`, `/victoria/gas-vs-heat-pump-running-costs/`, `/victoria/how-long-does-an-upgrade-take/`, `/victoria/solar-hot-water-rebate/`.
- The footer "Areas covered" lists only 4 of the 11 location pages.
- Missing pages the review names, and where they're handled:

  | Review item | Where |
  |---|---|
  | `/victoria/shepparton/` (in the map, not built) | Prompt 34 re-opens prompt 22's gate (Goulburn Murray Solar Savers confirmed via GMCA only; the council's own page is still unverified); release is Guri's decision |
  | Corridor pages: Sunbury/Hume, Diggers Rest/Melton, Gisborne/Macedon Ranges | The map has **one** corridor page, `/victoria/north-west-corridor/` (row 56), plus `/victoria/macedon-ranges/` (row 57). Built in prompts 37 and 38. No per-suburb pages (map rule) |
  | `/victoria/lpg-homes/` | This prompt (map row 74) |

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## Steps

1. Row 74 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.
2. Enable it. `navGroup: audience`.
3. Build the page:

{{PAGES:74-74}}

   - **The 2027 gas hot water rule (reg 45E) and LPG.** Word it exactly as the row: from 1 Mar 2027, reg 45E applies only to a gas water heater **connected to reticulated (mains) gas** in an existing Class 1 or 2 home. A bottled-LPG water heater isn't connected to reticulated gas, so it's outside the rule ("currently legislated", rule 15; `ruleStatus: election-watch`). **Piped-LPG estates** (an LPG network piped to the street) get a separate note: "If your estate has piped LPG, your plumber confirms whether the rule applies to your water heater." Don't state either way that piped LPG is covered or exempt. Cite the AustLII reg 45E page (the row notes the direct fetch is blocked by Cloudflare; re-open it in a browser before writing).
   - The off-gas postcode count comes from `postcodes.csv` at build time (`reticulated_gas = No`), rendered as a `count` figure with Table A as the source. Don't type the number.
   - The page links `/victoria/postcode/` ("Check whether your postcode has mains gas") rather than listing 313 postcodes.
   - LPG running costs: only with a cited official source. None is in the pack, so leave them out and log a TODO.
   - The checker's GAS-NO prompt (spec §5.2, "Did you mean LPG?") links here (prompt 35 wiring; add the link now if 35 has run).
4. **Footer "Areas covered"**: generated from enabled area pages and hubs (`navGroup: areas`), grouped "Melbourne hubs", "Regional", "Corridors and councils". No hard-coded list.
5. **Contextual inbound links: at least 6 per guide.** Change `check-urlmap` rule 4: pages with `navGroup` in `rebate-guides | upgrade-guides | question-pages | audience | support-guides | business` need ≥ 6 inbound links from other pages' `<main>` (header and footer don't count; the hub counts once). Areas, tools and trust pages keep ≥ 2. Add links where they help the reader, in body copy, with H1 anchor text. Start with the 8 weak pages above. Suggested sources (use them only where the sentence is genuinely about the target):
   - retrospective discount ← heat pump, AC, induction, scams, how-quotes-work, checker results (G-RETRO footer)
   - electric heater → RCAC ← AC, reverse-cycle timing, renters, landlords, concession, running costs
   - new homes 2027 ← checker N-AGE, corridor, Mitchell, melbourne-west, solar page (under construction), Wyndham
   - apartments ← renters, landlords, business LED lighting (common areas), solar page, draught proofing, insulation (I-APT note)
   - can-you-claim-veu-twice ← heat pump, gas → heat pump, electric → heat pump, solar hot water, veu-vs-solar-homes, checker N-SH-DUP
   - running costs ← heat pump, gas 2027, get-off-gas planner, concession, size guide, Midday Power Saver sections
   - upgrade time ← how-quotes-work, find-an-accredited-provider, gas broken before/after March 2027, heat pump, AC, retrospective
   - solar hot water ← heat pump, gas → heat pump, electric → heat pump, Solstice towns, Mildura, other VEU discounts
6. **Council programs:** every area page's council program goes through the `councilPrograms` status model from prompt 34 (status + `statusCheckedOn`). Nothing is shown as open without a date-stamped check (review A8: Hume paused, Darebin paused, Macedon Ranges bulk buy closed to enquiries on 31 Oct with installs ending 30 Nov 2026, Yarra Energy Foundation in administration).
7. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run build
node scripts/check-urlmap.mjs
# expect: "… 0 extra, 0 missing links, 0 orphans, 0 guides under 6 inbound"; URL count = previous + 1
node -e "const r=require('./dist/_inbound.json');for(const u of ['/victoria/already-installed-retrospective-discount/','/victoria/electric-heater-to-reverse-cycle/','/victoria/new-homes-all-electric-2027/'])console.log(u,r[u])"   # expect: ≥ 6 each
grep -o 'href="/victoria/[a-z-]*/"' dist/index.html | sort -u | wc -l      # footer: every enabled area page appears
node scripts/check-council-status.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs && node scripts/check-figures.mjs   # expect: pass
grep -ci 'plumber confirms' dist/victoria/lpg-homes/index.html     # expect: ≥ 1 (piped-LPG note)
grep -ci 'reticulated' dist/victoria/lpg-homes/index.html           # expect: ≥ 1 (reg 45E scope)
node scripts/check-rule-status.mjs                                   # expect: lpg-homes is election-watch
```

## What to test by hand

- Read 5 of the new contextual links in context: each one is useful at that point in the text.

## TODO (log it)

- LPG running costs vs heat pump: needs a cited source (none in the pack).

{{BLOCK:deploy-stop}}

Sitemap count: the previous count + 1.

## Done when

The LPG page is live in the map and built, the footer lists every area, every guide has at least 6 contextual inbound links, no council program shows as open without a dated check, every check passes, and Guri has said yes. Commit `feat(review): internal links, areas footer, LPG page (33)`.
