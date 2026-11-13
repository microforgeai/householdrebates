import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walkHtml(path.join(dir, e.name))
      : e.name.endsWith('.html')
        ? [path.join(dir, e.name)]
        : [],
  );
}

const htmlFiles = walkHtml(distDir);
let linkCount = 0;

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file);
  const html = fs.readFileSync(file, 'utf8');

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1];
    const anchorText = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];

    if (/^click here$/i.test(anchorText)) {
      throw new Error(`${rel}: generic "click here" anchor text for ${href}`);
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

    let localPath = null;
    if (href.startsWith('https://householdrebates.com.au')) {
      localPath = href.slice('https://householdrebates.com.au'.length) || '/';
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      localPath = href;
    }

    if (localPath) {
      linkCount++;
      const clean = localPath.split('#')[0].split('?')[0];
      const candidate =
        clean === '/'
          ? path.join(distDir, 'index.html')
          : clean.endsWith('/')
            ? path.join(distDir, clean.slice(1), 'index.html')
            : path.join(distDir, clean.slice(1));
      if (!fs.existsSync(candidate)) {
        throw new Error(`${rel}: broken internal link "${href}" (missing ${path.relative(distDir, candidate)})`);
      }
    }
  }
}

console.log(`check-links: 0 errors (${linkCount} internal links verified across ${htmlFiles.length} HTML files).`);
