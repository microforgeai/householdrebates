# Prompt 32: Trust signals: author page (map row 73, Wave 4), a reviewer slot that stays empty until someone signs, and Article / Person / WebApplication schema

> Local only, then a deploy STOP. Branch: `feat/review-32-eeat`.
> Run after prompt 34 (map import). Source: `docs/business-review-2026-11-14.md` §5 "Author / E-E-A-T" and "Reviewed-by expert", §6 "Schema" and "llms.txt", §7 item 9. Design: `docs/solution-design.md` §10.2 (structured data: allowed and banned types), §10.3 (llms.txt), §4.2 (byline). Map: `docs/url-map.md` / `docs/url-map.csv` row 73 ("noindex until Guri supplies the bio").

---

## Context

Every page has a "By Gurinder Singh, Agenor" byline but no author page, no credentials and no Person schema. No expert reviews the technical pages. Schema has Organization, WebSite, BreadcrumbList and FAQPage, but no Article or WebPage with `dateModified`, no `author`, no `reviewedBy`, and no WebApplication for the checker and the 3 tools.

**Never invent a person.** The reviewer's name, licence and credentials are **placeholders** until Guri names a real person who has agreed in writing. Guri's own biography, photo, qualifications and profile links come only from Guri. The build fails if any placeholder would reach a built page.

{{BLOCK:rules}}

{{BLOCK:rules-addendum}}

Schema rules for this prompt (update design §10.2):

- Allowed types now also include `Article` (guides), `WebPage` (with `reviewedBy` and `lastReviewed` when a reviewer has signed), `Person` (author; reviewer once signed), `ProfilePage` (the author page) and `WebApplication` (the checker and the 3 tools).
- `reviewedBy` is a `WebPage` property, not an `Article` one, so put it on the page's `WebPage` node and link the `Article` to it with `mainEntityOfPage`.
- `WebApplication`: `name`, `url`, `applicationCategory: "UtilitiesApplication"`, `operatingSystem: "Any"`, `isAccessibleForFree: true`, `publisher` → `#publisher`. **No `offers`** (it would need a price; currency is banned in JSON-LD).
- Still banned: `LocalBusiness`, `Offer`, `PriceSpecification`, `Product` with prices, `GovernmentService`, `AggregateRating`, any currency.

## Steps

1. Row 73 is in the master map (Wave 4), imported by prompt 34. Don't edit the map.

{{PAGES:73-73}}

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

{{BLOCK:deploy-stop}}

Sitemap count: unchanged until Guri fills `people.json`; then + 1.

## Done when

The schema types, the author data model, the placeholder guard and the reviewer slot are built and tested; the author page stays noindex until Guri supplies his bio; no reviewer appears until one has signed; every check passes and Guri has said yes. Commit `feat(review): author page, reviewer slot, Article/Person/WebApplication schema (32)`.
