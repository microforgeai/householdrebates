CTA = "Eligibility checker (/victoria/eligibility-checker/). Quote form stays off."
R = []
def row(wave, slug, tpl, q, sec, facts, links, prio, notes, cta=CTA):
    R.append(dict(wave=wave, slug=slug, tpl=tpl, q=q, sec=sec, facts=facts, links=links, cta=cta, prio=prio, notes=notes))

# ---------------- EXISTING 16 (for completeness of sitemap; not re-specified) -------------
EXISTING = ["/", "/about/", "/faq/", "/how-quotes-work/", "/privacy/", "/sources/", "/terms/",
 "/victoria/air-conditioner-rebate/", "/victoria/eligibility-checker/", "/victoria/frankston/",
 "/victoria/gas-to-electric-hot-water-2027/", "/victoria/geelong/", "/victoria/heat-pump-rebate/",
 "/victoria/melbourne/", "/victoria/mornington-peninsula/", "/victoria/reverse-cycle-vs-gas-heater/"]

# ================= WAVE 1 =================
row(1, "/victoria/", "Hub (state pillar; new GuideLayout variant 'hub')",
 "What home energy rebates and discounts can I get in Victoria?",
 "Which upgrades does VEU cover? | What changes in 2027? | Which page fits my situation?",
 "VEU product list: heating and cooling, hot water, induction cooktops, ceiling insulation (up to $1,500), dryers, glazing, weather sealing, showerheads, fridges, in-home displays, TVs [[EVPROD]] | Gas hot water rule from 1 Mar 2027; all-electric new homes from 1 Jan 2027; rental standards phased from 1 Mar 2027 [[EVSTD]] | Solar PV support moves into VEU from 1 Jul 2027 [[SVPVVEU]]",
 "/ ; /victoria/eligibility-checker/ ; every Wave 1–3 page (hub lists them by group) ; /sources/",
 "P1 · Intent: Medium (navigational/informational). Needed as the breadcrumb target for every /victoria/ page.",
 "No FAQ $ amounts (faqs schema bans them); figures via <Money>. Becomes the BreadcrumbList 'Victoria' item. Home (/) stays the national-facing pillar.")

row(1, "/victoria/ducted-gas-to-ducted-reverse-cycle/", "Guide – upgrade swap",
 "How much is the VEU discount to replace ducted gas heating with ducted reverse cycle in Victoria?",
 "What size do I need (10/16/22.4 kW)? | What is the minimum I must pay? | Can renters do it? | How much will I save a year?",
 "Household ducted gas → ducted RCAC: up to $2,520 (10 kW), $4,200 (16 kW), $5,530 (22.4 kW) [[EVHC]] | Saves up to $1,140 a year on bills [[EVHC]] | NEW RULE: minimum customer co-payment for any ducted system is $3,000 incl GST from 30 Sep 2026 (was $1,000) [[SPEC25]] [[EVSPEC]] | Property must be > 2 years old when replacing a system; min 5-year warranty for homes; accredited provider or installer working with one [[EVHC]] | Rental homes: broken heater after 1 Mar 2027 must be replaced with efficient RCAC in main living area [[EVHC]]",
 "/victoria/air-conditioner-rebate/ ; /victoria/ducted-gas-to-split-systems/ ; /victoria/veu-minimum-co-payment/ ; /victoria/reverse-cycle-vs-gas-heater/ ; /victoria/electric-heater-to-reverse-cycle/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial, ready-to-quote)",
 "Lead with the scenario table, never $5,530 alone (existing rule). Energy Vic's 'Latest discounts' page still says ducted savings up to $1,410/yr; the newer product page says $1,140. Use $1,140. Existing /victoria/air-conditioner-rebate/ must add the $3,000 co-payment.")

row(1, "/victoria/ducted-gas-to-split-systems/", "Guide – upgrade swap",
 "Can I replace ducted gas heating with split systems or a multi-split and still get the VEU discount?",
 "4 splits vs one multi-split: which discount is bigger? | Is there a cap on multi-split size? | What do I pay at minimum?",
 "Ducted gas → 4 split systems (1×8 kW + 3×3 kW): up to $2,520; → multi-split (1×10 kW outdoor unit): up to $2,940 [[EVHC]] | From 30 Sep 2026 multi-split co-payment: $1,000 if total rated cooling < 10 kW; $3,000 if ≥ 10 kW (incl GST); single non-ducted split < 10 kW: $200 [[SPEC25]] | v25.0 also revised multi-split incentive calculations from 30 Sep 2026 [[EVSPEC]] | All indoor units must be from the same manufacturer as the outdoor unit [[SPEC25]]",
 "/victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/veu-minimum-co-payment/ ; /victoria/air-conditioner-rebate/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial)",
 "Third-party trade sites say home multi-split incentives are now calculated on at most 20 kW: UNVERIFIED against the spec text; don't publish until checked in SPEC25 Part 6. Checker rule 'Ducted gas + splits' must show the new co-payment.")

row(1, "/victoria/gas-room-heater-to-split-system/", "Guide – upgrade swap",
 "How much is the VEU discount to replace a gas wall/room heater with a split system?",
 "Why is it a range ($630–$1,610)? | Do I need the old heater removed? | What if I don't remove anything?",
 "Non-ducted (room) gas heater → 3–9 kW RCAC: $630 to $1,610 [[EVHC]] | Saves up to $460 a year [[EVHC]] | No decommissioned product: $70 to $140 [[EVHC]] | Single split < 10 kW minimum co-payment $200 incl GST [[SPEC25]] | Ask for a home visit to size it; too large uses more energy; compare heating/cooling capacity and outdoor noise [[EVHC]] [[EVRCGUIDE]]",
 "/victoria/reverse-cycle-vs-gas-heater/ ; /victoria/air-conditioner-rebate/ ; /victoria/draught-proofing-rebate/ ; /victoria/renters/ ; /victoria/electric-heater-to-reverse-cycle/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial; the most common single-room job)",
 "Differentiate from /victoria/reverse-cycle-vs-gas-heater/ (that page = comparison/decision; this = the swap, steps and money). Cross-link both ways.")

row(1, "/victoria/electric-heater-to-reverse-cycle/", "Guide – upgrade swap",
 "Is there a VEU discount to replace electric heating with reverse cycle air conditioning?",
 "Hard-wired panel heater vs central electric ducted? | Do portable heaters count?",
 "Hard-wired electric resistance room heater → 3–9 kW RCAC: up to $840 [[EVHC]] | Central electric resistance ducted heater → 10–22.4 kW ducted RCAC: up to $5,460 [[EVHC]] | Ducted co-payment $3,000 incl GST from 30 Sep 2026 [[SPEC25]]",
 "/victoria/air-conditioner-rebate/ ; /victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/veu-minimum-co-payment/ ; /victoria/gas-vs-heat-pump-running-costs/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium–High (commercial, smaller audience)",
 "Portable heaters: not listed as an eligible 'current system' on Energy Vic. Third-party claims that only one hard-wired heater per home counts: UNVERIFIED; leave out.")

row(1, "/victoria/gas-hot-water-to-heat-pump/", "Guide – upgrade swap",
 "How much does it cost to replace gas hot water with a heat pump in Victoria after discounts?",
 "Can I stack VEU + Solar Homes + STCs? | Does LPG count? | Will it work in winter? | What size tank?",
 "VEU: inefficient gas → heat pump $560 [[EVHW]] | Combined with Solar Homes hot water rebate: up to $1,560; up to $1,960 with an eligible locally made product (+$400) [[EVHW]] | Solar Homes rebate: up to $1,000 ($1,400 locally made), 50% of price, calculated after STCs and VEECs; owner-occupier, household income < $150,000, property < $3m, system ≥ 3 years old [[SVHW]] | STCs: heat pump < 425 L and on the CER register [[CERHW]] | VEU Part 3 covers 'gas or LPG' water heaters [[SPEC25]] | Saves around $400 a year [[EVHW]] | Must replace an existing system in a building ≥ 2 years old; 5-year warranty; $200 minimum contribution [[EVHW]]",
 "/victoria/heat-pump-rebate/ ; /victoria/gas-to-electric-hot-water-2027/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/veu-vs-solar-homes/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial; the 2027 rule pushes this)",
 "Cannibalisation risk with /victoria/heat-pump-rebate/: keep that page as the 'rebate' hub and make this one the practical swap guide (steps, placement, noise, frost, stacking). The LPG discount amount isn't on Energy Vic's table; say 'provider confirms'. Use $560, never $630, for gas.")

row(1, "/victoria/electric-hot-water-to-heat-pump/", "Guide – upgrade swap",
 "What is the rebate to replace an electric hot water system with a heat pump in Victoria?",
 "How much less electricity does a heat pump use? | Is solar-boosted better? | Can I use my solar panels to run it?",
 "VEU: inefficient electric → heat pump $630; → solar-boosted $910 [[EVHW]] | Heat pumps use up to 75% less electricity than a standard electric storage system [[EVHW]] | Solar Homes hot water rebate up to $1,000 / $1,400 locally made [[SVHW]] | STCs for eligible heat pumps < 425 L [[CERHW]] | Many heat pumps have timers to use daytime solar; may need a larger tank [[EVHWFACT]]",
 "/victoria/heat-pump-rebate/ ; /victoria/solar-hot-water-rebate/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/veu-vs-solar-homes/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial)",
 "Energy Vic's 'Latest discounts' page shows a combined 'up to $1,630 / $2,030', which is the electric→heat pump case ($630 + $1,000/$1,400). Only show it with that label, and only once the combination is confirmed on the hot water product page (that page shows the gas case: $1,560/$1,960).")

row(1, "/victoria/solar-hot-water-rebate/", "Guide – upgrade swap",
 "What rebates are there for solar hot water, or to replace a broken solar hot water system, in Victoria?",
 "My solar hot water no longer works: what can I replace it with? | Gas-boosted vs electric-boosted?",
 "Solar-boosted replacing inefficient electric: $910; replacing inefficient gas: $700 [[EVHW]] | Broken, out-of-warranty solar systems (electric or gas-boosted) are listed as a system to replace with a heat pump or solar-boosted [[EVHW]] | Some gas- and electric-boosted solar heaters count as 'inefficient' systems [[EVHW]] | Locally made incentive list includes Dux electric-boosted solar models [[SVHW]]",
 "/victoria/heat-pump-rebate/ ; /victoria/electric-hot-water-to-heat-pump/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/veu-vs-solar-homes/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (commercial, niche)",
 "Rental standard accepts heat pump OR electric-boosted solar [[EVRENTAL]]; link to the landlords page.")

