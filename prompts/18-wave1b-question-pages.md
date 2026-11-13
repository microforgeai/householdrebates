# Prompt 18: Wave 1b: 9 question pages (AEO)

> Local only. This adds 9 URLs (map rows 27–35) and completes Wave 1 (19 URLs). The deploy STOP at the end needs Guri's yes. This is the recommended point to deploy Wave 1.
> Run it after prompt 17. Branch: `feat/expansion-18-wave1b`.

---

## Context

These pages answer one question each, for answer engines and for people mid-decision: what a VEEC is, the new minimum co-payment, claiming twice, VEU vs Solar Homes, scams, the March 2027 timing, the exemption list, already-installed upgrades, and how long an upgrade takes. The structure from prompt 17 (`navGroup`, `RelatedLinks`, `HubIndex`, `check-urlmap`, `rollout.json`) is already in place.

Two pages carry regulation content (rows 32 and 33). They are plain-English summaries of SR 140/2025 reg 45E, **not legal advice**. Guri reads them against the regulation text before publishing.

Any map note that says "the checker has no … path" is out of date: prompt 16 added those paths.

## Rules for every page and file in this prompt

These are the build guards from prompts 03–10. They don't relax for the expansion.

1. **Source of truth.** Use the row for the page in `docs/url-map.csv`, which is copied below. For live pages, use the "Changes needed on existing pages" table in `docs/url-map.md`. Use **only** the facts and sources in that row, plus figures already in `site/src/content/figures/vic-veu.yaml`. Don't invent numbers, dates, counts or program names. Before you write a fact, re-open its source. If the source now says something different, **stop and tell Guri**. Don't pick a number yourself.
2. **UNVERIFIED stays off the page.** Anything the map marks UNVERIFIED, "confirm", "trade site", "per search" or "stale" goes in the TODO list at the end of this prompt. It doesn't go in copy, an FAQ, a figure or schema.
3. **Figures only from the data file.** Render every dollar amount through `<Money id>` or `<FigureTable group>`. Render every percentage and every volatile count (provider counts, rebate counts) the same way, using `unit: percent | count` (prompt 15). List every id in the page's `figures` frontmatter. Never type a `$` amount into MDX, a title, a description, an FAQ answer, alt text or JSON-LD. `check-figures` fails the build if you do.
4. **Freshness.** A figure's `checkedOn` must be 45 days old or less (`MAX_FIGURE_AGE_DAYS=45`), or the build fails. Set `checkedOn` on new figures to the day Guri re-checks the source, not to the map date, if those differ.
5. **Answer first.** The H1 is followed by an `answer` of 2–4 sentences that stands alone if quoted (`check-answers`). One H1 per page.
6. **Wording.** Write in Australian English: plain, second person, short sentences, no hype and no exclamation marks. Say "discount" for VEU, and use "indicative", "up to", "Energy Victoria lists…" and "the accredited provider confirms". Never write "you will get", "you qualify", "guaranteed", "free" (unless you're quoting an official program's own name or description, attributed and linked), "claim now" or "government rebate approved" (`check-copy`). Never imply that we're the government or part of VEU. `IndependenceNotice` appears on every page.
7. **Titles and meta.** Titles are 60 characters or fewer and descriptions are 70–160 characters, with no dollar amounts in either (`check-seo`).
8. **FAQ and schema.** Every new page has a visible FAQ of 3–5 entries in `content/faqs/` and a matching `FAQPage`. FAQ answers carry no `$` amounts; link to the section instead. The allowed schema types are `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage`, and `HowTo` only where the page is a genuine step-by-step. Never use `LocalBusiness`, `Offer`, `Product` with a price, `GovernmentService` or `AggregateRating`. No currency anywhere in JSON-LD (`check-schema`).
9. **Links.** Include every internal link in the row. Put at least 2 of them in the body copy, and put the rest in the `RelatedLinks` block from prompt 17. Every page links to `/victoria/eligibility-checker/`. External links go only to the sources in the row.
10. **The quote form stays off.** Use `leadForm: false` on every new page. Don't change `PUBLIC_LEADS_ENABLED`, `LEADS_ENABLED`, `api/installers.json`, `site/src/content/installers/` or the API. The CTA is the eligibility checker.
11. **No pages beyond the map.** Don't add suburb, postcode or town pages that aren't rows in `docs/url-map.csv` (`check-urlmap` fails on extras).
12. **Metadata.** Use `author: Gurinder Singh`. Set `publishedOn`, `updatedOn` and `checkedOn` to the day Guri checks the page.
13. **Conflicts.** If the map conflicts with itself, with `docs/solution-design.md` or with a live source, write it in `docs/expansion-log.md` under "Conflicts", leave that point off the page, and tell Guri. Don't guess.

