import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const contentDir = path.join(siteRoot, 'src/content');

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run npm run build first.');
}

function parseRowRange(spec) {
  const out = new Set();
  for (const part of String(spec).split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      for (let i = Number(m[1]); i <= Number(m[2]); i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      out.add(Number(part));
    }
  }
  return out;
}

const rollout = JSON.parse(fs.readFileSync(path.join(siteRoot, 'src/data/rollout.json'), 'utf8'));
const urlMap = JSON.parse(fs.readFileSync(path.join(siteRoot, 'src/data/url-map.json'), 'utf8'));
const allMapUrls = new Set(urlMap.map((r) => r.url));
const enabledRowNums = parseRowRange(rollout.enabledRows);
const gatedOk = new Set(rollout.gatedApproved ?? []);
const expectedRows = urlMap.filter(
  (r) => enabledRowNums.has(r.row) && (!r.gated || gatedOk.has(r.row) || gatedOk.has(r.url)),
);
const expectedUrls = new Set(expectedRows.map((r) => r.url));
const rowByUrl = new Map(urlMap.map((r) => [r.url, r]));

// Also check src/content MDX files directly so extra/unmapped files are caught even before rebuild
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

for (const mdxFile of walkFiles(contentDir, '.mdx')) {
  const raw = fs.readFileSync(mdxFile, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = m ? YAML.parse(m[1]) : {};
  const slug = fm.slug ?? path.basename(mdxFile, '.mdx');
  let url = `/${slug}/`;
  if (mdxFile.includes('/content/guides/') || mdxFile.includes('/content/areas/')) {
    url = `/victoria/${slug}/`;
  } else if (slug === 'home') {
    url = '/';
  } else if (slug === 'victoria') {
    url = '/victoria/';
  } else if (fm.state === 'vic' && fm.section === 'tools') {
    url = `/victoria/${slug}/`;
  }
  if (!allMapUrls.has(url)) {
    throw new Error(`extra URL not in map: ${url} (${path.relative(siteRoot, mdxFile)})`);
  }
  const mapRow = rowByUrl.get(url);
  if (mapRow?.gated) {
    if (enabledRowNums.has(mapRow.row) && !(gatedOk.has(mapRow.row) || gatedOk.has(url))) {
      throw new Error(`gated page not approved: ${url} (${path.relative(siteRoot, mdxFile)})`);
    }
    continue;
  }
  if (!expectedUrls.has(url) && !fm.noindex) {
    throw new Error(`page not enabled in rollout.json: ${url} (${path.relative(siteRoot, mdxFile)})`);
  }
}

// 1. Collect all indexable built HTML pages in dist/
const htmlFiles = walkFiles(distDir, '.html');
const builtIndexableHtml = new Map(); // url -> html

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file);
  if (rel === '404.html') continue;
  const html = fs.readFileSync(file, 'utf8');
  if (/meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
    continue;
  }
  const url =
    rel === 'index.html'
      ? '/'
      : `/${rel.replace(/\/index\.html$/, '').replace(/\\/g, '/')}/`;
  builtIndexableHtml.set(url, html);
}

const extraUrls = [...builtIndexableHtml.keys()].filter((u) => !expectedUrls.has(u));
if (extraUrls.length > 0) {
  throw new Error(`extra URL not in map or rollout: ${extraUrls.join(', ')}`);
}

const missingBuilt = [...expectedUrls].filter((u) => !builtIndexableHtml.has(u));
if (missingBuilt.length > 0) {
  throw new Error(`missing built URL(s) expected from rollout.json: ${missingBuilt.join(', ')}`);
}

