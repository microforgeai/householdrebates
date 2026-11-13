# Prompt 17: Wave 1a: the /victoria/ hub, site structure (internal links, sitemap, llms.txt, redirects) and 9 upgrade guides

> Local only. This adds 10 URLs (map rows 17–26): the hub plus 9 upgrade guides. The deploy STOP at the end needs Guri's yes. It's recommended to deploy Wave 1 after prompt 18, together.
> Run it after prompts 15 and 16. Branch: `feat/expansion-17-wave1a`.

---

## Context

Wave 1 is the money layer: a `/victoria/` hub, 9 "upgrade swap" guides and 9 question pages (19 URLs, map rows 17–35). This prompt builds the structure that all 37 new URLs rely on, then the hub and the 9 swap guides. Prompt 18 does the 9 question pages.

From the map:

- URL style stays flat (`/victoria/<slug>/`), so the existing `victoria/[slug].astro` route keeps working. `/victoria/` itself needs a new `victoria/index.astro`.
- The hub becomes the "Victoria" item in every breadcrumb. **Home (`/`) stays the national-facing pillar.** See the conflict below: the live home copy is Victoria-first, and this prompt doesn't rewrite it.
- Every page has at least 3 internal links (listed per row), a visible FAQ with FAQPage schema, `<Money>` figures with checked-on dates, and the IndependenceNotice. The CTA is always the eligibility checker. The quote form stays off.

Any map note that says "the checker has no insulation, induction or weather-sealing path" is out of date: prompt 16 added those paths.

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

### A. Structure (do this first)

1. **Schema** (`content.config.ts`; update design §5.4):
   - Add `navGroup` to `pageBase`: `hub | rebate-guides | upgrade-guides | question-pages | audience | tools | support-guides | areas | trust`.
   - Add `mapRow: z.number().int()`, which must equal the page's row in `src/data/url-map.json`.
   - Add an optional `reviewBy` date, for time-sensitive pages; it's listed in the monthly re-check report.
   - Set `navGroup` and `mapRow` on all 16 existing pages:
     - AC, heat pump, reverse-cycle, gas 2027 → `rebate-guides`
     - checker → `tools`
     - 4 areas → `areas`
     - root pages → `trust`
2. **Rollout control:** `site/src/data/rollout.json` holds `{ "enabledRows": "1-26", "gatedApproved": [] }`. Each later prompt widens it. Only enabled rows are built, listed in the sitemap, linked or listed in llms.txt. A content file whose row isn't enabled fails the build ("page not enabled in rollout.json").
3. **Components:**
   - `Breadcrumbs`: Home › Victoria › Page on every `/victoria/*` page. The hub shows Home › Victoria. Update the BreadcrumbList JSON-LD to match.
   - `RelatedLinks`: renders the row's `internalLinks` from `url-map.json` whose targets are enabled. Anchor text is the target page's H1, never "click here".
   - `HubIndex`: groups by `navGroup`, in the sitemap-tree order of `docs/url-map.md`. It shows only enabled, non-gated pages, and the checker card comes first.
4. **`site/scripts/check-urlmap.mjs`** (post-build; add it to the check chain) fails when any of these is wrong:
   1. The set of indexable built URLs ≠ the enabled map rows (minus gated rows not in `gatedApproved`). This blocks pages beyond the map, such as mass suburb pages.
   2. A page is missing a row link whose target is enabled (searched inside `<main>`).
   3. A page has fewer than 2 row links inside the body copy (`[data-body]`).
   4. An indexable page has fewer than 2 inbound links from other pages' `<main>`. The hub counts as one. Header and footer navigation don't count.
   5. Sitemap `<loc>` count ≠ the enabled indexable count.
   6. The llms.txt URL count ≠ the sitemap count.

   It prints: `check-urlmap: <n> URLs (expected <n>), 0 extra, 0 missing links, 0 orphans, sitemap <n>, llms <n>`.
5. **Inbound links the map doesn't give.** The map's rows leave `/victoria/electric-heater-to-reverse-cycle/`, `/victoria/already-installed-retrospective-discount/` and `/victoria/shepparton/` with no inbound row links. Add contextual links:
   - AC rebate page → electric heater guide
   - reverse-cycle timing page and the checker RETRO result → retrospective page (prompt 18)
   - `AreaLayout` "Other areas" list → every enabled area (covers Shepparton, prompt 22)
