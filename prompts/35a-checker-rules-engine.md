# Prompt 35a: Rebuild the checker's rules engine to the spec (data, outcome rules with sources, the 6 spec examples as tests)

> Local only. No deploy in this half; 35b deploys both halves together. Branch: `feat/checker-v2-engine`.
> **Run order:** after prompt 34 (which imports `docs/eligibility-checker-spec.md` and `postcodes.json`, and adds `basis: estimate` figures). Before 35b, 28, 36–39.
> References: `docs/eligibility-checker-spec.md` (all of it; §5 outcome rules, §6 messages, §8 examples, §9 UNVERIFIED); `docs/url-map.md` row 15 (`/victoria/eligibility-checker/`, live) and rows 54–64 (link targets); `docs/solution-design.md` §6 (the current checker) and §5.3 (figures).

---

## Goal

Replace the prompt-16 checker logic with a **pure, data-driven engine** that implements the spec exactly: the Residential/Business cascade, 75 outcome rules (spec §5: G-*, RH-1…RH-9, RW-1…RW-9, RC-1–2, RI-1…RI-5, I-APT, RD-1–2, RG-1–2, RA-1, SH-HW(-X), SH-PV(-L/-X), FED-BAT(-X), FED-STC, SOL-1–2, GAS-NO, HPZ-5, BH-1, BW-1…3, BL-1…4, BR-1…4, BM-1–2, BK-1–2, BP-1…3, BX-1, BG-1, BB-1, B-RES-ONLY, B-OC) and the **22 messages** (X1, N-AGE … N-NONE, including N-SEAL-GAS, spec §6). Every rule cites at least one source id; every figure comes from the data file. The 6 spec examples in §8 become automated tests. The UI is 35b.

## Rules for every page and file in this prompt

These are the build guards from prompts 03–10. They don't relax for the expansion.

1. **Source of truth.** Use the row for the page in `docs/url-map.csv`, which is copied below. For live pages, use the "Changes needed on existing pages" table in `docs/url-map.md`. Use **only** the facts and sources in that row, plus figures already in `site/src/content/figures/vic-veu.yaml`. Don't invent numbers, dates, counts or program names. Before you write a fact, re-open its source. If the source now says something different, **stop and tell Guri**. Don't pick a number yourself.
2. **UNVERIFIED stays off the page.** Anything the map marks UNVERIFIED, "confirm", "trade site", "per search" or "stale" goes in the TODO list at the end of this prompt. It doesn't go in copy, an FAQ, a figure or schema.
3. **Figures only from the data file.** Render every dollar amount through `<Money id>` or `<FigureTable group>`. Render every percentage and every volatile count (provider counts, rebate counts) the same way, using `unit: percent | count` (prompt 15). List every id in the page's `figures` frontmatter. Never type a `$` amount into MDX, a title, a description, an FAQ answer, alt text or JSON-LD. `check-figures` fails the build if you do.
4. **Freshness.** A figure's `checkedOn` must be 45 days old or less (`MAX_FIGURE_AGE_DAYS=45`), or the build fails. Set `checkedOn` on new figures to the day Guri re-checks the source, not to the map date, if those differ.
5. **Answer first.** The H1 is followed by an `answer` of 2–4 sentences that stands alone if quoted (`check-answers`). One H1 per page.
6. **Wording.** Write in Australian English: plain, second person, short sentences, no hype and no exclamation marks. Say "discount" for VEU, and use "indicative", "up to", "Energy Victoria lists…" and "the accredited provider confirms". Never write "you will get", "you qualify", "guaranteed", "free" (unless you're quoting an official program's own name or description, attributed and linked), "claim now" or "government rebate approved" (`check-copy`). Never imply that we're the government or part of VEU. `IndependenceNotice` appears on every page.
7. **Titles and meta.** Titles are 60 characters or fewer and descriptions are 70–160 characters, with no dollar amounts in either (`check-seo`).
8. **FAQ and schema.** Every new page has a visible FAQ of 3–5 entries in `content/faqs/` and a matching `FAQPage`. FAQ answers carry no `$` amounts; link to the section instead. The allowed schema types are `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`, and `HowTo` only where the page is a genuine step-by-step. Never use `LocalBusiness`, `Offer`, `Product` with a price, `GovernmentService` or `AggregateRating`. No currency anywhere in JSON-LD (`check-schema`).
9. **Links.** Include every internal link in the row. Put at least 2 of them in the body copy, and put the rest in the `RelatedLinks` block from prompt 17. Every page links to `/victoria/eligibility-checker/`. External links go only to the sources in the row.
10. **The quote form stays off.** Use `leadForm: false` on every new page. Don't change `PUBLIC_LEADS_ENABLED`, `LEADS_ENABLED`, `api/installers.json`, `site/src/content/installers/` or the API. The CTA is the eligibility checker.
11. **No pages beyond the map.** Don't add suburb, postcode or town pages that aren't rows in `docs/url-map.csv` (`check-urlmap` fails on extras).
12. **Metadata.** Use `author: Gurinder Singh`. Set `publishedOn`, `updatedOn` and `checkedOn` to the day Guri checks the page.
13. **Conflicts.** If the map conflicts with itself, with `docs/solution-design.md` or with a live source, write it in `docs/expansion-log.md` under "Conflicts", leave that point off the page, and tell Guri. Don't guess.

