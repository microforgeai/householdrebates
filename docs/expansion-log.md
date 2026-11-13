# Expansion Log (Prompts 15–22)

## Conflicts

- **Co-payment wording (Prompt 15):** The brief said "ducted reverse-cycle and multi-split systems of 10 kW or more". VEU Specifications v25.0 Part 6 says **all** ducted systems (any size) have a minimum customer co-payment of $3,000 incl GST from 30 Sep 2026; multi-split is $3,000 at 10 kW or more and $1,000 below 10 kW; single non-ducted split < 10 kW is $200, and non-ducted ≥ 10 kW is $1,000. The site uses the SPEC25 tiers.
- **Ceiling insulation metro/regional vs mild/cold (Prompt 15 & 16; resolved in Prompt 34):** Energy Victoria's insulation page gives two examples: "metro Melbourne (mild climate zone)" and "regional Victoria (cold climate zone)". In SPEC25's Location Variable List (Table A), `Metropolitan/Regional` and `Mild/Cold/Hot` are two separate columns (for example, all 14 Greater Geelong postcodes are `Regional` + `Mild`, and some Dandenongs/Macedon postcodes are `Metropolitan` + `Cold`). **Resolved (14 Nov 2026, Prompt 34):** Added `basis: estimate` figures (`vic-veu-insulation-est-regional-mild`, `vic-veu-insulation-est-metro-cold`, `vic-veu-insulation-est-regional-hot`) computed via the SPEC25 Part 48 GHG savings formula scaled to Energy Victoria's two published examples, with "about $X (our estimate)" and "the accredited provider confirms".
- **Home role (Prompt 17):** The URL map says home (`/`) "stays the national-facing pillar". The live home page (Prompt 05) is Victoria-first in its title, H1 and answer. Prompt 17 only adds links to the `/victoria/` hub and guides. Guri decides whether home gets rewritten as a national pillar, and when.
- **HowTo schema scope (Prompt 18):** Solution design §10.2 originally allowed `HowTo` only on `/how-quotes-work/`. The map asks for `HowTo` on `/victoria/how-long-does-an-upgrade-take/` (row 35) as well. That is compatible with the "genuine steps" rule, and §10.2 is updated.
- **Solar for Apartments lot limit (Prompt 19):** The Solar for Apartments program page eligibility section still says 3–50 lots, while the 26 Oct 2026 news release says up to 150 lots and no median property value limit. The page states "Solar Victoria is expanding the program. Check the current eligibility rules on its page" and gives neither lot count until the program page updates.
- **Get-off-gas planner sequence (Prompt 20):** Row 43's primary question asks "in what order?". No official row source specifies a required sequence. The page answers with sourced facts per appliance and the 1 March 2027 hot water replacement trigger, and states there is no single official order.
- **Area schema vs multi-town page (Prompt 21; resolved in Prompt 34):** Solution design §5.4 requires `councils` (at least 1) and sourced postcodes. In Prompt 34 (14 Nov 2026), `docs/url-map.csv` and `docs/postcodes.csv` now provide all 10 Solstice postcodes (`3515, 3523, 3585, 3549, 3463, 3579, 3638, 3264, 3909, 3888`) and their 7 ABS primary councils.

## UNVERIFIED (kept off pages)