6. **Home** (`pages/home.mdx`): keep the answer and H1 as they are. Add a short "Victoria" section linking the hub and the upgrade guides through `HubIndex variant="compact" groups={["upgrade-guides"]}`. Prompt 18 adds `question-pages`.
7. **Existing guides → new guides:**
   - AC page → the four heating swap guides
   - heat pump page → the three hot water swap guides
   - reverse-cycle timing page ↔ gas room heater guide (both ways)
   - Geelong → ceiling insulation guide
8. **Sitemap:** `@astrojs/sitemap` `filter` uses the enabled rows. `lastmod` comes from `updatedOn`.
9. **llms.txt** (`build-llms.mjs`; update design §10.3): sections in this order:
   1. "Victoria hub"
   2. "Rebate guides"
   3. "Upgrade guides"
   4. "Questions"
   5. "Audience"
   6. "Tools"
   7. "How it works"
   8. "About and sources"
   9. "Optional" (areas)

   Support guides (`navGroup: support-guides`) are listed under "How it works", and areas under "Optional". Entries are built from the collection (title, URL, `description`), plus "Figures checked {date}" where the page has figures. Empty sections are omitted.
10. **Redirects (mechanism only):** `site/src/data/redirects.json` = `[]` (schema: `{ from, to, code: 301|410, reason, addedOn }`). A build check fails if `from` is a built URL or `to` isn't built. `scripts/build-redirects.mjs` writes `ops/nginx/householdrebates-redirects.conf` (`location = /from/ { return 301 /to/; }`). The map needs **no** redirects today. Don't change nginx in this prompt. Wiring the include into the server block is a server change with its own STOP, when the first redirect is needed (e.g. archiving the Solstice page; see prompt 23).
11. **Figures:** append 5 rows (source re-opened; stop on any difference):

    | id | group | scenario | qualifier | unit | min | max | source |
    |---|---|---|---|---|---|---|---|
    | `vic-gas-supply-saving` | `vic-electrify-savings` | Gas supply charges avoided once every gas appliance is removed, per year | about-range | AUD | 350 | 400 | energyvic-induction |
    | `vic-veu-insulation-cost-cut` | `vic-veu-insulation-household` | Expected cut to the installed cost | about-range | percent | 30 | 50 | energyvic-insulation |
    | `vic-veu-insulation-saving` | `vic-veu-insulation-household` | Bill saving per year | more-than | AUD | | 400 | energyvic-insulation |
    | `vic-homes-insulation-gap` | `vic-veu-insulation-household` | Victorian homes with no or too little ceiling insulation | almost | percent | | 60 | energyvic-insulation |
    | `vic-hp-electricity-reduction` | `vic-veu-hotwater-household` | Electricity use vs a standard electric storage system | up-to | percent | | 75 | energyvic-hot-water |

    Point `vic-rcac-saving-ducted-gas` and `vic-rcac-saving-room-gas` at their existing source again, and confirm $1,140 and $460 on the product page (not the 'Latest discounts' page).
12. **Checker links:** set `RESULT_LINKS.insulation.internal` and `RESULT_LINKS.induction.internal` once those guides are built.

### B. Pages (map rows 17–26)

