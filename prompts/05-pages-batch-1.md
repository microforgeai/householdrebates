# Prompt 05 — Pages batch 1: home pillar and the four Victoria guides

> Local only. Copy is drafted by you and **every figure and claim is checked by Guri against the linked official page before publish**.

---

## Context

Household Rebates explains Victorian Energy Upgrades (VEU) discounts and passes consented quote requests to installers who work with a VEU accredited provider. Templates, figure components and checks exist (prompts 02–04). Rules that apply to every page:

- Australian English, plain, short sentences, second person. No hype, no exclamation marks.
- Open with a 2–4 sentence answer (`answer` frontmatter → `AnswerBlock`). It must stand alone if quoted.
- **Dollar figures only through `<Money id>` / `<FigureTable group>`** — never typed. Every figure id used goes in the `figures` frontmatter list.
- Say "discount" (that's Energy Victoria's word for VEU), "indicative", "up to", "the accredited provider confirms". Never "you will get", "you qualify", "guaranteed", "free".
- Never imply we're the government or part of VEU. Name the official source in the text ("Energy Victoria lists …").
- Titles ≤ 60 chars, descriptions 70–160 chars, **no dollar amounts in either**.
- `checkedOn` / `updatedOn` = the day Guri checks the page; `author: Gurinder Singh`.
- Facts below were read from the official pages on 13 Nov 2026 (sources in `content/sources/`). Re-open each source while writing; if anything differs, stop and flag it.

## Goal

Five MDX pages that pass every build check: `pages/home.mdx`, `guides/vic/air-conditioner-rebate.mdx`, `guides/vic/heat-pump-rebate.mdx`, `guides/vic/gas-to-electric-hot-water-2027.mdx`, `guides/vic/reverse-cycle-vs-gas-heater.mdx`. Then delete `guides/vic/sample-test.mdx`.

## Page specs

### 1. Home — `/` (`pages/home.mdx`, `leadForm: either`)

- Title: `Victorian Energy Rebates for Heating and Hot Water` · H1: "Victorian energy upgrade discounts, explained"
- Answer (draft — keep the `<Money>` ids):
  > Victorian households can get an upfront discount on an efficient reverse-cycle air conditioner or heat pump hot water system through the Victorian Energy Upgrades (VEU) program. An accredited provider applies the discount in your quote, and the amount depends on what you're replacing: Energy Victoria lists up to `<Money id="vic-veu-rcac-ducted-gas-22kw"/>` for the largest heating case and `<Money id="vic-veu-hw-electric-to-heatpump"/>` for swapping an electric hot water system for a heat pump. Talk to a provider before any work starts, because retrospective discounts are typically not possible.
- Sections: What VEU is (certificates fund the discount; accredited providers are the only ones who can apply it) · Heating and cooling (link to guide) · Hot water (link) · The 1 March 2027 gas hot water rule (link) · Check if you're likely eligible (link to checker) · How quotes work and how we're paid (link) · Get a quote (form).
- Sources: energyvic-heating-cooling, energyvic-hot-water, energyvic-about-veu, energyvic-electrification.

### 2. Air conditioner rebate Victoria — `/victoria/air-conditioner-rebate/` (`leadForm: rcac`)

- Query: "air conditioner rebate victoria" (1,300/mo). Title: `Air Conditioner Rebate Victoria: 2026 Guide` · H1: "Air conditioner rebate in Victoria (VEU discount)"
- Answer:
  > Victoria's VEU program gives an upfront discount when an accredited provider installs an approved high-efficiency reverse-cycle air conditioner. Replacing a room gas heater with a split system has an indicative discount of `<Money id="vic-veu-rcac-room-room-gas"/>`, and replacing a ducted gas heater with a large ducted system is up to `<Money id="vic-veu-rcac-ducted-gas-22kw"/>`. The amount depends on what you remove, the system size and the certificate price, and the provider confirms it in your quote.