row(1, "/victoria/gas-cooktop-to-induction/", "Guide – upgrade swap",
 "Is there a rebate for switching from a gas cooktop to induction in Victoria?",
 "Do I buy first and claim later? | Which cooktops qualify? | Can I disconnect gas completely?",
 "VEU: $140 per product (based on a $70 certificate price) [[EVIND]] | Process differs: check eligibility, buy the cooktop, then send the invoice to an accredited provider; installation can be arranged separately [[EVIND]] | Must replace a current gas cooktop; home built ≥ 2 years ago; not previously claimed; built-in or freestanding (no portable); ≥ 550×380 mm; 3+ zones; 2-year warranty [[EVIND]] | Removing all gas appliances could save about $350–$400 a year in gas supply charges [[EVIND]] | Existing homes: no requirement to replace gas cooktops [[EVEXIST]]",
 "/victoria/get-off-gas-planner/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/what-is-a-veec/ ; /victoria/can-you-claim-veu-twice/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (commercial; low ticket, good for trust and AEO)",
 "The checker has no cooktop path today. Either add one (Indie Builder) or have the CTA say 'check your hot water and heating too'. The low lead value suits AEO more than leads.")

row(1, "/victoria/ceiling-insulation-rebate/", "Guide – upgrade swap",
 "How much is the VEU ceiling insulation discount in Victoria?",
 "Is my home eligible (uninsulated / under R2.0)? | Why is regional higher? | What safety checks come first? | Do rentals need R5.0?",
 "Up to $1,500 for an average 150 m² house in metro Melbourne (mild climate zone); up to $2,100 in regional Victoria (cold climate zone) [[EVINS]] | Expected to cut install cost by around 30–50%; saves more than $400 a year; almost 60% of Victorian homes have none or too little [[EVINS]] | Eligible: uninsulated, or existing insulation below R2.0 (about 90 mm or lower than a joist) [[EVINS]] | Electrical safety assessment by a licensed electrician plus an installer safety assessment before work; halogen downlights / unsafe wiring make a home ineligible until fixed [[EVINS]] | Installers must be Energy Efficiency Council certified [[SVINSN]] | Stage 2 opened to all eligible homes [[SVINSN]] | Rentals: R5.0 where none is present, at a new lease from 1 Mar 2027 [[EVRENTAL]] | $200 minimum co-payment (activity 48) [[SPEC25]]",
 "/victoria/landlords-rental-standards-2027/ ; /victoria/draught-proofing-rebate/ ; /victoria/ballarat/ ; /victoria/veu-minimum-co-payment/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (commercial; new activity Oct 2026, low competition likely, qualitative)",
 "RULE CHANGE: new VEU activity, not in the current pack. Metro vs regional comes from the VEU postcode table (SPEC25 'Location Variable List'). Only 3 accredited providers listed on 13 Nov 2026 [[EVINS]]. The checker has no insulation path.")

row(1, "/victoria/what-is-a-veec/", "Guide – question (AEO)",
 "What is a VEEC and how does it pay for my discount?",
 "Who buys VEECs? | Why does my discount change? | Is VEU a government rebate?",
 "Each VEEC represents one tonne of greenhouse gas emissions reduction (CO2-e); created by accredited persons; bought by energy retailers who must surrender them each year [[ESCVEEC]] | Providers sell certificates to retailers and that sale funds the discount [[EVABOUT]] | The final discount depends on certificate price, product, location and provider [[EVINS]] [[EVGLAZ]] | Energy Vic's induction figure is 'based on a certificate price of $70' [[EVIND]] | Act No. 37/2026 will rename the VEET Act and VEECs ('energy upgrade certificates') on proclamation [[ESCLEG]]",
 "/victoria/veu-minimum-co-payment/ ; /victoria/veu-vs-solar-homes/ ; /how-quotes-work/ ; /victoria/air-conditioner-rebate/ ; /victoria/business-energy-upgrades/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational; strong AEO/GEO target)",
 "Don't publish a live VEEC spot price: the only sources are trader sites, not official. The rename commencement date (proclamation, or automatically 2 Oct 2028) comes from a trade summary; mark it UNVERIFIED until checked in Act 37/2026 itself.")

row(1, "/victoria/veu-minimum-co-payment/", "Guide – question (AEO)",
 "What is the minimum I have to pay under the VEU program (the co-payment)?",
 "Why can't the discount cover everything? | Can an installer refund the co-payment? | Did it change in 2026?",
 "Hot water (activities 1 and 3): $200 incl GST minimum [[SPEC25]] [[EVHW]] | Heating/cooling from 30 Sep 2026: single non-ducted split < 10 kW $200; non-ducted ≥ 10 kW $1,000; multi-split < 10 kW $1,000; multi-split ≥ 10 kW $3,000; ducted (any) $3,000; all incl GST [[SPEC25]] | Before 30 Sep 2026 ducted was $1,000 [[SPEC25]] | Ceiling insulation $200; induction $200 per product [[SPEC25]] | Larger commercial/industrial: $10,000 [[EVHW]]",
 "/victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/ducted-gas-to-split-systems/ ; /victoria/what-is-a-veec/ ; /victoria/veu-scams-cold-calls/ ; /victoria/eligibility-checker/",
 "P1 · Intent: Medium–High (pre-purchase; protects against 'free aircon' offers)",
 "RULE CHANGE (30 Sep 2026). Energy Vic's consumer product page doesn't show it yet; cite the spec PDF. Strong anti-scam angle: 'free ducted' offers can't be legitimate.")

row(1, "/victoria/can-you-claim-veu-twice/", "Guide – question (AEO)",
 "Can I get a VEU discount more than once, or claim VEU and other rebates together?",
 "How many hot water systems? | Can I claim induction twice? | Can I stack VEU + Solar Homes + STCs?",
 "Households can upgrade up to 2 hot water systems (businesses up to 5) [[EVHW]] | Induction: must not have previously claimed an induction discount [[EVIND]] | Solar Homes hot water: address must not have already had a Solar Homes hot water or battery rebate [[SVHW]] | Solar Homes rebate is calculated after STCs and VEECs, so they combine [[SVHW]] | VEU + Solar Homes hot water combined up to $1,560 / $1,960 [[EVHW]]",
 "/victoria/veu-vs-solar-homes/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/gas-cooktop-to-induction/ ; /victoria/heat-pump-rebate/ ; /victoria/already-installed-retrospective-discount/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational)",
 "Heating/cooling repeat-claim limits (e.g. 'one ducted system per home') appear only on trade sites: UNVERIFIED; say 'provider confirms'.")

row(1, "/victoria/veu-vs-solar-homes/", "Guide – question (comparison)",
 "What's the difference between Victorian Energy Upgrades and the Solar Homes program?",
 "Who runs each? | Is there an income test? | Do renters qualify? | What happens to solar rebates in 2027?",
 "VEU: market-based discounts via accredited providers; all households eligible; no income test on product pages [[EVHC]] [[EVHW]] | Solar Homes hot water: owner-occupier, income < $150,000 (from 1 Jul 2026, was $210,000), property < $3m [[SVINCOME]] [[SVHW]] | Solar PV rebate up to $1,400 plus optional matching interest-free loan [[SVPV]] | PV support moves into VEU from 1 Jul 2027; current PV arrangements stay until 30 Jun 2027 [[SVPVVEU]] | Extra 27,000 hot water rebates in 2026–27 [[SVINCOME]]",
 "/victoria/heat-pump-rebate/ ; /victoria/solar-panel-rebate/ ; /victoria/battery-rebate/ ; /victoria/can-you-claim-veu-twice/ ; /victoria/what-is-a-veec/ ; /victoria/apartments-and-units/ ; /victoria/eligibility-checker/",
 "P1 · Intent: Medium–High (comparison; strong AEO)",
 "RULE CHANGES: the income cap fell to $150k on 1 Jul 2026, and PV moves into VEU on 1 Jul 2027. Energy Vic's 'Latest discounts' page and the Solstice page still say PV 'up to $2,800'. That's stale: use $1,400 from the PV rebate page.")

row(1, "/victoria/veu-scams-cold-calls/", "Guide – question (trust/AEO)",
 "Is a cold call or door-knock about a free government energy upgrade a scam?",
 "Are cold calls banned? | What must a VEU marketer tell me? | Where do I report it?",
 "Cold-call telemarketing banned from 1 May 2024; doorknocking from 1 Aug 2024, unless express prior consent [[ESCBANS]] | Marketers must not claim to work for VEU, the ESC or the Victorian Government, or say an upgrade is mandatory; must say it's voluntary [[ESCRIGHTS]] | Providers acknowledge complaints within 5 business days and try to resolve within 20 [[ESCRIGHTS]] | Complaints: Consumer Affairs Victoria 131 450; ESC (03) 9032 1310, veu@esc.vic.gov.au; Do Not Call register 1300 792 958 [[EVRIGHTS]] [[ESCREPORT]]",
 "/how-quotes-work/ ; /victoria/veu-minimum-co-payment/ ; /victoria/find-an-accredited-provider/ ; /victoria/help-in-your-language/ ; /about/ ; /victoria/eligibility-checker/",
 "P1 · Intent: Medium (informational; trust builder)",
 "Must state plainly that Household Rebates isn't a government site and never cold-calls (consistent with the IndependenceNotice).")

