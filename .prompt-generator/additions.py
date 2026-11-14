# SUPERSEDED 14 Nov 2026: rows 65-74 are merged into the master url-map.csv (Wave 4). Kept for history; gen2.py no longer imports this file. Do not run it.
"""Proposed url-map rows 65-74 from the 14 Nov 2026 business review.
Facts come only from business-review-2026-11-14.md, eligibility-checker-spec.md,
postcodes.csv and the live site (crawl). Writes url-map-additions-2026-11-14.csv.
Row numbers are provisional: if Venture Architect's master map gains rows first,
append these after it and renumber."""
import csv, pathlib
BASE = pathlib.Path(__file__).parent.parent
EVHC='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts>'
EVHW='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>'
SPEC='<https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>'
EVBIZ='<https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses>'
EVBIZCUST='<https://www.energy.vic.gov.au/victorian-energy-upgrades/businesses/custom-upgrades>'
EVLIGHT='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/lighting-discounts>'
EVCOLD='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/cold-room-discounts>'
EVFRIDGE='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/refrigerator-and-freezer-discounts>'
EVMOTOR='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/upgrade-your-motor>'
EVPRV='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/pre-rinse-spray-valve-discounts>'
EVPROD='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products>'
EVGLAZ='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/window-glazing-discounts>'
DCCEEW='<https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries>'
CER='<https://cer.gov.au/news-and-media/media/2026/march/battery-rebates-are-changing-1-may-2026>'
SVPV='<https://www.solar.vic.gov.au/solar-panel-rebate>'
SVINC='<https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance>'
SVPVVEU='<https://www.solar.vic.gov.au/solar-support-continue-through-victorian-energy-upgrades-program>'
SVEG='<https://www.solar.vic.gov.au/electrification-grants>'
EVTR='<https://www.energy.vic.gov.au/households/translations>'
SVLANG='<https://www.solar.vic.gov.au/community-languages>'
ECCV='<https://eccv.org.au/projects/empowering-multicultural-communities-at-home/>'
ESCACT='<https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/overview-veu-activities>'
EVIND='<https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>'
REG45E='<https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>'
MPS='<https://www.energy.vic.gov.au/households/save-energy-and-money/victorian-midday-power-saver>'
CTA='Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.'
CTAB='Eligibility checker, Business path (/victoria/eligibility-checker/). Quote form stays off; no business lead capture until a business AP agreement is signed.'
D='14 Nov 2026'
W='4 (review)'
rows = [
 dict(n=65, prompt='28', url_slug='/victoria/business-heating-cooling/', page_type_template='Guide – business (navGroup business)',
  primary_target_question='What VEU discounts can a Victorian business get for heating and cooling?',
  secondary_questions='Which business sizes are listed (16, 25, 32, 56 kW)? | What is the minimum the business pays? | Can a new building get it? | Are large energy users excluded?',
  key_verified_facts_with_source_urls=' | '.join([
   f'All Victorian households and businesses are eligible for a heating and cooling discount {EVHC}',
   f'Business examples: non-ducted gas heater → 3–9 kW RCAC $420 to $1,050; ducted gas → 4 splits up to $1,680; ducted gas → multi-split 10 kW up to $1,820; ducted gas → ducted 16 / 25 / 32 / 56 kW up to $2,590 / $3,850 / $6,230 / $8,820; central electric ducted 16–56 kW up to $4,060; existing ducted RCAC $910 / $1,400 / $3,010 / $3,290; existing non-ducted RCAC $210 to $490; hard-wired electric room heater up to $490; no product decommissioned: ducted up to $1,820, room $70 to $140 {EVHC}',
   f'Same Part 6 minimum co-payments as homes from 30 Sep 2026: $3,000 incl GST for any ducted system; multi-split $3,000 at 10 kW or more, $1,000 below {SPEC}',
   f'Replacement discounts need a building more than 2 years old {EVHC}',
   f'Sites on the ESC Register of Scheduled Activity Premises are excluded unless they opt in {EVBIZ}']),
  internal_links='/victoria/business-energy-upgrades/ ; /victoria/veu-minimum-co-payment/ ; /victoria/find-an-accredited-provider/ ; /victoria/veu-scams-cold-calls/ ; /victoria/eligibility-checker/',
  cta=CTAB, priority_and_intent='P2 · Intent: Medium-High (B2B, commercial)',
  notes='From the business review §7 item 5 and eligibility-checker-spec.md §2.4 and §5.3 (BH-1..7). Show the size table, never the largest figure alone. Checker result lines BH-* link here.'),
 dict(n=66, prompt='28', url_slug='/victoria/business-led-lighting/', page_type_template='Guide – business (navGroup business)',
  primary_target_question='Can a Victorian business still get a VEU discount for LED lighting?',
  secondary_questions='Why only fluorescent indoor lights? | What about car parks and outdoor lighting? | Can councils get street lighting discounts? | Do apartment common areas count?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Commercial and industrial lighting is a business-only VEU product {EVPROD}',
   f'Indoor lighting upgrades now only qualify when the existing lights are fluorescent {EVLIGHT}',
   f'Examples: 100 × 24 W fluorescent tubes → 50 LED $1,260; 20 metal halide car park lights → LED high bays $3,150; 100 street lights $21,350 (councils and road authorities) {EVLIGHT}',
   f'Public lighting is Spec Part 27; Part 34 lists Class 2 common areas, so apartment common-area lighting is possible and the provider confirms {SPEC}']),
  internal_links='/victoria/business-energy-upgrades/ ; /victoria/apartments-and-units/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/',
  cta=CTAB, priority_and_intent='P2 · Intent: Medium (B2B)',
  notes='Spec rules BL-1..4 and message N-LIGHT. The fluorescent-only rule goes in the answer block. Common areas: "possibly, provider confirms" only.'),
 dict(n=67, prompt='28', url_slug='/victoria/business-cold-rooms-refrigeration/', page_type_template='Guide – business (navGroup business)',
  primary_target_question='What VEU discounts are there for cold rooms and commercial refrigeration in Victoria?',
  secondary_questions='Does my cool room qualify (size and temperature)? | What is the minimum contribution? | What about display fridges and fan motors? | Can a cafe, butcher or grocer apply?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Cold rooms: walk-in, at least 4 m² floor area, storing goods below 7 °C or running as a freezer; indicative small / medium / large $420 / $1,540 / $4,620; $500 minimum contribution {EVCOLD}',
   f'Household-type fridges and freezers (250–700 L, at least 5.5 stars for fridges and 4 stars for freezers) up to $70, open to businesses too {EVFRIDGE}',
   f'Refrigerated display cabinets (Part 32) and refrigeration fan motors (Part 33) are VEU activities with no published consumer figure; the provider confirms {SPEC}',
   f'Cold rooms are a business-only VEU product {EVPROD}']),
  internal_links='/victoria/business-energy-upgrades/ ; /victoria/business-hot-water-motors/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/',
  cta=CTAB, priority_and_intent='P2 · Intent: Medium (B2B; cafes, butchers, grocers, farms)',
  notes='Spec rules BR-1..4 and message N-COLD. Display cabinets and fan motors: no figure, "provider confirms".'),
 dict(n=68, prompt='28', url_slug='/victoria/business-hot-water-motors/', page_type_template='Guide – business (navGroup business)',
  primary_target_question='What VEU discounts can a business get for hot water, motors and commercial kitchen spray valves?',
  secondary_questions='How many hot water systems can a business upgrade? | What changes for large commercial heat pumps? | Which motor sizes are listed? | What is a pre-rinse spray valve discount?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Businesses can upgrade up to 5 standard hot water systems at the household figures (electric → heat pump $630, electric → solar-boosted $910, gas → heat pump $560, gas → solar-boosted $700), $200 minimum each {EVHW}',
   f'Larger commercial and industrial heat pumps have no limit on number, no published consumer figure, and a $10,000 minimum contribution (Spec Part 44) {EVHW} {SPEC}',
   f'Motors: e.g. 15 kW premium $280; 75 kW high-efficiency $560 or premium $1,120; up to $2,380 (185 kW premium); $200 minimum {EVMOTOR}',
   f'Motors over 185 kW: ask about a custom (M&V) upgrade {EVBIZCUST}',
   f'Pre-rinse spray valves $210 each, where a valve or fitting is already installed {EVPRV}']),
  internal_links='/victoria/business-energy-upgrades/ ; /victoria/business-cold-rooms-refrigeration/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/find-an-accredited-provider/ ; /victoria/eligibility-checker/',
  cta=CTAB, priority_and_intent='P3 · Intent: Medium (B2B)',
  notes='Spec rules BW-1..3, BM-1..2, BK-1..2 and message N-PRV. No figure for large C&I heat pumps.'),
 dict(n=69, prompt='30', url_slug='/victoria/battery-rebate/', page_type_template='Guide – program (federal, label FEDERAL)',
  primary_target_question='Is there a battery rebate in Victoria, and how does the federal Cheaper Home Batteries discount work?',
  secondary_questions='How much is the discount? | Why does the size matter (14, 28, 50 kWh)? | What changes on 1 Jan 2027? | Do I need solar panels? | Can a business get it?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Cheaper Home Batteries: households, businesses and community organisations; small-scale batteries 5–100 kWh connected to new or existing solar PV; accredited installer; discount through STCs; around 30% off the upfront cost {DCCEEW}',
   f'STC factor 6.8 per kWh for May–Dec 2026, 5.7 from 1 Jan 2027, then lower every 6 months to 2030; the installation date sets the rate {DCCEEW}',
   f'Taper since 1 May 2026: 100% of the factor up to 14 kWh, 60% for 14–28 kWh, 15% for 28–50 kWh {DCCEEW} {CER}']),
  internal_links='/victoria/solar-panel-rebate/ ; /victoria/veu-vs-solar-homes/ ; /victoria/business-energy-upgrades/ ; /victoria/eligibility-checker/',
  cta=CTA, priority_and_intent='P1 · Intent: High (hard date: 1 Jan 2027)',
  notes='Label the program FEDERAL. A Victorian battery rebate is UNVERIFIED (spec §9): say nothing about one. A report of further cuts (Finder) is unconfirmed: keep it off the page. The alert sign-up (prompt 29b) sits here. Not a battery sub-site.'),
 dict(n=70, prompt='30', url_slug='/victoria/solar-panel-rebate/', page_type_template='Guide – program (Solar Homes)',
  primary_target_question='How much is the Victorian solar panel rebate, and what changes on 1 July 2027?',
  secondary_questions='Who is eligible (income, property value, 10-year rule)? | Is the interest-free loan still offered? | Can I get it on a home under construction? | What about rentals? | What about businesses?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Solar Homes PV rebate up to $1,400 plus an optional interest-free loan of the same amount; owner-occupier of an existing home or one under construction; approval before install {SVPV}',
   f'Combined owners taxable income under $150,000 from 1 Jul 2026 (was $210,000); property under $3m {SVINC} {SVPV}',
   f'Not available where the address had a Solar Homes PV or battery rebate, or where solar was installed in the last 10 years {SVPV}',
   f'Rental properties are eligible and the $150,000 cap applies to rentals too (detailed landlord and tenant criteria: see Solar Victoria) {SVPV} {SVINC}',
   f'PV support moves into VEU from 1 Jul 2027; current arrangements stay until 30 Jun 2027 {SVPVVEU}',
   f'Residential Electrification Grants through approved builders (including Metricon, Henley and Six Star Plus): up to $1,400 for PV and $1,400 for hot water, aimed at first-home buyers {SVEG}']),
  internal_links='/victoria/veu-vs-solar-homes/ ; /victoria/battery-rebate/ ; /victoria/apartments-and-units/ ; /victoria/new-homes-all-electric-2027/ ; /victoria/business-energy-upgrades/ ; /victoria/eligibility-checker/',
  cta=CTA, priority_and_intent='P1 · Intent: High',
  notes='Business solar (30–200 kW) is on the business hub, not here. Rental criteria detail is UNVERIFIED: link Solar Victoria, no detail. Don\'t use the stale "up to $2,800" on Energy Vic\'s Latest discounts page or the Solstice page.'),
 dict(n=71, prompt='30', url_slug='/victoria/other-veu-discounts/', page_type_template='Guide – question (AEO)',
  primary_target_question='What other VEU discounts are there for Victorian homes (windows, dryers, fridges, shower heads, TVs)?',
  secondary_questions='How much is each? | Can businesses get any of them? | Is the Residential Efficiency Scorecard still part of VEU? | Is there a pool pump or EV charger discount?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Window glazing up to $210 per 10 m² for single-glazed windows (households and most businesses) {EVGLAZ}',
   f'Heat pump dryer, shower head, fridge or freezer, in-home display and TV: up to $70 each {EVPROD}',
   f'Fridges and freezers: 250–700 L, at least 5.5 stars (fridge) or 4 stars (freezer) {EVFRIDGE}',
   f'The Residential Efficiency Scorecard closed on 23 Jun 2026 and is no longer a VEU activity (Spec Part 45) {SPEC}',
   f'Pool pumps are listed by the ESC as an activity but have no current consumer discount page; pool heat pumps are not on Energy Victoria\'s product list {ESCACT} {EVPROD}']),
  internal_links='/victoria/draught-proofing-rebate/ ; /victoria/gas-cooktop-to-induction/ ; /victoria/ceiling-insulation-rebate/ ; /victoria/what-is-a-veec/ ; /victoria/eligibility-checker/',
  cta=CTA, priority_and_intent='P3 · Intent: Medium (completes the topic for AI answers)',
  notes='Low value each. The EV charger FAQ is a decision for Guri (the review found no household EV charger rebate; Solar Victoria gives guidance only).'),
 dict(n=72, prompt='31', url_slug='/victoria/help-in-your-language/', page_type_template='Guide – support (trust)',
  primary_target_question='Where can I get information about energy rebates in my language?',
  secondary_questions='Which languages are available? | Can I get an interpreter on the phone? | Where is the VEU consumer-rights factsheet in my language? | How do I avoid scams?',
  key_verified_facts_with_source_urls=' | '.join([
   f'Energy Victoria publishes the VEU consumer-rights factsheet in 13 languages, including Arabic, Chinese (Simplified and Traditional), Filipino, Hazaragi, Hindi, Khmer, Punjabi, Sinhalese, Turkish and Vietnamese {EVTR}',
   f'Solar Victoria publishes Solar Homes summaries in 15 languages, including Hindi, Punjabi, Simplified and Traditional Chinese, Vietnamese, Tamil and Sinhalese {SVLANG}',
   f'ECCV publishes a go-electric brochure in 11 languages {ECCV}',
   'Translating and Interpreting Service (TIS National) 131 450 (use the source the scams page already cites)']),
  internal_links='/victoria/veu-scams-cold-calls/ ; /victoria/concession-card-holders/ ; /victoria/wyndham/ ; /how-quotes-work/ ; /victoria/eligibility-checker/',
  cta=CTA, priority_and_intent='P2 · Intent: Medium (trust; Wyndham, Hume, Melton, Casey)',
  notes='Links only; no machine-translated pages. Any later Punjabi or Hindi summary is a separate map row and must be reviewed by a fluent human. Language names in their own scripts, copied from the official pages.'),
 dict(n=73, prompt='32', url_slug='/about/gurinder-singh/', page_type_template='Trust – author page (Person)',
  primary_target_question='Who writes and checks Household Rebates?',
  secondary_questions='How are figures checked? | How is the site paid for? | Who reviews the technical pages? | How do I report an error?',
  key_verified_facts_with_source_urls=' | '.join([
   'Household Rebates is published by Agenor Services Pty Ltd (ABN 29 644 447 263); all guides and fact-checks are edited by Gurinder Singh (live /about/ page)',
   'Every figure links to an official source with a checked-on date; the build blocks figures more than 45 days old (site method, design §5.3)',
   'Installers may pay for enquiries (IndependenceNotice on every page)']),
  internal_links='/about/ ; /sources/ ; /how-quotes-work/ ; /victoria/',
  cta='None (trust page). Quote form stays off.', priority_and_intent='P2 · Intent: Low (E-E-A-T)',
  notes='Biography, credentials, photo and profile links come only from Guri (placeholders until then). No reviewer is named until one has signed.'),
 dict(n=74, prompt='33', url_slug='/victoria/lpg-homes/', page_type_template='Guide – audience',
  primary_target_question='I use bottled LPG. Which Victorian energy discounts can I get, and does the 2027 gas rule affect me?',
  secondary_questions='Can I get the VEU hot water discount replacing LPG? | Can I replace an LPG heater or cooktop? | Which postcodes have no mains gas? | Is LPG covered by the 1 March 2027 rule?',
  key_verified_facts_with_source_urls=' | '.join([
   f'VEU Part 3 covers decommissioning a gas or LPG water heater {ESCACT} {SPEC}',
   f'Energy Victoria publishes only a gas hot water figure; the LPG amount is set by the provider (the amount is UNVERIFIED) {EVHW}',
   f'Energy Victoria\'s non-ducted gas heater definition includes natural gas or LPG {EVHC}',
   f'Induction discount: premises with a gas or LPG connection (Spec Part 46) {EVIND} {SPEC}',
   f'Bottled LPG systems are outside the 1 March 2027 mains-gas replacement rule (reg 45E) {REG45E}',
   f'313 of the 719 VEU Table A postcodes have no reticulated gas (postcodes.csv) {SPEC}']),
  internal_links='/victoria/postcode/ ; /victoria/gas-hot-water-to-heat-pump/ ; /victoria/gas-cooktop-to-induction/ ; /victoria/gas-room-heater-to-split-system/ ; /victoria/macedon-ranges/ ; /victoria/eligibility-checker/',
  cta=CTA, priority_and_intent='P2 · Intent: Medium (regional; AI answers)',
  notes='No LPG dollar figure (UNVERIFIED). LPG running costs: only with a cited source; otherwise leave them off. The checker LPG prompt (GAS-NO) links here.'),
]
COLS = ['wave','status','url_slug','page_type_template','primary_target_question','secondary_questions','key_verified_facts_with_source_urls','internal_links','cta','priority_and_intent','notes','facts_checked_on']
def full(r):
    d = {k: r.get(k, '') for k in COLS}
    d.update(wave=W, status='new', facts_checked_on=D)
    return d
if __name__ == '__main__':
    with open(BASE/'url-map-additions-2026-11-14.csv','w',newline='') as f:
        w = csv.writer(f); w.writerow(['proposed_row','added_by_prompt']+COLS)
        for r in rows: w.writerow([r['n'], r['prompt']]+[full(r)[k] for k in COLS])
    print('wrote', len(rows), 'rows')
