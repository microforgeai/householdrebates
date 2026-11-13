import sys, re, csv
sys.path.insert(0,'.')
from sources import S
from rows import R, EXISTING
OUT='/workspace/ventures/niche-sites/household-rebates/'
CHK='13 Nov 2026'
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
        w.writerow([x['wave'],'new',x['slug'],x['tpl'],x['q'],x['sec'],csv_facts(x['facts']),x['links'],x['cta'],x['prio'],x['notes'],CHK])

W={1:"Wave 1: money pages (upgrade guides, question pages and the /victoria/ hub)",2:"Wave 2: audience pages, tools and two support guides",3:"Wave 3: locations"}
cnt={k:sum(1 for x in R if x['wave']==k) for k in W}
L=[]
a=L.append
a("# Household Rebates: URL map to 53 URLs")
a("")
a(f"Prepared 13 Nov 2026 (Melbourne time) by Venture Architect for Guri, as input for Indie Builder. Every figure was checked on {CHK} against the linked page. No code touched, no prompts written.")
a("")
a("## Summary")
a("")
a(f"- **Total: {len(EXISTING)+len(R)} URLs** = {len(EXISTING)} live + {len(R)} new (Wave 1: {cnt[1]}, Wave 2: {cnt[2]}, Wave 3: {cnt[3]}).")
a("- **Locations:** 7 of the 8 candidates are included (Ballarat, Bendigo, Shepparton, Wyndham, Casey, Whittlesea, Yarra Ranges), plus a new multi-town page for the 10 Solstice gas-shutdown towns. **Melton is dropped** (see 'Dropped locations').")
a("- **Search volume:** none used. Guri's Ahrefs is on the free plan and I had no volume data, so 'Intent' is a qualitative ranking (High / Medium / Low), not a measured volume.")
a("- **CTA on every page:** the eligibility checker (`/victoria/eligibility-checker/`). The quote form stays off.")
a("- **Every page needs:** its own target question, sourced figures through `<Money>` with a checked-on date, at least 3 internal links (listed per row), visible FAQ plus FAQPage schema (FAQ answers carry no $ amounts, per the faqs schema), and the IndependenceNotice.")
a("- URL style follows the live site: flat `/victoria/<slug>/` so the existing `victoria/[slug].astro` route keeps working.")
a("")
a("## Rule changes and corrections found (13 Nov 2026)")
a("")
a(f"1. **New VEU co-payments from 30 Sep 2026.** Ducted reverse-cycle (any size) now needs at least **$3,000 incl GST** from the customer (was $1,000). Multi-split ≥ 10 kW: $3,000. Multi-split < 10 kW: $1,000. Single split < 10 kW: still $200. Source: [VEU Specifications v25.0]({S['SPEC25'][1]}), Part 6, and the [Energy Vic specifications page]({S['EVSPEC'][1]}). Energy Vic's consumer page doesn't mention it yet. **Existing pages `/victoria/air-conditioner-rebate/` and `/victoria/reverse-cycle-vs-gas-heater/`, and the checker's ducted results, need this added.**")
a(f"2. **2027 gas hot water exemptions are now verified.** solution-design.md §1 lists them as UNVERIFIED (third-party). I read the regulation text: [SR 140/2025 reg 6, new reg 45E (AustLII)]({S['REG45E'][1]}); authority: [legislation.vic.gov.au]({S['LEGVIC'][1]}). Full list in the `/victoria/gas-hot-water-ban-exemptions/` row. It includes contracts signed before 1 Mar 2027 if the work is done within 3 months.")
a(f"3. **New VEU product: ceiling insulation**, up to **$1,500** in metro Melbourne and **$2,100** in regional Victoria (150 m² example). Stage 2 is open to all eligible homes. Sources: [Energy Vic]({S['EVINS'][1]}) and [Solar Victoria]({S['SVINSN'][1]}). Not in the current pack; added as a Wave 1 money page.")
a(f"4. **Solar Homes income cap cut to $150,000** (from $210,000) on 1 Jul 2026, for PV and hot water. [Source]({S['SVINCOME'][1]}). Existing `/victoria/heat-pump-rebate/` should state it.")
a(f"5. **Solar PV support moves into VEU from 1 Jul 2027.** Current PV rebates (up to $1,400 plus a loan) continue to 30 Jun 2027. [Source]({S['SVPVVEU'][1]}). This affects the reserved `/solar-battery/` section.")
a(f"6. **Stale figures on official pages. Don't use these:** Energy Vic's ['Latest discounts and rebates']({S['EVLATEST'][1]}) page (updated 24 Jul 2026) says ducted savings 'up to $1,410' a year (the product page says $1,140) and PV 'up to $2,800' (the PV page says $1,400). The [Solstice page]({S['SVSOL'][1]}) also says $2,800. Rule: product pages beat summary pages.")
a(f"7. **Solar for Apartments is mid-change.** The news (26 Oct 2026) says buildings of up to 150 lots and no property value limit, but the [program page]({S['SVAPT'][1]}) still says 3–50 lots.")
a(f"8. **VEET Act amended** (Act No. 37/2026). On proclamation it renames the Act to the 'Victorian Energy Upgrades Target Act' and VEECs to 'energy upgrade certificates'. Watch for wording changes. [ESC legislation page]({S['ESCLEG'][1]}).")
a(f"9. **Policy risk:** the Victorian state election is on 28 Nov 2026. DEECA's [work program]({S['EVMKT'][1]}) also lists pending responses on the water heating and space heating reviews, plus a new hydronic activity. Any of these could change the hot water or heating figures. Re-check right after the election.")
a(f"10. **Commercial flag (business side):** the state-owned SEC launched [Easy Electric SEC]({S['SEC'][1]}) on 25 May 2026, a free quote-matching service with endorsed installers. Councils (Whittlesea, Yarra Ranges) route residents to it. It competes directly with our lead-fee model. I recommend mentioning it openly on `/victoria/find-an-accredited-provider/`, and Guri should weigh it in the installer and lead-fee decisions.")
a(f"11. **LPG:** VEU hot water Part 3 covers 'gas or LPG' water heaters ([spec]({S['SPEC25'][1]})), but Energy Vic's table shows only a 'gas' figure. The LPG amount is UNVERIFIED, so say 'provider confirms'.")
a("12. **Confirmed unchanged:** gas → heat pump $560; electric → heat pump $630; solar-boosted $910/$700; room gas → RCAC $630–$1,610; ducted gas up to $2,520/$4,200/$5,530; combined with Solar Homes up to $1,560/$1,960.")
a("")
a("## Dropped locations")
a("")
a(f"- **Melton: dropped.** Its VEU postcode data (3335, 3337, 3338, 3427: Metropolitan, reticulated gas, Mild) and NCC zone 6 match Melbourne exactly. The council's [Living Green page]({S['MELTON'][1]}) only links state programs and offers a Power-Mate Lite meter loan, with no local home-energy program or rebate. That gives fewer than 4 genuinely local facts. Revisit if Melton launches a program (it's a member of the Western Alliance for Greenhouse Action, so watch WAGA).")
a("- **Shepparton: kept, conditionally.** It passes on 4 verified facts (VEU postcode table, NCC zone 4, regional insulation figure, Hume provider counts). The council's Solar Savers page returned a 504 error on 13 Nov 2026, so that program is UNVERIFIED and must be checked before publishing.")
a("- **Wyndham: kept, but marginal.** Its climate and gas status are the same as Melbourne; the local value is the council program (Energy Smart Homes, library kits, interpreted webinars including Punjabi).")
a("")
a("## Method notes for Indie Builder")
a("")
a(f"- **VEU postcode table:** SPEC25's 'Location Variable List' (Table A) gives every postcode as Metropolitan/Regional, reticulated gas yes/no, climatic region Mild/Cold/Hot, and heat pump climatic zone 4/5. I parsed 719 rows from the v25.0 PDF. Area pages should quote this table for their postcodes, and the size guide can use it for 'cold area' notes.")
a(f"- **NCC climate zones:** checked by point-in-polygon against the [ABCB climate zone shapefile]({S['ABCB'][1]}) (CC BY 4.0, attribution required) at town-centre coordinates. Results: Ballarat 7, Yarra Ranges (Lilydale, Healesville, Olinda, Warburton) 7, Shepparton 4, Bendigo 6, and Melbourne, Geelong, Frankston, Mornington, Wyndham, Melton, Casey and Whittlesea all 6. On the page, tell readers to confirm by postcode on the [ABCB Climate Map]({S['ABCBMAP'][1]}).")
a("- **Provider counts** (Energy Vic regional lists, 13 Nov 2026), hot water / heating-cooling: Barwon South West 30/50, Gippsland 19/38, Grampians 31/46, Greater Melbourne 79/116, Hume 27/60, Loddon Mallee 26/42. They change often; re-check monthly or drop the numbers.")
a("- **Checker gaps** for Indie Builder to scope: no insulation, induction or weather-sealing paths; ducted results need the $3,000 co-payment; the LPG row needs 'provider confirms'.")
a("- energy.vic.gov.au is behind Cloudflare and rate-limits parallel fetches. `check-sources.mjs` should fetch one page at a time.")
a("")
for k,title in W.items():
    a(f"## {title} ({cnt[k]} URLs)")
    a("")
    a("| # | URL slug | Template | Primary target question | Secondary questions | Key verified facts (checked 13 Nov 2026) | Internal links (≥3) | CTA | Priority / intent | Notes |")
    a("|---|---|---|---|---|---|---|---|---|---|")
    i=0
    for x in R:
        if x['wave']!=k: continue
        i+=1
        a(f"| {k}.{i} | `{x['slug']}` | {esc(x['tpl'])} | {esc(x['q'])} | {esc(x['sec'])} | • {md_facts(x['facts'])} | {md_links(x['links'])} | Eligibility checker | {esc(x['prio'])} | {esc(x['notes'])} |")
    a("")