row(1, "/victoria/gas-hot-water-broken-before-or-after-march-2027/", "Guide – question (AEO, time-sensitive)",
 "My gas hot water broke. Can I still replace it with gas before 1 March 2027, and what happens after?",
 "If I sign a contract before 1 March 2027? | Under warranty? | Does it apply to LPG? | Renters?",
 "From 1 Mar 2027 a gas water heater (incl pool heater) needing replacement in an existing home can't be replaced with another mains gas heater [[EVHW]] [[EVEXIST]] | Transitional: work done within 3 months after 1 Mar 2027 under a contract signed with the owner before 1 Mar 2027 is exempt [[REG45E]] | Replacement during the manufacturer, supplier or installer warranty is exempt [[REG45E]] | LPG not affected [[PLANLPG]] | Rentals: unrepairable heater after 1 Mar 2027 → efficient electric (heat pump or electric-boosted solar) [[EVRENTAL]] | Gas space heating and cooktops can stay [[EVEXIST]]",
 "/victoria/gas-to-electric-hot-water-2027/ ; /victoria/gas-hot-water-ban-exemptions/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/how-long-does-an-upgrade-take/ ; /victoria/already-installed-retrospective-discount/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (urgent, problem-aware)",
 "Traffic will peak Jan–Jun 2027. Exempt work must be done by 1 Jun 2027 (3 months after 1 Mar 2027); confirm that date wording with the reg text before publishing.")

row(1, "/victoria/gas-hot-water-ban-exemptions/", "Guide – question (AEO)",
 "What are the exemptions to Victoria's 2027 gas hot water rule?",
 "Not enough space? | Apartment with central gas? | Switchboard upgrade needed? | Network upgrade?",
 "Reg 45E(3): not enough space inside or no suitable outdoor space; Class 2 building or pool on a centralised gas system; electric option unlawful under another law; would need a main switchboard or distribution board alteration; would need network augmentation beyond a basic/standard connection [[REG45E]] | Reg 45E(4): temporary disconnect/reconnect; like-for-like where the gas heater needs no electricity connection to run; replacement within warranty [[REG45E]] | Reg 45E(5): contracts signed before 1 Mar 2027 (work within 3 months); building work under s10(1)/(2) before 1 Mar 2027; rectification orders issued before 1 Mar 2027 [[REG45E]] | Gazette confirms the switchboard, no-electricity and warranty exemptions [[GAZ]] | Penalty: 20 penalty units for the plumber [[REG45E]]",
 "/victoria/gas-to-electric-hot-water-2027/ ; /victoria/gas-hot-water-broken-before-or-after-march-2027/ ; /victoria/apartments-and-units/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/eligibility-checker/",
 "P1 · Intent: Medium–High (informational; low competition likely)",
 "CORRECTION: solution-design §1 marks this list UNVERIFIED (third-party). It's now checked against the SR 140/2025 reg 6 text (AustLII, as made). Link legislation.vic.gov.au as the authority. Not legal advice; plumbers decide.")

row(1, "/victoria/already-installed-retrospective-discount/", "Guide – question (AEO)",
 "I already bought or installed the system. Can I still get the VEU discount?",
 "What evidence do I need? | Is there a deadline? | Does it matter what I removed?",
 "Retrospective discounts are possible only in very limited cases and are not guaranteed [[EVRETRO]] | Must be processed within 6 months of the end of the calendar year of the upgrade (e.g. Dec 2025 upgrade → by 30 Jun 2026) [[EVRETRO]] | Evidence: invoice with brand/model, compliance certificates, decommissioning and disposal evidence, geo-tagged before/after photos [[EVRETRO]] | Easier where nothing was decommissioned [[EVRETRO]] | Induction cooktops bought before 30 Jun 2026 must be on the old Part 46 product list [[EVIND]]",
 "/victoria/eligibility-checker/ ; /victoria/find-an-accredited-provider/ ; /how-quotes-work/ ; /victoria/gas-cooktop-to-induction/",
 "P2 · Intent: Medium (problem-aware)",
 "Matches the checker's RETRO branch. Link this page from that result.")

row(1, "/victoria/how-long-does-an-upgrade-take/", "Guide – question (HowTo)",
 "How long does a VEU hot water or heating upgrade take, from quote to paperwork?",
 "When do I get the compliance certificate? | How long does Solar Homes pre-approval give me? | How long does gas abolishment take?",
 "Plumbing compliance certificate: required over $750 or for any Type A gas appliance work; issued within 5 days of completion [[BPC]] | Solar Homes: get pre-approval first, then install within 120 days [[SVHW]] | Accredited provider confirms models, quotes with the discount, installs and does the paperwork [[EVHW]] | Gas abolishment via your retailer: meter removal 2 business days, service cut-and-cap up to 15 business days (AusNet) [[AUSNET]]",
 "/how-quotes-work/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/get-off-gas-planner/ ; /victoria/gas-hot-water-broken-before-or-after-march-2027/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational)",
 "There's no official 'typical install time' figure, so don't state hours or days for the install itself. HowTo schema with 3+ steps. Abolishment times are AusNet's; other distributors may differ.")

# ================= WAVE 2 =================
row(2, "/victoria/renters/", "Guide – audience",
 "Can renters get VEU discounts in Victoria?",
 "Do I need my landlord's permission? | What changes can I make without permission? | What must my landlord upgrade from 2027?",
 "Renters are eligible; check with your landlord as permission may be needed [[EVRENT]] | Heating and cooling: private rentals eligible; landlords and tenants should work together [[EVHC]] | Without permission: LED bulbs (no new fittings), low-flow showerheads (keep the original), non-permanent window film [[CAVCHG]] | Draughtproofing is a 'reasonable change' a landlord can't refuse without good reason, in a property without gas appliances; with gas, a gas safety check first [[CAVCHG]] | Rental standards from 1 Mar 2027 [[CAVMEES]]",
 "/victoria/landlords-rental-standards-2027/ ; /victoria/draught-proofing-rebate/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/concession-card-holders/ ; /victoria/already-installed-retrospective-discount/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational; large audience)",
 "Solar Homes hot water is owner-occupier only (except Solstice towns) [[SVHW]] [[SVSOL]].")

row(2, "/victoria/landlords-rental-standards-2027/", "Guide – audience",
 "What do Victorian landlords have to upgrade under the 2027 rental energy efficiency standards?",
 "When does each standard start? | What discounts can rental providers claim? | Exemptions?",
 "Ceiling insulation R5.0 where none is present (new lease from 1 Mar 2027); 4-star WELS showerheads (new lease from 1 Mar 2027); efficient electric hot water when the old one fails (1 Mar 2027); RCAC heating in main living area when the heater fails (1 Mar 2027); cooling at a new lease from 1 Mar 2027 and for all rentals from 1 Jul 2030; draughtproofing from 1 Jul 2027 [[EVRENTAL]] | Heating needs a 2-star+ GEMS heating rating (non-ducted) or HSPF ≥ 3.2 (ducted) for the climate area; cooling 3-star+ or TCSPF ≥ 3.8 [[CAVMEES]] | Exemptions incl centralised systems, no space for compressor, heritage or owners-corporation rules [[CAVMEES]] | Rental providers: up to $1,610 (room gas → RCAC), up to $5,530 (ducted), $560 gas hot water → heat pump; PV up to $1,400 on up to 2 rentals per financial year [[EVRENTAL]]",
 "/victoria/renters/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/eligibility-checker/",
 "P1 · Intent: High (compliance-driven, commercial)",
 "The rental page shows 'up to $5,530' without the size caveat. On our site always attach the 22.4 kW scenario. Every standard's upgrade is VEU-eligible, per CAV [[CAVMEES]].")

row(2, "/victoria/concession-card-holders/", "Guide – audience",
 "What energy discounts can pensioners and concession card holders get in Victoria?",
 "Does VEU have an income test? | What happens to my gas concession if I go electric? | Who can help with bills?",
 "Annual electricity concession: 17.5% of usage and service costs, not on the first $171.60 a year; Pensioner Concession, Health Care or DVA Gold card [[DFFHAEC]] | Winter gas concession: 17.5%, 1 May–31 Oct, not on the first $62.40 [[DFFHGAS]] | Energy Assistance Program: free Victorian Government help with plans, concessions and payment difficulty [[EVEAP]] | VEU product pages show no income test [[EVHC]] [[EVHW]] | Solar Homes cap $150,000 household income [[SVINCOME]]",
 "/victoria/veu-vs-solar-homes/ ; /victoria/get-off-gas-planner/ ; /victoria/renters/ ; /victoria/veu-scams-cold-calls/ ; /victoria/electric-heater-to-reverse-cycle/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational)",
 "The $100 Power Saving Bonus round closed 31 Mar 2026 (energy.gov.au, per search). Don't promote it; re-check for a new round. Excess-bill thresholds ($4,038.82 electricity, $2,598.58 gas) change yearly.")

row(2, "/victoria/new-homes-all-electric-2027/", "Guide – audience",
 "Do new homes in Victoria have to be all-electric from 2027, and can new homes get rebates?",
 "Does my building permit date matter? | Can a new home get VEU discounts? | Solar rebate while building?",
 "From 1 Jan 2027 new homes and most new commercial buildings (incl knock-down rebuilds) must be all-electric; applies to building permits issued on or after 1 Jan 2027; substantial-design-progress certification exception [[EVNEW]] | Existing buildings without gas can't connect from 1 Jan 2027 [[EVNEW]] | New homes: RCAC discount typically $70–$140 (no decommissioning) [[EVNEW]] | Solar PV rebate up to $1,400 for homes under construction; install within 270 days [[EVNEW]] [[SVPV]] | Most VEU replacement discounts need a building > 2 years old [[EVHC]] [[EVHW]] | New all-electric homes save $990 a year, $1,920 with solar [[EVNEW]]",
 "/victoria/gas-to-electric-hot-water-2027/ ; /victoria/air-conditioner-rebate/ ; /victoria/veu-vs-solar-homes/ ; /victoria/wyndham/ ; /victoria/north-west-corridor/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational; growth-corridor audience)",
 "Explains why many homes in growth areas (Wyndham, Casey, Whittlesea) can't get replacement discounts if they're under 2 years old.")

