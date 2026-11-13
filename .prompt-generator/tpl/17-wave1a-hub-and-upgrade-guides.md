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

{{BLOCK:rules}}

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

{{PAGES:17-26}}

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

{{BLOCK:deploy-stop}}

Sitemap count after this prompt: **26**. (Recommended: run prompt 18 first and deploy Wave 1 together at 35.)

## Done when

26 URLs build with every check passing, the negative tests fail as designed, and Guri has read the 10 pages against their sources. Commit `feat(wave1a): /victoria/ hub, structure checks, 9 upgrade guides`.
