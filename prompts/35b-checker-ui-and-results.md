# Prompt 35b: Checker UI for the spec cascade, the result screen and deploy

> Local first, then a deploy STOP. Branch: `feat/checker-v2-ui` (on top of 35a).
> **Run order:** right after 35a.
> References: `docs/eligibility-checker-spec.md` §3 (tree), §4 (fields), §6 (messages), §7 (CTAs); `docs/url-map.md` row 15 `/victoria/eligibility-checker/` (live; keep its URL, title rules and inbound links) and the link targets in rows 54–64; `docs/solution-design.md` §6.

---

## Goal

Swap the checker's question flow and result screen for the spec's cascade on the **same URL**: Step 1 Residential or Business, then postcode (with the "Your area" card), then each path's own fields. The result screen shows Likely / Possibly / Not eligible lines with figures from the data file, the global modifiers, sources, and the CTAs in spec §7. The quote form stays off.

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

1. **Island:** the checker is one Preact island using `evaluate()` from 35a. One field group per screen, as spec §4 orders them; Back keeps answers (sessionStorage only; cleared by "Start again"). Progress shows "Step n of m" for the current path.
2. **Postcode data:** don't bundle `postcodes.json` in the island. Emit a compact `/data/postcodes.v{hash}.json` at build (only the columns the card and rules need) and fetch it once after Step 1. Island JS budget stays under 15 KB gzipped (design §11); the data file has no budget but log its gzipped size.
3. **"Your area" card** (after a valid postcode): localities (first 3, "+n more"), primary LGA with its share and other LGAs, VEU area, mains gas yes/no, climate region, heat pump zone; "From VEU Specifications v25.0 Table A" + checked date. Link: "More about {area}" per 35a `links.ts`.
4. **Fields:** labels, options and "Not sure" exactly as spec §4. Multi-selects (R6, B6) are checkbox groups. All fields keyboard-operable with fieldset/legend, errors in text, `aria-live` for the result.
5. **Result screen:**
   - Line order: VEU, then Solar Homes (state), then **FEDERAL** (label on screen), then Not eligible lines with the §6 message and link.
   - Each line: status chip (Likely / Possibly / Not eligible / Info), the upgrade, the figure(s) via `<Money>` with labels (prompt 25), the co-payment where one applies, one-sentence why, "Source ↗ · Checked {date}".
   - Global modifiers render as notes at the top (G-AREA, G-RENT, G-OC, G-NOTSURE) or the footer (G-RETRO, G-SCAM, G-SCHED).
   - Estimates (insulation) render with "(our estimate)" and the method text in a disclosure.
   - Election notice (prompt 24) at the top of the result while `rule-status.json` says pending.
   - CTAs exactly per spec §7. The **Business** path's primary CTA goes to `/victoria/business-energy-upgrades/` once row 55 is enabled (prompt 28); until then it goes to `/victoria/veu-minimum-co-payment/` plus the Energy Victoria business page (external). No link to `/get-quotes/`.
   - Tenant: "Share this result with your landlord" copies a URL with the answers in the hash (`#a=` base64 JSON); nothing is sent or stored on a server. Opening that URL restores the result.
   - Print view.
6. **Static page around the island:** update the page copy (answer-first opening, how it works, what we don't do) so it describes the new cascade, including that businesses are covered. Update its FAQ (with `canonicalPage` per prompt 27) and its HowTo schema steps (no `$`). Title and description per rule 16.
7. **No-JS fallback:** the page's static content lists the upgrade guides and `/victoria/postcode/` (row 54) when enabled.
8. **Playwright (`tests/e2e/checker.spec.ts`):** drive all 6 spec examples through the real UI and assert the rendered lines and links match 35a's fixtures (examples 1 and 5 by screenshot as well). Plus: X1 on 2000, Back keeps answers, "Start again" clears, keyboard-only run of example 1, axe 0 serious issues, share link restores a result.

## Acceptance checks

```bash
cd site
npm run check && npx vitest run && npm run build
node scripts/check-urlmap.mjs && node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs
npx playwright test tests/e2e/checker.spec.ts     # expect: all pass, 6/6 spec examples
gzip -c dist/_astro/Checker*.js | wc -c            # expect: < 15360
grep -c 'get-quotes' dist/victoria/eligibility-checker/index.html   # expect: 0
grep -o '"@type":"[A-Za-z]*"' dist/victoria/eligibility-checker/index.html | sort -u   # expect: allowed types only
```

## What to test by hand

- Guri runs example 1 with his own answers on a phone (375 px) and reads the result.
- One business run (example 5) and one tenant run with the share link opened in a private window.

## Open decisions for Guri

- Tenant share link: answers in the URL hash (default, nothing stored) or drop the share feature.
- Whether the checker shows Business at all before prompt 28's hub is live (default: yes, with the interim CTA in step 5).

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

Sitemap count: unchanged (the checker URL already exists).

## Done when

The new checker is live after Guri's yes, the 6 examples pass in Vitest and Playwright, and the quote form is still off. Commit `feat(checker): spec cascade UI and result screen (35b)`.