## Steps

1. Set `rollout.json` → `"enabledRows": "1-35"`.
2. **Figures:** append 4 rows (re-open the source; stop on any difference):

   | id | group | scenario | qualifier | unit | max | audience | source |
   |---|---|---|---|---|---|---|---|
   | `vic-veu-copay-business-large` | `vic-veu-copayments-business` | Larger commercial and industrial upgrades | minimum | AUD | 10000 | business | energyvic-hot-water |
   | `vic-solar-homes-pv-rebate` | `vic-solar-homes-pv` | Solar Homes solar panel (PV) rebate, plus an optional interest-free loan | up-to | AUD | 1400 | household | solarvic-pv-rebate |
   | `vic-solar-homes-hw-extra-2026-27` | `vic-solar-homes-hotwater` | Extra hot water rebates in 2026–27 | exact | count | 27000 | household | solarvic-income-cap-news |
   | `vic-plumbing-cert-threshold` | `vic-plumbing` | Plumbing work value above which a compliance certificate is required | more-than | AUD | 750 | household | bpc-plumbing-compliance |

   `check-figures` allows a business figure only on `/victoria/veu-minimum-co-payment/` (prompt 15 rule).
3. Write the 9 pages below with `navGroup: question-pages`.
4. **Links that the new pages make possible:**
   - Home: add `question-pages` to the compact `HubIndex`.
   - `/victoria/gas-to-electric-hot-water-2027/` → `/victoria/gas-hot-water-ban-exemptions/` and `/victoria/gas-hot-water-broken-before-or-after-march-2027/`.
   - `/victoria/reverse-cycle-vs-gas-heater/` → `/victoria/already-installed-retrospective-discount/`.
   - `/victoria/air-conditioner-rebate/` co-payment section → `/victoria/veu-minimum-co-payment/`.
   - Checker: `RESULT_LINKS.retro.internal = '/victoria/already-installed-retrospective-discount/'` and `RESULT_LINKS['gas-2027'].internal` stays as it is.
5. `HowTo` JSON-LD only on row 35 (genuine steps, at least 3). Update design §10.2, which said `/how-quotes-work/` only.
6. Run the checks and fix anything that fails.

## Pages (map rows 27–35)

### Row 27: `/victoria/what-is-a-veec/`

