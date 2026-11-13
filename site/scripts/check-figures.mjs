import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');

const maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const now = new Date();

// 1. Load all sources
const sourcesDir = path.join(srcDir, 'content/sources');
const sourceFiles = fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yaml'));
const sourcesMap = new Map();
for (const file of sourceFiles) {
  const id = file.replace(/\.yaml$/, '');
  const data = YAML.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8'));
  sourcesMap.set(id, data);
}

// 2. Load and validate figures/vic-veu.yaml
const figuresPath = path.join(srcDir, 'content/figures/vic-veu.yaml');
const figuresList = YAML.parse(fs.readFileSync(figuresPath, 'utf8'));
const figuresById = new Map();
const figuresByGroup = new Map();

for (const fig of figuresList) {
  if (figuresById.has(fig.id)) {
    throw new Error(`Duplicate figure ID "${fig.id}" in vic-veu.yaml`);
  }
  figuresById.set(fig.id, fig);

  const groupArr = figuresByGroup.get(fig.group) ?? [];
  groupArr.push(fig.id);
  figuresByGroup.set(fig.group, groupArr);

  const src = sourcesMap.get(fig.sourceId);
  if (!src) {
    throw new Error(`Figure "${fig.id}" references missing source "${fig.sourceId}"`);
  }
  if (!src.official) {
    throw new Error(`Figure "${fig.id}" references non-official source "${fig.sourceId}"`);
  }

  const checkedDate = new Date(fig.checkedOn);
  const ageDays = Math.floor((now.getTime() - checkedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays > maxAgeDays) {
    throw new Error(`Figure "${fig.id}" is stale (${ageDays} days old > ${maxAgeDays} days)`);
  }
  if (ageDays < -1) {
    throw new Error(`Figure "${fig.id}" has future checkedOn date (${fig.checkedOn})`);
  }
}

// 3. Scan all files in site/src for raw $ amounts (e.g. $560, $5,530)
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

const allSrcFiles = walkFiles(srcDir);
const allowedDollarFiles = new Set([
  path.join(srcDir, 'lib/schema.ts'), // regex test for $
]);

for (const file of allSrcFiles) {
  if (allowedDollarFiles.has(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const rawMatch = content.match(/\$[0-9][0-9,]*/);
  if (rawMatch) {
    const rel = path.relative(siteRoot, file);
    throw new Error(
      `Raw dollar amount "${rawMatch[0]}" found in ${rel}. All dollar amounts must come from figures/vic-veu.yaml via <Money> or <FigureTable>.`,
    );
  }
}

// 4. Verify MDX frontmatter `figures` matches <Money> and <FigureTable> in body
const mdxFiles = allSrcFiles.filter((f) => f.endsWith('.mdx'));
for (const file of mdxFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;
  const fm = YAML.parse(fmMatch[1]);
  const body = fmMatch[2];
  const declared = new Set(fm.figures ?? []);

  const usedInBody = new Set();
  for (const m of body.matchAll(/<Money\s+[^>]*id=["']([^"']+)["']/g)) {
    const id = m[1];
    if (!figuresById.has(id)) {
      throw new Error(`${path.relative(siteRoot, file)}: <Money id="${id}"> does not exist`);
    }
    usedInBody.add(id);
  }
  for (const m of body.matchAll(/<FigureTable\s+[^>]*group=["']([^"']+)["']/g)) {
    const group = m[1];
    const groupIds = figuresByGroup.get(group);
    if (!groupIds) {
      throw new Error(`${path.relative(siteRoot, file)}: <FigureTable group="${group}"> does not exist`);
    }
    for (const id of groupIds) {
      usedInBody.add(id);
    }
  }

  for (const id of usedInBody) {
    if (!declared.has(id)) {
      throw new Error(
        `${path.relative(siteRoot, file)}: figure "${id}" is used in body (<Money>/<FigureTable>) but missing from frontmatter figures list.`,
      );
    }
  }
}

console.log(`check-figures: OK (${figuresById.size} verified figures, 0 raw $ amounts, ${mdxFiles.length} MDX files checked).`);
