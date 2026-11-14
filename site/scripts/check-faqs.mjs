import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');
const distDir = path.join(siteRoot, 'dist');
const faqsDir = path.join(srcDir, 'content/faqs');

const maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const now = new Date();
const melbIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);
const [mY, mM, mD] = melbIso.split('-').map(Number);
const todayMelbUtc = Date.UTC(mY, mM - 1, mD);

function ageDaysMelbourne(checkedOn) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(checkedOn || '').trim());
  if (!m) {
    throw new Error(`Invalid checkedOn date "${checkedOn}"`);
  }
  const checkedUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor((todayMelbUtc - checkedUtc) / (1000 * 60 * 60 * 24));
}

function parseRowRange(spec) {
  const out = new Set();
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      for (let i = Number(m[1]); i <= Number(m[2]); i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      out.add(Number(part));
    }
  }
  return out;
}

const rollout = JSON.parse(fs.readFileSync(path.join(srcDir, 'data/rollout.json'), 'utf8'));
const urlMap = JSON.parse(fs.readFileSync(path.join(srcDir, 'data/url-map.json'), 'utf8'));
const rawEnabledRows = parseRowRange(rollout.enabledRows);
const gatedApproved = new Set(rollout.gatedApproved ?? []);
const enabledUrls = new Set();
for (const row of urlMap) {
  if (!rawEnabledRows.has(row.row)) continue;
  if (row.gated && !gatedApproved.has(row.row) && !gatedApproved.has(row.url)) continue;
  enabledUrls.add(row.url);
}

function walkFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walkFiles(path.join(dir, e.name), ext)
      : e.name.endsWith(ext)
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
  return String(str ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function normalizeWhitespace(str) {
  return decodeEntities(str).replace(/\s+/g, ' ').trim();
}

function stripMarkdownLinks(answer) {
  return answer.replace(/\[([^\[\]\n]+)\]\(([^)\s]+)\)/g, '$1');
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run astro build first.');
}

const CANONICAL_URL_RE = /^\/(?:[a-z0-9-]+\/)*$/;
const LEGAL_TRUST_NO_FAQ_URLS = new Set(['/about/', '/privacy/', '/sources/', '/terms/']);

// 1. Validate all src/content/faqs/*.yaml files
const faqFiles = walkFiles(faqsDir, '.yaml').sort();
const faqsById = new Map();
let dollarAnswers = 0;
const errors = [];

for (const file of faqFiles) {
  const id = path.basename(file, '.yaml');
  const data = YAML.parse(fs.readFileSync(file, 'utf8'));

  if ('pages' in data) {
    errors.push(`faqs/${id}.yaml: legacy "pages" field is disallowed; use "canonicalPage" and optional "alsoLinkFrom"`);
  }
  if (!data.canonicalPage || !CANONICAL_URL_RE.test(data.canonicalPage)) {
    errors.push(`faqs/${id}.yaml: invalid or missing canonicalPage "${data.canonicalPage}"`);
  }
  const alsoLinkFrom = data.alsoLinkFrom ?? [];
  if (!Array.isArray(alsoLinkFrom)) {
    errors.push(`faqs/${id}.yaml: alsoLinkFrom must be an array`);
  } else {
    for (const linkUrl of alsoLinkFrom) {
      if (!CANONICAL_URL_RE.test(linkUrl)) {
        errors.push(`faqs/${id}.yaml: invalid URL "${linkUrl}" in alsoLinkFrom`);
      }
      if (linkUrl === data.canonicalPage) {
        errors.push(`faqs/${id}.yaml: alsoLinkFrom must not contain canonicalPage "${data.canonicalPage}"`);
      }
    }
  }

  const age = ageDaysMelbourne(data.checkedOn);
  if (age > maxAgeDays || age < -1) {
    errors.push(`faqs/${id}.yaml: checkedOn "${data.checkedOn}" out of 45-day range (age=${age}d)`);
  }

  if (String(data.answer ?? '').includes('$') || String(data.question ?? '').includes('$')) {
    dollarAnswers++;
    errors.push(`faqs/${id}.yaml: "$" found in FAQ question or answer`);
  }

  faqsById.set(id, {
    id,
    question: normalizeWhitespace(data.question),
    plainAnswer: normalizeWhitespace(stripMarkdownLinks(String(data.answer ?? ''))),
    canonicalPage: data.canonicalPage,
    alsoLinkFrom: Array.isArray(alsoLinkFrom) ? alsoLinkFrom : [],
    enabled: enabledUrls.has(data.canonicalPage),
  });
}

