import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');

const BANNED_PHRASES = [
  'you will get',
  'you qualify',
  'guaranteed',
  'free air con',
  'free air-con',
  'government rebate approved',
  'claim now',
  'government-approved',
  'veu partner',
  'on behalf of the victorian government',
];

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (/\.(mdx|astro|ts|yaml)$/.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walkFiles(srcDir);

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const lower = raw.toLowerCase();
  const rel = path.relative(siteRoot, file);

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      throw new Error(`Banned phrase "${phrase}" found in ${rel}`);
    }
  }

  if (file.endsWith('.mdx')) {
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = YAML.parse(fmMatch[1]);
      if (typeof fm.title === 'string' && fm.title.length > 60) {
        throw new Error(`${rel}: title exceeds 60 chars (${fm.title.length}): "${fm.title}"`);
      }
      if (
        typeof fm.description === 'string' &&
        (fm.description.length < 70 || fm.description.length > 160)
      ) {
        throw new Error(
          `${rel}: description must be 70–160 chars (got ${fm.description.length}): "${fm.description}"`,
        );
      }
    }
  }
}

console.log(`check-copy: OK (${files.length} files scanned against ${BANNED_PHRASES.length} banned phrases).`);
