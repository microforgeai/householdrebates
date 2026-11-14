import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const contentDir = path.join(siteRoot, 'src/content');
const distDir = path.join(siteRoot, 'dist');

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(path.join(dir, e.name), ext)
      : e.name.endsWith(ext)
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

const mdxFiles = walk(contentDir, '.mdx').sort();
const mdxDescriptions = new Map();

for (const file of mdxFiles) {
  const rel = path.relative(siteRoot, file);
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  const fm = YAML.parse(m[1]);
  if (!fm.title || fm.title.length > 60) {
    throw new Error(`${rel}: title must be 1–60 chars (got ${fm.title?.length ?? 0}): "${fm.title}"`);
  }
  if (/Household Rebates/i.test(fm.title)) {
    throw new Error(
      `${rel}: frontmatter title must not contain brand "Household Rebates" (SeoHead adds it when <= 60 chars): "${fm.title}"`,
    );
  }
  if (fm.h1 !== undefined && (!fm.h1 || typeof fm.h1 !== 'string' || /\$\s?\d/.test(fm.h1))) {
    throw new Error(`${rel}: invalid h1 override "${fm.h1}"`);
  }
  if (!fm.description || fm.description.length < 70 || fm.description.length > 155) {
    throw new Error(
      `${rel}: description must be 70–155 chars (got ${fm.description?.length ?? 0}): "${fm.description}"`,
    );
  }
  if (mdxDescriptions.has(fm.description)) {
    throw new Error(
      `${rel}: duplicate description with ${mdxDescriptions.get(fm.description)}: "${fm.description}"`,
    );
  }
  mdxDescriptions.set(fm.description, rel);
  if (/\$\s?\d/.test(fm.title) || /\$\s?\d/.test(fm.description)) {
    throw new Error(`${rel}: dollar amount found in title or description`);
  }
}

let longestTitle = '';
let longestTitleLen = 0;
let titlesOver60 = 0;
let duplicateBrands = 0;
let duplicateDescriptions = 0;
const htmlFiles = fs.existsSync(distDir) ? walk(distDir, '.html').sort() : [];
const htmlDescriptions = new Map();

for (const htmlFile of htmlFiles) {
  const rel = path.relative(siteRoot, htmlFile);
  const html = fs.readFileSync(htmlFile, 'utf8');

  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) {
    throw new Error(`${rel}: expected exactly 1 <h1>, found ${h1Count}`);
  }
  if (!/<link\s+rel=["']canonical["']\s+href=["']https:\/\/householdrebates\.com\.au\//i.test(html)) {
    throw new Error(`${rel}: missing canonical link tag`);
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch) {
    throw new Error(`${rel}: missing <title> tag`);
  }
  const renderedTitle = decodeEntities(titleMatch[1]).trim();
  if (!renderedTitle || renderedTitle.length > 60) {
    titlesOver60++;
    throw new Error(
      `${rel}: rendered <title> must be 1–60 chars (got ${renderedTitle.length}): "${renderedTitle}"`,
    );
  }
  const brandCount = [...renderedTitle.matchAll(/Household Rebates/gi)].length;
  if (brandCount > 1) {
    duplicateBrands++;
    throw new Error(
      `${rel}: rendered <title> contains brand "Household Rebates" ${brandCount} times: "${renderedTitle}"`,
    );
  }
  if (/\$\s?\d/.test(renderedTitle)) {
    throw new Error(`${rel}: dollar amount found in rendered <title>: "${renderedTitle}"`);
  }
  if (renderedTitle.length > longestTitleLen) {
    longestTitleLen = renderedTitle.length;
    longestTitle = renderedTitle;
  }

  const descMatch =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ??
    html.match(/<meta\s+name='description'\s+content='([^']*)'/i) ??
    html.match(/<meta\s+content="([^"]*)"\s+name="description"/i) ??
    html.match(/<meta\s+content='([^']*)'\s+name='description'/i);
  if (!descMatch) {
    throw new Error(`${rel}: missing <meta name="description">`);
  }
  const renderedDesc = decodeEntities(descMatch[1]).trim();
  if (renderedDesc.length < 70 || renderedDesc.length > 155) {
    throw new Error(
      `${rel}: rendered meta description must be 70–155 chars (got ${renderedDesc.length}): "${renderedDesc}"`,
    );
  }
  if (htmlDescriptions.has(renderedDesc)) {
    duplicateDescriptions++;
    throw new Error(
      `${rel}: duplicate meta description with ${htmlDescriptions.get(renderedDesc)}: "${renderedDesc}"`,
    );
  }
  htmlDescriptions.set(renderedDesc, rel);
  if (/\$\s?\d/.test(renderedDesc)) {
    throw new Error(`${rel}: dollar amount found in meta description`);
  }
}

// Prompt 32 Step 4: while bio is unfilled/placeholder, about-gurinder-singh.mdx stays noindex,
// is excluded from public dist/ output, and is absent from sitemap-0.xml.
const peoplePath = path.join(siteRoot, 'src/data/people.json');
const people = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const authorBio = people?.['gurinder-singh']?.bio ?? '';
const bioIsPlaceholder =
  typeof authorBio !== 'string' || !authorBio.trim() || /<<|>>/.test(authorBio);

const authorMdxPath = path.join(contentDir, 'pages/about-gurinder-singh.mdx');
const authorMdxRaw = fs.readFileSync(authorMdxPath, 'utf8');
const authorFmMatch = authorMdxRaw.match(/^---\n([\s\S]*?)\n---/);
const authorFm = authorFmMatch ? YAML.parse(authorFmMatch[1]) : {};

const authorHtmlPath = path.join(distDir, 'about/gurinder-singh/index.html');
const sitemapPath = path.join(distDir, 'sitemap-0.xml');

if (fs.existsSync(sitemapPath)) {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const inSitemap = sitemapXml.includes('https://householdrebates.com.au/about/gurinder-singh/');

  if (bioIsPlaceholder) {
    if (authorFm.noindex !== true) {
      throw new Error(
        'about-gurinder-singh.mdx must keep noindex: true while people.json["gurinder-singh"].bio is unfilled',
      );
    }
    if (fs.existsSync(authorHtmlPath)) {
      throw new Error(
        'dist/about/gurinder-singh/index.html must not be emitted into public output while bio is unfilled',
      );
    }
    if (inSitemap) {
      throw new Error(
        'dist/sitemap-0.xml must not include /about/gurinder-singh/ while bio is unfilled',
      );
    }
  } else if (authorFm.noindex !== true) {
    if (!fs.existsSync(authorHtmlPath)) {
      throw new Error(
        'dist/about/gurinder-singh/index.html must exist once bio is supplied and noindex is false',
      );
    }
    const authorHtml = fs.readFileSync(authorHtmlPath, 'utf8');
    const hasNoindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(authorHtml);
    if (hasNoindex) {
      throw new Error(
        'dist/about/gurinder-singh/index.html still carries noindex after bio was supplied and noindex set to false',
      );
    }
    if (!inSitemap) {
      throw new Error(
        'dist/sitemap-0.xml must include /about/gurinder-singh/ once bio is supplied and noindex is false',
      );
    }
  }
}

console.log(
  `check-seo: 0 errors (${mdxFiles.length} MDX files, ${htmlFiles.length} HTML pages; ${titlesOver60} titles over 60, ${duplicateBrands} duplicate brands, ${duplicateDescriptions} duplicate descriptions; author bio placeholder=${bioIsPlaceholder}; longest title ${longestTitleLen} chars: "${longestTitle}").`,
);
