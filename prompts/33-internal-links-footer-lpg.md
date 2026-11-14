# Prompt 33: Internal links, the areas footer, and the missing pages: LPG homes (map row 74, Wave 4); corridor and Shepparton pointers

> Local only, then a deploy STOP. Branch: `feat/review-33-links`.
> **Run last of the review prompts**, after the area pages from prompts 37–39 exist (so the footer and link targets are real), and after prompt 34 (map import, council-program status check) and 36 (`/victoria/postcode/`, which the LPG page links).
> Source: `docs/business-review-2026-11-14.md` §1.2 A8–A9, §2 rows 3–4, §6 "Orphans and weak links", §7 item 10. Map: `docs/url-map.md` / `docs/url-map.csv` (Wave 3 incl. the 14 Nov expansion; "Dropped locations"; Wave 4 row 74). Data: `docs/postcodes.csv` (read-only).

---

## Context

From the 14 Nov crawl:

- No true orphans, but weakly linked pages (3 or fewer inbound links, counting home): `/victoria/already-installed-retrospective-discount/`, `/victoria/electric-heater-to-reverse-cycle/`, `/victoria/new-homes-all-electric-2027/`. Four or fewer: `/victoria/apartments-and-units/`, `/victoria/can-you-claim-veu-twice/`, `/victoria/gas-vs-heat-pump-running-costs/`, `/victoria/how-long-does-an-upgrade-take/`, `/victoria/solar-hot-water-rebate/`.
- The footer "Areas covered" lists only 4 of the 11 location pages.
- Missing pages the review names, and where they're handled:

  | Review item | Where |
  |---|---|
  | `/victoria/shepparton/` (in the map, not built) | Prompt 34 re-opens prompt 22's gate (Goulburn Murray Solar Savers confirmed via GMCA only; the council's own page is still unverified); release is Guri's decision |
  | Corridor pages: Sunbury/Hume, Diggers Rest/Melton, Gisborne/Macedon Ranges | The map has **one** corridor page, `/victoria/north-west-corridor/` (row 56), plus `/victoria/macedon-ranges/` (row 57). Built in prompts 37 and 38. No per-suburb pages (map rule) |
  | `/victoria/lpg-homes/` | This prompt (map row 74) |

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

## Steps

1. Row 74 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.
2. Enable it. `navGroup: audience`.
3. Build the page:

### Row 74: `/victoria/lpg-homes/`

- **File:** `site/src/content/guides/vic/lpg-homes.mdx`
- **Template (map):** Guide – audience
- **Primary question (build the H1 and answer block on it):** I use bottled LPG. Which Victorian energy discounts can I get, and does the 2027 gas rule affect me?
- **Secondary questions (a section or FAQ item each):** Can I get the VEU hot water discount replacing LPG? · Can I replace an LPG heater or cooktop? · Which postcodes have no mains gas? · Is LPG covered by the 1 March 2027 rule?
- **Priority / intent:** P2 · Intent: Medium (regional; AI answers)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - VEU Part 3 covers decommissioning a gas or LPG water heater <https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/overview-veu-activities> <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Energy Victoria publishes only a gas hot water figure; the LPG amount is set by the provider (the amount is UNVERIFIED) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Energy Victoria's non-ducted gas heater definition includes natural gas or LPG <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Induction discount: premises with a gas or LPG connection (Spec Part 46) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts> <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - From 1 Mar 2027 reg 45E bans installing or like-for-like replacing a reticulated gas water heater connected to reticulated gas in existing Class 1/2 homes; a bottled-LPG water heater is not connected to reticulated gas, so it is outside the rule (piped estate LPG networks: provider/plumber confirms) <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - 313 of the 719 VEU Table A postcodes have no reticulated gas (postcodes.csv) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/victoria/postcode/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/gas-cooktop-to-induction/` · `/victoria/gas-room-heater-to-split-system/` · `/victoria/macedon-ranges/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** No LPG dollar figure (UNVERIFIED). LPG running costs: only with a cited source; otherwise leave them off. The checker LPG prompt (GAS-NO) links here. Reg 45E text re-read 14 Nov 2026 via search snippet of the AustLII page (direct fetch blocked by Cloudflare).

   - **The 2027 gas hot water rule (reg 45E) and LPG.** Word it exactly as the row: from 1 Mar 2027, reg 45E applies only to a gas water heater **connected to reticulated (mains) gas** in an existing Class 1 or 2 home. A bottled-LPG water heater isn't connected to reticulated gas, so it's outside the rule ("currently legislated", rule 15; `ruleStatus: election-watch`). **Piped-LPG estates** (an LPG network piped to the street) get a separate note: "If your estate has piped LPG, your plumber confirms whether the rule applies to your water heater." Don't state either way that piped LPG is covered or exempt. Cite the AustLII reg 45E page (the row notes the direct fetch is blocked by Cloudflare; re-open it in a browser before writing).
   - The off-gas postcode count comes from `postcodes.csv` at build time (`reticulated_gas = No`), rendered as a `count` figure with Table A as the source. Don't type the number.
   - The page links `/victoria/postcode/` ("Check whether your postcode has mains gas") rather than listing 313 postcodes.
   - LPG running costs: only with a cited official source. None is in the pack, so leave them out and log a TODO.
   - The checker's GAS-NO prompt (spec §5.2, "Did you mean LPG?") links here (prompt 35 wiring; add the link now if 35 has run).