- **File:** `site/src/content/guides/vic/what-is-a-veec.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** What is a VEEC and how does it pay for my discount?
- **Secondary questions (a section or FAQ item each):** Who buys VEECs? · Why does my discount change? · Is VEU a government rebate?
- **Priority / intent:** P2 · Intent: Medium (informational; strong AEO/GEO target)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Each VEEC represents one tonne of greenhouse gas emissions reduction (CO2-e); created by accredited persons; bought by energy retailers who must surrender them each year <https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/victorian-energy-efficiency-certificates-veecs>
  - Providers sell certificates to retailers and that sale funds the discount <https://www.energy.vic.gov.au/victorian-energy-upgrades/about>
  - The final discount depends on certificate price, product, location and provider <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/insulation-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/window-glazing-discounts>
  - Energy Vic's induction figure is 'based on a certificate price of $70' <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Act No. 37/2026 will rename the VEET Act and VEECs ('energy upgrade certificates') on proclamation <https://www.esc.vic.gov.au/victorian-energy-upgrades-program/about-victorian-energy-upgrades-program/veu-program-legislation>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/veu-minimum-co-payment/` · `/victoria/veu-vs-solar-homes/` · `/how-quotes-work/` · `/victoria/air-conditioner-rebate/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Don't publish a live VEEC spot price: the only sources are trader sites, not official. The rename commencement date (proclamation, or automatically 2 Oct 2028) comes from a trade summary; mark it UNVERIFIED until checked in Act 37/2026 itself.
- **Figure ids:** `vic-veu-induction-cert-price-basis` (as Energy Victoria's worked example only, labelled 'the certificate price Energy Victoria based its induction figure on').
- No live or recent VEEC spot price. Say the rename happens 'on proclamation'. Don't give a date (TODO).

### Row 28: `/victoria/veu-minimum-co-payment/`

- **File:** `site/src/content/guides/vic/veu-minimum-co-payment.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** What is the minimum I have to pay under the VEU program (the co-payment)?
- **Secondary questions (a section or FAQ item each):** Why can't the discount cover everything? · Can an installer refund the co-payment? · Did it change in 2026?
- **Priority / intent:** P1 · Intent: Medium–High (pre-purchase; protects against 'free aircon' offers)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Hot water (activities 1 and 3): $200 incl GST minimum <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Heating/cooling from 30 Sep 2026: single non-ducted split < 10 kW $200; non-ducted ≥ 10 kW $1,000; multi-split < 10 kW $1,000; multi-split ≥ 10 kW $3,000; ducted (any) $3,000; all incl GST <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Before 30 Sep 2026 ducted was $1,000 <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Ceiling insulation $200; induction $200 per product <https://www.energy.vic.gov.au/__data/assets/pdf_file/0041/795488/Victorian-Energy-Upgrades-Specifications-2018-Version-25.pdf>
  - Larger commercial/industrial: $10,000 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/ducted-gas-to-ducted-reverse-cycle/` · `/victoria/ducted-gas-to-split-systems/` · `/victoria/what-is-a-veec/` · `/victoria/veu-scams-cold-calls/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** RULE CHANGE (30 Sep 2026). Energy Vic's consumer product page doesn't show it yet; cite the spec PDF. Strong anti-scam angle: 'free ducted' offers can't be legitimate.
- **Figure ids:** the whole `vic-veu-copayments` group, `vic-veu-copay-ducted-until-sep-2026`, `vic-veu-min-contribution`, `vic-veu-copay-business-large` (new, business, minimum 10,000; the only page allowed a business figure).
- Anti-scam angle: a 'free' ducted system can't be a genuine VEU offer. Link to `/victoria/veu-scams-cold-calls/`.

### Row 29: `/victoria/can-you-claim-veu-twice/`

