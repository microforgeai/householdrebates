import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');
const sourcesDir = path.join(srcDir, 'content/sources');
const staleSourcesPath = path.join(srcDir, 'data/stale-sources.json');

const staleUrls = fs.existsSync(staleSourcesPath)
  ? JSON.parse(fs.readFileSync(staleSourcesPath, 'utf8'))
  : [];

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (full === staleSourcesPath) continue;
    if (e.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (/\.(mdx|astro|ts|yaml)$/.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

// 1. Check stale-sources deny list across all source, page, and figure files
for (const file of walkFiles(srcDir)) {
  const rel = path.relative(siteRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  for (const badUrl of staleUrls) {
    if (content.includes(badUrl)) {
      console.error(`FAIL stale source referenced in ${rel}: ${badUrl}`);
      process.exit(1);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
};

async function checkSingleUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: HEADERS,
      signal: controller.signal,
    });

    const isPdfUrl = url.toLowerCase().endsWith('.pdf') || (res.headers.get('content-type') || '').includes('pdf');
    if (isPdfUrl && res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const prefix = buf.subarray(0, 5).toString('ascii');
      if (prefix.startsWith('%PDF')) {
        return { kind: 'ok', status: res.status };
      }
      return { kind: 'fail', reason: `PDF response did not start with %PDF (got "${prefix}")` };
    }

    const bodyText = await res.text();
    if (
      /<title>\s*Just a moment\.\.\.\s*<\/title>/i.test(bodyText) ||
      res.headers.get('cf-mitigated') === 'challenge'
    ) {
      return { kind: 'challenge', status: res.status };
    }

    if (res.ok) {
      return { kind: 'ok', status: res.status };
    }

    return { kind: 'fail', reason: `HTTP ${res.status}` };
  } catch (err) {
    return { kind: 'fail', reason: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

const files = fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yaml')).sort();
let checked = 0;
let failed = 0;
const challenges = [];

const dryStaleOnly = process.argv.includes('--stale-only');
if (dryStaleOnly) {
  console.log(`check-sources (stale-only): ${files.length} source files clean against deny list.`);
  process.exit(0);
}

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const data = YAML.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8'));
  const url = data.url;

  if (i > 0) {
    await sleep(3000);
  }

  let outcome = await checkSingleUrl(url);
  if (outcome.kind === 'fail') {
    await sleep(10_000);
    outcome = await checkSingleUrl(url);
  }

  checked++;
  if (outcome.kind === 'ok') {
    console.log(`OK ${outcome.status} ${file} -> ${url}`);
  } else if (outcome.kind === 'challenge' || data.manualCheck === true) {
    const label = data.manualCheck
      ? `manual-check${data.primarySourceId ? `; primary=${data.primarySourceId}` : ''}`
      : 'check by hand';
    console.log(`CHALLENGE ${url} (${label}) [${file}]`);
    challenges.push(url);
  } else {
    console.error(`FAIL ${file} -> ${url}: ${outcome.reason}`);
    failed++;
  }
}

console.log(
  `check-sources: ${checked} checked, ${failed} failed, ${challenges.length} challenge${challenges.length ? ` (${challenges.join(', ')})` : ''}`,
);

if (failed > 0) {
  process.exit(1);
}
