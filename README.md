# Household Rebates — design and Antigravity prompts

Site: **householdrebates.com.au** (brand: Household Rebates; publisher: Agenor Services Pty Ltd)
Prepared 13 Nov 2026 (Melbourne time) by Indie Builder for Guri, from Venture Architect's strategy ("Energy rebates" tab).
These are Markdown files only. No code has been written, and nothing has been touched on the VPS, DNS or Hostinger.

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

## Key facts (checked 13 Nov 2026 against official pages; see solution-design §1)

- Reverse-cycle AC: up to $5,530 is the largest case only (ducted gas → 22.4 kW ducted). A room gas heater → split is $630 to $1,610.
- Heat pump hot water: $630 replacing an **electric** system; **$560 replacing gas**.
- From 1 March 2027, a mains gas water heater that needs replacing in an existing home generally has to be replaced with an electric one. Exemptions exist; LPG isn't affected.
- VEU code of conduct: lead generation is regulated; cold calls and doorknocking banned without express prior consent; consent lasts 3 months unless withdrawn; name the installer on the form.
- Not legal advice: the consent wording, privacy policy, terms and installer agreement need a lawyer's check.
