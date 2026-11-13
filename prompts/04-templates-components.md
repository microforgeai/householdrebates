# Prompt 04 — Page templates, routing, figure components and SEO head

> Local only.

---

## Context

Household Rebates pages follow one anatomy: independence notice → breadcrumbs → one H1 → a 2–4 sentence **answer block** → byline with "figures checked on" → body → visible FAQ (if any) → lead form or "form closed" notice → sources → related links. Dollar figures only render through `<Money>` / `<FigureTable>` (each output element carries `data-figure`), which always show the checked-on date and official source. Schema is limited to Organization, WebSite, BreadcrumbList, FAQPage (only where the FAQ is visible) and HowTo (only on the how-quotes page); **no LocalBusiness, no dollar figures in schema**. Spec: `docs/solution-design.md` §4 and §10. Prompts 01–03 are done.

## Goal

Layouts, routes, figure/source components, SEO head + JSON-LD, and the build checks that enforce the anatomy.

## Steps

1. **Components** (`site/src/components/`):
   - `Money.astro` — props `id`, `variant='inline'|'block'`. Inline: `<span data-figure={id}>up to $5,530</span><sup><a href={source.url} rel="noopener" aria-label="Source: Energy Victoria, checked 13 Nov 2026">[src]</a></sup>`. Block adds a line under it: "Checked on 13 Nov 2026 · Energy Victoria ↗". Uses `lib/figures.ts`; throws on unknown id.
   - `FigureTable.astro` — prop `group`. `<table>` with `data-figure` on each amount cell, columns "What you're replacing → what you install" and "Indicative discount", caption: "Indicative household discounts. Checked on {date} against {publisher} ↗. Your accredited provider confirms the final amount in your quote." Wrap in a scroll container.
   - `CheckedOn.astro`, `SourceLink.astro`, `SourceList.astro` (`<section aria-labelledby="sources">` with publisher, title, link, "checked {date}", "page updated {date}" if known).
   - `AnswerBlock.astro` — `<div class="answer" data-answer>` slot; styled as a lead paragraph, not a box that looks like an ad.
   - `Byline.astro` — "By Gurinder Singh, Agenor · Figures checked on {checkedOn} against {publishers} · Updated {updatedOn}".
   - `Faq.astro` — renders `faqs` entries as `<details><summary>` pairs, `id="faq"`; returns the entries so the layout can emit FAQPage only when this component actually rendered.
   - `RelatedLinks.astro`, `FormClosedNotice.astro` (text in solution-design §7.6, with links to the two Energy Victoria product pages' accredited-provider lists), `LeadFormSlot.astro` (placeholder that renders `FormClosedNotice` until prompt 08 replaces it).
2. **SEO** (`site/src/components/seo/`):
   - `Seo.astro` — title, description, canonical (`new URL(canonicalPath, Astro.site)`, always trailing slash), robots (`noindex,follow` when `noindex`), Open Graph (`og:type=article` for guides, `website` for home), `og:image` default, `twitter:card=summary_large_image`, `<meta name="author" content="Gurinder Singh">`.
   - `site/src/lib/schema.ts` — builders: `organization()`, `website()`, `breadcrumbs(items)`, `faqPage(entries)`, `howTo(def)`, `graph(...nodes)`. Organization: `@id https://householdrebates.com.au/#publisher`, `name "Agenor Services Pty Ltd"`, `alternateName "Household Rebates"`, `url`, `logo`, `identifier { "@type": "PropertyValue", "propertyID": "ABN", "value": ABN }`, `sameAs ["https://agenorit.com.au"]`. WebSite: `@id …/#website`, `publisher {@id}`, `inLanguage en-AU`. **No** `LocalBusiness`, `Offer`, `PriceSpecification`, `Product`, `GovernmentService`, `AggregateRating`, `estimatedCost`.
   - `JsonLd.astro` — `<script type="application/ld+json" set:html={JSON.stringify(graph)} />`.
3. **Layouts** (`site/src/layouts/`): `GuideLayout.astro`, `AreaLayout.astro`, `ToolLayout.astro`, `LegalLayout.astro`, each composing `BaseLayout` with the anatomy above. Props come straight from the collection entry. FAQPage JSON-LD is added only when `entry.data.faq.length > 0` (and `Faq` renders those same entries). HowTo only when `entry.data.howTo` exists.
4. **Routes** (`site/src/pages/`):
   - `index.astro` → `pages/home.mdx` with `GuideLayout` variant `home`.
   - `victoria/[slug].astro` → `getStaticPaths` over `guides` and `areas` with `state === 'vic'`, plus the checker page (`pages/eligibility-checker.mdx`, `ToolLayout`). Generic enough to add `nsw/[slug].astro` later by state path from `data/states.ts`.
   - `[page].astro` → `pages` collection for `how-quotes-work`, `faq`, `about`, `privacy`, `sources`, `terms`.
   - `thanks.astro`, `form-error.astro`, `404.astro` → `noindex`.
   - `solar-battery/` → not created; the reserved collection stays empty and `SOLAR_SECTION_ENABLED` defaults to false.
5. **Sitemap**: in `astro.config.mjs` `sitemap({ filter: (p) => !/\/(thanks|form-error|styleguide)\//.test(p), serialize })` where `serialize` sets `lastmod` from a build-time map of path → `updatedOn`.
6. **Build checks** (`site/scripts/`):
   - `check-answers.mjs` — every indexable HTML page has exactly one `[data-answer]`, placed before the first `<h2>`, with 2–4 sentences (split on `. `/`? `/`! ` ignoring "e.g.", "approx."), and exactly one `<h1>`.
   - Extend `check-figures.mjs` to fail when a page's frontmatter `figures` list doesn't match the `data-figure` ids in its HTML.
   - `check-schema.mjs` — parse every JSON-LD block: allowed `@type`s only; FAQPage present only if the page has `#faq` with the same number of questions; no `$\d` anywhere.
   - Add all to `site` `postbuild`.
7. Seed **one** temporary test guide `guides/vic/sample-test.mdx` (with `noindex: true`) using `<Money>`, `<FigureTable group="vic-veu-hotwater-household">`, a 2-question FAQ and sources, to prove the pipeline. Delete it at the end of prompt 05.

## Acceptance checks

```bash
npm run build -w site
# expect: postbuild prints check-copy 0, check-answers OK (N pages), check-figures OK, check-schema OK
grep -o 'data-figure="[^"]*"' site/dist/victoria/sample-test/index.html | sort -u | wc -l   # expect: ≥ 5
grep -c '"@type":"FAQPage"' site/dist/victoria/sample-test/index.html   # expect: 1
grep -rl "LocalBusiness" site/dist | wc -l                         # expect: 0
grep -o '<link rel="canonical" href="[^"]*"' site/dist/victoria/sample-test/index.html
# expect: href="https://householdrebates.com.au/victoria/sample-test/"
grep -c 'noindex' site/dist/victoria/sample-test/index.html               # expect: 1
```

Negative tests (each must make the build fail, then revert): remove the answer block; give the answer 6 sentences; add a FAQ entry to frontmatter without rendering `<Faq>`; type `$999` straight into MDX.

## What to test

Paste the sample page's JSON-LD into https://validator.schema.org/ — no errors. Check the page with a screen reader rotor: one H1, sensible heading order, table caption read out.

## Done when

All checks pass and every negative test fails for the right reason. Commit `feat(site): templates, figure components, schema and build checks`.
