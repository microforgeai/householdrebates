# Prompt 14 — Launch: go public, Search Console and Bing, then (separately) switch the form on

> Two launches with two separate approvals:
> **Launch A — content goes public** (form still off).
> **Launch B — lead form goes live**, only when every gate below is met.
> Each step that touches the live site, DNS or search consoles needs Guri's **yes**.

---

## Context

Household Rebates has passed QA (prompt 13) on a password-protected preview. Launch A removes the password and `noindex`, submits the sitemap to Google Search Console and Bing Webmaster Tools, and starts measuring. Launch B turns on the quote form, but the strategy and compliance rules say: no form until a **written installer agreement** is signed, the privacy policy, consent wording and terms have been **reviewed by a lawyer**, and email authentication passes.

---

## Launch A — public content (form off)

### Pre-flight (all must be true)
- [ ] Prompt 13 QA report approved by Guri.
- [ ] `RELEASE_MODE=launch npm run build -w site` passes, **except** the legal gate may be waived for Launch A only if Guri explicitly says so in writing (`docs/decisions.md`), because the privacy policy must still be accurate for server logs even with the form off. Recommended: finish the lawyer review first.
- [ ] Every figure re-checked within the last 7 days (`checkedOn`), sources 200.
- [ ] `certbot renew --dry-run` passes on the VPS.

### STOP A — Guri types "yes, go public"

### Steps
1. Remove `include snippets/householdrebates-prelaunch.conf;` lines from the live server config (keep a backup), `sudo nginx -t && sudo systemctl reload nginx`.
2. `PUBLIC_LEADS_ENABLED=false RELEASE_MODE=launch ./ops/deploy-site.sh`.
3. **Google Search Console** (Guri's Google account): add a **Domain** property `householdrebates.com.au`; copy the TXT value; add it in Hostinger DNS (Guri's yes); verify; submit `https://householdrebates.com.au/sitemap-index.xml`; URL-inspect and request indexing for `/`, `/victoria/air-conditioner-rebate/`, `/victoria/heat-pump-rebate/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/eligibility-checker/`, `/victoria/reverse-cycle-vs-gas-heater/`.
4. **Bing Webmaster Tools**: sign in, "Import from Google Search Console" (no extra DNS), confirm the sitemap is listed. Optional later: IndexNow.
5. After two clean weeks, raise HSTS to `max-age=31536000` (Guri's yes).
6. Note the launch date in `docs/decisions.md`.

### Checks
```bash
curl -sI https://householdrebates.com.au/ | grep -iE "^HTTP|x-robots-tag|www-authenticate"
# expect: HTTP/2 200; no X-Robots-Tag; no WWW-Authenticate
curl -s https://householdrebates.com.au/ | grep -c 'name="robots" content="noindex'     # expect: 0
curl -s https://householdrebates.com.au/robots.txt | grep -c Sitemap                     # expect: 1
curl -s https://householdrebates.com.au/llms.txt | head -1                               # expect: # Household Rebates
curl -s https://householdrebates.com.au/ | grep -c 'name="email"'                        # expect: 0 (form still off)
```
- GSC shows the sitemap "Success" (may take a day); Bing shows it submitted.
- Day 2 and day 7: GSC Pages report → indexed count rising; Coverage errors = 0.

---

## Launch B — switch the lead form on

### Gates (every box ticked, evidence linked in `docs/decisions.md`)
- [ ] **Signed written installer agreement** with at least one installer (prompt 12 terms), and written confirmation of the VEU accredited provider they work with.
- [ ] Installer details verified: ABN active (abr.business.gov.au), licence number checked on the regulator's public register, accredited provider name appears on Energy Victoria's accredited provider list for that product.
- [ ] Lawyer review done: `CONSENT_REVIEWED_BY` recorded; `legalReviewed: true` on privacy, terms, about, how-quotes-work; consent version final.
- [ ] Email: SPF/DKIM/DMARC pass (prompt 11), withdrawal and privacy mailboxes monitored daily.
- [ ] Guri understands the daily routine: read lead notices, run `deliver` the same business day, run `withdraw` on request, record outcomes for invoicing.

### STOP B — Guri types "yes, turn the form on"

### Steps
1. Add the installer to `site/src/content/installers/<id>.yaml` and `api/installers.json` (same data; `check-installers` passes). Commit.
2. Deploy the API: `./ops/deploy-api.sh`; on the server `sudoedit /etc/householdrebates/api.env` → `LEADS_ENABLED=true`, `PRIVACY_POLICY_VERSION=privacy-v1` (or current), `CONSENT_REVIEWED_BY=<lawyer, date>`; `sudo systemctl restart hr-leads`; `curl -s http://127.0.0.1:8787/health` → `"leadsEnabled":true`.
3. Deploy the site with the form: `PUBLIC_LEADS_ENABLED=true RELEASE_MODE=launch ./ops/deploy-site.sh`.
4. **Live test with Guri's own details** (postcode the installer covers): submit; check the three emails (internal notice, confirmation); **don't** run `deliver` for the test — instead `withdraw` it, then `erase` it. Tell the installer beforehand that a test may appear.
5. First real lead: Guri runs `deliver HR-…`, confirms the installer received it, logs the outcome later.

### Checks
```bash
curl -s https://householdrebates.com.au/ | grep -c 'name="email"'      # expect: 1
curl -s "https://householdrebates.com.au/api/routing?postcode=<covered>&activity=rcac"   # expect: the installer's trading name and AP, no email
ssh <admin>@72.61.117.132 "sudo -u hrapi bash -c 'set -a; . /etc/householdrebates/api.env; set +a; node /opt/householdrebates-api/current/dist/cli/status.js'"
# expect: test lead counted then shown as erased
```

### Rollback
Form problem: `LEADS_ENABLED=false` + restart, and `PUBLIC_LEADS_ENABLED=false ./ops/deploy-site.sh` (form closes, content stays). Content problem: `./ops/rollback.sh site`.

---

## After launch (weekly, 15 minutes)

- GSC: queries, CTR, pages indexed; Bing the same.
- `ai-report.sh`: AI referrals and crawler hits; note which pages answer engines send people to.
- `status`: leads by page/activity/how_heard; installer outcomes; duds.
- Monthly: re-check every figure against Energy Victoria, update `checkedOn`, redeploy (the build fails after 45 days anyway).
- Add an area page only when there's measured demand and four sourced local facts. No mass suburb pages.
- Solar and battery calculator section: start with its own design note (prompt 15, later).
