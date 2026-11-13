# Prompt 06 — Pages batch 2: area pages, how quotes work, FAQ, About, Sources

> Local only. Privacy and Terms come in prompt 12 (they need the lawyer step).

---

## Context

Household Rebates (Victoria-first VEU discount guide; Agenor Services Pty Ltd). Batch 1 pages are approved. Same writing rules as prompt 05: Australian English, answer block first, figures only via `<Money>`/`<FigureTable>`, no dollar amounts in titles, descriptions, FAQ answers or schema, no promises, never imply government status. The strategy says **no mass suburb pages**: only four area pages, and each must carry at least **four sourced, genuinely local facts** (`localFacts` in frontmatter, enforced by the schema). If you can't find four, don't publish that page — tell Guri.

## Goal

Eight pages: `areas/vic/melbourne.mdx`, `areas/vic/geelong.mdx`, `areas/vic/frankston.mdx`, `areas/vic/mornington-peninsula.mdx`, `pages/how-quotes-work.mdx`, `pages/faq.mdx`, `pages/about.mdx`, `pages/sources.mdx`.

## Page specs

### Area pages — `/victoria/{melbourne|geelong|frankston|mornington-peninsula}/`

- Title pattern: `Heating & Hot Water Rebates {Area} (VEU Guide)` · H1: "Energy upgrade discounts in {Area}".
- Answer (pattern, rewrite per area so they aren't clones): "Homes in {Area} can use the same Victorian Energy Upgrades discounts as the rest of Victoria for efficient reverse-cycle heating and heat pump hot water, applied by an accredited provider in your quote. {One genuinely local sentence, e.g. council program or the area's heating need, with source}. Talk to a provider before any work starts."
- `localFacts` (≥ 4, each with a `sourceId` you add to `content/sources/`). Acceptable kinds of fact — only if an official or primary page states it:
  - the council(s) covering the area and any council energy, electrification or "Upgrade" program for residents (council website);
  - housing stock or heating fuel mix, if the council, ABS or a Victorian government page publishes it;
  - climate: winter temperatures / heating need from the Bureau of Meteorology climate statistics for the nearest station;
  - gas distribution network for the area, only if the distributor's own site confirms coverage;
  - which signed installers cover the area's postcodes (only after prompt 14 — leave out at first).
- Body: local facts → the two discount tables (reuse `FigureTable`) → the 2027 hot water rule in one paragraph with a link → how to get quotes → form (`leadForm: either`) only when a signed installer covers those postcodes; otherwise `FormClosedNotice`.
- `postcodes`: list the postcodes you're targeting and the source you used (e.g. Australia Post or council list).
- `searchDemand`: Geelong 390/mo and Mornington 170/mo (Super SEO, 26 Sep 2026) — internal only, not rendered.
- Melbourne covers Greater Melbourne generally; don't list suburbs as keyword padding.

### How quotes and installers work — `/how-quotes-work/` (`howTo` frontmatter → HowTo schema)

- Answer: "You ask for a quote, and the installer named on the form contacts you the way you chose. They work with a VEU accredited provider, who checks your eligibility, includes any discount in a written quote and handles the paperwork. You don't have to go ahead, and we're paid a fee by the installer for each enquiry, not by you."
- HowTo steps (≥ 5, no costs): Check you're likely eligible → Send a quote request (you choose phone, email or a home visit) → The installer visits and sizes the system → You get a written quote with the discount applied → You decide; before a contract you're offered a statement of your rights → Installation and removal of the old system → The provider completes the paperwork and certificates.
- Section `#your-rights` (linked from the consent text): the VEU code of conduct applies to lead generation, sales, installation and follow-up (link esc-veu-code); unsolicited phone calls and doorknocking for VEU are banned without your express prior consent; you can withdraw consent any time; link the **VEET scheme consumer factsheet** (via energyvic-about-veu) and the ESC **consumer statement of rights** (esc-statement-of-rights); who to contact about a problem: the provider first, then the Victorian Energy Upgrades team (03) 9032 1310, energy.upgrades@deeca.vic.gov.au (from Energy Victoria's pages — re-check before publishing).
- Section "How we're paid": installers pay Agenor a fee per enquiry; we only send your details to the installer(s) named on the form; we don't sell lists; we don't call or doorknock.

### FAQ — `/faq/`

Visible `<Faq>` with 10–14 questions pulled from `faqs/` (tag `faq`), FAQPage schema. No dollar amounts in answers — link to the guide. Suggested questions: Is this a government website? · Who can apply the VEU discount? · Can I get the discount after installation? · Do renters qualify? · Does my house need to be a certain age? · Do I have to replace my working gas heater? · What happens to gas hot water from 1 March 2027? · Is LPG affected? · How many hot water systems can I upgrade? · Will someone call me? · How do I stop being contacted? · How do you make money? · How often are the figures checked?

### About — `/about/`

- Who: Household Rebates is run by Agenor Services Pty Ltd (ABN placeholder until prompt 12), Melbourne; written by Gurinder Singh. Short bio Guri supplies (ask him; don't invent credentials).
- `#how-we-are-paid` (linked from the independence bar): lead fees from installers; no fees from you; no influence on figures.
- Editorial method: figures only from official pages; every figure dated; monthly re-check; corrections email; AI may help draft, a person checks every number before publishing.
- Not a government website; not part of the VEU program.
- Contact: hello@ and privacy@ addresses (from `site.ts`).

### Sources — `/sources/`

- Generated from the `sources` collection: grouped by publisher, each with title, link, "checked {date}", "page updated {date}".
- Method section (same as About, shorter) and "Report a wrong figure" email link.
- List which pages use each source (computed from page frontmatter).

## Steps

1. Research local facts for each area; add each source to `content/sources/` (`official: true` only for government/council/BoM/ABS/distributor pages). Write `docs/area-research.md` with every fact, URL and quote.
2. Write the eight pages and the FAQ entries.
3. Update `RelatedLinks` so every area links the pillar, AC guide, heat pump guide and checker.
4. Add `docs/fact-check-batch-2.md` (same format as batch 1).

## Acceptance checks

```bash
npm run build -w site                    # expect: all postbuild checks pass
ls site/dist/victoria/{melbourne,geelong,frankston,mornington-peninsula}/index.html site/dist/{how-quotes-work,faq,about,sources}/index.html
# expect: 8 files (or fewer areas, each missing one explained in docs/area-research.md)
grep -c '"@type":"HowTo"' site/dist/how-quotes-work/index.html      # expect: 1
grep -c '"@type":"FAQPage"' site/dist/faq/index.html                # expect: 1
grep -c 'estimatedCost' site/dist/how-quotes-work/index.html        # expect: 0
grep -c 'id="your-rights"' site/dist/how-quotes-work/index.html     # expect: 1
grep -c 'id="how-we-are-paid"' site/dist/about/index.html           # expect: 1
```

Duplicate-content check: `npx -y jscpd --min-tokens 40 site/dist/victoria/{melbourne,geelong,frankston,mornington-peninsula}/index.html` — expect duplication only in shared template blocks (tables, form), not in the area-specific body.

## What to test

Open two area pages side by side: the first screen of each must say something the other doesn't.

## STOP — Guri must approve

Guri checks `docs/area-research.md`, `docs/fact-check-batch-2.md`, and supplies the About bio. Nothing is published here.