- **File:** `site/src/content/guides/vic/can-you-claim-veu-twice.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** Can I get a VEU discount more than once, or claim VEU and other rebates together?
- **Secondary questions (a section or FAQ item each):** How many hot water systems? · Can I claim induction twice? · Can I stack VEU + Solar Homes + STCs?
- **Priority / intent:** P2 · Intent: Medium (informational)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Households can upgrade up to 2 hot water systems (businesses up to 5) <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Induction: must not have previously claimed an induction discount <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
  - Solar Homes hot water: address must not have already had a Solar Homes hot water or battery rebate <https://www.solar.vic.gov.au/hot-water-rebate>
  - Solar Homes rebate is calculated after STCs and VEECs, so they combine <https://www.solar.vic.gov.au/hot-water-rebate>
  - VEU + Solar Homes hot water combined up to $1,560 / $1,960 <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/veu-vs-solar-homes/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/gas-cooktop-to-induction/` · `/victoria/heat-pump-rebate/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Heating/cooling repeat-claim limits (e.g. 'one ducted system per home') appear only on trade sites: UNVERIFIED; say 'provider confirms'.
- **Figure ids:** `vic-hw-veu-plus-solar-homes`, `vic-hw-veu-plus-solar-homes-local`.
- Heating and cooling repeat limits: write 'ask the accredited provider'. Don't state a limit (TODO).

### Row 30: `/victoria/veu-vs-solar-homes/`

- **File:** `site/src/content/guides/vic/veu-vs-solar-homes.mdx`
- **Template (map):** Guide – question (comparison)
- **Primary question (build the H1 and answer block on it):** What's the difference between Victorian Energy Upgrades and the Solar Homes program?
- **Secondary questions (a section or FAQ item each):** Who runs each? · Is there an income test? · Do renters qualify? · What happens to solar rebates in 2027?
- **Priority / intent:** P1 · Intent: Medium–High (comparison; strong AEO)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - VEU: market-based discounts via accredited providers; all households eligible; no income test on product pages <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/heating-and-cooling-discounts> <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Solar Homes hot water: owner-occupier, income < $150,000 (from 1 Jul 2026, was $210,000), property < $3m <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance> <https://www.solar.vic.gov.au/hot-water-rebate>
  - Solar PV rebate up to $1,400 plus optional matching interest-free loan <https://www.solar.vic.gov.au/solar-panel-rebate>
  - PV support moves into VEU from 1 Jul 2027; current PV arrangements stay until 30 Jun 2027 <https://www.solar.vic.gov.au/solar-support-continue-through-victorian-energy-upgrades-program>
  - Extra 27,000 hot water rebates in 2026–27 <https://www.solar.vic.gov.au/solar-homes-program-continuing-provide-targeted-assistance>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/heat-pump-rebate/` · `/victoria/can-you-claim-veu-twice/` · `/victoria/what-is-a-veec/` · `/victoria/apartments-and-units/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** RULE CHANGES: the income cap fell to $150k on 1 Jul 2026, and PV moves into VEU on 1 Jul 2027. Energy Vic's 'Latest discounts' page and the Solstice page still say PV 'up to $2,800'. That's stale: use $1,400 from the PV rebate page.
- **Figure ids:** `vic-solar-homes-income-cap`, `vic-solar-homes-income-cap-until-jun-2026`, `vic-solar-homes-property-cap`, `vic-solar-homes-pv-rebate` (new, up to 1,400), `vic-solar-homes-hw-extra-2026-27` (new, count 27,000).
- A comparison table (VEU vs Solar Homes: who runs it, how you get it, income test, property cap, what it covers) is fine. Amounts only via `<Money>`. **Never** use PV $2,800 (stale).

### Row 31: `/victoria/veu-scams-cold-calls/`

- **File:** `site/src/content/guides/vic/veu-scams-cold-calls.mdx`
- **Template (map):** Guide – question (trust/AEO)
- **Primary question (build the H1 and answer block on it):** Is a cold call or door-knock about a free government energy upgrade a scam?
- **Secondary questions (a section or FAQ item each):** Are cold calls banned? · What must a VEU marketer tell me? · Where do I report it?
- **Priority / intent:** P1 · Intent: Medium (informational; trust builder)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Cold-call telemarketing banned from 1 May 2024; doorknocking from 1 Aug 2024, unless express prior consent <https://www.esc.vic.gov.au/victorian-energy-upgrades/updates-reports-reviews-and-data/updates-veu-program/cold-call-telemarketing-and-doorknocking-bans-under-victorian-energy-upgrades-program>
  - Marketers must not claim to work for VEU, the ESC or the Victorian Government, or say an upgrade is mandatory; must say it's voluntary <https://www.esc.vic.gov.au/victorian-energy-upgrades/energy-saving-information-consumers/your-consumer-rights-victorian-energy-upgrades-program>
  - Providers acknowledge complaints within 5 business days and try to resolve within 20 <https://www.esc.vic.gov.au/victorian-energy-upgrades/energy-saving-information-consumers/your-consumer-rights-victorian-energy-upgrades-program>
  - Complaints: Consumer Affairs Victoria 131 450; ESC (03) 9032 1310, veu@esc.vic.gov.au; Do Not Call register 1300 792 958 <https://www.energy.vic.gov.au/victorian-energy-upgrades/about/your-rights> <https://www.esc.vic.gov.au/victorian-energy-upgrades/report-non-compliance-victorian-energy-upgrades-program>
- **Internal links (every one required; `check-urlmap` fails without them):** `/how-quotes-work/` · `/victoria/veu-minimum-co-payment/` · `/victoria/find-an-accredited-provider/` · `/about/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Must state plainly that Household Rebates isn't a government site and never cold-calls (consistent with the IndependenceNotice).
- No dollar figures. Phone numbers and email are contact details. Put them in the copy as written on the ESC and Energy Victoria pages, and re-check them monthly.
- Say plainly: Household Rebates isn't a government website and never cold-calls or doorknocks.

### Row 32: `/victoria/gas-hot-water-broken-before-or-after-march-2027/`

