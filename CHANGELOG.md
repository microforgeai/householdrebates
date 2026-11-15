# Changelog

One entry per day of releases, newest first. Big releases also get a dated change record in [`docs/`](docs/). Prompt numbers refer to [`prompts/`](prompts/).

## How to add an entry

- Add a dated heading (or extend today's) with the release ID if it was deployed.
- One line per change, starting with a type: **Added**, **Changed**, **Fixed**, **Ops**, **Docs**. Reference the commit or prompt.
- Link the change record when there is one.

---

## 15 Nov 2026

**Live release:** `20261115-1824-9d28847` (earlier today: `20261115-1813-bf48a62`, `20261115-1706-74a98be`, `20261115-1649-5c0c3a3`). Full details: [change record, 15 Nov 2026](docs/change-record-2026-11-15.md).

- **Changed:** Unified the brand mark across `Header.astro` (`.site-brand__mark`) and all five Open Graph share images (`site/public/og/*.png`) to match the house mark in `favicon.svg` (alongside multi-size `favicon.ico` and `apple-touch-icon.png` in `9d28847`), and pruned merged local branches. (prompt 44)

- **Ops:** Added weekly cookieless GoAccess + AI log reporting (`ops/weekly-report.sh`, `ops/systemd/hr-report.service`, `ops/systemd/hr-report.timer`) writing IP-free (`--ignore-panel=HOSTS --anonymize-ip`) mode-`0750` HTML + text reports to `/var/lib/householdrebates/reports/<YYYY-Www>/` (`root:hr-reports`, 12-week retention), plus a `301` `/sitemap.xml` → `/sitemap-index.xml` redirect in `redirects.json` / `householdrebates-redirects.conf`. (prompt 43)
- **Changed:** Lazy-loaded checker result evaluation and view (`CheckerResult.tsx`), cutting `Checker+shared` initial JS from `15,278 B` to `8,198 B` gzipped (`7,162 B` headroom under the `15,360 B` cap). (prompt 43 B)
- **Changed:** Placed the single `VeuFlowDiagram` DOM node into the desktop homepage hero right column via CSS Grid (`>= 1024px`) while keeping it in "How it works" on phones, and updated desktop header short labels to `AC Rebate` and `Heat Pump Rebate`. (prompt 43 C)
- **Changed:** Clean "Apple-style" UI refresh. Fluid type scale, full dark mode, slim sticky header with a no-JS mobile menu, and a new homepage with a postcode-first hero, trust chips, upgrade cards with icons, and two diagrams. Tool-first layout on the checker and tool pages. FAQs as accordions, and a sticky mobile CTA on guide and area pages. The homepage on a phone went from 22 screens to 7.8. (prompt 42 B–F, `5c0c3a3`)
- **Fixed:** Missing share image (`og-default.png` 404), replaced with 5 per-section images. (prompt 42 A, `3e0fef6`)
- **Added:** `check-seo-unchanged` build guard: titles, descriptions, canonicals, H1s and schema types are locked for all 72 URLs. (`3e0fef6`)
- **Added:** IndexNow key and opt-in ping (`INDEXNOW=1 ./ops/deploy-site.sh`). 72 URLs submitted (HTTP 202). (`3e0fef6`)
- **Ops:** HSTS raised to 1 year, in the repo and on the server. (`3e0fef6`)
- **Ops:** Deploy and rollback scripts default to the `hostinger-vps` SSH alias. The API deploy passes its host to rollback. (`74a98be`)
- **Docs:** Search Console and Bing setup guide (`docs/launch/search-console-setup.md`). New root README, CHANGELOG, and the prompt-pack index moved to `prompts/README.md`.
- **Changed:** Legal review fixes #1–#28 (prompt 40, `48147b0`) and confirmed operator facts for the info-only release (prompt 41, `07764cc`).
- **Added:** North-west corridor, Macedon Ranges, Mitchell, Latrobe Valley, Mildura, metro hubs, inner-Melbourne rescope, internal links, areas footer, LPG homes page. (prompts 33, 37–39)
- **Ops:** nginx 1.24 http2 syntax, redirects snippet, deploy smoke-check fix, hardened `.gitignore`, project wiki home (`docs/README.md`).

## 14 Nov 2026

- **Added:** 74-URL pack import and corrections (prompt 34). Election notice and "currently legislated" wording (24). Labelled headline figures (25). Text checks (26). One canonical page per FAQ plus an overlap check (27).
- **Added:** Spec-driven eligibility checker engine and cascade UI (35a, 35b). Postcode lookup page (36). Business hub and 4 business pages (28).
- **Added:** Rule-change email alerts back end and sign-up, flags off (29a, 29b). Battery, solar and other-VEU program pages (30). Help in your language (31). Author/reviewer schema, author page hidden until a bio exists (32).

## 13 Nov 2026

- **Added:** Initial build: Astro site, content collections, eligibility checker, lead API (off), ops configs. Pages, upgrade guides, question pages, audience pages, tools, and location pages for Waves 1–3 (prompts 00–21).
- **Fixed:** 30 Sep 2026 co-payments, Solar Homes caps, reg 45E exemptions, sources (prompt 15).
