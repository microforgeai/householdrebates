# Household Rebates — design and Antigravity prompts

Site: **householdrebates.com.au** (brand: Household Rebates; publisher: Agenor Services Pty Ltd)
Prepared 13 Nov 2026 (Melbourne time) by Indie Builder for Guri, from Venture Architect's strategy ("Energy rebates" tab).
These are Markdown files only. No code has been written, and nothing has been touched on the VPS, DNS or Hostinger.

**Update, 13 Nov 2026: expansion from 16 to 53 URLs (approved by Guri).** The source of truth is Venture Architect's [`url-map.md`](url-map.md) and [`url-map.csv`](url-map.csv) (rebuilt with `.url-map-generator/`). Prompts 15–23 build it. `solution-design.md` is updated (§0, §1 verified 2027 exemptions and new facts, §4.1a–d, §5, §6, §10, §13–§15). The page sections of prompts 17–22 are generated from the CSV by `.prompt-generator/gen.py`. If the map changes, re-run it rather than hand-editing those sections.

**Update, 14 Nov 2026: business review and the 74-URL pack (prompts 24–39).** Venture Architect replaced the map (now **74 URLs: 16 live + 58 new**, Waves 1–4, with a `facts_checked_on` column) and added [`eligibility-checker-spec.md`](eligibility-checker-spec.md), [`postcodes.csv`](postcodes.csv) (the master list of all 719 VEU v25.0 Table A postcodes; **never regenerate it**) and [`business-review-2026-11-14.md`](business-review-2026-11-14.md). Prompts 24–33 turn the review's top 10 changes (§7) into work; prompts 34–39 import the pack and build it. The pages the review needs (business pages, battery, solar, other VEU, help in your language, author page, LPG homes) are **Wave 4, rows 65–74 of the master map**; no prompt adds map rows any more. Prompts 24–39 are rendered from `.prompt-generator/tpl2/` by `gen2.py`; prompts 15–23 are no longer regenerated (`gen.py` asserts 53 rows and would overwrite them).

## Files