- **File:** `site/src/content/guides/vic/gas-hot-water-broken-before-or-after-march-2027.mdx`
- **Template (map):** Guide – question (AEO, time-sensitive)
- **Primary question (build the H1 and answer block on it):** My gas hot water broke. Can I still replace it with gas before 1 March 2027, and what happens after?
- **Secondary questions (a section or FAQ item each):** If I sign a contract before 1 March 2027? · Under warranty? · Does it apply to LPG? · Renters?
- **Priority / intent:** P1 · Intent: High (urgent, problem-aware)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - From 1 Mar 2027 a gas water heater (incl pool heater) needing replacement in an existing home can't be replaced with another mains gas heater <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts> <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
  - Transitional: work done within 3 months after 1 Mar 2027 under a contract signed with the owner before 1 Mar 2027 is exempt <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - Replacement during the manufacturer, supplier or installer warranty is exempt <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - LPG not affected <https://www.planning.vic.gov.au/guides-and-resources/strategies-and-initiatives/victorias-gas-substitution-roadmap>
  - Rentals: unrepairable heater after 1 Mar 2027 → efficient electric (heat pump or electric-boosted solar) <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/energy-efficiency-for-rental-properties-in-victoria>
  - Gas space heating and cooktops can stay <https://www.energy.vic.gov.au/households/save-with-all-electric-home/electric-and-efficiency-standards-for-buildings/existing-residential-buildings>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-to-electric-hot-water-2027/` · `/victoria/gas-hot-water-ban-exemptions/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/how-long-does-an-upgrade-take/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Traffic will peak Jan–Jun 2027. Exempt work must be done by 1 Jun 2027 (3 months after 1 Mar 2027); confirm that date wording with the reg text before publishing.
- **Figure ids:** none needed. Link to the hot water guides for amounts.
- Write 'within 3 months after 1 March 2027' for the contract exemption. Don't write 'by 1 June 2027' (TODO).
- Time-sensitive: add `reviewBy: 2027-03-01` in the frontmatter (new optional field), so it shows in the monthly re-check list.

### Row 33: `/victoria/gas-hot-water-ban-exemptions/`

- **File:** `site/src/content/guides/vic/gas-hot-water-ban-exemptions.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** What are the exemptions to Victoria's 2027 gas hot water rule?
- **Secondary questions (a section or FAQ item each):** Not enough space? · Apartment with central gas? · Switchboard upgrade needed? · Network upgrade?
- **Priority / intent:** P1 · Intent: Medium–High (informational; low competition likely)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Reg 45E(3): not enough space inside or no suitable outdoor space; Class 2 building or pool on a centralised gas system; electric option unlawful under another law; would need a main switchboard or distribution board alteration; would need network augmentation beyond a basic/standard connection <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - Reg 45E(4): temporary disconnect/reconnect; like-for-like where the gas heater needs no electricity connection to run; replacement within warranty <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - Reg 45E(5): contracts signed before 1 Mar 2027 (work within 3 months); building work under s10(1)/(2) before 1 Mar 2027; rectification orders issued before 1 Mar 2027 <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
  - Gazette confirms the switchboard, no-electricity and warranty exemptions <https://www.gazette.vic.gov.au/gazette/Gazettes2025/GG2025S654.pdf>
  - Penalty: 20 penalty units for the plumber <https://classic.austlii.edu.au/au/legis/vic/num_reg/bapar2025n140o2025463/s6.html>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/gas-to-electric-hot-water-2027/` · `/victoria/gas-hot-water-broken-before-or-after-march-2027/` · `/victoria/apartments-and-units/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** CORRECTION: solution-design §1 marks this list UNVERIFIED (third-party). It's now checked against the SR 140/2025 reg 6 text (AustLII, as made). Link legislation.vic.gov.au as the authority. Not legal advice; plumbers decide.
- **Figure ids:** none. '20 penalty units' isn't a dollar figure; write it as is.
- Link `legvic-bpar-2025` as the authority and `austlii-reg-45e` for the text. Say it's a plain-English summary, not legal advice, and that the plumber decides. Guri reads it against the regulation before publishing.
- Add the link from `/victoria/gas-to-electric-hot-water-2027/` to this page now that it exists.

### Row 34: `/victoria/already-installed-retrospective-discount/`

- **File:** `site/src/content/guides/vic/already-installed-retrospective-discount.mdx`
- **Template (map):** Guide – question (AEO)
- **Primary question (build the H1 and answer block on it):** I already bought or installed the system. Can I still get the VEU discount?
- **Secondary questions (a section or FAQ item each):** What evidence do I need? · Is there a deadline? · Does it matter what I removed?
- **Priority / intent:** P2 · Intent: Medium (problem-aware)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Retrospective discounts are possible only in very limited cases and are not guaranteed <https://www.energy.vic.gov.au/victorian-energy-upgrades/about/retrospective-discounts>
  - Must be processed within 6 months of the end of the calendar year of the upgrade (e.g. Dec 2025 upgrade → by 30 Jun 2026) <https://www.energy.vic.gov.au/victorian-energy-upgrades/about/retrospective-discounts>
  - Evidence: invoice with brand/model, compliance certificates, decommissioning and disposal evidence, geo-tagged before/after photos <https://www.energy.vic.gov.au/victorian-energy-upgrades/about/retrospective-discounts>
  - Easier where nothing was decommissioned <https://www.energy.vic.gov.au/victorian-energy-upgrades/about/retrospective-discounts>
  - Induction cooktops bought before 30 Jun 2026 must be on the old Part 46 product list <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/induction-cooktop-discounts>
- **Internal links (every one required; `check-urlmap` fails without them):** `/victoria/eligibility-checker/` · `/victoria/find-an-accredited-provider/` · `/how-quotes-work/` · `/victoria/gas-cooktop-to-induction/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** Matches the checker's RETRO branch. Link this page from that result.
- **Figure ids:** none.
- Switch `RESULT_LINKS.retro.internal` in the checker to this page (prompt 16 left it external). Also link here from `/victoria/reverse-cycle-vs-gas-heater/` (the timing rule page), so it has inbound links.

