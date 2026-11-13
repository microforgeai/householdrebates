# Prompt 18: Wave 1b: 9 question pages (AEO)

> Local only. This adds 9 URLs (map rows 27–35) and completes Wave 1 (19 URLs). The deploy STOP at the end needs Guri's yes. This is the recommended point to deploy Wave 1.
> Run it after prompt 17. Branch: `feat/expansion-18-wave1b`.

---

## Context

These pages answer one question each, for answer engines and for people mid-decision: what a VEEC is, the new minimum co-payment, claiming twice, VEU vs Solar Homes, scams, the March 2027 timing, the exemption list, already-installed upgrades, and how long an upgrade takes. The structure from prompt 17 (`navGroup`, `RelatedLinks`, `HubIndex`, `check-urlmap`, `rollout.json`) is already in place.

Two pages carry regulation content (rows 32 and 33). They are plain-English summaries of SR 140/2025 reg 45E, **not legal advice**. Guri reads them against the regulation text before publishing.

Any map note that says "the checker has no … path" is out of date: prompt 16 added those paths.

{{BLOCK:rules}}

## Steps

1. Set `rollout.json` → `"enabledRows": "1-35"`.
2. **Figures:** append 4 rows (re-open the source; stop on any difference):

   | id | group | scenario | qualifier | unit | max | audience | source |
   |---|---|---|---|---|---|---|---|
   | `vic-veu-copay-business-large` | `vic-veu-copayments-business` | Larger commercial and industrial upgrades | minimum | AUD | 10000 | business | energyvic-hot-water |
   | `vic-solar-homes-pv-rebate` | `vic-solar-homes-pv` | Solar Homes solar panel (PV) rebate, plus an optional interest-free loan | up-to | AUD | 1400 | household | solarvic-pv-rebate |
   | `vic-solar-homes-hw-extra-2026-27` | `vic-solar-homes-hotwater` | Extra hot water rebates in 2026–27 | exact | count | 27000 | household | solarvic-income-cap-news |
   | `vic-plumbing-cert-threshold` | `vic-plumbing` | Plumbing work value above which a compliance certificate is required | more-than | AUD | 750 | household | bpc-plumbing-compliance |

   `check-figures` allows a business figure only on `/victoria/veu-minimum-co-payment/` (prompt 15 rule).
3. Write the 9 pages below with `navGroup: question-pages`.
4. **Links that the new pages make possible:**
   - Home: add `question-pages` to the compact `HubIndex`.
   - `/victoria/gas-to-electric-hot-water-2027/` → `/victoria/gas-hot-water-ban-exemptions/` and `/victoria/gas-hot-water-broken-before-or-after-march-2027/`.
   - `/victoria/reverse-cycle-vs-gas-heater/` → `/victoria/already-installed-retrospective-discount/`.
   - `/victoria/air-conditioner-rebate/` co-payment section → `/victoria/veu-minimum-co-payment/`.
   - Checker: `RESULT_LINKS.retro.internal = '/victoria/already-installed-retrospective-discount/'` and `RESULT_LINKS['gas-2027'].internal` stays as it is.
5. `HowTo` JSON-LD only on row 35 (genuine steps, at least 3). Update design §10.2, which said `/how-quotes-work/` only.
6. Run the checks and fix anything that fails.

## Pages (map rows 27–35)

{{PAGES:27-35}}

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 57 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 35 URLs (expected 35), 0 extra, 0 missing links, 0 orphans, sitemap 35, llms 35"
grep -c '<loc>' dist/sitemap-0.xml                                                     # expect: 35
grep -c '"@type":"HowTo"' dist/victoria/how-long-does-an-upgrade-take/index.html       # expect: 1
grep -c 'estimatedCost\|totalTime' dist/victoria/how-long-does-an-upgrade-take/index.html   # expect: 0
grep -c 'data-figure="vic-veu-copay-business-large"' dist/victoria/veu-minimum-co-payment/index.html   # expect: 1
grep -RIl 'data-figure="vic-veu-copay-business-large"' dist | wc -l                     # expect: 1
grep -c '1 June 2027' dist/victoria/gas-hot-water-broken-before-or-after-march-2027/index.html   # expect: 0
grep -c 'legislation.vic.gov.au' dist/victoria/gas-hot-water-ban-exemptions/index.html  # expect: ≥ 1
grep -ci 'not legal advice' dist/victoria/gas-hot-water-ban-exemptions/index.html       # expect: ≥ 1
grep -c '2,800' dist/victoria/veu-vs-solar-homes/index.html                             # expect: 0
grep -ci 'spot price\|today.s VEEC price' dist/victoria/what-is-a-veec/index.html       # expect: 0
grep -c 'already-installed-retrospective-discount' dist/victoria/eligibility-checker/index.html   # expect: ≥ 1
npm run test     # expect: RESULT_LINKS test passes (internal targets are built)
```

## What to test by hand

- Guri reads rows 32 and 33 against the reg 45E text (AustLII) and legislation.vic.gov.au, line by line.
- Row 31: every phone number and email matches the ESC and Energy Victoria pages today.
- Row 35: the HowTo steps match what the page shows. No times for the install itself.

## TODO: UNVERIFIED (kept off these pages; log it)

- The VEEC rename commencement date ("on proclamation, or automatically 2 Oct 2028"): trade summary only. Check it against Act No. 37/2026 itself.
- Any VEEC spot price: trader sites only. Never publish one.
- Heating and cooling repeat-claim limits ("one ducted system per home").
- The date wording "exempt work must be done by 1 June 2027": confirm it against the reg text. Until then, write "within 3 months after 1 March 2027".

## Conflicts to log

- Design §10.2 allowed `HowTo` only on `/how-quotes-work/`. The map asks for it on row 35 too. That's compatible with the "genuine steps" rule, and §10.2 is updated.

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **35** (16 + 19). Wave 1 is complete.

## Done when

35 URLs build with every check passing, Guri has read rows 32–33 against the regulation, and Wave 1 is deployed after his yes. Commit `feat(wave1b): 9 question pages`.