| File | What it is |
|---|---|
| [`solution-design.md`](solution-design.md) | The full design: verified facts and sources, architecture (mermaid), repo layout, URLs and templates, content model, eligibility checker logic, lead form and Node handler (SQLite schema, consent, email, retention), nginx, systemd, deployment and rollback, SEO/schema/llms.txt, analytics, compliance map, risks, open decisions |
| [`prompts/00-vps-hygiene.md`](prompts/00-vps-hygiene.md) | Fix certbot renewal, dry-run, check disk, memory and backups (read-only audit, then approved fixes) |
| [`prompts/01-scaffold.md`](prompts/01-scaffold.md) | Repo with `site/` (Astro) and `api/` (Node) workspaces, CI |
| [`prompts/02-design-system.md`](prompts/02-design-system.md) | Tokens, base layout, independence notice, copy checker |
| [`prompts/03-content-model.md`](prompts/03-content-model.md) | Collections, the 21 verified figures, 13 sources, figure checks |
| [`prompts/04-templates-components.md`](prompts/04-templates-components.md) | Layouts, routes, `<Money>`/`<FigureTable>`, SEO head, JSON-LD, build checks |
| [`prompts/05-pages-batch-1.md`](prompts/05-pages-batch-1.md) | Home pillar, AC rebate, heat pump rebate, 2027 gas rule, timing rule |
| [`prompts/06-pages-batch-2.md`](prompts/06-pages-batch-2.md) | Four area pages, how quotes work, FAQ, About, Sources |
| [`prompts/07-eligibility-checker.md`](prompts/07-eligibility-checker.md) | Static JS checker with unit and e2e tests |
| [`prompts/08-lead-handler.md`](prompts/08-lead-handler.md) | Lead form + Node/Fastify/SQLite handler, consent records, CLIs (form stays off) |
| [`prompts/09-nginx-ssl-deploy.md`](prompts/09-nginx-ssl-deploy.md) | DNS A records, certificate, nginx, systemd, deploy/rollback, password-protected preview |
| [`prompts/10-seo-schema-llms.md`](prompts/10-seo-schema-llms.md) | Meta, canonicals, schema, sitemap, robots, llms.txt, AI-referrer report |
| [`prompts/11-email-dns.md`](prompts/11-email-dns.md) | Mailbox choice, MX/SPF/DKIM/DMARC, mail driver test |
| [`prompts/12-compliance-legal.md`](prompts/12-compliance-legal.md) | Privacy policy, collection notice, terms, installer agreement terms, lawyer pack, legal build gate |
| [`prompts/13-qa.md`](prompts/13-qa.md) | Facts, compliance wording, a11y, performance, security, SEO, ops drills |
| [`prompts/14-launch.md`](prompts/14-launch.md) | Launch A (public, form off, GSC + Bing) and Launch B (form on, after gates) |
| [`url-map.md`](url-map.md) / [`url-map.csv`](url-map.csv) | Venture Architect's map, **74 URLs since 14 Nov 2026** (was 53; Wave 4 = rows 65–74): per-page question, verified facts with sources, required links, notes, `facts_checked_on`; rule changes; dropped locations; changes to existing pages; source index; re-check list |
| [`eligibility-checker-spec.md`](eligibility-checker-spec.md) | Venture Architect's checker spec (14 Nov): Residential/Business cascade, fields, ~79 outcome rules, 21 messages, CTAs, 6 acceptance examples, UNVERIFIED list |
| [`postcodes.csv`](postcodes.csv) | Master list of the 719 VEU v25.0 Table A postcodes with locality, council and dwellings. Read-only; never regenerated |
| [`business-review-2026-11-14.md`](business-review-2026-11-14.md) / `site-crawl-2026-11-14.json` | Venture Architect's business review of the live site and the crawl it used |
| [`url-map-additions-2026-11-14.csv`](url-map-additions-2026-11-14.csv) | **Superseded 14 Nov 2026.** The 10 rows (65–74) Indie proposed are now merged into the master map as Wave 4. Kept for history only; don't use it |
| [`prompts/15-priority-fixes-existing-pages.md`](prompts/15-priority-fixes-existing-pages.md) | Fixes to live pages first: 30 Sep 2026 co-payments (AC, timing rule), Solar Homes $150k cap (heat pump), verified reg 45E exemptions (gas 2027), Geelong insulation note; 52 new sources; 16 new figures; URL-map import; sequential `check-sources` with a deny list |
| [`prompts/16-checker-new-paths.md`](prompts/16-checker-new-paths.md) | Checker: co-payment notes on ducted and split results, LPG "provider confirms" (no amount), new insulation, induction and draught-proofing paths, VEU postcode table (719 rows) |
| [`prompts/17-wave1a-hub-and-upgrade-guides.md`](prompts/17-wave1a-hub-and-upgrade-guides.md) | Structure for 53 URLs (navGroup, rollout control, breadcrumbs, `RelatedLinks`, `HubIndex`, `check-urlmap`, sitemap, llms.txt, redirects mechanism) + `/victoria/` hub + 9 upgrade guides (rows 17–26) |
| [`prompts/18-wave1b-question-pages.md`](prompts/18-wave1b-question-pages.md) | 9 question pages (rows 27–35); completes Wave 1 (35 URLs) |
| [`prompts/19-wave2a-audience-and-support-pages.md`](prompts/19-wave2a-audience-and-support-pages.md) | 5 audience pages + draught proofing + find an accredited provider (rows 36–40, 44–45) |
| [`prompts/20-wave2b-tools.md`](prompts/20-wave2b-tools.md) | Running costs (published savings only), hot water size guide, get-off-gas planner (rows 41–43); completes Wave 2 (45 URLs) |
| [`prompts/21-wave3-location-pages.md`](prompts/21-wave3-location-pages.md) | Ballarat, Bendigo, Wyndham, Casey, Whittlesea, Yarra Ranges, Solstice gas-shutdown towns (rows 46–47, 49–53); 52 URLs |
| [`prompts/22-shepparton-gated.md`](prompts/22-shepparton-gated.md) | **Hard stop:** verify the council's Solar Savers program, then Guri decides, then (maybe) build Shepparton (row 48); 53 URLs |
| [`prompts/23-post-election-recheck.md`](prompts/23-post-election-recheck.md) | After the 28 Nov 2026 election (from 30 Nov): re-check every figure, source, rule and UNVERIFIED item, diff report, STOP list, then monthly. **14 Nov addendum** at the end (rule-status, postcodes.csv as master, URL counts) |
| [`prompts/24-election-notice-rule-status.md`](prompts/24-election-notice-rule-status.md) | Review item 1: neutral "currently legislated, may change after 28 Nov" notice on the 9 rule pages, `rule-status.json`, build check, tied to prompt 23 |
| [`prompts/25-headline-figure-labels.md`](prompts/25-headline-figure-labels.md) | Review item 2: the 35 uncaptioned hero figures get labels (what the number is, for whom, which scenario); figure `kind`; `MoneyPair`; per-page label table |
| [`prompts/26-text-defects-and-checks.md`](prompts/26-text-defects-and-checks.md) | Review item 3: raw paths in FAQ answers, doubled qualifiers, checker self-link, titles over 60, duplicate descriptions; `check-text` |
| [`prompts/27-faq-dedupe-and-local-facts.md`](prompts/27-faq-dedupe-and-local-facts.md) | Review item 4: one canonical page per FAQ, overlap check (< 25%), area pages ≥ 5 local facts |
| [`prompts/28-business-hub-and-pages.md`](prompts/28-business-hub-and-pages.md) | Review item 5 + pack (c): `/victoria/business-energy-upgrades/` (row 55) + 4 business pages (rows 65–68, Wave 4); the hub links all 4, no `/victoria/business/` hub, aligned with the checker spec's Business path |
| [`prompts/29a-email-alerts-backend.md`](prompts/29a-email-alerts-backend.md) | Review item 6, part 1: alert sign-up API in the existing Node/SQLite handler; double opt-in, consent records, one-click unsubscribe, suppression; flags off; **no sending** |
| [`prompts/29b-email-alerts-signup-and-go-live.md`](prompts/29b-email-alerts-signup-and-go-live.md) | Review item 6, part 2: sign-up component, APP 5 notice draft, privacy update, legal gate; two STOPs (deploy hidden; go live) and a yes for every send |
| [`prompts/30-program-pages-battery-solar-other-veu.md`](prompts/30-program-pages-battery-solar-other-veu.md) | Review item 7: battery (FEDERAL), solar panel and other-VEU pages (rows 69–71, Wave 4); electrification grants worded for their target groups; Midday Power Saver sections |
| [`prompts/31-help-in-your-language.md`](prompts/31-help-in-your-language.md) | Review item 8: help-in-your-language page (row 72), official translated pages only (Energy Victoria 11 listed, Solar Victoria 14; ECCV off); seniors box |
| [`prompts/32-eeat-author-reviewer-schema.md`](prompts/32-eeat-author-reviewer-schema.md) | Review item 9: author page (row 73), noindex until Guri supplies his bio; reviewer slot empty until Guri decides; Person/Organization/WebPage schema |
| [`prompts/33-internal-links-footer-lpg.md`](prompts/33-internal-links-footer-lpg.md) | Review item 10: footer from area pages, inbound-link minimums, LPG homes page (row 74; reg 45E covers mains-gas heaters only, piped-LPG "your plumber confirms"); runs last |
| [`prompts/34-pack-import-and-corrections.md`](prompts/34-pack-import-and-corrections.md) | Pack (g) + groundwork: import the 74-row map, location rows cross-checked against postcodes.csv (expected to pass), weather sealing by home type, postcodes.csv as master (cross-checked), estimate figures, council-program status model; corrections (ducted $3,000 any capacity, Geelong ≈ estimate, Hume paused, Scorecard closed, Solstice postcodes, electrification URL); Shepparton gate re-opened for Guri |
| [`prompts/35a-checker-rules-engine.md`](prompts/35a-checker-rules-engine.md) | Pack (a), part 1: spec-driven rules engine; every outcome rule cites a source; the 6 spec examples (incl. 3427) as automated tests |
| [`prompts/35b-checker-ui-and-results.md`](prompts/35b-checker-ui-and-results.md) | Pack (a), part 2: the Residential/Business cascade UI and result screen; Playwright runs the 6 examples; deploy |
| [`prompts/36-postcode-lookup-page.md`](prompts/36-postcode-lookup-page.md) | Pack (b): one `/victoria/postcode/` lookup page (row 54), client-side search; no per-postcode pages |
| [`prompts/37-north-west-corridor.md`](prompts/37-north-west-corridor.md) | Pack (d): `/victoria/north-west-corridor/` (row 56), one page with Sunbury, Diggers Rest, Melton and Gisborne sections |
| [`prompts/38-council-pages.md`](prompts/38-council-pages.md) | Pack (e): Macedon Ranges, Mitchell, Latrobe Valley, Mildura (rows 57–60) |
| [`prompts/39-metro-hubs-and-melbourne.md`](prompts/39-metro-hubs-and-melbourne.md) | Pack (f): north, west, east, south-east hubs (rows 61–64); `/victoria/melbourne/` rescoped to the 52-postcode inner hub |

