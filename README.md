# Household Rebates — design and Antigravity prompts

Site: **householdrebates.com.au** (brand: Household Rebates; publisher: Agenor Services Pty Ltd)
Prepared 13 Nov 2026 (Melbourne time) by Indie Builder for Guri, from Venture Architect's strategy ("Energy rebates" tab).
These are Markdown files only. No code has been written, and nothing has been touched on the VPS, DNS or Hostinger.

**Update, 13 Nov 2026: expansion from 16 to 53 URLs (approved by Guri).** The source of truth is Venture Architect's [`url-map.md`](url-map.md) and [`url-map.csv`](url-map.csv) (rebuilt with `.url-map-generator/`). Prompts 15–23 build it. `solution-design.md` is updated (§0, §1 verified 2027 exemptions and new facts, §4.1a–d, §5, §6, §10, §13–§15). The page sections of prompts 17–22 are generated from the CSV by `.prompt-generator/gen.py`. If the map changes, re-run it rather than hand-editing those sections.

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
| [`url-map.md`](url-map.md) / [`url-map.csv`](url-map.csv) | Venture Architect's 53-URL map: per-page question, verified facts with sources, required links, notes; rule changes; source index; re-check list |
| [`prompts/15-priority-fixes-existing-pages.md`](prompts/15-priority-fixes-existing-pages.md) | Fixes to live pages first: 30 Sep 2026 co-payments (AC, timing rule), Solar Homes $150k cap (heat pump), verified reg 45E exemptions (gas 2027), Geelong insulation note; 52 new sources; 16 new figures; URL-map import; sequential `check-sources` with a deny list |
| [`prompts/16-checker-new-paths.md`](prompts/16-checker-new-paths.md) | Checker: co-payment notes on ducted and split results, LPG "provider confirms" (no amount), new insulation, induction and draught-proofing paths, VEU postcode table (719 rows) |
| [`prompts/17-wave1a-hub-and-upgrade-guides.md`](prompts/17-wave1a-hub-and-upgrade-guides.md) | Structure for 53 URLs (navGroup, rollout control, breadcrumbs, `RelatedLinks`, `HubIndex`, `check-urlmap`, sitemap, llms.txt, redirects mechanism) + `/victoria/` hub + 9 upgrade guides (rows 17–26) |
| [`prompts/18-wave1b-question-pages.md`](prompts/18-wave1b-question-pages.md) | 9 question pages (rows 27–35); completes Wave 1 (35 URLs) |
| [`prompts/19-wave2a-audience-and-support-pages.md`](prompts/19-wave2a-audience-and-support-pages.md) | 5 audience pages + draught proofing + find an accredited provider (rows 36–40, 44–45) |
| [`prompts/20-wave2b-tools.md`](prompts/20-wave2b-tools.md) | Running costs (published savings only), hot water size guide, get-off-gas planner (rows 41–43); completes Wave 2 (45 URLs) |
| [`prompts/21-wave3-location-pages.md`](prompts/21-wave3-location-pages.md) | Ballarat, Bendigo, Wyndham, Casey, Whittlesea, Yarra Ranges, Solstice gas-shutdown towns (rows 46–47, 49–53); 52 URLs |
| [`prompts/22-shepparton-gated.md`](prompts/22-shepparton-gated.md) | **Hard stop:** verify the council's Solar Savers program, then Guri decides, then (maybe) build Shepparton (row 48); 53 URLs |
| [`prompts/23-post-election-recheck.md`](prompts/23-post-election-recheck.md) | After the 28 Nov 2026 election (from 30 Nov): re-check every figure, source, rule and UNVERIFIED item, diff report, STOP list, then monthly |

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

## Key facts (checked 13 Nov 2026 against official pages; see solution-design §1)

- Reverse-cycle AC: up to $5,530 is the largest case only (ducted gas → 22.4 kW ducted). A room gas heater → split is $630 to $1,610.
- Heat pump hot water: $630 replacing an **electric** system; **$560 replacing gas**.
- From 1 March 2027, a mains gas water heater that needs replacing in an existing home generally has to be replaced with an electric one. LPG isn't affected. The exemptions are now verified against reg 45E (SR 140/2025 reg 6): space, centralised Class 2 or pool systems, other laws, switchboard work, network augmentation, temporary disconnection, like-for-like where no electricity is needed, warranty replacements, and contracts, building work or orders from before 1 March 2027.
- From 30 Sep 2026, every ducted system needs a minimum customer co-payment of $3,000 including GST (was $1,000). Multi-split is $3,000 at 10 kW or more and $1,000 below; a single split below 10 kW is $200 (VEU Specifications v25.0, Part 6).
- Solar Homes hot water: household income cap $150,000 from 1 Jul 2026 (was $210,000), property under $3m, system at least 3 years old.
- Ceiling insulation is a new VEU product: up to $1,500 metro / $2,100 regional (150 m² examples).
- VEU code of conduct: lead generation is regulated; cold calls and doorknocking banned without express prior consent; consent lasts 3 months unless withdrawn; name the installer on the form.
- Not legal advice: the consent wording, privacy policy, terms and installer agreement need a lawyer's check.
