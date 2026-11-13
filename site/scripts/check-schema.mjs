import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

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
]);

const BANNED_TYPES = new Set([
  'LocalBusiness',
  'Offer',
  'PriceSpecification',
  'Product',
  'GovernmentService',
  'AggregateRating',
]);

function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walkHtml(path.join(dir, e.name))
      : e.name.endsWith('.html')
        ? [path.join(dir, e.name)]
        : [],
  );
}

function checkTypes(node, rel) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) checkTypes(item, rel);
    return;
  }
  const t = node['@type'];
  if (typeof t === 'string') {
    if (BANNED_TYPES.has(t) || !ALLOWED_TYPES.has(t)) {
      throw new Error(`${rel}: disallowed JSON-LD @type "${t}"`);
    }
  }
  if (node.estimatedCost !== undefined || node.totalTime !== undefined) {
    throw new Error(`${rel}: HowTo must not include estimatedCost or totalTime`);
  }
  for (const v of Object.values(node)) {
    checkTypes(v, rel);
  }
}

const files = walkHtml(distDir);
for (const file of files) {
  const rel = path.relative(distDir, file);
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of scripts) {
    const raw = m[1];
    if (/\$\s?\d/.test(raw) || /\bAUD\b/.test(raw)) {
      throw new Error(`${rel}: currency or AUD price found in JSON-LD`);
    }
    const parsed = JSON.parse(raw);
    checkTypes(parsed, rel);
  }
}

console.log(`check-schema: 0 errors (${files.length} HTML files verified).`);
