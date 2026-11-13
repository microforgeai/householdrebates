# Prompt 03 — Content model: sources, figures, guides, areas, FAQs, installers

> Local only.

---

## Context

Every dollar figure on Household Rebates must sit next to a "checked on [date]" line and a link to the official source, and must never appear in schema. To make that impossible to get wrong, **all dollar figures live in one data file** and pages reference them by id. The model also carries a `state` field on everything (Victoria first, other states later) and reserves a `solar-battery` section for a later calculator. Astro 6 content layer: collections in `site/src/content.config.ts` using `glob()`/`file()` loaders from `astro/loaders` and `z` from `astro/zod`. Spec: `docs/solution-design.md` §5.

## Goal

Typed collections with build-time validation, seeded with the real Victorian figures and sources checked on 13 Nov 2026, plus `figures.ts`/`sources.ts` helpers and unit tests.

## Steps

1. `site/src/content.config.ts` — collections `sources`, `figures`, `guides`, `areas`, `pages`, `faqs`, `installers` exactly as in solution-design §5.2–5.5 (copy the zod schemas). Enums: `State = vic|nsw|qld|sa|wa|tas|act|nt|national`, `Section = rebates|areas|tools|trust|solar-battery`, `Activity = rcac|hotwater|solar|battery`.
2. `site/src/content/sources/*.yaml` — one file per source, `checkedOn: 2026-11-13`:

   | id (filename) | publisher | url | official | pageLastUpdated |
   |---|---|---|---|---|
   | `energyvic-heating-cooling` | Energy Victoria (DEECA) | https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts | true | 2026-10-29 |
   | `energyvic-hot-water` | Energy Victoria (DEECA) | https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts | true | 2026-10-26 |
   | `energyvic-about-veu` | Energy Victoria (DEECA) | https://www.energy.vic.gov.au/victorian-energy-upgrades/about | true | — |
   | `energyvic-electrification` | Energy Victoria (DEECA) | https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings | true | 2026-10-09 |
   | `vicplanning-gas-roadmap` | Victorian Department of Transport and Planning | https://www.planning.vic.gov.au/guides-and-resources/strategies-and-initiatives/victorias-gas-substitution-roadmap | true | — |
   | `vic-gazette-s654-2025` | Victoria Government Gazette | https://www.gazette.vic.gov.au/gazette/Gazettes2025/GG2025S654.pdf | true | — |
   | `esc-veu-code` | Essential Services Commission | https://www.esc.vic.gov.au/victorian-energy-upgrades/participating-veu-program/meeting-your-obligations-under-veu-code-conduct | true | — |
   | `esc-leadgen-factsheet` | Essential Services Commission | https://www.esc.vic.gov.au/sites/default/files/documents/PBL%20-%20Lead%20generation%20and%20marketing_fact_sheet%20-%20v%201.2%20-%2020240801.pdf | true | 2024-08-01 |
   | `esc-bans-faq` | Essential Services Commission | https://www.esc.vic.gov.au/sites/default/files/documents/VEU%20Telemarketing%20and%20doorknocking%20bans%20-%20Frequently%20asked%20questions%20-%20v%201.1%20-%2020240801.pdf | true | 2024-08-01 |
   | `esc-statement-of-rights` | Essential Services Commission | https://www.esc.vic.gov.au/sites/default/files/documents/PBL%20-%20Consumer%20Statement%20of%20Rights%20%E2%80%93%20VEU%20program%20-%20v%201.2%20-%2020240501.pdf | true | 2024-05-01 |
   | `oaic-trading` | OAIC | https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/trading-in-personal-information | true | — |
   | `oaic-small-business` | OAIC | https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business | true | — |
   | `acma-spam` | ACMA | https://www.acma.gov.au/avoid-sending-spam | true | 2024-11-29 |

