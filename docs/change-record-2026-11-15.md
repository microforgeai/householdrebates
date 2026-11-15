# Change record: UI refresh, SEO fixes and deployment (15 Nov 2026)

**Site:** householdrebates.com.au · **Publisher:** Agenor Services Pty Ltd
**Period:** 15 Nov 2026, about 14:00–17:10 Melbourne time
**Who did what:**
- Claude (Claude Code) did the review, wrote prompt 42, checked Antigravity's work independently, and made the deploy-host script change.
- Antigravity built prompt 42 and ran the production deploys.
- Guri approved each merge, push and deploy.

**Live release at the end of the day:** `20261115-1706-74a98be`

---

## 1. Summary

| Area | Before (15 Nov morning) | After (15 Nov evening) |
|---|---|---|
| Homepage on a phone | About 22 screens, 2,076 words, 4 tables, no images or icons | 7.8 screens, 719 words, postcode box in the hero, upgrade cards with icons |
| Eligibility checker on a phone | First question about 2,066px down the page | First question fully visible on the first screen (471–784px) |
| Header and notice on a phone | 52% of the first screen | 17.4% of the first screen; notice wording unchanged |
| Dark mode | None | Full light and dark token sets, WCAG 2.2 AA |
| Share image (`og:image`) | `/og-default.png` returned 404 on every page | 5 share images (default, guide, area, tool, business) |
| HSTS | `max-age=86400` (1 day) | `max-age=31536000` (1 year), live on the server |
| Search engine notification | None | IndexNow key live; 72 URLs submitted (HTTP 202) |
| SEO fields (title, description, canonical, H1, schema types) | Baseline | **Unchanged on all 72 URLs**, enforced by a new build check |
| Deploy scripts | Defaulted to `deploy@72.61.117.132` (password prompt / denied) | Default to the `hostinger-vps` SSH alias; unattended deploys work |

---

## 2. Timeline

| Time (AEDT) | Event | Ref |
|---|---|---|
| ~14:00 | UI, SEO, GEO and AEO review of the live site and code (read-only) | Section 3 |
| 15:16 | Prompt 42 written and committed | `b791363` |
| 15:29 | Antigravity: Part A quick fixes | `3e0fef6` |
| 16:24 | Antigravity: Parts B–F UI refresh | `5c0c3a3` |
| ~16:30 | Claude checks the branch independently (build, checks, tests, SEO baseline, screenshots) | Section 6 |
| ~16:35 | `feat/ui-42-refresh` fast-forwarded into `main` and pushed | `b791363..5c0c3a3` |
| 16:38 | First deploy attempt stopped at the SSH password prompt (wrong default host); nothing changed on the server | — |
| 16:49 | Deployed with `VPS_HOST=hostinger-vps` | Release `20261115-1649-5c0c3a3` |
| ~16:55 | HSTS snippet updated on the server, `nginx -t` passed, nginx reloaded | Section 7.2 |
| 17:04 | Deploy scripts default to `hostinger-vps`; docs updated | `74a98be` |
| 17:06 | Deployed with `INDEXNOW=1`; IndexNow returned HTTP 202 | Release `20261115-1706-74a98be` |

---

## 3. Starting point: review findings

The review covered the live site (desktop and 375×812 phone) and the code (read-only), and used the 14 Nov business review and the 15 Nov legal review as context.

**Already strong:** accurate, dated and sourced figures. A clean technical base (canonicals, a 72-URL sitemap, robots.txt, `llms.txt`, strict security headers, about 70 KB per page with almost no JS). A well-built 6-step checker. Accessibility tests already in CI.

**Problems found:**

| # | Finding | Severity |
|---|---|---|
| 1 | `og-default.png` returned 404, so link previews on WhatsApp, Facebook, LinkedIn and iMessage had no image | High, quick fix |
| 2 | Google hadn't indexed the site yet (2 days old); no Bing setup | High |
| 3 | HSTS only 1 day | Low, quick fix |
| 4 | Header plus notice took about half the phone's first screen; nav wrapped onto 4 rows | High (UX) |
| 5 | Homepage was a wall of text (22 phone screens, 94 links, 4 tables, 0 visuals) | High (UX) |
| 6 | Checker's first question about 2.6 screens down on phones | High (conversion) |
| 7 | No dark mode, small H1 (38px desktop), no imagery or icons | Medium |
| 8 | Horizontal scroll at 320px on 4 of 5 templates | Medium |