row(2, "/victoria/apartments-and-units/", "Guide – audience",
 "Can apartments and units get VEU discounts or solar rebates in Victoria?",
 "Body corporate approval? | Central gas hot water and the 2027 rule? | Solar for Apartments?",
 "Owners corporations are eligible as residential (Class 1, 2, 3 or 4) or commercial, depending on classification [[EVRENT]] | 2027 rule exemption: Class 2 building on a centralised gas system [[REG45E]] | Rental heating/cooling exemptions: centralised systems, no space for the compressor, owners-corporation rules [[CAVMEES]] | Solar for Apartments: up to $2,800 per apartment, $140,000 per property, until 30 Jun 2027 or until exhausted [[SVAPT]] | Expansion: up to 150 lots and no median property value limit [[SVAPTN]] | Weather sealing example for an apartment: $70 (2-year warranty) / $140 (5-year) [[EVSEAL]]",
 "/victoria/gas-hot-water-ban-exemptions/ ; /victoria/landlords-rental-standards-2027/ ; /victoria/draught-proofing-rebate/ ; /victoria/veu-vs-solar-homes/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (informational)",
 "CONFLICT: the Solar for Apartments eligibility section still says 3–50 lots, while the 26 Oct 2026 news says 150. Show 'expanding: check current rules' until the program page updates.")

row(2, "/victoria/gas-vs-heat-pump-running-costs/", "Tool – calculator (ToolLayout island)",
 "How much would I save a year by switching from gas hot water or heating to a heat pump?",
 "Hot water vs heating savings? | With solar? | With a concession?",
 "Gas → electric hot water saves around $400 a year [[EVSTD]] [[EVHW]] | Room gas heater → RCAC up to $460 a year; ducted gas → RCAC up to $1,140 a year [[EVHC]] | Existing home all-electric about $1,900 a year, $2,230 with solar [[EVSTD]] | Removing all gas appliances avoids about $350–$400 a year in supply charges [[EVIND]]",
 "/victoria/gas-hot-water-to-heat-pump/ ; /victoria/get-off-gas-planner/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/concession-card-holders/ ; /victoria/mildura/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium–High (tool; link magnet)",
 "MVP = show Energy Vic's published savings by scenario (no own modelling). Any tariff-based mode needs user-entered tariffs; default tariffs (e.g. Victorian Default Offer) are UNVERIFIED here. Fetch them from the ESC at build time if used.")

row(2, "/victoria/heat-pump-hot-water-size-guide/", "Tool – sizing guide (static table + small island)",
 "What size heat pump hot water system do I need for my household?",
 "Does a timer/solar change the size? | Cold climate? | Noise and placement?",
 "1–2 bedrooms: 150–225 L; 3 bedrooms: 225–300 L; 4+: more than 300 L [[EVHWFACT]] | Size up for long or frequent showers, baths, simultaneous showers, no low-flow heads, plumbed hot water appliances [[EVHWFACT]] | Heat pumps make noise comparable to an air conditioner [[EVHWFACT]] | Cooler climates: consider frost protection [[EVEXIST]] | STCs only for heat pumps < 425 L [[CERHW]]",
 "/victoria/gas-hot-water-to-heat-pump/ ; /victoria/electric-hot-water-to-heat-pump/ ; /victoria/heat-pump-rebate/ ; /victoria/ballarat/ ; /victoria/macedon-ranges/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (pre-purchase)",
 "Pure lookup, no lead capture. Add a 'cold area' note fed by the VEU postcode table (heat pump climatic zone 4 or 5).")

row(2, "/victoria/get-off-gas-planner/", "Tool – planner (ToolLayout island)",
 "What does it cost to get completely off gas in Victoria, and in what order?",
 "Which appliance first? | How do I abolish my gas meter, and what does it cost? | What discounts apply to each step?",
 "Discounts per step: hot water $560 (gas → heat pump) [[EVHW]]; room heater $630–$1,610 / ducted up to $5,530 [[EVHC]]; induction $140 [[EVIND]] | Supply charges saved about $350–$400 a year once the last gas appliance goes [[EVIND]] | Abolishment is requested through your gas retailer; meter removal 2 business days; cut-and-cap up to 15 business days (AusNet) [[AUSNET]] | Distributors must publish abolishment information [[ESCGAS]] | Existing homes need not replace gas heating or cooktops [[EVEXIST]] | Bendigo study: 4-bed partial electrification pays back in about 3–4 years vs LPG [[BENDSOL]]",
 "/victoria/gas-cooktop-to-induction/ ; /victoria/gas-vs-heat-pump-running-costs/ ; /victoria/how-long-does-an-upgrade-take/ ; /victoria/solstice-gas-shutdown-towns/ ; /victoria/latrobe-valley/ ; /victoria/mitchell/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (planning)",
 "Abolishment fee $: UNVERIFIED (AusNet's page points to its yearly tariff schedule; trade sites quote about $270). Pull each distributor's published fee at build time, or link only. Don't present the Bendigo payback as statewide.")

row(2, "/victoria/draught-proofing-rebate/", "Guide – upgrade swap (efficiency)",
 "Is there a VEU discount for draught proofing (weather sealing) in Victoria?",
 "What can be sealed? | Why don't homes with some gas heaters qualify? | Council rebates?",
 "Examples: apartment $70/$140; townhouse $280/$560; house $350/$700 (2-year / 5-year warranty) [[EVSEAL]] | Doors, windows, exhaust fans, wall vents, chimneys, evaporative cooler vents [[EVSEAL]] | Homes with open-flued or flueless gas heaters / open-flued water heaters indoors don't qualify (carbon monoxide risk) [[EVSEAL]] | Window glazing: $210 (double-glazed) / $140 (secondary glazing) per 10 m² example [[EVGLAZ]] | Casey residents: separate council DIY rebate up to $200 [[CASEY]]",
 "/victoria/ceiling-insulation-rebate/ ; /victoria/other-veu-discounts/ ; /victoria/renters/ ; /victoria/casey/ ; /victoria/landlords-rental-standards-2027/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (low ticket)",
 "Safety copy is mandatory (CO risk). Rental draughtproofing standard starts 1 Jul 2027.")

row(2, "/victoria/find-an-accredited-provider/", "Guide – question (trust)",
 "How do I find a genuine VEU accredited provider near me?",
 "What's the difference between a provider and an installer? | What is Easy Electric SEC? | Council programs?",
 "Only accredited providers can apply the discount; your own installer must partner with one before work starts [[EVHW]] [[EVHC]] | Energy Vic lists providers by region (Barwon South West, Gippsland, Grampians, Greater Melbourne, Hume, Loddon Mallee); not all offer every upgrade at present [[EVHW]] | Easy Electric SEC: free state tool with SEC-endorsed installers who contact you within one business day [[SEC]] [[SECFAQ]] | Council-backed programs exist in several LGAs (see area pages) [[WHITHEP]] [[YARRA]]",
 "/how-quotes-work/ ; /victoria/veu-scams-cold-calls/ ; /victoria/whittlesea/ ; /victoria/yarra-ranges/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium–High (bottom-funnel)",
 "COMMERCIAL FLAG: SEC (state-owned) runs a free quote-matching service that competes with our lead model. Mention it honestly. Hiding it would hurt trust and EEAT.")

# ================= WAVE 3 =================
row(3, "/victoria/ballarat/", "Area (AreaLayout; ≥4 sourced localFacts)",
 "What energy rebates and discounts can Ballarat households get?",
 "Is Ballarat 'regional' for the insulation discount? | Do heat pumps work in Ballarat winters? | Council program?",
 "VEU postcode table, 8 Ballarat-council postcodes, all Regional and 'Cold': 3350/3352/3355/3356/3357 = reticulated gas, heat pump zone 5; 3358 (Winter Valley) = gas, zone 4; PO-box postcodes 3353/3354 = no reticulated gas, zone 5 [[SPEC25]] [[ABSALLOC]] | NCC climate zone 7 (cool temperate) for central Ballarat (ABCB shapefile, point check 13 Nov 2026) [[ABCB]] | Insulation: regional (cold) example up to $2,100 vs $1,500 metro [[EVINS]] | City of Ballarat 'Electrify Your Home' with Geelong Sustainability's Electric Homes Program [[BALL]] | Grampians region: 31 hot water and 46 heating/cooling providers listed on 13 Nov 2026 [[EVHW]] [[EVHC]] | Frost protection advice for cooler climates [[EVEXIST]]",
 "/victoria/ceiling-insulation-rebate/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/geelong/ ; /victoria/business-energy-upgrades/ ; /victoria/latrobe-valley/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (local commercial)",
 "INCLUDED. The council news is from Mar 2025 and its rebate trial is reported closed: describe the program, not a rebate. Re-check monthly.")

row(3, "/victoria/bendigo/", "Area (AreaLayout)",
 "What energy rebates can Bendigo households get, including Marong and Heathcote?",
 "What happened to Solstice gas in Marong/Heathcote? | Free in-home energy advice? | Is Bendigo regional?",
 "VEU postcode table, 11 Greater Bendigo postcodes, all Regional, Cold, heat pump zone 4: gas = 3550/3551/3555/3556; no reticulated gas = 3515 (Marong), 3523 (Heathcote), 3557 (Goornong), 3558 (Elmore), 3570 (Neilborough) and PO-box postcodes 3552/3554 [[SPEC25]] [[ABSALLOC]] | Solstice CNG decommissioning: Marong after 2 Aug 2026; Heathcote after 16 Aug 2026 [[BENDSOL]] | Solstice exemptions: no $150k income cap, any-age hot water system, rental providers can apply, $600 top-up if VEU criteria not met [[SVSOL]] | Council Home Energy Empowerment Program with In-Home Energy Snapshots and DIY workshops [[BEND]] | Marong study: LPG running costs at least 2.5× partly/fully electric; 4-bed partial electrification payback about 3–4 years [[BENDSOL]] | NCC zone 6; Loddon Mallee region providers: 26 hot water / 42 heating-cooling [[ABCB]] [[EVHW]] [[EVHC]]",
 "/victoria/solstice-gas-shutdown-towns/ ; /victoria/get-off-gas-planner/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/shepparton/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (local commercial)",
 "INCLUDED. The strongest local page of the set.")