## Run order

Run the prompts in number order, one per Antigravity session. Give Antigravity `solution-design.md` with prompt 01; it copies it to `docs/` in the repo, and later prompts refer to it.

```
00 VPS hygiene ──► 01 scaffold ──► 02 design ──► 03 content model ──► 04 templates
      │                                                                    │
      │                     05 pages 1 ──► 06 pages 2 ──► 07 checker ──► 08 lead handler (form OFF)
      │                                                                    │
      └──────────────► 09 nginx/SSL/deploy (preview, password) ──► 10 SEO ──► 11 email DNS
                                                                           │
                                12 legal (lawyer) ──► 13 QA ──► 14A go public ──► 14B form ON (after gates)
```

00 must be done before 09. 01–08 are local only and can run while 00 is waiting on Guri. 12 can start as soon as 08 is done, since the lawyer review takes the longest.

### Expansion to 53 URLs (prompts 15–23)

```
after 13 (QA) ──► 15 fixes to live pages ──► 16 checker paths ──► 17 hub + upgrade guides ──► 18 question pages ──► deploy Wave 1 (35)
                                                                                                        │
           23 post-election re-check (from 30 Nov 2026, then monthly) ◄── 22 Shepparton GATE ◄── 21 locations (52) ◄── 20 tools (45) ◄── 19 audience + support (42)
```

