import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const allowListPath = path.join(__dirname, 'text-allow.json');

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run astro build first.');
}

const rawAllow = JSON.parse(fs.readFileSync(allowListPath, 'utf8'));
if (!Array.isArray(rawAllow)) {
  throw new Error('scripts/text-allow.json must be a JSON array');
}
for (const entry of rawAllow) {
  if (
    !entry ||
    typeof entry.phrase !== 'string' ||
    !entry.phrase.trim() ||
    typeof entry.reason !== 'string' ||
    !entry.reason.trim()
  ) {
    throw new Error(
      'Every entry in scripts/text-allow.json must have non-empty "phrase" and "reason" strings.',
    );
  }
}

function isAllowedDoubledWord(phrase, pageUrl) {
  const lower = phrase.toLowerCase();
  return rawAllow.some(
    (entry) =>
      entry.phrase.toLowerCase() === lower && (!entry.page || entry.page === pageUrl),
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

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function htmlRelToUrl(rel) {
  const posix = rel.replace(/\\/g, '/');
  if (posix === '404.html') return '/404.html';
  if (posix === 'index.html') return '/';
  return `/${posix.replace(/\/index\.html$/, '')}/`;
}

function normalizeHrefPath(rawPath) {
  if (!rawPath) return null;
  if (rawPath === '/404.html') return '/404.html';
  if (/\.(xml|txt|svg|ico|css|js|pdf|png|jpg|jpeg|webp)$/i.test(rawPath)) return rawPath;
  return rawPath.endsWith('/') ? rawPath : `${rawPath}/`;
}

const RAW_PATH_RE =
  /(\/(victoria|about|faq|how-quotes-work|sources|privacy|terms|nsw|solar-battery)\/[a-z0-9\-\/#]*)/g;
const DOUBLED_WORD_RE = /\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi;
const TOKEN_RE = /\[\[|\]\]|\{\{|\}\}|<<|\b(?:undefined|NaN|null)\b/g;
const BLOCK_SPLIT_RE =
  /<\/?(?:p|li|h[1-6]|figcaption|caption|td|th|dt|dd|blockquote|summary|label|legend|button|option|select|div|section|article|aside|nav|header|footer|figure|table|thead|tbody|tfoot|tr|ul|ol|dl|form|fieldset|noscript)\b[^>]*>/gi;

const htmlFiles = walkHtml(distDir).sort();
if (htmlFiles.length === 0) {
  throw new Error('No HTML files found in dist/.');
}

let rawPaths = 0;
let doubledWords = 0;
let selfLinks = 0;
let tokens = 0;
const errors = [];

const isDraftLegalBuild =
  process.env.PUBLIC_LEADS_ENABLED !== 'true' &&
  process.env.PUBLIC_ALERTS_ENABLED !== 'true' &&
  !(process.env.RELEASE_ID && process.env.RELEASE_ID.trim());

function stripAllowedDraftLegalPlaceholders(str, pageUrl) {
  if (!isDraftLegalBuild || (pageUrl !== '/privacy/' && pageUrl !== '/terms/')) {
    return str;
  }
  return str
    .replace(/<<[A-Z0-9_]+>>/g, 'DRAFT_LEGAL_PLACEHOLDER')
    .replace(/&lt;&lt;[A-Z0-9_]+&gt;&gt;/g, 'DRAFT_LEGAL_PLACEHOLDER');
}

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file);
  const pageUrl = htmlRelToUrl(rel);
  const html = fs.readFileSync(file, 'utf8');

  // 0. Full-document placeholder guard (HTML head/body/attributes and JSON-LD scripts)
  // Draft legal placeholders (<<SERVER_COUNTRY>> etc.) are allowed ONLY on /privacy/ and /terms/
  // when leads/alerts flags and RELEASE_ID are unset; check-legal.mjs blocks live/production builds.
  const htmlForPlaceholderScan = stripAllowedDraftLegalPlaceholders(html, pageUrl);
  for (const m of htmlForPlaceholderScan.matchAll(/<<[^>]*>>|<<|&lt;&lt;/g)) {
    tokens++;
    errors.push(`${pageUrl}: unresolved placeholder "${m[0]}" in built HTML or JSON-LD`);
  }

  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    errors.push(`${pageUrl}: missing <main> element`);
    continue;
  }

  const mainHtml = mainMatch[1]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');

  // 1. Self-links in <main> (fragments #... are allowed)
  for (const m of mainHtml.matchAll(/<a\b[^>]*\bhref=(?:"([^"]+)"|'([^']+)')/gi)) {
    const href = decodeEntities(m[1] ?? m[2] ?? '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    let pathAndHash = null;
    if (href.startsWith('https://householdrebates.com.au') || href.startsWith('http://householdrebates.com.au')) {
      const u = new URL(href);
      pathAndHash = `${u.pathname}${u.hash}`;
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      pathAndHash = href;
    }
    if (!pathAndHash) continue;

    const [beforeHash, hashPart] = pathAndHash.split('#');
    const cleanPath = normalizeHrefPath(beforeHash.split('?')[0]);
    if (cleanPath === pageUrl && !hashPart) {
      selfLinks++;
      errors.push(`${pageUrl}: self-link in <main>: href="${href}"`);
    }
  }

  // 2. Visible text per block element inside <main> (excluding <code>)
  const mainWithoutCode = mainHtml.replace(/<code\b[\s\S]*?<\/code>/gi, ' ');
  const chunks = mainWithoutCode.split(BLOCK_SPLIT_RE);

  for (const chunk of chunks) {
    const text = decodeEntities(chunk.replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    for (const m of text.matchAll(RAW_PATH_RE)) {
      rawPaths++;
      errors.push(`${pageUrl}: raw path "${m[0]}" in visible text: "${text.slice(0, 140)}"`);
    }

    for (const m of text.matchAll(DOUBLED_WORD_RE)) {
      if (!isAllowedDoubledWord(m[0], pageUrl)) {
        doubledWords++;
        errors.push(`${pageUrl}: doubled words "${m[0]}" in element: "${text.slice(0, 140)}"`);
      }
    }

    for (const qual of ['including GST', 'at least']) {
      const qualRe = new RegExp(qual, 'gi');
      const matches = [...text.matchAll(qualRe)];
      for (let i = 0; i + 1 < matches.length; i++) {
        const dist = matches[i + 1].index - matches[i].index;
        if (dist <= 120) {
          doubledWords++;
          errors.push(
            `${pageUrl}: doubled qualifier "${qual}" (${dist} chars apart <= 120) in element: "${text.slice(0, 160)}"`,
          );
        }
      }
    }

    const textForTokenScan = stripAllowedDraftLegalPlaceholders(text, pageUrl);
    for (const m of textForTokenScan.matchAll(TOKEN_RE)) {
      tokens++;
      errors.push(`${pageUrl}: placeholder token "${m[0]}" in visible text: "${text.slice(0, 140)}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(
    `check-text FAILED (${htmlFiles.length} pages, ${rawPaths} raw paths, ${doubledWords} doubled words, ${selfLinks} self-links, ${tokens} tokens):`,
  );
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `check-text: ${htmlFiles.length} pages, ${rawPaths} raw paths, ${doubledWords} doubled words, ${selfLinks} self-links, ${tokens} tokens`,
);