row(3, "/victoria/shepparton/", "Area (AreaLayout)",
 "What energy rebates can Shepparton households get?",
 "Is Shepparton regional for insulation? | Hot summers and cooling? | Council program?",
 "VEU postcode table, 13 Greater Shepparton postcodes, all Regional, Cold, heat pump zone 4: gas = 3610 (Murchison), 3616 (Tatura), 3618 (Merrigum), 3629 (Mooroopna), 3630 (Shepparton), 3631 (Kialla); no reticulated gas = 3614, 3617, 3633, 3634, 3646, 3647 and PO-box 3632 [[SPEC25]] [[ABSALLOC]] | NCC climate zone 4 (hot dry summer, cool winter), unlike Melbourne's zone 6 [[ABCB]] | Insulation regional example up to $2,100 [[EVINS]] | Hume region providers: 27 hot water / 60 heating-cooling on 13 Nov 2026 [[EVHW]] [[EVHC]] | Goulburn Murray Solar Savers (vetted providers for solar, batteries, heat pump hot water, split systems, insulation, draught proofing, assessments) open to residents of Shepparton and 6 other GMCA councils, Feb 2026 notice [[GMCA]] | Greater Shepparton council's own Solar Savers page NOT verified (504 on 13 and 14 Nov 2026): do not cite it; cite GMCA only",
 "/victoria/ceiling-insulation-rebate/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/landlords-rental-standards-2027/ ; /victoria/bendigo/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED. Goulburn Murray Solar Savers is confirmed through GMCA (gmca.org.au, Feb 2026 notice; checked 14 Nov 2026). The Greater Shepparton council's own Solar Savers page is NOT verified (504 Gateway Timeout on 13 and 14 Nov 2026). Prompts cite GMCA only, never the council page. Shepparton is Regional + Cold in Table A, so the $2,100 regional/cold insulation example applies. Inbound links added from /victoria/bendigo/, /victoria/mitchell/ and /victoria/solstice-gas-shutdown-towns/.")

row(3, "/victoria/wyndham/", "Area (AreaLayout)",
 "What energy rebates and help can Wyndham (Werribee, Point Cook, Tarneit) households get?",
 "Council Energy Smart Homes? | Can I borrow an energy kit? | Help in Punjabi/other languages? | New homes under 2 years?",
 "Wyndham City 'Energy Smart Homes' program with workshop recordings and a 'Your Go Electric Plan' [[WYN]] | Borrowable My Home Energy and Water Efficiency Kits at local libraries [[WYN]] | Interpreted 'Home Energy in Your Language' webinars (Arabic, Mandarin, Cantonese, Vietnamese, Sgaw Karen, Punjabi) by WAGA for six western councils incl Wyndham [[WYN]] | VEU postcode table, 5 Wyndham postcodes, all reticulated gas, Mild, heat pump zone 4: 3024/3027/3029/3030 Metropolitan; 3211 (Little River) Regional [[SPEC25]] [[ABSALLOC]] | Most replacement discounts need a building > 2 years old (relevant in new estates) [[EVHW]] [[EVHC]]",
 "/victoria/new-homes-all-electric-2027/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/melbourne/ ; /victoria/concession-card-holders/ ; /victoria/melbourne-west/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED (marginal: climate and gas status are the same as Melbourne; the local value is the council program). Wyndham's residents' survey to 30 Nov 2026 came from a local-media search: UNVERIFIED.")

row(3, "/victoria/casey/", "Area (AreaLayout)",
 "What energy rebates can City of Casey households get (Narre Warren, Berwick, Cranbourne)?",
 "Council $200 draught proofing rebate? | Can a tradesperson install it? | How does it fit with VEU weather sealing?",
 "Council rebate up to $200 for DIY draught-proofing products, one per household, receipts within 6 months, claimed via rebately.co [[CASEY]] | Not claimable for paying a tradesperson, insulation batts, double glazing or heating upgrades [[CASEY]] | Energy and Water Efficiency Home Audit Kit available to hire [[CASEY]] | VEU weather sealing (provider-installed) is a separate discount: house example up to $700 [[EVSEAL]] | VEU postcode table, 11 Casey postcodes, all Metropolitan, reticulated gas, heat pump zone 4: Mild except 3980 (Tooradin) = Cold [[SPEC25]] [[ABSALLOC]]",
 "/victoria/draught-proofing-rebate/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/melbourne/ ; /victoria/melbourne-south-east/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED. 'May pause when budget exhausted': re-check monthly.")

row(3, "/victoria/whittlesea/", "Area (AreaLayout)",
 "What energy rebates and free help can City of Whittlesea households get?",
 "Free home energy assessment? | Who installs electrification upgrades? | Council net zero target?",
 "City of Whittlesea Home Energy Program launched (news 20 Oct 2026) with events, 'speed date' sessions and a Home Energy Expo [[WHIT]] | Free home energy assessments valued up to $575, until June 2027 or until funds run out; one per property; not if assessed in the last 5 years [[WHITHEP]] | Electrification upgrades routed to Easy Electric SEC installers [[WHITHEP]] [[SEC]] | Council target: net zero community emissions by 2036 [[WHIT]] | VEU postcode table, 11 Whittlesea postcodes (3074–3083, 3750–3757), all Metropolitan, reticulated gas, Mild, heat pump zone 4 [[SPEC25]] [[ABSALLOC]]",
 "/victoria/find-an-accredited-provider/ ; /victoria/get-off-gas-planner/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/melbourne/ ; /victoria/melbourne-north/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED. Council's 'Energy Smart Homes Grant' page returned 403: UNVERIFIED, leave out.")

row(3, "/victoria/yarra-ranges/", "Area (AreaLayout)",
 "What energy rebates can Yarra Ranges households get (Lilydale, Healesville, the Dandenongs)?",
 "Is the Dandenongs a 'cold' area for VEU? | Council Home Energy Program? | Local community energy groups?",
 "VEU postcode table, 26 Yarra Ranges postcodes, all reticulated gas: 15 'Cold' (3766, 3767, 3770, 3775, 3777, 3785–3789, 3792, 3793, 3795, 3796, 3799), 11 Mild; heat pump zone 5 = 3139, 3140, 3158, 3160, 3770, 3775, 3777; 3799 (Warburton) is the only Regional postcode [[SPEC25]] [[ABSALLOC]] | NCC climate zone 7 at Lilydale, Healesville, Olinda and Warburton (point checks) [[ABCB]] | Yarra Ranges Home Energy Program: draught proofing, insulation, assessments; electrification via Easy Electric SEC [[YARRA]] | Council: pre-1990 Victorian homes average a 1.5-star rating [[YARRA]] | Community groups: Healesville CoRE, Repower the Dandenongs [[YARRA]]",
 "/victoria/ceiling-insulation-rebate/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/ducted-gas-to-ducted-reverse-cycle/ ; /victoria/find-an-accredited-provider/ ; /victoria/melbourne-east/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED. A mixed shire: show a postcode table rather than one claim for the whole shire.")

row(3, "/victoria/solstice-gas-shutdown-towns/", "Area – multi-town (AreaLayout variant)",
 "My town's Solstice compressed natural gas network is closing. What rebates can I get to go electric?",
 "Which towns? | Which exemptions apply? | Electric vs LPG costs?",
 "Solstice CNG networks to shut by mid-to-late 2026 in: Marong 3515 and Heathcote 3523 (Greater Bendigo), Swan Hill 3585 and Robinvale 3549 (Swan Hill), Maldon 3463 (Mount Alexander), Kerang 3579 (Gannawarra), Nathalia 3638 (Moira), Terang 3264 (Corangamite), Lakes Entrance 3909 and Orbost 3888 (East Gippsland) [[SVSOL]] [[ABSALLOC]] | All 10 postcodes are 'Regional' and 'No' reticulated gas in VEU Table A; climate Cold (3515, 3523, 3463, 3638), Hot (3585, 3549, 3579), Mild (3264, 3909, 3888) [[SPEC25]] | Exemptions: no $150k income cap; hot water of any age; rental providers eligible; $600 top-up when VEU rules (home < 2 years, recent system) aren't met [[SVSOL]] | 8 accredited providers confirmed availability for the 10 towns [[SVSOL]] | Marong study: LPG at least 2.5× running cost of electric [[BENDSOL]]",
 "/victoria/bendigo/ ; /victoria/get-off-gas-planner/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/veu-vs-solar-homes/ ; /victoria/shepparton/ ; /victoria/mildura/ ; /victoria/eligibility-checker/",
 "P2 · Intent: High for a small audience (problem-aware)",
 "NEW LOCATION FIND: genuinely local and officially sourced. Time-limited: once the networks close, move it to an archive or 'what happened' page. The Solstice page's 'PV up to $2,800' is stale (PV is $1,400).")

# ================= 14 Nov 2026 coverage expansion =================
row(2, "/victoria/postcode/", "Tool – postcode lookup (static; data from postcodes.csv)",
 "Is my postcode metro or regional for VEU, and does it have mains gas?",
 "What climate region is my postcode? | Which heat pump zone am I in? | Which council am I in? | Which insulation figure applies to me?",
 "VEU Specifications v25.0 Table A lists 719 Victorian postcodes: 281 Metropolitan / 438 Regional; 406 with reticulated gas / 313 without; climate 404 Mild / 268 Cold / 47 Hot; heat pump zone 4: 608, zone 5: 111 [[SPEC25]] | Locality and council for each postcode from ABS mesh-block allocation files, weighted by 2021 Census dwellings (25 PO-box postcodes have no dwellings; council shown as indicative) [[ABSALLOC]] | Insulation savings use climate region (Mild 0.00576, Cold 0.00771, Hot 0.00546 t CO2-e/m²/yr) × regional factor (Metropolitan 0.98, Regional 1.04) [[SPEC25]] | Energy Vic's insulation examples: up to $1,500 metro (mild), up to $2,100 regional (cold) for a 150 m² house [[EVINSP]]",
 "/victoria/eligibility-checker/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/get-off-gas-planner/ ; /victoria/lpg-homes/ ; /victoria/melbourne/",
 "P1 · Intent: High (every visitor's first local question)",
 "One page with a client-side search over postcodes.csv. Result card: area, gas, climate, HP zone, localities, council, then a link to the matching hub or council page. Don't generate 719 per-postcode pages (doorway risk). The checker reuses the same data at its postcode step.")

