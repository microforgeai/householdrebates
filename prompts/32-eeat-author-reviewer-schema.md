# Prompt 32: Trust signals: author page (map row 73, Wave 4), a reviewer slot that stays empty until someone signs, and Article / Person / WebApplication schema

> Local only, then a deploy STOP. Branch: `feat/review-32-eeat`.
> Run after prompt 34 (map import). Source: `docs/business-review-2026-11-14.md` §5 "Author / E-E-A-T" and "Reviewed-by expert", §6 "Schema" and "llms.txt", §7 item 9. Design: `docs/solution-design.md` §10.2 (structured data: allowed and banned types), §10.3 (llms.txt), §4.2 (byline). Map: `docs/url-map.md` / `docs/url-map.csv` row 73 ("noindex until Guri supplies the bio").

---

## Context

Every page has a "By Gurinder Singh, Agenor" byline but no author page, no credentials and no Person schema. No expert reviews the technical pages. Schema has Organization, WebSite, BreadcrumbList and FAQPage, but no Article or WebPage with `dateModified`, no `author`, no `reviewedBy`, and no WebApplication for the checker and the 3 tools.

**Never invent a person.** The reviewer's name, licence and credentials are **placeholders** until Guri names a real person who has agreed in writing. Guri's own biography, photo, qualifications and profile links come only from Guri. The build fails if any placeholder would reach a built page.

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

### Extra guards from the 14 Nov 2026 business review (prompts 24–27 add the checks; they apply to every page from then on)

14. **Labelled headline figures.** Every `<Money variant="block">` (the hero figure under the answer) needs a `label` that names the scenario (for example "Room gas heater → one split system") and the figure's `kind` (`discount | payment | threshold | rate | saving`). `check-figures` fails without them (prompt 25).
15. **Rule status.** Any page that states a 2027 rule carries `ruleStatus: election-watch` until prompt 23's re-check clears it. Every "must", "have to" or "banned" sentence about a 2027 rule says "currently legislated" (prompt 24, `check-rule-status`).
16. **Clean visible text.** No raw paths such as `/victoria/…` or `/about/` in visible text; use linked anchor text. No doubled words or phrases. No link from a page to itself (except `#` anchors). Rendered `<title>` 60 characters or fewer, with the brand at most once. Meta descriptions unique and 155 characters or fewer (prompt 26, `check-text`, `check-seo`).
17. **FAQ placement.** Each FAQ entry has one `canonicalPage`. It's shown in full, and in `FAQPage`, only there. Other pages link to it. Each page has 3–5 FAQs of its own (prompt 27, `check-faqs`, `check-overlap`).
18. **The map is the page list.** A page that isn't a row in `docs/url-map.csv` doesn't exist. Since 14 Nov 2026 the master map has **74 rows** (Wave 4, rows 65–74, holds the business pages, program pages, help in your language, the author page and LPG homes), and prompt 34 imports all of them. No prompt from 24 on adds a row. If a page seems to be missing, stop and ask Guri to get it added by Venture Architect first.
19. **postcodes.csv is read-only.** It's the master list of the 719 VEU v25.0 Table A postcodes. Copy it into `site/src/data/` unchanged. Never regenerate it (no `postcode_mkcsv.py`, no PDF re-parse). If it looks wrong, stop and tell Guri.

Schema rules for this prompt (update design §10.2):

- Allowed types now also include `Article` (guides), `WebPage` (with `reviewedBy` and `lastReviewed` when a reviewer has signed), `Person` (author; reviewer once signed), `ProfilePage` (the author page) and `WebApplication` (the checker and the 3 tools).
- `reviewedBy` is a `WebPage` property, not an `Article` one, so put it on the page's `WebPage` node and link the `Article` to it with `mainEntityOfPage`.
- `WebApplication`: `name`, `url`, `applicationCategory: "UtilitiesApplication"`, `operatingSystem: "Any"`, `isAccessibleForFree: true`, `publisher` → `#publisher`. **No `offers`** (it would need a price; currency is banned in JSON-LD).
- Still banned: `LocalBusiness`, `Offer`, `PriceSpecification`, `Product` with prices, `GovernmentService`, `AggregateRating`, any currency.

