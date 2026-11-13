# Prompt 02 — Design system, base layout and the independence notice

> Local only. No VPS, DNS or live service.

---

## Context

Household Rebates is an **independent** guide run by Agenor Services Pty Ltd. The ESC's VEU lead-generation fact sheet says lead generators must not claim to work for the VEU program, the Essential Services Commission or the Victorian Government, and the brief says the site must not look like a government site. So the look is deliberately **not** the Victorian Government style (no navy-and-white palette, no crest or state logo, no "VIC" lock-up, no gov-style typeface). Repo from prompt 01. Full spec: `docs/solution-design.md` §4.

## Goal

Tokens, base CSS, `BaseLayout.astro`, `Header`, `Footer`, `IndependenceNotice`, `Breadcrumbs`, `Callout`, `Steps`, `Toc`, and a `/styleguide/` page (noindex, excluded from sitemap) that shows every component.

## Steps

1. `site/src/styles/tokens.css` — CSS custom properties:
   - Colour: `--bg #FBFAF7`, `--surface #FFFFFF`, `--text #1F2328`, `--muted #57606A`, `--accent #0F766E` (teal-green), `--accent-ink #FFFFFF`, `--warn-bg #FFF7E6`, `--warn-border #B26B00`, `--info-bg #EEF6F5`, `--border #D8DEE4`, `--focus #B45309`. Check every text/background pair is ≥ 4.5:1 (write the ratios as comments).
   - Spacing 4-pt scale `--s-1 … --s-10`; radius `--r-1 4px`, `--r-2 8px`; `--measure 70ch`.
   - Type: system stack `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`; fluid sizes with `clamp()`; base 1.0625rem, line-height 1.6.
2. `base.css` (reset, body, links underlined, `:focus-visible` 3 px outline using `--focus`, `.visually-hidden`, skip link, tables responsive with horizontal scroll wrapper) and `prose.css` (headings, lists, tables, blockquote).
3. `BaseLayout.astro` props: `title`, `description`, `canonicalPath`, `noindex?`, `breadcrumbs?`, `jsonLd?`. Renders `<html lang="en-AU">`, meta charset/viewport, `<meta name="release" content={import.meta.env.PUBLIC_RELEASE ?? 'dev'}>`, slot `head`, skip link → `#main`, `IndependenceNotice`, `Header`, `<main id="main">`, `Footer`. CSS imported from files only (no inline `<style>` or `<script>` — CSP in production forbids inline).
4. `IndependenceNotice.astro` — a thin bar on every page:
   "Independent guide run by Agenor Services Pty Ltd. Not a government website. Installers may pay us for enquiries — [how we're paid](/about/#how-we-are-paid)."
5. `Header.astro`: wordmark "Household Rebates" (text, no state emblem), nav: Air conditioning · Hot water · 2027 gas rule · Eligibility checker · How quotes work. Mobile menu with a `<details>` element (no JS).
6. `Footer.astro`: "© {year} Agenor Services Pty Ltd · ABN {ABN} · Melbourne", links: About, Sources, Privacy, Terms, FAQ; line: "Discounts are indicative. An accredited provider confirms eligibility and the final amount."; "Last site build: {date}".
7. `Breadcrumbs.astro` (`nav aria-label="Breadcrumb"`, `ol`), `Callout.astro` (`tone: info | warn`), `Steps.astro` (ordered list with numbers), `Toc.astro` (from headings prop).
8. `site/src/data/site.ts`: `{ name: 'Household Rebates', domain: 'householdrebates.com.au', url: 'https://householdrebates.com.au', publisher: { legalName: 'Agenor Services Pty Ltd', abn: '<<AGENOR_ABN>>', city: 'Melbourne' }, contactEmail: 'hello@householdrebates.com.au', privacyEmail: 'privacy@householdrebates.com.au', author: 'Gurinder Singh' }` — leave the ABN placeholder; prompt 12 fills it after Guri confirms.
9. `src/pages/styleguide.astro` with `noindex` and every component; exclude it in the sitemap `filter`.
10. `scripts/check-copy.mjs` (first version): scans `dist/**/*.html` text and fails on banned phrases (case-insensitive): `official site`, `government website` *unless* preceded by "not a", `approved by the victorian government`, `on behalf of the victorian government`, `veu partner`, `government partner`, `you will get`, `you qualify`, `guaranteed`, `free air con`, `free heat pump`, `claim now`. Print file + phrase. Add to `site` `check` after build (new script `postbuild`).

## Files created

`site/src/styles/{tokens,base,prose}.css`, `site/src/layouts/BaseLayout.astro`, `site/src/components/{Header,Footer,IndependenceNotice,Callout,Steps,Toc}.astro`, `site/src/components/seo/Breadcrumbs.astro`, `site/src/data/site.ts`, `site/src/pages/styleguide.astro`, `site/scripts/check-copy.mjs`.

## Acceptance checks

```bash
npm run build -w site                       # expect: exit 0
node site/scripts/check-copy.mjs            # expect: "check-copy: 0 problems"
grep -c "Not a government website" site/dist/index.html     # expect: 1
grep -c '<html lang="en-AU"' site/dist/index.html          # expect: 1
grep -RPl '<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)' site/dist --include=*.html | wc -l   # expect: 0 (no inline scripts, ever)
grep -RlE "<style" site/dist --include=*.html | wc -l      # expect: 0
grep -c "styleguide" site/dist/sitemap-0.xml || true       # expect: 0
npx lighthouse http://localhost:4321/ --only-categories=accessibility,best-practices --quiet --chrome-flags="--headless" --output=json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s).categories;console.log(r.accessibility.score,r['best-practices'].score)})"
# (run `npm run preview -w site` first) expect: both ≥ 0.95
```

## What to test

- Keyboard only: Tab reaches the skip link first, then the nav; focus ring always visible.
- 320 px wide and 200 % zoom: no horizontal page scroll (tables scroll inside their wrapper).
- Show Guri the styleguide page screenshot and confirm it doesn't read as a government site.

## STOP

Ask Guri to approve the look (screenshot of `/styleguide/` and the empty home page) before moving to prompt 03.