### Extra guards from the 14 Nov 2026 business review (prompts 24–27 add the checks; they apply to every page from then on)

14. **Labelled headline figures.** Every `<Money variant="block">` (the hero figure under the answer) needs a `label` that names the scenario (for example "Room gas heater → one split system") and the figure's `kind` (`discount | payment | threshold | rate | saving`). `check-figures` fails without them (prompt 25).
15. **Rule status.** Any page that states a 2027 rule carries `ruleStatus: election-watch` until prompt 23's re-check clears it. Every "must", "have to" or "banned" sentence about a 2027 rule says "currently legislated" (prompt 24, `check-rule-status`).
16. **Clean visible text.** No raw paths such as `/victoria/…` or `/about/` in visible text; use linked anchor text. No doubled words or phrases. No link from a page to itself (except `#` anchors). Rendered `<title>` 60 characters or fewer, with the brand at most once. Meta descriptions unique and 155 characters or fewer (prompt 26, `check-text`, `check-seo`).
17. **FAQ placement.** Each FAQ entry has one `canonicalPage`. It's shown in full, and in `FAQPage`, only there. Other pages link to it. Each page has 3–5 FAQs of its own (prompt 27, `check-faqs`, `check-overlap`).
18. **The map is the page list.** A page that isn't a row in `docs/url-map.csv` doesn't exist. Since 14 Nov 2026 the master map has **74 rows** (Wave 4, rows 65–74, holds the business pages, program pages, help in your language, the author page and LPG homes), and prompt 34 imports all of them. No prompt from 24 on adds a row. If a page seems to be missing, stop and ask Guri to get it added by Venture Architect first.
19. **postcodes.csv is read-only.** It's the master list of the 719 VEU v25.0 Table A postcodes. Copy it into `site/src/data/` unchanged. Never regenerate it (no `postcode_mkcsv.py`, no PDF re-parse). If it looks wrong, stop and tell Guri.

Also:

- **The spec is the requirement, not the source.** Each figure's amount and each rule's condition is re-checked against its Energy Victoria, Solar Victoria, DCCEEW/CER or SPEC25 page before `checkedOn` is set. If a source now differs from the spec, stop and tell Guri; don't silently follow either.
- **Nothing in spec §9 becomes a figure** (LPG hot water amount; rental PV criteria; a Victorian battery rebate; STC amounts; display cabinets, fan motors, C&I heat pumps, boilers, custom M&V; business insulation; Cardinia; the Shepparton council page). Those rules return text with "provider confirms" or "see Solar Victoria" and no amount.
- **No storage, no network beyond static files.** Answers stay in the browser (sessionStorage for Back only). No analytics of answers. The quote form stays off; nothing links to `/get-quotes/`.

