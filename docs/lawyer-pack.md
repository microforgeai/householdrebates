# Lawyer Review Brief — Household Rebates (`householdrebates.com.au`)

**Client:** Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC
**Contact:** Gurinder Singh (`info@householdrebates.com.au`)

## 1. What We Need Reviewed
Before we switch `PUBLIC_LEADS_ENABLED=true` and `LEADS_ENABLED=true` on `householdrebates.com.au`, please review and sign off on four short documents in this repository:

1. **Form Consent & APP 5 Collection Notice wording:** `site/src/data/consent/vic-v1.ts` (and mirrored in `api/src/consent.ts`)
2. **Privacy Policy:** `site/src/content/pages/privacy.mdx`
3. **Website Terms of Use:** `site/src/content/pages/terms.mdx`
4. **Participating Installer Lead Supply Agreement:** `docs/installer-agreement-draft.md`
5. **Rule-Change Email Alerts Consent & APP 5 Notice (`alerts-v1`, separate from quote enquiries):** `docs/legal/alerts-consent-v1.md`

## 2. Specific Questions for Legal Sign-Off
1. **VEU Code of Conduct & Telemarketing/Doorknocking Bans:** Does our online consent block (`CONSENT_TEMPLATE_V1`) satisfy all elements of "express prior consent" under the *Victorian Energy Efficiency Target Act 2007* and ESC guidance (naming the installer and accredited provider, separate checkboxes for phone / email / site visit, 3-month expiry, clear withdrawal mechanism)?
2. **Privacy Act s 6D(4)(c) & Trading in Personal Information:** Because installers pay us a flat fee per enquiry, we treat Agenor Services Pty Ltd as covered by the Australian Privacy Principles (APPs). Does our consent wording and `/privacy/` policy satisfy APP 1, APP 3, APP 5, and APP 6?
3. **Retention Schedule (§5 of `/privacy/`):** Are our automated retention periods (30 days for `ip_hash`/`user_agent`, 12 months for customer contact details, 24 months post-expiry for the consent audit record, 7 years for non-personal tax delivery records) appropriate under APP 11.2 and ESC record-keeping rules?
4. **Australian Consumer Law (ACL):** Do our disclaimers around indicative Energy Victoria figures (`<Money>` and `<FigureTable>`) and our Eligibility Checker outcomes appropriately manage misleading/deceptive conduct risk under s 18 of the ACL?

## 3. How Sign-Off Unlocks the Build Gate
Once reviewed:
- Set `legalReviewed: true` in `site/src/content/pages/privacy.mdx` and `site/src/content/pages/terms.mdx`.
- Set `PRIVACY_POLICY_VERSION` and `CONSENT_REVIEWED_BY` in `/etc/householdrebates/api.env`.