### Row 35: `/victoria/how-long-does-an-upgrade-take/`

- **File:** `site/src/content/guides/vic/how-long-does-an-upgrade-take.mdx`
- **Template (map):** Guide – question (HowTo)
- **Primary question (build the H1 and answer block on it):** How long does a VEU hot water or heating upgrade take, from quote to paperwork?
- **Secondary questions (a section or FAQ item each):** When do I get the compliance certificate? · How long does Solar Homes pre-approval give me? · How long does gas abolishment take?
- **Priority / intent:** P2 · Intent: Medium (informational)
- **CTA:** Eligibility checker (/victoria/eligibility-checker/). Quote form stays off.
- **Verified facts you may use (checked 13 Nov 2026; re-open each source while writing):**
  - Plumbing compliance certificate: required over $750 or for any Type A gas appliance work; issued within 5 days of completion <https://www.vba.vic.gov.au/consumers/home-renovation-essentials/plumbing-compliance-certificates>
  - Solar Homes: get pre-approval first, then install within 120 days <https://www.solar.vic.gov.au/hot-water-rebate>
  - Accredited provider confirms models, quotes with the discount, installs and does the paperwork <https://www.energy.vic.gov.au/victorian-energy-upgrades/products/hot-water-system-discounts>
  - Gas abolishment via your retailer: meter removal 2 business days, service cut-and-cap up to 15 business days (AusNet) <https://www.ausnetservices.com.au/gas/connections/requesting-a-gas-disconnection-reconnection-or-abolishment>
- **Internal links (every one required; `check-urlmap` fails without them):** `/how-quotes-work/` · `/victoria/gas-hot-water-to-heat-pump/` · `/victoria/get-off-gas-planner/` · `/victoria/gas-hot-water-broken-before-or-after-march-2027/` · `/victoria/eligibility-checker/`
- **Map notes (follow them; anything UNVERIFIED stays off the page):** There's no official 'typical install time' figure, so don't state hours or days for the install itself. HowTo schema with 3+ steps. Abolishment times are AusNet's; other distributors may differ.
- **Figure ids:** `vic-plumbing-cert-threshold` (new, more-than 750, source `bpc-plumbing-compliance`).
- `HowTo` schema with 3 or more genuine steps, and no `estimatedCost` or time values. Don't state install hours or days. Abolishment times are AusNet's, so say so.

## Acceptance checks

