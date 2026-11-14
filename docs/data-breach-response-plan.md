# Data Breach Response Plan — Household Rebates (Agenor Services Pty Ltd)

## 1. Purpose and Scope
This one-page response plan governs any suspected or actual unauthorised access to, disclosure of, or loss of personal information held by `householdrebates.com.au` — including `/var/lib/householdrebates/leads.db`, `/var/lib/householdrebates/alerts.sqlite`, `/var/backups/householdrebates/` (encrypted `age` backups) and the backup encryption key, `/etc/householdrebates/api.env`, web server access logs (`/var/log/nginx/householdrebates.*.log`), or email mailboxes.

**Legal regime:** The **Notifiable Data Breaches (NDB)** scheme under Part IIIC of the *Privacy Act 1988* (Cth) applies once Agenor Services Pty Ltd is an APP entity (for example upon opting in under s6EA; see `docs/legal/legal-review-2026-11-15.md` #4). In addition, the statutory tort for serious invasions of privacy (in force since 10 June 2025 under Schedule 2 to the *Privacy Act 1988*) applies even to small businesses otherwise exempt from the APPs.

## 2. Immediate Containment (First 2 Hours)
1. **Isolate the Lead & Alerts API:** Stop the service immediately on the VPS (`sudo systemctl stop hr-leads`) and set `LEADS_ENABLED=false`, `ALERTS_ENABLED=false`, and `ALERTS_SEND_ENABLED=false` in `/etc/householdrebates/api.env`.
2. **Preserve forensic evidence:** Take an immediate read-only snapshot of `/var/lib/householdrebates/leads.db`, `/var/lib/householdrebates/alerts.sqlite`, `/var/backups/householdrebates/`, `/var/log/nginx/householdrebates.*.log`, and `journalctl -u hr-leads` before rotating or modifying logs.
3. **Rotate credentials and keys:** Rotate `IP_HASH_SECRET`, `ALERTS_HASH_SECRET`, `FORM_TOKEN_SECRET`, the `age` backup encryption key (if key compromise is suspected), and any SMTP or Microsoft Graph client secrets in `/etc/householdrebates/api.env`.

## 3. Assessment (Within 72 Hours — max 30 days under s 26WH)
Assess what data was affected:
- Note that `leads.db` collects **no** street addresses, dates of birth, financial/payment details, concession card numbers, or government identifiers, and purges contact details after 12 months; `alerts.sqlite` collects email addresses only (plus 30-day hashed IP / browser string).
- Determine the number of individuals affected across `leads.db` (`SELECT COUNT(*) FROM leads WHERE email IS NOT NULL`), `alerts.sqlite` (`SELECT COUNT(*) FROM alert_subscribers WHERE email IS NOT NULL`), backups, logs, or mailboxes, and whether the breach is likely to result in **serious harm** to any individual (and whether remedial action has prevented serious harm).

## 4. Notification
1. **Installer notification:** If any delivered leads are affected or if an installer's mailbox was compromised, notify the affected installer(s) immediately.
2. **OAIC & Individual notification (if Eligible Data Breach):** If the assessment concludes there is a likely risk of serious harm that cannot be prevented by remedial action, lodge a statement with the **Office of the Australian Information Commissioner (OAIC)** via the OAIC Notifiable Data Breach form and notify affected individuals by email with actionable steps.
3. **ESC notification (if VEU consent integrity affected):** If consent records are affected, notify the accredited provider(s) so they can meet their Essential Services Commission (ESC) reporting obligations.

## 5. Contact & Responsibility
- **Incident Lead:** Gurinder Singh, Director, Agenor Services Pty Ltd (`privacy@householdrebates.com.au`)
