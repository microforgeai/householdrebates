# Prompt 23: Post-election re-check of every figure and rule (after the 28 Nov 2026 Victorian state election)

> Research plus local edits. Start **no earlier than Monday 30 Nov 2026** (Melbourne time). Repeat it monthly after that using the same report. Content changes are local until the deploy STOP. Any figure that changed needs Guri's yes before it's edited.
> Branch: `chore/recheck-<yyyy-mm-dd>`.

---

## Context

The Victorian state election is on **28 Nov 2026**. The URL map flags it as a policy risk. A new or returning government can change VEU settings, Solar Homes, the 2027 gas rules or the rental standards. DEECA's VEU work program also has pending responses on the water heating and space heating reviews and a new hydronic activity, and any of these could move the hot water or heating figures (<https://www.energy.vic.gov.au/victorian-energy-upgrades/installers/industry-market-update-work-program>).

There's also a hard deadline: every figure checked on 13 Nov 2026 turns stale under the 45-day rule around **28 Dec 2026**, and the build will fail. This re-check resets `checkedOn`, but **only for figures confirmed unchanged on the official page**.

Rules:

- Election promises, media releases about future policy and party announcements are **not** facts for the site. A change goes on a page only once the official program page, the specification or the legislation shows it as in force or with a commencement date.
- Product pages beat summary pages. Never use the 'Latest discounts and rebates' page.
- Don't invent numbers. If a source now shows a different amount, record it and stop for Guri.

## Goal

1. A dated diff report (`docs/recheck/<yyyy-mm-dd>.md`) of every figure, source, rule and UNVERIFIED item against the official sources.
2. `checkedOn` updated only for confirmed-unchanged items.
3. A STOP list of changes for Guri.
4. After his yes: the edits, the build and the deploy.

## Steps

1. **Generate the register.** `site/scripts/recheck-report.mjs` writes `docs/recheck/<date>.md` with a table for each of these:
   - every figure (`id`, amount and qualifier as shown, `sourceId`, source URL, `checkedOn`, the pages that use it)
   - every source (`id`, URL, `pageLastUpdated` we stored)
   - `vic-veu-postcodes.json` (spec version) and `hw-size-guide.json`
   - every page with `reviewBy` within the next 60 days
   - every open item in `docs/expansion-log.md` "UNVERIFIED"

   Leave `Current value`, `Page last updated (now)`, `Status` (`unchanged | changed | gone | blocked`) and `Notes` columns empty for the human pass.
