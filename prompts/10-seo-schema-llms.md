# Prompt 10 — SEO, schema, llms.txt, sitemap, robots, canonicals, AI-referrer report

> Local build changes, then one deploy to the **password-protected** preview (Guri's yes). Search Console and Bing are set up in prompt 14 when the site goes public.

---

## Context

Household Rebates wants Google traffic and to be cited by AI answer engines (ChatGPT, Perplexity, Gemini, Copilot). The levers: answer-first pages, visible dated sources, clean HTML, correct canonicals, a sitemap, `/llms.txt` (llmstxt.org format), limited honest schema, and logging AI referrers and crawlers in nginx. Rules: schema types only Organization (Agenor as publisher), WebSite, BreadcrumbList, FAQPage (only where the FAQ is visible), HowTo (only `/how-quotes-work/`); **no LocalBusiness and no dollar figures in schema, titles or descriptions**. Spec: `docs/solution-design.md` §10–11.

## Goal

Every indexable page has correct meta, canonical, OG and JSON-LD; `/robots.txt`, `/sitemap-index.xml`, `/llms.txt` are generated and correct; `ops/ai-report.sh` summarises AI traffic.

## Steps

1. **Meta audit script** `site/scripts/check-seo.mjs` (postbuild): for each indexable page — one `<title>` ≤ 60 chars with no `$`; meta description 70–160 chars with no `$`; one canonical, absolute `https://householdrebates.com.au/…/` with trailing slash and equal to the page's own URL; `og:title`, `og:description`, `og:url` (= canonical), `og:image`; `lang="en-AU"`; one H1; no duplicate titles or descriptions across pages. Utility pages (`/thanks/`, `/form-error/`, `/404.html`, `/styleguide/`) must be `noindex` and absent from the sitemap.
2. **Schema**: confirm `lib/schema.ts` output per solution-design §10.2. Organization `identifier` uses the ABN from `site.ts` (still a placeholder until prompt 12 — the check should **warn** on `<<` placeholders and **fail** only in `RELEASE_MODE=launch`).
3. **robots.txt** (`site/public/robots.txt`) exactly as solution-design §10.4. If Guri chose to block training-only crawlers, add `User-agent: GPTBot` / `ClaudeBot` / `Google-Extended` / `CCBot` → `Disallow: /` blocks; keep OAI-SearchBot, ChatGPT-User, PerplexityBot, Bingbot, Googlebot allowed.
4. **Sitemap**: `@astrojs/sitemap` with `filter` and `serialize` (lastmod = `updatedOn`). Verify `sitemap-index.xml` → `sitemap-0.xml`.
5. **llms.txt**: `site/scripts/build-llms.mjs` runs after `astro build`, reads page frontmatter straight from `src/content/**` with `gray-matter` (dev dependency) and maps each entry to its URL using the same `lib/urls.ts` rules the routes use, and writes `dist/llms.txt` in the format in solution-design §10.3: H1, blockquote summary (independent, not government, figures dated and sourced, provider confirms), `## Victoria guides`, `## How it works`, `## About and sources`, `## Optional` (area pages). One line per page: `- [Title](absolute URL): one-sentence summary. Figures checked {date}.` Excludes noindex pages.
6. **Internal links**: `check-links.mjs` — every internal `href` resolves to a built page; every guide links to the home pillar and the checker; every area page links to the pillar.
7. **AI report** `ops/ai-report.sh` (run on the VPS, read-only):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   LOG=${1:-/var/log/nginx/householdrebates.ai.log}
   echo "== AI referrals (visits from answer engines)"; zgrep -h -o 'ai_ref=[a-z]*' "$LOG"* | sort | uniq -c | sort -rn
   echo "== AI crawlers"; zgrep -h -o 'ai_bot=[a-z-]*' "$LOG"* | grep -v 'ai_bot=$' | sort | uniq -c | sort -rn
   echo "== Top pages from AI referrals"; zgrep -h 'ai_ref=[a-z]' "$LOG"* | awk '{print $2}' | sort | uniq -c | sort -rn | head -20
   ```
8. Add a "Sources and method" link and "Figures checked {date}" to the footer (site-wide freshness signal).

## Acceptance checks

```bash
npm run build -w site       # expect: check-seo, check-schema, check-links, check-figures, check-answers all pass
cat site/dist/robots.txt    # expect: Disallow /api/ /thanks/ /form-error/ and the Sitemap line
grep -c "<loc>" site/dist/sitemap-0.xml          # expect: number of indexable pages (15 at launch, fewer if an area was skipped)
grep -E "thanks|form-error|styleguide" site/dist/sitemap-0.xml | wc -l   # expect: 0
head -5 site/dist/llms.txt  # expect: "# Household Rebates", blank line, "> Independent guide …"
grep -c "^- \[" site/dist/llms.txt               # expect: = sitemap count minus home (or as designed)
grep -rh '"@type":"[A-Za-z]*"' -o site/dist --include=*.html | sort | uniq -c
# expect: only Organization, WebSite, BreadcrumbList, ListItem, FAQPage, Question, Answer, HowTo, HowToStep, PropertyValue
grep -rl '"@type":"LocalBusiness"' site/dist | wc -l    # expect: 0
```

After Guri's yes, deploy to the preview: `PUBLIC_LEADS_ENABLED=false ./ops/deploy-site.sh`, then:
```bash
curl -s -u guri:<pw> https://householdrebates.com.au/llms.txt | head -3      # expect: the H1 and summary
curl -s -u guri:<pw> -I https://householdrebates.com.au/llms.txt | grep -i content-type   # expect: text/plain; charset=utf-8
ssh <admin>@72.61.117.132 'sudo bash ~/hr-ops/ops/ai-report.sh'            # expect: runs without error (counts may be empty)
```

## What to test

- Google Rich Results Test and validator.schema.org on home, AC guide, FAQ, how-quotes-work (paste HTML, since the preview is password-protected): no errors.
- Read `llms.txt` as if you were a model: does every line tell you what the page answers?

## STOP

Deploying to the preview needs Guri's yes. Nothing is indexable yet (preview is `noindex` + password).
