# Search Console, Bing Webmaster Tools & IndexNow Setup

Operator checklist for connecting **householdrebates.com.au** to Google Search Console and Bing Webmaster Tools (which also powers ChatGPT Search and Microsoft Copilot citations). No client-side scripts, meta verification tags, or cookies are added to the site.

---

## 1. Google Search Console (Domain Property via DNS TXT)

1. Sign in at `https://search.google.com/search-console` and select **Add property**.
2. Choose **Domain** (left card) and enter `householdrebates.com.au` (no `https://`, no trailing slash).
3. Copy the verification string shown by Google (`google-site-verification=...`).
4. In **Hostinger hPanel → Domains → householdrebates.com.au → DNS / Nameservers**:
   - Add a new **TXT** record:
     - **Name / Host:** `@`
     - **TXT value:** paste the `google-site-verification=...` string
     - **TTL:** `300` (or `3600`)
   - Do **not** alter existing `A`, `CNAME`, `MX`, `SPF`, `DKIM`, or `DMARC` records.
5. Wait 2–5 minutes (`dig +short TXT householdrebates.com.au` should include the verification token), then click **Verify** in Search Console.
6. In the left sidebar, open **Sitemaps**:
   - Enter `sitemap-index.xml` (`https://householdrebates.com.au/sitemap-index.xml`) and click **Submit**.
   - Confirm status shows **Success** with **72 discovered pages**.
7. Use **URL Inspection** at the top bar to inspect and click **Request Indexing** for the main entry points:
   - `https://householdrebates.com.au/`
   - `https://householdrebates.com.au/victoria/`
   - `https://householdrebates.com.au/victoria/eligibility-checker/`
   - `https://householdrebates.com.au/victoria/air-conditioner-rebate/`
   - `https://householdrebates.com.au/victoria/gas-to-electric-hot-water-2027/`

---

## 2. Bing Webmaster Tools (Feeds Bing, ChatGPT Search & Copilot)

1. Sign in at `https://www.bing.com/webmasters`.
2. Choose **Import your sites from Google Search Console** (recommended — skips a second DNS TXT record and imports `sitemap-index.xml` automatically).
3. Grant read-only Search Console verification access, select `householdrebates.com.au`, and click **Import**.
4. Open **Sitemaps** in Bing Webmaster Tools and confirm `https://householdrebates.com.au/sitemap-index.xml` is listed and processing (`72` URLs).
5. Use **URL Submission** in Bing Webmaster Tools to submit `/` and `/victoria/eligibility-checker/` immediately if desired.

---

## 3. Optional IndexNow Ping on Deploy

The repository includes an IndexNow key file (`site/public/651d4e162671bce57241a322c7a9cf4d.txt`, served at `https://householdrebates.com.au/651d4e162671bce57241a322c7a9cf4d.txt` once deployed) and `ops/indexnow-ping.sh`.

- By default, `ops/deploy-site.sh` does **not** ping IndexNow.
- Once the key file is live on production, you can opt in during any production deploy:
  ```bash
  INDEXNOW=1 VPS_HOST=hostinger-vps ./ops/deploy-site.sh
  ```
- Or run a one-off ping manually after a deploy:
  ```bash
  ./ops/indexnow-ping.sh
  ```

---

## 4. What to Check at Day 7

1. **Google Search Console → Indexing → Pages:**
   - Check how many of the `72` sitemap URLs have moved from *Discovered – currently not indexed* or *Crawled – currently not indexed* into **Indexed**.
   - Confirm **0 unexpected errors** (`Server error (5xx)`, `Not found (404)` on sitemap URLs, `Submitted URL marked 'noindex'`, or redirect loops).
   - Confirm `/about/gurinder-singh/`, `/thanks/`, `/form-error/`, and `/alerts/*` are **not** indexed.
2. **Google Search Console → Enhancements:**
   - Check **Breadcrumbs** and **FAQ** (`FAQPage`) rich-result reports for **0 invalid items**.
3. **Bing Webmaster Tools → Site Explorer / Sitemaps:**
   - Confirm `sitemap-index.xml` succeeded with `0` crawl errors and check initial Bingbot crawl activity.
4. **Manual spot check:**
   - Run `site:householdrebates.com.au` on Google and Bing to confirm rendered titles and descriptions match expectations (no truncated brand suffixes, no raw `$` figures).

---

## 5. What to Check at Day 28

1. **Coverage completion (`72 / 72`):**
   - In GSC → **Pages** → filter to **All submitted pages**: investigate any URL still stuck in *Crawled – currently not indexed* after 4 weeks (check internal inbound link count and overlap similarity).
2. **Search Performance (Queries & CTR):**
   - Review **Performance → Search results** by page group:
     - Core upgrade guides (`air-conditioner-rebate`, `heat-pump-rebate`, `gas-to-electric-hot-water-2027`, `battery-rebate`, `solar-panel-rebate`)
     - Area and postcode pages (`/victoria/melbourne/`, `/victoria/wyndham/`, `/victoria/postcode/`)
     - Interactive tools (`eligibility-checker`, `running-costs`, `get-off-gas-planner`)
     - Commercial / business guides (`business-energy-upgrades` and sub-guides)
   - Identify high-impression, low-CTR pages whose `<title>` or `<meta name="description">` could be sharpened (keeping titles `<= 60` chars, descriptions `70–155` chars, and zero `$` amounts).
3. **Core Web Vitals & HTTPS:**
   - Check GSC **Core Web Vitals** (mobile and desktop) and **HTTPS** reports once field data accumulates, ensuring LCP, INP, and CLS remain green.
4. **AI Search & Crawler Logs (VPS):**
   - Compare Bing impressions with `ops/ai-report.sh` output on `/var/log/nginx/householdrebates.ai.log` to see which pages `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, and human AI-assistant referrals (`chatgpt`, `perplexity`, `claude`, `gemini`, `copilot`) visit most.
