# Lawyer Review Brief — Household Rebates (`householdrebates.com.au`)

**Client:** Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC  
**Contact:** Gurinder Singh (`info@householdrebates.com.au` / `privacy@householdrebates.com.au`)  
**Pre-review checklist:** See `docs/legal/legal-review-2026-11-15.md` (Venture Architect plain-English compliance review, 15 Nov 2026 — **not legal advice**).

## 1. What We Need Reviewed
Before we switch `PUBLIC_LEADS_ENABLED=true` / `LEADS_ENABLED=true` or `PUBLIC_ALERTS_ENABLED=true` / `ALERTS_ENABLED=true` on `householdrebates.com.au`, please review and sign off on five short documents in this repository:

1. **Form Consent & APP 5 Collection Notice wording (`CONSENT_TEMPLATE_V2`, `vic-rcac-v2` / `vic-hotwater-v2`):** `site/src/data/consent/vic-v1.ts` (mirrored in `api/src/consent.ts` and rendered in `site/src/components/LeadForm.astro`)
2. **Privacy Policy:** `site/src/content/pages/privacy.mdx`
3. **Website Terms of Use:** `site/src/content/pages/terms.mdx`
4. **Participating Installer Lead Supply Agreement:** `docs/installer-agreement-draft.md`
5. **Rule-Change Email Alerts Consent & APP 5 Notice (`alerts-v2`, separate from quote enquiries):** `docs/legal/alerts-consent-v1.md`

## 2. Specific Questions for Legal Sign-Off
1. **VEU Code of Conduct & Express Prior Consent:** Does our online consent block (`CONSENT_TEMPLATE_V2` in `site/src/data/consent/vic-v1.ts` and `LeadForm.astro`) satisfy all elements of "express prior consent" under the *Victorian Energy Efficiency Target Act 2007*, the VEU Code of Conduct, and ESC lead-generation guidance (naming the installer and accredited provider, separate checkboxes for phone / email / site visit, unbundled privacy notice, 3-month expiry, clear withdrawal mechanism)?
2. **Privacy Act Opt-In vs Small-Business Consent Exception:** Should Agenor Services Pty Ltd formally opt in under *Privacy Act 1988* (Cth) **s6EA** (which covers all of Agenor's business activities), or rely on the **s6D(7)** consent exception to "trading in personal information" — and how should `privacy.mdx` §1 (`<<PRIVACY_ACT_OPT_IN_OR_BASIS>>`) be worded if Agenor does not opt in?
3. **Cross-Border Storage & APP 8 ("Use" vs "Disclosure"):** Is our Hostinger International Ltd VPS (`<<SERVER_COUNTRY>>`, e.g. Malaysia — to be confirmed in hPanel) plus our transactional/alerts email service provider (`<<EMAIL_PROVIDER>>` in `<<EMAIL_PROVIDER_COUNTRIES>>`) an overseas "use" or "disclosure" under APP 8, and what contract/security terms must Hostinger and the email provider meet?
4. **Terms of Use Enforceability & Liability Cap:** Now that `terms.mdx` treats the website terms as notices rather than a browsewrap contract, is a liability cap in the Terms appropriate at all — and if so, how should it be worded so it is not an unfair contract term and does not cut across Australian Consumer Law consumer guarantees?
5. **Installer Lead Supply Agreement (`docs/installer-agreement-draft.md`) & Retention Schedule:**
   - Do the lead-fee, dud-lead, termination, and indemnity clauses adequately protect Agenor against installer misuse (such as contacting a customer after withdrawal/expiry or reselling an enquiry), and is Agenor treated as a "scheme participant" under the VEU Code of Conduct?
   - Does our 24-month retention period for the Consent Audit Record (and the wider retention schedule in `privacy.mdx` §6, plus automated-decision transparency in `privacy.mdx` §9 from 10 Dec 2026) match APP 11.2, *Spam Act 2003*, and ESC audit/record-keeping rules?
6. **Australian Consumer Law (ACL):** Do our disclaimers around official government figures vs clearly labelled `"our estimate"` figures (`<Money>` and `<FigureTable>`), our non-government independence notice, and our Eligibility Checker outcomes appropriately manage misleading/deceptive conduct risk under s18 and s29 of the ACL?

## 3. How Sign-Off Unlocks the Build Gate
Once reviewed (and after the 28 November 2026 Victorian state election re-check clears `electionWatch.status` from `"pending"` and all `<<...>>` placeholders are filled):
- Set `legalReviewed: true` in `site/src/content/pages/privacy.mdx` and `site/src/content/pages/terms.mdx` (and `alertsLegalReviewed: true` in `privacy.mdx` for email alerts).
- Set `PRIVACY_POLICY_VERSION`, `CONSENT_REVIEWED_BY`, `SERVER_COUNTRY`, `LEADS_EMAIL_PROVIDER_NOTE`, and (for alerts) `ALERTS_REVIEWED_BY` and `ALERTS_SENDER_ADDRESS` in `/etc/householdrebates/api.env`.