4. **Footer "Areas covered"**: generated from enabled area pages and hubs (`navGroup: areas`), grouped "Melbourne hubs", "Regional", "Corridors and councils". No hard-coded list.
5. **Contextual inbound links: at least 6 per guide.** Change `check-urlmap` rule 4: pages with `navGroup` in `rebate-guides | upgrade-guides | question-pages | audience | support-guides | business` need ≥ 6 inbound links from other pages' `<main>` (header and footer don't count; the hub counts once). Areas, tools and trust pages keep ≥ 2. Add links where they help the reader, in body copy, with H1 anchor text. Start with the 8 weak pages above. Suggested sources (use them only where the sentence is genuinely about the target):
   - retrospective discount ← heat pump, AC, induction, scams, how-quotes-work, checker results (G-RETRO footer)
   - electric heater → RCAC ← AC, reverse-cycle timing, renters, landlords, concession, running costs
   - new homes 2027 ← checker N-AGE, corridor, Mitchell, melbourne-west, solar page (under construction), Wyndham
   - apartments ← renters, landlords, business LED lighting (common areas), solar page, draught proofing, insulation (I-APT note)
   - can-you-claim-veu-twice ← heat pump, gas → heat pump, electric → heat pump, solar hot water, veu-vs-solar-homes, checker N-SH-DUP
   - running costs ← heat pump, gas 2027, get-off-gas planner, concession, size guide, Midday Power Saver sections
   - upgrade time ← how-quotes-work, find-an-accredited-provider, gas broken before/after March 2027, heat pump, AC, retrospective
   - solar hot water ← heat pump, gas → heat pump, electric → heat pump, Solstice towns, Mildura, other VEU discounts
6. **Council programs:** every area page's council program goes through the `councilPrograms` status model from prompt 34 (status + `statusCheckedOn`). Nothing is shown as open without a date-stamped check (review A8: Hume paused, Darebin paused, Macedon Ranges bulk buy closed to enquiries on 31 Oct with installs ending 30 Nov 2026, Yarra Energy Foundation in administration).
7. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run build
node scripts/check-urlmap.mjs
# expect: "… 0 extra, 0 missing links, 0 orphans, 0 guides under 6 inbound"; URL count = previous + 1
node -e "const r=require('./dist/_inbound.json');for(const u of ['/victoria/already-installed-retrospective-discount/','/victoria/electric-heater-to-reverse-cycle/','/victoria/new-homes-all-electric-2027/'])console.log(u,r[u])"   # expect: ≥ 6 each
grep -o 'href="/victoria/[a-z-]*/"' dist/index.html | sort -u | wc -l      # footer: every enabled area page appears
node scripts/check-council-status.mjs && node scripts/check-text.mjs && node scripts/check-overlap.mjs && node scripts/check-figures.mjs   # expect: pass
grep -ci 'plumber confirms' dist/victoria/lpg-homes/index.html     # expect: ≥ 1 (piped-LPG note)
grep -ci 'reticulated' dist/victoria/lpg-homes/index.html           # expect: ≥ 1 (reg 45E scope)
node scripts/check-rule-status.mjs                                   # expect: lpg-homes is election-watch
```

## What to test by hand

- Read 5 of the new contextual links in context: each one is useful at that point in the text.

## TODO (log it)

- LPG running costs vs heat pump: needs a cited source (none in the pack).

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

Sitemap count: the previous count + 1.

## Done when

The LPG page is live in the map and built, the footer lists every area, every guide has at least 6 contextual inbound links, no council program shows as open without a dated check, every check passes, and Guri has said yes. Commit `feat(review): internal links, areas footer, LPG page (33)`.
