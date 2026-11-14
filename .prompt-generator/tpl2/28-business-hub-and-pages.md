# Prompt 28: Business section: the `/victoria/business-energy-upgrades/` hub (map row 55) plus 4 business pages (map rows 65–68, Wave 4)

> Local only, then a deploy STOP. Branch: `feat/review-28-business`.
> **Run after prompt 34** (74-URL map import, figure `basis`, list-format `rollout.json`) **and prompt 35** (checker rebuilt to `eligibility-checker-spec.md`, including the business figures and the Business path). This prompt also covers item (c) of the 14 Nov pack, "the /victoria/business-energy-upgrades/ landing page".
> Source: `docs/business-review-2026-11-14.md` §0, §2 rows 1–2, §4.3 row 2, §7 item 5. Checker: `docs/eligibility-checker-spec.md` §2.4 (business scope), §4.2 (business fields), §5.3 (business rules), §6 (N-SCHED, N-LIGHT, N-COLD, N-PRV, N-PV-30, N-BIZ-RES), §7 (business CTAs), §8 examples 5–6. Map: `docs/url-map.md` / `docs/url-map.csv` row 55 and Wave 4 rows 65–68. Design: `docs/solution-design.md` §5.3 (business figures rule), §6.

---

## Context

VEU business discounts are larger than household ones but the site barely covers them (review §0). The map has `/victoria/business-energy-upgrades/` (row 55) as the landing page for the checker's Business path, and since 14 Nov 2026 the 4 business pages the review asked for (rows 65–68, Wave 4). Row 55 is the business hub and links the 4 pages. There is no separate `/victoria/business/` hub.

**Alignment with `eligibility-checker-spec.md`** (replaces the earlier "DEPENDENCY" note; the spec now exists):

- The spec's §7 CTA for "Business, any Likely/Possibly" is `/victoria/business-energy-upgrades/`, and every business "not eligible" message in §6 links there. So the hub must carry an anchored section for each message: `#scheduled-premises` (N-SCHED), `#indoor-lighting-fluorescent-only` (N-LIGHT), `#cold-room-rules` (N-COLD), `#pre-rinse-spray-valves` (N-PRV), `#business-solar-30-200-kw` (N-PV-30), `#household-only-products` (N-BIZ-RES), `#custom-upgrades` (BX-1, BM-2, BP-3).
- Each business result line also gets a "Read more" link to its topic page. That's an **addition** to spec §7 (which names only the hub). Implement it as one mapping object, `BUSINESS_RESULT_LINKS` in `site/src/lib/checker/links.ts`, so it can be changed or removed in one place, and record it in `docs/expansion-log.md` under "Spec additions" for Venture Architect:

  | Spec rule ids | Topic page |
  |---|---|
  | BH-1..7 | `/victoria/business-heating-cooling/` |
  | BL-1..4 | `/victoria/business-led-lighting/` |
  | BR-1..4 | `/victoria/business-cold-rooms-refrigeration/` |
  | BW-1..3, BM-1..2, BK-1..2 | `/victoria/business-hot-water-motors/` |
  | BP-1..3, BX-1, BG-1, BB-1, B-OC, B-RES-ONLY | hub sections |

- Figures on these pages use the **same figure ids** that prompt 35 created for spec §2.4 and §5.3 (`audience: business`). Don't create a second copy. If an id is missing, add it the way prompt 35 does (one figure per published amount, with source and `checkedOn`) and tell Guri.
- Nothing from spec §9 (UNVERIFIED) appears: no consumer figure for display cabinets, fan motors, C&I heat pumps, boilers or custom upgrades; business ceiling insulation is treated as household-only.

**Slugs (settled by the map).** The review proposed `/victoria/business/` plus nested pages. Venture Architect's master map settles it: `/victoria/business-energy-upgrades/` is the hub, the 4 pages are flat (`/victoria/business-heating-cooling/`, `/victoria/business-led-lighting/`, `/victoria/business-cold-rooms-refrigeration/`, `/victoria/business-hot-water-motors/`), and there is no `/victoria/business/` hub. Farm content is a section on the hub (not a fifth page) unless Guri asks for one.

**No business lead capture** until a business AP agreement is signed and the lawyer has reviewed it (review §7 item 5, §8 spend gate). The CTA is the checker's Business path plus Energy Victoria's provider lists.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

Exceptions for this prompt only:

- Design §5.3 says business figures may appear only on `/victoria/veu-minimum-co-payment/`. Change it to: business figures (`audience: business`) may appear only on pages with `navGroup: business` and on the co-payment page. Household pages still can't show them (`check-figures` enforces both ways).
- The C&I solar amounts (50–200 kW) are calculated by Energy Victoria at a $70 VEEC price. Show that basis next to them, exactly as the spec does.

## Steps

### A. Map and structure

1. Rows 55 and 65–68 are already in `docs/url-map.csv` (imported by prompt 34; the map says `navGroup business` for 65–68). Don't edit the map. Check `npm run import:urlmap` reports 74 rows.
2. `NavGroup` gets `business`. The hub page and the 4 pages use it. `HubIndex` on `/victoria/` gets a "Business" group after "Audience". `llms.txt` gets a "Business" section after "Audience".
3. Enable rows 55 and 65–68 in `rollout.json`.
4. Footer: add "Business" (to the hub) next to "Areas covered".

### B. Pages

