# Prompt 11 — Email for householdrebates.com.au: mailbox, MX, SPF, DKIM, DMARC, and the API mail driver

> DNS and mailbox changes need Guri's yes. Don't send any email to a real person other than Guri in this prompt.

---

## Context

The lead API emails (a) an internal notice to Guri's chosen mailbox, (b) a confirmation to the person, (c) the lead to the named installer. A new domain receives nothing until MX is set, and mail won't land reliably without SPF, DKIM and DMARC aligned with the sending service. Don't send from the VPS's own mail server. Options (Guri's decision, solution-design §14 item 1):

- **Option H — Hostinger Mail** on householdrebates.com.au (e.g. `quotes@`, `privacy@`, `hello@` as aliases). API uses the `smtp` driver (Hostinger documents `smtp.hostinger.com`, port 465 SSL — confirm in hPanel). Check whether his plan includes a mailbox for this domain before creating one; a paid mailbox needs his explicit yes.
- **Option M — Microsoft 365** (Agenor's tenant): add householdrebates.com.au as an accepted domain, create a shared mailbox `quotes@householdrebates.com.au`, and send with the `graph` driver (app registration with `Mail.Send` application permission, restricted to that one mailbox). Microsoft disables Basic SMTP AUTH by default for existing tenants at the end of December 2026, so don't use SMTP AUTH with a password on M365.

## Steps

1. Ask Guri: **H or M?** and which addresses (`quotes@`, `privacy@`, `hello@`). Record in `docs/decisions.md`.
2. Read current DNS (read-only): `dig +short MX householdrebates.com.au; dig +short TXT householdrebates.com.au; dig +short TXT _dmarc.householdrebates.com.au`.
3. Write `docs/email-dns-plan.md` with the exact records to add, taken from the provider's own screen (hPanel → Emails → DNS records, or M365 admin → Domains → DNS records). Typical shapes (values come from the provider, not from here):
   - MX: provider's MX hosts and priorities.
   - SPF (one TXT at `@`): `v=spf1 include:<provider spf> ~all` — exactly **one** SPF record; merge if one exists.
   - DKIM: provider's selector CNAME/TXT records.
   - DMARC: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:dmarc@householdrebates.com.au; adkim=r; aspf=r` to start; move to `p=quarantine` after 2–4 clean weeks.
   - (Option M) `autodiscover` CNAME and the domain verification TXT.

## STOP A — Guri approves the DNS plan and any mailbox creation

## Steps (after yes)

4. Guri (or you, if he says so) adds the records in hPanel DNS. Don't touch the A records from prompt 09.
5. **Option M only:** in Entra admin, app registration `householdrebates-mailer`, application permission `Mail.Send`, admin consent; then in Exchange Online PowerShell scope it to the one mailbox (RBAC for Applications: `New-ManagementScope` + `New-ManagementRoleAssignment -Role "Application Mail.Send"`, or `New-ApplicationAccessPolicy -AccessRight RestrictAccess`). Client secret goes straight into `/etc/householdrebates/api.env` via `sudoedit` (never chat). Record the secret's expiry date in `docs/decisions.md` with a reminder.
6. **Option H only:** create the mailbox in hPanel; Guri types the password straight into `api.env`.
7. On the VPS: set `MAIL_TRANSPORT`, `MAIL_FROM="Household Rebates <quotes@householdrebates.com.au>"`, `LEADS_NOTIFY_TO=<Guri's chosen inbox>`, then `sudo systemctl restart hr-leads`.
8. Send a test: `sudo -u hrapi bash -c 'set -a; . /etc/householdrebates/api.env; set +a; node /opt/householdrebates-api/current/dist/cli/mail-test.js --to <Guri's address>'`.

## Acceptance checks

```bash
dig +short MX householdrebates.com.au                    # expect: provider's MX host(s)
dig +short TXT householdrebates.com.au | grep -c "v=spf1"   # expect: 1 (exactly one SPF)
dig +short TXT _dmarc.householdrebates.com.au            # expect: "v=DMARC1; p=none; …"
dig +short CNAME <selector>._domainkey.householdrebates.com.au   # expect: provider DKIM target (or TXT with p=…)
```
- Guri receives the test email; in the message headers (Gmail: "Show original"): **SPF PASS, DKIM PASS, DMARC PASS**, and `From:` is `quotes@householdrebates.com.au`.
- Optional: send to a mail-tester.com address → score ≥ 9/10.
- Reply to the test email from Guri's inbox → it arrives in the `quotes@` mailbox (inbound MX works).
- `journalctl -u hr-leads -n 20` shows no mail errors.

## What to test

Send the three template emails to Guri's address with fake data (same command as step 8, adding `--template notice`, `--template confirmation`, `--template installer`). Check they read well on a phone and show Agenor's name, ABN and contact details.

## STOP B

Show Guri the header results. Nothing else changes until he's happy that mail authenticates.
