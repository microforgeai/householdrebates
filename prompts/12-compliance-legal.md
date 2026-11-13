# Prompt 12 — Compliance and legal pages: privacy policy, collection notice, terms, installer agreement, lawyer pack

> Drafting only. Every document here is a **draft for a lawyer to review**; nothing goes live until Guri confirms the review is done. No publishing in this prompt.

---

## Context

Household Rebates collects a person's contact details and passes them to a named installer, who pays Agenor a fee. Relevant rules (read from official pages on 13 Nov 2026; links in `content/sources/`):

- **VEU code of conduct (ESC):** lead generation and marketing are regulated actions. Unsolicited phone and door-to-door lead generation are banned unless the consumer gave express prior consent. A consent record should show identity, who may contact, which activity, phone and/or visit, expiry (3 months unless agreed otherwise) and withdrawal. ESC recommends naming the installation partner on the consent form. Lead generators must give clear, accurate information, must not claim to work for VEU, the ESC or the Victorian Government, should tell consumers about the code and offer the VEET scheme consumer factsheet, give the name of the accredited person creating certificates, and comply with spam laws. Lead buyers are liable for leads gathered in breach and can't rely on the seller's word.
- **Privacy (OAIC):** disclosing personal information to someone else for a benefit is "trading in personal information"; a small business that trades is covered by the Privacy Act unless it has the consent of everyone concerned. We get express consent **and** treat the Australian Privacy Principles as applying (published APP privacy policy, APP 5 collection notice, access and correction, security, complaints).
- **Spam Act (ACMA):** commercial emails need consent, sender identification with contact details, and a working unsubscribe honoured within 5 working days. v1 sends only transactional emails; any marketing later needs its own unticked opt-in.
- **Australian Consumer Law:** no misleading claims about discounts (hence "indicative", "up to", provider confirms).

## Goal

Drafts in the repo, a lawyer pack, filled-in publisher details, and build gates that keep the form off until the review is recorded.

## Steps