row(2, "/victoria/business-energy-upgrades/", "Guide – audience (business)",
 "What Victorian Energy Upgrades discounts can a business get?",
 "Which products are business-only? | Are large energy users excluded? | What is a custom (M&V) upgrade? | Can a business get a battery discount?",
 "Business-only VEU products: commercial and industrial lighting, C&I solar PV, cold rooms, pre-rinse spray valves, high-efficiency motors [[EVPROD]] | Business heating/cooling examples: non-ducted gas heater → 3–9 kW RCAC $420 to $1,050; ducted gas → 56 kW ducted up to $8,820 [[EVHC]] | Hot water: businesses can upgrade up to 5 systems; larger C&I heat pumps have no limit; $10,000 minimum contribution for larger C&I upgrades [[EVHW]] | Motors up to $2,380 (185 kW premium), $200 minimum contribution [[EVMOTOR]] | Cold rooms: $420 / $1,540 / $4,620 indicative, at least 4 m², $500 minimum contribution [[EVCOLD]] | C&I solar 30–200 kW, non-residential premises: 50 kW $4,550 up to 200 kW $34,300 at a $70 VEEC price [[EVCIPV]] | Indoor lighting only if the existing lights are fluorescent [[EVLIGHT]] | Pre-rinse spray valve $210 each [[EVPRV]] | Sites on the ESC Register of Scheduled Activity Premises are excluded unless they opt in [[EVBIZ]] | Custom (M&V) upgrades: process heat and steam, HVAC, refrigeration, fans and motors, renewables [[EVBIZCUST]] | Federal Cheaper Home Batteries covers households, businesses and community organisations, 5–100 kWh [[DCCEEWCHB]]",
 "/victoria/business-heating-cooling/ ; /victoria/business-led-lighting/ ; /victoria/business-cold-rooms-refrigeration/ ; /victoria/business-hot-water-motors/ ; /victoria/battery-rebate/ ; /victoria/eligibility-checker/ ; /victoria/find-an-accredited-provider/ ; /victoria/what-is-a-veec/ ; /victoria/veu-minimum-co-payment/ ; /victoria/veu-scams-cold-calls/",
 "P3 · Intent: Medium (B2B; separate audience)",
 "NEW. Business hub (14 Nov 2026): links the 4 Wave 4 business pages; no separate /victoria/business/ hub. This is the landing page for the checker's Business branch. Keep figures as 'indicative'. No lead capture for business yet.")

row(3, "/victoria/north-west-corridor/", "Area – corridor hub (AreaLayout variant with a postcode table)",
 "What energy rebates apply in Sunbury, Diggers Rest, Melton and Gisborne?",
 "Is Diggers Rest in Melton or Hume? | Why is Gisborne 'regional' but Sunbury 'metro'? | Is the Hume council program open? | Can a new estate home get VEU?",
 "Diggers Rest 3427, Sunbury 3429, Bulla 3428, Melton 3335–3338, Caroline Springs 3023: Metropolitan, reticulated gas, Mild, heat pump zone 4 [[SPEC25]] | North of Sunbury the table changes: New Gisborne 3438 and Riddells Creek 3431 are Metropolitan but Cold (zone 5); Gisborne 3437 is Regional, Cold, zone 5; Clarkefield 3430 has no reticulated gas [[SPEC25]] | Diggers Rest 3427 spans two councils: about 93% of dwellings in Melton, 7% in Hume [[ABSALLOC]] | NCC climate zone 6 at Diggers Rest, Sunbury and Melton; zone 7 at Gisborne, Riddells Creek, Macedon, Woodend and Kyneton [[ABCB]] | Hume Home Energy Upgrades registrations are paused after Yarra Energy Foundation went into voluntary administration; only insulation and draught-proofing registrations made before 19 Oct 2026 continue [[HUMEUPG]] | Hume has a Household Energy Officer for bill help [[HUMEBILL]] | Replacing a heater or hot water system needs a building more than 2 years old (relevant in new estates) [[EVHC]] [[EVHW]] | From 1 Jan 2027 all new homes must be built all-electric [[SVPV]]",
 "/victoria/macedon-ranges/ ; /victoria/melbourne-west/ ; /victoria/melbourne-north/ ; /victoria/postcode/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/eligibility-checker/",
 "P1 · Intent: Medium-High (local; Guri's own area, fast-growing estates)",
 "INCLUDED. Melton now passes as part of the corridor, not as a page of its own. Insulation: Gisborne 3437 (Regional, Cold) fits Energy Vic's $2,100 example; New Gisborne 3438 (Metropolitan, Cold) fits neither example: about $2,010 by the spec formula (ASSUMPTION: same 150 m² house; provider confirms).")

row(3, "/victoria/macedon-ranges/", "Area (AreaLayout; postcode table)",
 "Is the Macedon Ranges a cold region for VEU, and what does that mean for heating and hot water rebates?",
 "Which towns have no mains gas? | Is Gisborne metro or regional? | Does the council run a program? | What heat pump zone am I in?",
 "12 of the shire's 13 postcodes are 'Cold' in Table A; 3430–3438 are heat pump zone 5, 3440–3446 zone 4 [[SPEC25]] | No reticulated gas: Clarkefield 3430, Bolinda 3432, Monegeetta 3433, Malmsbury 3446 [[SPEC25]] | Metropolitan: Riddells Creek 3431, Romsey 3434, New Gisborne 3438, Mount Macedon 3441; Regional: Lancefield 3435, Gisborne 3437, Macedon 3440, Woodend 3442, Kyneton 3444 [[SPEC25]] | NCC climate zone 7 (cool temperate) at Gisborne, Macedon, Riddells Creek, Woodend, Kyneton, Romsey and Lancefield [[ABCB]] | Council: Cool Changes community climate plans (Macedon/Mt Macedon, Kyneton, Gisborne, Riddells Creek, Romsey and Lancefield, Woodend, Malmsbury); Sustainable Home Kits to borrow from libraries; Empower Your Home webinars; ChangeMakers festival (Apr 2026) with home electrification events and the Riddells Creek Enviro-Energy Expo [[MRSC]] | VEU heat pump savings are calculated with the postcode's zone 4/5 value [[SPEC25]]",
 "/victoria/north-west-corridor/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/get-off-gas-planner/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (local; cold-climate angle)",
 "INCLUDED (6 local facts). The strongest new council page: a cold climate, zone 5, and off-gas pockets all differ from Melbourne.")

row(3, "/victoria/mitchell/", "Area (AreaLayout; postcode table)",
 "What energy rebates can households in Wallan, Kilmore, Broadford and Seymour get?",
 "Is Wallan metro? | Which towns have no mains gas? | Is Solar Savers available?",
 "Beveridge 3753 and Wallan 3756: Metropolitan, gas, Mild; Kilmore 3764, Broadford 3658, Seymour 3660: Regional, gas, Cold [[SPEC25]] | 12 Mitchell-council postcodes (4 Metropolitan, 8 Regional; all heat pump zone 4) [[SPEC25]] [[ABSALLOC]] | No reticulated gas (6): Pyalong 3521, Tooborac 3522, Seymour PO boxes 3661, Puckapunyal 3662, Wandong 3758, Bylands 3762 (Bylands is Metropolitan but Cold); Tallarook 3659 is Regional, gas, Cold [[SPEC25]] | Goulburn Murray Solar Savers (vetted providers for solar, batteries, heat pumps, insulation and more) open to Mitchell residents [[GMCA]] | NCC climate zone 6 at Wallan, Kilmore and Seymour [[ABCB]] | Plan Melbourne places Mitchell in the Northern metropolitan region [[PLANREG]]",
 "/victoria/melbourne-north/ ; /victoria/shepparton/ ; /victoria/get-off-gas-planner/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local growth corridor)",
 "INCLUDED (5 local facts). Wallan/Beveridge estates: stress the 2-year building rule.")

row(3, "/victoria/latrobe-valley/", "Area (AreaLayout)",
 "What energy rebates and programs are available in Traralgon, Morwell and Moe?",
 "Is there an SEC heat pump offer here? | What did the Morwell electrification trial find? | Which towns have no mains gas?",
 "Moe 3825, Morwell 3840, Churchill 3842, Traralgon 3844: Regional, gas, Mild (Moe is heat pump zone 5) [[SPEC25]] | 9 Latrobe-council postcodes, all Regional and Mild [[SPEC25]] [[ABSALLOC]] | No reticulated gas (5): Gippsland Mail Centre 3841 (PO boxes), Glengarry 3854, Toongabbie 3856, Yinnar 3869, Boolarra 3870 [[SPEC25]] | SEC heat pump hot water one-stop-shop pilot extended to Latrobe City (Morwell, Moe, Newborough, Traralgon, Churchill) with endorsed installers and free quotes [[SECLAT]] [[PREMLAT]] | AusNet–GCCN Electri-fair-cation trial electrified Morwell households; completed 2026 [[GCCN]] | Fully electrified trial homes saw an average 44% cut in total energy bills (news report) [[LVE]] | NCC climate zone 6 at Traralgon [[ABCB]]",
 "/victoria/gas-hot-water-to-heat-pump/ ; /victoria/find-an-accredited-provider/ ; /victoria/get-off-gas-planner/ ; /victoria/concession-card-holders/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local)",
 "INCLUDED (6 local facts). The 44% figure is from a news report quoting AusNet: label it as reported, not official. The SEC pilot is the state's own installer service, so mention it openly. Insulation: Regional but Mild, so neither Energy Vic example fits; about $1,590 by the spec formula (ASSUMPTION; provider confirms).")

row(3, "/victoria/mildura/", "Area (AreaLayout)",
 "What energy rebates suit Mildura's hot climate?",
 "Is Mildura a 'hot' region for VEU? | Which towns have no mains gas? | Can I borrow an energy kit?",
 "All 12 Mildura-council postcodes in postcodes.csv (incl. PO-box 3502) are Regional, 'Hot' and heat pump zone 4 in Table A, one of only 47 Hot postcodes statewide [[SPEC25]] | Gas (7): Mildura 3500, Mildura PO boxes 3502, Irymple 3498, Red Cliffs 3496, Merbein 3505, Nichols Point 3501, Colignan 3494; no reticulated gas (5): Ouyen 3490, Cowangie 3506, Walpeup 3507, Underbool 3509, Murrayville 3512 [[SPEC25]] | NCC climate zone 4 (hot dry summer, cool winter) [[ABCB]] | Council 'Electrify your home' guidance and a Home Energy Efficiency Toolkit (thermal camera, PowerMate Lite meter) to borrow from Mildura Library [[MILD]] | The Hot-region insulation savings factor (0.00546) is the lowest of the three, so expect a smaller insulation discount than in Mild or Cold areas for the same ceiling [[SPEC25]]",
 "/victoria/air-conditioner-rebate/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/solstice-gas-shutdown-towns/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/lpg-homes/ ; /victoria/eligibility-checker/",
 "P3 · Intent: Medium (local; cooling angle)",
 "INCLUDED (5 local facts). Cooling-led page. Swan Hill and Robinvale (Solstice towns) are also Hot, so cross-link.")