- 15–22 work before or after Launch A (14A). Before 14A, they deploy to the password-protected preview; after it, publicly. The form stays **off** in every case.
- Run 15 and 16 first: they fix live pages that are now wrong (co-payments, Solar Homes cap, exemptions).
- 17 and 18 are best deployed together, as Wave 1.
- 23 must run by about 28 Dec 2026 whatever happens, because figures checked on 13 Nov 2026 go stale under the 45-day rule and the build will fail.

| After prompt | Sitemap URLs | Figures |
|---|---|---|
| 15 | 16 | 40 |
| 16 | 16 | 48 |
| 17 | 26 | 53 |
| 18 | 35 | 57 |
| 19 | 42 | 68 |
| 20 | 45 | 70 |
| 21 | 52 | 75–76 |
| 22 | 53 (or 52 if kept gated) | 77–79 |

### Business review and 74-URL pack (prompts 24–39)

Numbers follow the review's priority order, not the run order. Run them like this:

```
24 election notice ──► 34 pack import + corrections ──► 25 labels ──► 26 text ──► 27 FAQ/local facts
      ──► 35a checker engine ──► 35b checker UI ──► 36 postcode page ──► 28 business hub + 4 pages
      ──► 29a alerts API ──► 29b alerts sign-up (2 STOPs) ──► 30 battery/solar/other VEU ──► 31 language ──► 32 author/E-E-A-T
      ──► 37 corridor ──► 38 council pages ──► 39 metro hubs + Melbourne ──► 33 internal links + footer + LPG (last)
```

- **24 first**, before 28 Nov 2026 (the election). It doesn't need the map import.
- **34 before everything else in 25–39**: it imports the 74-row map (all of Waves 1–4), makes `postcodes.csv` the data source, and adds the `basis: estimate` figures and the council-program status model that later prompts use.
- 29a/29b can run any time after 11 and 12; going live needs the lawyer.
- 30 is time-sensitive (battery facts change on 1 Jan 2027): deploy in December 2026 if Guri agrees.
- Prompt 23 (post-election re-check) still runs from 30 Nov 2026; its addendum covers the new data.

