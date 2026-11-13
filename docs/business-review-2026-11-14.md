# Household Rebates: business review, 14 Nov 2026

**Prepared by:** Venture Architect, for Guri and Indie Builder
**Scope:** the full local crawl (`site-crawl-2026-11-14.json`, 52 pages), checked against live official sources on 14 Nov 2026 (Melbourne time).
**Conventions:** AUD. VEU co-payments are quoted as Energy Victoria states them, *including GST*. Revenue figures are ex-GST. Anything not taken from a cited source is marked **[Assumption]**.
**Not duplicated here:** `postcodes.csv` (postcode and corridor coverage) and `eligibility-checker-spec.md` (the cascading Residential/Business checker) belong to another worker. This review points to that work and adds to it.

---

## 0. Summary

- **The figures are in good shape.** The $3,000 ducted co-payment (VEU Spec v25.0, from 30 Sep 2026) appears everywhere it should. The old $1,000 figure only appears as a "before 30 Sep" reference. The $150,000 Solar Homes income cap, $560 gas-to-heat-pump, $630 electric-to-heat-pump and the 2027 rental standards all match the official pages I opened today. I found no wrong dollar figure.
- **Biggest risk: the 28 Nov 2026 state election.** No page mentions it, and none mentions the caretaker period that has frozen official sites since 3 Nov. The Coalition and One Nation have pledged to repeal the gas rules (ABC, Rewiring Australia). The site's main hook, the 1 March 2027 gas hot water rule, could be reversed within weeks.
- **Biggest trust and ACL risk: unlabelled headline numbers.** Every page has a large hero figure with no caption. Examples: "$630 to $1,610", "$200", "more than $750" (a plumbing-certificate threshold, not a rebate) and "17.5%". A reader can easily take these as "what I'll get".
- **Biggest coverage gap: businesses.** VEU business discounts are larger than household ones but get almost no coverage. Commercial ducted gas to 56 kW ducted is up to $8,820. LED street lighting is up to $21,350. Cold rooms are $420–$4,620 and motors up to $2,380. The checker asks "home or business" and then applies household rules.
- **Biggest monetisation reality check.** SEC's Easy Electric is free, state-owned and matches households with endorsed installers. Lead-fee benchmarks are modest: SolarQuotes charges installers $35 ex GST for a heat pump hot water lead and $60 for solar. The lead-fee model still works, but only at small scale. An owned email list and business leads matter more than I had previously weighted them.
- **Verdict: GO, with a pivot in emphasis and a hold on spending until after 28 Nov.** Details are in section 8.

---

## 1. Accuracy

### 1.1 Checked against official sources (all match)

| Claim on site | Official source checked today | Status |
|---|---|---|
| Ducted RCAC minimum co-payment at least $3,000 incl GST from 30 Sep 2026 (was $1,000). Multi-split ≥10 kW $3,000; multi-split <10 kW $1,000; single split <10 kW $200 | Energy Victoria, Industry specifications: "VEU Specifications Version 25.0 comes into effect on 21 July 2026 … minimum co-payments for Part 6 … applicable from 30 September 2026" https://www.energy.vic.gov.au/victorian-energy-upgrades/installers/industry-specifications | ✅ Correct on all 11 pages that show it |
| Room gas heater to split $630–$1,610; ducted gas to 22.4 kW up to $5,530; savings up to $460 and $1,140 a year | https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts (page updated 29/10/26) | ✅ |
| Gas to heat pump $560; electric to heat pump $630; solar-boosted $910 (electric) / $700 (gas); $200 hot water co-payment | https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts (updated 26/10/26) | ✅ |
| Solar Homes income cap $150,000 from 1 Jul 2026 (was $210,000); property under $3m; hot water rebate up to $1,000 ($1,400 locally made); PV up to $1,400 plus matching interest-free loan | https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance ; https://www.solar.vic.gov.au/hot-water-rebate (updated 9 Nov 2026); https://www.solar.vic.gov.au/solar-panel-rebate | ✅ |
| Solar PV support moves into VEU from 1 Jul 2027 | https://www.solar.vic.gov.au/solar-support-continue-through-victorian-energy-upgrades-program (21 Oct 2026) | ✅ (on /victoria/veu-vs-solar-homes/ only) |
| Rental standards: from 1 Mar 2027 (insulation R5.0 at new lease where none, 4-star showerheads, cooling at new lease, heater and hot water replaced with efficient electric on failure); draught-proofing from 1 Jul 2027; cooling for all rentals from 1 Jul 2030 | Consumer Affairs Victoria, last updated 21 Oct 2026: https://www.consumer.vic.gov.au/resources-and-tools/legislation/public-consultations-and-reviews/new-minimum-energy-efficiency-standards | ✅ |
| Solar for Apartments up to $2,800 per apartment and $140,000 per building; expansion removes the median value limit | https://www.solar.vic.gov.au/expanding-solar-savings-more-victorians (up to 150 lots, up from 50) | ✅ The site sensibly tells readers to check lot rules |
| Cold-call and door-knock bans (1 May 2024 / 1 Aug 2024; "express prior consent") | https://www.esc.vic.gov.au/victorian-energy-upgrades/updates-reports-reviews-and-data/updates-veu-program/cold-call-telemarketing-and-doorknocking-bans-under-victorian-energy-upgrades-program | ✅ |

### 1.2 Stale, missing or risky items

Ranked by impact. Effort: S = under 1 hour of build, M = half a day, L = more.

