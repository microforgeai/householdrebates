import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const contentDir = path.join(siteRoot, 'src/content');
const SITE_ORIGIN = 'https://householdrebates.com.au';

// Remove dist/solar-battery when SOLAR_SECTION_ENABLED !== 'true'
if (process.env.SOLAR_SECTION_ENABLED !== 'true') {
  const sbDir = path.join(distDir, 'solar-battery');
  if (fs.existsSync(sbDir)) {
    fs.rmSync(sbDir, { recursive: true, force: true });
  }
}

// Format sitemap-0.xml with one <url> per line so grep -c '<loc>' matches URL count
const sitemapPath = path.join(distDir, 'sitemap-0.xml');
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const formatted = xml.replace(/<\/url><url>/g, '</url>\n<url>').replace(/><url>/, '>\n<url>').replace(/<\/url><\/urlset>/, '</url>\n</urlset>');
  fs.writeFileSync(sitemapPath, formatted, 'utf8');
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
const enabledRowNums = parseRowRange(rollout.enabledRows);
const gatedOk = new Set(rollout.gatedApproved ?? []);
const enabledUrls = new Set(
  urlMap
    .filter((r) => enabledRowNums.has(r.row) && (!r.gated || gatedOk.has(r.row) || gatedOk.has(r.url)))
    .map((r) => r.url),
);

function walkMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkMdx(path.join(dir, e.name)) : e.name.endsWith('.mdx') ? [path.join(dir, e.name)] : [],
  );
}

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).format(new Date(d));

function entryUrl(file, fm) {
  if (file.includes('/content/guides/') || file.includes('/content/areas/')) {
    return `/victoria/${fm.slug}/`;
  }
  if (fm.slug === 'home') return '/';
  if (fm.slug === 'victoria') return '/victoria/';
  if (fm.state === 'vic' && fm.section === 'tools') return `/victoria/${fm.slug}/`;
  return `/${fm.slug}/`;
}

const entries = [];
for (const file of walkMdx(contentDir)) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  const fm = YAML.parse(m[1]);
  if (fm.noindex) continue;
  const url = entryUrl(file, fm);
  if (!enabledUrls.has(url)) continue;
  entries.push({
    url,
    title: fm.h1 ?? fm.title,
    description: fm.description,
    navGroup: fm.navGroup,
    mapRow: fm.mapRow ?? 999,
    hasFigures: Array.isArray(fm.figures) && fm.figures.length > 0,
    checkedOn: fm.checkedOn ? fmtDate(fm.checkedOn) : null,
  });
}

entries.sort((a, b) => a.mapRow - b.mapRow);

// 9 ordered sections per Prompt 17 Step A9:
// 1. Victoria hub, 2. Rebate guides, 3. Upgrade guides, 4. Questions,
// 5. Audience, 6. Tools, 7. How it works, 8. About and sources, 9. Optional
const SECTIONS = [
  {
    heading: 'Victoria hub',
    match: (e) => e.navGroup === 'hub',
  },
  {
    heading: 'Rebate guides',
    match: (e) => e.navGroup === 'rebate-guides',
  },
  {
    heading: 'Upgrade guides',
    match: (e) => e.navGroup === 'upgrade-guides',
  },
  {
    heading: 'Questions',
    match: (e) => e.navGroup === 'question-pages',
  },
  {
    heading: 'Audience',
    match: (e) => e.navGroup === 'audience',
  },
  {
    heading: 'Tools',
    match: (e) => e.navGroup === 'tools',
  },
  {
    heading: 'How it works',
    match: (e) =>
      e.navGroup === 'support-guides' || e.url === '/how-quotes-work/' || e.url === '/faq/',
  },
  {
    heading: 'About and sources',
    match: (e) =>
      e.navGroup === 'trust' && e.url !== '/how-quotes-work/' && e.url !== '/faq/',
  },
  {
    heading: 'Optional',
    match: (e) => e.navGroup === 'areas',
  },
];

const lines = [
  '# Household Rebates',
  '',
  "> Independent guide to Victorian Energy Upgrades (VEU) discounts, Solar Homes rebates, and Victoria's 2027 electrification rules. Run by Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne. Not a government website. Every figure is indicative, dated, and linked to its official source; an accredited provider confirms eligibility and the final discount.",
  '',
];

for (const sec of SECTIONS) {
  const items = entries.filter(sec.match);
  if (items.length === 0) continue;
  lines.push(`## ${sec.heading}`);
  for (const item of items) {
    const checkedSuffix =
      item.hasFigures && item.checkedOn ? ` Figures checked ${item.checkedOn}.` : '';
    lines.push(
      `- [${item.title}](${SITE_ORIGIN}${item.url}): ${item.description}${checkedSuffix}`,
    );
  }
  lines.push('');
}

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'llms.txt'), `${lines.join('\n').trimEnd()}\n`, 'utf8');
console.log(`build-llms: wrote dist/llms.txt (${entries.length} URLs)`);