## Steps

1. Row 73 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.

### Row 73: `/about/gurinder-singh/`

- **File:** `site/src/content/pages/about-gurinder-singh.mdx` (served at `/about/gurinder-singh/` by a new `site/src/pages/about/[slug].astro`)
- **Template (map):** Trust – author page (Person)
- **Primary question (build the H1 and answer block on it):** Who writes and checks Household Rebates?
- **Secondary questions (a section or FAQ item each):** How are figures checked? · How is the site paid for? · Who reviews the technical pages? · How do I report an error?
- **Priority / intent:** P2 · Intent: Low (E-E-A-T)
- **CTA:** None (trust page). Quote form stays off.
- **Verified facts you may use (checked 14 Nov 2026; re-open each source while writing):**
  - Household Rebates is published by Agenor Services Pty Ltd (ABN 29 644 447 263); all guides and fact-checks are edited by Gurinder Singh (live /about/ page: "All guides and fact-checks are edited by Gurinder Singh", crawl 14 Nov 2026)
  - Every figure links to an official source with a checked-on date; the build blocks figures more than 45 days old (site method, design §5.3)
  - Installers may pay for enquiries (IndependenceNotice on every page)
- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** `/about/` · `/sources/` · `/how-quotes-work/` · `/victoria/`
- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** Biography, credentials, photo and profile links come only from Guri (placeholders until then). No reviewer is named until one has signed. Do not publish with placeholder text: noindex until Guri supplies the bio.

2. Enable it (`navGroup: trust`), with the noindex rule in step 4. Route: `site/src/pages/about/[slug].astro` for `pages` entries with `section: trust` and a `parent: about` field (or the simplest route that serves `/about/gurinder-singh/`).
3. **Author data** `site/src/data/people.json`:

   ```json
   {
     "gurinder-singh": {
       "name": "Gurinder Singh",
       "role": "Editor, Household Rebates; director, Agenor Services Pty Ltd",
       "bio": "<<GURI_BIO: 2–4 sentences, from Guri>>",
       "credentials": "<<GURI_CREDENTIALS: from Guri, or remove the field>>",
       "image": "<<GURI_PHOTO: path, or remove>>",
       "sameAs": ["<<GURI_PROFILE_URLS: from Guri, e.g. LinkedIn; or empty>>"]
     },
     "reviewers": []
   }
   ```

   Check the `role` wording with Guri (it says "director" because Agenor's ABN is on the site; change it if that's wrong). `reviewers` stays an **empty array** until a reviewer signs. The schema for a reviewer entry: `name`, `licence` (type and number, verifiable on a public register), `scope` (which page groups they review, e.g. hot water and heating), `paidInstaller: boolean` (the review says disclose this), `agreementSignedOn`, `reviewedPages: [{ url, date }]`.
4. **Noindex until the bio, and no placeholder ever renders.** The map says: noindex until Guri supplies the bio.
   - Extend `check-text` (prompt 26) so any `<<…>>` in built HTML or JSON-LD fails the build.
   - Template rule: a `people.json` field that still holds a `<<…>>` placeholder isn't rendered at all (the section is omitted, not shown blank).
   - While `bio` is a placeholder, the page renders only the parts that don't depend on Guri (the editorial method, conflicts, how to report an error, from the row's facts) and carries `<meta name="robots" content="noindex, follow">`. It is left out of the sitemap, `llms.txt` and `Person`/`ProfilePage` schema, and bylines don't link to it yet.
   - Once Guri supplies `bio` (his own words), `noindex` lifts automatically, and the page joins the sitemap and `llms.txt` with its schema. That change is its own deploy STOP.
   - `check-seo` asserts: placeholder `bio` ⇔ `noindex` present ⇔ not in the sitemap.
