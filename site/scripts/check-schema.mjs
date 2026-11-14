import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const peoplePath = path.join(siteRoot, 'src/data/people.json');

const ALLOWED_TYPES = new Set([
  'Organization',
  'PropertyValue',
  'WebSite',
  'BreadcrumbList',
  'ListItem',
  'FAQPage',
  'Question',
  'Answer',
  'HowTo',
  'HowToStep',
  'Article',
  'WebPage',
  'ProfilePage',
  'Person',
  'WebApplication',
]);

const BANNED_TYPES = new Set([
  'LocalBusiness',
  'Offer',
  'PriceSpecification',
  'Product',
  'GovernmentService',
  'AggregateRating',
]);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function hasPlaceholder(val) {
  if (typeof val === 'string') return /<<|>>/.test(val);
  if (Array.isArray(val)) return val.some(hasPlaceholder);
  if (val && typeof val === 'object') return Object.values(val).some(hasPlaceholder);
  return false;
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

function ensureSlash(u) {
  if (!u || u === '/') return '/';
  return u.endsWith('/') ? u : `${u}/`;
}

function htmlRelToPathname(rel) {
  const norm = rel.split(path.sep).join('/');
  if (norm === 'index.html') return '/';
  if (norm.endsWith('/index.html')) {
    return `/${norm.slice(0, -'index.html'.length)}`;
  }
  return `/${norm}`;
}

const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const validReviewers = (Array.isArray(people.reviewers) ? people.reviewers : []).filter(
  isValidSignedReviewer,
);

function signedReviewerIdsForPathname(pathname) {
  const clean = ensureSlash(pathname);
  const ids = new Set();
  for (const rev of validReviewers) {
    for (const rp of rev.reviewedPages) {
      if (ensureSlash(rp.url) === clean) {
        ids.add(`https://householdrebates.com.au/#reviewer-${rev.id.trim()}`);
      }
    }
  }
  return ids;
}

function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walkHtml(path.join(dir, e.name))
      : e.name.endsWith('.html')
        ? [path.join(dir, e.name)]
        : [],
  );
}

function checkNode(node, rel, validReviewerIds) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) checkNode(item, rel, validReviewerIds);
    return;
  }
  const t = node['@type'];
  if (typeof t === 'string') {
    if (BANNED_TYPES.has(t) || !ALLOWED_TYPES.has(t)) {
      throw new Error(`${rel}: disallowed JSON-LD @type "${t}"`);
    }
  }
  if ('offers' in node) {
    throw new Error(`${rel}: JSON-LD must never include an "offers" property`);
  }
  if (node.estimatedCost !== undefined || node.totalTime !== undefined) {
    throw new Error(`${rel}: HowTo must not include estimatedCost or totalTime`);
  }
  if ('reviewedBy' in node) {
    if (t !== 'WebPage' && t !== 'ProfilePage') {
      throw new Error(
        `${rel}: "reviewedBy" is only permitted on WebPage or ProfilePage (found on @type "${t}")`,
      );
    }
    const rawRefs = Array.isArray(node.reviewedBy) ? node.reviewedBy : [node.reviewedBy];
    if (rawRefs.length === 0) {
      throw new Error(`${rel}: "reviewedBy" must not be empty`);
    }
    for (const ref of rawRefs) {
      const refId = ref && typeof ref === 'object' ? ref['@id'] : undefined;
      if (typeof refId !== 'string' || !validReviewerIds.has(refId)) {
        throw new Error(
          `${rel}: JSON-LD "reviewedBy" (${JSON.stringify(ref)}) has no matching signed reviewer for this URL in people.json`,
        );
      }
    }
  }
  for (const v of Object.values(node)) {
    checkNode(v, rel, validReviewerIds);
  }
}

const files = walkHtml(distDir).sort();
for (const file of files) {
  const rel = path.relative(distDir, file);
  const pathname = htmlRelToPathname(rel);
  const validReviewerIds = signedReviewerIdsForPathname(pathname);
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const m of scripts) {
    const raw = m[1];
    if (/\$\s?\d/.test(raw) || /\bAUD\b/.test(raw)) {
      throw new Error(`${rel}: currency or AUD price found in JSON-LD`);
    }
    if (/<<|>>/.test(raw)) {
      throw new Error(`${rel}: unresolved <<...>> placeholder found in JSON-LD`);
    }
    const parsed = JSON.parse(raw);
    checkNode(parsed, rel, validReviewerIds);
  }
}

console.log(
  `check-schema: 0 errors (${files.length} HTML files verified; 0 banned types, 0 currency, 0 offers, 0 unsigned reviewedBy, 0 placeholders).`,
);
