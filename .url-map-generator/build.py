import sys, re, csv
sys.path.insert(0,'.')
from sources import S
from rows import R, EXISTING
OUT='/workspace/ventures/niche-sites/household-rebates/'
CHK='13 Nov 2026'
NEW={'/victoria/business-heating-cooling/','/victoria/business-led-lighting/','/victoria/business-cold-rooms-refrigeration/','/victoria/business-hot-water-motors/','/victoria/battery-rebate/','/victoria/solar-panel-rebate/','/victoria/other-veu-discounts/','/victoria/help-in-your-language/','/about/gurinder-singh/','/victoria/lpg-homes/','/victoria/postcode/','/victoria/business-energy-upgrades/','/victoria/north-west-corridor/','/victoria/macedon-ranges/','/victoria/mitchell/','/victoria/latrobe-valley/','/victoria/mildura/','/victoria/melbourne-north/','/victoria/melbourne-west/','/victoria/melbourne-east/','/victoria/melbourne-south-east/'}
EDITED={'/victoria/shepparton/','/victoria/solstice-gas-shutdown-towns/','/victoria/ballarat/','/victoria/bendigo/','/victoria/wyndham/','/victoria/casey/','/victoria/whittlesea/','/victoria/yarra-ranges/'}
def chk(x): return '14 Nov 2026' if x['slug'] in NEW|EDITED else CHK
TOTAL=len(EXISTING)+len(R)
def md_facts(t):
    return re.sub(r'\[\[(\w+)\]\]', lambda m: f"([src]({S[m.group(1)][1]}))", t).replace(' | ','<br>• ').replace('|','\\|')
def csv_facts(t):
    return re.sub(r'\[\[(\w+)\]\]', lambda m: f"<{S[m.group(1)][1]}>", t)
def esc(t): return t.replace('|','\\|')
def md_links(t): return '<br>'.join(f"`{l.strip()}`" if l.strip().startswith('/') else esc(l.strip()) for l in t.split(';'))

# CSV
with open(OUT+'url-map.csv','w',newline='') as f:
    w=csv.writer(f)
    w.writerow(['wave','status','url_slug','page_type_template','primary_target_question','secondary_questions','key_verified_facts_with_source_urls','internal_links','cta','priority_and_intent','notes','facts_checked_on'])
    for u in EXISTING:
        w.writerow(['0 (live)','existing',u,'existing (see solution-design.md §4.1)','','','','','','','See "Changes needed on existing pages" in url-map.md',''])
    for x in R:
        w.writerow([x['wave'],'new',x['slug'],x['tpl'],x['q'],x['sec'],csv_facts(x['facts']),x['links'],x['cta'],x['prio'],csv_facts(x['notes']),chk(x)])