1. **Publisher details** — ask Guri for: exact legal entity name (Agenor Services Pty Ltd?), ABN, registered business address or a contact address he's happy to publish, contact phone (optional), whether "Household Rebates" is a registered business name. Update `site/src/data/site.ts`. Remove every `<<…>>` placeholder.
2. **Privacy policy** `pages/privacy.mdx` (`LegalLayout`, `legalReviewed: false`, `version: privacy-v1`). Sections (APP 1 content):
   - Who we are (entity, ABN, contact, privacy@ address).
   - What we collect: quote form fields; eligibility checker answers stay in your browser; server logs (IP address, browser, pages, referrer) kept 30 days; hashed IP for spam limits; no cookies for tracking.
   - How we collect it: from you, via the form.
   - Why: to pass your request to the installer(s) named on the form, to confirm your request, to keep consent records the VEU rules expect, to stop spam, to handle complaints, to invoice installers.
   - Who we disclose to: only the named installer(s) and, through them, their VEU accredited provider; our email provider (Hostinger or Microsoft — name the one chosen) and VPS host (Hostinger) as service providers; where required by law. **We are paid by the installer for each enquiry.** We don't sell lists.
   - Overseas disclosure: state where the email provider and VPS store data (Guri/you confirm: Hostinger VPS location and mail data location; Microsoft 365 tenant region). If unknown, the lawyer must resolve before go-live.
   - Retention: per solution-design §7.8.
   - Security: summary (encrypted transport, access-limited server, encrypted backups).
   - Access and correction: email privacy@; we respond within a reasonable time, aiming for 30 days (the OAIC's usual benchmark — lawyer to confirm).
   - Withdrawing consent and stopping contact: how; we tell the installer the same business day.
   - Complaints: to us first, then the OAIC (link oaic.gov.au); VEU conduct issues to the provider and the Victorian Energy Upgrades team.
   - Changes and version date.
3. **Collection notice** (APP 5) — short version shown at the form, linking to the full policy; same text in `site/src/data/consent/vic-v1.ts` (`COLLECTION_NOTICE_V1`).
4. **Consent wording** — finalise `vic-rcac-v1` and `vic-hotwater-v1` from solution-design §7.3; bump to `-v2` if anything changes after the lawyer review (old versions stay in the registry so old records still verify).
5. **Terms of use** `pages/terms.mdx`: information only, not financial or legal advice; figures indicative and dated, the accredited provider confirms; we're not a government site or part of VEU; we don't install anything or guarantee installer work; installer relationship and fee; acceptable use; Victorian law.
6. **About** `#how-we-are-paid` — reconcile with the privacy policy and terms.
7. **Installer agreement — key terms sheet** `docs/legal/installer-agreement-terms.md` (for the lawyer to turn into the agreement; not a contract itself):
   - Parties; installer licence(s); the VEU accredited provider they work with (name, and written confirmation from the AP); installer warrants it complies with the VEU code of conduct.
   - Leads: what a lead is; delivery by email; 1 installer per lead (or as agreed); fee per accepted lead (benchmark: PumpSwap $39 inc GST per accepted lead, first lead free — Guri sets his own); GST; invoicing monthly; dud policy (wrong number, out of area, duplicate within 30 days, no consent) and how to claim within 7 days.
   - Use of leads: only to quote for the activity named; only by the channels the person ticked; within the 3-month consent period; stop immediately on withdrawal (we'll notify); **no cold calling, no doorknocking, no on-selling, no adding to marketing lists**; no claim to be government or VEU; give the consumer the statement of rights and VEET factsheet as the code requires.
   - Records: installer and AP may rely on our consent record; we keep it for the agreed period and provide it on request for ESC audits.
   - Privacy: installer is responsible for its own APP compliance once it receives the lead; data breach notification to each other within 72 hours.
   - Quality: response time (e.g. contact within 1 business day by an allowed channel); outcomes reported (`accepted/quoted/won/lost`) monthly.
   - Termination; liability; insurance (public liability); Victorian law.
8. **Data breach response plan** `docs/legal/data-breach-plan.md`: contain, assess (NDB scheme test: likely serious harm?), notify OAIC and individuals if required, notify installers, review. Named contact: Guri.
9. **Records** `docs/legal/records.md`: what's stored where, retention, who has access (Guri; `hrapi` service), backup location and key custody.
10. **Lawyer pack** `docs/legal/lawyer-pack.md`: one page listing the questions and attaching: privacy policy, collection notice, consent wording (both versions, with rendered example), terms, the three email templates, installer terms sheet, retention table. Questions to ask:
    1. Is the consent wording sufficient as express prior consent under the VEU code and FAQ, and as consent for disclosure for a benefit under the Privacy Act?
    2. Should Agenor be treated as a "scheme participant" under the VEU code when generating leads for an AP's installer, and what follows from that?
    3. Retention periods (§7.8) — right for ESC audit support, tax and APP 11.2?
    4. Overseas disclosure statement for the chosen mail/VPS providers.
    5. Is the "indicative discount" presentation compliant with the ACL?
    6. Installer agreement: liability, indemnity for installer misuse, dud policy.
    7. Any business-name registration needed for "Household Rebates".
11. **Gates**: after the lawyer review, Guri records `CONSENT_REVIEWED_BY` (lawyer name + date) and sets `legalReviewed: true` on privacy, terms, how-quotes-work and about. Add `site/scripts/check-legal.mjs` → fails the build in `RELEASE_MODE=launch` if any of those pages has `legalReviewed: false` or any `<<` placeholder remains anywhere in `dist/`.

## Acceptance checks

```bash
npm run build -w site                                 # expect: pass (RELEASE_MODE unset)
RELEASE_MODE=launch npm run build -w site; echo "exit=$?"
# expect: before review → exit≠0 with "legalReviewed false: privacy, terms, …"; after review → exit=0
grep -rn "<<" site/src/data/site.ts | wc -l           # expect: 0 after step 1
grep -c "paid" site/dist/privacy/index.html           # expect: ≥ 1 (fee disclosure present)
grep -c "oaic.gov.au" site/dist/privacy/index.html    # expect: ≥ 1
ls docs/legal/{installer-agreement-terms,data-breach-plan,records,lawyer-pack}.md   # expect: 4 files
node site/scripts/check-consent-hash.mjs              # expect: match
```

## What to test

Read the privacy policy against the OAIC's APP 1 checklist (APP 1.4 items) and tick each one in `docs/legal/lawyer-pack.md`.

## STOP — Guri must approve

Guri sends the lawyer pack (his choice of lawyer; this is the one likely paid item — needs his yes). The form cannot be enabled until he records the review and has at least one signed installer agreement.
