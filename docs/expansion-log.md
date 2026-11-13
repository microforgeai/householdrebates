# Expansion Log (Prompts 15–22)

## Conflicts

- **Co-payment wording (Prompt 15):** The brief said "ducted reverse-cycle and multi-split systems of 10 kW or more". VEU Specifications v25.0 Part 6 says **all** ducted systems (any size) have a minimum customer co-payment of $3,000 incl GST from 30 Sep 2026; multi-split is $3,000 at 10 kW or more and $1,000 below 10 kW; single non-ducted split < 10 kW is $200, and non-ducted ≥ 10 kW is $1,000. The site uses the SPEC25 tiers.
- **Ceiling insulation metro/regional vs mild/cold (Prompt 15 & 16):** Energy Victoria's insulation page gives two examples: "metro Melbourne (mild climate zone)" and "regional Victoria (cold climate zone)". In SPEC25's Location Variable List (Table A), `Metropolitan/Regional` and `Mild/Cold/Hot` are two separate columns (for example, Geelong postcodes 3216, 3218, 3220 are `Regional` + `Mild`, and some Dandenongs postcodes are `Metropolitan` + `Cold`). On the site and in the checker, where the two columns disagree, both examples are shown with the note that the accredited provider confirms which applies.
- **Home role (Prompt 17):** The URL map says home (`/`) "stays the national-facing pillar". The live home page (Prompt 05) is Victoria-first in its title, H1 and answer. Prompt 17 only adds links to the `/victoria/` hub and guides. Guri decides whether home gets rewritten as a national pillar, and when.
- **HowTo schema scope (Prompt 18):** Solution design §10.2 originally allowed `HowTo` only on `/how-quotes-work/`. The map asks for `HowTo` on `/victoria/how-long-does-an-upgrade-take/` (row 35) as well. That is compatible with the "genuine steps" rule, and §10.2 is updated.
- **Solar for Apartments lot limit (Prompt 19):** The Solar for Apartments program page eligibility section still says 3–50 lots, while the 26 Oct 2026 news release says up to 150 lots and no median property value limit. The page states "Solar Victoria is expanding the program. Check the current eligibility rules on its page" and gives neither lot count until the program page updates.
- **Get-off-gas planner sequence (Prompt 20):** Row 43's primary question asks "in what order?". No official row source specifies a required sequence. The page answers with sourced facts per appliance and the 1 March 2027 hot water replacement trigger, and states there is no single official order.
- **Area schema vs multi-town page (Prompt 21):** Solution design §5.4 requires `councils` (at least 1) and sourced postcodes. The Solstice row (row 53) gives 10 towns (`Marong`, `Heathcote`, `Swan Hill`, `Maldon`, `Robinvale`, `Kerang`, `Nathalia`, `Terang`, `Lakes Entrance`, `Orbost`) but only 2 postcodes (`3515`, `3523`) and no councils. The schema makes `councils` optional for `variant: multi-town` and uses only the 2 postcodes listed in the map.

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
- **Postcodes and councils for the 8 Solstice towns other than Marong (3515) and Heathcote (3523) (Prompt 21, row 53):** Not listed in the URL map; kept off until added to the map with an official source.
- **Ballarat council rebate trial (Prompt 21, row 46):** Reported closed; the page describes the "Electrify Your Home" program without calling it an open rebate.
- **Goulburn Murray Solar Savers (Greater Shepparton) (Prompt 22, row 48):** Council URL returned 504 on 13 Nov 2026; `/victoria/shepparton/` is gated until verified and approved by Guri.

## Decisions for Guri

- **`whittlesea-home-energy-program` (`homeenergyprogram.org.au/councils/whittlesea/`):** Funded by the City of Whittlesea and linked from the council's official news release; backs the "free home energy assessments valued up to $575" figure (`whittlesea-assessment-value`) in Prompt 21. Decide whether to accept `whittlesea-home-energy-program` as `official: true` (`kind: council-program`) or keep it `official: false` and omit the $575 figure.
- **Home (`/`) national vs Victoria framing:** Decide whether `/` remains Victoria-first in its H1 and answer block while linking to `/victoria/`, or gets rewritten as a national pillar when other states are added.
- **Easy Electric SEC vs lead-fee model:** State-owned SEC runs a free quote-matching service (`Easy Electric SEC`) that councils route residents to. Mentioned openly on `/victoria/find-an-accredited-provider/`; weigh in installer and lead-fee decisions before enabling the quote form.
- **Already-installed induction cooktop claims (Prompt 16):** The URL map notes buying before claiming is normal for induction cooktops, without stating whether an already-installed cooktop can still be claimed. The checker treats Q3 = "Installed or work started" for induction as `POSSIBLE` with the `retro` note rather than `RETRO`.
- **Shepparton gate (`/victoria/shepparton/`, Prompt 22):** Gated pending verification of the Greater Shepparton Solar Savers page and Guri's explicit decision.

## Done

- Prompt 15: URL map imported (`53` rows), figure/source schemas extended, 65 sources and 40 figures loaded, and 5 existing pages updated (`2026-11-13`).
- Prompt 16: Extracted 719-row SPEC25 postcode table (`vic-veu-postcodes.json`), added 8 induction/weather-sealing figures (`48` total), updated checker with 30 Sep 2026 co-payments, LPG wording, and ceiling insulation / induction cooktop / draught-proofing paths.
- Prompt 17 (Wave 1a): Added rollout gating (`1-26`), `check-urlmap`, `check-schema`, `check-seo`, `check-links`, `build-redirects`, `/victoria/` hub, 5 new figures (`53` total), and 9 upgrade swap guides (`26` indexable URLs).
- Prompt 18 (Wave 1b): Enabled rows `1-35`, added 4 figures (`57` total), added 26 FAQs and 9 question pages (rows 27–35, including reg 45E plain-English guides and `HowTo` on row 35), and wired `RESULT_LINKS.retro.internal` (`35` indexable URLs).
- Prompt 19 (Wave 2a): Enabled rows `1-40,44-45`, added 11 figures (`68` total), added 21 FAQs, 5 audience pages (rows 36–40), and 2 support guides (rows 44–45, including CO safety lead on draught proofing and open Easy Electric SEC coverage), and wired `RESULT_LINKS.sealing.internal` (`42` indexable URLs).