```bash
cd site
npm run check && npm run build
node scripts/check-figures.mjs   # expect: "check-figures: 57 figures, 0 stale, 0 raw amounts, 0 schema amounts"
node scripts/check-urlmap.mjs    # expect: "check-urlmap: 35 URLs (expected 35), 0 extra, 0 missing links, 0 orphans, sitemap 35, llms 35"
grep -c '<loc>' dist/sitemap-0.xml                                                     # expect: 35
grep -c '"@type":"HowTo"' dist/victoria/how-long-does-an-upgrade-take/index.html       # expect: 1
grep -c 'estimatedCost\|totalTime' dist/victoria/how-long-does-an-upgrade-take/index.html   # expect: 0
grep -c 'data-figure="vic-veu-copay-business-large"' dist/victoria/veu-minimum-co-payment/index.html   # expect: 1
grep -RIl 'data-figure="vic-veu-copay-business-large"' dist | wc -l                     # expect: 1
grep -c '1 June 2027' dist/victoria/gas-hot-water-broken-before-or-after-march-2027/index.html   # expect: 0
grep -c 'legislation.vic.gov.au' dist/victoria/gas-hot-water-ban-exemptions/index.html  # expect: ≥ 1
grep -ci 'not legal advice' dist/victoria/gas-hot-water-ban-exemptions/index.html       # expect: ≥ 1
grep -c '2,800' dist/victoria/veu-vs-solar-homes/index.html                             # expect: 0
grep -ci 'spot price\|today.s VEEC price' dist/victoria/what-is-a-veec/index.html       # expect: 0
grep -c 'already-installed-retrospective-discount' dist/victoria/eligibility-checker/index.html   # expect: ≥ 1
npm run test     # expect: RESULT_LINKS test passes (internal targets are built)
```

## What to test by hand

- Guri reads rows 32 and 33 against the reg 45E text (AustLII) and legislation.vic.gov.au, line by line.
- Row 31: every phone number and email matches the ESC and Energy Victoria pages today.
- Row 35: the HowTo steps match what the page shows. No times for the install itself.

## TODO: UNVERIFIED (kept off these pages; log it)

- The VEEC rename commencement date ("on proclamation, or automatically 2 Oct 2028"): trade summary only. Check it against Act No. 37/2026 itself.
- Any VEEC spot price: trader sites only. Never publish one.
- Heating and cooling repeat-claim limits ("one ducted system per home").
- The date wording "exempt work must be done by 1 June 2027": confirm it against the reg text. Until then, write "within 3 months after 1 March 2027".

## Conflicts to log

- Design §10.2 allowed `HowTo` only on `/how-quotes-work/`. The map asks for it on row 35 too. That's compatible with the "genuine steps" rule, and §10.2 is updated.

## STOP: Guri's approval before anything leaves your machine

Everything above is local: branch, build, tests. Don't run any of the following without Guri typing **yes** for this specific step:

- Push to the remote or open a PR. Show the branch name and `git log --oneline` first.
- Deploy. Use `./ops/deploy-site.sh` only, with the form **off**:
  - Before Launch A (prompt 14A), deploy to the password-protected preview: `PUBLIC_LEADS_ENABLED=false ./ops/deploy-site.sh`.
  - After Launch A, deploy publicly: `PUBLIC_LEADS_ENABLED=false RELEASE_MODE=launch ./ops/deploy-site.sh`.
  - Before you ask for approval, show Guri: the list of new and changed URLs, the summary line of every check, the sitemap URL count, and the diff of `vic-veu.yaml`.
- Never, in this prompt: edit nginx or systemd, DNS, `api/`, env flags on the server, installer files, or run `certbot`. If something seems to need one of these, stop and ask.

After a deploy that Guri approved, run these checks and paste the output:

```bash
# While the preview password is on, add --netrc (credentials in ~/.netrc, never pasted into chat)
URL=https://householdrebates.com.au/victoria/air-conditioner-rebate/    # use any page this prompt added or changed
curl -sI "$URL" | head -1                                              # expect: HTTP/2 200
curl -s https://householdrebates.com.au/sitemap-0.xml | grep -c '<loc>'  # expect: the sitemap count given in this prompt's acceptance checks
```

If anything is wrong, run `./ops/rollback.sh site` and tell Guri.

Sitemap count after this prompt: **35** (16 + 19). Wave 1 is complete.

## Done when

35 URLs build with every check passing, Guri has read rows 32–33 against the regulation, and Wave 1 is deployed after his yes. Commit `feat(wave1b): 9 question pages`.
