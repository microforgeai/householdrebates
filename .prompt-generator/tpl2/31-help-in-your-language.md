# Prompt 31: "Help in your language" page (map row 72, Wave 4), footer link, and links from the scams and concession pages

> Local only, then a deploy STOP. Branch: `feat/review-31-languages`.
> Run after prompt 34 (map import). Source: `docs/business-review-2026-11-14.md` §2 rows 5 and 7, §7 item 8. Map: `docs/url-map.md` / `docs/url-map.csv` row 72 (corrected 14 Nov 2026) and the Wyndham row (council webinars in six languages). Design: `docs/solution-design.md` §4.4 (accessibility), §10.2.

---

## Context

No page links the official translations. TIS National (131 450) appears only on the scams page. Scams hit multicultural communities and seniors hard. The review's ask is small and specific: **link the official translated material**, give the interpreter number, and show each language name in its own script so people can find their language. **No machine-translated pages.** Any later summary in Punjabi or Hindi is a separate map row and must be written or reviewed by a fluent human.

Also from the review (§2 row 7, seniors): add a short "Seniors: avoid pressure sales" box to the scams and concession pages, linking the translated consumer-rights factsheet. No new page.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

Page-specific rules:

- **List only what each source shows (corrected 14 Nov 2026).** The two publishers list different languages, so they get separate tables and are never merged into one "available in" list:
  - **Energy Victoria** (VEU consumer-rights factsheet): the page *says* 13 languages but **lists 11**: Arabic, Chinese (Simplified), Chinese (Traditional), Filipino, Greek, Hazaragi, Hindi, Italian, Khmer, Turkish, Vietnamese. There is **no Punjabi or Sinhalese** factsheet. Show the 11 listed; don't repeat the "13" claim. Page last updated 23 Aug 2024 (show that date).
  - **Solar Victoria** (Solar Homes summaries): **14 languages**: Arabic, Dinka, Greek, Hindi, Italian, Nuer, Punjabi, Simplified Chinese, Sinhalese, Spanish, Tamil, Traditional Chinese, Turkish, Vietnamese (plus English). Punjabi and Sinhalese appear here only.
  - Re-open both pages on the day you build. If either list differs from the above, use what the page shows and tell Guri.
  - **ECCV** (the go-electric brochure "in 11 languages"): **UNVERIFIED** (fetch failed 14 Nov 2026). It stays out of the copy, links and FAQ; log it as a TODO.
- **Own-script names from the source only.** Copy each language's own-script name only if the official page shows it. Otherwise use the English name and add the language to the TODO list for a fluent reviewer. Don't type or machine-generate a script name yourself.
- Each own-script name gets the right `lang` attribute (e.g. `lang="pa"` for Punjabi, `lang="hi"`, `lang="zh-Hans"`, `lang="zh-Hant"`, `lang="vi"`, `lang="ar"` with `dir="rtl"`), so screen readers pronounce it.
- Language counts (Energy Victoria 11 listed, Solar Victoria 14) are `count` figures with source and date, or leave the counts out.
- TIS National 131 450: cite Solar Victoria's community languages page, which the row gives as the source. Use the same source on the scams page if it has none.

## Steps

1. Row 72 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.
2. Enable it. `navGroup: support-guides`.
3. Build the page:

{{PAGES:72-72}}

   - Layout: a short answer; "Call an interpreter" (TIS 131 450, how it works in one line); a table per publisher (language in its own script, English name, link to the PDF or page, file type and size if shown); "Avoid scams" (link the translated factsheet and `/victoria/veu-scams-cold-calls/`). No FAQ amounts.
   - Links to PDFs say "(PDF)" in the link text.
4. **Footer:** a site-wide "Help in your language" link.
5. **Inbound links:** from `/victoria/veu-scams-cold-calls/`, `/victoria/concession-card-holders/` and `/victoria/wyndham/` (which already mentions interpreted webinars).
6. **Seniors box** on the scams and concession pages: "Seniors: avoid pressure sales". Three short points from the ESC cold-call ban source the scams page already uses (cold calls and door-knocking banned without express prior consent; take your time; check the provider is accredited), plus the factsheet link.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run build
node scripts/check-urlmap.mjs && node scripts/check-text.mjs && node scripts/check-faqs.mjs && node scripts/check-figures.mjs   # expect: pass; URL count + 1
grep -c 'lang="' dist/victoria/help-in-your-language/index.html        # expect: ≥ the number of own-script names shown
grep -ci 'eccv' dist/victoria/help-in-your-language/index.html          # expect: 0 (UNVERIFIED)
# Energy Victoria table: 11 rows, no Punjabi or Sinhalese; Solar Victoria table: 14 rows
grep -c 'href="/victoria/help-in-your-language/"' dist/victoria/veu-scams-cold-calls/index.html   # expect: ≥ 1 in <main>
npx pa11y-ci dist/victoria/help-in-your-language/index.html            # expect: 0 errors (or the a11y tool from prompt 13)
```

## What to test by hand

- Open every linked PDF and page: it exists, it's the language claimed, and it's the official version.
- Ask a Punjabi or Hindi reader (Guri may know one) to check those two own-script names render correctly. Punjabi appears only in the Solar Victoria table.

## TODO (log it)

- Any language whose own-script name isn't shown on the official page.
- ECCV's multilingual brochure: UNVERIFIED until its page loads and shows the languages; then it needs a map change through Venture Architect before it goes on the page.
- A human-reviewed Punjabi or Hindi summary page: later, as a new map row through Venture Architect.

## Open decisions for Guri

- Who the fluent reviewer is for any future summary page, and whether that costs anything (no spend without his yes).

{{BLOCK:deploy-stop}}

Sitemap count: the previous count + 1.

## Done when

The page links every official translation with correct `lang` attributes, the footer and three pages link to it, the seniors box is on two pages, every check passes and Guri has said yes. Commit `feat(review): help in your language page (31)`.