- **Exempt-work end date wording "by 1 June 2027" (Prompts 15 & 18, row 32):** Confirm against the reg 45E text before using a calendar date. Until then, write "within 3 months after 1 March 2027".
- **Multi-split "at most 20 kW" incentive calculation cap (Prompts 15, 16 & 17, row 19):** Third-party trade sites claim home multi-split incentives are calculated on at most 20 kW. Marked UNVERIFIED in the URL map until Venture Architect or Guri confirms it in SPEC25 Part 6 and updates the map.
- **LPG hot water discount amount (Prompts 15, 16 & 17, row 22):** VEU Part 3 covers gas or LPG water heaters, but Energy Victoria's product table publishes only a mains gas figure. The site and checker state "the accredited provider confirms".
- **"Only one hard-wired heater per home counts" (Prompt 17, row 21):** Third-party claim only; kept off the electric heater replacement guide.
- **Combined electric → heat pump total "$1,630 / $2,030" (Prompt 17, row 23):** Appears on the stale "Latest discounts" summary page, not on the hot water product page. Kept off the page; VEU and Solar Homes figures are shown separately.
- **Insulation accredited provider count (3 on 13 Nov 2026) (Prompt 17, row 26):** Left off the page rather than hardcoding a volatile count.
- **VEEC rename commencement date "2 Oct 2028" (Prompt 18, row 27):** Trade summary only; page states "on proclamation" without a date until checked against Act No. 37/2026.
- **Live or recent VEEC spot price (Prompt 18, row 27):** Trader sites only, never official; kept off the site.
- **Heating and cooling repeat-claim limits ("one ducted system per home") (Prompts 16 & 18, row 29):** Trade sites only; checker does not ask and page states "ask the accredited provider".
- **Weather sealing building-age rule or co-payment (Prompt 16):** Not stated in the URL map; checker does not ask about or apply either.
- **$100 Power Saving Bonus (Prompt 19, row 38):** Round closed 31 Mar 2026 per search result; not promoted on the concession page.
- **Excess-bill concession thresholds ($4,038.82 electricity, $2,598.58 gas) (Prompt 19, row 38):** Appear only in map notes, change yearly, and have no row fact; kept off the page.
- **Default electricity and gas tariffs / Victorian Default Offer (Prompt 20, row 41):** Not verified in the map; running-costs tool shows Energy Victoria's published scenario savings only.
- **Gas meter abolishment dollar fee (~$270 on trade sites) (Prompt 20, row 43):** AusNet links to its yearly tariff schedule; page links to distributors without quoting a fee.
- **Wyndham residents' survey to 30 Nov 2026 (Prompt 21, row 49):** Local media search only; kept off the Wyndham page.
- **Whittlesea "Energy Smart Homes Grant" (Prompt 21, row 51):** Council page returned 403; kept off the Whittlesea page.
- **Postcodes and councils for the 8 Solstice towns other than Marong (3515) and Heathcote (3523) (Prompt 21, row 53; resolved in Prompt 34):** Resolved on 14 Nov 2026 via `docs/postcodes.csv` and `docs/url-map.csv` (all 10 postcodes and 7 ABS primary councils now published on `/victoria/solstice-gas-shutdown-towns/`).
- **Ballarat council rebate trial (Prompt 21, row 46):** Reported closed; the page describes the "Electrify Your Home" program without calling it an open rebate.
- **Greater Shepparton council's own Solar Savers page (`greatershepparton.com.au/.../solar-savers`) (Prompts 22 & 34, row 48):** Returned 504 Gateway Timeout on 13 and 14 Nov 2026; stays UNVERIFIED and is never cited or linked. Goulburn Murray Solar Savers is verified through GMCA (`gmca.org.au`, Feb 2026 notice, checked 14 Nov 2026). Per Guri's decision (option c), `/victoria/shepparton/` is written in source using GMCA only and kept gated (`rollout.json` unchanged at `1-47,49-53`).
- **ECCV go-electric brochure in 11 languages (Prompt 34, row 72):** Fetch failed on 14 Nov 2026; stays UNVERIFIED until checked.
- **Victorian state battery rebate / Finder report of further federal battery cuts (Prompt 34, row 69):** Unconfirmed; stays off pages.

## Shepparton verification (Prompt 22 / 34, 14 Nov 2026)