2. **Fetch politely.** Run `node scripts/check-sources.mjs` (sequential, 3 s gap). Open every `CHALLENGE` URL by hand.
3. **Check, in this order** (the map's "Facts to re-check" list). For each, open the source and fill in the register:
   1. **Energy Victoria product pages and their "page last updated" dates:** heating and cooling, hot water, induction, insulation, weather sealing, glazing.
   2. **VEU Specifications:** is v25.0 still current on the industry specifications page? If there's a new version, download it, re-check the Part 6 co-payments (all 8 `vic-veu-copay-*` figures and the business one), and re-run `extract-veu-postcodes.mjs`. The 719-row count may change: update the script's expected count only with Guri's yes. Also check the work program page for the water heating and space heating review outcomes and the hydronic activity.
   3. **Solar Homes hot water:** $1,000 / $1,400, the 50% share, the $150,000 income cap, the $3m property cap, the 3-year system age and the 120-day install window. Also the extra 27,000 rebates.
   4. **Solar PV:** the $1,400 rebate, and the 1 Jul 2027 move into VEU.
   5. **Solar for Apartments:** the lot limit (3–50 vs 150), per-apartment and per-property amounts, and the 30 Jun 2027 close.
   6. **Rental minimum standards and exemptions** (CAV and the Energy Victoria rental page).
   7. **Reg 45E:** the in-force version on legislation.vic.gov.au and any amendment before 1 Mar 2027. Confirm the "within 3 months" wording; this may resolve the "by 1 June 2027" TODO.
   8. **Retrospective discount** time limit.
   9. **Concessions:** 17.5%, $171.60, $62.40 and the winter dates (DFFH). Note the excess-bill thresholds for Guri, but don't add them to pages.
   10. **Solstice:** the town list, exemptions, the $600 top-up, and the closure dates. Decide whether the page should move to an archive or "what happened" version (see step 6).
   11. **Council programs:** Whittlesea (assessments to June 2027), Casey ($200 budget and pause status), Ballarat (program status), Bendigo, Wyndham, Yarra Ranges, and Shepparton (if prompt 22 left it gated, re-run its Part 1).
   12. **Accredited provider counts** per region (used on the Ballarat, Bendigo and Shepparton pages). The insulation provider count, if it was published.
   13. **STC eligibility** for heat pumps (under 425 L, on the register) (CER).
   14. **The VEET Act rename:** has the commencement been proclaimed? If yes, VEEC wording changes to "energy upgrade certificates" across `/victoria/what-is-a-veec/` and the glossary. That's a separate edit list for Guri.
   15. **Easy Electric SEC** scope (competitor watch): note any change for Guri's lead-model decision.
   16. **Any new program or change announced after the election.** Record it with its official URL and its status: announced, legislated or in force. **Nothing goes on a page unless it's in force or has a commencement date on an official page.**
4. **Diff.** For every row, set Status:
   - `unchanged`: set `checkedOn` (figure and source) to today, and update `pageLastUpdated` if it changed with no content change.
   - `changed`: **don't edit yet.** Add to "STOP list for Guri": old value, new value, the exact sentence from the source, the URL, and the pages affected (from the register).
   - `gone` (404, or page moved): find the replacement on the same official site. If there isn't one, add it to the STOP list.
   - `blocked`: try again by hand. If it's still blocked, list it. Its `checkedOn` doesn't move.
5. **STOP: Guri reviews the STOP list.** For each change he approves:
   - update the figure (keep the old one as historical with `effectiveTo` and `supersededBy`, as with the co-payments)
   - update the affected pages' copy
   - set `updatedOn` and `checkedOn` on those pages
   - add a line to `/sources/` ("What changed")

   For a change he doesn't approve yet, the figure keeps its old `checkedOn`. It will go stale and fail the build within 45 days, which is the intended safety net. Never extend `MAX_FIGURE_AGE_DAYS` to get round it.
6. **Time-limited pages:**
   - If every Solstice network has closed, propose to Guri either an archive version of `/victoria/solstice-gas-shutdown-towns/` (same URL, past tense, keeping the exemptions only if Solar Victoria still offers them) or a 301 to `/victoria/bendigo/`.
   - A 301 uses `redirects.json` and the nginx include from prompt 17. Wiring the include into nginx is a **server change**: it needs a separate STOP with `nginx -t` shown before the reload, as in prompt 09.
   - Pages with `reviewBy` passed: update them, or ask Guri.
7. **UNVERIFIED list:** for each TODO in `docs/expansion-log.md`, record whether an official source now confirms it. Move a confirmed item to the map only through Venture Architect: Guri asks them to update `url-map.csv`, then re-run `import:urlmap`. Then add it to a page in a follow-up commit.
8. Rebuild, and run every check.

## Acceptance checks

```bash
cd site
node scripts/recheck-report.mjs        # expect: "recheck: <n> figures, <n> sources, 1 postcode table, 1 tool table, <n> reviewBy pages, <n> UNVERIFIED items → docs/recheck/<date>.md"
node scripts/check-sources.mjs         # expect: 0 failed; any CHALLENGE URLs checked by hand and noted in the report
grep -c '| *$' ../docs/recheck/<date>.md   # expect: 0 empty Status cells (every row has a status)
npm run build && node scripts/check-figures.mjs && node scripts/check-urlmap.mjs
# expect: 0 stale (except items deliberately left for Guri: listed in the STOP list), the same URL count as before (52 or 53)
git diff --stat src/content/figures/vic-veu.yaml   # expect: only checkedOn lines, unless Guri approved value changes
```

## What to test by hand

- Every changed figure: the page shows the new amount, the historical note where relevant, and the new checked-on date.
- Spot-check 5 unchanged figures on the live site against their sources after deploy.

## Report to Guri (paste into chat)

- the date run, and the number of items checked
- unchanged / changed / gone / blocked counts
- the STOP list
- any post-election announcements (not in force)
- the UNVERIFIED items now resolved
- the Solstice archive proposal
- the next re-check date (monthly, and no later than 45 days after today)

{{BLOCK:deploy-stop}}

Sitemap count: unchanged (52, or 53 if Shepparton was built), unless Guri approved a redirect or an archive.

## Done when

The report is complete, Guri has decided on every STOP item, the approved changes are built and deployed after his yes, and the next re-check is in the calendar. Commit `chore(recheck): post-election figure and rule re-check <date>`.

---

## 14 Nov 2026 addendum (from prompts 24 and 34; this overrides the steps above where they differ)

Added after the 74-URL pack and the business review. Guri reviews it like the rest of the prompt.

1. **Election notice (prompt 24).** As part of step 3 item 16 and step 5: (a) re-read the Energy Victoria caretaker banner and the gas, new-homes and rental rule sources; (b) set `site/src/data/rule-status.json` `electionWatch.status` to `rechecked-unchanged` or `rechecked-changed` **only after Guri's yes**; (c) if changed, put each affected sentence on the STOP list. The build fails on `rechecked-changed` until those pages are updated and their `ruleStatus` cleared. The 9 election-watch pages are in the register with `reviewBy: 2026-12-05`.
2. **postcodes.csv is the master list (prompt 34).** Step 3 item 2 no longer re-runs `extract-veu-postcodes.mjs` as a generator; it's now `scripts/crosscheck-veu-postcodes.mjs`, a cross-check only. Never regenerate `postcodes.csv`. If there's a new VEU Specifications version, **stop**: Guri asks Venture Architect for an updated CSV, then the cross-check runs against the new PDF.
3. **URL counts.** "52 or 53" throughout this prompt means "the number of enabled rows in `rollout.json`" (the map now has 74 rows; prompts 28–39 enable more).
4. **Also re-check:** the `basis: estimate` insulation figures (re-run the Part 48 method if v25.0 changed), every `councilPrograms` status (Hume paused; YEF-linked programs; Council Home Energy Program; GMCA Solar Savers; Boroondara Solar Savers ends 31 Dec 2026), the checker's rule sources and its 6 spec examples (`npx vitest run tests/checker`), and the federal battery figures (the STC factor change on 1 Jan 2027, if prompt 30 has run).
