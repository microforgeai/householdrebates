# Prompt 24: Election and caretaker notice, and "currently legislated" wording on the 9 pages about the 2027 rules

> Local only, then a deploy STOP. **Time-critical:** this only helps if it's live before the Victorian state election on **Saturday 28 Nov 2026**. Run it first of the prompts 24+, as soon as Guri has read it.
> Run after prompt 21 (the 52 pages in the 14 Nov crawl exist). It doesn't need the 74-URL map import (prompt 34). Branch: `feat/review-24-election-notice`.
> Source: `docs/business-review-2026-11-14.md` (copy it into `docs/` from the planning folder), §1.2 A1, §4.4 item 5, §5 "Freshness", §7 item 1. Map: `docs/url-map.md` "Rule changes" item 9 and "Facts to re-check monthly (and right after the 28 Nov 2026 state election)". Design: `docs/solution-design.md` §13 (policy risk) and §4.2 (page anatomy).

---

## Context

The site states the 2027 rules (gas hot water replacement from 1 Mar 2027, all-electric new homes from 1 Jan 2027, rental minimum standards from 1 Mar 2027) as settled. The election on 28 Nov 2026 could change them. Energy Victoria's own pages carry this banner, which Venture Architect read on 14 Nov 2026:

> "The State election will be held on Saturday 28 November 2026. During the caretaker period (starting 6 pm on Tuesday 3 November 2026) content will only be added … in line with the caretaker conventions."

The review also cites an ABC policy tracker (4 Nov 2026) and Rewiring Australia reporting that some parties have pledged to repeal or roll back the gas rules. **Those are election promises, not facts for the site** (prompt 23, "Rules"). They don't go on any page, and no party is named. The notice is neutral: the rules are currently legislated, they could change, and we'll re-check them after the result.

**Open decision (Guri, before deploy):** the wording below is deliberately neutral and doesn't name parties or pledges. If Guri wants to mention the pledges, that's political content during an election period; ask the lawyer first (Victorian electoral-material authorisation rules may apply). The default is: don't mention them.

## Goal

1. A dated, neutral notice on the 9 pages below, driven by **one data value**.
2. Every "must"/"have to"/"banned"/"required" sentence about a 2027 rule on those pages carries "currently legislated".
3. A build check that keeps both true until prompt 23 clears them.
4. The re-verification task for 30 Nov–5 Dec 2026 logged and linked to prompt 23.

Pages (review §7 item 1; all exist in the map):

| Page | Map row | Why it's here |
|---|---|---|
| `/` | 1 | Home answer mentions the 2027 gas rule |
| `/victoria/` | 17 | Hub: "What changes in 2027?" |
| `/victoria/gas-to-electric-hot-water-2027/` | live (row 11) | The main 2027 page |
| `/victoria/new-homes-all-electric-2027/` | 39 | All-electric new homes from 1 Jan 2027 |
| `/victoria/gas-hot-water-broken-before-or-after-march-2027/` | 32 | Timing of the 1 Mar 2027 rule |
| `/victoria/gas-hot-water-ban-exemptions/` | 33 | Reg 45E exemptions |
| `/victoria/landlords-rental-standards-2027/` | 37 | Rental standards from 1 Mar 2027 |
| `/victoria/renters/` | 36 | Rental standards from 1 Mar 2027 |
| `/victoria/get-off-gas-planner/` | 43 | Planner steps that depend on the 2027 rule |

(Row numbers are `docs/url-map.csv` data rows. Check them against `src/data/url-map.json` before you set anything; if a number differs, use the JSON and log it.)

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

## Steps

1. **Data value** (`site/src/data/rule-status.json`, schema-checked with zod in `content.config.ts` or a small loader):

   ```json
   {
     "electionWatch": {
       "status": "pending",
       "electionDate": "2026-11-28",
       "caretakerFrom": "2026-11-03",
       "recheckFrom": "2026-11-30",
       "recheckBy": "2026-12-05",
       "sourceId": "energyvic-caretaker-banner",
       "checkedOn": "<the day Guri re-reads the banner>",
       "text": "Victorian election 28 Nov 2026. Official sites are in caretaker mode from 3 Nov. These rules are currently legislated; we'll re-check them after the result."
     }
   }
   ```

   - `status`: `pending | rechecked-unchanged | rechecked-changed`. Only prompt 23 moves it off `pending`, after Guri's yes.
   - Dates in the text are rendered from the date fields (en-AU, Australia/Melbourne), not typed twice. The text above is the review's acceptance wording; keep it word for word unless Guri changes it.
   - Add a source `energyvic-caretaker-banner` (`official: true`, `kind: department`, URL: the Energy Victoria heating and cooling discounts page, which carries the banner; `notes`: the banner text quoted above). Re-open the page and confirm the banner before you set `checkedOn`. If the banner has gone, stop and tell Guri.
   - The `checkedOn` here falls under the 45-day freshness rule like any figure.