- Must include: eligibility (approved product; heats and cools; minimum 5-year warranty for homes; via an accredited provider or an installer working with one; if replacing a system the property must be more than 2 years old; rentals eligible but heating and cooling needs the landlord's approval) · both `FigureTable`s (`vic-veu-rcac-room-household`, `vic-veu-rcac-ducted-household`) · "Why the biggest numbers are rare" (the top figure is one specific case) · sizing: get the installer to visit and size the system; ask for heating and cooling capacity and outdoor noise in the quote (Energy Victoria's advice) · the timing rule callout (link to page 5) · renters from 1 March 2027 (broken heater → efficient RCAC in the main living area; efficient cooling at the start of a new lease) · FAQ (3–5, no dollar amounts).
- Sources: energyvic-heating-cooling, energyvic-about-veu, energyvic-electrification.

### 3. Heat pump rebate Victoria — `/victoria/heat-pump-rebate/` (`leadForm: hotwater`)

- Title: `Heat Pump Rebate Victoria: VEU Hot Water Discount` · H1: "Heat pump hot water rebate in Victoria"
- Answer:
  > Victorian homes replacing an existing hot water system with an approved heat pump can get an upfront VEU discount through an accredited provider. Energy Victoria lists `<Money id="vic-veu-hw-electric-to-heatpump"/>` when you replace an inefficient electric system and `<Money id="vic-veu-hw-gas-to-heatpump"/>` when you replace an inefficient gas one. You may also be able to combine it with a Solar Homes hot water rebate, for up to `<Money id="vic-hw-veu-plus-solar-homes"/>` in total.
- Must include: eligibility (existing system to replace; building at least 2 years old; approved product with minimum 5-year warranty; households up to 2 systems; rentals eligible) · `FigureTable group="vic-veu-hotwater-household"` · combining with Solar Homes (`vic-hw-veu-plus-solar-homes`, `…-local`) — say "if eligible" and link Solar Victoria, don't explain Solar Homes rules we haven't verified · minimum contribution `<Money id="vic-veu-min-contribution"/>` · sizing (too small → run out of hot water; link Energy Victoria's buyers guide) · heat pumps and cold weather (Energy Victoria says they're designed to work in cooler temperatures) · link to the 2027 rule · FAQ.
- **Do not** say "up to $630 off any heat pump" — $630 is the electric-replacement figure; gas replacement is $560.

### 4. Gas to electric hot water from 1 March 2027 — `/victoria/gas-to-electric-hot-water-2027/` (`leadForm: hotwater`)

- Title: `Gas Hot Water Ban Victoria 2027: What Changes` · H1: "Gas to electric hot water from 1 March 2027"
- Answer:
  > From 1 March 2027, if a mains gas water heater in an existing Victorian home needs replacing, it generally has to be replaced with an electric system such as a heat pump, not another gas unit. You don't have to replace a gas system that still works, and gas cooking and heating in owner-occupied homes aren't affected. Some exemptions apply, and LPG isn't covered by the rule.
- Must include: what's changing (Plumbing Regulations, 1 March 2027; includes gas pool heaters) · who's affected (owner-occupiers; rental providers with stricter rules — a broken, unrepairable water heater must be replaced with an efficient electric one such as a heat pump or electric-boosted solar) · what isn't changing (working systems, repairs, gas cooking and space heating for owner-occupiers; new homes are a separate 1 Jan 2027 rule) · exemptions: list **only** what the Gazette notice confirms (main switchboard or distribution board alteration needed; existing gas unit that doesn't need an electricity connection can be replaced like-for-like; replacement during the warranty period) and say "other exemptions are listed in the Plumbing Regulations — check with a licensed plumber"; mark anything else as unverified and leave it out until Guri has read reg 45E · plan before it fails (check space, switchboard, quotes) · discount: gas → heat pump `<Money id="vic-veu-hw-gas-to-heatpump"/>`; Energy Victoria's estimate that replacing gas hot water with electric saves around $400 a year → add it as a figure first (`vic-electrify-hw-saving`, source energyvic-electrification, qualifier `about`, max 400) and use `<Money>` · FAQ.
- Sources: energyvic-electrification, energyvic-hot-water, vicplanning-gas-roadmap, vic-gazette-s654-2025.

