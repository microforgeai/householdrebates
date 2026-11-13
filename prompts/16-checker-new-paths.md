# Prompt 16: Eligibility checker: co-payments, LPG wording, and new insulation, induction and draught-proofing paths

> Local only. Nothing leaves the browser, and there are no network calls. The deploy STOP at the end needs Guri's yes.
> Run it after prompt 15 (it needs the new figures, sources and the `insulation | induction | sealing` activities). Branch: `feat/expansion-16-checker`.

---

## Context

The checker (`/victoria/eligibility-checker/`, prompt 07, design §6) covers heating and cooling and hot water only. The URL map ("Changes needed on existing pages" and "Method notes: Checker gaps") asks for:

1. **The ducted results show the new co-payment.** From 30 Sep 2026, every ducted system needs at least $3,000 including GST from the customer. Multi-split needs $3,000 at 10 kW or more and $1,000 below 10 kW. A single split below 10 kW still needs $200. Source: SPEC25 Part 6, figures `vic-veu-copay-*` (prompt 15). The map also says: "Checker rule 'Ducted gas + splits' must show the new co-payment."
2. **LPG hot water says "provider confirms".** VEU Part 3 covers "gas or LPG" water heaters, but Energy Victoria's table shows only a gas figure. The LPG amount is UNVERIFIED, so the checker must **not** show a dollar row for LPG.
3. **New paths: ceiling insulation, induction cooktop, and draught proofing (Energy Victoria calls it "weather sealing").** The rules below come only from the map rows for `/victoria/ceiling-insulation-rebate/`, `/victoria/gas-cooktop-to-induction/` and `/victoria/draught-proofing-rebate/` (sources `energyvic-insulation`, `energyvic-induction`, `energyvic-weather-sealing`, `cav-renter-changes`, `energyvic-renters-landlords`, `vic-veu-spec-v25`). Where the map doesn't state a rule (e.g. building age for weather sealing, or a co-payment for weather sealing), **the checker doesn't ask about it or apply it**.
4. **The RETRO result links to the retrospective discounts page.** That page is built in prompt 18. Until then, link Energy Victoria's retrospective page (`energyvic-retrospective`), and switch to the internal page in prompt 18.

The insulation path needs the **VEU postcode table** (SPEC25 "Location Variable List", Table A: Metropolitan/Regional, reticulated gas yes/no, climatic region Mild/Cold/Hot, heat pump climatic zone 4/5). Venture Architect parsed **719 rows** from the v25.0 PDF. This prompt extracts it into a data file. The area pages (prompts 21–22) and the size guide (prompt 20) reuse it.

The figures don't change: the checker still embeds `<script type="application/json" id="figures">` and builds DOM nodes with `data-figure`. Note text still contains no `$`.

## Goal

- A tested `vic-veu-postcodes.json` (719 postcodes).
- An extended `assess()` covering five activities, with new notes and result links.
- An updated form island, unit and e2e tests, and design §6 updated to match.

## Steps

0. **Figures for the new paths.** Append these 8 rows to `vic-veu.yaml` (`state: vic`, `audience: household`; `checkedOn` = the day you re-open the source). Confirm each amount on the source first, and if anything differs, stop and tell Guri. Scenario text must not contain a `$` amount, because scenario strings render as text.

   | id | group | scenario | qualifier | max | source |
   |---|---|---|---|---|---|
   | `vic-veu-induction` | `vic-veu-induction-household` | Induction cooktop replacing a gas cooktop, per product | exact | 140 | energyvic-induction |
   | `vic-veu-induction-cert-price-basis` | `vic-veu-induction-household` | Certificate price Energy Victoria's induction figure is based on | exact | 70 | energyvic-induction |
   | `vic-veu-sealing-apartment-2yr` | `vic-veu-weather-sealing-household` | Example: apartment, products with a 2-year warranty | exact | 70 | energyvic-weather-sealing |
   | `vic-veu-sealing-apartment-5yr` | same | Example: apartment, 5-year warranty | exact | 140 | energyvic-weather-sealing |
   | `vic-veu-sealing-townhouse-2yr` | same | Example: townhouse, 2-year warranty | exact | 280 | energyvic-weather-sealing |
   | `vic-veu-sealing-townhouse-5yr` | same | Example: townhouse, 5-year warranty | exact | 560 | energyvic-weather-sealing |
   | `vic-veu-sealing-house-2yr` | same | Example: house, 2-year warranty | exact | 350 | energyvic-weather-sealing |
   | `vic-veu-sealing-house-5yr` | same | Example: house, 5-year warranty | exact | 700 | energyvic-weather-sealing |