**Correction made during the review:** an early note said "no analytics installed". That was wrong in spirit. `solution-design.md` §11 deliberately chooses cookieless server-log analytics (GoAccess plus `ops/ai-report.sh`), with no client JS. The real gap is that nothing in `ops/` installs or schedules either one (see section 7.3).

**Chatbot recommendation: not yet.**
- There isn't enough traffic to learn from yet.
- A bot that states a wrong dollar figure is an Australian Consumer Law risk.
- The rules may change after the 28 Nov election.
- The checker already gives deterministic, sourced answers.

Revisit once the quote form is live and traffic is steady, with a bot that answers only from the site's own verified pages and shows citations.

---

## 4. Prompt 42, Part A: quick SEO and ops fixes (`3e0fef6`)

| Change | Files | Detail |
|---|---|---|
| SEO no-change guard | `site/scripts/snapshot-seo.mjs`, `site/scripts/check-seo-unchanged.mjs`, `docs/design/p42/seo-before.json` | Records title, description, canonical, robots, H1, `og:title` and JSON-LD `@type`s for every sitemap URL. `check-seo-unchanged` is now part of `npm run check` and fails on any difference except `og:image`. |
| Share images | `site/scripts/build-og.mjs` (`npm run og`, manual), `site/public/og/{default,guide,area,tool,business}.png` | 1200×630, 57–66 KB each, no dollar figures or dates. They include the line "Independent guide, not a government website". |
| OG wiring | `site/src/lib/seo.ts`, `site/src/components/seo/Seo.astro`, `site/src/lib/schema.ts`, all layouts | `ogKind` prop per layout; adds `og:image:width`/`height`/`alt` and `twitter:image:alt`; Article schema `image` uses the same file. `check-seo.mjs` fails if an `og:image` file is missing from `dist/`. |
| HSTS | `ops/nginx/householdrebates-headers.conf` | `max-age=31536000`. No `includeSubDomains` or `preload` (open decision). |
| IndexNow | `site/public/651d4e162671bce57241a322c7a9cf4d.txt`, `ops/indexnow-ping.sh`, `ops/deploy-site.sh` | The ping runs only when `INDEXNOW=1` is set, after the smoke check passes. The key isn't a secret. |
| Search console guide | `docs/launch/search-console-setup.md` | Google Search Console (DNS TXT, submit the sitemap), Bing import, 7- and 28-day checks. |
| Screenshot and metrics tool | `site/scripts/capture-p42.mjs`, `site/scripts/serve-dist.mjs` | Before/after screenshots and `metrics-*.json`. |

---

## 5. Prompt 42, Parts B–F: UI refresh (`5c0c3a3`)

### 5.1 Design tokens and dark mode (Part B)
`site/src/styles/tokens.css`
- Fluid type scale with `clamp()`: H1 about 36px on phones and 58px on desktop, tight heading letter-spacing, about 68ch text width, a section spacing rhythm.
- Cards with 16–20px radius, hairline borders and one soft shadow level; pill and 12px-radius buttons.
- Eucalyptus accent kept. Every text pair is 4.5:1 or better and every UI element 3:1 or better (ratios recorded in comments).
- Full `@media (prefers-color-scheme: dark)` token set. No toggle.
- System font stack only. No web fonts, CDNs or icon libraries. CSP unchanged.