Write each page from its row. Draft the title (60 characters or fewer, no `$`), H1, answer, sections for the secondary questions, a FAQ of 3–5 entries, sources (the row's sources only) and `figures`. Set `navGroup`: the hub → `hub`, and the 9 guides → `upgrade-guides`.

### Row 17: `/victoria/`

- **File:** `site/src/content/pages/victoria.mdx` (rendered by the new `site/src/pages/victoria/index.astro`)
- **Template (map):** Hub (state pillar; new GuideLayout variant 'hub')
- **Primary question (build the H1 and answer block on it):** What home energy rebates and discounts can I get in Victoria?
- **Secondary questions (a section or FAQ item each):** Which upgrades does VEU cover? · What changes in 2027? · Which page fits my situation?
- **Priority / intent:** P1 · Intent: Medium (navigational/informational). Needed as the breadcrumb target for every /victoria/ page.
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU product list: heating and cooling, hot water, induction cooktops, ceiling insulation (up to $1,500), dryers, glazing, weather sealing, showerheads, fridges, in-home displays, TVs <https://www.energy.vic.gov.au/victorian-energy-upgrades/products>
  - Gas hot water rule from 1 Mar 2027; all-electric new homes from 1 Jan 2027; rental standards phased from 1 Mar 2027 <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings>
  - Solar PV support moves into VEU from 1 Jul 2027 <https://www.solar.vic.gov.au/solar-support-continue-through-victorian-energy-upgrades-program>
- **Internal links (every one required; `check-urlmap` fails without them):** `/` · `/victoria/eligibility-checker/` · `every Wave 1–3 page (hub lists them by group)` · `/sources/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** No FAQ $ amounts (faqs schema bans them); figures via <Money>. Becomes the BreadcrumbList 'Victoria' item. Home (/) stays the national-facing pillar.
- **Figure ids:** `vic-veu-insulation-metro` (only if you mention insulation amounts). Otherwise the hub carries no amounts; it links to the guides.
- **Build:** `HubIndex` lists every built `/victoria/` page by `navGroup`, in the sitemap-tree order from `docs/url-map.md`, with the eligibility checker as the first card. Gated or unbuilt rows don't show.
- **Answer draft (adjust to the sources; 2–4 sentences):** Victorian households can get upfront VEU discounts on efficient products such as heat pump hot water, reverse-cycle heating and cooling, induction cooktops and ceiling insulation, through an accredited provider. Solar Victoria runs separate Solar Homes rebates, and new rules start in 2027 for gas hot water replacements, all-electric new homes and rental properties. This page links every Victorian guide on the site.

### Row 18: `/victoria/ducted-gas-to-ducted-reverse-cycle/`

- **File:** `site/src/content/guides/vic/ducted-gas-to-ducted-reverse-cycle.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** How much is the VEU discount to replace ducted gas heating with ducted reverse cycle in Victoria?
- **Secondary questions (a section or FAQ item each):** What size do I need (10/16/22.4 kW)? · What is the minimum I must pay? · Can renters do it? · How much will I save a year?
- **Priority / intent:** P1 · Intent: High (commercial, ready-to-quote)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Household ducted gas → ducted RCAC: up to $2,520 (10 kW), $4,200 (16 kW), $5,530 (22.4 kW) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Saves up to $1,140 a year on bills <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - NEW RULE: minimum customer co-payment for any ducted system is $3,000 incl GST from 30 Sep 2026 (was $1,000) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.energy.vic.gov.au/victorian-energy-upgrades/installers/industry-specifications>
  - Property must be > 2 years old when replacing a system; min 5-year warranty for homes; accredited provider or installer working with one <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Rental homes: broken heater after 1 Mar 2027 must be replaced with efficient RCAC in main living area <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/air-conditioner-rebate/` · `/victoria/ducted-gas-to-split-systems/` · `/victoria/veu-minimum-co-payment/` · `/victoria/reverse-cycle-vs-gas-heater/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Lead with the scenario table, never $5,530 alone (existing rule). Energy Vic's 'Latest discounts' page still says ducted savings up to $1,410/yr; the newer product page says $1,140. Use $1,140. Existing /victoria/air-conditioner-rebate/ must add the $3,000 co-payment.
- **Figure ids:** `vic-veu-rcac-ducted-gas-10kw`, `-16kw`, `-22kw` (show all three as a table; never $5,530 alone), `vic-rcac-saving-ducted-gas`, `vic-veu-copay-ducted`, `vic-veu-copay-ducted-until-sep-2026`.
- Don't use the 'Latest discounts' $1,410 saving. Use `vic-rcac-saving-ducted-gas` ($1,140).

### Row 19: `/victoria/ducted-gas-to-split-systems/`

- **File:** `site/src/content/guides/vic/ducted-gas-to-split-systems.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** Can I replace ducted gas heating with split systems or a multi-split and still get the VEU discount?
- **Secondary questions (a section or FAQ item each):** 4 splits vs one multi-split: which discount is bigger? · Is there a cap on multi-split size? · What do I pay at minimum?
- **Priority / intent:** P1 · Intent: High (commercial)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Ducted gas → 4 split systems (1×8 kW + 3×3 kW): up to $2,520; → multi-split (1×10 kW outdoor unit): up to $2,940 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - From 30 Sep 2026 multi-split co-payment: $1,000 if total rated cooling < 10 kW; $3,000 if ≥ 10 kW (incl GST); single non-ducted split < 10 kW: $200 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - v25.0 also revised multi-split incentive calculations from 30 Sep 2026 <https://www.energy.vic.gov.au/victorian-energy-upgrades/installers/industry-specifications>
  - All indoor units must be from the same manufacturer as the outdoor unit <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/gas-room-heater-to-split-system/` · `/victoria/veu-minimum-co-payment/` · `/victoria/air-conditioner-rebate/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Third-party trade sites say home multi-split incentives are now calculated on at most 20 kW: UNVERIFIED against the spec text; don't publish until checked in SPEC25 Part 6. Checker rule 'Ducted gas + splits' must show the new co-payment.
- **Figure ids:** `vic-veu-rcac-room-4splits-ducted-gas`, `vic-veu-rcac-room-multisplit-ducted-gas`, `vic-veu-copay-multisplit-10kw-plus`, `vic-veu-copay-multisplit-under-10kw`, `vic-veu-copay-split-under-10kw`.
- Say that v25.0 revised the multi-split calculations from 30 Sep 2026, and that the provider confirms the amount. **Don't** mention a 20 kW limit (TODO).

### Row 20: `/victoria/gas-room-heater-to-split-system/`

- **File:** `site/src/content/guides/vic/gas-room-heater-to-split-system.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** How much is the VEU discount to replace a gas wall/room heater with a split system?
- **Secondary questions (a section or FAQ item each):** Why is it a range ($630–$1,610)? · Do I need the old heater removed? · What if I don't remove anything?
- **Priority / intent:** P1 · Intent: High (commercial; the most common single-room job)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Non-ducted (room) gas heater → 3–9 kW RCAC: $630 to $1,610 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Saves up to $460 a year <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - No decommissioned product: $70 to $140 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Single split < 10 kW minimum co-payment $200 incl GST <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Ask for a home visit to size it; too large uses more energy; compare heating/cooling capacity and outdoor noise <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts/reverse-cycle-air-conditioner-buyers-guide>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/reverse-cycle-vs-gas-heater/` · `/victoria/air-conditioner-rebate/` · `/victoria/draught-proofing-rebate/` · `/victoria/renters/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Differentiate from /victoria/reverse-cycle-vs-gas-heater/ (that page = comparison/decision; this = the swap, steps and money). Cross-link both ways.
- **Figure ids:** `vic-veu-rcac-room-room-gas`, `vic-rcac-saving-room-gas`, `vic-veu-rcac-room-no-decommission`, `vic-veu-copay-split-under-10kw`.
- Cross-link both ways with `/victoria/reverse-cycle-vs-gas-heater/`: add the link from that page in this prompt.

### Row 21: `/victoria/electric-heater-to-reverse-cycle/`

- **File:** `site/src/content/guides/vic/electric-heater-to-reverse-cycle.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** Is there a VEU discount to replace electric heating with reverse cycle air conditioning?
- **Secondary questions (a section or FAQ item each):** Hard-wired panel heater vs central electric ducted? · Do portable heaters count?
- **Priority / intent:** P2 · Intent: Medium–High (commercial, smaller audience)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Hard-wired electric resistance room heater → 3–9 kW RCAC: up to $840 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Central electric resistance ducted heater → 10–22.4 kW ducted RCAC: up to $5,460 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>
  - Ducted co-payment $3,000 incl GST from 30 Sep 2026 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/air-conditioner-rebate/` · `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/veu-minimum-co-payment/` · `/victoria/gas-vs-heat-pump-running-costs/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Portable heaters: not listed as an eligible 'current system' on Energy Vic. Third-party claims that only one hard-wired heater per home counts: UNVERIFIED; leave out.
- **Figure ids:** `vic-veu-rcac-room-hardwired-electric`, `vic-veu-rcac-ducted-central-electric`, `vic-veu-copay-ducted`, `vic-veu-copay-split-under-10kw`.
- Inbound links: the map gives this page none. Add links to it from `/victoria/air-conditioner-rebate/` and the hub.

### Row 22: `/victoria/gas-hot-water-to-heat-pump/`

- **File:** `site/src/content/guides/vic/gas-hot-water-to-heat-pump.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** How much does it cost to replace gas hot water with a heat pump in Victoria after discounts?
- **Secondary questions (a section or FAQ item each):** Can I stack VEU + Solar Homes + STCs? · Does LPG count? · Will it work in winter? · What size tank?
- **Priority / intent:** P1 · Intent: High (commercial; the 2027 rule pushes this)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU: inefficient gas → heat pump $560 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Combined with Solar Homes hot water rebate: up to $1,560; up to $1,960 with an eligible locally made product (+$400) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Solar Homes rebate: up to $1,000 ($1,400 locally made), 50% of price, calculated after STCs and VEECs; owner-occupier, household income < $150,000, property < $3m, system ≥ 3 years old <https://www.solar.vic.gov.au/hot-water-rebate>
  - STCs: heat pump < 425 L and on the CER register <https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-renewable-energy-systems/solar-water-heaters-and-air-source-heat-pumps>
  - VEU Part 3 covers 'gas or LPG' water heaters <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Saves around $400 a year <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Must replace an existing system in a building ≥ 2 years old; 5-year warranty; $200 minimum contribution <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/heat-pump-rebate/` · `/victoria/gas-to-electric-hot-water-2027/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/veu-vs-solar-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Cannibalisation risk with /victoria/heat-pump-rebate/: keep that page as the 'rebate' hub and make this one the practical swap guide (steps, placement, noise, frost, stacking). The LPG discount amount isn't on Energy Vic's table; say 'provider confirms'. Use $560, never $630, for gas.
- **Figure ids:** `vic-veu-hw-gas-to-heatpump`, `vic-hw-veu-plus-solar-homes`, `vic-hw-veu-plus-solar-homes-local`, `vic-solar-homes-hw-rebate`, `vic-solar-homes-hw-rebate-local`, `vic-solar-homes-hw-share`, `vic-solar-homes-income-cap`, `vic-solar-homes-property-cap`, `vic-electrify-hw-saving`, `vic-veu-min-contribution`.
- LPG: one sentence. VEU covers gas or LPG water heaters, but Energy Victoria publishes only a mains gas figure, so the provider confirms. No LPG amount.
- Keep `/victoria/heat-pump-rebate/` as the rebate hub. This page is the practical swap guide: steps, placement, noise, frost, how the rebates stack. Link to it from the heat pump rebate page.

### Row 23: `/victoria/electric-hot-water-to-heat-pump/`

- **File:** `site/src/content/guides/vic/electric-hot-water-to-heat-pump.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** What is the rebate to replace an electric hot water system with a heat pump in Victoria?
- **Secondary questions (a section or FAQ item each):** How much less electricity does a heat pump use? · Is solar-boosted better? · Can I use my solar panels to run it?
- **Priority / intent:** P1 · Intent: High (commercial)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU: inefficient electric → heat pump $630; → solar-boosted $910 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Heat pumps use up to 75% less electricity than a standard electric storage system <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Solar Homes hot water rebate up to $1,000 / $1,400 locally made <https://www.solar.vic.gov.au/hot-water-rebate>
  - STCs for eligible heat pumps < 425 L <https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-renewable-energy-systems/solar-water-heaters-and-air-source-heat-pumps>
  - Many heat pumps have timers to use daytime solar; may need a larger tank <https://www.energy.vic.gov.au/__data/assets/pdf_file/0018/710280/VEU-water-heating-consumer-factsheet.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/heat-pump-rebate/` · `/victoria/solar-hot-water-rebate/` · `/victoria/heat-pump-hot-water-size-guide/` · `/victoria/veu-vs-solar-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Energy Vic's 'Latest discounts' page shows a combined 'up to $1,630 / $2,030', which is the electric→heat pump case ($630 + $1,000/$1,400). Only show it with that label, and only once the combination is confirmed on the hot water product page (that page shows the gas case: $1,560/$1,960).
- **Figure ids:** `vic-veu-hw-electric-to-heatpump`, `vic-veu-hw-electric-to-solar`, `vic-hp-electricity-reduction` (new, up to 75 percent), `vic-solar-homes-hw-rebate`, `vic-solar-homes-hw-rebate-local`.
- **Don't** show a combined electric → heat pump total (the $1,630 / $2,030 TODO). Show the VEU and Solar Homes amounts separately, with eligibility conditions.

### Row 24: `/victoria/solar-hot-water-rebate/`

- **File:** `site/src/content/guides/vic/solar-hot-water-rebate.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** What rebates are there for solar hot water, or to replace a broken solar hot water system, in Victoria?
- **Secondary questions (a section or FAQ item each):** My solar hot water no longer works: what can I replace it with? · Gas-boosted vs electric-boosted?
- **Priority / intent:** P2 · Intent: Medium (commercial, niche)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Solar-boosted replacing inefficient electric: $910; replacing inefficient gas: $700 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Broken, out-of-warranty solar systems (electric or gas-boosted) are listed as a system to replace with a heat pump or solar-boosted <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Some gas- and electric-boosted solar heaters count as 'inefficient' systems <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Locally made incentive list includes Dux electric-boosted solar models <https://www.solar.vic.gov.au/hot-water-rebate>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/heat-pump-rebate/` · `/victoria/electric-hot-water-to-heat-pump/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/veu-vs-solar-homes/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Rental standard accepts heat pump OR electric-boosted solar (source: <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/energy-efficiency-for-rental-properties-in-victoria>); link to the landlords page.
- **Figure ids:** `vic-veu-hw-electric-to-solar`, `vic-veu-hw-gas-to-solar`.
- Name Dux only as Solar Victoria does (the list of locally made products), with no endorsement. The link to `/victoria/landlords-rental-standards-2027/` goes in once that page exists (prompt 19); `RelatedLinks` adds it automatically.

### Row 25: `/victoria/gas-cooktop-to-induction/`

- **File:** `site/src/content/guides/vic/gas-cooktop-to-induction.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** Is there a rebate for switching from a gas cooktop to induction in Victoria?
- **Secondary questions (a section or FAQ item each):** Do I buy first and claim later? · Which cooktops qualify? · Can I disconnect gas completely?
- **Priority / intent:** P2 · Intent: Medium (commercial; low ticket, good for trust and AEO)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU: $140 per product (based on a $70 certificate price) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Process differs: check eligibility, buy the cooktop, then send the invoice to an accredited provider; installation can be arranged separately <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Must replace a current gas cooktop; home built ≥ 2 years ago; not previously claimed; built-in or freestanding (no portable); ≥ 550×380 mm; 3+ zones; 2-year warranty <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Removing all gas appliances could save about $350–$400 a year in gas supply charges <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Existing homes: no requirement to replace gas cooktops <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/get-off-gas-planner/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/what-is-a-veec/` · `/victoria/can-you-claim-veu-twice/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** The checker has no cooktop path today. Either add one (Indie Builder) or have the CTA say 'check your hot water and heating too'. The low lead value suits AEO more than leads.
- **Figure ids:** `vic-veu-induction`, `vic-veu-induction-cert-price-basis`, `vic-veu-copay-induction`, `vic-gas-supply-saving` (new).
- Explain the different process (buy first, then send the invoice to an accredited provider) as a numbered list. Use `HowTo` schema only if it's a genuine list of 3 or more steps.
- CTA: the checker now has a cooktop path (prompt 16), so link it directly.

### Row 26: `/victoria/ceiling-insulation-rebate/`

- **File:** `site/src/content/guides/vic/ceiling-insulation-rebate.mdx`
- **Template (map):** Guide – upgrade swap
- **Primary question (build the H1 and answer block on it):** How much is the VEU ceiling insulation discount in Victoria?
- **Secondary questions (a section or FAQ item each):** Is my home eligible (uninsulated / under R2.0)? · Why is regional higher? · What safety checks come first? · Do rentals need R5.0?
- **Priority / intent:** P1 · Intent: High (commercial; new activity Oct 2026, low competition likely, qualitative)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Up to $1,500 for an average 150 m² house in metro Melbourne (mild climate zone); up to $2,100 in regional Victoria (cold climate zone) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - Expected to cut install cost by around 30–50%; saves more than $400 a year; almost 60% of Victorian homes have none or too little <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - Eligible: uninsulated, or existing insulation below R2.0 (about 90 mm or lower than a joist) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - Electrical safety assessment by a licensed electrician plus an installer safety assessment before work; halogen downlights / unsafe wiring make a home ineligible until fixed <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>
  - Installers must be Energy Efficiency Council certified <https://www.solar.vic.gov.au/victorians-cut-energy-bills-ceiling-insulation-discounts>
  - Stage 2 opened to all eligible homes <https://www.solar.vic.gov.au/victorians-cut-energy-bills-ceiling-insulation-discounts>
  - Rentals: R5.0 where none is present, at a new lease from 1 Mar 2027 <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/energy-efficiency-for-rental-properties-in-victoria>
  - $200 minimum co-payment (activity 48) <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/landlords-rental-standards-2027/` · `/victoria/draught-proofing-rebate/` · `/victoria/ballarat/` · `/victoria/veu-minimum-co-payment/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** RULE CHANGE: new VEU activity, not in the current pack. Metro vs regional comes from the VEU postcode table (SPEC25 'Location Variable List'). Only 3 accredited providers listed on 13 Nov 2026 (source: <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts>). The checker has no insulation path.
- **Figure ids:** `vic-veu-insulation-metro`, `vic-veu-insulation-regional`, `vic-veu-insulation-cost-cut` (new), `vic-veu-insulation-saving` (new), `vic-homes-insulation-gap` (new), `vic-veu-copay-insulation`.
- Metro vs regional: say the VEU postcode table decides how a postcode is classed, and the provider confirms the amount. Point to the checker's postcode question. Don't print the provider count (3) unless you add a `count` figure for it; if you do, check it monthly.
- Safety section first: the electrical safety assessment, and halogen downlights or unsafe wiring make the home ineligible until fixed. Also add a link to this page from `/victoria/geelong/`.

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 53 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 26 URLs (expected 26), 0 extra, 0 missing links, 0 orphans, sitemap 26, llms 26"
grep -c '<loc>' dist/sitemap-0.xml                                   # expect: 26
ls dist/victoria/index.html                                          # expect: exists
grep -c '"@type":"BreadcrumbList"' dist/victoria/ducted-gas-to-ducted-reverse-cycle/index.html   # expect: 1
grep -o '"name":"Victoria"' dist/victoria/gas-cooktop-to-induction/index.html | wc -l          # expect: ≥ 1
grep -c 'data-figure="vic-veu-copay-ducted"' dist/victoria/ducted-gas-to-ducted-reverse-cycle/index.html   # expect: ≥ 1
grep -c '20 kW' dist/victoria/ducted-gas-to-split-systems/index.html                          # expect: 0
grep -RIl '1,410\|1,630\|2,030' dist --include=*.html | wc -l                                 # expect: 0
grep -RIl 'FAQPage' dist/victoria/*/index.html | wc -l                                         # expect: ≥ 9 (each new guide)
node scripts/check-answers.mjs && node scripts/check-copy.mjs && node scripts/check-schema.mjs && node scripts/check-seo.mjs && node scripts/check-links.mjs
# expect: each prints 0 errors
```

Negative tests (each must fail, then revert):

- Add `site/src/content/areas/vic/melton.mdx` → `check-urlmap` fails with "extra URL not in map".
- Remove the `/victoria/heat-pump-rebate/` link from the gas → heat pump guide → `check-urlmap` fails with "missing link".
- Set `enabledRows` to `1-25` → the build fails with "page not enabled in rollout.json" for the insulation guide.

## What to test by hand

- Read each guide against its row's sources, in the browser, with the source open alongside.
- Breadcrumbs and the hub on a phone at 200% zoom. Tab order through `HubIndex`.
- Paste `dist/llms.txt` into a Markdown viewer: the sections are in order and there are no empty sections.

## TODO: UNVERIFIED (kept off these pages; log it)

- The multi-split "at most 20 kW" calculation (row 19).
- The combined electric → heat pump total "$1,630 / $2,030" (row 23). Only show it once the hot water product page shows it.
- "Only one hard-wired heater per home counts" (row 21).
- The LPG hot water discount amount (row 22).
- The insulation provider count (3 on 13 Nov 2026): only through a `count` figure, re-checked monthly, or leave it out.

## Conflicts to log (don't resolve)

- **Home role:** the map says home "stays the national-facing pillar". The live home (prompt 05) is Victoria-first in its title, H1 and answer. This prompt only adds links. Guri decides whether home gets rewritten as a national pillar, and when.
- **Insulation metro/regional vs mild/cold:** see prompt 15.

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

Sitemap count after this prompt: **26**. (Recommended: run prompt 18 first and deploy Wave 1 together at 35.)

## Done when

26 URLs build with every check passing, the negative tests fail as designed, and Guri has read the 10 pages against their sources. Commit `feat(wave1a): /victoria/ hub, structure checks, 9 upgrade guides`.