W={1:"Wave 1: money pages (upgrade guides, question pages and the /victoria/ hub)",2:"Wave 2: audience pages, tools and support guides (incl. postcode lookup and business guide)",3:"Wave 3: locations (incl. the 14 Nov 2026 coverage expansion)",4:"Wave 4: business pages, programs and trust pages (14 Nov 2026 business review, rows 65–74)"}
cnt={k:sum(1 for x in R if x['wave']==k) for k in W}
L=[]
a=L.append
a(f"# Household Rebates: URL map to {TOTAL} URLs")
a("")
a("Prepared 13 Nov 2026, revised 14 Nov 2026 (Melbourne time) by Venture Architect for Guri, as input for Indie Builder. Figures were checked against the linked page on 13 Nov 2026 (original rows) or 14 Nov 2026 (new and edited rows; see the CSV column facts_checked_on). No code touched, no prompts written. Companion files: `postcodes.csv` (VEU Table A, 719 postcodes, with locality and council) and `eligibility-checker-spec.md`.")
a("")
a("## Summary")
a("")
a(f"- **Total: {len(EXISTING)+len(R)} URLs** = {len(EXISTING)} live + {len(R)} new (Wave 1: {cnt[1]}, Wave 2: {cnt[2]}, Wave 3: {cnt[3]}, Wave 4: {cnt[4]}).")
a("- **Wave 4 (added 14 Nov 2026 from Indie's rows 65–74, all 10 kept):** 4 business pages under the existing `/victoria/business-energy-upgrades/` hub (heating/cooling, LED lighting, cold rooms/refrigeration, hot water/motors/spray valves), battery rebate (federal), solar panel rebate, other VEU discounts, help in your language, the author page `/about/gurinder-singh/`, and LPG homes. No separate `/victoria/business/` hub: the existing business page is the hub.")
a("- **postcodes.csv is the master** for every postcode list, count and gas/climate/zone value in this map. It is maintained by hand and is never regenerated.")
a("- **Locations (Wave 3, 17 new pages; 4 live area pages kept):** Ballarat, Bendigo, Shepparton, Wyndham, Casey, Whittlesea, Yarra Ranges, the Solstice gas-shutdown towns, plus (14 Nov) the north-west corridor (Sunbury, Diggers Rest, Melton, Gisborne), Macedon Ranges, Mitchell, Latrobe Valley, Mildura and four metro hubs (north, west, east, south-east). The live /victoria/melbourne/ page becomes the inner-Melbourne hub. Melton, Hume and Cardinia get no standalone page; the corridor and hub pages cover them (see 'Dropped locations').")
a("- **Every postcode is covered** by `/victoria/postcode/` and the checker's postcode step, both driven by `postcodes.csv`. There are no per-postcode pages.")
a("- **Search volume:** none used. Guri's Ahrefs is on the free plan and I had no volume data, so 'Intent' is a qualitative ranking (High / Medium / Low), not a measured volume.")
a("- **CTA on every page:** the eligibility checker (`/victoria/eligibility-checker/`). The quote form stays off.")
a("- **Every page needs:** its own target question, sourced figures through `<Money>` with a checked-on date, at least 3 internal links (listed per row), visible FAQ plus FAQPage schema (FAQ answers carry no $ amounts, per the faqs schema), and the IndependenceNotice.")
a("- URL style follows the live site: flat `/victoria/<slug>/` so the existing `victoria/[slug].astro` route keeps working.")
a("")
a("## Rule changes and corrections found (13–14 Nov 2026)")
a("")
a(f"1. **New VEU co-payments from 30 Sep 2026.** **Every ducted reverse-cycle system, of any capacity,** now needs at least **$3,000 incl GST** from the customer (was $1,000). Multi-split ≥ 10 kW: $3,000. Multi-split < 10 kW: $1,000. Single split < 10 kW: still $200. Source: [VEU Specifications v25.0]({S['SPEC25'][1]}), Part 6, and the [Energy Vic specifications page]({S['EVSPEC'][1]}). Energy Vic's consumer page doesn't mention it yet. **Existing pages `/victoria/air-conditioner-rebate/` and `/victoria/reverse-cycle-vs-gas-heater/`, and the checker's ducted results, need this added.**")
a(f"2. **2027 gas hot water exemptions are now verified.** solution-design.md §1 lists them as UNVERIFIED (third-party). I read the regulation text: [SR 140/2025 reg 6, new reg 45E (AustLII)]({S['REG45E'][1]}); authority: [legislation.vic.gov.au]({S['LEGVIC'][1]}). Full list in the `/victoria/gas-hot-water-ban-exemptions/` row. It includes contracts signed before 1 Mar 2027 if the work is done within 3 months.")
a(f"3. **New VEU product: ceiling insulation**: up to **$1,500** for a 150 m² house in metro Melbourne (mild) and **$2,100** in regional Victoria (cold). Stage 2 is open to all eligible homes. Sources: [Energy Vic]({S['EVINS'][1]}), [Solar Victoria]({S['SVINSN'][1]}). Added as a Wave 1 money page. **Geelong (answered 14 Nov):** neither figure applies cleanly. The spec formula is GHG savings by *climate region* × a *regional factor* by *metro/regional area* ([v25.0 Part 48, Tables 48.4–48.5]({S['SPEC25'][1]})). Geelong 3212–3227 is Regional but Mild, so it gets Melbourne's Mild savings value with the Regional factor (1.04 instead of 0.98), about 6% above the metro example: roughly **$1,590** (ASSUMPTION: same 150 m² house and certificate price). Don't quote $2,100 for Geelong; say 'about $1,500–$1,600, provider confirms'.")
a(f"4. **Solar Homes income cap cut to $150,000** (from $210,000) on 1 Jul 2026, for PV and hot water. [Source]({S['SVINCOME'][1]}). Existing `/victoria/heat-pump-rebate/` should state it.")
a(f"5. **Solar PV support moves into VEU from 1 Jul 2027.** Current PV rebates (up to $1,400 plus a loan) continue to 30 Jun 2027. [Source]({S['SVPVVEU'][1]}). This affects the reserved `/solar-battery/` section.")
a(f"6. **Stale figures on official pages. Don't use these:** Energy Vic's ['Latest discounts and rebates']({S['EVLATEST'][1]}) page (updated 24 Jul 2026) says ducted savings 'up to $1,410' a year (the product page says $1,140) and PV 'up to $2,800' (the PV page says $1,400). The [Solstice page]({S['SVSOL'][1]}) also says $2,800. Rule: product pages beat summary pages.")
a(f"7. **Solar for Apartments is mid-change.** The news (26 Oct 2026) says buildings of up to 150 lots and no property value limit, but the [program page]({S['SVAPT'][1]}) still says 3–50 lots.")
a(f"8. **VEET Act amended** (Act No. 37/2026). On proclamation it renames the Act to the 'Victorian Energy Upgrades Target Act' and VEECs to 'energy upgrade certificates'. Watch for wording changes. [ESC legislation page]({S['ESCLEG'][1]}).")
a(f"9. **Policy risk:** the Victorian state election is on 28 Nov 2026. DEECA's [work program]({S['EVMKT'][1]}) also lists pending responses on the water heating and space heating reviews, plus a new hydronic activity. Any of these could change the hot water or heating figures. Re-check right after the election.")
a(f"10. **Commercial flag (business side):** the state-owned SEC launched [Easy Electric SEC]({S['SEC'][1]}) on 25 May 2026, a free quote-matching service with endorsed installers. Councils (Whittlesea, Yarra Ranges) route residents to it. It competes directly with our lead-fee model. I recommend mentioning it openly on `/victoria/find-an-accredited-provider/`, and Guri should weigh it in the installer and lead-fee decisions.")
a(f"11. **LPG:** VEU hot water Part 3 covers 'gas or LPG' water heaters ([spec]({S['SPEC25'][1]})), but Energy Vic's table shows only a 'gas' figure. The LPG amount is UNVERIFIED, so say 'provider confirms'.")
a(f"12. **Yarra Energy Foundation is in voluntary administration** (seen 14 Nov 2026). Hume Home Energy Upgrades registrations are paused; only insulation and draught-proofing registrations made before 19 Oct 2026 continue ([Hume program site]({S['HUMEUPG'][1]})). YEF also partners other programs (e.g. Energise Gippsland), so re-check any YEF-linked program before quoting it. The separate [Council Home Energy Program]({S['HEP'][1]}) still lists 12 councils.")
a(f"13. **Residential Efficiency Scorecard closed on 23 Jun 2026** and is no longer a VEU activity ([v25.0 Part 45]({S['SPEC25'][1]})). Don't present Scorecard as a VEU offer.")
a("14. **Confirmed unchanged:** gas → heat pump $560; electric → heat pump $630; solar-boosted $910/$700; room gas → RCAC $630–$1,610; ducted gas up to $2,520/$4,200/$5,530; combined with Solar Homes up to $1,560/$1,960.")
a("")
a("## Dropped locations")
a("")
a("Rule: a standalone council page needs at least 4 genuinely local, sourced facts. Climate and gas data identical to Melbourne's don't count as local on their own.")
a("")
a(f"- **Melton (standalone): dropped again, but now covered.** Table A (3335–3338, 3427, 3023) is Metropolitan, gas and Mild, the same as Melbourne, and the council's [Living Green page]({S['MELTON'][1]}) offers only Power-Mate meter loans. In the new framing Melton is covered on `/victoria/north-west-corridor/` (with Diggers Rest's 93% Melton / 7% Hume split) and `/victoria/melbourne-west/`.")
a(f"- **Hume (standalone): dropped.** All 12 Hume postcodes are Metropolitan, gas and Mild, and the council program is [paused]({S['HUMEUPG'][1]}). Sunbury and Bulla go on the corridor page and the rest of Hume on `/victoria/melbourne-north/`. Revisit if the program restarts.")
a("- **Cardinia: dropped.** Table A is Metropolitan, gas and Mild except Koo Wee Rup 3981 (Regional, Cold). The council's Solar Savers page appeared only as a search-index extract; direct fetches returned 404 on 14 Nov 2026, so it's UNVERIFIED. Covered on `/victoria/melbourne-south-east/`.")
a("- **Wodonga: dropped.** Table A (3690, 3691, 3694) is Regional, gas and Cold, NCC zone 6. No council home-energy program could be verified (one community event only).")
a("- **Warrnambool: dropped.** No current resident program: the solar advice program ran in 2018–19, and the Carbon Reduction Framework is still in drafting for 2027.")
a("- **Moorabool (Bacchus Marsh): dropped.** Only community-group advice (BREAZE / Hepburn Energy) found, no council program. Bacchus Marsh 3340 is Regional, gas and Mild.")
a("- **Inner South East hub (Boroondara, Glen Eira, Stonnington, Bayside): not created.** All 27 postcodes are Metropolitan, gas and Mild. They're folded into the revised `/victoria/melbourne/` (inner Melbourne), which can carry the Council Home Energy Program (Yarra, Boroondara, Glen Eira, Stonnington) and Boroondara Solar Savers.")
a("- **Candidates for later** (not researched enough): Hepburn/Daylesford (all Cold, zone 5), Mount Alexander/Castlemaine (Cold, mostly off-gas), Wangaratta (8 of 10 postcodes off-gas), Golden Plains (no postcode on reticulated gas in Table A), Bass Coast (7 of 10 off-gas). Each has a strong Table A story but still needs a verified council fact base.")
a(f"- **Earlier decisions kept:** Shepparton is now firmer (Solar Savers verified via [GMCA]({S['GMCA'][1]})). Wyndham stays marginal.")
a("")
a("## Method notes for Indie Builder")
a("")
a(f"- **postcodes.csv (14 Nov):** all 719 Table A postcodes. Columns: postcode, veu_area, reticulated_gas, veu_climatic_region, heat_pump_zone, localities (top 10 by dwellings), primary_lga, primary_lga_share_pct, other_lgas (with %), dwellings_2021, lga_locality_source, notes. Locality and council come from the [ABS ASGS Edition 3 allocation files]({S['ABSALLOC'][1]}): POA 2021 × SAL 2021 × LGA 2025 by mesh block, weighted by 2021 Census dwellings. 25 PO-box or campus postcodes have no dwellings; their locality is from the community dataset matthewproctor/australianpostcodes and their council is inferred from the same town's residential postcode, flagged 'indicative'. Metro hubs group postcodes by primary LGA into the [Plan Melbourne regions]({S['PLANREG'][1]}).")
a(f"- **VEU postcode table:** SPEC25's 'Location Variable List' (Table A) gives every postcode as Metropolitan/Regional, reticulated gas yes/no, climatic region Mild/Cold/Hot, and heat pump climatic zone 4/5. I parsed 719 rows from the v25.0 PDF. Area pages should quote this table for their postcodes, and the size guide can use it for 'cold area' notes.")
a(f"- **NCC climate zones:** checked by point-in-polygon against the [ABCB climate zone shapefile]({S['ABCB'][1]}) (CC BY 4.0, attribution required) at town-centre coordinates. Results: Ballarat 7, Yarra Ranges (Lilydale, Healesville, Olinda, Warburton) 7, Shepparton 4, Bendigo 6, and Melbourne, Geelong, Frankston, Mornington, Wyndham, Melton, Casey and Whittlesea all 6. Added 14 Nov: Diggers Rest, Sunbury, Craigieburn, Mernda, Caroline Springs, Werribee, Bacchus Marsh, Wallan, Kilmore, Seymour, Pakenham, Officer, Cranbourne, Traralgon, Wodonga and Warrnambool are 6; Gisborne, New Gisborne, Macedon, Riddells Creek, Woodend, Kyneton, Romsey and Lancefield are 7; Mildura is 4. On the page, tell readers to confirm by postcode on the [ABCB Climate Map]({S['ABCBMAP'][1]}).")
a("- **Provider counts** (Energy Vic regional lists, 13 Nov 2026), hot water / heating-cooling: Barwon South West 30/50, Gippsland 19/38, Grampians 31/46, Greater Melbourne 79/116, Hume 27/60, Loddon Mallee 26/42. They change often; re-check monthly or drop the numbers.")
a("- **Checker:** fully re-specified as a cascading Residential/Business form in `eligibility-checker-spec.md` (14 Nov). It adds insulation, induction, weather sealing, business products, Solar Homes and federal batteries, and is driven by postcodes.csv.")
a("- energy.vic.gov.au is behind Cloudflare and rate-limits parallel fetches. `check-sources.mjs` should fetch one page at a time.")
a("")
for k,title in W.items():
    a(f"## {title} ({cnt[k]} URLs)")
    a("")
    a("| # | URL slug | Template | Primary target question | Secondary questions | Key verified facts (checked 13–14 Nov 2026) | Internal links (≥3) | CTA | Priority / intent | Notes |")
    a("|---|---|---|---|---|---|---|---|---|---|")
    i=0
    for x in R:
        if x['wave']!=k: continue
        i+=1
        a(f"| {k}.{i} | `{x['slug']}` | {esc(x['tpl'])} | {esc(x['q'])} | {esc(x['sec'])} | • {md_facts(x['facts'])} | {md_links(x['links'])} | Eligibility checker | {esc(x['prio'])} | {md_facts(x['notes'])} |")
    a("")