a("## Changes needed on existing pages (not new URLs)")
a("")
a("| Existing URL | Change | Source |")
a("|---|---|---|")
for u,c,s in [
 ("/victoria/air-conditioner-rebate/","Add the new co-payments ($3,000 ducted / multi-split ≥ 10 kW; $200 single split < 10 kW).","SPEC25"),
 ("/victoria/reverse-cycle-vs-gas-heater/","Same co-payment note where ducted is discussed.","SPEC25"),
 ("/victoria/gas-to-electric-hot-water-2027/","Replace the UNVERIFIED exemptions note with the verified reg 45E list (or link to the new exemptions page).","REG45E"),
 ("/victoria/heat-pump-rebate/","Add the Solar Homes $150,000 income cap (from 1 Jul 2026), property < $3m, system ≥ 3 years.","SVHW"),
 ("/victoria/geelong/","Geelong postcodes 3216/3218/3220 are 'Regional' (Mild) in the VEU postcode table, so the regional insulation figure may apply. Provider confirms; don't promise $2,100.","SPEC25"),
 ("/victoria/eligibility-checker/","Scope new paths (insulation, induction, weather sealing), the co-payment note and LPG wording. Indie Builder to design.","SPEC25"),
 ("/ (home)","Link the new /victoria/ hub and the Wave 1 money pages.","—"),
]:
    a(f"| `{u}` | {c} | {('[src]('+S[s][1]+')') if s in S else s} |")