1. **Postcode table.** Write `site/scripts/extract-veu-postcodes.mjs`. Run it once by hand; it's not part of the build:
   - Input: the SPEC25 PDF, downloaded by hand into `data-src/veu-spec-v25.pdf` (git-ignored). Convert it with `pdftotext -raw` (poppler). `-layout` drops rows: a test extraction on 13 Nov 2026 got 700 rows with `-layout` and 719 with `-raw`.
   - Parse every line after "Table A – List of postcodes" that matches `^(3\d{3}) (Metropolitan|Regional) (Yes|No) (Mild|Cold|Hot) ([45])$` (collapse whitespace first).
   - Output: `site/src/data/vic-veu-postcodes.json` with the shape `{ "source": "vic-veu-spec-v25", "specVersion": "25.0", "checkedOn": "<date>", "rows": { "3350": { "area": "Regional", "reticulatedGas": true, "climaticRegion": "Cold", "hpZone": 5 }, … } }`.
   - The script fails unless there are exactly 719 unique postcodes and none is duplicated with different values.
   - Fixture test `tests/unit/veu-postcodes.test.ts`. These values come from the map and from a spot check of the v25.0 text on 13 Nov 2026:

     | Postcode | Expected |
     |---|---|
     | 3350 | Regional, gas Yes, Cold, zone 5 |
     | 3630 | Regional, gas Yes, Cold, zone 4 |
     | 3632 | Regional, gas No |
     | 3515, 3523 | Regional, gas No |
     | 3216 | Regional, gas Yes, Mild |
     | 3024, 3029, 3030 | Metropolitan, gas Yes, Mild |
     | 3770 | Metropolitan, Cold, zone 5 |
     | 3799 | Regional |
     | 3000 | Metropolitan, gas Yes, Mild, zone 4 |

   - The freshness check covers this file too: `check-figures` treats `checkedOn` here like a figure (45 days). Re-run the script when SPEC25 changes version.
2. **Questions** (`site/src/data/eligibility/vic-rules.ts`; update design §6.1):
   - Q2 becomes a checkbox group "What do you want to look at? (choose one or more)": Heating and cooling / Hot water / Ceiling insulation / Induction cooktop / Draught proofing.
   - Q3 (timing) stays, but its RETRO handling is per activity (see the rules).
   - New, shown only when the activity is chosen:

     | id | Question | Options |
     |---|---|---|
     | Q9a | What's the property's postcode? | 4-digit input (`inputmode="numeric"`, pattern `3\d{3}`) |
     | Q9b | What's in the ceiling now? | No insulation / Some, but thin (less than about 90 mm, or lower than the top of the ceiling joists) / Thicker than that / Not sure |
     | Q9c | Are there halogen downlights in the ceiling, or any wiring you know is unsafe? | Yes / No / Not sure |
     | Q10a | What cooktop do you have now? | Gas / Electric (not induction) / Induction already / None |
     | Q10b | Has an induction cooktop discount already been claimed at this address? | No / Yes / Not sure |
     | Q10c | What kind of induction cooktop do you want? | Built-in or freestanding, at least 550 × 380 mm, 3 or more zones / Portable / Not sure |
     | Q11a | What kind of home is it? | Apartment / Townhouse / House |
     | Q11b | Is there an open-flued or flueless gas heater, or an open-flued gas water heater, inside the home? | Yes / No / Not sure |

   - Add a one-line help text to Q11b: "These are heaters and water heaters that take air from the room or release fumes into it. If you're not sure, choose 'Not sure'." Keep it plain, with no diagnosis.