## Steps

### 1. Figures (the data file)

Add every published amount the spec uses that isn't already in `site/src/content/figures/vic-veu.yaml`. Match on scenario first; reuse existing ids (prompt 16 and 34 created the residential heating, hot water, induction, insulation, sealing, glazing, Solar Homes and co-payment figures). New figures, each with its spec source:

| Group | Figures (amount, scenario) | Source id | audience |
|---|---|---|---|
| `vic-veu-appliances` (if prompt 30 hasn't added it) | up to 70: heat pump dryer, fridge/freezer, TV, efficient shower head, in-home display (5 figures) | EVPROD, EVFRIDGE, ESC activity overview | per figure: in-home display household only (ESC Part 30); **clothes dryer household and business (ESC Part 25)**; fridge/freezer, TV, shower head household and business |
| `vic-veu-sealing` (if prompt 34 hasn't added it) | by home type, 2-year / 5-year warranty: apartment 70 / 140; townhouse 280 / 560; house 350 / 700 (6 figures; house ids already exist) | EVSEAL (page updated 11 Nov 2026) | household |
| `vic-veu-biz-heating` | non-ducted gas → 3–9 kW 420–1,050 (range figure); ducted gas → 4 splits 1,680; multi-split 10 kW 1,820; ducted gas → ducted 16 / 25 / 32 / 56 kW 2,590 / 3,850 / 6,230 / 8,820; central electric ducted 16–56 kW 4,060; existing ducted RCAC 910–3,290 (range); no decommissioning ducted 1,820, room 70–140 (range); hard-wired electric room heater 490 | EVHC | business |
| `vic-veu-biz-lighting` | 100 × 24 W tubes → 50 LED 1,260; 20 metal halide car park → LED high bays 3,150 | EVLIGHT | business |
| `vic-veu-biz-cold-rooms` | small / medium / large 420 / 1,540 / 4,620; minimum contribution 500 | EVCOLD | business |
| `vic-veu-biz-motors` | 75 kW high-efficiency 560; up to 2,380 (185 kW premium); minimum 200 | EVMOTOR | business |
| `vic-veu-biz-kitchen` | pre-rinse spray valve 210 each | EVPRV | business |
| `vic-veu-biz-solar-pv` | 50 / 75 / 100 / 150 / 200 kW 4,550 / 6,860 / 9,100 / 25,760 / 34,300, each `rate` basis note "at a $70 VEEC price" | EVCIPV | business |
| `vic-veu-biz-hot-water` | larger C&I minimum co-payment 10,000 (if missing) | EVHW, SPEC25 Part 44 | business |
| `vic-veu-biz-savings` | small business saves up to 500 a year; larger businesses up to 74,000 (`kind: saving`) | EVBIZ | business |
| `fed-batteries` (if prompt 30 hasn't added it) | ~30% (`kind: rate`); STC factor 100% to 14 kWh, 60% 14–28 kWh, 15% 28–50 kWh from 1 May 2026 (`kind: rate`); size range 5–100 kWh (`kind: threshold`) | DCCEEW, CER | both, `jurisdiction: federal` |

Spec §5.3 example figures that the spec labels as examples (e.g. the 1,260 lighting job) render with their scenario text, never as "you'll get". Prompt 28's business pages reuse these ids; if 28 has run first, reuse its ids instead (one figure per scenario, `check-figures` duplicate-scenario check).

### 2. Sources

Add any missing source id from the spec (EVHC, EVHW, EVIND, EVINS, EVSEAL, EVGLAZ, EVPROD, EVFRIDGE, EVRETRO, EVRENT, SVHW, SVINCOME, SVPV, SVPVVEU, SVSOL, DCCEEW, CER battery and SWH pages, EVCIPV, EVBIZ, EVLIGHT, EVCOLD, EVMOTOR, EVPRV, EVBIZCUST, ESC scheduled premises register, SPEC25 Parts 6, 32, 33, 44, 45, 46, 48). Use the exact URLs in the spec; `check-sources` must get 200 (or CHALLENGE, opened by hand).

### 3. The engine (`site/src/lib/checker/`)

- `fields.ts`: the spec §4 fields (S1, R2, R2a, R3–R6, H1–H3, W1–W4, C1, I1–I2, G1, P1, BT1, A1, SH1–SH3, B2–B6, BH1–2, BW1, BL1, BR1–2, BM1, BK1, BP1, BG1, BB1) with `showWhen` predicates, options (ids exactly as the spec's option labels, slugged) and "Not sure" where the spec has it.
- `area.ts`: postcode → area record from `postcodes.json` (prompt 34). Exactly 4 digits starting with 3 and present in the CSV, else **X1**. The area record feeds `G-AREA` and the insulation figure (spec §5.4 table: Metro+Mild official 1,500; Regional+Cold official 2,100; Regional+Mild, Metro+Cold, Regional+Hot the three prompt-34 estimates; any other pairing: no figure, "provider calculates for your postcode").
- `rules.ts`: one object per spec rule:
  ```ts
  { id: 'RH-2', branch: 'residential', when: (a, area) => boolean,
    status: 'likely' | 'possibly' | 'not-eligible' | 'info',
    figureIds: string[], messageId?: string, sourceIds: string[], why: string, links: LinkKey[] }
  ```
  Conditions follow spec §5 wording exactly. `why` is plain text with no amounts (amounts render from `figureIds`).
- `messages.ts`: the 22 messages from spec §6, with their link targets.
- **Weather sealing (RD-1, RD-2).** RD-1 picks the figure by home type (R4): Apartment → the apartment pair (70 / 140); House or townhouse → the townhouse pair and the house pair, both labelled; Other / not sure → all three. Always 2-year / 5-year pairs; never the 700 alone. RD-2 adds the N-SEAL-GAS caveat when "Draughts" is selected and H1 is a ducted gas heater or a gas room heater, or H1 wasn't asked (homes with open-flued or flueless gas heaters, or an indoor open-flued water heater, can't get the discount; the provider checks first). Renters are eligible.
- **Clothes dryers (B-RES-ONLY).** Dryers are **not** household-only (ESC Part 25 covers non-residential premises). The business path's N-BIZ-RES list is ceiling insulation, induction cooktops, weather sealing and in-home displays only; a business that asks about a heat pump dryer gets "Possibly; up to 70 (figure); provider confirms".
- `links.ts`: spec §7 CTA table (quote form off) + the area-page link: postcode → page by the CSV `primary_lga`, using a table built at build time from the **enabled** map rows' `councils`/area facts (e.g. Melton and Hume → `/victoria/north-west-corridor/` for 3427, 3428, 3429, 3335–3338, 3430–3438, per spec §7). If the target row isn't enabled, fall back to `/victoria/postcode/` when row 54 is enabled, else `/victoria/`. Also keep the `BUSINESS_RESULT_LINKS` slot prompt 28 fills.
- `evaluate.ts`: `evaluate(answers): Result` → area card, ordered lines (VEU, then Solar Homes, then FEDERAL, then ineligible), global modifiers (G-*), CTAs. Pure; no DOM.
- Solstice: R2a appears only for the 10 spec postcodes (3515, 3523, 3585, 3549, 3463, 3579, 3638, 3264, 3909, 3888); read them from row 53's `areaExtra.postcodes` (prompt 34) and assert they equal the spec list.
- `GAS-NO` (no reticulated gas in the postcode): its link goes to `/victoria/lpg-homes/` once row 74 is enabled (prompt 33), else to `/victoria/get-off-gas-planner/`. The LPG amount stays UNVERIFIED (no figure).
- `HPZ-5`: heat pump zone 5 caution text from the spec; no figure.

### 4. Tests (`site/tests/checker/`, Vitest)

1. **Spec coverage:** parse `docs/eligibility-checker-spec.md` §5 and §6 tables for rule and message ids. Every id has exactly one implementation, and every implementation has a spec id (no extras). Report the counts (expect 75 rules and 22 messages as of the 14 Nov 2026 revision; if the spec changes, the test fails until the engine matches).
2. **Every rule cites a source:** each rule has ≥ 1 `sourceIds` entry that resolves in `sources.yaml`; each `figureIds` entry resolves in the figures; no rule in the §9 list has a figure.
3. **The 6 spec examples (§8) as fixtures** (`examples.test.ts`), each asserting the exact rule ids, figure ids, messages, CTAs and area-card text:
   1. **3427 Diggers Rest**, Residential, owner-occupier, house > 2 years, ducted gas → ducted, gas hot water → heat pump, income under the cap. Area card "Diggers Rest · Melton (93%) / Hume (7%) · Metropolitan · mains gas · Mild · zone 4". Lines RH-2 (ducted table 2,520 / 4,200 / 5,530; co-payment 3,000), RW-1 (560), SH-HW (1,000 / 1,400; combined 1,560 / 1,960), FED-STC note, G-RETRO footer. CTAs: find-an-accredited-provider plus the two guides. Area link `/victoria/north-west-corridor/` (and the fallback when row 56 isn't enabled).
   2. **3437 Gisborne**, insulation, nothing in the ceiling, no halogens: RI-1 with the official regional-cold 2,100 figure. **3438 New Gisborne**: RI-1 with `vic-veu-insulation-est-metro-cold` (about 2,010, estimate label).
   3. **3029 Tarneit**, home built 2025, wants RCAC: R5 = No → N-AGE on the heating line; draughts and appliances still offered.
   4. **3515 Marong**, Solstice customer, home 1 year old, gas hot water: R2a = Yes → SOL-1 banner; SOL-2 instead of N-AGE; no income question shown.
   5. **Business, 3064 Craigieburn**, warehouse, not on the register, 20 metal halide car-park lights + 100 kW PV: BL-2 (3,150 example), BP-1 (9,100 at a $70 VEEC) + STC note.
   6. **Business on the scheduled premises register, not opted in:** N-SCHED; only the FEDERAL battery line.
   Expected amounts in fixtures are referenced by **figure id**, and a separate assertion checks the figure's current amount equals the spec's, so an amount change fails loudly with both values.
4. **Postcode tests:** 719 valid postcodes all resolve; 3000 resolves; 2000, 300, 30000, "3abc" and a 3xxx postcode not in the CSV return X1.
5. **Rule tests beyond the examples:** RD-1 returns the apartment pair for an apartment, townhouse + house pairs for a house, all three for "not sure", and never a lone 5-year house figure; RD-2 adds N-SEAL-GAS for a gas room heater; a business asking for a dryer gets "Possibly" with the dryer figure, not N-BIZ-RES.
6. **No `$` or amounts in rule `why` text** (regex), and no "eligible"/"you'll get" wording (the spec uses Likely/Possibly).

### 5. Freshness

Every new figure gets `checkedOn` = the day you re-open its source. The checker page (row 15) shows the oldest `checkedOn` of the figures it can render. Add the engine to the prompt-23 register: re-run the 6 examples after any figure or postcodes.csv change.

## Acceptance checks

```bash
cd site
npm run check && npx vitest run tests/checker
# expect: spec coverage "rules 75/75, messages 22/22"; examples 6/6 pass; postcode tests pass
node scripts/check-figures.mjs && node scripts/check-sources.mjs   # expect: 0 errors
grep -RIn '\$[0-9]' src/lib/checker/rules.ts src/lib/checker/messages.ts | wc -l   # expect: 0
grep -RIn 'get-quotes' src/lib/checker | wc -l                                      # expect: 0
```

## What to test

Engine only: the Vitest suite above. 35b covers the browser.

## Open decisions for Guri

- Spec examples that refer to "income under the cap" also need SH2 (property under $3m) and SH3 (no previous rebate): the fixtures assume both pass. Confirm.
- When a source and the spec disagree, which wins (default: stop and ask each time).

## Done when

The engine, data and tests are committed; no deploy. Commit `feat(checker): spec-driven rules engine with sourced rules and 6 example tests (35a)`.