Write each page from its row. Business pages open with who can apply (the 2-year building rule, scheduled premises exclusion) before any amount. Every amount uses `<Money>` or `<FigureTable>` with a label and kind (prompt 25) and the words "indicative" and "the accredited provider confirms". Show size tables, never the largest figure alone.

{{PAGES:55-55}}

- **Hub build notes (row 55):**
  - Sections in this order: who can apply (2-year rule; `#scheduled-premises`: the ESC Register of Scheduled Activity Premises exclusion unless opted in); what's covered (cards linking the 4 pages); `#business-solar-30-200-kw` (C&I solar figures from the row, at a $70 VEEC, plus "STCs (≤ 100 kW) or LGCs (> 100 kW) may add", spec BP-1); windows (`EVGLAZ`, "most businesses", up to $210 per 10 m²); batteries (FEDERAL Cheaper Home Batteries covers businesses, 5–100 kWh, around 30%); `#custom-upgrades` (process heat, steam, HVAC, refrigeration, fans and motors, renewables, via M&V; no figure); `#household-only-products` (ceiling insulation, induction cooktops, weather sealing and in-home displays: the spec's N-BIZ-RES wording). Heat pump clothes dryers are **not** household-only: ESC lists Part 25 for residential and non-residential premises, so the hub says a business dryer is "possibly, up to $70 (figure), the provider confirms" (spec B-RES-ONLY); `#indoor-lighting-fluorescent-only`, `#cold-room-rules`, `#pre-rinse-spray-valves` (short, each linking its topic page); savings framing ("small businesses can save up to $500 a year, larger ones up to $74,000", EVBIZ, as figures with kind `saving`).
  - **Farms and rural businesses** section (review §2 row 2): business VEU activities apply to farm sheds, cool rooms, motors and pumps; link the cold rooms and motors pages. The On-Farm Energy and Electrification Demonstration Program ($5m; grants of $200,000–$750,000; closes 11 Dec 2026; <https://business.gov.au/grants-and-programs/onfarm-energy-and-electrification-demonstration-program-vic>) goes in as a dated news item with `reviewBy: 2026-12-11`. Its amounts are figures with source and date. It's a grant for large demonstration projects, so say so. After 11 Dec 2026 the item is removed (the build fails on a passed `reviewBy` until it is).
  - An honest line on the SEC: Easy Electric SEC is for households; don't claim it does or doesn't serve businesses unless its FAQ says so (source SECFAQ in the map).

{{PAGES:65-68}}

### C. Checker wiring (minimal and replaceable)

1. `BUSINESS_RESULT_LINKS` as above. The result screen shows the spec's primary CTA (the hub) first and the topic link second.
2. The six business N-messages link to the hub anchors listed above. Add a unit test that every anchor in `BUSINESS_RESULT_LINKS` and in the N-message links exists in the built hub HTML.
3. Don't change any spec rule, status, figure or wording. If the pages need something the spec doesn't say, log it under "Spec additions".

## Acceptance checks

```bash
cd site
npm run import:urlmap        # expect: "url-map: 74 rows …; 0 errors"
npm run check                # expect: 0 errors; vitest pass (incl. the anchor test and spec example 5)
npm run build && node scripts/check-figures.mjs
# expect: 0 stale, 0 raw amounts, 0 unlabelled heroes, 0 business figures on household pages
node scripts/check-urlmap.mjs   # expect: URL count = enabled rows (previous + 5), 0 extra, 0 missing links, 0 orphans
for a in scheduled-premises indoor-lighting-fluorescent-only cold-room-rules pre-rinse-spray-valves business-solar-30-200-kw household-only-products custom-upgrades; do
  grep -c "id=\"$a\"" dist/victoria/business-energy-upgrades/index.html; done   # expect: 1 each
grep -c 'data-figure="vic-veu-copay-business-large"' dist/victoria/business-hot-water-motors/index.html   # expect: ≥ 1 (the $10,000 large C&I minimum)
grep -ci 'fluorescent' dist/victoria/business-led-lighting/index.html          # expect: ≥ 2 (answer and body)
grep -c 'leadForm\|<form' dist/victoria/business-*/index.html dist/victoria/business-energy-upgrades/index.html   # expect: 0
node scripts/check-text.mjs && node scripts/check-faqs.mjs && node scripts/check-overlap.mjs && node scripts/check-schema.mjs && node scripts/check-rule-status.mjs   # expect: pass
```

Negative tests (each must fail, then revert): put a business figure on `/victoria/heat-pump-rebate/`; delete the `#cold-room-rules` anchor (the anchor unit test fails); show the 56 kW figure as a hero without the size table.

## What to test by hand

- Run spec examples 5 and 6 in the checker: the result lines link to the hub and the right topic page, and the anchors land on the right section.
- Read every business amount against its Energy Victoria page (Guri, with the PR's fact-check sheet).

## Open decisions for Guri

- Farms as a hub section (default) or a fifth page (needs a map row).
- Business lead fees ($100–$250 per lead in the review) are an **[Assumption]**; nothing on these pages depends on them, and business lead capture stays off until an AP agreement and the lawyer's review.

{{BLOCK:deploy-stop}}

Sitemap count: the previous count + 5 (rows 55, 65–68).

## Done when

The hub and the 4 pages are built from the rows, the checker's Business path lands on the hub with working anchors and topic links, no business figure leaks onto a household page, every check passes, and Guri has fact-checked the pages and said yes to the deploy. Commit `feat(review): business hub and 4 business pages (28)`.