row(3, "/victoria/melbourne-north/", "Area – metro hub (Plan Melbourne Northern region; postcode table)",
 "What energy rebates apply in Melbourne's north (Hume, Whittlesea, Darebin, Banyule, Merri-bek, Nillumbik, Mitchell)?",
 "Which northern postcodes are 'Cold' or off-gas? | Which council programs are open? | Is Hume's program paused?",
 "66 postcodes: 58 Metropolitan, 8 Regional (all in Mitchell); 6 without reticulated gas; 9 Cold [[SPEC25]] [[ABSALLOC]] | Region as defined by Plan Melbourne [[PLANREG]] | Council Home Energy Program covers Merri-bek and Whittlesea [[HEP]]; Whittlesea offers free home energy assessments to June 2027 [[WHITHEP]] | Hume Home Energy Upgrades paused [[HUMEUPG]] | Goulburn Murray Solar Savers covers Mitchell [[GMCA]] | NCC climate zone 6 at Craigieburn, Mernda and Wallan [[ABCB]]",
 "/victoria/whittlesea/ ; /victoria/mitchell/ ; /victoria/north-west-corridor/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (metro local)",
 "INCLUDED. List all 66 postcodes with localities from postcodes.csv.")

row(3, "/victoria/melbourne-west/", "Area – metro hub (Plan Melbourne Western region; postcode table)",
 "What energy rebates apply in Melbourne's west (Wyndham, Melton, Brimbank, Hobsons Bay, Maribyrnong, Moonee Valley)?",
 "Is anywhere in the west 'regional'? | Which councils run programs? | Are there webinars in my language?",
 "34 postcodes: all Mild and on reticulated gas; all Metropolitan except Little River 3211 (Regional) [[SPEC25]] [[ABSALLOC]] | Region as defined by Plan Melbourne [[PLANREG]] | Council Home Energy Program covers Brimbank [[HEP]] | Wyndham Energy Smart Homes and interpreted 'Home Energy in Your Language' webinars run for six western councils [[WYN]] | Melton Living Green: Power-Mate meter loans [[MELTON]] | NCC climate zone 6 at Werribee, Melton and Caroline Springs [[ABCB]]",
 "/victoria/wyndham/ ; /victoria/north-west-corridor/ ; /victoria/concession-card-holders/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (metro local)",
 "INCLUDED, MARGINAL: the climate and gas data match inner Melbourne, so the local value is the council programs.")

row(3, "/victoria/melbourne-east/", "Area – metro hub (Plan Melbourne Eastern region; postcode table)",
 "What energy rebates apply in Melbourne's east and the Dandenongs?",
 "Which eastern postcodes are 'Cold'? | Which are heat pump zone 5? | Which councils run programs?",
 "65 postcodes: 64 Metropolitan (Warburton 3799 Regional); all on reticulated gas; 15 Cold (Dandenongs and Yarra Valley, e.g. Olinda 3788, Healesville 3777); 7 heat pump zone 5 (incl. Lilydale 3140, Belgrave 3160) [[SPEC25]] [[ABSALLOC]] | Region as defined by Plan Melbourne [[PLANREG]] | Council Home Energy Program covers Knox, Maroondah, Monash and Yarra Ranges [[HEP]] | SEC heat pump hot water pilot available in Maroondah and the Yarra Ranges [[PREMLAT]] | NCC climate zone 7 in the Yarra Ranges towns [[ABCB]]",
 "/victoria/yarra-ranges/ ; /victoria/heat-pump-hot-water-size-guide/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (metro local)",
 "INCLUDED. The Cold/zone 5 split inside one metro region is the hook.")

row(3, "/victoria/melbourne-south-east/", "Area – metro hub (Plan Melbourne Southern region; postcode table)",
 "What energy rebates apply in Melbourne's south-east (Casey, Cardinia, Dandenong, Kingston, Frankston, Mornington Peninsula)?",
 "Is Pakenham metro? | Which councils offer rebates? | Is Koo Wee Rup regional?",
 "67 postcodes: all on reticulated gas; 66 Metropolitan (Koo Wee Rup 3981 Regional); 65 Mild (Tooradin 3980 and Koo Wee Rup 3981 Cold) [[SPEC25]] [[ABSALLOC]] | Region as defined by Plan Melbourne [[PLANREG]] | Council Home Energy Program covers Kingston [[HEP]] | Casey home energy efficiency rebate [[CASEY]] | SEC's installer network is open to Casey households [[PREMLAT]] | NCC climate zone 6 at Pakenham, Officer and Cranbourne [[ABCB]]",
 "/victoria/casey/ ; /victoria/frankston/ ; /victoria/mornington-peninsula/ ; /victoria/postcode/ ; /victoria/eligibility-checker/",
 "P2 · Intent: Medium (metro local)",
 "INCLUDED. Cardinia is covered here, not on a page of its own (see dropped).")

