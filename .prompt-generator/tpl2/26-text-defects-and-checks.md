# Prompt 26: Fix visible text defects (raw paths, doubled words, self-links, long titles) and add build checks so they can't come back

> Local only, then a deploy STOP. Branch: `feat/review-26-text-defects`.
> Source: `docs/business-review-2026-11-14.md` §1.2 A6 and A7, §6 "Titles", "Meta descriptions" and "Raw paths", §7 item 3, Appendix A. Crawl: `docs/site-crawl-2026-11-14.json`. Map: `docs/url-map.md` (no new URLs). Design: `docs/solution-design.md` §5.4 (`title` max 60), §5.5 (FAQ answers), §10.1 (on-page).

---

## Context

The 14 Nov crawl found:

1. **Raw paths in visible text on 27 pages** (Appendix A of the review), e.g. "see our guide on /victoria/reverse-cycle-vs-gas-heater/", often pointing at the page itself. They come from the shared FAQ answers (`content/faqs/*.yaml`), which are plain strings. They look like scraped text to people and AI tools.
2. **Doubled words.** `/victoria/veu-minimum-co-payment/` reads "at least at least $3,000 (including GST) [source] including GST". The copy types "at least" and "including GST" around `<Money>`, which already renders both for a `minimum` figure with `gstIncluded`. The same "including GST … including GST" pattern shows on `/victoria/air-conditioner-rebate/` and `/victoria/ducted-gas-to-ducted-reverse-cycle/`.
3. **The checker links to itself.** The block "Not sure which scenario applies? Try our Victoria VEU Eligibility Checker first" is on `/victoria/eligibility-checker/` itself, plus `/`, `/victoria/air-conditioner-rebate/`, `/victoria/frankston/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/geelong/`, `/victoria/heat-pump-rebate/`, `/victoria/melbourne/` and `/victoria/mornington-peninsula/`. It's only wrong on the checker page. Appendix A also shows pages whose FAQ text names their own path (e.g. `/victoria/ducted-gas-to-split-systems/`).
4. **Titles.** 51 of 52 rendered `<title>`s are over 60 characters, because the layout appends " | Household Rebates" (20 characters) to a frontmatter title that's already up to 60. `/terms/` renders "Website Terms of Use | Household Rebates | Household Rebates" (the brand is in the frontmatter and again from the layout). The longest: `/victoria/can-you-claim-veu-twice/` (79), `/victoria/already-installed-retrospective-discount/` (78), `/victoria/renters/` (78), `/victoria/landlords-rental-standards-2027/` (78), `/victoria/gas-hot-water-broken-before-or-after-march-2027/` (77).
5. **Meta descriptions** weren't in the crawl, so the review couldn't assess them. Audit them here.

A false positive to avoid: the crawl's flattened text shows "Victoria Victoria" on many pages. That's the breadcrumb "Victoria" next to an H1 starting "Victoria", in separate elements. The doubled-word check must work on the text of one element at a time.

{{BLOCK:rules}}

## Steps