function normalizeInternalHref(href) {
  if (!href) return null;
  let clean = href.trim();
  if (clean.startsWith('https://householdrebates.com.au')) {
    clean = clean.slice('https://householdrebates.com.au'.length) || '/';
  }
  if (!clean.startsWith('/') || clean.startsWith('//')) return null;
  clean = clean.split('#')[0].split('?')[0];
  if (!clean) return '/';
  if (/\.(xml|txt|svg|ico|css|js|pdf)$/i.test(clean)) return null;
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function extractHrefs(fragment) {
  const set = new Set();
  for (const m of fragment.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const norm = normalizeInternalHref(m[1]);
    if (norm) set.add(norm);
  }
  return set;
}

// 2, 3 & 4: Check main links, [data-body] links, and inbound links across <main>
const inboundFromOtherMain = new Map([...expectedUrls].map((u) => [u, new Set()]));
let missingLinkErrors = [];

const enabledVictoriaSubpages = [...expectedUrls].filter(
  (u) => u.startsWith('/victoria/') && u !== '/victoria/',
);

for (const [pageUrl, html] of builtIndexableHtml.entries()) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    throw new Error(`${pageUrl}: missing <main> element`);
  }
  const mainHtml = mainMatch[1];
  const mainHrefs = extractHrefs(mainHtml);

  for (const target of mainHrefs) {
    if (target !== pageUrl && inboundFromOtherMain.has(target)) {
      inboundFromOtherMain.get(target).add(pageUrl);
    }
  }

  const row = rowByUrl.get(pageUrl);
  if (!row || !row.internalLinks || row.internalLinks.length === 0) continue;

  const expandedTargets = [];
  for (const rawTarget of row.internalLinks) {
    if (rawTarget === '*') {
      expandedTargets.push(...enabledVictoriaSubpages);
    } else if (expectedUrls.has(rawTarget) && rawTarget !== pageUrl) {
      expandedTargets.push(rawTarget);
    }
  }
  const uniqueEnabledTargets = [...new Set(expandedTargets)];

  for (const reqTarget of uniqueEnabledTargets) {
    if (!mainHrefs.has(reqTarget)) {
      missingLinkErrors.push(`missing link on ${pageUrl} -> ${reqTarget}`);
    }
  }

  // [data-body] check (skip hub since its links live in HubIndex or body, or check HubIndex inside data-body)
  if (pageUrl !== '/victoria/') {
    const bodyMatch = mainHtml.match(/<div[^>]*\bdata-body\b[^>]*>([\s\S]*?)<\/main>/i);
    // Extract strictly the data-body block by locating Faq/form-card/source-list boundary
    const bodySliceMatch = mainHtml.match(
      /<div[^>]*\bdata-body\b[^>]*>([\s\S]*?)(?=<section[^>]*class=["'][^"']*(?:faq|form-card|sources)|<nav[^>]*class=["'][^"']*related-links)/i,
    );
    const bodyHtml = bodySliceMatch ? bodySliceMatch[1] : bodyMatch ? bodyMatch[1] : '';
    const bodyHrefs = extractHrefs(bodyHtml);

    const minRequiredInBody = Math.min(2, uniqueEnabledTargets.length);
    const matchedRowLinksInBody = uniqueEnabledTargets.filter((t) => bodyHrefs.has(t));
    if (matchedRowLinksInBody.length < minRequiredInBody) {
      throw new Error(
        `missing link in [data-body] on ${pageUrl}: found ${matchedRowLinksInBody.length} of ${minRequiredInBody} required row links (row links enabled: ${uniqueEnabledTargets.join(', ')})`,
      );
    }
  }
}

if (missingLinkErrors.length > 0) {
  throw new Error(`missing link(s): ${missingLinkErrors.join('; ')}`);
}

const orphans = [];
for (const [url, sourcesSet] of inboundFromOtherMain.entries()) {
  if (sourcesSet.size < 2) {
    orphans.push(`${url} (inbound=${sourcesSet.size}: ${[...sourcesSet].join(', ')})`);
  }
}
if (orphans.length > 0) {
  throw new Error(`orphan page(s) with < 2 inbound <main> links: ${orphans.join('; ')}`);
}

// 5. Sitemap <loc> count
const sitemapPath = path.join(distDir, 'sitemap-0.xml');
if (!fs.existsSync(sitemapPath)) {
  throw new Error('dist/sitemap-0.xml not found');
}
const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
const sitemapCount = [...sitemapXml.matchAll(/<loc>/g)].length;
if (sitemapCount !== expectedUrls.size) {
  throw new Error(`sitemap <loc> count (${sitemapCount}) !== expected indexable count (${expectedUrls.size})`);
}

// 6. llms.txt URL count
const llmsPath = path.join(distDir, 'llms.txt');
if (!fs.existsSync(llmsPath)) {
  throw new Error('dist/llms.txt not found');
}
const llmsTxt = fs.readFileSync(llmsPath, 'utf8');
const llmsUrls = new Set(
  [...llmsTxt.matchAll(/\]\((https:\/\/householdrebates\.com\.au\/[^)\s]*)\)/g)].map((m) => m[1]),
);
if (llmsUrls.size !== sitemapCount) {
  throw new Error(`llms.txt URL count (${llmsUrls.size}) !== sitemap count (${sitemapCount})`);
}

console.log(
  `check-urlmap: ${builtIndexableHtml.size} URLs (expected ${expectedUrls.size}), 0 extra, 0 missing links, 0 orphans, sitemap ${sitemapCount}, llms ${llmsUrls.size}`,
);