### 5.2 Header, nav and independence notice (Part C)
`site/src/components/Header.astro`, `site/src/components/ui-enhance.client.ts` (367 B gz), `site/src/styles/base.css`
- Slim sticky header (59px) with a translucent background where supported. The "Check eligibility" pill is always visible.
- Mobile "Menu" built from `<details>`/`<summary>`, so it works with JS turned off. The small script adds Esc-to-close and returns focus.
- Desktop nav gains "Business" and "Areas" links. Short labels on desktop ("Air Conditioning", "Heat Pumps"), full labels in the mobile menu.
- **Independence notice: wording untouched** (`IndependenceNotice.astro` isn't in the diff). Only the layout changed: 7 lines down to 4 on a phone, still 13px, still above the fold, not sticky.

### 5.3 New homepage (Part D)
`site/src/layouts/HomeLayout.astro` (new), `site/src/pages/index.astro`, `site/src/content/pages/home.mdx`

Section order:
1. **Hero:** the H1 is unchanged. Below it, the first sentence of the answer text, then a postcode form (`GET /victoria/eligibility-checker/?pc=XXXX`, no JS; the checker already reads `?pc=`).
2. **Trust chips:** "Figures checked {date}", "Sources shown, estimates labelled", "Independent, not a government website", "How we're paid". The "every figure" claim is deliberately avoided (legal review finding #9).
3. **Upgrade cards:** 8 cards with icons. Figures come through `<Money variant="block">` with the scenario label and "Indicative discount (the provider confirms)". The election `RuleStatusNotice` sits directly above the grid (legal review finding #11).
4. **How it works:** 3 steps, the "How a VEU discount works" diagram, and the timing-rule caution callout.
5. **2027 gas rule card**, with `RuleStatusNotice`.
6. **Find your area:** chips plus "Search by postcode".
7. **FAQ** as `<details>`, with the full answers in the HTML so FAQPage schema stays valid.
8. **Sources and checked dates.**

**Moved, not deleted:** the 4 homepage `FigureTable`s were confirmed to already appear on their guide pages, and `HubIndex` was already on `/victoria/`. Three `related:` links were added (`gas-room-heater-to-split-system`, `ceiling-insulation-rebate`, `renters`) so every guide keeps 6 or more inbound links.

**Icons:** 12 inline-SVG components in `site/src/components/icons/` (24×24, `currentColor`, `aria-hidden`).

### 5.4 Tool-first pages (Part E)
`site/src/layouts/ToolLayout.astro`, `site/src/components/CheckerApp.tsx`, `site/src/components/EligibilityChecker.astro`, `site/src/content/pages/eligibility-checker.mdx`
- On the checker, postcode lookup, running-costs, size-guide and gas-planner pages, the order is now: H1, one-sentence answer, **the tool**, then the explanation.
- Checker: a "Step X of 6" progress bar, a "Postcode 3000" pill when pre-filled, and large radio cards. **Rules logic unchanged.**
- The checker's visible intro heading became screen-reader-only. The privacy line ("answers stay in your browser") is still in the answer text.

### 5.5 Guide, area and legal pages (Part F)
- Restyled `AnswerBlock`, `HeroBlock`, `Callout`, `FigureTable` (sticky first column, scrolling inside the table), `Toc` (sticky on desktop, collapsible on phones), `RelatedLinks`.
- `site/src/components/MobileStickyCta.astro`: slim "Check your eligibility" bar on guide and area pages on phones. Not shown on the checker or legal pages.
- FAQs become `<details>` site-wide (`Faq.astro`).
- Diagrams: `site/src/components/diagrams/VeuFlowDiagram.astro` (homepage and `/victoria/what-is-a-veec/`) and `GasRuleTimelineDiagram.astro` (dates from `rule-status.json`, on `/victoria/gas-to-electric-hot-water-2027/`).

### 5.6 Supporting component changes
| File | Change | Why |
|---|---|---|
| `Money.astro` | New `linkSource` prop (default `true`). With `false`, it shows "Checked {date} · {publisher}" without a link. | Homepage cards are one big link each, and a link can't contain another link. The full source list stays on the page. |
| `AnswerText.astro` | New `maxSentences` prop | The homepage and tool pages show one sentence above the fold. The full answer text stays in frontmatter. |

### 5.7 Check script adaptations
| Script | Change |
|---|---|
| `check-answers.mjs` | Allows 1–4 sentences (at least 12 words) on `/` and the 5 tool pages; the other 66 pages still need 2–4 sentences. |
| `check-faqs.mjs` | FAQ matcher accepts `<details class="faq-item">` as well as `<div>`, so the 1-to-1 check against FAQPage schema is kept. |
| `site/tests/e2e/site.spec.ts` | Homepage test checks the postcode form; the closed-form check moved to a guide page; the FAQ test opens `<details>` before reading answers. |
| `site/tests/e2e/lead-consent.spec.ts` | Consent test moved from `/` to `/victoria/melbourne/`, because the homepage no longer has a lead-form slot. |
| `site/tests/e2e/p42-ui-refresh.spec.ts` (new) | 8 checks at 375×812: homepage height, H1 position, exact notice text, checker first question visible, postcode prefill, keyboard and no-JS menu, no overflow at 320px, dark-mode contrast. |

---

## 6. Results and verification

### 6.1 Measured (`docs/design/p42/metrics-before.json` → `metrics-after.json`)
| Metric (375×812 unless noted) | Before | After | Target |
|---|---|---|---|
| Homepage height | 17,846px (22 screens) | 6,334px (7.8 screens) | ≤ 6,500px |
| Homepage words / links / tables | 2,076 / 94 / 4 | 719 / 39 / 0 | ≤ 900 words |
| H1 top | 454px | 157px | ≤ 300px |
| H1 size (phone / desktop) | 30px / 38px | 36px / 58px | ~36 / 56–60px |
| Notice | 7 lines, 129px | 4 lines, 82px | ≤ 4 lines, exact text |
| Header + notice share of screen | 52% | 17.4% | — |
| Checker first question | 2,066–2,412px | 471–784px | In first screen |
| Horizontal overflow at 320px | 4 of 5 templates | 0 of 5 | 0 |
| Checker JS (gz) | 15,075 B | 15,278 / 15,360 B | Within cap |

### 6.2 Lighthouse (mobile, local `dist/`, as reported by Antigravity)
| URL | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 |
| `/victoria/eligibility-checker/` | 96 | 100 | 100 | 100 |
| `/victoria/air-conditioner-rebate/` | 100 | 100 | 100 | 100 |
| `/victoria/melbourne/` | 100 | 100 | 100 | 100 |

### 6.3 Independent checks by Claude (separate copy of the branch, nothing changed in the repo)
- `npm run build` plus all post-build checks: pass.
- `npm run check` (17 guard scripts, `astro check`, Vitest): pass. 94/94 site unit tests.
- Playwright: 41/41, including axe accessibility checks.
- **SEO baseline confirmed honest:** `main` (pre-change) was rebuilt separately and snapshotted. It matched `seo-before.json` on all 72 URLs, so "no SEO changes" really holds.
- Diff review: no new runtime dependencies, CSP unchanged, `IndependenceNotice.astro` and the figure, source and data files untouched, test edits legitimate.
- Built homepage HTML: every card figure carries its scenario label and "Indicative discount (the provider confirms)", and the election banner sits above the cards.
- Live site after deploy:
  - release meta, HSTS 1 year, CSP unchanged;
  - `og:image` resolves to a PNG; IndexNow key 200; sitemap 72 URLs; 404 for unknown pages; www redirects to the apex;
  - a real postcode flow on a phone (3000, then the checker at step 1 with the pill, first question visible).

---

## 7. Deployment

### 7.1 Releases
| Release | Commit | How | Notes |
|---|---|---|---|
| `20261115-1649-5c0c3a3` | `5c0c3a3` | `VPS_HOST=hostinger-vps ./ops/deploy-site.sh` | All checks and tests passed, smoke check passed, all live checks passed |
| `20261115-1706-74a98be` | `74a98be` | `INDEXNOW=1 ./ops/deploy-site.sh` (new default host) | IndexNow HTTP 202 for 72 URLs |

An earlier attempt at 16:38 stopped at a password prompt for `deploy@72.61.117.132` and was cancelled before anything changed on the server.

### 7.2 Server change (outside the deploy script)
- `/etc/nginx/snippets/householdrebates-headers.conf`: the only difference from the repo was the HSTS line. The old file was backed up as `householdrebates-headers.conf.bak-20261115`, the repo version installed, `nginx -t` passed, and nginx reloaded.
- Live result: `strict-transport-security: max-age=31536000`; CSP unchanged.
- `nginx -t` shows existing "protocol options redefined" warnings from other vhosts on the shared server. They're unrelated to this site.

### 7.3 Server facts found (read-only checks)
- The SSH alias `hostinger-vps` (defined in `~/.ssh/config` on Guri's Mac) uses key login. That user can write `/var/www/householdrebates/releases` and has passwordless `sudo`.
- `/opt/householdrebates-api` **doesn't exist yet**. It must be created and owned by the deploy user before the first `deploy-api.sh`.
- Nothing in `ops/` installs or schedules GoAccess or `ops/ai-report.sh`. Whether they exist on the server wasn't checked. Logs are written (`hr_main` and `hr_ai` formats) and rotated daily (30 days) per `ops/logrotate/`.

---

## 8. Deploy-host fix (`74a98be`)

| File | Change |
|---|---|
| `ops/deploy-site.sh`, `ops/deploy-api.sh`, `ops/rollback.sh` | `VPS_HOST` defaults to `hostinger-vps`, with a comment: other machines must set `VPS_HOST=user@72.61.117.132`. |
| `ops/deploy-api.sh` | Now passes `VPS_HOST` on to `rollback.sh api`. Before, a failed health check would have tried to roll back over the wrong host. |
| `docs/solution-design.md` §9, `docs/README.md` §2 | Host wording updated. |
| `docs/launch/search-console-setup.md` | IndexNow example simplified to `INDEXNOW=1 ./ops/deploy-site.sh`. |

---

## 9. Trade-offs to know

1. **Checker JS budget:** 15,278 of 15,360 B gz, so 82 B of headroom. The next checker change will probably need the cap raised or code trimmed.
2. **Homepage lead-form slot removed.** When leads go live, homepage visitors reach the form through the checker (arguably the better funnel).
3. **Desktop nav short labels** ("Air Conditioning", "Heat Pumps") put slightly less "rebate" wording in the site-wide menu. Easy to revert.
4. **Desktop hero** leaves empty space on the right at 1280px. A candidate spot for the VEU flow diagram.
5. **Homepage card figures** show the publisher and date without a link (nested-link rule). The full source list is on the page.

---

## 10. Open decisions and next steps

| # | Item | Owner | Notes |
|---|---|---|---|
| 1 | Google Search Console plus Bing Webmaster Tools | Guri | `docs/launch/search-console-setup.md`. Highest-impact next step. |
| 2 | Refresh the Facebook share cache | Guri | Sharing Debugger, then "Scrape Again". |
| 3 | HSTS `includeSubDomains` / `preload` | Guri | Only once mail and every subdomain are HTTPS-only. |
| 4 | Install GoAccess and schedule `ai-report.sh` | Guri | Needs the `hr_main` log format string (see the prompt 42 report). |
| 5 | Create `/opt/householdrebates-api` before the first API deploy | Guri | Add to `CHECKLIST.md` for the form go-live. |
| 6 | Re-verify the 2027 gas-rule pages after the 28 Nov election | Guri / Venture Architect | As planned in the business review. |
| 7 | Backlinks (councils, community energy groups, forums) | Guri | Main lever for rankings and AI citations. |
| 8 | GitHub repository visibility | Guri | The repo is **public** and includes the business review, legal drafts and the lawyer pack. Decide whether that's intended. |

---

## 11. Rollback reference

- Site: `./ops/rollback.sh site` (points `current` back to the previous release; the newest 5 releases are kept).
- HSTS: on the server, copy `/etc/nginx/snippets/householdrebates-headers.conf.bak-20261115` back, run `sudo nginx -t`, and reload nginx. Note that browsers that already received the 1-year header keep it until it expires.
- Code: revert `5c0c3a3` and/or `3e0fef6` on `main`, then deploy.