- **Program:** Goulburn Murray Solar Savers — verified via official regional alliance source Goulburn Murray Climate Alliance (`https://www.gmca.org.au/`, HTTP 200 on 14 Nov 2026, Feb 2026 notice): open to households in Greater Shepparton and 6 other GMCA councils (vetted providers for solar, batteries, heat pump hot water, split systems, ceiling insulation, draught proofing, and home energy assessments; no council cash grant dollar amount stated).
- **Greater Shepparton City Council page:** `greatershepparton.com.au/.../solar-savers` returned 504 on 13 and 14 Nov 2026 — kept UNVERIFIED and excluded from `sources/` and copy per `prompts/34-pack-import-and-corrections.md` C6.
- **Other row 48 facts verified (14 Nov 2026):** 13 Greater Shepparton postcodes in `postcodes.csv` (all Regional, Cold, zone 4; 6 reticulated gas, 7 non-reticulated incl. PO-box 3632); NCC climate zone 4 (`abcb-climate-zones-data`); regional cold ceiling insulation example (`$2,100`, `energyvic-insulation`); Hume provider counts (`27` hot water, `60` heating/cooling).
- **Decision:** Guri chose **option (c) keep gated** (`rollout.json` remains `"enabledRows": "1-47,49-53"`, `"gatedApproved": []`; next re-check monthly alongside council programs).

## Decisions for Guri

- **`whittlesea-home-energy-program` (`homeenergyprogram.org.au/councils/whittlesea/`):** Funded by the City of Whittlesea and linked from the council's official news release; backs the "free home energy assessments valued up to $575" figure (`whittlesea-assessment-value`) in Prompt 21. Decide whether to accept `whittlesea-home-energy-program` as `official: true` (`kind: council-program`) or keep it `official: false` and omit the $575 figure.
- **Home (`/`) national vs Victoria framing:** Decide whether `/` remains Victoria-first in its H1 and answer block while linking to `/victoria/`, or gets rewritten as a national pillar when other states are added.
- **Easy Electric SEC vs lead-fee model:** State-owned SEC runs a free quote-matching service (`Easy Electric SEC`) that councils route residents to. Mentioned openly on `/victoria/find-an-accredited-provider/`; weigh in installer and lead-fee decisions before enabling the quote form.
- **Already-installed induction cooktop claims (Prompt 16):** The URL map notes buying before claiming is normal for induction cooktops, without stating whether an already-installed cooktop can still be claimed. The checker treats Q3 = "Installed or work started" for induction as `POSSIBLE` with the `retro` note rather than `RETRO`.
- **Shepparton gate (`/victoria/shepparton/`, Prompt 22 & 34):** Resolved (14 Nov 2026): keep gated (option c).
- **Geelong insulation wording (`/victoria/geelong/`, Prompt 34):** Currently uses spec §5.4 default `"about $1,590 (our estimate)"` via `vic-veu-insulation-est-regional-mild`; Guri can keep the default or switch to the map's `"about $1,500–$1,600, provider confirms"`.
- **Election-watch notice wording (Prompt 24):** Resolved (14 Nov 2026): keep neutral wording (no political parties or repeal pledges named).
- **Passing 2027 mentions on other pages (Prompt 24):** Resolved (14 Nov 2026): keep `RuleStatusNotice` on the 9 primary 2027-rule pages only.

## Scheduled re-checks

- **`postcodes.csv` master list (`checkedOn: 2026-11-14`, 45-day freshness rule):** Never regenerate via script or PDF parse. Cross-check against SPEC25 (`crosscheck-veu-postcodes.mjs`); if VEU Specifications update beyond v25.0, STOP and ask Guri for an updated CSV from Venture Architect.
- **Monthly & post-election re-verification (Prompt 23 + 14 Nov 2026 addendum, 30 Nov–5 Dec 2026):**
  - URL counts in Prompt 23 now track the enabled row count in `rollout.json` rather than hardcoded `52`/`53`, and step 3.2 cross-checks `postcodes.csv` rather than regenerating from PDF.
  - Register covers: `rule-status.json` (Prompt 24), `basis: estimate` figures and SPEC25 Part 48 coefficients (`vic-veu.yaml`), `council-programs.json` and area `councilPrograms` statuses (`statusCheckedOn` <= 45 days for `open`), checker rules' sources (Prompt 35), and the 9 election-watch pages (`reviewBy: 2026-12-05`):
    - `/` (`mapRow: 1`)
    - `/victoria/` (`mapRow: 17`)
    - `/victoria/gas-to-electric-hot-water-2027/` (`mapRow: 11`)
    - `/victoria/new-homes-all-electric-2027/` (`mapRow: 39`)
    - `/victoria/gas-hot-water-broken-before-or-after-march-2027/` (`mapRow: 32`; restore `reviewBy: 2027-03-01` after post-election re-verification if rule is unchanged)
    - `/victoria/gas-hot-water-ban-exemptions/` (`mapRow: 33`)
    - `/victoria/landlords-rental-standards-2027/` (`mapRow: 37`)
    - `/victoria/renters/` (`mapRow: 36`)
    - `/victoria/get-off-gas-planner/` (`mapRow: 43`)

