import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSeoSnapshotFromDist } from './snapshot-seo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const distDir = path.join(siteRoot, 'dist');
const baselinePath = path.join(repoRoot, 'docs/design/p42/seo-before.json');

if (!fs.existsSync(baselinePath)) {
  throw new Error(`Missing baseline ${baselinePath}. Run node scripts/snapshot-seo.mjs first.`);
}

if (process.env.SKIP_BUILD !== '1') {
  execFileSync('npm', ['run', 'build'], { cwd: siteRoot, stdio: 'inherit' });
}

const before = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const after = extractSeoSnapshotFromDist(distDir);

const diffs = [];

const beforePaths = Object.keys(before.pages).sort();
const afterPaths = Object.keys(after.pages).sort();

for (const p of beforePaths) {
  if (!after.pages[p]) {
    diffs.push(`${p}: URL removed from sitemap`);
  }
}
for (const p of afterPaths) {
  if (!before.pages[p]) {
    diffs.push(`${p}: unexpected new URL in sitemap`);
  }
}

const LOCKED_FIELDS = [
  'url',
  'title',
  'description',
  'canonical',
  'robots',
  'h1',
  'ogTitle',
  'jsonLdTypes',
];

for (const p of beforePaths) {
  const b = before.pages[p];
  const a = after.pages[p];
  if (!a) continue;

  for (const field of LOCKED_FIELDS) {
    const bv = JSON.stringify(b[field]);
    const av = JSON.stringify(a[field]);
    if (bv !== av) {
      diffs.push(`${p} [${field}]: before=${bv} !== after=${av}`);
    }
  }

  // Only allowed differences are og:image / twitter:image — ensure no other unexpected fields diverge
  for (const key of Object.keys(b)) {
    if (key === 'ogImage' || key === 'twitterImage' || LOCKED_FIELDS.includes(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      diffs.push(`${p} [${key}]: before=${JSON.stringify(b[key])} !== after=${JSON.stringify(a[key])}`);
    }
  }
}

if (diffs.length > 0) {
  console.error(`check-seo-unchanged FAILED (${diffs.length} difference(s)):`);
  for (const d of diffs) {
    console.error(`  - ${d}`);
  }
  process.exit(1);
}

console.log(
  `check-seo-unchanged: OK (${after.urlCount} sitemap URLs match docs/design/p42/seo-before.json on title, description, canonical, robots, H1, og:title, and JSON-LD @types).`,
);
