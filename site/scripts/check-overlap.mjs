import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const allowListPath = path.join(__dirname, 'overlap-allow.json');
const outputJsonPath = path.join(distDir, '_overlap.json');

// Both Jaccard (>= 0.25) and Containment (>= 0.25) are hard build gates (promoted in Prompt 39
// after rescoping /victoria/melbourne/ to the 52 inner-Melbourne postcodes).
const MAX_OVERLAP = 0.25;
const SHINGLE_SIZE = 6;
const BOILERPLATE_DOC_FREQ_RATIO = 0.3;

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run astro build first.');
}

const rawAllow = JSON.parse(fs.readFileSync(allowListPath, 'utf8'));
if (!Array.isArray(rawAllow)) {
  throw new Error('scripts/overlap-allow.json must be a JSON array.');
}
for (const entry of rawAllow) {
  if (
    !entry ||
    typeof entry.a !== 'string' ||
    !entry.a.trim() ||
    typeof entry.b !== 'string' ||
    !entry.b.trim() ||
    typeof entry.reason !== 'string' ||
    !entry.reason.trim() ||
    typeof entry.initials !== 'string' ||
    entry.initials.trim() !== 'GS'
  ) {
    throw new Error(
      'Every entry in scripts/overlap-allow.json must include "a", "b", non-empty "reason", and Guri\'s initials ("initials": "GS").',
    );
  }
}

function isAllowListed(a, b) {
  return rawAllow.some(
    (entry) => (entry.a === a && entry.b === b) || (entry.a === b && entry.b === a),
  );
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

function htmlRelToUrl(rel) {
  const posix = rel.replace(/\\/g, '/');
  if (posix === '404.html') return '/404.html';
  if (posix === 'index.html') return '/';
  return `/${posix.replace(/\/index\.html$/, '')}/`;
}

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripBalancedAttrSection(html, tagName, attrRegex) {
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  let out = '';
  let cursor = 0;
  while (cursor < html.length) {
    openRe.lastIndex = cursor;
    const m = openRe.exec(html);
    if (!m) {
      out += html.slice(cursor);
      break;
    }
    const start = m.index;
    const openTag = m[0];
    if (!attrRegex.test(openTag)) {
      out += html.slice(cursor, start + openTag.length);
      cursor = start + openTag.length;
      continue;
    }
    out += html.slice(cursor, start);
    let depth = 1;
    let pos = start + openTag.length;
    const tokenRe = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
    while (depth > 0 && pos < html.length) {
      tokenRe.lastIndex = pos;
      const tm = tokenRe.exec(html);
      if (!tm) {
        pos = html.length;
        break;
      }
      if (tm[0].startsWith('</')) {
        depth--;
      } else if (!tm[0].endsWith('/>')) {
        depth++;
      }
      pos = tm.index + tm[0].length;
    }
    cursor = pos;
  }
  return out;
}

function extractMainWords(html, pageUrl) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    throw new Error(`${pageUrl}: missing <main> element`);
  }
  let inner = mainMatch[1]
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ');

  // Exclude generated VEU postcode table so area/hub prose carries local facts on its own
  inner = stripBalancedAttrSection(inner, 'section', /\bdata-postcode-table\b/i);

  const plain = decodeEntities(inner.replace(/<[^>]+>/g, ' '))
    .replace(/[’‘]/g, "'")
    .toLowerCase();

  return plain.match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) ?? [];
}

function buildShingles(words, k) {
  const set = new Set();
  for (let i = 0; i + k <= words.length; i++) {
    set.add(words.slice(i, i + k).join(' '));
  }
  return set;
}

const htmlFiles = walkHtml(distDir);
const rawPages = [];

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file);
  const url = htmlRelToUrl(rel);
  const html = fs.readFileSync(file, 'utf8');
  if (/meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
    continue;
  }
  const words = extractMainWords(html, url);
  rawPages.push({ url, rawShingles: buildShingles(words, SHINGLE_SIZE) });
}

rawPages.sort((a, b) => a.url.localeCompare(b.url));
const pageCount = rawPages.length;
if (pageCount < 2) {
  throw new Error(`Expected at least 2 indexable pages in dist/, got ${pageCount}`);
}

