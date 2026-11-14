# Prompt 25: A label and a kind on every headline figure (ACL s18), and answer-first heroes

> Local only, then a deploy STOP. High priority: run it straight after prompt 24 (and after 34 if that has already run).
> Branch: `feat/review-25-figure-labels`.
> Source: `docs/business-review-2026-11-14.md` §1.2 A2 and the "Hero numbers that need a caption" table, §4.4 item 3, §6 "Answer-first", §7 item 2. Design: `docs/solution-design.md` §4.2 (page anatomy, item 4), §4.3 (`Money` contract), §5.3 (figures). Map: `docs/url-map.md` (no new URLs).

---

## Context

Every guide shows one large figure under the answer (`<Money variant="block">`, with "Checked on … · publisher ↗" under it). It has no caption. A reader can easily take it as "what I'll get". Examples from the 14 Nov crawl:

- "$630 to $1,610" on 9 pages: only the room gas heater → one split system (3–9 kW) case.
- "$630" on the heat pump pages: electric → heat pump only. Most searchers have gas, and gas → heat pump is $560.
- "$200" on the co-payment page: a payment the customer **makes**, not a discount.
- "more than $750" on the upgrade-time page: a plumbing compliance-certificate threshold, not a saving.
- "17.5%": a concession rate. "$70": the certificate price Energy Victoria assumed. "$150,000": an income cap.

Under the ACL (s18, misleading or deceptive conduct), an unlabelled number that a reasonable reader would take as their rebate is a risk. The review found **no wrong figure**; this prompt only labels and re-orders them.