| After prompt | Enabled map rows | Built URLs | Sitemap URLs |
|---|---|---|---|
| 34 | 1–47, 49–53 (+48 if Guri releases Shepparton) | 52 (53) | 52 (53) |
| 36 | + 54 | 53 (54) | 53 (54) |
| 28 | + 55, 65–68 | 58 (59) | 58 (59) |
| 30, 31, 32 | + 69–71, 72, 73 | 63 (64) | 62 (63): row 73 is noindex until Guri's bio |
| 37, 38, 39 | + 56, 57–60, 61–64 | 72 (73) | 71 (72) |
| 33 | + 74 | 73 (74) | 72 (73), then +1 when the bio is in |

The full map is 74 URLs; it's reached only if Guri releases Shepparton and supplies the bio. The 3 `/alerts/` utility pages (29b) are noindex and outside the map, like `/thanks/`.

## Where Guri's yes is needed

| Prompt | What needs a yes |
|---|---|
| 00 | Every fix on the live VPS (after the read-only audit) |
| 01 | Creating the GitHub repo and pushing |
| 02, 05, 06 | Sign-off on the look and on the fact-check sheets (no publishing) |
| 09 | DNS A records; server users and sudoers; certificate; nginx and systemd; first deploy (preview only) |
| 10 | Deploying to the preview |
| 11 | DNS mail records; creating any mailbox (and any cost); M365 app registration |
| 12 | Sending the pack to a lawyer (likely the only paid item) |
| 13 | QA sign-off |
| 14 | Going public; GSC DNS TXT; turning the form on (needs a signed installer agreement and the lawyer review first) |
| 15 | Reading the reg 45E summary and the co-payment table against the sources; whether the Whittlesea program page counts as official; push and deploy |
| 16 | Running 5 real checker cases; the induction "already installed" rule; push and deploy |
| 17, 18 | Fact-check of each page against its row's sources; reg 45E pages (32, 33) line by line; push and deploy Wave 1 |
| 19, 20, 21 | Fact-check of each page; the SEC mention (row 45); push and deploy each wave |
| 22 | **Two yeses:** the Shepparton decision after verification (build with the program / without it / keep gated), then push and deploy |
| 23 | Every changed figure on the STOP list; any redirect or archive (nginx change = its own STOP); push and deploy |
| All of 15–23 | Never without a separate yes: nginx, systemd, DNS, `api/`, env flags, installer files. The quote form stays off |
| 24 | The notice wording; whether to name the pledges (lawyer); push and deploy |
| 25, 26, 27 | The label table, titles table and canonical FAQ table (PRs); push and deploy |
| 28 | Fact-check of the hub and 4 pages; push and deploy |
| 29a | Nothing is deployed or sent. The API change to the server is its own STOP |
| 29b | **STOP 1:** deploy with the form hidden. **STOP 2:** go live (after the lawyer). **Every send** needs its own yes |
| 30, 31, 32 | Fact-check; deploy timing (30); Guri's bio, which lifts the author page's noindex (its own deploy STOP), and any reviewer (32: never invent a person) |
| 33 | Footer and link changes; push and deploy |
| 34 | The Shepparton release (a/b/c, GMCA cited only); Geelong wording; push and deploy |
| 35a, 35b | Spec-vs-source differences (STOP each time); 6 examples on a phone; push and deploy |
| 36–39 | Fact-check of each page against its row and postcodes.csv; push and deploy each |
| All of 24–39 | Same as 15–23: never nginx, systemd, DNS, env flags on the server, installer files without a separate yes. The quote form stays off. No email is sent |

## Key facts (checked 13 Nov 2026 against official pages; see solution-design §1)

- Reverse-cycle AC: up to $5,530 is the largest case only (ducted gas → 22.4 kW ducted). A room gas heater → split is $630 to $1,610.
- Heat pump hot water: $630 replacing an **electric** system; **$560 replacing gas**.
- From 1 March 2027, a mains gas water heater that needs replacing in an existing home generally has to be replaced with an electric one. LPG isn't affected. The exemptions are now verified against reg 45E (SR 140/2025 reg 6): space, centralised Class 2 or pool systems, other laws, switchboard work, network augmentation, temporary disconnection, like-for-like where no electricity is needed, warranty replacements, and contracts, building work or orders from before 1 March 2027.
- From 30 Sep 2026, every ducted system needs a minimum customer co-payment of $3,000 including GST (was $1,000). Multi-split is $3,000 at 10 kW or more and $1,000 below; a single split below 10 kW is $200 (VEU Specifications v25.0, Part 6).
- Solar Homes hot water: household income cap $150,000 from 1 Jul 2026 (was $210,000), property under $3m, system at least 3 years old.
- Ceiling insulation is a new VEU product: up to $1,500 metro / $2,100 regional (150 m² examples).
- VEU code of conduct: lead generation is regulated; cold calls and doorknocking banned without express prior consent; consent lasts 3 months unless withdrawn; name the installer on the form.
- Not legal advice: the consent wording, privacy policy, terms and installer agreement need a lawyer's check.