const docFreq = new Map();
for (const p of rawPages) {
  for (const sh of p.rawShingles) {
    docFreq.set(sh, (docFreq.get(sh) ?? 0) + 1);
  }
}

const maxAllowedDf = pageCount * BOILERPLATE_DOC_FREQ_RATIO;
const pages = rawPages.map((p) => {
  const filtered = new Set();
  for (const sh of p.rawShingles) {
    if ((docFreq.get(sh) ?? 0) <= maxAllowedDf) {
      filtered.add(sh);
    }
  }
  return { url: p.url, shingles: filtered };
});

const pairs = [];
let allowUsed = 0;
const failures = [];

for (let i = 0; i < pages.length; i++) {
  const pA = pages[i];
  for (let j = i + 1; j < pages.length; j++) {
    const pB = pages[j];
    const [smaller, larger] =
      pA.shingles.size <= pB.shingles.size
        ? [pA.shingles, pB.shingles]
        : [pB.shingles, pA.shingles];
    let inter = 0;
    for (const sh of smaller) {
      if (larger.has(sh)) inter++;
    }
    const union = pA.shingles.size + pB.shingles.size - inter;
    const minLen = Math.min(pA.shingles.size, pB.shingles.size);
    const jaccard = union === 0 ? 0 : Number((inter / union).toFixed(4));
    const containment = minLen === 0 ? 0 : Number((inter / minLen).toFixed(4));
    const allowed = isAllowListed(pA.url, pB.url);
    if (allowed) allowUsed++;

    const record = {
      a: pA.url,
      b: pB.url,
      jaccard,
      containment,
      sharedShingles: inter,
      shinglesA: pA.shingles.size,
      shinglesB: pB.shingles.size,
    };
    pairs.push(record);

    if (!allowed && (record.jaccard >= MAX_OVERLAP || record.containment >= MAX_OVERLAP)) {
      failures.push(record);
    }
  }
}

pairs.sort(
  (x, y) =>
    y.jaccard - x.jaccard ||
    y.containment - x.containment ||
    x.a.localeCompare(y.a) ||
    x.b.localeCompare(y.b),
);

fs.writeFileSync(outputJsonPath, JSON.stringify(pairs, null, 2) + '\n', 'utf8');

console.log('Top 10 page pairs by 6-word shingle Jaccard (after >30% boilerplate filter):');
for (const [idx, p] of pairs.slice(0, 10).entries()) {
  const jPct = (p.jaccard * 100).toFixed(1);
  const cPct = (p.containment * 100).toFixed(1);
  console.log(
    `  ${String(idx + 1).padStart(2, ' ')}. ${p.a} <-> ${p.b} | Jaccard ${jPct}% (${p.jaccard.toFixed(4)}) | Containment ${cPct}% (${p.containment.toFixed(4)})`,
  );
}

if (failures.length > 0) {
  console.error(
    `check-overlap FAILED: ${failures.length} pair(s) have Jaccard >= ${MAX_OVERLAP} or Containment >= ${MAX_OVERLAP}:`,
  );
  for (const f of failures) {
    console.error(
      `  - ${f.a} <-> ${f.b}: jaccard=${f.jaccard.toFixed(4)}, containment=${f.containment.toFixed(4)}`,
    );
  }
  process.exit(1);
}

const nonAllowed = pairs.filter((p) => !isAllowListed(p.a, p.b));
const maxJaccardPair = nonAllowed[0] ?? pairs[0];
const maxContainmentPair =
  [...nonAllowed].sort(
    (x, y) => y.containment - x.containment || y.jaccard - x.jaccard,
  )[0] ?? pairs[0];
console.log(
  `check-overlap: ${pageCount} pages, max Jaccard ${maxJaccardPair.jaccard.toFixed(4)} (${maxJaccardPair.a} <-> ${maxJaccardPair.b}), max Containment ${maxContainmentPair.containment.toFixed(4)} (${maxContainmentPair.a} <-> ${maxContainmentPair.b}), ${allowUsed} allow-listed`,
);
