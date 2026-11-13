# Prompt 19: Wave 2a: 5 audience pages and 2 support guides

> Local only. This adds 7 URLs (map rows 36–40, 44, 45). The deploy STOP at the end needs Guri's yes.
> Run it after prompt 18. Branch: `feat/expansion-19-wave2a`.

---

## Context

Wave 2 has 10 URLs: audience pages (renters, landlords, concession card holders, new homes, apartments), 3 tools (prompt 20) and 2 support guides (draught proofing, finding an accredited provider). This prompt does the 7 non-tool pages.

Three of them carry sensitive content:

- **Landlords (row 37)** summarises the rental minimum standards. It's not legal advice: summarise, then point to CAV.
- **Draught proofing (row 44)** must lead with the carbon monoxide safety rule.
- **Find an accredited provider (row 45)** must mention **Easy Electric SEC** openly. It's a free, state-owned quote-matching service that competes with our lead model. Hiding it would hurt trust. Whatever Guri decides about the lead model, the page mentions it.

Any map note that says "the checker has no … path" is out of date: prompt 16 added those paths.

{{BLOCK:rules}}

## Steps

1. Set `rollout.json` → `"enabledRows": "1-40,44-45"`.
2. **Figures:** append 11 rows (re-open each source; stop on any difference):

   | id | group | scenario | qualifier | unit | display | min | max | source |
   |---|---|---|---|---|---|---|---|---|
   | `vic-concession-electricity-rate` | `vic-concessions` | Annual electricity concession, share of usage and service costs | exact | percent | | | 17.5 | dffh-electricity-concession |
   | `vic-concession-electricity-excluded` | `vic-concessions` | First part of the yearly electricity bill the concession doesn't apply to | exact | AUD | cents | | 171.60 | dffh-electricity-concession |
   | `vic-concession-gas-rate` | `vic-concessions` | Winter gas concession (1 May to 31 Oct), share of costs | exact | percent | | | 17.5 | dffh-winter-gas-concession |
   | `vic-concession-gas-excluded` | `vic-concessions` | First part of the gas bill the winter concession doesn't apply to | exact | AUD | cents | | 62.40 | dffh-winter-gas-concession |
   | `vic-new-home-electric-saving` | `vic-electrify-savings` | New all-electric home, Energy Victoria's estimated yearly saving | exact | AUD | | | 990 | energyvic-new-buildings |
   | `vic-new-home-electric-solar-saving` | `vic-electrify-savings` | New all-electric home with solar, estimated yearly saving | exact | AUD | | | 1920 | energyvic-new-buildings |
   | `vic-solar-apartments-per-apartment` | `vic-solar-apartments` | Solar for Apartments, per apartment | up-to | AUD | | | 2800 | solarvic-apartments |
   | `vic-solar-apartments-per-property` | `vic-solar-apartments` | Solar for Apartments, per property | up-to | AUD | | | 140000 | solarvic-apartments |
   | `vic-veu-glazing-double` | `vic-veu-glazing-household` | Example: double glazing, per 10 m² | exact | AUD | | | 210 | energyvic-window-glazing |
   | `vic-veu-glazing-secondary` | `vic-veu-glazing-household` | Example: secondary glazing, per 10 m² | exact | AUD | | | 140 | energyvic-window-glazing |
   | `casey-diy-draught-rebate` | `casey-council` | City of Casey rebate for DIY draught-proofing products, one per household | up-to | AUD | | | 200 | casey-home-energy-rebates |

   - `casey-diy-draught-rebate` uses `program: "City of Casey"`. Add `program` values to the enum if it's an enum.
   - The apartment figures are Solar Victoria's. **Don't** confuse them with the stale "PV up to $2,800": that's a different program. Write the program name next to the figure every time.
3. Write the 7 pages below. Set `navGroup`: rows 36–40 → `audience`; rows 44–45 → `support-guides`.
4. **Links that the new pages make possible:** solar hot water guide → landlords page; insulation guide → renters and landlords pages; the checker's `RESULT_LINKS.sealing.internal = '/victoria/draught-proofing-rebate/'`; the hub shows the two new groups.
5. Run the checks and fix anything that fails.

## Pages (map rows 36–40, 44–45)

{{PAGES:36-40}}

{{PAGES:44-45}}

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 68 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 42 URLs (expected 42), 0 extra, 0 missing links, 0 orphans, sitemap 42, llms 42"
grep -c '<loc>' dist/sitemap-0.xml                                                   # expect: 42
grep -c 'data-figure="vic-concession-electricity-excluded"' dist/victoria/concession-card-holders/index.html   # expect: 1
grep -c '\$171\.60' dist/victoria/concession-card-holders/index.html              # expect: ≥ 1 (cents display, inside the data-figure element)
grep -ci 'power saving bonus' dist/victoria/concession-card-holders/index.html      # expect: 0
grep -c '4,038\|2,598' dist/victoria/concession-card-holders/index.html             # expect: 0
grep -ci 'easy electric' dist/victoria/find-an-accredited-provider/index.html       # expect: ≥ 1
grep -c '3–50\|3-50\|150 lots' dist/victoria/apartments-and-units/index.html        # expect: 0 (lot limit conflict kept off)
grep -ci 'carbon monoxide' dist/victoria/draught-proofing-rebate/index.html         # expect: ≥ 1
grep -c 'vic-veu-rcac-ducted-gas-22kw' dist/victoria/landlords-rental-standards-2027/index.html   # expect: ≥ 1, shown with its 22.4 kW label
```

## What to test by hand

- Row 37: Guri checks the standards timeline against the Energy Victoria rental page and the CAV page.
- Row 44: the safety section comes before any amount, and reads clearly to someone who doesn't know what "open-flued" means.
- Row 45: the SEC mention is fair and factual: what it is, who runs it, and that it's free. It doesn't run down SEC.

## TODO: UNVERIFIED (kept off these pages; log it)

- The $100 Power Saving Bonus (round closed 31 Mar 2026, per a search result, not an official row source). Re-check it for a new round, and only add it from an official source.
- The excess-bill thresholds ($4,038.82 electricity, $2,598.58 gas) appear only in the map notes and the re-check list, with no row fact. They change yearly. Add them only if Guri wants them, from the DFFH pages, as figures.
- The Solar for Apartments lot limit (3–50 on the program page vs 150 in the 26 Oct 2026 news). Re-check it monthly, and give the number once the program page updates.

## Decisions for Guri

- **Easy Electric SEC vs our lead-fee model:** the map recommends mentioning it openly on row 45 (this prompt does). Guri should weigh it in the installer and lead-fee decisions before the form is ever turned on.

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **42**.

## Done when

42 URLs build with every check passing, and Guri has read the landlords and draught-proofing pages against their sources. Commit `feat(wave2a): audience pages and support guides`.
