import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const distDir = path.join(siteRoot, 'dist');
const outPath = path.join(repoRoot, 'docs/design/p42/seo-before.json');

export function decodeEntities(str) {
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

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, attrName, attrValue) {
  const re1 = new RegExp(
    `<meta\\s+${attrName}=["']${attrValue}["']\\s+content=["']([^"']*)["']`,
    'i',
  );
  const re2 = new RegExp(
    `<meta\\s+content=["']([^"']*)["']\\s+${attrName}=["']${attrValue}["']`,
    'i',
  );
  const m = html.match(re1) ?? html.match(re2);
  return m ? decodeEntities(m[1]).trim() : null;
}

function extractCanonical(html) {
  const m =
    html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i) ??
    html.match(/<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i);
  return m ? decodeEntities(m[1]).trim() : null;
}

function collectJsonLdTypes(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdTypes(item, out);
    return;
  }
  if ('@type' in node) {
    const t = node['@type'];
    if (Array.isArray(t)) {
      for (const x of t) if (typeof x === 'string') out.push(x);
    } else if (typeof t === 'string') {
      out.push(t);
    }
  }
  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') {
      collectJsonLdTypes(val, out);
    }
  }
}

export function extractSeoSnapshotFromDist(targetDistDir = distDir) {
  const sitemapPath = path.join(targetDistDir, 'sitemap-0.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Missing ${sitemapPath}. Run astro build first.`);
  }
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => decodeEntities(m[1]).trim())
    .sort();

  const pages = {};
  for (const loc of locs) {
    const u = new URL(loc);
    const pathname = u.pathname;
    const relHtml =
      pathname === '/'
        ? 'index.html'
        : path.join(pathname.replace(/^\/|\/$/g, ''), 'index.html');
    const htmlPath = path.join(targetDistDir, relHtml);
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Sitemap URL ${loc} missing built HTML file at ${htmlPath}`);
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

    const jsonLdTypes = [];
    for (const scriptMatch of html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      const parsed = JSON.parse(scriptMatch[1]);
      collectJsonLdTypes(parsed, jsonLdTypes);
    }
    jsonLdTypes.sort();

    pages[pathname] = {
      url: loc,
      title: titleMatch ? decodeEntities(titleMatch[1]).trim() : null,
      description: extractMeta(html, 'name', 'description'),
      canonical: extractCanonical(html),
      robots: extractMeta(html, 'name', 'robots'),
      h1: h1Match ? stripTags(h1Match[1]) : null,
      ogTitle: extractMeta(html, 'property', 'og:title'),
      ogImage: extractMeta(html, 'property', 'og:image'),
      twitterImage: extractMeta(html, 'name', 'twitter:image'),
      jsonLdTypes,
    };
  }

  return {
    urlCount: locs.length,
    pages,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (fs.existsSync(outPath) && process.env.FORCE_SEO_SNAPSHOT !== '1') {
    throw new Error(
      `${outPath} already exists. Refusing to overwrite baseline snapshot unless FORCE_SEO_SNAPSHOT=1.`,
    );
  }
  console.log('Building site for SEO baseline snapshot...');
  execFileSync('npm', ['run', 'build'], { cwd: siteRoot, stdio: 'inherit' });
  const snapshot = extractSeoSnapshotFromDist(distDir);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`snapshot-seo: recorded ${snapshot.urlCount} sitemap URLs to docs/design/p42/seo-before.json`);
}