a("## Changes needed on existing pages (not new URLs)")
a("")
a("| Existing URL | Change | Source |")
a("|---|---|---|")
for u,c,s in [
 ("/victoria/air-conditioner-rebate/","Add the co-payments from 30 Sep 2026: ducted of any capacity $3,000; multi-split ≥ 10 kW $3,000; multi-split < 10 kW $1,000; non-ducted ≥ 10 kW $1,000; single non-ducted < 10 kW $200 (all incl GST).","SPEC25"),
 ("/victoria/reverse-cycle-vs-gas-heater/","Same co-payment note where ducted is discussed.","SPEC25"),
 ("/victoria/gas-to-electric-hot-water-2027/","Replace the UNVERIFIED exemptions note with the verified reg 45E list (or link to the new exemptions page).","REG45E"),
 ("/victoria/heat-pump-rebate/","Add the Solar Homes $150,000 income cap (from 1 Jul 2026), property < $3m, system ≥ 3 years.","SVHW"),
 ("/victoria/geelong/","Insulation: Greater Geelong's 14 postcodes (3212–3227 except 3221 Surf Coast and 3225 Queenscliffe) are all Regional and Mild in Table A, so neither $1,500 nor $2,100 applies exactly. By the Part 48 formula it's about $1,590 for a 150 m² house (ASSUMPTION; provider confirms). Add Geelong Sustainability's Electric Homes Program 2026–27 (Greater Geelong, Surf Coast, Golden Plains, Colac Otway, Queenscliffe; EOI opened 5 Oct 2026).","GEELEHL"),
 ("/victoria/melbourne/","Rescope as the inner-Melbourne hub: Inner Metro + Inner South East (Melbourne, Port Phillip, Yarra, Stonnington, Glen Eira, Boroondara, Bayside) = 52 postcodes, all Metropolitan, gas, Mild, zone 4 (list from postcodes.csv), replacing the 6-postcode list. Add the Council Home Energy Program (Yarra, Boroondara, Glen Eira, Stonnington). Link the 4 hubs, the corridor and /victoria/postcode/.","HEP"),
 ("/victoria/melbourne/ (cont.)","Boroondara Solar Savers: free assessment plus up to $2,000 off eligible upgrades, to 31 Dec 2026 or until funds run out.","EGBOR"),
 ("/victoria/eligibility-checker/","Rebuild to eligibility-checker-spec.md (cascading Residential/Business form driven by postcodes.csv).","SPEC25"),
 ("/ (home)","Link the new /victoria/ hub and the Wave 1 money pages.","—"),
 ("/about/","Link the new author page /about/gurinder-singh/ from the 'edited by Gurinder Singh' line.","—"),
 ("All pages with a hero figure","35 of 52 crawled pages show a hero figure and none has a caption (re-count of site-crawl-2026-11-14.json; the review's '44' was wrong). Add a one-line caption saying what each figure is.","—"),
]:
    a(f"| `{u}` | {c} | {('[src]('+S[s][1]+')') if s in S else s} |")