3. `site/src/content/figures/vic-veu.yaml` (load with `file()`), **household rows only**, `sourceId` as shown, `checkedOn: 2026-11-13`. Copy the amounts exactly — re-open the two Energy Victoria pages and confirm each number before saving; if any differ from this table, stop and tell Guri.

   | id | group | scenario | qualifier | min | max | source |
   |---|---|---|---|---|---|---|
   | `vic-veu-rcac-room-hardwired-electric` | `vic-veu-rcac-room-household` | Hard-wired electric resistance room heater → room RCAC 3–9 kW | up-to | | 840 | heating-cooling |
   | `vic-veu-rcac-room-4splits-ducted-gas` | same | Ducted gas heater → 4 split systems (1×8 kW, 3×3 kW) | up-to | | 2520 | heating-cooling |
   | `vic-veu-rcac-room-multisplit-ducted-gas` | same | Ducted gas heater → multi-split, 1×10 kW outdoor unit | up-to | | 2940 | heating-cooling |
   | `vic-veu-rcac-room-room-gas` | same | Non-ducted (room) gas heater → room RCAC 3–9 kW | range | 630 | 1610 | heating-cooling |
   | `vic-veu-rcac-room-replace-rcac` | same | Non-ducted RCAC → room RCAC 3–9 kW | exact | | 210 | heating-cooling |
   | `vic-veu-rcac-room-no-decommission` | same | No system removed → room RCAC 3–9 kW | range | 70 | 140 | heating-cooling |
   | `vic-veu-rcac-ducted-central-electric` | `vic-veu-rcac-ducted-household` | Central electric resistance ducted heater → ducted RCAC 10–22.4 kW | up-to | | 5460 | heating-cooling |
   | `vic-veu-rcac-ducted-gas-10kw` | same | Ducted gas heater → ducted RCAC 10 kW | up-to | | 2520 | heating-cooling |
   | `vic-veu-rcac-ducted-gas-16kw` | same | Ducted gas heater → ducted RCAC 16 kW | up-to | | 4200 | heating-cooling |
   | `vic-veu-rcac-ducted-gas-22kw` | same | Ducted gas heater → ducted RCAC 22.4 kW | up-to | | 5530 | heating-cooling |
   | `vic-veu-rcac-ducted-replace-rcac-10kw` | same | Ducted RCAC → ducted RCAC 10 kW | up-to | | 490 | heating-cooling |
   | `vic-veu-rcac-ducted-replace-rcac-16kw` | same | Ducted RCAC → ducted RCAC 16 kW | up-to | | 770 | heating-cooling |
   | `vic-veu-rcac-ducted-replace-rcac-22kw` | same | Ducted RCAC → ducted RCAC 22.4 kW | up-to | | 910 | heating-cooling |
   | `vic-veu-rcac-ducted-no-decommission` | same | No system removed → ducted RCAC 10–22.4 kW | up-to | | 410 | heating-cooling |
   | `vic-veu-hw-electric-to-heatpump` | `vic-veu-hotwater-household` | Inefficient electric → heat pump | exact | | 630 | hot-water |
   | `vic-veu-hw-electric-to-solar` | same | Inefficient electric → solar-boosted | exact | | 910 | hot-water |
   | `vic-veu-hw-gas-to-heatpump` | same | Inefficient gas → heat pump | exact | | 560 | hot-water |
   | `vic-veu-hw-gas-to-solar` | same | Inefficient gas → solar-boosted | exact | | 700 | hot-water |
   | `vic-hw-veu-plus-solar-homes` | `vic-hotwater-combined` | VEU discount combined with a Solar Homes hot water rebate | up-to | | 1560 | hot-water |
   | `vic-hw-veu-plus-solar-homes-local` | same | As above with an eligible locally made product (+$400) | up-to | | 1960 | hot-water |
   | `vic-veu-min-contribution` | `vic-veu-rules` | Minimum customer contribution for an upgrade | exact | | 200 | hot-water |

   Also add a top-level note field on each figure group: "Indicative. Final amount depends on the certificate price, product, location and provider."
4. `site/src/lib/figures.ts`: `getFigure(id)`, `getGroup(group)`, `formatAUD(n)` → "$5,530" (en-AU, no cents), `formatFigure(f)` → "up to $5,530" / "$630 to $1,610" / "$560" / "around $400" (qualifier `about`), `isStale(f, maxDays = Number(import.meta.env.MAX_FIGURE_AGE_DAYS ?? 45))`. Throws at build if an id is missing or the source isn't `official: true`.
5. `site/src/lib/sources.ts`: `getSource(id)`, `formatChecked(date)` → "13 Nov 2026" in `Australia/Melbourne`.
6. Create empty folders with `.gitkeep`: `content/guides/vic/`, `content/areas/vic/`, `content/pages/`, `content/faqs/`, `content/installers/`, `content/solar-battery/`.
7. `site/src/data/states.ts`: `export const STATES = { vic: { name: 'Victoria', path: 'victoria', enabled: true }, nsw: { name: 'New South Wales', path: 'nsw', enabled: false }, … }`.
8. `site/scripts/check-figures.mjs` (runs after build): (a) fails if any built HTML text node outside an element with `data-figure` matches `/\$\s?\d/` (ignore `<script type="application/ld+json">` — that's checked separately and must contain **no** `$\d` at all); (b) fails if any figure is older than `MAX_FIGURE_AGE_DAYS`; (c) fails if JSON-LD contains a currency amount. Print file + snippet.
9. Unit tests `site/tests/unit/figures.test.ts`: formatting, missing id throws, stale detection, non-official source rejected, `amountMin <= amountMax`.

## Acceptance checks

```bash
npm run check -w site            # expect: astro check 0 errors; vitest all pass
npm run build -w site && node site/scripts/check-figures.mjs
# expect: "check-figures: 21 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node -e "const y=require('fs').readFileSync('site/src/content/figures/vic-veu.yaml','utf8');console.log((y.match(/^- id:/gm)||[]).length)"
# expect: 21
grep -c "560" site/src/content/figures/vic-veu.yaml   # expect: ≥ 1 (gas → heat pump is $560, not $630)
```

Negative test: temporarily put `Save $500 today` in `styleguide.astro`, build, run `check-figures.mjs` → expect a failure naming that file; then remove it.

## What to test

Change one `checkedOn` to 60 days ago → build fails with a clear "stale figure" message. Restore.

## Done when

All 21 figures and 13 sources load, checks pass, and the negative tests fail as designed. Commit `feat(content): sources, figures and collections`.
