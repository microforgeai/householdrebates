# Prompt 40 – Legal fixes from plain-English review (15 Nov 2026)

## Goal
Apply the 11 must-fix and 17 should-fix findings in `docs/legal/legal-review-2026-11-15.md` (Venture Architect, NOT legal advice). Lawyer sign-off flags stay unset: `legalReviewed: false`, `alertsLegalReviewed: false`, `ALERTS_REVIEWED_BY` empty.

## Rules
- Branch: new local branch `feat/review-40-legal-fixes` from the current head of the run. Don't push, merge or deploy.
- Use the review's replacement wording exactly unless it conflicts with a build guard; if so, stop and report.
- No `$` in titles, schema or FAQ answers. No new figures. No UNVERIFIED text.
- Do not change hosting, DNS or the server. Do not opt Agenor in to the Privacy Act; that's Guri's call (record it as an open decision).

## Steps
1. Copy the review into `docs/legal/legal-review-2026-11-15.md` (already placed there) and link it from `docs/lawyer-pack.md`.
2. **#1 Server location:** replace the "Australian-managed server environment" sentence with the review's wording, using a placeholder `<<SERVER_COUNTRY>>`. Add a check to `check-legal.mjs` that fails any production build while `<<SERVER_COUNTRY>>` is present. Guri will confirm the country in hPanel.
3. **#2–#11:** apply each must-fix as written (overseas disclosure + complaints sections, consent-text/hash mismatch, figure-source claims in terms + about, collection notices, §1 trading wording, §5 server-log IPs, post-election block extended to the quote form, election banner kept on figure pages).
4. **#3 Consent hash:** make `check-consent-hash.mjs` hash the exact text rendered in `LeadForm.astro` (and `AlertSignup`) and compare it to `vic-v1.ts` / `alerts-v1.ts` and the API copy. Bump consent versions if the text changes.
5. **#12–#28:** apply the should-fixes. Where a fix needs a fact only Guri has (PO box, named installer, evidence for "vetted installers"), use a `<<...>>` placeholder blocked by `check-legal`, or drop the claim if the review says so.
6. Add the "Needs a real lawyer" list to `docs/lawyer-pack.md` §2 as questions.
7. Update `docs/expansion-log.md` with each finding number and what changed.

## Acceptance
- Full build, all checks, Vitest and Playwright pass with flags off.
- `grep -RIn "Australian-managed" site/src` returns 0.
- `check-legal` fails when `<<SERVER_COUNTRY>>` or any `<<...>>` is present and `PUBLIC_LEADS_ENABLED=true` or `PUBLIC_ALERTS_ENABLED=true`.
- Negative test: change one word in the rendered consent text and `check-consent-hash` fails.
- Report: branch, commit, list of findings 1–28 with done / placeholder / skipped (and why), and every open decision for Guri.

Stop when done.