// 2. Check MDX frontmatter faq lists match canonicalPage assignments
const mdxFiles = walkFiles(path.join(srcDir, 'content'), '.mdx').sort();
const mdxFaqUsage = new Map();
for (const file of mdxFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  const fm = YAML.parse(fmMatch[1]);
  const col = file.includes('/guides/') ? 'guides' : file.includes('/areas/') ? 'areas' : 'pages';
  const pageUrl =
    col === 'guides' || col === 'areas'
      ? `/victoria/${fm.slug}/`
      : fm.slug === 'home'
        ? '/'
        : fm.slug === 'victoria'
          ? '/victoria/'
          : fm.state === 'vic' && fm.section === 'tools'
            ? `/victoria/${fm.slug}/`
            : `/${fm.slug}/`;

  const refs = fm.faq ?? [];
  for (const ref of refs) {
    const f = faqsById.get(ref);
    if (!f) {
      errors.push(`${pageUrl}: frontmatter references unknown FAQ "${ref}"`);
      continue;
    }
    if (f.canonicalPage !== pageUrl) {
      errors.push(
        `${pageUrl}: frontmatter lists FAQ "${ref}" whose canonicalPage is "${f.canonicalPage}"`,
      );
    }
    const list = mdxFaqUsage.get(ref) ?? [];
    list.push(pageUrl);
    mdxFaqUsage.set(ref, list);
  }
}

for (const [id, f] of faqsById) {
  const usedOn = mdxFaqUsage.get(id) ?? [];
  if (usedOn.length !== 1 || usedOn[0] !== f.canonicalPage) {
    errors.push(
      `faqs/${id}.yaml: expected in frontmatter of "${f.canonicalPage}" only, found in [${usedOn.join(', ')}]`,
    );
  }
}

// 3. Inspect built HTML files in dist/
const htmlFiles = walkFiles(distDir, '.html').sort();
const htmlByUrl = new Map();
const schemaFaqPlacements = new Map(); // faqId -> [pageUrl]
const questionToSchemaPages = new Map(); // question text -> [pageUrl]
let outsideRange = 0;

function extractFaqEntitiesFromJsonLd(parsed) {
  const out = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
      for (const q of node.mainEntity) {
        out.push({
          question: normalizeWhitespace(q?.name ?? ''),
          answer: normalizeWhitespace(q?.acceptedAnswer?.text ?? ''),
        });
      }
    }
    for (const v of Object.values(node)) visit(v);
  }
  visit(parsed);
  return out;
}

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file);
  const pageUrl = htmlRelToUrl(rel);
  const html = fs.readFileSync(file, 'utf8');
  htmlByUrl.set(pageUrl, html);

  const isNoindex = /meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

  // Extract JSON-LD FAQPage entities
  const schemaFaqs = [];
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const parsed = JSON.parse(m[1]);
    schemaFaqs.push(...extractFaqEntitiesFromJsonLd(parsed));
  }

  for (const sf of schemaFaqs) {
    if (sf.answer.includes('$') || sf.question.includes('$')) {
      dollarAnswers++;
      errors.push(`${pageUrl}: "$" found in FAQPage JSON-LD question or answer`);
    }
    const qPages = questionToSchemaPages.get(sf.question) ?? [];
    qPages.push(pageUrl);
    questionToSchemaPages.set(sf.question, qPages);
  }

  // Extract visible canonical FAQ blocks: <div class="faq-item" id="faq-<id>" data-faq-canonical="<id>">
  const visibleFaqs = [];
  for (const m of html.matchAll(
    /<div\b[^>]*\bclass="faq-item"[^>]*\bid="faq-([a-z0-9-]+)"[^>]*\bdata-faq-canonical="\1"[^>]*>([\s\S]*?)<\/div>/gi,
  )) {
    const faqId = m[1];
    const inner = m[2];
    const h3Match = inner.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
    const pMatch = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const visQ = normalizeWhitespace((h3Match?.[1] ?? '').replace(/<[^>]+>/g, ''));
    const visA = normalizeWhitespace((pMatch?.[1] ?? '').replace(/<[^>]+>/g, ''));
    if (visA.includes('$') || visQ.includes('$')) {
      dollarAnswers++;
      errors.push(`${pageUrl}: "$" found in visible FAQ #faq-${faqId}`);
    }
    visibleFaqs.push({ id: faqId, question: visQ, answer: visA });
  }

  // Check 3-5 canonical FAQs rule on every non-noindex, non-legal page (and any page with a FAQ)
  const expectsFaq = !isNoindex && !LEGAL_TRUST_NO_FAQ_URLS.has(pageUrl);
  if (expectsFaq || visibleFaqs.length > 0 || schemaFaqs.length > 0) {
    if (visibleFaqs.length < 3 || visibleFaqs.length > 5) {
      outsideRange++;
      errors.push(
        `${pageUrl}: expected 3–5 canonical FAQs, found ${visibleFaqs.length} visible and ${schemaFaqs.length} in FAQPage`,
      );
    }
  }

  // Verify 1-to-1 match between visible canonical FAQs and FAQPage JSON-LD on this page
  if (visibleFaqs.length !== schemaFaqs.length) {
    errors.push(
      `${pageUrl}: mismatch between visible canonical FAQs (${visibleFaqs.length}) and FAQPage JSON-LD (${schemaFaqs.length})`,
    );
  } else {
    for (let i = 0; i < visibleFaqs.length; i++) {
      const vf = visibleFaqs[i];
      const sf = schemaFaqs[i];
      if (vf.question !== sf.question) {
        errors.push(
          `${pageUrl}: FAQ #${i + 1} (${vf.id}) visible question "${vf.question}" !== FAQPage question "${sf.question}"`,
        );
      }
      if (vf.answer !== sf.answer) {
        errors.push(
          `${pageUrl}: FAQ #${i + 1} (${vf.id}) visible answer does not match FAQPage acceptedAnswer.text`,
        );
      }
      const list = schemaFaqPlacements.get(vf.id) ?? [];
      list.push(pageUrl);
      schemaFaqPlacements.set(vf.id, list);
    }
  }
}