## Open decisions for Guri (added 14 Nov 2026, prompts 24–39)

Defaults are in brackets. Each prompt lists its own; this is the full set.

**Release and timing**
1. Shepparton (row 48): release (a) with the GMCA-sourced Solar Savers program, (b) without it, or (c) keep gated. GMCA is the only source cited; the council page stays unverified (22 addendum, 34).
2. Email alerts live before 28 Nov or after the election re-check [after; needs the lawyer first] (29b).
3. Battery page deploy timing [December 2026, before the 1 Jan 2027 change] (30).
4. Build the west metro hub, marked MARGINAL by Venture Architect [build] (39).

**Wording and content**
5. Election notice: neutral [default] or name the repeal pledges (lawyer) (24); add it to the 6 pages that mention 2027 in passing [only if the check flags them] (24).
6. Geelong insulation: "about $1,590 (our estimate)" [spec and the map's changes table] or "about $1,500–$1,600, provider confirms" [map rule-changes item 3] (34).
7. Upgrade-time page has no hero figure after labelling [accept] (25).
8. Latrobe Valley 44% bill cut (news report quoting AusNet) [leave off] (38).
9. Boroondara Solar Savers "free assessment" [quote, attributed] (39).
10. EV charger FAQ on the other-VEU page [ask] (30).
11. Macedon Ranges heat pump bulk buy [leave off if shipping after 30 Nov 2026] (37).

**Structure**
12. Farms as a section on the business hub [default] or a fifth page (needs a map row from Venture Architect) (28).
13. North-west corridor: one page with town sections [map] vs separate town pages (needs new rows with ≥ 4 local facts each) (37).
14. Checker area link for 3430–3438 (Macedon Ranges shire): corridor [spec §7] or `/victoria/macedon-ranges/` (needs a spec change) (38).
15. Checker shows Business before the business hub is live [yes, interim CTA] (35b); tenant share link in the URL hash [yes] (35b); postcode locality typeahead [yes] (36).

**People, money and legal (never decided by an agent)**
16. Guri's bio, credentials, photo and profile links for `/about/gurinder-singh/`; the page stays noindex until he supplies the bio (32).
17. Whether to have an expert reviewer at all, who, and whether to pay [no reviewer shown until decided; never invent a person] (32).
18. Alerts: mail transport and sender address, overseas storage disclosure, confirmation TTL [72 h], send batch size, retention periods, who signs off (29a/29b).
19. Business lead fees ($100–$250 in the review) are an **[Assumption]**; business lead capture stays off (28).
20. Whether householdbattery.com.au should ever point at the battery page (no domain purchase implied) (30).
21. A fluent reviewer for any future translated summary, and any cost (31).
22. Checker: spec examples assume SH2/SH3 pass [confirm]; when a source and the spec disagree [stop and ask each time] (35a).

**Settled on 14 Nov 2026 (removed):** business slugs (the map's `/victoria/business-energy-upgrades/` hub, flat sub-pages, no `/business/` hub); weather sealing figures (by home type, EVSEAL 11 Nov); merging rows 65–74 (done, Wave 4); the map-vs-postcodes.csv mismatches (rows corrected).

## Changes needed in prompts 17–23 (listed, not silently rewritten)

Prompts 15–23 were written for the 53-row map. They are **not** regenerated (`gen.py` asserts 53 rows; don't run it now). What changes:

- **Prompts 17–21: internal links.** The 74-row map adds links to pages those prompts built. Prompt 34 step C9 applies them (now where the target exists, otherwise automatically when the target's row is enabled): row 18 and 20 → electric-heater-to-reverse-cycle; 26 → postcode; 27 → business-energy-upgrades; 29, 32, 36 → already-installed-retrospective-discount; 38 → electric-heater-to-reverse-cycle; 39 → north-west-corridor; 41 → mildura; 42 → macedon-ranges; 43 → latrobe-valley, mitchell; 46 → business-energy-upgrades, latrobe-valley; 47 → shepparton; 49 → melbourne-west; 50 → melbourne-south-east; 51 → melbourne-north; 52 → melbourne-east; 53 → shepparton, mildura; and to Wave 4 pages: 30 → battery-rebate, solar-panel-rebate; 31 → help-in-your-language; 44 → other-veu-discounts.
- **Prompt 21, Solstice (row 53):** the row now has all 10 postcodes, councils and Table A classes; prompt 34 step C5 updates the page.
- **Prompt 21, Ballarat (46), Bendigo (47), Yarra Ranges (52), and live Geelong:** their postcode facts were corrected to match postcodes.csv (Geelong's 14 postcodes exclude 3221 and 3225); prompt 34 step C10 rebuilds the tables from the CSV.
- **Prompt 16:** its `vic-veu-postcodes.json` (parsed from the PDF) is replaced by `postcodes.json` from `postcodes.csv`; the PDF parse becomes a cross-check (34). The checker itself is rebuilt by 35a/35b.
- **Prompt 22 (Shepparton):** a 14 Nov addendum was appended (both `prompts/22-shepparton-gated.md` and `.prompt-generator/tpl/22-…`): cite GMCA only; the council page stays UNVERIFIED and isn't cited even if it loads; options (a)/(b)/(c). Prompt 34 re-opens the gate; release is Guri's decision.
- **Prompt 23:** an addendum was appended (both `prompts/23-post-election-recheck.md` and `.prompt-generator/tpl/23-…`): rule-status after the election, postcodes.csv never regenerated (a new spec version is a STOP), URL counts = enabled rows, and re-checks of estimates, council statuses, checker rules and battery figures.
- **Prompt 15:** its Geelong "conflict" is resolved by the estimate (34).

## Conflicts (14 Nov 2026)

**Still open**
- Design §7.6 "no email capture while the form is closed" vs the review's email alerts: alerts are a separate, consent-based list, flagged and gated (29b).
- Business figures were allowed only on the co-payment page; 28 and 35a extend that to business pages and the checker.
- Battery 20 kW cap appears only in a trade source: used only if SPEC25 Part 6 confirms it (30).
- The pack asks for corridor "pages"; the map has one page (37).
- Geelong wording differs between two places in the map (decision 6).
- Prompt 23's "52 or 53" counts are stale (addendum).

**Resolved by Venture Architect's 14 Nov revision**
- Hero count: 35 uncaptioned heroes is correct (the review's 44 is superseded) (25).
- Business slugs: the map's hub, flat sub-pages, no `/victoria/business/` (28).
- Shepparton: map and spec now agree: GMCA confirmed, council page not verified, cite GMCA only (22, 34).
- "Regenerate postcodes.csv": the line is gone from the map; the CSV is never regenerated (34, 23 addendum).
- Weather sealing: figures depend on home type (apartment $70/$140, townhouse $280/$560, house $350/$700); spec RD-1/RD-2 (25, 34, 35a).
- Map location rows vs postcodes.csv: corrected (Mildura 12, Mitchell incl. 3661, Latrobe incl. 3841, Yarra Ranges, Bendigo, Shepparton, Ballarat, Geelong without 3221/3225); `check-postcodes` is expected to pass (34, 38).
- TIS National 131 450: the map now gives Solar Victoria's community languages page as the source (31).
- Clothes dryers: available to homes and businesses (ESC Part 25), not household-only (28, 35a).

## Generator notes

- `.prompt-generator/gen2.py` renders `.prompt-generator/tpl2/*.md` → `prompts/24…39` from the master `url-map.csv` (asserts 74 rows). Placeholders: `{{BLOCK:x}}`, `{{PAGES:a-b}}`. The old `{{ADDROWS}}`/`{{NEWPAGES}}` placeholders and `.prompt-generator/additions.py` are retired (marked superseded; not imported, not run).
- `.prompt-generator/blocks/rules-addendum.md` adds rules 14–19 (labelled heroes, rule-status, clean text, canonical FAQs, the 74-row map is the page list, postcodes.csv read-only) to every prompt from 24.
- `gen.py` (prompts 15–23) is frozen at 53 rows; don't run it.
