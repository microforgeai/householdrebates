# Prompt 07 — Eligibility checker (static JavaScript)

> Local only. No data leaves the browser.

---

## Context

The checker at `/victoria/eligibility-checker/` tells a Victorian household whether an upgrade **looks like it fits** the VEU rules and shows the indicative discount row Energy Victoria lists for their situation, with the checked-on date and source link. It must never promise a discount: the accredited provider confirms eligibility and the amount. Rules come from the Energy Victoria heating-and-cooling and hot-water pages (checked 13 Nov 2026). Full rules: `docs/solution-design.md` §6. Figures come from `content/figures/vic-veu.yaml` (prompt 03).

## Goal

A pure, unit-tested `assess()` function plus an accessible, progressive form island, a checker page, and a hand-off to the quote form via `sessionStorage` (no cookies, no network calls).

## Steps

1. `site/src/data/eligibility/vic-rules.ts` — the question definitions (ids, labels, options, `showIf`) from solution-design §6.1. Labels in plain Australian English.
2. `site/src/lib/eligibility.ts`:
   ```ts
   export type Outcome = 'LIKELY' | 'POSSIBLE' | 'LIKELY_NOT' | 'RETRO' | 'OUT_OF_AREA' | 'BUSINESS';
   export interface Result {
     outcome: Outcome;
     activity: 'rcac' | 'hotwater';
     figureIds: string[];          // rows to show, from figures data
     notes: NoteId[];              // e.g. 'landlord-approval', 'rental-2027', 'gas-2027-rule', 'lpg-not-covered', 'min-contribution', 'retro', 'two-system-limit', 'property-age'
     formAllowed: boolean;
     flags: { productBought?: boolean };
   }
   export function assess(a: Answers): Result[]   // one Result per activity chosen
   ```
   Implement every rule in solution-design §6.2 exactly. Map `(currentSystem, wanted)` to figure ids:
   - ducted gas + ducted → `vic-veu-rcac-ducted-gas-10kw`, `-16kw`, `-22kw`
   - ducted gas + splits → `vic-veu-rcac-room-4splits-ducted-gas`, `vic-veu-rcac-room-multisplit-ducted-gas`
   - room gas + split → `vic-veu-rcac-room-room-gas`
   - central electric ducted + ducted → `vic-veu-rcac-ducted-central-electric`
   - hard-wired electric room + split → `vic-veu-rcac-room-hardwired-electric`
   - ducted RCAC + ducted → `vic-veu-rcac-ducted-replace-rcac-10kw|16kw|22kw`
   - split RCAC + split → `vic-veu-rcac-room-replace-rcac`
   - nothing/other → `vic-veu-rcac-room-no-decommission`, `vic-veu-rcac-ducted-no-decommission`
   - "not sure" → whole household group(s)
   - hot water: electric → `vic-veu-hw-electric-to-heatpump` (+ solar row); gas → `vic-veu-hw-gas-to-heatpump` (+ solar row) + note `gas-2027-rule`; broken solar → all four HW rows; LPG → heat pump rows + `lpg-not-covered`; always `min-contribution`.
3. `site/src/data/eligibility/notes.ts` — the wording for each `NoteId` (no dollar amounts in note text; figures only via ids). Fixed outcome wording from solution-design §6.3.
4. `EligibilityChecker.astro` + `eligibility.client.ts`:
   - Server-render the full form as `<fieldset>`s with radio groups (works as a static page; with JS off show a note "Turn on JavaScript to see your result, or read the guides" with links).
   - JS: show one step at a time, honour `showIf`, Back button, progress "Step 2 of 6", result panel with `role="status"` / `aria-live="polite"`, focus moves to the result heading.
   - Result renders figures by building DOM nodes with `data-figure` and the checked-on + source link from a JSON blob the page embeds as `<script type="application/json" id="figures">` (data, not executed; CSP-safe). No `innerHTML` with user input.
   - "Get a quote" button only when `formAllowed`; it saves `{activity, currentSystem, ownership, buildingOver2Years, workStarted}` to `sessionStorage['hr-checker']` and links to `/#quote` or the relevant guide's form anchor.
   - "Start again" clears state and `sessionStorage`.
5. Page `pages/eligibility-checker.mdx` (`ToolLayout`, `leadForm: false`): answer block — "Answer a few questions to see whether an upgrade looks like it fits the Victorian Energy Upgrades rules, and the indicative discount Energy Victoria lists for your situation. It takes about a minute and nothing you enter leaves your browser. An accredited provider confirms eligibility and the actual discount in your quote." Plus a short "How this works" and sources.
6. Tests `site/tests/unit/eligibility.test.ts` — at least these cases:

   | Answers | Expected |
   |---|---|
   | state ≠ Vic | OUT_OF_AREA, formAllowed false |
   | business | BUSINESS, formAllowed false |
   | already installed | RETRO, formAllowed false |
   | bought not installed, room gas → split, own, >2y | LIKELY, flags.productBought true, formAllowed true |
   | room gas → split, own, building ≤ 2y | LIKELY_NOT with note `property-age` |
   | nothing → split, new build | LIKELY with no-decommission rows |
   | ducted gas → ducted, rent | LIKELY + `landlord-approval` + `rental-2027` |
   | HW none | LIKELY_NOT |
   | HW gas, 0 upgraded | LIKELY, ids include `vic-veu-hw-gas-to-heatpump`, note `gas-2027-rule` |
   | HW electric | ids include `vic-veu-hw-electric-to-heatpump` |
   | HW LPG | note `lpg-not-covered` |
   | HW 2+ already upgraded | LIKELY_NOT `two-system-limit` |
   | any "not sure" | POSSIBLE |
   | both activities | two Results |

   Plus a test that every `figureIds` value exists in the figures data, and a test that no note text contains `$`.
7. Playwright `site/tests/e2e/checker.spec.ts`: keyboard-only run through two paths; result announced; "Get a quote" stores sessionStorage; JS-disabled run shows the fallback note.

## Acceptance checks

```bash
npm run test -w site        # expect: eligibility tests ≥ 15 passing, 0 failing
npm run build -w site       # expect: postbuild checks pass (figures rendered via data-figure only)
npx playwright test site/tests/e2e/checker.spec.ts    # expect: all pass
grep -c 'type="application/json" id="figures"' site/dist/victoria/eligibility-checker/index.html   # expect: 1
grep -RPl '<script(?![^>]*\bsrc=)(?![^>]*application/(ld\+)?json)' site/dist --include=*.html | wc -l  # expect: 0
du -b site/dist/_astro/*.js | sort -n | tail -3      # expect: checker bundle < 15 KB gzipped (check with gzip -c | wc -c)
```

## What to test

- Run 5 real scenarios Guri gives you (e.g. his own house) and compare the shown row with the Energy Victoria tables by eye.
- Screen reader: each step's legend is read; the result is announced.
- Network tab: zero requests when answering.

## Done when

Tests and checks pass, and Guri has tried it. Commit `feat(checker): VEU eligibility checker`.
