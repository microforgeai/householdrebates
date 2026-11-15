# Prompt 43 – Post-launch ops and polish (15 Nov 2026)

Save this prompt as prompts/43-post-launch-ops-and-polish.md in your first commit.

## Goal
Close the technical follow-ups from the 15 Nov release (see docs/change-record-2026-11-15.md §7.3, §9, §10):
cookieless analytics on the server, more room in the checker's JS budget, two small UI fixes, and docs.

## Rules
- Branch: feat/p43-post-launch from main. Don't merge to main, push or deploy.
- check-seo-unchanged must pass (no title, description, canonical, H1 or schema changes). No figure, source or data changes. CSP unchanged. No new runtime dependencies.
- Independence notice wording and the election banners stay exactly as they are.
- Server: read-only until the STOP in Part A. It's a shared server with other vhosts, so touch nothing that belongs to them.

## Part A – Cookieless log analytics (solution-design §11)
1. Read-only on `ssh hostinger-vps`: confirm the real paths and formats of the access log and AI log (the nginx conf says /var/log/nginx/householdrebates.access.log and householdrebates.ai.log; an earlier report said /var/log/nginx/householdrebates/). Check whether goaccess is installed, and which distro/version.
2. In the repo, add:
   - ops/weekly-report.sh: runs GoAccess over the last 7 days of the access log (the hr_main format; derive the GoAccess --log-format from a REAL log line and test it), plus ops/ai-report.sh over the AI log. It writes an HTML + text report to /var/lib/householdrebates/reports/<YYYY-Www>/ (mode 0750, NOT under /var/www, because reports contain IPs), and keeps 12 weeks.
   - ops/systemd/hr-report.service + hr-report.timer (weekly, Monday 07:00 Australia/Melbourne, Persistent=true).
   - A local test: run weekly-report.sh against a small sample log in a temp dir and check it produces both reports.
3. **STOP and show Guri:** the exact install commands (apt package, files copied, systemctl enable --now), the disk impact, and the sample output. Install on the server only after Guri says yes. Then run it once and report the top pages, referrers and AI referrers/bots.
4. docs/README.md §6: how to fetch a report (scp command) and where it lives.

## Part B – Checker JS headroom
Checker+shared is 15,278 / 15,360 B gz (82 B left). Trim to at least 1,024 B under the cap without changing behaviour (for example dead code, duplicated strings, lazy-loading result-only code). Don't raise the cap. All checker unit, spec-coverage and Playwright tests must pass; report before/after bytes.

## Part C – Two small UI fixes
1. Desktop hero (≥1024px): put the existing VeuFlowDiagram in the empty right column of the homepage hero, using ONE DOM instance (CSS grid placement) so it isn't duplicated. On phones it stays where it is in "How it works". Homepage 375px height must stay ≤ 6,500px.
2. Desktop nav short labels: "Air Conditioning" → "AC Rebate" and "Heat Pumps" → "Heat Pump Rebate" (keeps "rebate" in the site-wide menu). Must fit at 1024px without wrapping; if not, report and keep the current labels.
3. Re-capture after screenshots for / at 1280×800 and 375×812 (light and dark) into docs/design/p43/.

## Part D – Docs
- CHANGELOG.md: a dated entry for this work.
- docs/CHECKLIST.md: add "create /opt/householdrebates-api owned by the deploy user" to the lead-form go-live list if it's missing.

## Acceptance
npm run build, npm run check (all 17 guards incl. check-seo-unchanged), Vitest, and Playwright (incl. axe) all pass. The bundle check shows ≥ 1,024 B headroom.

## Report
Branch and commits, Part A findings plus the STOP plan (and the install result if approved), bundle bytes before/after, screenshots, anything skipped and why. Then STOP for Guri's review before merging or deploying.
