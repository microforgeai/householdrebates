import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const pagesDir = path.join(siteRoot, 'src/content/pages');
const ruleStatusPath = path.join(siteRoot, 'src/data/rule-status.json');
const peoplePath = path.join(siteRoot, 'src/data/people.json');
const apiAlertsConfigPath = path.join(repoRoot, 'api/src/alerts/config.ts');
const distDir = path.join(siteRoot, 'dist');

const leadsEnabled = process.env.PUBLIC_LEADS_ENABLED === 'true';
const alertsEnabled = process.env.PUBLIC_ALERTS_ENABLED === 'true';
const productionBuild = Boolean(process.env.RELEASE_ID && process.env.RELEASE_ID.trim());
const authorPublishEnv = process.env.PUBLIC_AUTHOR_LIVE === 'true';
const legalSlugs = ['privacy', 'terms'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function hasPlaceholder(val) {
  if (typeof val === 'string') return /<<|>>/.test(val);
  if (Array.isArray(val)) return val.some(hasPlaceholder);
  if (val && typeof val === 'object') return Object.values(val).some(hasPlaceholder);
  return false;
}

function findPlaceholdersInText(str) {
  const matches = [...String(str || '').matchAll(/<<[^>]*>>|<<|>>/g)].map((m) => m[0]);
  return [...new Set(matches)];
}

function isValidSignedReviewer(rev) {
  if (!rev || typeof rev !== 'object' || hasPlaceholder(rev)) return false;
  if (typeof rev.id !== 'string' || !/^[a-z0-9-]+$/.test(rev.id.trim())) return false;
  if (typeof rev.name !== 'string' || !rev.name.trim()) return false;
  if (
    !rev.licence ||
    typeof rev.licence.type !== 'string' ||
    !rev.licence.type.trim() ||
    typeof rev.licence.number !== 'string' ||
    !rev.licence.number.trim()
  ) {
    return false;
  }
  if (!Array.isArray(rev.scope) || rev.scope.length === 0 || rev.scope.some((s) => !s?.trim())) {
    return false;
  }
  if (typeof rev.paidInstaller !== 'boolean') return false;
  if (typeof rev.agreementSignedOn !== 'string' || !ISO_DATE_RE.test(rev.agreementSignedOn.trim())) {
    return false;
  }
  if (!Array.isArray(rev.reviewedPages)) return false;
  return rev.reviewedPages.every(
    (rp) =>
      rp &&
      typeof rp.url === 'string' &&
      rp.url.startsWith('/') &&
      typeof rp.date === 'string' &&
      ISO_DATE_RE.test(rp.date.trim()),
  );
}

function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walkHtml(path.join(dir, e.name))
      : e.name.endsWith('.html')
        ? [path.join(dir, e.name)]
        : [],
  );
}

const parsedBySlug = new Map();

for (const slug of legalSlugs) {
  const filePath = path.join(pagesDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    throw new Error(`Missing frontmatter in ${slug}.mdx`);
  }
  const fm = YAML.parse(fmMatch[1]);
  parsedBySlug.set(slug, { raw, fm });
}

const privacyEntry = parsedBySlug.get('privacy');
if (!privacyEntry || !/^##\s+\d+\.\s+Email alerts\b/m.test(privacyEntry.raw)) {
  throw new Error('privacy.mdx is missing the required "Email alerts" section.');
}

const ruleStatusRaw = JSON.parse(fs.readFileSync(ruleStatusPath, 'utf8'));
const ewStatus = ruleStatusRaw?.electionWatch?.status;
const electionPending =
  ewStatus === 'pending' || !['rechecked-unchanged', 'rechecked-changed'].includes(ewStatus);

