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

### Row 48: `/victoria/shepparton/`

- **File:** `site/src/content/areas/vic/shepparton.mdx`
- **Template (map):** Area (AreaLayout)
- **Primary question (build the H1 and answer block on it):** What energy rebates can Shepparton households get?
- **Secondary questions (a section or FAQ item each):** Is Shepparton regional for insulation? · Hot summers and cooling? · Council program?
- **Priority / intent:** P3 · Intent: Medium (local)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU postcode table: 3630/3631 = Regional, reticulated gas, Cold, heat pump zone 4; 3632 = non-reticulated <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - NCC climate zone 4 (hot dry summer, cool winter), unlike Melbourne's zone 6 <https://data.gov.au/data/dataset/australian-climate-zone-map>
  - Insulation regional example up to $2,100 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - Hume region providers: 27 hot water / 60 heating-cooling on 13 Nov 2026 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Council 'Goulburn Murray Solar Savers': UNVERIFIED (council site returned 504 on 13 Nov 2026) <https://greatershepparton.com.au/animals-environment-and-waste/environment/energy-management/solar-savers>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ceiling-insulation-rebate/` · `/victoria/gas-room-heater-to-split-system/` · `/victoria/landlords-rental-standards-2027/` · `/victoria/bendigo/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** INCLUDED, CONDITIONAL. It passes on 4 verified facts, but verify the council program before publishing and add it if confirmed. If it can't be confirmed, it's still OK, but it's the thinnest regional page.
- **GATED: see prompt 22.** Don't build this page in prompt 21.

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

Sitemap count after this prompt: **53** if built (all three waves complete), or **52** if Guri keeps it gated.

## Done when

Either Part 1 is logged and Guri chose "keep gated" (no site changes), or the page is built with every check passing at 53 URLs and deployed after his yes. Commit `feat(wave3): Shepparton (verified <date>)` or `docs: Shepparton gate check <date>`.

---

## 14 Nov 2026 addendum (from prompt 34; this overrides Parts 1–3 above where they differ)

The map (row 48) and `eligibility-checker-spec.md` §9 were revised on 14 Nov 2026:

1. **Cite GMCA only.** Goulburn Murray Solar Savers is confirmed through the Goulburn Murray Climate Alliance (<https://www.gmca.org.au/>, Feb 2026 notice, checked 14 Nov 2026): vetted providers for solar, batteries, heat pump hot water, split systems, insulation, draught proofing and assessments, open to residents of Shepparton and 6 other GMCA councils. The program source is GMCA (`mapKey: GMCA`, `kind: council-program`, official). Part 1 step 3's "council's own site only" rule is replaced by this.
2. **The council's own Solar Savers page stays UNVERIFIED** (504 on 13 and 14 Nov 2026). Don't cite or link it, and don't add the `SHEPP` source, even if it loads on the day. If it loads, tell Guri so Venture Architect can update the map. No council-program dollar figure unless the GMCA page itself states one (then use its exact amount and wording, as a figure with the GMCA source); the map gives none.
3. **Postcodes:** 13 Greater Shepparton postcodes from `postcodes.csv` (all Regional, Cold, zone 4; row 48 lists which have reticulated gas), so the regional cold insulation example applies. Render from the CSV.
4. **Decision options (Part 2) are now:** (a) release with the GMCA-sourced program; (b) release without it; (c) keep gated. Release is Guri's decision only; it's a one-line `rollout.json` change, then the deploy STOP.
5. Inbound links when released: `/victoria/bendigo/`, `/victoria/mitchell/` and `/victoria/solstice-gas-shutdown-towns/` (map row 48 note).
