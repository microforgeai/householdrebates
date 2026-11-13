# Prompt 22: Shepparton location page: GATED on verifying the council's Solar Savers program

> **HARD STOP GATE.** Don't write, build, enable or publish `/victoria/shepparton/` until Part 1 is complete **and** Guri has typed his decision (Part 2).
> Part 1 is read-only research. Part 3 is local. The deploy STOP needs a separate yes.
> Run it after prompt 21. Branch: `feat/expansion-22-shepparton`.

---

## Context

Map row 48. Shepparton passes the anti-doorway test on 4 verified facts:

- the VEU postcode table (3630/3631 Regional, reticulated gas, Cold, heat pump zone 4; 3632 non-reticulated)
- NCC climate zone 4
- the regional insulation example
- the Hume region provider counts (27 hot water / 60 heating and cooling, on 13 Nov 2026)

The council's "Goulburn Murray Solar Savers" page (<https://greatershepparton.com.au/animals-environment-and-waste/environment/energy-management/solar-savers>) returned a **504 error on 13 Nov 2026**, so the program is **UNVERIFIED**.

The map's note says: "verify the council program before publishing and add it if confirmed. If it can't be confirmed, it's still OK, but it's the thinnest regional page." Guri's instruction is stricter: the page is **gated** until the program is verified. So this prompt verifies first, and Guri decides.

## Part 1: Verify (read-only; no site changes)

1. Open the council URL above in a normal browser, one request at a time. If it fails, try again on at least two different days, at different times, before recording "unreachable".
2. If it loads, record in `docs/expansion-log.md` under "Shepparton verification":
   - date and time (Melbourne)
   - HTTP status
   - page title
   - "page last updated" if shown
   - whether the program is **open, closed or paused**
   - who runs it (council or partner)
   - what it offers, quoted exactly
   - any dollar amounts, quoted exactly with the sentence they're in
   - eligibility, and the end date if any

   Save a PDF print of the page to `docs/evidence/shepparton-solar-savers-<date>.pdf`, which is git-ignored if Guri prefers.
3. If the program page is gone or moved, search **only the council's own site** (greatershepparton.com.au) for "Solar Savers". Record what you find with URLs. Don't use third-party or news pages as the source.
4. Re-check the 4 facts the page already relies on (postcode rows in `vic-veu-postcodes.json`; the ABCB zone point check, or the ABCB Climate Map for 3630; Energy Victoria's insulation page; the Hume provider counts on the hot water and heating and cooling pages). Record each value and the date.
5. Write a one-paragraph summary for Guri with one of three outcomes:
   - **A. Verified and current:** the program is live; give the details.
   - **B. Verified but closed or paused:** say so; the program can be mentioned as closed, or left out.
   - **C. Still unverifiable:** unreachable after 3 tries, or not found on the council site.

## Part 2: STOP. Guri decides

Show Guri the Part 1 summary and the evidence. **Wait for his typed decision.** Don't assume one.

- **Outcome A:** "yes, build Shepparton with the program". Go to Part 3 and include the program.
- **Outcome B or C:** Guri chooses either "build Shepparton without the program" (the map says that's acceptable) or "keep Shepparton gated". If he keeps it gated, stop here. Log the decision and the next re-check date (monthly, with the other council programs), and end the prompt. `rollout.json` stays at `1-47,49-53`.

## Part 3: Build (only after Guri's yes in Part 2)

{{BLOCK:rules}}

1. **Source:** add `site/src/content/sources/shepparton-solar-savers.yaml` (`mapKey: SHEPP`, `kind: council`, `official: true`, `checkedOn` = the Part 1 date, plus `pageLastUpdated` if shown). Do this only for outcome A, or for outcome B if Guri wants the closure mentioned.
2. **Figures:** append (re-open the source; stop on any difference):

   | id | qualifier | unit | max | source |
   |---|---|---|---|---|
   | `vic-veu-providers-hume-hw` | exact | count | 27 | energyvic-hot-water |
   | `vic-veu-providers-hume-hc` | exact | count | 60 | energyvic-heating-cooling |

   For outcome A only: add a council-program dollar figure if, and only if, the council page states one. Use the exact amount and wording recorded in Part 1, with `program: "Greater Shepparton City Council"`. If Part 1 found no amount, add no figure.
3. Set `rollout.json` → `"enabledRows": "1-53"` and `"gatedApproved": ["/victoria/shepparton/"]`. Set `gated: true` in `url-map.json`; it stays true, because the approval list is what lets it through.
4. Write the page from the row below. Use `postcodes: ["3630", "3631", "3632"]`. 3632 must be shown as non-reticulated, from the table. Include `nccZone: { zone: 4, places: ["Shepparton"] }` and the ABCB attribution. Add the council program as a local fact only for outcome A (or as "closed" for outcome B, if Guri chose that).
5. Check that the page links to every row link and is linked from the areas list and the hub.

{{PAGES:48-48}}

## Acceptance checks (Part 3 only)

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 78 figures" (77 if the Whittlesea figure was skipped; +1 if a council amount was added), 0 stale, 0 raw amounts
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 53 URLs (expected 53), 0 extra, 0 missing links, 0 orphans, sitemap 53, llms 53"
grep -c '<loc>' dist/sitemap-0.xml                                   # expect: 53
grep -c 'data-local-fact' dist/victoria/shepparton/index.html        # expect: ≥ 4 (≥ 5 with the program)
grep -c 'shepparton' dist/llms.txt                                   # expect: 1
ls src/content/sources/*.yaml | wc -l                                # expect: 66 if the SHEPP source was added, otherwise 65
```

Negative test: remove `/victoria/shepparton/` from `gatedApproved` → the build fails with "gated page not approved". Then restore it.

## TODO: UNVERIFIED until Part 1 resolves it

- Goulburn Murray Solar Savers: whether it exists, its status, what it offers and any amounts.

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **53** if built (all three waves complete), or **52** if Guri keeps it gated.

## Done when

Either Part 1 is logged and Guri chose "keep gated" (no site changes), or the page is built with every check passing at 53 URLs and deployed after his yes. Commit `feat(wave3): Shepparton (verified <date>)` or `docs: Shepparton gate check <date>`.
