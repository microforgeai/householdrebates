# Prompt 29b: "Rules are changing" email alerts, part 2: the sign-up form, collection notice, utility pages, and the go-live gate

> Local only, then two separate STOPs: (1) deploy the site with the form **hidden**; (2) go live, which needs Guri's explicit yes after the lawyer's review. Branch: `feat/review-29b-alerts-site`.
> Run after prompt 29a. The battery placement needs prompt 30; if 30 hasn't run, skip that placement and add it when 30 runs.
> Source: `docs/business-review-2026-11-14.md` §4.3 row 3, §4.4 item 2, §5 "Checker funnel" and "Email capture", §7 item 6. Checker: `docs/eligibility-checker-spec.md` §1 principle 6 ("No personal data is stored… answers stay in the browser") and §7. Design: `docs/solution-design.md` §7.3, §7.6, §10.2. Map: `docs/url-map.md` (no new indexable URLs).

---

## Context

Placements (review §7 item 6): the checker result screen, `/victoria/gas-to-electric-hot-water-2027/`, the battery page (`/victoria/battery-rebate/`, prompt 30) and the footer.

**Checker privacy.** Spec §1 says the checker stores no personal data and answers stay in the browser. The alert form on the result screen is a **separate form** that posts only the email and consent, never checker answers. Say so under the form: "This only signs you up for rule-change emails. Your checker answers aren't sent."

**Design §7.6** says "no email capture while closed". That rule is about the quote form. The alert form is a different purpose with its own flags, so §7.6 gets a note: "Rule-change alerts (§7.10) are separate and have their own flags." Log it under "Conflicts" in `docs/expansion-log.md` as resolved this way, for Guri to confirm.

The copy names the four dates (28 Nov 2026, 1 Jan 2027, 1 Mar 2027, 1 Jul 2027). Dates come from one data value (`site/src/data/alert-topics.json`), and a date in the past drops off the list automatically at build time. No `$` amounts in the form copy.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

## Steps

1. **`AlertSignup` component** (island, under 3 KB gzipped): one email field with a visible label, an **unticked** consent box, the collection notice directly above the button, honeypot and form token (as the lead form). Renders only when `PUBLIC_ALERTS_ENABLED === 'true'`; otherwise renders nothing (no "coming soon" box). Accessible errors (`aria-describedby`). On success: "Check your inbox to confirm. Nothing is sent until you click the link."
2. **Consent wording v1** (draft; the lawyer confirms; stored as `alerts-v1` with its sha256, matching 29a):
   > ☐ Email me when the rules for Victorian energy rebates change (for example the election result, the battery discount change on 1 January 2027, the gas hot water rule on 1 March 2027 and solar moving into VEU on 1 July 2027). I can unsubscribe at any time from any email.
3. **Collection notice** (APP 5; draft for the lawyer): "Household Rebates (Agenor Services Pty Ltd, ABN <<ABN>>) collects your email address only to send rule-change alerts you've asked for. If you don't give it, we can't send them. We don't share it with installers or anyone else, except our email service provider, <<provider>>, which sends the emails for us<<; it may store data outside Australia>>. Our [privacy policy](/privacy/) explains how to access or correct your details and how to complain. We're not a government website." The placeholders must resolve from config before build, or the build fails.
4. **Placements:** checker result screen (below the result lines and CTAs, not above them); `/victoria/gas-to-electric-hot-water-2027/` (after the answer and the rule-status notice from prompt 24, not inside the answer); `/victoria/battery-rebate/` (after the 1 Jan 2027 section); site footer (compact variant). No pop-ups, no interstitials, no pre-ticked boxes.
5. **Utility pages** (noindex, `robots` disallow not needed, excluded from the sitemap, `llms.txt` and `check-urlmap` like `/thanks/` and `/form-error/`): `/alerts/confirmed/`, `/alerts/expired/`, `/alerts/unsubscribed/`. Each says what happened in one sentence and links to `/victoria/`.
6. **Privacy policy:** add an "Email alerts" section (purpose, legal basis = consent, retention from 29a, unsubscribe, no sharing, provider, overseas if applicable). `legalReviewed` stays false until the lawyer signs; `check-legal` already blocks `LEADS_ENABLED`; extend it to block `PUBLIC_ALERTS_ENABLED=true` while the privacy policy's alert section isn't reviewed.
7. **Schema:** none for the form. No `Offer`, no `SubscribeAction` (keep the allowed types list unchanged).
8. Tests: unit (consent unticked by default; notice placeholders resolved; past dates dropped); e2e (Playwright) with a mocked API: submit → success message; the request body has exactly `email`, `consent`, `consentVersion`, `formToken`, `website`; nothing from `sessionStorage` is sent.

## Acceptance checks

```bash
cd site
npm run check && npm run test:e2e -- alerts   # expect: pass
PUBLIC_ALERTS_ENABLED=false npm run build && grep -RIl 'data-alert-signup' dist | wc -l   # expect: 0
PUBLIC_ALERTS_ENABLED=true  npm run build && grep -RIl 'data-alert-signup' dist | wc -l   # expect: every page (footer) — and check-legal FAILS while the alert privacy section isn't reviewed
node scripts/check-urlmap.mjs     # expect: unchanged count; the 3 /alerts/ pages are noindex and not in the sitemap
grep -c 'type="checkbox"[^>]*checked' dist/victoria/gas-to-electric-hot-water-2027/index.html   # expect: 0
```

## What to test by hand

- With the API from 29a running locally (flags on locally only, fake transport): sign up from each placement, confirm, unsubscribe.
- Keyboard and screen reader through the form; error states; 200% zoom.

## Open decisions for Guri

- Go live before 28 Nov 2026 (the review's suggestion) or after the election re-check. Going live needs the lawyer's review of the consent and notice first, so before 28 Nov is only possible if the lawyer is quick.
- The footer placement (site-wide) vs only the three content placements.
- The email provider name and whether data goes overseas (for the notice).

## STOP 1: deploy with the form hidden

{{BLOCK:deploy-stop}}

Deploy with `PUBLIC_ALERTS_ENABLED=false`. Sitemap count: unchanged.

## STOP 2: going live (a separate yes from Guri, never bundled with STOP 1)

Only after all of these are true, and Guri types **yes, alerts live**:

1. The lawyer has reviewed the consent wording, the collection notice, the privacy policy section and the email templates, and `ALERTS_REVIEWED_BY` is set.
2. Prompt 29a's `api/` is deployed (its own server STOP) with `ALERTS_ENABLED=true`, `ALERTS_SEND_ENABLED=false`.
3. A live test: Guri subscribes, confirms and unsubscribes with his own address, and the suppression works.
4. Then the site is rebuilt with `PUBLIC_ALERTS_ENABLED=true` and deployed.
5. **Sending a real alert** is yet another yes, per send: show Guri the draft and its sha256; he replies **yes, send <sha256>**; only then set `ALERTS_SEND_ENABLED=true` for that run and use `--confirm`.

## Done when

The form, notice and utility pages are built and tested with the form hidden in production, the privacy section is in the lawyer pack, and the go-live checklist is written down. Commit `feat(review): rule-change alerts sign-up, hidden until approved (29b)`.