5. **Author page** (`/about/gurinder-singh/`), from the row: who he is (from `people.json` only), why he runs the site, the editorial method (official sources, checked-on dates, the 45-day rule, product pages beat summary pages, election re-checks), conflicts (installers may pay for enquiries; how quotes work; the quote form is off), how to report an error (the existing contact address from `/about/`). `ProfilePage` + `Person` schema. Link it from every byline ("By Gurinder Singh" → the page) and from `/about/`.
6. **Reviewer slot:** a `ReviewedBy` line under the byline that renders only when the page's URL is in a signed reviewer's `reviewedPages`, showing name, licence, review date and "paid installer: yes/no" (disclosure). Until then, render nothing. Don't show "Reviewed by an expert" without a name.
7. **Schema on guides:** `Article` (`headline` = H1, `datePublished` = `publishedOn`, `dateModified` = `updatedOn`, `author` → `#person-gurinder-singh`, `publisher` → `#publisher`, `inLanguage: en-AU`, `mainEntityOfPage` → the `WebPage` node); `WebPage` with `reviewedBy` and `lastReviewed` only when signed. Area pages and hub pages get `WebPage` only.
8. **WebApplication** on `/victoria/eligibility-checker/`, `/victoria/gas-vs-heat-pump-running-costs/`, `/victoria/heat-pump-hot-water-size-guide/`, `/victoria/get-off-gas-planner/` (and `/victoria/postcode/` once prompt 36 builds it).
9. **`check-schema`:** allow the new types; fail on `reviewedBy` without a matching signed reviewer; fail on `offers` anywhere; fail on any `<<`.
10. **llms.txt:** confirm `/llms.txt` exists and lists the hub, the checker, the top guides, `/sources/`, and "Figures checked {date}" (review §6). Add the author page under "About and sources" once it's enabled.

## Acceptance checks

```bash
cd site
npm run import:urlmap && npm run build
node scripts/check-schema.mjs   # expect: 0 banned types, 0 currency, 0 offers, 0 unsigned reviewedBy, 0 placeholders
node scripts/check-text.mjs && node scripts/check-urlmap.mjs && node scripts/check-figures.mjs
# With the bio unfilled: the author page is built with noindex, isn't in sitemap-0.xml or llms.txt, has no <<…>> text, and bylines don't link to it:
grep -c 'noindex' dist/about/gurinder-singh/index.html                          # expect: 1
grep -c 'about/gurinder-singh' dist/sitemap-0.xml                               # expect: 0
grep -c '<<' dist/about/gurinder-singh/index.html                               # expect: 0
# After Guri fills the bio: noindex gone, page in the sitemap, and:
grep -c '"@type":"Person"' dist/about/gurinder-singh/index.html                 # expect: ≥ 1
grep -c '"@type":"WebApplication"' dist/victoria/eligibility-checker/index.html   # expect: 1
grep -RIl 'reviewedBy' dist | wc -l                                               # expect: 0 until a reviewer signs
curl -s file://$PWD/dist/llms.txt | head -20                                       # expect: hub, checker, guides, sources, a checked date
```

Validate 3 pages (a guide, the checker, the author page) in validator.schema.org and Google's Rich Results Test; paste the results.

## What to test by hand

- Guri reads his author page. Every sentence about him is something he wrote or approved.

## Open decisions for Guri

- His bio, credentials, photo and profile links (placeholders `<<GURI_BIO>>`, `<<GURI_CREDENTIALS>>`, `<<GURI_PHOTO>>`, `<<GURI_PROFILE_URLS>>`). The author page stays noindex (out of the sitemap and llms.txt, bylines not linked) until he supplies the bio.
- The `role` wording ("director, Agenor Services Pty Ltd").
- **The reviewer** (`<<REVIEWER_NAME>>`, `<<REVIEWER_LICENCE>>`, `<<REVIEWER_SCOPE>>`): whether to recruit a licensed plumber, electrician or energy assessor; whether to pay (the review's **[Assumption]** is $100–$300 a page, or a free exchange) — any payment needs his yes; and the disclosure if the reviewer is also a paid installer.

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

Sitemap count: unchanged until Guri fills `people.json`; then + 1.

## Done when

The schema types, the author data model, the placeholder guard and the reviewer slot are built and tested; the author page stays noindex until Guri supplies his bio; no reviewer appears until one has signed; every check passes and Guri has said yes. Commit `feat(review): author page, reviewer slot, Article/Person/WebApplication schema (32)`.
