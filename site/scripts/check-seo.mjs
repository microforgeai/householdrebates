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

const mdxFiles = walk(contentDir, '.mdx');
for (const file of mdxFiles) {
  const rel = path.relative(siteRoot, file);
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  const fm = YAML.parse(m[1]);
  if (!fm.title || fm.title.length > 60) {
    throw new Error(`${rel}: title must be 1–60 chars (got ${fm.title?.length ?? 0}): "${fm.title}"`);
  }
  if (!fm.description || fm.description.length < 70 || fm.description.length > 160) {
    throw new Error(
      `${rel}: description must be 70–160 chars (got ${fm.description?.length ?? 0}): "${fm.description}"`,
    );
  }
  if (/\$\s?\d/.test(fm.title) || /\$\s?\d/.test(fm.description)) {
    throw new Error(`${rel}: dollar amount found in title or description`);
  }
}

if (fs.existsSync(distDir)) {
  for (const htmlFile of walk(distDir, '.html')) {
    const rel = path.relative(siteRoot, htmlFile);
    const html = fs.readFileSync(htmlFile, 'utf8');
    const h1Count = [...html.matchAll(/<h1\b/gi)].length;
    if (h1Count !== 1) {
      throw new Error(`${rel}: expected exactly 1 <h1>, found ${h1Count}`);
    }
    if (!/<link\s+rel=["']canonical["']\s+href=["']https:\/\/householdrebates\.com\.au\//i.test(html)) {
      throw new Error(`${rel}: missing canonical link tag`);
    }
  }
}

console.log(`check-seo: 0 errors (${mdxFiles.length} MDX files and built HTML verified).`);