### 5. Reverse-cycle vs gas heater: the timing rule — `/victoria/reverse-cycle-vs-gas-heater/` (`leadForm: false`, link to checker)

- Title: `Reverse Cycle vs Gas Heater: When to Switch (Vic)` · H1: "Reverse-cycle vs gas heater: the timing rule"
- Answer:
  > To get a VEU discount on a reverse-cycle air conditioner, an accredited provider (or an installer working with one) has to be involved before any work starts, because retrospective discounts are typically not possible. The larger discounts are for replacing an existing gas or electric heater, which is removed or decommissioned as part of the job. Owner-occupiers don't have to replace a working gas heater, but from 1 March 2027 a broken heater in a rental home must be replaced with an efficient reverse-cycle air conditioner.
- Must include: the timing rule (quotes and paperwork before purchase/installation; own installer must work with an accredited provider before work starts) · what "decommissioning" means and why the discount depends on it (compare `vic-veu-rcac-room-room-gas` with `vic-veu-rcac-room-no-decommission`) · when switching makes sense (heater near end of life; adding cooling anyway; renters/rental providers from 2027) · when it may not (system still good; no space for outdoor unit — say "ask the installer") · bills: Energy Victoria's "save up to $460 a year" (room gas → RCAC) and "up to $1,140 a year" (ducted) — add as figures (`vic-rcac-saving-room-gas`, `vic-rcac-saving-ducted-gas`, source energyvic-heating-cooling) and render with `<Money>` · link to checker and AC guide.

## Steps

1. Add the three new figures (`vic-electrify-hw-saving`, `vic-rcac-saving-room-gas`, `vic-rcac-saving-ducted-gas`) to `figures/vic-veu.yaml` after re-checking the source pages. Update the expected count in `check-figures` output (now 24).
2. Write `faqs/*.yaml` entries for the pages (answers without dollar amounts; link to the guide for figures).
3. Write the five MDX pages per spec. Each gets `sources`, `figures`, `faq`, `related`, `checkedOn`, `updatedOn`, `publishedOn`.
4. Delete `guides/vic/sample-test.mdx`.
5. Produce `docs/fact-check-batch-1.md`: a table per page of every factual sentence → source URL → the exact quote from the source that supports it. Guri uses this to check.

## Acceptance checks

```bash
npm run build -w site     # expect: all postbuild checks pass; 0 problems
ls site/dist/index.html site/dist/victoria/{air-conditioner-rebate,heat-pump-rebate,gas-to-electric-hot-water-2027,reverse-cycle-vs-gas-heater}/index.html
# expect: 5 files
grep -L "data-answer" site/dist/victoria/*/index.html site/dist/index.html     # expect: no output
grep -l "630" site/dist/victoria/gas-to-electric-hot-water-2027/index.html     # expect: no output (gas page uses $560)
for f in site/dist/index.html site/dist/victoria/*/index.html; do grep -o '<title>[^<]*' $f; done | grep -E '\$[0-9]' # expect: no output
test ! -e site/dist/victoria/sample-test && echo "sample removed"               # expect: sample removed
```

## What to test

- Read each page on a phone width. The answer block is visible without scrolling.
- Every `<Money>` shows a working source link (`node site/scripts/check-sources.mjs` → all 200).
- Ask an AI model (fresh chat) "summarise this page" with the page text: its summary must not contain a promise of a discount.

## STOP — Guri must approve

Guri reads `docs/fact-check-batch-1.md` and the five pages and either approves or lists fixes. Nothing is published in this prompt.