| # | Issue | Pages | Impact | Effort |
|---|---|---|---|---|
| A1 | **No election or caretaker notice.** Energy Victoria shows a banner: "The State election will be held on Saturday 28 November 2026. During the caretaker period (starting 6 pm on Tuesday 3 November 2026) content will only be added … in line with the caretaker conventions." The Coalition "pledged to repeal Labor's ban on gas in homes" (ABC policy tracker, 4 Nov 2026: https://www.abc.net.au/news/2026-11-04/victoria-2026-election-policy-promise-tracker/107247200). Rewiring Australia reports Liberals, Nationals and One Nation "promised to scrap … all new homes to be built all-electric from Jan 2027 and … roll back … replacing failing gas hot water systems" (https://rewiringaustralia.org/blog/victorian-greens-back-rewiring-australias-election-priorities-for-getting-homes-off-gas-and-going-electric). Pages currently state the 2027 rules as settled. | /, /victoria/, /victoria/gas-to-electric-hot-water-2027/, /victoria/new-homes-all-electric-2027/, /victoria/gas-hot-water-broken-before-or-after-march-2027/, /victoria/gas-hot-water-ban-exemptions/, /victoria/landlords-rental-standards-2027/, /victoria/get-off-gas-planner/, /victoria/renters/ | High | S |
| A2 | **Hero numbers have no label** (see the table below). "$750" on the upgrade-time page is a plumbing compliance-certificate threshold shown as if it were a headline saving. On /victoria/heat-pump-rebate/, the hero shows "$630" (electric), while most searchers have gas and would get $560. On /victoria/veu-minimum-co-payment/, the "$200" hero is a payment the customer must make, not a discount. ACL s18 misleading-impression risk. | 44 of 52 pages | High | S |
| A3 | **20 kW multi-split cap missing.** From 30 Sep 2026, residential multi-split incentives are calculated on at most 20 kW. Larger systems can be installed but earn no extra VEECs (DEECA proposal reported by HVAC&R News https://hvacrnews.com.au/regulations/changes-planned-for-heating-and-cooling-incentives/; confirm against VEU Spec v25.0 Part 6 before publishing). Not mentioned anywhere. | /victoria/ducted-gas-to-split-systems/, /victoria/air-conditioner-rebate/, /victoria/veu-minimum-co-payment/ | Med | S |
| A4 | **Two official "combined" hot water figures disagree.** Energy Victoria says "up to $1,560 … a further $400 … up to $1,960". Solar Victoria says "up to $1,960 … locally made or up to $1,630 … another system". /victoria/can-you-claim-veu-twice/ uses $1,560. Show both, each with its source, and explain the gap rather than picking one. | /victoria/can-you-claim-veu-twice/, /victoria/heat-pump-rebate/, /victoria/gas-hot-water-to-heat-pump/ | Med | S |
| A5 | **The 45-day stale-figure build check will fail around 28 Dec 2026** (all figures were checked 13 Nov). That's fine as a safeguard, but plan a full re-verification between 30 Nov and 5 Dec, once caretaker ends and the post-election pages update. | Site-wide | Med | S (process) |
| A6 | **Raw paths in visible text.** 27 pages show paths such as "see our guide on /victoria/reverse-cycle-vs-gas-heater/" as plain text, often pointing at the page itself. These come from the shared FAQ answers. Full list in Appendix A. No `[[KEY]]`, `{{ }}`, "undefined" or "NaN" tokens were found. | 27 pages | Med | S |
| A7 | **Copy defects.** /victoria/veu-minimum-co-payment/ says "at least at least $3,000 (including GST) … including GST" (doubled words and doubled GST). /victoria/eligibility-checker/ ends with "Not sure which scenario applies? Try our Victoria VEU Eligibility Checker first", which links to itself (also on 6 other pages with the same block). The /terms/ title repeats the brand: "Website Terms of Use \| Household Rebates \| Household Rebates". | 3+ pages | Low | S |
| A8 | **Council programs that have changed since the map was written.** Yarra Energy Foundation went into voluntary administration in Oct 2026 (ASIC notice published 10/11/2026: https://publishednotices.asic.gov.au/browsesearch-notices/notice-details/Yarra-Energy-Foundation-Limited-145846091/9a9eec12-cf56-4205-b156-d05873660128). **Hume Home Energy Upgrades is paused**: no solar, battery, RCAC, heat pump or induction quotes; insulation and draught-proofing continue only for registrations before 19 Oct 2026 (https://humeenergyupgrades.org.au/). Darebin's equivalent is also paused (https://www.darebinenergyupgrades.org.au/special-message/). The Macedon Ranges heat pump bulk buy closed to enquiries on 31 Oct; installs end 30 Nov 2026 (https://www.t2zero.com.au/bulk-buy). Not on the site yet, but it matters for the Sunbury/Diggers Rest/Gisborne corridor pages in the postcode plan, so they must not promote these as open. | Future corridor pages | Med | S |
| A9 | **Shepparton** is in `url-map.csv` but missing from the crawl. | /victoria/shepparton/ | Low | M |

**Hero numbers that need a caption** (taken from the crawl):

| Page | Hero shows | What it actually is |
|---|---|---|
| /, /victoria/air-conditioner-rebate/, /victoria/eligibility-checker/, /victoria/melbourne/, /victoria/geelong/, /victoria/frankston/, /victoria/gas-room-heater-to-split-system/, /victoria/reverse-cycle-vs-gas-heater/, /victoria/landlords-rental-standards-2027/ | $630 to $1,610 | Room gas heater → one split system (3–9 kW) |
| /victoria/heat-pump-rebate/, /victoria/mornington-peninsula/, /victoria/electric-hot-water-to-heat-pump/ | $630 | Electric → heat pump only (gas → heat pump is $560) |
| /victoria/veu-minimum-co-payment/ | $200 | Minimum **customer payment**, not a discount |
| /victoria/how-long-does-an-upgrade-take/ | more than $750 | Plumbing work value that triggers a compliance certificate |
| /victoria/casey/ | up to $200 | Casey Council DIY draught-proofing rebate |
| /victoria/bendigo/, /victoria/solstice-gas-shutdown-towns/ | $600 | Solar Victoria top-up for Solstice customers who don't qualify for VEU hot water |
| /victoria/concession-card-holders/ | 17.5% | Annual Electricity Concession rate |
| /victoria/what-is-a-veec/ | $70 | Certificate price Energy Victoria assumed for the induction figure |
| /victoria/veu-vs-solar-homes/ | $150,000 | Solar Homes income cap |
| /victoria/new-homes-all-electric-2027/ | $70 to $140 | Split system with no heater decommissioned |

---

## 2. Customer coverage gaps

Ranked by impact over effort.

| Rank | Segment | What the site has now | Verified facts to build on | Recommendation | Impact / Effort |
|---|---|---|---|---|---|
| 1 | **Small business and commercial** | Checker Q4 "Home or Business", then household rules. "business" appears on 12 pages, mostly legal ones. | Energy Victoria: "All Victorian households and businesses are eligible for a heating and cooling discount". Business tables: non-ducted gas → split $420–$1,050; ducted gas → 56 kW ducted up to $8,820; central electric ducted up to $4,060 (https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts). Lighting $1,260 / $3,150 / $21,350 examples; indoor lighting now limited to fluorescent replacements (https://www.energy.vic.gov.au/victorian-energy-upgrades/products/lighting-discounts). Cold rooms $420–$4,620 (https://www.energy.vic.gov.au/victorian-energy-upgrades/products/cold-room-discounts). Motors up to $2,380, pre-rinse valves up to $210, commercial solar 30–200 kW (https://www.energy.vic.gov.au/victorian-energy-upgrades/products). Commercial heat pump hot water: Part 44; "minimum contribution of $200 … and $10,000 for larger commercial and industrial upgrades" (hot water page). Small businesses can save "up to $500" a year, larger ones "up to $74,000" (https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses). The full activity list, residential versus non-residential, is on the ESC site: https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/overview-veu-activities | A /victoria/business/ hub plus 4 pages: heating & cooling for business, LED lighting (fluorescent only), cold rooms & refrigeration (cafes, butchers, grocers), commercial heat pump hot water & motors. The checker's business branch (per `eligibility-checker-spec.md`) should land on these pages. **Note:** the largest energy users are excluded unless they opt in, and the ESC keeps a register of exempt addresses. | High / M |
| 2 | **Farms** | Nothing | Business VEU activities apply to farm sheds, cool rooms, motors and pumps (see above). Separately: the **On-Farm Energy and Electrification Demonstration Program**, $5m, grants of $200,000–$750,000, closes 11 Dec 2026 (https://business.gov.au/grants-and-programs/onfarm-energy-and-electrification-demonstration-program-vic). That grant is for large demonstration projects, so it isn't a household-style lead. | One "Farms and rural businesses" page under the business hub: cold rooms, motors, pumps, commercial solar, plus the grant as a news item. **Honest view:** low volume and few leads, but it's cheap to add, matches regional coverage and suits AI answers. | Med / S |
| 3 | **North-west growth corridor (Guri's area)** | Nothing on Sunbury, Diggers Rest, Gisborne or Macedon | From `postcodes.csv` (VEU Table A): 3427 Diggers Rest is Metropolitan/Mild (93% Melton, 7% Hume); 3429 Sunbury is Metro/Mild (Hume); **3437 Gisborne and 3442 Woodend are Regional/Cold**, which gets the higher insulation example (up to $2,100 against $1,500 in Melbourne); **3430 Clarkefield has no reticulated gas** (LPG). Hume's council program is paused (A8). | Owned by the postcode worker. Add to their brief: (a) put the regional/cold insulation difference at the top of the Gisborne/Macedon page; (b) state that the Hume program is paused and point to VEU, Easy Electric and the official provider lists; (c) cover new-build estates (see row 6). | High / M |
| 4 | **LPG and off-gas homes** | LPG appears on 15 pages, mostly "bottled LPG isn't affected by the 2027 rule" | The ESC activity list says Part 3 covers "decommissioning a gas or LPG water heater"; Energy Victoria tells LPG homes to confirm with the provider. Room heaters: Energy Victoria's definition of non-ducted gas heaters includes "natural gas or LPG". | A /victoria/lpg-homes/ page: LPG cylinder costs versus heat pump (running costs as assumptions or cited), VEU eligibility, regional postcodes with `reticulated_gas = No` from `postcodes.csv`. Strong for regional searches and AI answers. | Med / S |
| 5 | **Multicultural households** | Wyndham mentions council webinars in 6 languages. No page links official translations. TIS 131 450 appears only on the scams page. | **Energy Victoria's** translations page has the VEU consumer-rights factsheet in 13 languages, including Arabic, Chinese (Simplified and Traditional), Filipino, Hazaragi, Hindi, Khmer, Punjabi, Sinhalese, Turkish and Vietnamese (https://www.energy.vic.gov.au/households/translations). **Solar Victoria** has Solar Homes summaries in 15 languages, including Hindi, Punjabi, Simplified and Traditional Chinese, Vietnamese, Tamil and Sinhalese (https://www.solar.vic.gov.au/community-languages). ECCV publishes a go-electric brochure in 11 languages (https://eccv.org.au/projects/empowering-multicultural-communities-at-home/). | A /victoria/help-in-your-language/ page linking the official translations and TIS 131 450, plus a footer link. Later: a short Punjabi and Hindi summary page, **reviewed by a fluent human**, not machine output. Scams hit these communities hard, so link the translated consumer-rights factsheet. Low cost and a real trust differentiator. | Med / S |
| 6 | **New homes under 2 years and new-build buyers** | /victoria/new-homes-all-electric-2027/ (3 inbound links) | VEU replacement discounts need a property "more than 2 years old" (heating page). The Solar Homes PV rebate is available for homes under construction (solar-panel-rebate page). **Solar Victoria Residential Electrification Grants**: approved providers include Metricon, Henley and Six Star Plus, offering up to $1,400 for PV and $1,400 for hot water, aimed at first-home buyers (https://www.solar.vic.gov.au/electrification-grants). | The checker should route "built in the last 2 years" to this page (spec). Add an "I'm building in a growth estate" section covering the PV rebate while under construction, builder programs and the 2-year rule. Relevant to Diggers Rest, Wyndham and Melton estates. | Med / S |
| 7 | **Seniors** | Concession page; scams page | Energy Assistance Program and concessions are already cited. The VEU cold-call ban applies. | No new page. Add a "Seniors: avoid pressure sales" box on the scams and concession pages, linking the translated consumer-rights factsheet. | Low / S |
| 8 | Renters / landlords / owners corporations | Good pages already exist | Rental standards verified (1.1). | Add the Greens' renter voucher pledge only as clearly labelled "election promise", or not at all (it's not policy). | Low / S |

---

## 3. Programs and offers not covered yet

| Program | Verified status (source) | Fit for the site | Rank |
|---|---|---|---|
| **Federal Cheaper Home Batteries** | About 30% discount on 5–100 kWh batteries through STCs. STC factor 6.8 per kWh for May–Dec 2026, **5.7 from 1 Jan 2027**, then lower every 6 months to 2030. Taper: 100% up to 14 kWh, 60% for 14–28 kWh, 15% for 28–50 kWh. The installation date sets the rate (https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries). Finder reports Treasury is weighing further cuts (https://www.finder.com.au/news/is-the-federal-home-battery-rebate-being-cut); treat that as unconfirmed. | High intent and a hard deadline: "install before 31 Dec". The niche is crowded (SolarQuotes, Finder). Build one page, /victoria/battery-rebate/, on the VEU + Solar Homes + federal stack. Don't build a battery sub-site. This is also where the parked householdbattery.com.au idea should live. | 1 |
| **Solar PV: Solar Homes now, VEU from 1 Jul 2027** | Rebate up to $1,400 plus optional matching interest-free loan; $150k cap; $3m property cap; rentals and homes under construction eligible (solar-panel-rebate page). Moves to a VEU activity from 1 Jul 2027 (Solar Victoria, 21 Oct 2026). | A /victoria/solar-panel-rebate/ page with a "what changes on 1 Jul 2027" section. Only one page covers this now. | 2 |
| **Midday Power Saver** | From 1 Oct 2026: 3 hours of free electricity, 11am–2pm daily, opt in through your retailer (https://www.energy.vic.gov.au/households/save-energy-and-money/victorian-midday-power-saver). | Strong hook: "run your heat pump hot water from 11 to 2". Add to /victoria/gas-vs-heat-pump-running-costs/ and the heat pump guides. Not mentioned anywhere now. | 3 |
| **SEC Easy Electric** | Free website and tool: savings estimates, quotes from SEC-endorsed installers who contact you "within one business day"; Customer Advisory Team 1300 305 700 (https://www.secvictoria.com.au/households/help-centre/easy-electric-sec-online-tool/easy-electric-sec-faqs). | Already mentioned on 5 pages. Add an honest **"Household Rebates vs Easy Electric"** comparison: SEC for an endorsed-installer quote; us for independent explanations, business coverage, regional and LPG detail, and language help. Hiding it would cost trust. | 4 |
| **Other VEU household discounts** | Window glazing up to $210 per 10 m², heat pump dryer up to $70, shower head up to $70, fridge or freezer up to $70, in-home display up to $70, TV up to $70 (https://www.energy.vic.gov.au/victorian-energy-upgrades/products). | One "Other VEU discounts" page. Low value each, but it completes the topic for AI answers. | 5 |
| **Green loans** | CommBank home energy upgrade loan; Bank Australia Clean Energy Personal Loan; ING Green Upgrade Loan; Brighte (search snapshot 14 Nov 2026, https://www.commbank.com.au/personal-loans/home-energy-upgrades.html, https://www.bankaust.com.au/banking/personal-loans/clean-energy-personal-loan, https://brighte.com.au/homeowners/heuf-discounted-green-loan). Rates change often, so **don't publish rates without re-checking**. Good Shepherd No Interest Loans was a Hume program partner. | A "How to pay for it" page: Solar Homes interest-free loan first, then no-interest loans, then bank green loans. **Credit risk:** stay factual and general. Recommending specific credit products or taking commissions can bring in credit-licensing rules. Get legal advice before monetising (see 4.4). | 6 |
| **Council bulk-buys** | Hume paused, Darebin paused, Macedon Ranges bulk buy closing (A8); Casey DIY draught rebate up to $200 (already covered). | Cover these only inside location pages, with a "status checked" date. Volatile, so don't build standalone pages. | 7 |
| **Energy retailer offers** | Victorian Energy Compare is the official free comparator (linked from Solar Victoria). Specific retailer heat pump offers were **not verified**. | Link Victorian Energy Compare. See 4.3 for affiliate options. | 8 |
| **EV chargers** | No Victorian household EV charger rebate found. Solar Victoria's EV page only gives guidance: chargers cost "$500 to $2,000 for a level 1 charger, excluding installation" (https://www.solar.vic.gov.au/getting-your-home-ev-ready). | **Weak.** At most one FAQ ("Is there an EV charger rebate in Victoria? No, but…"). | 9 |
| **Pool heat pumps** | Not on Energy Victoria's current product list. Pool *pumps* (activity 26) are listed by the ESC as an activity but have no current consumer discount page. | **Drop**, or one FAQ saying no current VEU discount. | 10 |
| Super funds | No credible super-fund offer for home energy upgrades found. | Drop. | n/a |

---

## 4. Monetisation

All revenue is **[Assumption]** unless a benchmark is cited. Ex-GST.

### 4.1 Benchmarks found

- **Shared lead marketplace pricing** (SolarQuotes, charged to installers, ex GST): residential solar $60, batteries $55, EV charger $30, **hot water heat pump $35**, commercial solar $185, plus $5 for each extra product. Leads are shared with up to 3 installers (https://www.solarquotes.com.au/join-our-network/).
- **Energy-switching affiliates** (Commission Factory): Econnex AU$70 per sale, "$50–$200 per approved switch", 90-day tracking; AGL AU$50 per energy signup (https://www.commissionfactory.com/advertiser-directory/econnex-affiliate-program/58818 ; https://www.commissionfactory.com/advertiser-directory/agl-affiliate-program/88218).
- **Free competitor:** SEC Easy Electric charges households nothing. **Whether SEC charges its endorsed installers was not verified.**

### 4.2 Lead model against Easy Electric

**[Assumption] scenario at month 12, households only:**

| | Low | Mid | High |
|---|---|---|---|
| Organic sessions per month | 500 | 2,000 | 6,000 |
| Start checker | 15% | 15% | 15% |
| Finish checker | 60% | 60% | 60% |
| Opt in to a named-installer quote | 8% | 10% | 12% |
| Leads per month | 4 | 18 | 65 |
| Installers per lead (named, max 3) | 1.5 | 2 | 2 |
| Fee per installer, benchmark-anchored | $35 | $40 | $50 |
| **Revenue per month** | **≈$210** | **≈$1,440** | **≈$6,500** |

**Reading:** the low and mid cases are side income, not a business. The high case needs top-3 rankings for "heat pump rebate victoria"-type terms, which I couldn't size: the Ahrefs plan doesn't include Keywords Explorer, so **search volumes are unverified**. Use Search Console data once the site is live.

**Against Easy Electric:** we don't win on price, since both are free to households. We can win on (1) explanation and trust, (2) cases SEC doesn't serve well (business, LPG, regional, language), and (3) installers who aren't SEC-endorsed and want leads. **Weakness:** if SEC's network grows, local installers have less reason to pay.

**Compliance (lead model):**
- **VEU Code and the cold-calling ban.** An installer may only phone a consumer with *express prior consent* naming the business that will call. Accredited persons must keep written consent records (ESC page above), and they are responsible for their lead generators. The form must name the installer and their accredited provider. The About page already promises this; keep it.
- **APP 5.** Collection notice at the form. Agenor is caught by the Privacy Act even as a small business, because it **trades in personal information** (OAIC: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/trading-in-personal-information).
- **ACL s18/s29.** Don't say "free install", "government rebate" or "approved by the government". Disclose that installers pay for enquiries (already on every page).

### 4.3 Revenue lines ranked

| Rank | Line | Revenue logic | Compliance risk | Verdict |
|---|---|---|---|---|
| 1 | **VEU accredited-provider partnerships** (lead fee paid by the AP or its partner installer) | Same maths as 4.2. APs are the businesses that actually create VEECs. Energy Victoria lists dozens of APs per region for heating and cooling (heating page). Fewer counterparties and cleaner accountability. | The AP carries VEU Code liability for lead generation, so expect them to ask for consent records and audit rights. Store consent evidence (who, what, when, named business). | **Primary**, once the lawyer has reviewed the agreement |
| 2 | **Business leads** | Benchmark: commercial solar $185 per lead (SolarQuotes). **[Assumption]** VEU business leads (lighting, cold rooms, commercial HVAC) at $100–$250 because job values are higher (official business discount examples up to $8,820 for HVAC and $21,350 for street lighting). Volume is low: **[Assumption]** 2–10 a month at the mid case, so ≈$200–$2,500 a month. | Same as above. Businesses are "consumers" under the ESC bans too. B2B email is still covered by the Spam Act. | **Add.** Best value per lead. |
| 3 | **"Rules are changing" email alerts** | No direct revenue at first. It's an owned audience that loses no value if Google traffic falls. Hooks: election result (28 Nov), battery STC drop (1 Jan 2027), gas rule (1 Mar 2027), PV into VEU (1 Jul 2027). **[Assumption]** 2–4% of visitors sign up. Later, a labelled sponsor slot. | **Spam Act:** consent, sender identification and a working unsubscribe (ACMA: https://www.acma.gov.au/avoid-sending-spam). APP 5 notice. **Don't share the list with installers** without separate, specific consent. | **Start before 28 Nov.** Cheap, and the timing is right. |
| 4 | **Sponsored installer directory** | **[Assumption]** $49–$149 a month per listing per region. Needs traffic first. | ACL: label "Sponsored", don't imply ranking by quality or government endorsement, and verify AP status on the official list. Some conflict with the "independent" claim, so disclose prominently. | **Later** (after 6+ months of traffic) |
| 5 | **Energy-plan affiliates** (Econnex $70, AGL $50) | **[Assumption]** 0.2–0.5% of running-cost page visitors switch, so at 2,000 sessions ≈$30–$70 a month. | Must also show the free government comparator, Victorian Energy Compare. Disclose commissions. Conflicts with being "independent". | **Weak.** Optional, low priority. |
| 6 | **Product affiliates** (DIY draught-proofing kits, linked to Casey's $200 DIY rebate) | Small. Commission rates **not verified**. | ACL; disclose. | **Weak.** Skip unless there's spare effort. |
| 7 | **Green-loan referrals** | Not modelled. | Credit-licensing risk for recommending credit products or taking referral fees (NCCP Act). Needs legal advice. | **Don't monetise** for now. Content only. |

### 4.4 Compliance checklist for Indie Builder and the lawyer

1. Every form names the installer and its AP, has an unticked consent box and an APP 5 notice, and stores a consent record (who, what, when, named business, IP address, form version). Records are kept as long as the AP agreement requires. The ESC guideline sets AP duties; the lawyer should confirm the retention period and consent expiry.
2. Email capture uses double opt-in, a separate consent purpose ("rule-change alerts only") and an unsubscribe link in every email.
3. No figure is shown without a label and the source date (A2).
4. "Sponsored" and "Affiliate" labels sit above the fold wherever they apply.
5. Election-sensitive pages carry "currently legislated; subject to change after 28 Nov" wording until re-verified.

---

## 5. Conversion and trust

| Area | Finding | Recommendation | Impact / Effort |
|---|---|---|---|
| Next step | Every guide ends with a "Check which VEU scenario fits your home → Eligibility Checker" CTA. Good. | Keep it. On business, LPG and new-home pages, the CTA goes to the matching checker branch (spec). | Med / S |
| Checker funnel | 11 question groups, with up to 8 shown at a time. Results lead to "quote requests are not open yet → Energy Victoria's list". For business it's a dead end. | Result screen: (1) the indicative figure with label, (2) "what to ask the installer" checklist, (3) email alert opt-in, (4) Easy Electric and official list links, (5) a named-installer form when open. Cascade per `eligibility-checker-spec.md`. | High / M |
| Email capture | None anywhere. | Add the "Rules are changing" alert (4.3 #3). | High / S |
| Author / E-E-A-T | A "By Gurinder Singh, Agenor" byline on every page, but no author page, credentials or Person schema. | /about/gurinder-singh/: who he is, why he runs the site, editorial method, conflicts. Person schema; author linked from Article schema. | Med / S |
| Reviewed-by expert | None. | Recruit a licensed plumber or electrician, or an energy assessor, as a named reviewer for hot water and heating pages. **[Assumption]** $100–$300 a page, or a free exchange. **Disclose** if the reviewer is also a paid installer. Add `reviewedBy` in schema. | Med / M |
| Freshness | "Checked on 13 Nov 2026" plus official page dates on every page. Good. | Add an "Election watch" line until re-verified (A1). | High / S |
| "Not government" disclaimer | Header strip and footer on every page. Good. | Keep it. Also put it on email footers and the form. | n/a |

---

## 6. SEO, GEO and AEO

| Item | Finding (from the crawl) | Fix | Impact / Effort |
|---|---|---|---|
| Titles | 51 of 52 titles are over 60 characters, because the " \| Household Rebates" suffix adds 20. The /terms/ title repeats the brand. No exact duplicate titles. | Drop or shorten the suffix on long titles; keep the main term within the first 55 characters. | Med / S |
| Meta descriptions | Not captured by the crawl, so **couldn't assess**. | Indie Builder: audit for uniqueness and keep each under 155 characters. | Med / S |
| Near-duplicates | Using 6-word shingles with site-wide boilerplate removed: / vs /faq/ share **53%**; Frankston vs Melbourne 44%, Frankston vs Geelong 43%, Geelong vs Mornington 41%, /faq/ vs heat-pump-rebate 42%. The cause is a shared FAQ library: the same 5–6 Q&As ("Can I claim after installation?", "Why does the discount vary?", "Are rentals eligible?") repeat across about 25 pages, along with their FAQPage schema. | Each shared Q&A lives once, on /faq/ or its topic page. Other pages link to it. Each page keeps 3–5 FAQs unique to its topic. Location pages need local facts. Target overlap below 25%. | High / M |
| Orphans and weak links | No true orphans. Weakly linked (≤3 inbound including the home page): /victoria/already-installed-retrospective-discount/, /victoria/electric-heater-to-reverse-cycle/, /victoria/new-homes-all-electric-2027/. ≤4: apartments, can-you-claim-veu-twice, running costs, upgrade time, solar hot water. The footer "Areas Covered" lists only 4 of 11 location pages. | At least 6 contextual inbound links for every guide; footer lists all areas (and the corridor pages from the postcode plan). | Med / S |
| Schema | Organization, WebSite, BreadcrumbList (all but home) and FAQPage on most pages; HowTo on 3, though Google no longer shows HowTo rich results. **Missing:** Article/WebPage with `dateModified`, `author` (Person) and `reviewedBy`; WebApplication for the 3 tools and the checker. | Add Article plus Person; WebApplication for tools; trim FAQPage to unique Q&As. | Med / S |
| llms.txt | Can't be seen in the crawl. It's planned in solution-design (prompt 10). | Confirm /llms.txt exists and lists the hub, the checker, top guides, the sources page and the update date. | Low / S |
| Answer-first | Most pages open with a direct summary paragraph. Good. Hero numbers break it (A2). | First sentence states the answer and the scenario, e.g. "Replacing a room gas heater with one split system: $630–$1,610 off (Energy Victoria, checked …)". | High / S |
| Raw paths | See A6. They look like scraped text to people and AI tools. | Use linked anchor text. | Med / S |

---

## 7. Top 10 changes for Indie Builder (ranked)

Each item is written so it can become an Antigravity prompt. **No code here.**

### 1. Election and caretaker notice, with "rule status" wording
- **Goal:** don't present 2027 rules as settled while the 28 Nov election could reverse them; be the site people check after the result.
- **URLs:** /, /victoria/, /victoria/gas-to-electric-hot-water-2027/, /victoria/new-homes-all-electric-2027/, /victoria/gas-hot-water-broken-before-or-after-march-2027/, /victoria/gas-hot-water-ban-exemptions/, /victoria/landlords-rental-standards-2027/, /victoria/renters/, /victoria/get-off-gas-planner/.
- **Acceptance:** a dated notice on those pages: "Victorian election 28 Nov 2026. Official sites are in caretaker mode from 3 Nov. These rules are currently legislated; we'll re-check them after the result." Every "must" about 2027 has the qualifier "currently legislated". The notice text and its re-check date come from one data value. A re-verification task is logged for 30 Nov–5 Dec.
- **Sources:** Energy Victoria banner (any energy.vic.gov.au page); ABC tracker; Rewiring Australia (A1).

### 2. Every hero figure gets a label and scenario
- **Goal:** remove the misleading impression (ACL) and make pages answer-first.
- **URLs:** all 44 pages in the hero table in §1.2.
- **Acceptance:** the hero component won't build without a `label` (e.g. "Room gas heater → 1 split system") and a `type` (discount / payment / threshold / rate). /victoria/heat-pump-rebate/ shows **$560 gas** and **$630 electric** side by side. The upgrade-time page hero becomes a timing figure, not "$750". The co-payment page hero reads "Minimum you pay".
- **Sources:** Energy Victoria heating and hot water pages.

### 3. Clean up visible text defects
- **Goal:** look professional to people and to AI tools.
- **URLs:** the 27 pages in Appendix A; /victoria/veu-minimum-co-payment/; /victoria/eligibility-checker/ (and the 6 other pages with the self-linking checker CTA); /terms/.
- **Acceptance:** no visible "/victoria/…" or "/about/" strings (enforce with a build check); no doubled words ("at least at least"); no checker CTA on the checker page; /terms/ title fixed; titles 60 characters or fewer.
- **Sources:** the crawl.

### 4. Split up the shared FAQ library
- **Goal:** remove near-duplicate content and duplicate FAQ schema.
- **URLs:** /, /faq/, the four original location pages (Melbourne, Geelong, Frankston, Mornington Peninsula), and every page using the shared Q&As.
- **Acceptance:** each Q&A is published once, at its canonical page; other pages link to it. Each page has 3–5 unique FAQs. Pairwise non-boilerplate overlap below 25% (re-run the shingle check in this review). Location pages carry at least 5 local facts from `postcodes.csv` and council sources.
- **Sources:** the crawl similarity analysis (§6).

### 5. Business hub and 4 business pages
- **Goal:** a new, higher-value audience and lead line.
- **URLs (new):** /victoria/business/, /victoria/business/heating-cooling/, /victoria/business/led-lighting/, /victoria/business/cold-rooms-refrigeration/, /victoria/business/hot-water-motors/ (farm content as a section or a fifth page).
- **Acceptance:** each figure is taken from the official business tables with label and date. Covers the fluorescent-only rule for indoor lighting, the $10,000 large C&I hot water contribution, and the large-energy-user exclusion. The checker's business branch lands here (per `eligibility-checker-spec.md`). No quote form until a business AP agreement is signed.
- **Sources:** heating-and-cooling-discounts, lighting-discounts, cold-room-discounts, products, businesses (Energy Victoria); ESC activity overview.

### 6. "Rules are changing" email alerts
- **Goal:** an owned audience ahead of four dated rule changes.
- **URLs:** checker result screen, /victoria/gas-to-electric-hot-water-2027/, the new battery page, the footer.
- **Acceptance:** email-only field; unticked consent; purpose limited to rule-change alerts; APP 5 notice; double opt-in; unsubscribe in every send; no sharing with installers. Copy names the dates (28 Nov 2026, 1 Jan 2027, 1 Mar 2027, 1 Jul 2027).
- **Sources:** ACMA spam guidance; OAIC APP 5; DCCEEW batteries; Solar Victoria PV transition.

### 7. Program pages: batteries, solar PV, Midday Power Saver, other VEU discounts
- **Goal:** cover the programs people search for alongside VEU.
- **URLs (new):** /victoria/battery-rebate/, /victoria/solar-panel-rebate/, /victoria/other-veu-discounts/. Add Midday Power Saver sections to /victoria/gas-vs-heat-pump-running-costs/ and the heat pump guides. Add the 20 kW multi-split cap note (A3) and the two official combined hot water figures (A4).
- **Acceptance:** the battery page shows STC factor 6.8 → 5.7 on 1 Jan 2027, the taper bands, and "installation date counts". The PV page shows $1,400, the loan, the caps and the 1 Jul 2027 VEU move. Every figure has a label and date.
- **Sources:** DCCEEW, Solar Victoria (PV, hot water, transition), Energy Victoria (products, Midday Power Saver).

### 8. Help in your language
- **Goal:** trust and reach in multicultural suburbs (Wyndham, Hume, Melton, Casey).
- **URLs (new):** /victoria/help-in-your-language/; footer link site-wide; links from the scams and concession pages.
- **Acceptance:** links to Energy Victoria's 13-language consumer-rights factsheet and Solar Victoria's 15-language summaries; TIS 131 450; language names shown in their own scripts. No machine-translated full pages; any summary is human-reviewed.
- **Sources:** energy.vic.gov.au/households/translations; solar.vic.gov.au/community-languages.

### 9. E-E-A-T: author page, reviewer, schema
- **Goal:** stronger trust signals for Google and AI answers.
- **URLs:** new /about/gurinder-singh/; all guides.
- **Acceptance:** a Person page (role, method, conflicts); Article schema with `datePublished`, `dateModified`, `author`, and `reviewedBy` once a reviewer is signed; WebApplication schema on the checker and 3 tools; /llms.txt present and current.
- **Sources:** solution-design (prompt 10); this review §5–6.

### 10. Internal links, areas footer, missing and corridor pages
- **Goal:** spread authority and close coverage gaps.
- **URLs:** footer; the weakly linked pages listed in §6; /victoria/shepparton/ (missing); corridor pages per the postcode plan (Sunbury/Hume, Diggers Rest/Melton, Gisborne/Macedon Ranges); /victoria/lpg-homes/.
- **Acceptance:** footer lists every location page; each guide has at least 6 contextual inbound links. Corridor pages state the Regional/Cold insulation difference for 3437 and 3442, the LPG status for 3430, and the Hume program pause with its checked date. No council program shown as open without a date-stamped check.
- **Sources:** `postcodes.csv`; Hume Energy Upgrades; t2zero bulk-buy; Energy Victoria insulation page.

---

## 8. Verdict

**Still GO, with a pivot in emphasis. Hold the spending decisions until after 28 Nov.**

- **What still holds:** VEU has run since 2009 and serves both homes and businesses. All the site's figures check out, and the trust architecture (sources, dates, disclosure, form off) beats most competitors. Running costs stay low: domain plus the existing VPS.
- **What's weaker than before:**
  1. Easy Electric is free and state-backed.
  2. Benchmark lead fees are only about $35–$60.
  3. The 2027 gas rule, the main urgency hook, is an election issue.
  4. Council programs in Guri's own corridor (Hume) have just collapsed. That's proof the space is volatile, though it's also a chance to be the steady reference.
- **The pivot:**
  - From "2027 gas rule lead-gen site" to an "independent Victorian energy-upgrade guide for homes **and small businesses**".
  - Revenue comes from (1) AP-partnered leads, with business leads weighted up, and (2) an owned alert list.
  - Directory and affiliates come later or not at all.
- **Spend gate:** don't sign installer agreements or pay for legal review until the election result is known and the 2027 pages are re-verified (30 Nov–5 Dec).
  - If the gas rule survives: proceed as planned.
  - If it's repealed: keep the site, rewrite the 2027 pages around "what changed", and lean harder on running-cost savings, business, batteries and solar PV.

---

## Appendix A: pages with raw paths in visible text

| Page | Raw paths shown |
|---|---|
| `/` | `/about/`, `/victoria/air-conditioner-rebate/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/faq/` | `/about/`, `/how-quotes-work/`, `/victoria/air-conditioner-rebate/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/how-quotes-work/` | `/about/`, `/how-quotes-work/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/` | `/about/` |
| `/victoria/air-conditioner-rebate/` | `/victoria/air-conditioner-rebate/`, `/victoria/air-conditioner-rebate/#the-minimum-you-pay-from-30-september-2026`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/apartments-and-units/` | `/victoria/gas-hot-water-ban-exemptions/` |
| `/victoria/concession-card-holders/` | `/victoria/veu-vs-solar-homes/` |
| `/victoria/draught-proofing-rebate/` | `/victoria/casey/` |
| `/victoria/ducted-gas-to-ducted-reverse-cycle/` | `/victoria/air-conditioner-rebate/#the-minimum-you-pay-from-30-september-2026`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/ducted-gas-to-split-systems/` | `/victoria/ducted-gas-to-split-systems/` |
| `/victoria/electric-heater-to-reverse-cycle/` | `/victoria/air-conditioner-rebate/#the-minimum-you-pay-from-30-september-2026`, `/victoria/electric-heater-to-reverse-cycle/` |
| `/victoria/electric-hot-water-to-heat-pump/` | `/victoria/electric-hot-water-to-heat-pump/` |
| `/victoria/eligibility-checker/` | `/victoria/air-conditioner-rebate/`, `/victoria/heat-pump-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/frankston/` | `/victoria/air-conditioner-rebate/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/gas-hot-water-to-heat-pump/` | `/victoria/gas-hot-water-to-heat-pump/` |
| `/victoria/gas-room-heater-to-split-system/` | `/victoria/gas-room-heater-to-split-system/` |
| `/victoria/gas-to-electric-hot-water-2027/` | `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/` |
| `/victoria/gas-vs-heat-pump-running-costs/` | `/victoria/concession-card-holders/` |
| `/victoria/geelong/` | `/victoria/air-conditioner-rebate/`, `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/` |
| `/victoria/heat-pump-rebate/` | `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/melbourne/` | `/victoria/air-conditioner-rebate/`, `/victoria/gas-to-electric-hot-water-2027/` |
| `/victoria/mornington-peninsula/` | `/victoria/gas-to-electric-hot-water-2027/`, `/victoria/heat-pump-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/renters/` | `/victoria/landlords-rental-standards-2027/` |
| `/victoria/reverse-cycle-vs-gas-heater/` | `/victoria/air-conditioner-rebate/`, `/victoria/reverse-cycle-vs-gas-heater/` |
| `/victoria/veu-minimum-co-payment/` | `/victoria/veu-minimum-co-payment/` |
| `/victoria/veu-scams-cold-calls/` | `/how-quotes-work/`, `/victoria/veu-scams-cold-calls/` |
| `/victoria/veu-vs-solar-homes/` | `/victoria/veu-vs-solar-homes/` |

## Appendix B: method and limits

- **Crawl analysis:** regex scans for figures, tokens and paths; inbound link counts; 6-word shingle overlap after removing shingles found on more than 30% of pages (boilerplate).
- **Official pages** were opened live on 14 Nov 2026. Energy Victoria pages were mid-caretaker and showed "last updated" dates of 26/10/26 (hot water) and 29/10/26 (heating and cooling).
- **Not done:**
  - **Search volumes:** the Ahrefs connector returned "Insufficient plan" for Keywords Explorer.
  - **Meta descriptions and llms.txt:** not in the crawl.
  - **Visual or layout review:** none.
  - **SEC installer fees:** whether SEC charges endorsed installers wasn't verified.
  - **Retailer heat pump offers:** not checked.
  - **Green-loan rates:** a search snapshot only; re-check before publishing.
- **Third-party sources** (HVAC&R News, Finder, RenewEconomy, SolarQuotes, Commission Factory) are used only as benchmarks or reports, and are labelled as such. Official rules are cited to government sources.
