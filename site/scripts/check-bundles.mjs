import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const astroDir = path.resolve(__dirname, process.env.ASTRO_DIST_DIR || '../dist', '_astro');

const MAX_ISLAND_GZIP_BYTES = 15_360; // 15 KB gzipped cap (solution-design §11)
const MAX_ALERT_SIGNUP_GZIP_BYTES = 3_072; // 3 KB gzipped cap (Prompt 29b step 1)

// Framework runtime vendor chunks shared across Preact/Astro islands (excluded from app logic budget)
const VENDOR_PREFIXES = ['preact.', 'signals.', 'client.'];

const ISLAND_SPECS = [
  { name: 'Checker', prefix: 'Checker.', requireShared: 'postcode-client.' },
  { name: 'PostcodeLookup', prefix: 'PostcodeLookupIsland.', requireShared: 'postcode-client.' },
  { name: 'GasExitPlanner', prefix: 'GasExitPlanner.' },
  { name: 'HwSizeGuide', prefix: 'HwSizeGuide.' },
  { name: 'RunningCostsPicker', prefix: 'RunningCostsPicker.' },
  { name: 'LeadForm', prefix: 'LeadForm.' },
  {
    name: 'AlertSignup',
    prefix: 'AlertSignupIsland.',
    maxGzipBytes: MAX_ALERT_SIGNUP_GZIP_BYTES,
  },
];

if (!fs.existsSync(astroDir)) {
  console.error(`check-bundles: missing ${astroDir} — run astro build first.`);
  process.exit(1);
}

const allJsFiles = fs.readdirSync(astroDir).filter((f) => f.endsWith('.js'));

function isVendorChunk(filename) {
  return VENDOR_PREFIXES.some((p) => filename.startsWith(p));
}

function collectAppChunks(entryFile) {
  const visited = new Set();
  const queue = [entryFile];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const code = fs.readFileSync(path.join(astroDir, current), 'utf8');
    const importRegex = /\bfrom\s*["']\.\/([^"']+\.js)["']/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const imported = match[1];
      if (!isVendorChunk(imported) && !visited.has(imported)) {
        queue.push(imported);
      }
    }
  }

  return [...visited];
}

const errors = [];
const summaries = [];

let checkedIslands = 0;

for (const spec of ISLAND_SPECS) {
  const matches = allJsFiles.filter((f) => f.startsWith(spec.prefix));
  if (matches.length === 0) {
    if (spec.optional) {
      continue;
    }
    errors.push(`${spec.name}: no built entry chunk matching ${spec.prefix}*.js in dist/_astro`);
    continue;
  }
  if (matches.length > 1) {
    errors.push(`${spec.name}: expected 1 entry chunk matching ${spec.prefix}*.js, found ${matches.length}`);
    continue;
  }

  checkedIslands++;
  const capBytes = spec.maxGzipBytes ?? MAX_ISLAND_GZIP_BYTES;
  const chunks = collectAppChunks(matches[0]);
  if (spec.requireShared && !chunks.some((c) => c.startsWith(spec.requireShared))) {
    const fallbackShared = allJsFiles.find((f) => f.startsWith(spec.requireShared));
    if (fallbackShared) chunks.push(fallbackShared);
  }

  const buffers = chunks.map((f) => fs.readFileSync(path.join(astroDir, f)));
  const perChunkGz = chunks.map((f, idx) => ({
    file: f,
    short: f.split('.')[0],
    gz: zlib.gzipSync(buffers[idx], { level: 9 }).length,
  }));

  const sumGz = perChunkGz.reduce((acc, item) => acc + item.gz, 0);
  const concatGz = zlib.gzipSync(Buffer.concat(buffers), { level: 9 }).length;

  if (sumGz >= capBytes || concatGz >= capBytes) {
    errors.push(
      `${spec.name} exceeds ${capBytes} B gzipped cap: combined chunks sum=${sumGz} B, concat=${concatGz} B (${perChunkGz.map((c) => `${c.short}=${c.gz}B`).join(' + ')})`,
    );
  }

  if (spec.name === 'Checker' || spec.name === 'PostcodeLookup') {
    const parts = perChunkGz.map((c) => `${c.short} ${c.gz} B`).join(' + ');
    summaries.push(`${spec.name}+shared ${sumGz}/${capBytes} B gz (concat ${concatGz} B; ${parts})`);
  } else if (spec.name === 'AlertSignup') {
    summaries.push(`${spec.name} ${sumGz}/${capBytes} B gz`);
  }
}

if (errors.length > 0) {
  console.error('check-bundles FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `check-bundles: ${summaries.join(', ')}; ${checkedIslands}/${checkedIslands} built islands within gzipped caps`,
);