## Done

- Prompt 15: URL map imported (`53` rows), figure/source schemas extended, 65 sources and 40 figures loaded, and 5 existing pages updated (`2026-11-13`).
- Prompt 16: Extracted 719-row SPEC25 postcode table (`vic-veu-postcodes.json`), added 8 induction/weather-sealing figures (`48` total), updated checker with 30 Sep 2026 co-payments, LPG wording, and ceiling insulation / induction cooktop / draught-proofing paths.
- Prompt 17 (Wave 1a): Added rollout gating (`1-26`), `check-urlmap`, `check-schema`, `check-seo`, `check-links`, `build-redirects`, `/victoria/` hub, 5 new figures (`53` total), and 9 upgrade swap guides (`26` indexable URLs).
- Prompt 18 (Wave 1b): Enabled rows `1-35`, added 4 figures (`57` total), added 26 FAQs and 9 question pages (rows 27–35, including reg 45E plain-English guides and `HowTo` on row 35), and wired `RESULT_LINKS.retro.internal` (`35` indexable URLs).
- Prompt 19 (Wave 2a): Enabled rows `1-40,44-45`, added 11 figures (`68` total), added 21 FAQs, 5 audience pages (rows 36–40), and 2 support guides (rows 44–45, including CO safety lead on draught proofing and open Easy Electric SEC coverage), and wired `RESULT_LINKS.sealing.internal` (`42` indexable URLs).
- Prompt 20 (Wave 2b): Enabled rows `1-45`, added 2 electrification figures (`70` total) and `hw-size-guide.json` (`1` tool data file verified), built `RunningCostsPicker`, `HwSizeGuide`, and `GasExitPlanner` islands (< 1 KB gzipped each) with unit and Playwright e2e tests (`45` indexable URLs).
- Prompt 21 (Wave 3): Enabled rows `1-47,49-53` (row 48 `/victoria/shepparton/` kept gated), added 5 regional provider and Solstice figures (`75` total; `whittlesea-assessment-value` skipped pending `official` decision on `whittlesea-home-energy-program`), added 21 FAQs and 7 area pages (`ballarat`, `bendigo`, `wyndham`, `casey`, `whittlesea`, `yarra-ranges`, `solstice-gas-shutdown-towns`), verified ABCB `CC BY 4.0` attribution and SPEC25 postcode tables (`52` indexable URLs).
- Prompt 24: Added `rule-status.json`, `energyvic-caretaker-banner.yaml` (`checkedOn: 2026-11-14`), `RuleStatusNotice.astro`, `"currently legislated"` copy pass across the 9 election-watch pages (`reviewBy: 2026-12-05`), and `check-rule-status.mjs` build guard (`52` indexable URLs).
- Prompt 34: Imported 74-URL pack (`docs/`), updated `import-url-map.mjs` (`74` rows across Waves 0–4 with `factsCheckedOn`), switched postcodes to master `postcodes.csv` (`719` rows, `0` mismatches vs SPEC25 PDF cross-check) + `check-postcodes.mjs`, added `basis: estimate` model & 3 Part 48 ceiling insulation estimates + 4 apartment/townhouse weather-sealing figures + 2 Hume provider counts (`80` total figures), added `councilPrograms` status model + `council-programs.json` + `check-council-status.mjs`, enforced retired Scorecard rule in `check-copy.mjs`, applied Part 6 co-payment, Geelong insulation/Electric Homes, RD-2 weather sealing, Solstice 10-town, area postcode table, and internal-link updates, and authored gated `shepparton.mdx` citing GMCA only (`52` indexable URLs; Shepparton kept gated per Guri's option c).