1. **FAQ answers with links.** Change `faqs.answer` to a restricted Markdown string: plain text plus `[anchor](/path/)` links only (no HTML, no images). Render it with the same sanitiser for the visible FAQ; in `FAQPage` JSON-LD, render the answer as plain text with the anchor text only (no URL). Rewrite every answer that contains a path: the path becomes a link whose anchor is the target page's H1 (or a short form of it). A link to the page the FAQ is shown on is dropped (the sentence is reworded).
2. **Remove the doubled wording.** Wherever MDX wraps a `minimum` figure in "at least" or a `gstIncluded` figure in "including GST", delete the typed words; `<Money>` already renders them. Then add a unit test: `formatFigure` output for a `minimum` + `gstIncluded` figure contains "at least" once and "including GST" once.
3. **No self-links.** The `CheckerCta` component (or whatever renders the "Not sure which scenario applies?" block) renders nothing when `Astro.url.pathname` equals the checker URL. Generalise it: `RelatedLinks`, `HubIndex` and any CTA skip the current page.
4. **Titles.** In `SeoHead`, the rendered `<title>` is `"{title} | Household Rebates"` when that's 60 characters or fewer, otherwise just `{title}`. Remove "Household Rebates" from any frontmatter `title` (fixes `/terms/`). Where a frontmatter title is over 55 characters, shorten it so the main search term sits in the first 55 characters (draft the new titles in a table in the PR for Guri; don't change H1s unless Guri asks).
5. **Descriptions.** Every `description` unique across the site and 70–155 characters (the review's 155, tighter than the 160 in design §5.4; update `pageBase` and the design note). No `$` amounts (unchanged rule).
6. **New post-build check** `site/scripts/check-text.mjs` (add to the chain). For every built HTML page, over the visible text of each block element inside `<main>` (not `href`, not `<code>`, not JSON-LD, not `<script>`):
   - **raw paths:** fail on `/(\/(victoria|about|faq|how-quotes-work|sources|privacy|terms|nsw|solar-battery)\/[a-z0-9\-\/#]*)/` in text nodes;
   - **doubled words:** fail on `/\b(\w+(?:\s+\w+){0,2})\s+\1\b/i` within one element (single words and phrases up to 3 words), with an allow-list file `site/scripts/text-allow.json` for genuine cases (start empty; every entry needs a reason);
   - **doubled qualifiers:** fail when "including GST" or "at least" appears twice within 120 characters in one element;
   - **self-links:** fail on any `<a href>` in `<main>` whose path equals the page's own path (fragments `#…` are allowed);
   - **placeholder tokens:** fail on `[[`, `]]`, double curly braces, `undefined`, `NaN`, `null` and `<<` in text nodes (the review found none; keep it that way).
   Print `check-text: <n> pages, 0 raw paths, 0 doubled words, 0 self-links, 0 tokens`.
7. **Extend `check-seo`:** rendered `<title>` ≤ 60 characters; brand at most once; descriptions unique and 70–155. Print the longest title and its length.
8. Rebuild and run every check.

## Acceptance checks

```bash
cd site
npm run check                 # expect: astro check 0 errors; vitest pass (incl. the at-least/GST test)
npm run build && node scripts/check-text.mjs
# expect: "check-text: <n> pages, 0 raw paths, 0 doubled words, 0 self-links, 0 tokens"
node scripts/check-seo.mjs     # expect: 0 titles over 60, 0 duplicate brands, 0 duplicate descriptions, longest title ≤ 60
grep -c 'at least at least' dist/victoria/veu-minimum-co-payment/index.html                       # expect: 0
grep -c 'href="/victoria/eligibility-checker/"' dist/victoria/eligibility-checker/index.html       # expect: 0 inside <main> (header/footer nav may link; check-text only reads <main>)
grep -o '<title>[^<]*</title>' dist/terms/index.html                                               # expect: one "Household Rebates"
node scripts/check-figures.mjs && node scripts/check-urlmap.mjs && node scripts/check-schema.mjs && node scripts/check-rule-status.mjs   # expect: pass
```

Negative tests (each must fail, then revert): type "/victoria/renters/" into one FAQ answer as plain text; type "at least" before a `minimum` `<Money>`; add a link to the page's own URL in its body; set a frontmatter title of 58 characters on a page whose rendered title would then be 78 (the check must pass, because the brand is dropped, and the title must be 58).

## What to test by hand

- Read every rewritten FAQ answer: the link text makes sense on its own.
- Check 5 pages in a screen reader: no path is read out.

## Open decisions for Guri

- The new titles table in the PR (wording only; no figures).

{{BLOCK:deploy-stop}}

Sitemap count: unchanged.

## Done when

All five defect types are gone, the checks stop them coming back, and Guri has approved the titles and the deploy. Commit `fix(review): visible text defects and text checks (26)`.