# ================= WAVE 4 (14 Nov 2026: business review rows 65–74, reviewed by Venture Architect) =================
row(4, '/victoria/business-heating-cooling/', 'Guide – business (navGroup business)', 'What VEU discounts can a Victorian business get for heating and cooling?', 'Which business sizes are listed (16, 25, 32, 56 kW)? | What is the minimum the business pays? | Can a new building get it? | Are large energy users excluded?', 'All Victorian households and businesses are eligible for a heating and cooling discount [[EVHC]] | Business examples: non-ducted gas heater → 3–9 kW RCAC $420 to $1,050; ducted gas → 4 splits up to $1,680; ducted gas → multi-split 10 kW up to $1,820; ducted gas → ducted 16 / 25 / 32 / 56 kW up to $2,590 / $3,850 / $6,230 / $8,820; central electric ducted 16–56 kW up to $4,060; existing ducted RCAC $910 / $1,400 / $3,010 / $3,290; existing non-ducted RCAC $210 to $490; hard-wired electric room heater up to $490; no product decommissioned: ducted up to $1,820, room $70 to $140 [[EVHC]] | Same Part 6 minimum co-payments as homes from 30 Sep 2026: $3,000 incl GST for any ducted system; multi-split $3,000 at 10 kW or more, $1,000 below [[SPEC25]] | Replacement discounts need a building more than 2 years old [[EVHC]] | Sites on the ESC Register of Scheduled Activity Premises are excluded unless they opt in [[EVBIZ]]', '/victoria/business-energy-upgrades/ ; /victoria/veu-minimum-co-payment/ ; /victoria/find-an-accredited-provider/ ; /victoria/veu-scams-cold-calls/ ; /victoria/eligibility-checker/', 'P2 · Intent: Medium-High (B2B, commercial)', 'From the business review §7 item 5 and eligibility-checker-spec.md §2.4 and §5.3 (BH-1..7). Show the size table, never the largest figure alone. Checker result lines BH-* link here.', cta='Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.')
row(4, '/victoria/business-led-lighting/', 'Guide – business (navGroup business)', 'Can a Victorian business still get a VEU discount for LED lighting?', 'Why only fluorescent indoor lights? | What about car parks and outdoor lighting? | Can councils get street lighting discounts? | Do apartment common areas count?', 'Commercial and industrial lighting is a business-only VEU product [[EVPROD]] | Indoor lighting upgrades now only qualify when the existing lights are fluorescent [[EVLIGHT]] | Examples: 100 × 24 W fluorescent tubes → 50 LED $1,260; 20 metal halide car park lights → LED high bays $3,150; 100 street lights $21,350 (councils and road authorities) [[EVLIGHT]] | Public lighting is Spec Part 27; Part 34 lists Class 2 common areas, so apartment common-area lighting is possible and the provider confirms [[SPEC25]]', '/victoria/business-energy-upgrades/ ; /victoria/apartments-and-units/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/', 'P2 · Intent: Medium (B2B)', 'Spec rules BL-1..4 and message N-LIGHT. The fluorescent-only rule goes in the answer block. Common areas: "possibly, provider confirms" only.', cta='Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.')
row(4, '/victoria/business-cold-rooms-refrigeration/', 'Guide – business (navGroup business)', 'What VEU discounts are there for cold rooms and commercial refrigeration in Victoria?', 'Does my cool room qualify (size and temperature)? | What is the minimum contribution? | What about display fridges and fan motors? | Can a cafe, butcher or grocer apply?', 'Cold rooms: walk-in, at least 4 m² floor area, storing goods below 7 °C or running as a freezer; indicative small / medium / large $420 / $1,540 / $4,620; $500 minimum contribution [[EVCOLD]] | Household-type fridges and freezers (250–700 L, at least 5.5 stars for fridges and 4 stars for freezers) up to $70, open to businesses too [[EVFRIDGE]] | Refrigerated display cabinets (Part 32) and refrigeration fan motors (Part 33) are VEU activities with no published consumer figure; the provider confirms [[SPEC25]] | Cold rooms are a business-only VEU product [[EVPROD]]', '/victoria/business-energy-upgrades/ ; /victoria/business-hot-water-motors/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/', 'P2 · Intent: Medium (B2B; cafes, butchers, grocers, farms)', 'Spec rules BR-1..4 and message N-COLD. Display cabinets and fan motors: no figure, "provider confirms".', cta='Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.')
row(4, '/victoria/business-hot-water-motors/', 'Guide – business (navGroup business)', 'What VEU discounts can a business get for hot water, motors and commercial kitchen spray valves?', 'How many hot water systems can a business upgrade? | What changes for large commercial heat pumps? | Which motor sizes are listed? | What is a pre-rinse spray valve discount?', 'Businesses can upgrade up to 5 standard hot water systems at the household figures (electric → heat pump $630, electric → solar-boosted $910, gas → heat pump $560, gas → solar-boosted $700), $200 minimum each [[EVHW]] | Larger commercial and industrial heat pumps have no limit on number, no published consumer figure, and a $10,000 minimum contribution (Spec Part 44) [[EVHW]] [[SPEC25]] | Motors: e.g. 15 kW premium $280; 75 kW high-efficiency $560 or premium $1,120; up to $2,380 (185 kW premium); $200 minimum [[EVMOTOR]] | Motors over 185 kW: ask about a custom (M&V) upgrade [[EVBIZCUST]] | Pre-rinse spray valves $210 each, where a valve or fitting is already installed [[EVPRV]]', '/victoria/business-energy-upgrades/ ; /victoria/business-cold-rooms-refrigeration/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/', 'P3 · Intent: Medium (B2B)', 'Spec rules BW-1..3, BM-1..2, BK-1..2 and message N-PRV. No figure for large C&I heat pumps.', cta='Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.')
row(4, '/victoria/battery-rebate/', 'Guide – program (federal, label FEDERAL)', 'Is there a battery rebate in Victoria, and how does the federal Cheaper Home Batteries discount work?', 'How much is the discount? | Why does the size matter (14, 28, 50 kWh)? | What changes on 1 Jan 2027? | Do I need solar panels? | Can a business get it?', 'Cheaper Home Batteries: households, businesses and community organisations; small-scale batteries 5–100 kWh connected to new or existing solar PV; accredited installer; discount through STCs; around 30% off the upfront cost [[DCCEEWCHB]] | STC factor 6.8 per kWh for May–Dec 2026, 5.7 from 1 Jan 2027, then lower every 6 months to 2030; the installation date sets the rate [[DCCEEWCHB]] | Taper since 1 May 2026: 100% of the factor up to 14 kWh, 60% for 14–28 kWh, 15% for 28–50 kWh [[DCCEEWCHB]] [[CERBAT]]', '/victoria/solar-panel-rebate/ ; /victoria/veu-vs-solar-homes/ ; /victoria/business-energy-upgrades/ ; /victoria/eligibility-checker/', 'P1 · Intent: High (hard date: 1 Jan 2027)', 'Label the program FEDERAL. A Victorian battery rebate is UNVERIFIED (spec §9): say nothing about one. A report of further cuts (Finder) is unconfirmed: keep it off the page. The alert sign-up (prompt 29b) sits here. Not a battery sub-site.', cta='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.')
row(4, '/victoria/solar-panel-rebate/', 'Guide – program (Solar Homes)', 'How much is the Victorian solar panel rebate, and what changes on 1 July 2027?', 'Who is eligible (income, property value, 10-year rule)? | Is the interest-free loan still offered? | Can I get it on a home under construction? | What about rentals? | What about businesses?', 'Solar Homes PV rebate up to $1,400 plus an optional interest-free loan of the same amount; owner-occupier of an existing home or one under construction; approval before install [[SVPV]] | Combined owners taxable income under $150,000 from 1 Jul 2026 (was $210,000); property under $3m [[SVINCOME]] [[SVPV]] | Not available where the address had a Solar Homes PV or battery rebate, or where solar was installed in the last 10 years [[SVPV]] | Rental properties are eligible and the $150,000 cap applies to rentals too (detailed landlord and tenant criteria: see Solar Victoria) [[SVPV]] [[SVINCOME]] | PV support moves into VEU from 1 Jul 2027; current arrangements stay until 30 Jun 2027 [[SVPVVEU]] | Residential Electrification Grants through approved providers (including Six Star Plus, Metricon Homes and Henley): up to $1,400 for PV and $1,400 for hot water; the projects target households including low-income households, retirement-home residents and first home buyers [[SVEG]]', '/victoria/veu-vs-solar-homes/ ; /victoria/battery-rebate/ ; /victoria/apartments-and-units/ ; /victoria/new-homes-all-electric-2027/ ; /victoria/business-energy-upgrades/ ; /victoria/eligibility-checker/', 'P1 · Intent: High', 'Business solar (30–200 kW) is on the business hub, not here. Rental criteria detail is UNVERIFIED: link Solar Victoria, no detail. Don\'t use the stale "up to $2,800" on Energy Vic\'s Latest discounts page or the Solstice page.', cta='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.')
row(4, '/victoria/other-veu-discounts/', 'Guide – question (AEO)', 'What other VEU discounts are there for Victorian homes (windows, dryers, fridges, shower heads, TVs)?', 'How much is each? | Can businesses get any of them? | Is the Residential Efficiency Scorecard still part of VEU? | Is there a pool pump or EV charger discount?', "Window glazing: up to $210 per 10 m² to double glaze windows [[EVPROD]]; $210 double-glazed / $140 secondary glazing per 10 m² example [[EVGLAZ]] | Heat pump dryer, shower head, fridge or freezer, in-home display and TV: up to $70 each (Energy Vic says shower heads, fridges/freezers and TVs are for homes or businesses; in-home displays are residential-only per ESC; ESC lists clothes dryers, Part 25, for both) [[EVPROD]] | Fridges and freezers: 250–700 L, at least 5.5 stars (fridge) or 4 stars (freezer) [[EVFRIDGE]] | The Residential Efficiency Scorecard closed on 23 Jun 2026 and is no longer a VEU activity (Spec Part 45) [[SPEC25]] | Pool pumps (Part 26) are listed by the ESC as an activity but have no current consumer discount page; pool heat pumps are not on Energy Victoria's product list [[ESCACT]] [[EVPROD]] | ESC: in-home displays (Part 30) residential only; clothes dryers (Part 25), shower roses (17), fridges (22), TVs (24), windows (13/14) residential and non-residential [[ESCACT]]", '/victoria/draught-proofing-rebate/ ; /victoria/gas-cooktop-to-induction/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/what-is-a-veec/ ; /victoria/eligibility-checker/', 'P3 · Intent: Medium (completes the topic for AI answers)', 'Low value each. The EV charger FAQ is a decision for Guri (the review found no household EV charger rebate; Solar Victoria gives guidance only).', cta='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.')
row(4, '/victoria/help-in-your-language/', 'Guide – support (trust)', 'Where can I get information about energy rebates in my language?', 'Which languages are available? | Can I get an interpreter on the phone? | Where is the VEU consumer-rights factsheet in my language? | How do I avoid scams?', 'Energy Victoria says its VEU consumer-rights factsheet is translated into 13 languages; the page lists 11: Arabic, Chinese (Simplified), Chinese (Traditional), Filipino, Greek, Hazaragi, Hindi, Italian, Khmer, Turkish, Vietnamese (no Punjabi or Sinhalese factsheet listed; page last updated 23 Aug 2024) [[EVTRANS]] | Solar Victoria publishes Solar Homes summaries in 14 languages: Arabic, Dinka, Greek, Hindi, Italian, Nuer, Punjabi, Simplified Chinese, Sinhalese, Spanish, Tamil, Traditional Chinese, Turkish, Vietnamese (plus English) [[SVLANG]] | ECCV go-electric brochure in 11 languages: UNVERIFIED (fetch failed 14 Nov 2026), leave off until checked [[ECCV]] | Free National Translating and Interpreting Service: 131 450 (Solar Victoria page) [[SVLANG]]', '/victoria/veu-scams-cold-calls/ ; /victoria/concession-card-holders/ ; /victoria/wyndham/ ; /how-quotes-work/ ; /victoria/eligibility-checker/', 'P2 · Intent: Medium (trust; Wyndham, Hume, Melton, Casey)', 'Links only; no machine-translated pages. Any later Punjabi or Hindi summary is a separate map row and must be reviewed by a fluent human. Language names in their own scripts, copied from the official pages. Corrected 14 Nov 2026: Energy Vic lists 11 factsheet languages (not Punjabi/Sinhalese), Solar Victoria lists 14 languages; ECCV UNVERIFIED.', cta='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.')
row(4, '/about/gurinder-singh/', 'Trust – author page (Person)', 'Who writes and checks Household Rebates?', 'How are figures checked? | How is the site paid for? | Who reviews the technical pages? | How do I report an error?', 'Household Rebates is published by Agenor Services Pty Ltd (ABN 29 644 447 263); all guides and fact-checks are edited by Gurinder Singh (live /about/ page: "All guides and fact-checks are edited by Gurinder Singh", crawl 14 Nov 2026) | Every figure links to an official source with a checked-on date; the build blocks figures more than 45 days old (site method, design §5.3) | Installers may pay for enquiries (IndependenceNotice on every page)', '/about/ ; /sources/ ; /how-quotes-work/ ; /victoria/', 'P2 · Intent: Low (E-E-A-T)', 'Biography, credentials, photo and profile links come only from Guri (placeholders until then). No reviewer is named until one has signed. Do not publish with placeholder text: noindex until Guri supplies the bio.', cta='None (trust page). Quote form stays off.')
row(4, '/victoria/lpg-homes/', 'Guide – audience', 'I use bottled LPG. Which Victorian energy discounts can I get, and does the 2027 gas rule affect me?', 'Can I get the VEU hot water discount replacing LPG? | Can I replace an LPG heater or cooktop? | Which postcodes have no mains gas? | Is LPG covered by the 1 March 2027 rule?', "VEU Part 3 covers decommissioning a gas or LPG water heater [[ESCACT]] [[SPEC25]] | Energy Victoria publishes only a gas hot water figure; the LPG amount is set by the provider (the amount is UNVERIFIED) [[EVHW]] | Energy Victoria's non-ducted gas heater definition includes natural gas or LPG [[EVHC]] | Induction discount: premises with a gas or LPG connection (Spec Part 46) [[EVIND]] [[SPEC25]] | From 1 Mar 2027 reg 45E bans installing or like-for-like replacing a reticulated gas water heater connected to reticulated gas in existing Class 1/2 homes; a bottled-LPG water heater is not connected to reticulated gas, so it is outside the rule (piped estate LPG networks: provider/plumber confirms) [[REG45E]] | 313 of the 719 VEU Table A postcodes have no reticulated gas (postcodes.csv) [[SPEC25]]", '/victoria/postcode/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/gas-cooktop-to-induction/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/macedon-ranges/ ; /victoria/eligibility-checker/', 'P2 · Intent: Medium (regional; AI answers)', 'No LPG dollar figure (UNVERIFIED). LPG running costs: only with a cited source; otherwise leave them off. The checker LPG prompt (GAS-NO) links here. Reg 45E text re-read 14 Nov 2026 via search snippet of the AustLII page (direct fetch blocked by Cloudflare).', cta='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.')