a("")
a(f"## Full sitemap tree ({TOTAL} URLs)")
a("")
a("```")
tree = ["/                                   (live)",
"├── about/                          (live)",
"│   └── gurinder-singh/             (NEW W4, author page)",
"├── faq/                            (live)",
"├── how-quotes-work/                (live)",
"├── privacy/                        (live)",
"├── sources/                        (live)",
"├── terms/                          (live)",
"└── victoria/                       (NEW hub, W1)",
"    ├── eligibility-checker/        (live)",
"    ├── ── Rebate guides (live) ──",
"    ├── air-conditioner-rebate/     (live)",
"    ├── heat-pump-rebate/           (live)",
"    ├── reverse-cycle-vs-gas-heater/ (live)",
"    ├── gas-to-electric-hot-water-2027/ (live)",
"    ├── ── Upgrade guides (W1) ──"]
for x in R:
    pass
up=[x['slug'] for x in R if x['wave']==1 and 'upgrade' in x['tpl']]
qs=[x['slug'] for x in R if x['wave']==1 and 'question' in x['tpl']]
for s in up: tree.append(f"    ├── {s.replace('/victoria/','')}  (NEW W1)")
tree.append("    ├── ── Question pages (W1) ──")
for s in qs: tree.append(f"    ├── {s.replace('/victoria/','')}  (NEW W1)")
tree.append("    ├── ── Audience (W2) ──")
for s in ['renters/','landlords-rental-standards-2027/','concession-card-holders/','new-homes-all-electric-2027/','apartments-and-units/']: tree.append(f"    ├── {s}  (NEW W2)")
tree.append("    ├── ── Tools (W2) ──")
for s in ['postcode/','gas-vs-heat-pump-running-costs/','heat-pump-hot-water-size-guide/','get-off-gas-planner/']: tree.append(f"    ├── {s}  (NEW W2)")
tree.append("    ├── ── Support guides (W2) ──")
for s in ['draught-proofing-rebate/','find-an-accredited-provider/','business-energy-upgrades/']: tree.append(f"    ├── {s}  (NEW W2)")
tree.append("    ├── ── Business pages (W4, under business-energy-upgrades/) ──")
for s in ['business-heating-cooling/','business-led-lighting/','business-cold-rooms-refrigeration/','business-hot-water-motors/']: tree.append(f"    ├── {s}  (NEW W4)")
tree.append("    ├── ── Programs, audience and trust (W4) ──")
for s in ['battery-rebate/','solar-panel-rebate/','other-veu-discounts/','help-in-your-language/','lpg-homes/']: tree.append(f"    ├── {s}  (NEW W4)")
tree.append("    ├── ── Areas ──")
for s in ['melbourne/  (live; becomes the inner-Melbourne hub)','geelong/  (live)','frankston/  (live)','mornington-peninsula/  (live)']: tree.append(f"    ├── {s}")
w3=[x['slug'].replace('/victoria/','') for x in R if x['wave']==3]
for j,s in enumerate(w3): tree.append(f"    {'└' if j==len(w3)-1 else '├'}── {s}  (NEW W3)")
for t in tree: a(t)
a("```")
a("")
a("Noindex utilities (`/thanks/`, `/form-error/`, `/404.html`) are not counted.")
a("")
a("## Facts to re-check monthly (and right after the 28 Nov 2026 state election)")
a("")
for t in [
 f"Energy Vic product tables and 'page last updated' dates: [heating/cooling]({S['EVHC'][1]}), [hot water]({S['EVHW'][1]}), [induction]({S['EVIND'][1]}), [insulation]({S['EVINS'][1]}), [weather sealing]({S['EVSEAL'][1]}), [glazing]({S['EVGLAZ'][1]}).",
 f"VEU Specifications version (v25.0 now) and the Part 6 co-payments: [specifications page]({S['EVSPEC'][1]}). Also the water heating and space heating review outcomes on the [work program]({S['EVMKT'][1]}).",
 f"Solar Homes hot water rebate ($1,000 / $1,400), $150k income cap, $3m property cap, 3-year system age: [hot water rebate]({S['SVHW'][1]}).",
 f"Solar PV rebate ($1,400) and the 1 Jul 2027 move into VEU: [PV]({S['SVPV'][1]}), [transition]({S['SVPVVEU'][1]}).",
 f"Solar for Apartments lot limit (50 vs 150) and the 30 Jun 2027 close: [program]({S['SVAPT'][1]}).",
 f"Rental minimum standards and exemptions: [CAV]({S['CAVMEES'][1]}), [Energy Vic rental page]({S['EVRENTAL'][1]}).",
 f"Reg 45E: in-force version and any amendment before 1 Mar 2027: [legislation.vic.gov.au]({S['LEGVIC'][1]}).",
 f"Retrospective discount time limit: [Energy Vic]({S['EVRETRO'][1]}).",
 f"Concession amounts and thresholds ($171.60, $4,038.82, $62.40, $2,598.58): [electricity]({S['DFFHAEC'][1]}), [gas]({S['DFFHGAS'][1]}).",
 f"Solstice town list, exemptions and the $600 top-up (time-limited): [Solar Victoria]({S['SVSOL'][1]}).",
 f"Council programs: [Whittlesea assessments to June 2027]({S['WHITHEP'][1]}), [Casey $200 rebate budget]({S['CASEY'][1]}), [Ballarat program status]({S['BALL'][1]}), [Bendigo program]({S['BEND'][1]}), [Wyndham]({S['WYN'][1]}), [Yarra Ranges]({S['YARRA'][1]}), Shepparton (verify first).",
 "Accredited provider counts per region (if published on area pages).",
 f"Hume Home Energy Upgrades restart and the YEF administration outcome: [Hume program]({S['HUMEUPG'][1]}). Council Home Energy Program council list: [CHEP]({S['HEP'][1]}).",
 f"Goulburn Murray Solar Savers council list: [GMCA]({S['GMCA'][1]}) (cite GMCA only; the Greater Shepparton council page returned 504 on 13 and 14 Nov 2026). Geelong Electric Homes Program round: [Electric Homes]({S['GEELEH'][1]}). SEC heat pump pilot areas: [Premier]({S['PREMLAT'][1]}).",
 f"Business product figures: [cold rooms]({S['EVCOLD'][1]}), [motors]({S['EVMOTOR'][1]}), [lighting]({S['EVLIGHT'][1]}), [C&I PV]({S['EVCIPV'][1]}).",
 f"STC eligibility for heat pumps (< 425 L, register): [CER]({S['CERHW'][1]}).",
 f"VEET Act rename commencement (VEEC wording): [ESC]({S['ESCLEG'][1]}).",
 f"Easy Electric SEC scope (competitor watch): [SEC]({S['SEC'][1]}).",
 f"Insulation provider list (3 providers on 13 Nov 2026): [Energy Vic]({S['EVINS'][1]}).",
]:
    a(f"- {t}")
a("")
a("## Source index (checked 13–14 Nov 2026)")
a("")
a("| Key | Source | URL | Page date |")
a("|---|---|---|---|")
used=set()
for x in R: used|=set(re.findall(r'\[\[(\w+)\]\]', x['facts']+x['notes']))
used|={'EVSPEC','EVLATEST','MELTON','LEGVIC','ABCBMAP','EVMKT','ABSALLOC','PLANREG','GEELEH','GEELEHL','EGBOR','HEP','HUMEUPG','GMCA'}
for k,(lab,url,d) in S.items():
    if k in used: a(f"| {k} | {esc(lab)} | {url} | {d} |")
a("")
open(OUT+'url-map.md','w').write('\n'.join(L))
print('written', len(L),'lines')