// Collect any unresolved <<...>> placeholders across legal MDX pages and built HTML
const legalPagePlaceholders = [];
for (const slug of legalSlugs) {
  const entry = parsedBySlug.get(slug);
  const found = findPlaceholdersInText(entry.raw);
  if (found.length > 0) {
    legalPagePlaceholders.push(`${slug}.mdx contains unresolved placeholder(s): ${found.join(', ')}`);
  }
}
if (fs.existsSync(distDir)) {
  for (const htmlFile of walkHtml(distDir)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const found = findPlaceholdersInText(html.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    if (found.length > 0) {
      const rel = path.relative(siteRoot, htmlFile);
      legalPagePlaceholders.push(`${rel} contains unresolved placeholder(s): ${found.join(', ')}`);
    }
  }
}

if (productionBuild && legalPagePlaceholders.length > 0) {
  throw new Error(
    `Refusing production build (RELEASE_ID=${process.env.RELEASE_ID}):\n  - ${legalPagePlaceholders.join('\n  - ')}`,
  );
}

if (leadsEnabled) {
  const blockers = [];

  for (const slug of legalSlugs) {
    const entry = parsedBySlug.get(slug);
    if (entry.fm.legalReviewed !== true) {
      blockers.push(
        `${slug}.mdx has legalReviewed=${entry.fm.legalReviewed} (lawyer review required)`,
      );
    }
  }

  if (electionPending) {
    blockers.push(
      `rule-status.json has electionWatch.status="${ewStatus}" (post-election re-check must complete before enabling PUBLIC_LEADS_ENABLED=true)`,
    );
  }

  const serverCountry = (
    process.env.PUBLIC_SERVER_COUNTRY ??
    process.env.SERVER_COUNTRY ??
    'Malaysia'
  ).trim();
  if (!serverCountry || /<<|>>/.test(serverCountry)) {
    blockers.push(
      'PUBLIC_SERVER_COUNTRY is unset or contains <<SERVER_COUNTRY>> / <<...>> placeholders',
    );
  }

  const leadsEmailNote = (
    process.env.PUBLIC_LEADS_EMAIL_PROVIDER_NOTE ??
    process.env.LEADS_EMAIL_PROVIDER_NOTE ??
    'Hostinger Mail, which stores mail in France and Germany'
  ).trim();
  if (!leadsEmailNote || /<<|>>/.test(leadsEmailNote)) {
    blockers.push(
      'PUBLIC_LEADS_EMAIL_PROVIDER_NOTE is unset or contains <<EMAIL_PROVIDER_AND_COUNTRY>> / <<...>> placeholders',
    );
  }

  blockers.push(...legalPagePlaceholders);

  if (blockers.length > 0) {
    throw new Error(
      `Refusing build with PUBLIC_LEADS_ENABLED=true:\n  - ${blockers.join('\n  - ')}`,
    );
  }
}

if (alertsEnabled) {
  const blockers = [];

  for (const slug of legalSlugs) {
    const entry = parsedBySlug.get(slug);
    if (entry.fm.legalReviewed !== true) {
      blockers.push(`${slug}.mdx has legalReviewed=${entry.fm.legalReviewed} (lawyer review required)`);
    }
  }

  if (privacyEntry.fm.alertsLegalReviewed !== true) {
    blockers.push(
      `privacy.mdx has alertsLegalReviewed=${Boolean(privacyEntry.fm.alertsLegalReviewed)} (lawyer sign-off on the Email alerts privacy section required)`,
    );
  }

  if (electionPending) {
    blockers.push(
      `rule-status.json has electionWatch.status="${ewStatus}" (post-election re-check must complete before enabling PUBLIC_ALERTS_ENABLED=true)`,
    );
  }

  const serverCountry = (
    process.env.PUBLIC_SERVER_COUNTRY ??
    process.env.SERVER_COUNTRY ??
    'Malaysia'
  ).trim();
  if (!serverCountry || /<<|>>/.test(serverCountry)) {
    blockers.push(
      'PUBLIC_SERVER_COUNTRY is unset or contains <<SERVER_COUNTRY>> / <<...>> placeholders',
    );
  }

  const provider = (
    process.env.PUBLIC_ALERTS_PROVIDER ??
    'Hostinger Mail (Hostinger International Ltd)'
  ).trim();
  const overseasNote = (
    process.env.PUBLIC_ALERTS_OVERSEAS_NOTE ??
    '; it stores mail in France and Germany'
  ).trim();
  if (!provider || /<<|>>/.test(provider)) {
    blockers.push('PUBLIC_ALERTS_PROVIDER is unset or contains unresolved <<...>> placeholders');
  }
  if (!overseasNote || /<<|>>/.test(overseasNote)) {
    blockers.push(
      'PUBLIC_ALERTS_OVERSEAS_NOTE is unset or contains unresolved <<...>> placeholders (set for example "; it stores mail in France and Germany", or "none")',
    );
  } else if (/outside\s+australia/i.test(overseasNote)) {
    blockers.push(
      'PUBLIC_ALERTS_OVERSEAS_NOTE must name specific countries (for example "; it stores mail in France and Germany", or "none"), not a vague "outside Australia"',
    );
  }

  let defaultAlertsSenderAddress = '';
  if (fs.existsSync(apiAlertsConfigPath)) {
    const apiAlertsRaw = fs.readFileSync(apiAlertsConfigPath, 'utf8');
    const addrMatch = apiAlertsRaw.match(
      /postalOrContactAddress:\s*env\.ALERTS_SENDER_ADDRESS\s*\?\?\s*(['"`])([^'"`]*)\1/,
    );
    if (addrMatch) {
      defaultAlertsSenderAddress = addrMatch[2];
    }
  }
  const alertsSenderAddress = (
    process.env.ALERTS_SENDER_ADDRESS ?? defaultAlertsSenderAddress
  ).trim();
  if (!alertsSenderAddress || /<<|>>/.test(alertsSenderAddress)) {
    blockers.push(
      'ALERTS_SENDER_ADDRESS is unset or still holds <<ALERTS_SENDER_ADDRESS>> in api/src/alerts/config.ts (supply a PO box or registered office before enabling PUBLIC_ALERTS_ENABLED=true)',
    );
  }

  blockers.push(...legalPagePlaceholders);

  if (blockers.length > 0) {
    throw new Error(
      `Refusing build with PUBLIC_ALERTS_ENABLED=true:\n  - ${blockers.join('\n  - ')}`,
    );
  }
}

// Prompt 32 author-page & signed-reviewer publishing gates:
// Missing bio MUST NOT block a normal site deploy — it ONLY blocks publishing the author page itself
// (or emitting Person / author links / unsigned reviewers into public output).
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const peopleBlockers = [];

const author = people?.['gurinder-singh'];
const bioReady =
  Boolean(author) &&
  typeof author.bio === 'string' &&
  author.bio.trim().length > 0 &&
  !hasPlaceholder(author.bio);

const authorMdxPath = path.join(pagesDir, 'about-gurinder-singh.mdx');
const authorMdxRaw = fs.existsSync(authorMdxPath) ? fs.readFileSync(authorMdxPath, 'utf8') : '';
const authorFmMatch = authorMdxRaw.match(/^---\n([\s\S]*?)\n---/);
const authorFm = authorFmMatch ? YAML.parse(authorFmMatch[1]) : { noindex: true };
const attemptingAuthorPagePublish = authorPublishEnv || authorFm.noindex === false;

if (attemptingAuthorPagePublish) {
  if (!author || typeof author !== 'object') {
    peopleBlockers.push('people.json is missing the "gurinder-singh" author object');
  } else {
    if (typeof author.name !== 'string' || !author.name.trim() || hasPlaceholder(author.name)) {
      peopleBlockers.push(
        'people.json["gurinder-singh"].name is missing or holds a <<...>> placeholder',
      );
    }
    if (typeof author.role !== 'string' || !author.role.trim() || hasPlaceholder(author.role)) {
      peopleBlockers.push(
        'people.json["gurinder-singh"].role is missing or holds a <<...>> placeholder',
      );
    }
    if (!bioReady) {
      peopleBlockers.push(
        'Refusing to publish /about/gurinder-singh/: people.json["gurinder-singh"].bio is missing or holds a <<...>> placeholder (keep noindex: true in about-gurinder-singh.mdx and PUBLIC_AUTHOR_LIVE unset until Guri supplies his bio)',
      );
    } else {
      if (author.credentials !== undefined && hasPlaceholder(author.credentials)) {
        peopleBlockers.push(
          'people.json["gurinder-singh"].credentials still holds a <<...>> placeholder; supply credentials or remove the field before publishing /about/gurinder-singh/',
        );
      }
      if (author.image !== undefined && hasPlaceholder(author.image)) {
        peopleBlockers.push(
          'people.json["gurinder-singh"].image still holds a <<...>> placeholder; supply a photo path or remove the field before publishing /about/gurinder-singh/',
        );
      }
      if (Array.isArray(author.sameAs) && hasPlaceholder(author.sameAs)) {
        peopleBlockers.push(
          'people.json["gurinder-singh"].sameAs still holds a <<...>> placeholder; supply profile URLs or set sameAs to [] before publishing /about/gurinder-singh/',
        );
      }
    }
  }
}

if (!Array.isArray(people?.reviewers)) {
  peopleBlockers.push('people.json.reviewers must be an array');
} else {
  people.reviewers.forEach((rev, idx) => {
    if (hasPlaceholder(rev)) {
      peopleBlockers.push(
        `people.json.reviewers[${idx}] contains <<...>> placeholder values; keep reviewers: [] until a real reviewer signs in writing`,
      );
    } else if (!isValidSignedReviewer(rev)) {
      peopleBlockers.push(
        `people.json.reviewers[${idx}] is missing required signed reviewer fields (id, name, licence.type, licence.number, scope[], boolean paidInstaller, YYYY-MM-DD agreementSignedOn, reviewedPages[])`,
      );
    }
  });
}

if (fs.existsSync(distDir)) {
  const authorHtmlPath = path.join(distDir, 'about/gurinder-singh/index.html');
  const sitemapPath = path.join(distDir, 'sitemap-0.xml');
  const llmsPath = path.join(distDir, 'llms.txt');

  if (!bioReady) {
    if (fs.existsSync(authorHtmlPath)) {
      peopleBlockers.push(
        'Refusing to publish /about/gurinder-singh/ in dist/ while people.json["gurinder-singh"].bio is unfilled',
      );
    }
    if (fs.existsSync(sitemapPath)) {
      const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
      if (sitemapXml.includes('/about/gurinder-singh/')) {
        peopleBlockers.push(
          'Refusing build: sitemap-0.xml lists /about/gurinder-singh/ while bio is unfilled',
        );
      }
    }
    if (fs.existsSync(llmsPath)) {
      const llmsTxt = fs.readFileSync(llmsPath, 'utf8');
      if (llmsTxt.includes('/about/gurinder-singh/')) {
        peopleBlockers.push(
          'Refusing build: llms.txt lists /about/gurinder-singh/ while bio is unfilled',
        );
      }
    }
  }

  for (const htmlFile of walkHtml(distDir)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const rel = path.relative(siteRoot, htmlFile);
    if (!bioReady) {
      if (html.includes('#person-gurinder-singh') || html.includes('/about/gurinder-singh/')) {
        peopleBlockers.push(
          `${rel} outputs #person-gurinder-singh or /about/gurinder-singh/ while bio is unfilled`,
        );
      }
    }
    if (Array.isArray(people?.reviewers) && people.reviewers.length === 0) {
      if (html.includes('data-reviewed-by') || html.includes('"reviewedBy"')) {
        peopleBlockers.push(
          `${rel} renders reviewedBy / data-reviewed-by while people.json.reviewers is empty`,
        );
      }
    }
  }
}

if (peopleBlockers.length > 0) {
  throw new Error(
    `Refusing build (author page / reviewer publishing check failed):\n  - ${peopleBlockers.join('\n  - ')}`,
  );
}

console.log(
  `check-legal: OK (PUBLIC_LEADS_ENABLED=${leadsEnabled}, PUBLIC_ALERTS_ENABLED=${alertsEnabled}, productionBuild=${productionBuild}, authorPagePublished=${attemptingAuthorPagePublish && bioReady}, signedReviewers=${people.reviewers.length}).`,
);
