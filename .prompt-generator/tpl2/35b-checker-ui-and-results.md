# Prompt 35b: Checker UI for the spec cascade, the result screen and deploy

> Local first, then a deploy STOP. Branch: `feat/checker-v2-ui` (on top of 35a).
> **Run order:** right after 35a.
> References: `docs/eligibility-checker-spec.md` §3 (tree), §4 (fields), §6 (messages), §7 (CTAs); `docs/url-map.md` row 15 `/victoria/eligibility-checker/` (live; keep its URL, title rules and inbound links) and the link targets in rows 54–64; `docs/solution-design.md` §6.

---

## Goal

Swap the checker's question flow and result screen for the spec's cascade on the **same URL**: Step 1 Residential or Business, then postcode (with the "Your area" card), then each path's own fields. The result screen shows Likely / Possibly / Not eligible lines with figures from the data file, the global modifiers, sources, and the CTAs in spec §7. The quote form stays off.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## Steps

1. **Island:** the checker is one Preact island using `evaluate()` from 35a. One field group per screen, as spec §4 orders them; Back keeps answers (sessionStorage only; cleared by "Start again"). Progress shows "Step n of m" for the current path.
2. **Postcode data:** don't bundle `postcodes.json` in the island. Emit a compact `/data/postcodes.v{hash}.json` at build (only the columns the card and rules need) and fetch it once after Step 1. Island JS budget stays under 15 KB gzipped (design §11); the data file has no budget but log its gzipped size.
3. **"Your area" card** (after a valid postcode): localities (first 3, "+n more"), primary LGA with its share and other LGAs, VEU area, mains gas yes/no, climate region, heat pump zone; "From VEU Specifications v25.0 Table A" + checked date. Link: "More about {area}" per 35a `links.ts`.
4. **Fields:** labels, options and "Not sure" exactly as spec §4. Multi-selects (R6, B6) are checkbox groups. All fields keyboard-operable with fieldset/legend, errors in text, `aria-live` for the result.
5. **Result screen:**
   - Line order: VEU, then Solar Homes (state), then **FEDERAL** (label on screen), then Not eligible lines with the §6 message and link.
   - Each line: status chip (Likely / Possibly / Not eligible / Info), the upgrade, the figure(s) via `<Money>` with labels (prompt 25), the co-payment where one applies, one-sentence why, "Source ↗ · Checked {date}".
   - Global modifiers render as notes at the top (G-AREA, G-RENT, G-OC, G-NOTSURE) or the footer (G-RETRO, G-SCAM, G-SCHED).
   - Estimates (insulation) render with "(our estimate)" and the method text in a disclosure.
   - Election notice (prompt 24) at the top of the result while `rule-status.json` says pending.
   - CTAs exactly per spec §7. The **Business** path's primary CTA goes to `/victoria/business-energy-upgrades/` once row 55 is enabled (prompt 28); until then it goes to `/victoria/veu-minimum-co-payment/` plus the Energy Victoria business page (external). No link to `/get-quotes/`.
   - Tenant: "Share this result with your landlord" copies a URL with the answers in the hash (`#a=` base64 JSON); nothing is sent or stored on a server. Opening that URL restores the result.
   - Print view.
6. **Static page around the island:** update the page copy (answer-first opening, how it works, what we don't do) so it describes the new cascade, including that businesses are covered. Update its FAQ (with `canonicalPage` per prompt 27) and its HowTo schema steps (no `$`). Title and description per rule 16.
7. **No-JS fallback:** the page's static content lists the upgrade guides and `/victoria/postcode/` (row 54) when enabled.
8. **Playwright (`tests/e2e/checker.spec.ts`):** drive all 6 spec examples through the real UI and assert the rendered lines and links match 35a's fixtures (examples 1 and 5 by screenshot as well). Plus: X1 on 2000, Back keeps answers, "Start again" clears, keyboard-only run of example 1, axe 0 serious issues, share link restores a result.

## Acceptance checks

```bash
cd site
npm run check && npx vitest run && npm run build
node scripts/check-urlmap.mjs && node scripts/check-seo.mjs && node scripts/check-schema.mjs && node scripts/check-text.mjs
npx playwright test tests/e2e/checker.spec.ts     # expect: all pass, 6/6 spec examples
gzip -c dist/_astro/Checker*.js | wc -c            # expect: < 15360
grep -c 'get-quotes' dist/victoria/eligibility-checker/index.html   # expect: 0
grep -o '"@type":"[A-Za-z]*"' dist/victoria/eligibility-checker/index.html | sort -u   # expect: allowed types only
```

## What to test by hand

- Guri runs example 1 with his own answers on a phone (375 px) and reads the result.
- One business run (example 5) and one tenant run with the share link opened in a private window.

## Open decisions for Guri

- Tenant share link: answers in the URL hash (default, nothing stored) or drop the share feature.
- Whether the checker shows Business at all before prompt 28's hub is live (default: yes, with the interim CTA in step 5).

{{BLOCK:deploy-stop}}

Sitemap count: unchanged (the checker URL already exists).

## Done when

The new checker is live after Guri's yes, the 6 examples pass in Vitest and Playwright, and the quote form is still off. Commit `feat(checker): spec cascade UI and result screen (35b)`.
