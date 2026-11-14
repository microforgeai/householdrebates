# Prompt 27: Split up the shared FAQ library: each Q&A on one canonical page, 3–5 unique FAQs per page, overlap below 25%

> Local only, then a deploy STOP. Branch: `feat/review-27-faq-dedupe`.
> Run after prompt 26 (FAQ answers already support links). Best after prompt 34 too, so Geelong's insulation estimate is in the data file.
> Source: `docs/business-review-2026-11-14.md` §6 "Near-duplicates" and "Schema", §7 item 4, Appendix B (method). Map: `docs/url-map.md` (no new URLs; Melbourne's rescope is in prompt 39). Design: `docs/solution-design.md` §5.5 (`faqs`), §10.2 (`FAQPage` only where the Q&As are visible). Data: `docs/postcodes.csv` (read-only).

---

## Context

The review measured overlap with 6-word shingles after removing shingles found on more than 30% of pages (site-wide boilerplate). Results on the 14 Nov crawl: `/` vs `/faq/` **53%**; Frankston vs Melbourne 44%; Frankston vs Geelong 43%; Geelong vs Mornington Peninsula 41%; `/faq/` vs `/victoria/heat-pump-rebate/` 42%. The cause is the shared FAQ library: the same 5–6 Q&As ("Can I claim after installation?", "Why does the discount vary?", "Are rentals eligible?" and similar) repeat across about 25 pages, each with its own `FAQPage` markup. 48 of the 52 crawled pages carry `FAQPage`.

The review doesn't say which overlap formula it used. This prompt uses **Jaccard** (|A∩B| / |A∪B|) on the filtered shingle sets and also prints containment (|A∩B| / min(|A|,|B|)) for information. The target applies to Jaccard. If Guri or Venture Architect prefers containment, change one constant.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## Steps

1. **Schema** (`faqs` in `content.config.ts`, update design §5.5): replace `pages: string[]` with `canonicalPage: string` (one URL) plus optional `alsoLinkFrom: string[]`. A FAQ renders in full, and goes into `FAQPage`, only on its `canonicalPage`. On an `alsoLinkFrom` page it renders as a one-line link ("Can I claim after installation? →") to `canonicalPage#faq-<id>`, and it is **not** in that page's `FAQPage`.
2. **Assign canonicals.** Rules:
   - General VEU questions → `/faq/` (e.g. "Is this a government website?", "How do you make money?", "How often are the figures checked?").
   - Topic questions → their topic page: "Can I claim after installation?" → `/victoria/already-installed-retrospective-discount/`; "Why does the discount vary?" → `/victoria/what-is-a-veec/`; "Are rentals eligible?" → `/victoria/renters/`; "Do I have to pay something?" → `/victoria/veu-minimum-co-payment/`; "Will someone call me?" → `/victoria/veu-scams-cold-calls/`.
   - `/` keeps no copy of a `/faq/` Q&A; it links to `/faq/`. Home gets 3 questions of its own about the site's scope (which state, which programs, what the checker does).
   Put the full assignment table in the PR for Guri.
3. **Write unique FAQs.** Each page ends with 3–5 FAQs whose `canonicalPage` is that page. Build each question from the page's map row (secondary questions first) and answer only from the row's facts and the page's sources. No `$` in answers (link to the section that shows the figure). Location pages get local questions (council program, postcode classification, gas network status), not generic VEU ones.
4. **Local facts on the four original location pages** (`areaExtra.localFacts` min 5 for them; raise the schema min from 4 to 5 for every area page and fix any that fall short):
   - **Frankston:** from `postcodes.csv`, its 5 postcodes with localities and council share, all Metropolitan, mains gas, Mild, heat pump zone 4; plus the page's existing sourced council facts.
   - **Mornington Peninsula:** from `postcodes.csv`, its 25 postcodes (localities, council share; all Metropolitan, mains gas, Mild, zone 4); plus existing sourced facts.
   - **Geelong:** from `postcodes.csv`, its 14 Greater Geelong postcodes: Regional, Mild, zone 4, with **one postcode listed as having no reticulated gas** (name it from the CSV); Geelong Sustainability's Electric Homes Program 2026–27 (map, "Changes needed on existing pages", source GEELEHL); and the insulation estimate from prompt 34 (labelled "our estimate").
   - **Melbourne:** leave its local facts to prompt 39 (the inner-Melbourne rescope to 52 postcodes). Only remove its shared FAQs here.
   Table A classification facts count as local only when they differ from inner Melbourne or are listed per postcode (design §5.4 rule). If a page still has fewer than 5 sourced local facts, stop and log it for Venture Architect; don't pad.
5. **Overlap check** `site/scripts/check-overlap.mjs` (post-build): visible text of `<main>` per page, lower-cased, 6-word shingles; drop shingles on more than 30% of pages; Jaccard per pair. Fail if any pair is 25% or more. Print the top 10 pairs with Jaccard and containment. Allow-list file `site/scripts/overlap-allow.json` (start empty; every entry needs a reason and Guri's initials).
6. **FAQ check** (extend `check-schema` or add `check-faqs.mjs`): each FAQ id appears in exactly one page's `FAQPage`; every `FAQPage` question is visible on that page; every built page with a FAQ has 3–5 canonical FAQs; no `$` in any answer.
7. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run build && node scripts/check-overlap.mjs
# expect: "check-overlap: <n> pages, max Jaccard < 0.25 (pair …), 0 allow-listed"
node scripts/check-faqs.mjs     # expect: "check-faqs: <n> FAQs, each in exactly 1 FAQPage, 0 pages outside 3–5, 0 $ answers"
node scripts/check-schema.mjs && node scripts/check-text.mjs && node scripts/check-figures.mjs && node scripts/check-urlmap.mjs && node scripts/check-rule-status.mjs
# expect: all pass; URL count unchanged
node -e "const a=require('./dist/_overlap.json');console.log(a.find(p=>p.a==='/'&&p.b==='/faq/'))"   # expect: jaccard < 0.25 (was 0.53 by the review's method)
```

## What to test by hand

- Read the FAQ block on `/`, `/faq/`, Frankston, Geelong and Mornington Peninsula. No question repeats in full across them.
- Follow 5 "→" FAQ links: each lands on the right answer (`#faq-<id>`) and the answer is visible.
- Validate 3 pages' `FAQPage` with validator.schema.org.

## Open decisions for Guri

- Jaccard vs containment as the 25% metric (Jaccard by default).
- The canonical assignment table (PR).

{{BLOCK:deploy-stop}}

Sitemap count: unchanged.

## Done when

Every Q&A lives on one page, each page has 3–5 of its own, the four original area pages have at least 5 sourced local facts (Melbourne via prompt 39), overlap is below 25%, every check passes and Guri has said yes. Commit `refactor(review): one canonical page per FAQ, unique FAQs, overlap check (27)`.