2. **Component** `RuleStatusNotice` (`site/src/components/RuleStatusNotice.astro`): reads `rule-status.json`. Shown directly under the `AnswerBlock` and above the byline on pages with `ruleStatus: election-watch` in frontmatter. Plain text, `role="note"`, not colour-only, links "Energy Victoria" to the source. While `status` is `pending` it shows the text. For `rechecked-unchanged` it shows "Re-checked after the 28 Nov 2026 election on {date}: no change to these rules yet." for 30 days, then disappears. For `rechecked-changed` the build **fails** until each page's copy is updated (prompt 23 STOP list) and the page's `ruleStatus` is cleared.
3. **Schema:** add `ruleStatus: z.enum(['election-watch']).optional()` to `pageBase`. Set it on the 9 pages.
4. **Copy pass on the 9 pages.** For every sentence that states a 2027 rule as an obligation (must, have to, required, banned, can't, no longer allowed), add "currently legislated" (e.g. "Under the currently legislated rule, from 1 March 2027 …"). Don't change any figure, date or exemption. Don't add predictions. Answer blocks keep 2–4 sentences.
5. **Build check** `site/scripts/check-rule-status.mjs` (add it to the post-build chain). For each built page with `data-rule-status="election-watch"` on `<main>`:
   - the notice is present (`[data-rule-status-notice]`);
   - every sentence inside `[data-body]` and `[data-answer]` that matches `/\b(2027)\b/` **and** `/\b(must|have to|has to|required|banned|ban|can't|cannot|no longer allowed)\b/i` also matches `/currently legislated/i` (or sits in a sentence that does, if the regex splits a list);
   - a page that mentions "1 March 2027", "1 Mar 2027", "1 January 2027" or "1 Jul 2027" as a rule date but has no `ruleStatus` fails (so a new page can't slip through);
   - `status: rechecked-changed` with any page still flagged fails.
   Print: `check-rule-status: 9 pages, 0 missing notices, 0 unqualified 2027 obligations`.
6. **Log the re-check.** Append to `docs/expansion-log.md` under "Scheduled re-checks": "Post-election re-verification, 30 Nov–5 Dec 2026, prompt 23. Inputs: rule-status.json, the 9 election-watch pages." Add the 9 pages with `reviewBy: 2026-12-05`, so prompt 23's register lists them.
7. **Tie to prompt 23.** Prompt 23 (already written) must, as part of its step 3 item 16 and step 5: (a) re-read the Energy Victoria banner and the gas, new-homes and rental rule sources; (b) set `rule-status.json` `status` to `rechecked-unchanged` or `rechecked-changed` only after Guri's yes; (c) if changed, put each affected sentence on the STOP list. The addendum at the end of prompt 23 says the same thing. Don't run prompt 23 now.
8. `/sources/`: add the caretaker banner source to the list, with its checked-on date.
9. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run build && node scripts/check-rule-status.mjs
# expect: "check-rule-status: 9 pages, 0 missing notices, 0 unqualified 2027 obligations"
node scripts/check-figures.mjs && node scripts/check-urlmap.mjs && node scripts/check-copy.mjs && node scripts/check-answers.mjs
# expect: all pass; URL and sitemap counts unchanged (52, or 53 if Shepparton was released)
for p in index victoria/index victoria/gas-to-electric-hot-water-2027/index victoria/new-homes-all-electric-2027/index victoria/gas-hot-water-broken-before-or-after-march-2027/index victoria/gas-hot-water-ban-exemptions/index victoria/landlords-rental-standards-2027/index victoria/renters/index victoria/get-off-gas-planner/index; do
  grep -c 'data-rule-status-notice' dist/$p.html; done        # expect: 1 for each of the 9
grep -c 'data-rule-status-notice' dist/victoria/heat-pump-rebate/index.html   # expect: 0 (not an election-watch page)
grep -RIlw -i -E 'coalition|one nation|labor|greens|liberals?|nationals' dist | wc -l    # expect: 0 (no parties named)
```

Negative tests (each must fail as described, then revert):

- Delete "currently legislated" from one sentence on `/victoria/renters/` → `check-rule-status` names the page and the sentence.
- Remove `ruleStatus` from `/victoria/gas-hot-water-ban-exemptions/` → fails ("2027 rule date without ruleStatus").
- Set `status` to `rechecked-changed` → fails (pages still flagged).
- Set the banner source `checkedOn` to 46 days ago → `check-figures` (or `check-sources`) fails as stale.

## What to test by hand

- Read the notice on a phone at 320 px: it sits under the answer, it's readable and it doesn't push the answer below the fold.
- Read every changed sentence on the 9 pages. The meaning is unchanged apart from the qualifier.
- Screen reader: the notice is announced once, as a note.

## Open decisions for Guri

- Neutral wording (default) vs naming the repeal pledges (needs the lawyer).
- Whether the notice also goes on the 6 pages that mention 2027 in passing (heat pump, AC, Geelong, Melbourne, Frankston, Mornington Peninsula). The review lists only the 9; the build check will tell you if others state a 2027 obligation.

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

Sitemap count: unchanged (52, or 53 if Shepparton was released).

## Done when

The 9 pages show the notice and the qualified wording, every check passes, the re-check is logged for 30 Nov–5 Dec 2026, and Guri has said yes to the deploy before 28 Nov 2026. Commit `feat(review): election notice and currently-legislated wording (24)`.