3. **Rules** (`site/src/lib/eligibility.ts`; update design §6.2). Keep every existing rule, and add or change these:
   - **Co-payment notes (heating and cooling)**, as new NoteId `copay-hc` with `figureIds` chosen by path:
     - ducted gas + ducted, central electric + ducted, ducted RCAC + ducted, and any ducted "no decommissioning" row → `vic-veu-copay-ducted`
     - ducted gas + splits → `vic-veu-copay-multisplit-10kw-plus`, `vic-veu-copay-multisplit-under-10kw`, `vic-veu-copay-split-under-10kw` (the 4-splits and multi-split rows can be either)
     - room gas + split, hard-wired electric + split, split RCAC + split, room "no decommissioning" → `vic-veu-copay-split-under-10kw` and `vic-veu-copay-nonducted-10kw-plus`
     - "Not sure" → the whole `vic-veu-copayments` heating and cooling rows

     The note text has no `$`: "You still pay at least this amount after the discount (VEU Specifications v25.0, from 30 September 2026). An offer of a free ducted system can't be a genuine VEU offer." The figures render beside it.
   - **LPG hot water (change):** outcome `POSSIBLE`, **no figure rows**, and notes `lpg-provider-confirms` ("VEU covers replacing gas or LPG water heaters, but Energy Victoria only publishes a figure for mains gas. An accredited provider confirms whether a discount applies to your LPG system, and how much.") and `lpg-not-covered` (the 2027 rule doesn't apply to LPG). Update the existing unit test that expected heat pump rows for LPG.
   - **Insulation** (activity `insulation`; Q6 building age is **not** applied, because the map gives no age rule for insulation):
     - Q9c = Yes → `LIKELY_NOT`, note `insulation-safety-fix-first` ("Energy Victoria says halogen downlights or unsafe wiring make a home ineligible until they're fixed").
     - Q9b = Thicker → `LIKELY_NOT`, note `insulation-r2` (eligible only if the ceiling is uninsulated or below R2.0, about 90 mm).
     - Q9b or Q9c = Not sure → `POSSIBLE`.
     - Otherwise → `LIKELY`.
     - Figures: always show both `vic-veu-insulation-metro` and `vic-veu-insulation-regional`, plus `vic-veu-copay-insulation`. If the postcode is in the table, add note `insulation-postcode` with a data-driven label: "In the VEU postcode table, {postcode} is listed as {Metropolitan|Regional}, climatic region {Mild|Cold|Hot}." Highlight a row only when **both** columns match its example (Metropolitan + Mild → metro row; Regional + Cold → regional row). Otherwise highlight neither and say "the accredited provider confirms which amount applies" (see the conflict log: e.g. Geelong is Regional + Mild).
     - Postcode not in the table, or not 3xxx → `POSSIBLE` plus note `postcode-unknown`.
     - Always add notes `insulation-safety-checks` (licensed electrician's safety assessment plus the installer's safety assessment before work; installer must be Energy Efficiency Council certified) and `insulation-few-providers` ("Energy Victoria listed only a few insulation providers when we checked"; don't print the number 3 unless it comes from a `count` figure).
     - Q5 = Rent → `renter-permission`. Q5 = Rent or Landlord → `rental-insulation-2027` (R5.0 where none is present, at a new lease from 1 March 2027; source `energyvic-rental-efficiency`).
   - **Induction** (activity `induction`):
     - Q10a ≠ Gas → `LIKELY_NOT`, note `induction-must-replace-gas`.
     - Q6 = No → `LIKELY_NOT`, note `property-age`.
     - Q10b = Yes → `LIKELY_NOT`, note `induction-claimed-before`.
     - Q10c = Portable → `LIKELY_NOT`, note `induction-product-rules` (built-in or freestanding, at least 550 × 380 mm, 3+ zones, 2-year warranty).
     - Any Not sure → `POSSIBLE`.
     - Otherwise → `LIKELY`.
     - Figures: `vic-veu-induction`, `vic-veu-copay-induction`. Note `induction-process`: "Energy Victoria's process for cooktops is different: check eligibility, buy the cooktop, then send the invoice to an accredited provider. Installation can be arranged separately."
     - **Timing:** for induction, Q3 = "Bought, not installed" is the normal process, so show no retrospective caution. Q3 = "Installed" → `POSSIBLE` (not RETRO), with notes `induction-process` and `retro`, plus a link to the retrospective page. This is a design choice. The map doesn't say whether an installed cooktop can still be claimed, so it's logged as a decision for Guri.
     - Optional note `gas-supply-saving` (removing **all** gas appliances could avoid about `vic-gas-supply-saving` a year in supply charges). It's added in prompt 17 with its figure. Leave a TODO here.
   - **Draught proofing** (activity `sealing`; no building-age or co-payment rule, because the map has none):
     - Q11b = Yes → `LIKELY_NOT`, note `sealing-co-risk` ("Homes with an open-flued or flueless gas heater, or an open-flued gas water heater inside, don't qualify, because sealing can raise the risk of carbon monoxide").
     - Q11b = Not sure → `POSSIBLE` plus the same safety note.
     - Otherwise → `LIKELY`.
     - Figures: the two weather-sealing rows for the chosen home type (`vic-veu-sealing-{apartment|townhouse|house}-{2yr|5yr}`, added in step 0). Label them "Energy Victoria's examples; the amount depends on what's sealed and the product warranty".
     - Q5 = Rent → note `renter-sealing` (CAV: draughtproofing is a reasonable change a landlord can't refuse without good reason in a property without gas appliances; with gas appliances, a gas safety check first; source `cav-renter-changes`). Q5 = Rent or Landlord → `rental-sealing-2027` (draughtproofing standard from 1 Jul 2027; source `energyvic-rental-efficiency`).
   - **RETRO** (heating and cooling, hot water, insulation, sealing): unchanged outcome, but the result link comes from `RESULT_LINKS.retro`, described below.
   - **Two results per activity**, as now. A run with five activities returns five Results.
4. **Result links.** Create `site/src/data/eligibility/result-links.ts`: `{ [key]: { internal?: string; external: { sourceId: string } } }`.
   - Keys: `retro`, `rcac`, `hotwater`, `insulation`, `induction`, `sealing`, `gas-2027`.
   - Set `internal` only for pages that exist. Today those are `/victoria/air-conditioner-rebate/`, `/victoria/heat-pump-rebate/` and `/victoria/gas-to-electric-hot-water-2027/`.
   - Prompts 17–19 fill in the rest (`retro` → `/victoria/already-installed-retrospective-discount/`, insulation, induction, sealing).
   - A unit test fails if `internal` points to a URL that isn't built.
5. **Note wording** (`site/src/data/eligibility/notes.ts`): add every new NoteId with an optional `figureIds` and `sourceId`. There's no `$` in note text (test exists). Use the fixed result wording from design §6.3; the banned phrases still apply.
6. **Island.** Extend `EligibilityChecker.astro` and `eligibility.client.ts`:
   - The checkbox group for Q2.
   - `showIf` for Q9–Q11.
   - The postcode input with an inline error ("Enter a 4-digit Victorian postcode"), tied with `aria-describedby`.
   - Embed **only** the postcode fields the island needs. Ship the table as a compact JSON blob, `{ "3350": "R1C5", … }`, decoded in the island. Keep the checker bundle under 15 KB gzipped, **excluding** the JSON data blob. Report the blob size too, and keep it under 12 KB gzipped.
   - The progress text counts only the questions that are shown.
   - The "Get a quote" button stays hidden while the form is off (no change). For insulation, induction and sealing, there's **no** quote button even when the form is on (lead activities are only `rcac | hotwater`).
7. **Page copy** (`/victoria/eligibility-checker/`):
   - Update the answer: "…whether an upgrade looks like it fits the Victorian Energy Upgrades rules (heating and cooling, hot water, ceiling insulation, induction cooktops and draught proofing)…". Keep it to 2–4 sentences.
   - Add sources `energyvic-insulation`, `energyvic-induction`, `energyvic-weather-sealing`, `vic-veu-spec-v25` and `cav-renter-changes`.
   - Add one FAQ: "Why does the checker ask for my postcode?" Answer: the VEU postcode table sets metro or regional and the climate region, the postcode stays in your browser, and nothing is sent.
8. **Tests** (`tests/unit/eligibility.test.ts`). Keep every existing case (update the LPG one), and add:

   | Answers | Expected |
   |---|---|
   | ducted gas → ducted, own, > 2 y | LIKELY, note `copay-hc` with `vic-veu-copay-ducted` |
   | ducted gas → splits | `copay-hc` includes `vic-veu-copay-multisplit-10kw-plus` and `-under-10kw` |
   | room gas → split | `copay-hc` includes `vic-veu-copay-split-under-10kw` |
   | HW LPG | POSSIBLE, `figureIds` empty, notes `lpg-provider-confirms` and `lpg-not-covered` |
   | insulation, 3350, none, no halogens | LIKELY, both insulation figures, regional row highlighted, note `insulation-postcode` |
   | insulation, 3216, thin, no | LIKELY, both figures, **neither** highlighted |
   | insulation, 3000, none, no | metro row highlighted |
   | insulation, halogens Yes | LIKELY_NOT `insulation-safety-fix-first` |
   | insulation, Thicker | LIKELY_NOT `insulation-r2` |
   | insulation, postcode 2000 | POSSIBLE `postcode-unknown` |
   | insulation, building ≤ 2 years | **not** LIKELY_NOT on age (no age rule) |
   | induction, gas, > 2 y, not claimed, built-in | LIKELY, `vic-veu-induction`, `vic-veu-copay-induction`, `induction-process` |
   | induction, electric now | LIKELY_NOT `induction-must-replace-gas` |
   | induction, portable | LIKELY_NOT `induction-product-rules` |
   | induction, bought not installed | no retro caution |
   | induction, installed | POSSIBLE with `retro` |
   | sealing, house, no flued heaters | LIKELY, the two house rows |
   | sealing, flued heater Yes | LIKELY_NOT `sealing-co-risk` |
   | sealing, rent | `renter-sealing`, `rental-sealing-2027` |
   | all five activities | five Results |

   Plus: every `figureIds` value exists; no note contains `$`; every `RESULT_LINKS.internal` is a built URL; the postcode fixtures pass.
9. **e2e** (`tests/e2e/checker.spec.ts`): keyboard-only run of the insulation path with postcode 3350; a run of the induction path; the postcode error is announced; a JS-off run still shows the fallback note; zero network requests during a run.
10. **Design doc:** update `docs/solution-design.md` §6 so it matches what you built. If it already matches (Indie Builder updated it on 13 Nov 2026), confirm that in the commit message.

## Acceptance checks

```bash
cd site
node scripts/extract-veu-postcodes.mjs data-src/veu-spec-v25.pdf
# expect: "veu-postcodes: 719 rows, 0 conflicts, written src/data/vic-veu-postcodes.json"
node -e "const t=require('./src/data/vic-veu-postcodes.json');console.log(Object.keys(t.rows).length, JSON.stringify(t.rows['3350']), JSON.stringify(t.rows['3216']))"
# expect: 719 {"area":"Regional","reticulatedGas":true,"climaticRegion":"Cold","hpZone":5} {"area":"Regional","reticulatedGas":true,"climaticRegion":"Mild","hpZone":4}
npm run test          # expect: eligibility tests ≥ 35 passing (15 old + ≥ 20 new), postcode fixtures pass, 0 failing
npm run build && node scripts/check-figures.mjs
# expect: all post-build checks pass; "check-figures: 48 figures, 0 stale, 0 raw amounts, 0 schema amounts"
npx playwright test tests/e2e/checker.spec.ts   # expect: all pass
grep -c 'id="figures"' dist/victoria/eligibility-checker/index.html                 # expect: 1
gzip -c dist/_astro/eligibility*.js | wc -c                                          # expect: < 15360
grep -c '\$' src/data/eligibility/notes.ts                                           # expect: 0
```

## What to test by hand

- Guri runs 5 real cases: his own home; a Ballarat postcode; a Geelong postcode; an apartment with a flueless gas heater; an LPG hot water system. He compares each result with the Energy Victoria pages.
- Screen reader: the checkbox group legend, the postcode error and the result announcement.
- On a phone at 200% zoom, the postcode input and the results are usable.

## TODO: UNVERIFIED (keep out of the checker)

- The LPG hot water discount amount.
- Repeat-claim limits for heating and cooling (e.g. "one ducted system per home"): trade sites only. The checker doesn't ask.
- A building-age rule or co-payment for weather sealing: not in the map. The checker doesn't apply one.
- Whether an already-installed induction cooktop can still be claimed: not in the map (decision for Guri; see the induction rule).
- The 20 kW multi-split cap (see prompt 15).

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

Sitemap count for this prompt: **16** (no new URLs).

## Done when

Tests pass, the bundle and blob budgets hold, Guri has run his 5 cases, and §6 of the design matches. Commit `feat(checker): co-payments, LPG wording, insulation/induction/draught-proofing paths, VEU postcode table`.
