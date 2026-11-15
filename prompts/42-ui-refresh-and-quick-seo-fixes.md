# Prompt 42 – Clean "Apple-style" UI refresh and quick SEO fixes (15 Nov 2026)

## Goal
Make householdrebates.com.au feel calm, modern and easy to use on a phone, without losing anything that makes it trustworthy or rank. Fix four quick SEO and ops gaps first.

Problems found in the 15 Nov review of the live site:
- `og-default.png` returns 404, so every share on WhatsApp, Facebook, LinkedIn and iMessage has no image.
- On a 375×812 phone, the independence notice and the nav (wrapping onto 4 rows) take about 60% of the first screen.
- The homepage is about 2,100 words and about **22 phone screens**: 94 links, 4 tables, 0 images, 0 icons. The hero opens with a 5-line paragraph.
- On the checker page, the first question sits about **2,100px down** on a phone.
- No dark mode. Desktop H1 is 38px. There are no visuals anywhere.
- HSTS is `max-age=86400` (1 day).
- Google has not indexed the site yet. Bing (which feeds ChatGPT search and Copilot) isn't set up.

"Apple-style" here means design principles, not copying Apple: clarity, generous white space, one main action per screen, big confident type, subtle depth, restraint. Keep the eucalyptus green identity.

## Rules
- Branch: new local branch `feat/ui-42-refresh` from current `main`. Don't push, merge or deploy. Don't touch the server, DNS or Hostinger.
- **No URL, title, meta description, canonical, H1 or JSON-LD type changes** on any of the 72 sitemap URLs. This is a visual and layout refresh, not an SEO rewrite. (Step A0 builds a guard for this.)
- **Independence notice wording is legally reviewed. Don't change a word.** It stays visible on every page without a click (not collapsed, not hidden behind a menu, not dismissible). You may change only its layout, padding and line breaks. If it can't fit the target below without a wording change, STOP and report to Guri.
- Figures only through the existing `<Money>` / `<MoneyPair>` / `HeroBlock` components and the figures collection, always with their label, scenario and "indicative, the provider confirms" wording (prompt 25). Never type a number. No `$` in titles, schema or FAQ answers. Nothing marked UNVERIFIED.
- Until the post-election re-check is done, the `RuleStatusNotice` election banner stays on **every page and section that shows a VEU, gas-rule or Solar Homes figure**. That includes the new homepage upgrade cards (legal review 15 Nov, finding #11). The independence notice stays above the fold on mobile (finding #19).
- `check-copy.mjs` banned phrases still apply (no "official", "government-approved", "free air con", "you qualify", "guaranteed"…). Don't use Victorian Government colours, crests or anything that looks like a government site.
- The quote form stays off. The alert sign-up flag (`PUBLIC_ALERTS_ENABLED`) stays as it is.
- CSP stays exactly as it is (`'self'` only). So: no web fonts, no CDNs, no icon libraries, no third-party scripts. System font stack only.
- No new runtime dependencies. Dev-only use of the existing Playwright is fine.
- JS: the island budgets in `check-bundles.mjs` stay. The menu and postcode form must work with **zero JS** (HTML forms, `<details>`, CSS). Any optional enhancement script must stay under 1 KB gzipped.
- Accessibility stays at least as good as now: WCAG 2.2 AA, 44px targets, visible focus, `prefers-reduced-motion` respected, axe clean.

---

## Part A – Quick fixes (one commit, do first)

**A0. SEO no-change guard.** Before touching any UI, add `scripts/snapshot-seo.mjs`. It builds the site, then for every URL in the built sitemap records title, meta description, canonical, robots, H1 text, `og:title`, and the sorted list of JSON-LD `@type`s, to `docs/design/p42/seo-before.json`. Add `check-seo-unchanged.mjs`, which compares a fresh build against that file and fails on any difference. The only allowed differences are `og:image` / `twitter:image`. Run it at the end of every part.

**A1. Share images.**
- Add `scripts/build-og.mjs` (run manually with `npm run og`, NOT in `build`). It uses Playwright to screenshot a local HTML template at 1200×630 and writes PNGs to `site/public/og/`: `default.png`, `guide.png`, `area.png`, `tool.png`, `business.png`. Commit the PNGs. Each must be under 200 KB.
- Design: brand name, a short neutral tagline per kind (for example "Victorian home energy upgrade guides"), and "Independent guide · Not a government website" in readable type. **No dollar figures and no dates in the images** (they would go stale).
- `Seo.astro`: take an optional `ogKind` prop (default `default`). Each layout passes its kind: business pages use `business`. Keep `og:image` absolute and add `og:image:width`, `og:image:height` and `og:image:alt`. Remove every reference to `/og-default.png`.
- Add a check (in `check-seo.mjs`) that every `og:image` in `dist/` points to a file that exists in `dist/`.

**A2. HSTS.** In `ops/nginx/householdrebates-headers.conf`, set `max-age=31536000`. Don't add `includeSubDomains` or `preload`. That's Guri's decision once mail and every subdomain are confirmed HTTPS-only (record it as an open decision). Don't apply it to the server.

**A3. Search engines and IndexNow.**
- Write `docs/launch/search-console-setup.md`. Cover: Google Search Console (Domain property via DNS TXT, submit `/sitemap-index.xml`), then Bing Webmaster Tools (import from GSC), and what to check after 7 and 28 days. These are Guri's steps; don't do them.
- Add IndexNow: a key file `site/public/<key>.txt` (random 32-hex key; it isn't a secret) and `ops/indexnow-ping.sh`, which posts the sitemap URLs to `https://api.indexnow.org/indexnow`. Hook it into `ops/deploy-site.sh` **only when `INDEXNOW=1` is set**, after the deploy check passes. Don't run it.

**A4. Analytics reality check (read-only).** `solution-design.md` §11 picks cookieless log analytics (GoAccess + `ops/ai-report.sh`, no client JS). Don't add a tracking script. From the repo alone, report whether `ops/` installs, schedules and rotates both. List the exact commands Guri would run on the VPS to confirm they work.

---

## Part B – Design tokens (`site/src/styles/tokens.css`)
- **Type scale:** add `--text-2xl` up to `--text-display` using `clamp()`. H1 is about 36px on phones and 56–60px on desktop. H2 is about 26 → 34px. Use tight letter-spacing on headings (`-0.02em` to `-0.03em`) and line-height around 1.1 for display text. Body stays at 17px or more, line-height 1.6.
- **Measure:** text columns max about 68ch.
- **Spacing:** add a section rhythm token (about 64px on phones, 96–120px on desktop) and use it between homepage sections.
- **Surfaces:** cards with radius 16–20px, a 1px hairline border and an optional very soft shadow (one level only). Buttons get radius 12px or pill. The primary button is solid accent; the secondary is tinted.
- **Colour:** keep the eucalyptus accent and warm-neutral canvas. You may lighten the canvas a touch. Every text pair passes 4.5:1 and every UI element passes 3:1. Record the ratios in a comment.
- **Dark mode:** add a full token set under `@media (prefers-color-scheme: dark)`, covering canvas, surfaces, text, accent, borders, the status colours, the notice bar and tables. Check contrast again. Don't add a theme toggle.

## Part C – Header, nav and independence notice
- **Notice:** same words, tighter. On desktop the two sentences sit on one row where they fit. Font stays at 13px or more. Target: **no more than 4 lines on a 375px phone**, down from about 6. It stays at the top of the page and is not sticky.
- **Header:** slim (about 56–64px) and sticky (`position: sticky`), with a light translucent background when the browser supports `backdrop-filter`, and a solid fallback. It holds the brand on the left and the "Check eligibility" pill on the right, always visible.
- **Mobile nav (under 768px):** a "Menu" button made from `<details>`/`<summary>` (no JS), with the existing links stacked as a full-width list with 48px rows. Keep `aria-current`. Esc to close and focus return are optional enhancements under the 1 KB limit.
- **Desktop nav:** the existing links inline. You may add "Business" (`/victoria/business-energy-upgrades/`) and "Areas" (`/victoria/postcode/`) if they fit. No mega-menu.
- **Target:** on 375×812, the H1 starts no lower than 300px from the top.

## Part D – New homepage (`HomeLayout.astro`)
Create `site/src/layouts/HomeLayout.astro` and use it in `src/pages/index.astro`. Restructure `content/pages/home.mdx` into these sections, in order:

1. **Hero.** The H1 stays exactly as it is now. Under it: one plain sentence (the existing answer sentence, kept for AEO through `AnswerText`). Then a **postcode form**: `<form method="get" action="/victoria/eligibility-checker/">` with a labelled `<input name="pc" inputmode="numeric" pattern="3[0-9]{3}" maxlength="4" autocomplete="postal-code">` and a "Check my postcode" button. The checker already reads `?pc=` (`CheckerApp.tsx`). Below it, a secondary text link: "Or browse upgrade guides ↓".
2. **Trust chips** (one row that wraps): "Figures checked {date from the data}" · "Sources shown, estimates labelled" · "Independent, not a government website" · "How we're paid →". Dates come from the data; never hard-code one. **Don't claim "every figure" comes from an official source.** Some figures are the site's own labelled estimates (legal review 15 Nov, finding #9).
3. **Upgrade cards grid** (2 columns on phones, 3–4 on desktop). Cards: split system / ducted heating, heat pump hot water, induction cooktop, ceiling insulation, draught proofing, solar panels, home battery, business upgrades. Each card has an icon, a short name, at most one labelled figure via the existing components (with scenario and "indicative" label) or no figure, and links to its guide. The whole card is clickable, with one link per card.
4. **How it works:** 3 numbered steps (check your scenario → talk to an accredited provider before any work → the discount comes off your quote). Keep the timing-rule warning (the existing caution Callout, restyled).
5. **2027 gas rule card:** short summary, `RuleStatusNotice`, link to the rule page.
6. **Find your area:** compact chips for the metro hubs and regional pages, plus "Search by postcode →" (`/victoria/postcode/`).
7. **FAQ:** keep only the existing home-specific FAQs, as `<details>`, with the full answer text in the HTML so FAQPage schema stays valid.
8. **Sources and checked dates**, then the existing footer.

- **Move, don't delete.** The 4 `FigureTable`s and the long hub link list leave the homepage. Before removing each table, confirm the same figure group is rendered on its guide page. If one isn't, add it there first. `HubIndex` moves to `/victoria/` (already the hub) if it isn't there already.
- **Targets:** main content 900 words or fewer. Page height at 375px is **8 screens (6,500px) or less**, down from about 17,800px. No horizontal scroll at 320px.
- `check-answers`, `check-faqs`, `check-overlap` and `check-seo-unchanged` must pass. If `check-overlap` drops because content moved, that's fine. If a check needs the old structure, adapt the check only when the rule it protects still holds, and explain why in the report.

**Icons:** add `site/src/components/icons/` with one inline-SVG component per icon. 24×24 viewBox, 1.75px stroke, `currentColor`, round caps, `aria-hidden="true"`, drawn in one consistent style. About 12 icons: split system, ducted, hot water, induction, insulation, draught, solar, battery, business, gas flame, map pin, check.

## Part E – Checker page: checker first
In `ToolLayout.astro`, when `slug === 'eligibility-checker'`, the order is: breadcrumbs → H1 → one-sentence `AnswerText` → **the checker** → byline → `HeroBlock` → body → FAQ → sources. Restyle the checker to match the new tokens: large radio cards with a 48px or taller hit area, a clear "Step X of 6" progress bar, a sticky "Next" button on phones. Logic doesn't change.
**Target:** on 375×812, the first checker question is fully visible without scrolling.
Apply the same "tool first" order to the postcode lookup, running-costs, size-guide and gas-planner pages.

## Part F – Guide, area and legal pages polish
- Restyle `AnswerBlock` / `HeroBlock` / `Callout` / `FigureTable` / `Toc` / `RelatedLinks` with the new tokens: cards, tables with a sticky first column on phones and horizontal scroll inside the table only, a sticky TOC on desktop and a collapsible TOC (`<details>`) on phones.
- **Mobile sticky bottom CTA** on guide and area pages under 768px: a slim bar with "Check your eligibility →" linking to the checker. Add body padding so it never covers content or the footer. Hide it on the checker page itself and on legal pages.
- FAQs become `<details>` everywhere, keeping the full text in the HTML.
- **Two original diagrams** as inline SVG, using only facts already in the data files, with an accessible `<title>` and a text alternative:
  (1) "How a VEU discount works" (you → accredited provider → certificates created → discount on your quote), on the homepage and `/victoria/what-is-a-veec/`;
  (2) "2027 gas hot water rule timeline", with dates from `rule-status.json`, on `/victoria/gas-to-electric-hot-water-2027/`. Both must work in light and dark mode.

---

## Acceptance
- `npm run build`, `npm run check`, Vitest and Playwright (including axe) all pass with flags off.
- `check-seo-unchanged` passes: titles, descriptions, canonicals, H1s and JSON-LD types are identical on all 72 URLs.
- Every `og:image` returns a real PNG from `dist/`. `grep -RIn "og-default" site/src` returns 0.
- Lighthouse mobile (local, against `dist/` via `scripts/serve-dist.mjs`) scores **at least 95 in all four categories** on `/`, `/victoria/eligibility-checker/`, `/victoria/air-conditioner-rebate/` and `/victoria/melbourne/`. Record the scores.
- New Playwright tests at 375×812:
  - homepage `scrollHeight` is 6,500 or less;
  - H1 top is 300px or less;
  - the independence notice is visible and its text equals the current text exactly;
  - the checker's first question is in the first viewport;
  - submitting postcode 3000 from the homepage lands on the checker with the postcode pre-filled;
  - the menu opens and closes with keyboard alone and with JS disabled;
  - no horizontal scroll at 320px;
  - dark-mode emulation passes axe contrast.
- Bundle budgets unchanged. No new runtime dependencies. CSP header unchanged.
- Before and after screenshots at 375×812 and 1280×800, in light and dark mode, for `/`, the checker, the AC guide, Melbourne and `/about/`, saved to `docs/design/p42/`.

## Report
Branch and commits (Part A separate). A table of each target above with the measured value before and after. Lighthouse scores. Anything you couldn't do and why. Open decisions for Guri: HSTS `includeSubDomains`/`preload`, GSC/Bing setup, `INDEXNOW=1` in deploys, the VPS analytics checks from A4.

**STOP when done.** Guri reviews the screenshots before anything is merged or deployed.