a("")
a("## Full sitemap tree (53 URLs)")
a("")
a("```")
tree = ["/                                   (live)",
"├── about/                          (live)",
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
for s in ['gas-vs-heat-pump-running-costs/','heat-pump-hot-water-size-guide/','get-off-gas-planner/']: tree.append(f"    ├── {s}  (NEW W2)")
tree.append("    ├── ── Support guides (W2) ──")
for s in ['draught-proofing-rebate/','find-an-accredited-provider/']: tree.append(f"    ├── {s}  (NEW W2)")
tree.append("    ├── ── Areas ──")
for s in ['melbourne/','geelong/','frankston/','mornington-peninsula/']: tree.append(f"    ├── {s}  (live)")
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
 f"STC eligibility for heat pumps (< 425 L, register): [CER]({S['CERHW'][1]}).",
 f"VEET Act rename commencement (VEEC wording): [ESC]({S['ESCLEG'][1]}).",
 f"Easy Electric SEC scope (competitor watch): [SEC]({S['SEC'][1]}).",
 f"Insulation provider list (3 providers on 13 Nov 2026): [Energy Vic]({S['EVINS'][1]}).",
]:
    a(f"- {t}")
a("")
a("## Source index (all checked 13 Nov 2026)")
a("")
a("| Key | Source | URL | Page date |")
a("|---|---|---|---|")
used=set()
for x in R: used|=set(re.findall(r'\[\[(\w+)\]\]', x['facts']))
used|={'EVSPEC','EVLATEST','MELTON','LEGVIC','ABCBMAP','EVMKT'}
for k,(lab,url,d) in S.items():
    if k in used: a(f"| {k} | {esc(lab)} | {url} | {d} |")
a("")
open(OUT+'url-map.md','w').write('\n'.join(L))
print('written', len(L),'lines')