**How many pages: 35.** Venture Architect confirmed on 14 Nov 2026 that **35** pages have an uncaptioned hero figure, matching the crawl (`docs/site-crawl-2026-11-14.json`, listed below); the other 17 have none. (The review's earlier "44 of 52" is superseded.) The build check in step 4 still covers every page, including pages built later.

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

1. **Figures schema** (`content.config.ts`, update design §5.3): add a required `kind: z.enum(['discount', 'payment', 'threshold', 'rate', 'saving', 'count'])` to every figure. Classify all existing figures with this rule, then list the result in the PR for Guri:
   - VEU discounts, Solar Homes rebates, council rebates, top-ups → `discount`
   - minimum co-payments and contributions (`vic-veu-copay-*`, `vic-veu-min-contribution`) → `payment`
   - caps, limits and triggers (`vic-solar-homes-income-cap`, `vic-solar-homes-property-cap`, `vic-plumbing-cert-threshold`, any `-until-` historical cap) → `threshold`
   - percentages and unit prices (`vic-concession-*-rate`, `vic-veu-induction-cert-price-basis`, `vic-solar-homes-hw-share`) → `rate`
   - bill and supply-charge savings (`vic-rcac-saving-*`, `vic-gas-supply-saving`, `vic-electrify-*`, `vic-*-electric-saving`, `vic-veu-insulation-saving`) → `saving`
   - provider counts and rebate counts → `count`
   If a figure doesn't fit, stop and ask Guri. Don't change any amount.
2. **`Money` contract** (`site/src/components/Money.astro`, update design §4.3): `variant="block"` now requires a `label` prop (plain words, 3–12 words, no `$`, no digits except kW, m², L or a year). It renders, in this order: the label (as a visible caption, `<figcaption>` inside a `<figure>`), the kind tag, the amount, then "Checked on {date} · {publisher} ↗". Kind tags:

   | kind | Visible tag |
   |---|---|
   | discount | Indicative discount (the provider confirms) |
   | payment | Minimum you pay |
   | threshold | A limit, not money you receive |
   | rate | Rate |
   | saving | Estimated yearly saving |
   | count | Count |

   A new `MoneyPair` (`ids`, `labels`) renders two block figures side by side (stacked under 480 px) for the heat pump case. Inline `<Money>` is unchanged.
3. **Answer first.** On each page below, the first sentence of the `answer` names the scenario and the amount together, e.g. "Replacing a room gas heater with one split system: <Money id="vic-veu-rcac-room-room-gas" /> off, from Energy Victoria's table." The hero block repeats it with its label. `check-answers` still counts 2–4 sentences.
4. **Build check** (extend `check-figures.mjs`): fail when any `[data-money-block]` in built HTML has no `[data-money-label]`, an empty label, a label containing `$`, or no `data-kind`. Fail when a `payment`, `threshold` or `rate` figure is the **only** hero on a page and its label doesn't say what it is (the kind tag must be visible). Print `… 0 unlabelled heroes`.
5. **Page-by-page** (35 pages from the crawl). Use the figure id already on the page (`data-figure` in `dist/`); the id column is the expected one. If it differs, use the page's id and log it.

   | Page | Hero now | Hero after (label → id) | kind |
   |---|---|---|---|
   | `/`, `/victoria/air-conditioner-rebate/`, `/victoria/eligibility-checker/`, `/victoria/melbourne/`, `/victoria/geelong/`, `/victoria/frankston/`, `/victoria/gas-room-heater-to-split-system/`, `/victoria/reverse-cycle-vs-gas-heater/`, `/victoria/landlords-rental-standards-2027/` (9) | $630 to $1,610 | "Room gas heater → one split system (3–9 kW)" → `vic-veu-rcac-room-room-gas` | discount |
   | `/victoria/heat-pump-rebate/` | $630 | `MoneyPair`: "Mains gas → heat pump" → `vic-veu-hw-gas-to-heatpump`, and "Electric storage → heat pump" → `vic-veu-hw-electric-to-heatpump`. Gas first. | discount |
   | `/victoria/mornington-peninsula/` | $630 | Same `MoneyPair` as the heat pump page | discount |
   | `/victoria/electric-hot-water-to-heat-pump/` | $630 | "Electric storage → heat pump" → `vic-veu-hw-electric-to-heatpump` | discount |
   | `/victoria/veu-minimum-co-payment/` | $200 | "Minimum you pay: single split system under 10 kW" → the `vic-veu-copay-split-under-10kw` figure the page uses. The answer's first sentence states the $3,000 ducted minimum too (`vic-veu-copay-ducted`) | payment |
   | `/victoria/how-long-does-an-upgrade-take/` | more than $750 | **No money hero.** The review wants a timing figure, but there's no sourced timing figure in the data file, so don't invent one. Keep the answer text only. Move `vic-plumbing-cert-threshold` into the body with the label "Plumbing work value that needs a compliance certificate" | threshold (body) |
   | `/victoria/casey/` | up to $200 | "City of Casey DIY draught-proofing rebate (council, not VEU)" → `casey-diy-draught-rebate` (use the actual id) | discount |
   | `/victoria/bendigo/`, `/victoria/solstice-gas-shutdown-towns/` | $600 | "Solar Victoria top-up for Solstice customers who can't get the VEU hot water discount" → `vic-solstice-topup` | discount |
   | `/victoria/concession-card-holders/` | 17.5% | "Annual Electricity Concession rate (DFFH)" → `vic-concession-electricity-rate` | rate |
   | `/victoria/what-is-a-veec/` | $70 | "Certificate price Energy Victoria assumed for its induction example (not a discount)" → `vic-veu-induction-cert-price-basis` | rate |
   | `/victoria/veu-vs-solar-homes/` | $150,000 | "Solar Homes income cap (combined owners' taxable income)" → `vic-solar-homes-income-cap` | threshold |
   | `/victoria/new-homes-all-electric-2027/` | $70 to $140 | "Split system where no heater is removed" → `vic-veu-rcac-room-no-decommission` | discount |
   | `/victoria/apartments-and-units/` | up to $2,800 | "Solar for Apartments, per apartment" → `vic-solar-apartments-per-apartment` | discount |
   | `/victoria/ballarat/` | up to $2,100 | "Ceiling insulation, regional and cold-climate example (150 m²)" → `vic-veu-insulation-regional` | discount |
   | `/victoria/can-you-claim-veu-twice/` | up to $1,560 | "VEU plus Solar Homes on one hot water system (Energy Victoria's figure)" → `vic-hw-veu-plus-solar-homes`. Prompt 30 adds Solar Victoria's differing figure next to it | discount |
   | `/victoria/ceiling-insulation-rebate/` | up to $1,500 | `MoneyPair`: "Metro Melbourne, mild climate (150 m²)" → `vic-veu-insulation-metro`; "Regional, cold climate (150 m²)" → `vic-veu-insulation-regional` | discount |
   | `/victoria/draught-proofing-rebate/` | $700 | Weather sealing depends on home type (EVSEAL, updated 11 Nov 2026): apartment $70/$140, townhouse $280/$560, house $350/$700 at 2-/5-year warranty. Don't show $700 alone (spec RD-1). Hero = `MoneyPair` `vic-veu-sealing-house-2yr` / `vic-veu-sealing-house-5yr`, label "House example, 2-year / 5-year warranty products; apartments and townhouses get less (table below)", followed by the three-row table prompt 34 adds | discount |
   | `/victoria/ducted-gas-to-ducted-reverse-cycle/` | up to $2,520 | "Ducted gas → 10 kW ducted (smallest of three sizes)" → `vic-veu-rcac-ducted-gas-10kw`. The 3-size table follows directly | discount |
   | `/victoria/ducted-gas-to-split-systems/` | up to $2,520 | "Ducted gas → four split systems" → `vic-veu-rcac-room-4splits-ducted-gas` | discount |
   | `/victoria/electric-heater-to-reverse-cycle/` | up to $840 | "Hard-wired electric room heater → split system" → `vic-veu-rcac-room-hardwired-electric` | discount |
   | `/victoria/gas-cooktop-to-induction/` | $140 | "Gas cooktop → induction cooktop" → the household induction figure the page uses | discount |
   | `/victoria/gas-hot-water-to-heat-pump/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/get-off-gas-planner/` | $560 | "Mains gas → heat pump" → `vic-veu-hw-gas-to-heatpump` | discount |
   | `/victoria/gas-vs-heat-pump-running-costs/` | around $400 | "Yearly bill saving, gas → electric hot water (Energy Victoria estimate)" → the saving figure the page uses | saving |
   | `/victoria/solar-hot-water-rebate/` | $910 | `MoneyPair`: "Electric → solar-boosted" → `vic-veu-hw-electric-to-solar`; "Gas → solar-boosted" → `vic-veu-hw-gas-to-solar` | discount |

6. **Business figures** stay off household pages (design §5.3); this prompt adds none.
7. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run build && node scripts/check-figures.mjs
# expect: "check-figures: <n> figures, 0 stale, 0 raw amounts, 0 schema amounts, 0 unlabelled heroes, 0 figures without kind"
grep -L 'data-money-label' $(grep -l 'data-money-block' -r dist --include=index.html) | wc -l   # expect: 0
grep -o 'data-figure="vic-veu-hw-[a-z-]*"' dist/victoria/heat-pump-rebate/index.html | sort -u
# expect: both vic-veu-hw-gas-to-heatpump and vic-veu-hw-electric-to-heatpump
grep -c 'data-money-block' dist/victoria/how-long-does-an-upgrade-take/index.html   # expect: 0
grep -c 'Minimum you pay' dist/victoria/veu-minimum-co-payment/index.html          # expect: ≥ 1
node scripts/check-answers.mjs && node scripts/check-urlmap.mjs && node scripts/check-rule-status.mjs   # expect: pass; URL count unchanged
```

Negative tests (each must fail, then revert): remove the `label` from the Casey hero; put "$200" in a label; delete `kind` from one figure.

## What to test by hand

- Read the 35 heroes aloud. Would a reader take any of them as "what I'll get" when it isn't? If so, fix the label.
- 320 px: label, tag and amount stay together; the pair stacks.
- Screen reader: label, then tag, then amount, then the checked-on line.

## Open decisions for Guri

- The upgrade-time page has no hero figure after this. Is that acceptable, or should Venture Architect source a timing figure (for example from the retrospective-discount deadline) for the map row?

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

Sitemap count: unchanged.

## Done when

Every hero has a label and a kind, the heat pump page shows gas and electric side by side, the co-payment hero reads "Minimum you pay", the upgrade-time page has no money hero, every check passes, and Guri has said yes to the deploy. Commit `feat(review): label and kind on every headline figure (25)`.