// 4. Verify each enabled FAQ appears in exactly 1 built FAQPage, and no question repeats across FAQPages
const enabledFaqs = [...faqsById.values()].filter((f) => f.enabled);
for (const f of enabledFaqs) {
  const placements = schemaFaqPlacements.get(f.id) ?? [];
  if (placements.length !== 1 || placements[0] !== f.canonicalPage) {
    errors.push(
      `FAQ "${f.id}" expected in FAQPage on "${f.canonicalPage}" only, found on [${placements.join(', ')}]`,
    );
  }
  const targetHtml = htmlByUrl.get(f.canonicalPage) ?? '';
  if (!targetHtml.includes(`id="faq-${f.id}"`)) {
    errors.push(`${f.canonicalPage}: missing anchor id="faq-${f.id}" in built HTML`);
  }

  // Verify alsoLinkFrom one-line links render, resolve to #faq-<id>, and are NOT in the linking page's FAQPage
  for (const fromUrl of f.alsoLinkFrom) {
    if (!enabledUrls.has(fromUrl)) continue;
    const fromHtml = htmlByUrl.get(fromUrl);
    if (!fromHtml) {
      errors.push(`FAQ "${f.id}" alsoLinkFrom "${fromUrl}" has no built HTML file`);
      continue;
    }
    const expectedHref = `href="${f.canonicalPage}#faq-${f.id}"`;
    if (!fromHtml.includes(expectedHref)) {
      errors.push(`${fromUrl}: missing alsoLinkFrom one-line link ${expectedHref}`);
    }
  }
}

for (const [qText, qPages] of questionToSchemaPages) {
  if (qPages.length > 1) {
    errors.push(
      `Duplicate FAQPage question "${qText}" across multiple pages: ${qPages.join(', ')}`,
    );
  }
}

// Verify gated FAQs do not leak into any built FAQPage
for (const f of [...faqsById.values()].filter((x) => !x.enabled)) {
  const placements = schemaFaqPlacements.get(f.id) ?? [];
  if (placements.length > 0) {
    errors.push(`Gated FAQ "${f.id}" leaked into built FAQPage on [${placements.join(', ')}]`);
  }
}

if (errors.length > 0) {
  console.error(`check-faqs FAILED (${errors.length} error(s)):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `check-faqs: ${enabledFaqs.length} FAQs, each in exactly 1 FAQPage, ${outsideRange} pages outside 3–5, ${dollarAnswers} $ answers`,
);
