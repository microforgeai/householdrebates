import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const srcDir = path.join(siteRoot, 'src');
const distDir = path.join(siteRoot, 'dist');

const maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const now = new Date();
const melbourneTodayParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);
const [melbY, melbM, melbD] = melbourneTodayParts.split('-').map(Number);
const todayMelbourneUtc = Date.UTC(melbY, melbM - 1, melbD);

function ageDaysMelbourne(checkedOn) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(checkedOn || '').trim());
  if (m) {
    const checkedUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Math.floor((todayMelbourneUtc - checkedUtc) / (1000 * 60 * 60 * 24));
  }
  const d = new Date(checkedOn);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// 0. Check stale-sources.json deny list if present
const staleSourcesPath = path.join(srcDir, 'data/stale-sources.json');
const staleUrls = fs.existsSync(staleSourcesPath)
  ? JSON.parse(fs.readFileSync(staleSourcesPath, 'utf8'))
  : [];

// 1. Load all sources
const sourcesDir = path.join(srcDir, 'content/sources');
const sourceFiles = fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yaml'));
const sourcesMap = new Map();
for (const file of sourceFiles) {
  const id = file.replace(/\.yaml$/, '');
  const data = YAML.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8'));
  for (const badUrl of staleUrls) {
    if (data.url && data.url.includes(badUrl)) {
      throw new Error(`stale source URL "${data.url}" found in content/sources/${file}`);
    }
  }
  sourcesMap.set(id, data);
}

// 2. Load and validate figures/vic-veu.yaml
const figuresPath = path.join(srcDir, 'content/figures/vic-veu.yaml');
const figuresList = YAML.parse(fs.readFileSync(figuresPath, 'utf8'));
const figuresById = new Map();
const figuresByGroup = new Map();
let staleCount = 0;

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

  const ageDays = ageDaysMelbourne(fig.checkedOn);
  if (ageDays > maxAgeDays) {
    staleCount++;
    throw new Error(`Figure "${fig.id}" is stale (${ageDays} days old > ${maxAgeDays} days)`);
  }
  if (ageDays < -1) {
    throw new Error(`Figure "${fig.id}" has future checkedOn date (${fig.checkedOn})`);
  }

  if (fig.effectiveTo && !fig.supersededBy) {
    throw new Error(`Figure "${fig.id}" has effectiveTo set without supersededBy`);
  }
}

for (const fig of figuresList) {
  if (fig.supersededBy && !figuresById.has(fig.supersededBy)) {
    throw new Error(
      `Figure "${fig.id}" has supersededBy="${fig.supersededBy}" which does not exist in vic-veu.yaml`,
    );
  }
}

// Optional: also check vic-veu-postcodes.json freshness if present
const postcodesPath = path.join(srcDir, 'data/vic-veu-postcodes.json');
if (fs.existsSync(postcodesPath)) {
  const pcData = JSON.parse(fs.readFileSync(postcodesPath, 'utf8'));
  if (pcData.checkedOn) {
    const pcAge = Math.floor(
      (now.getTime() - new Date(pcData.checkedOn).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (pcAge > maxAgeDays) {
      throw new Error(`vic-veu-postcodes.json is stale (${pcAge} days old > ${maxAgeDays} days)`);
    }
  }
}

// 2a. Check src/data/rule-status.json freshness and banner source freshness
const ruleStatusPath = path.join(srcDir, 'data/rule-status.json');
if (fs.existsSync(ruleStatusPath)) {
  const rsData = JSON.parse(fs.readFileSync(ruleStatusPath, 'utf8'));
  const ew = rsData?.electionWatch;
  if (!ew || !ew.sourceId || !ew.checkedOn) {
    throw new Error('data/rule-status.json is missing electionWatch.sourceId or electionWatch.checkedOn');
  }
  const rsSrc = sourcesMap.get(ew.sourceId);
  if (!rsSrc) {
    throw new Error(`data/rule-status.json references missing source "${ew.sourceId}"`);
  }
  if (!rsSrc.official) {
    throw new Error(`data/rule-status.json references non-official source "${ew.sourceId}"`);
  }
  const ewAge = ageDaysMelbourne(ew.checkedOn);
  if (ewAge > maxAgeDays) {
    throw new Error(`data/rule-status.json checkedOn is stale (${ewAge} days old > ${maxAgeDays} days)`);
  }
  if (ewAge < -1) {
    throw new Error(`data/rule-status.json has future checkedOn date (${ew.checkedOn})`);
  }
  const srcAge = ageDaysMelbourne(rsSrc.checkedOn);
  if (srcAge > maxAgeDays) {
    throw new Error(
      `Banner source "${ew.sourceId}" (content/sources/${ew.sourceId}.yaml) is stale (${srcAge} days old > ${maxAgeDays} days)`,
    );
  }
  if (srcAge < -1) {
    throw new Error(`Banner source "${ew.sourceId}" has future checkedOn date (${rsSrc.checkedOn})`);
  }
}

// 2b. Check src/data/tools/*.json freshness and official sourceId
const toolsDataDir = path.join(srcDir, 'data/tools');
let toolFileCount = 0;
let toolStaleCount = 0;
if (fs.existsSync(toolsDataDir)) {
  const toolFiles = fs.readdirSync(toolsDataDir).filter((f) => f.endsWith('.json'));
  toolFileCount = toolFiles.length;
  for (const tf of toolFiles) {
    const toolPath = path.join(toolsDataDir, tf);
    const toolJson = JSON.parse(fs.readFileSync(toolPath, 'utf8'));
    if (!toolJson.sourceId) {
      throw new Error(`data/tools/${tf} is missing sourceId`);
    }
    const toolSrc = sourcesMap.get(toolJson.sourceId);
    if (!toolSrc) {
      throw new Error(`data/tools/${tf} references missing source "${toolJson.sourceId}"`);
    }
    if (!toolSrc.official) {
      throw new Error(`data/tools/${tf} references non-official source "${toolJson.sourceId}"`);
    }
    if (!toolJson.checkedOn) {
      throw new Error(`data/tools/${tf} is missing checkedOn`);
    }
    const toolAgeDays = Math.floor(
      (now.getTime() - new Date(toolJson.checkedOn).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (toolAgeDays > maxAgeDays) {
      toolStaleCount++;
      throw new Error(`data/tools/${tf} is stale (${toolAgeDays} days old > ${maxAgeDays} days)`);
    }
    if (toolAgeDays < -1) {
      throw new Error(`data/tools/${tf} has future checkedOn date (${toolJson.checkedOn})`);
    }
  }
}

// 3. Scan all files in site/src for raw $ amounts (e.g. $560, $5,530) and stale URLs
function walkFiles(dir, extRegex) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkFiles(full, extRegex));
    } else if (extRegex.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

const allSrcFiles = walkFiles(srcDir, /\.(mdx|astro|ts|yaml)$/);
const allowedDollarFiles = new Set([
  path.join(srcDir, 'lib/schema.ts'),
  path.join(srcDir, 'lib/figures.ts'),
]);

let rawAmounts = 0;

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(siteRoot, file);

  for (const badUrl of staleUrls) {
    if (content.includes(badUrl)) {
      throw new Error(`stale source URL "${badUrl}" referenced in ${rel}`);
    }
  }

  if (allowedDollarFiles.has(file)) continue;
  const rawMatch = content.match(/\$\s?[0-9][0-9,]*/);
  if (rawMatch) {
    rawAmounts++;
    throw new Error(
      `Raw dollar amount "${rawMatch[0]}" found in ${rel}. All dollar amounts must come from figures/vic-veu.yaml via <Money> or <FigureTable>.`,
    );
  }
}

// 4. Verify MDX frontmatter `figures`, historical figure rule, and business figure rule
const mdxFiles = allSrcFiles.filter((f) => f.endsWith('.mdx'));
for (const file of mdxFiles) {
  const rel = path.relative(siteRoot, file);
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
      throw new Error(`${rel}: <Money id="${id}"> does not exist`);
    }
    usedInBody.add(id);
  }

  for (const m of body.matchAll(/<FigureTable\s+([\s\S]*?)\/>/g)) {
    const attrs = m[1];
    const groupMatch = attrs.match(/group=["']([^"']+)["']/);
    if (!groupMatch) continue;
    const group = groupMatch[1];
    const groupIds = figuresByGroup.get(group);
    if (!groupIds) {
      throw new Error(`${rel}: <FigureTable group="${group}"> does not exist`);
    }

    const rowsMatch = attrs.match(/rows=\{\[([\s\S]*?)\]\}/);
    if (rowsMatch) {
      const rowIds = [...rowsMatch[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
      for (const id of rowIds) {
        if (!figuresById.has(id)) {
          throw new Error(`${rel}: <FigureTable> row "${id}" does not exist`);
        }
        usedInBody.add(id);
      }
    } else {
      for (const id of groupIds) {
        usedInBody.add(id);
      }
    }
  }

  for (const id of usedInBody) {
    if (!declared.has(id)) {
      throw new Error(
        `${rel}: figure "${id}" is used in body (<Money>/<FigureTable>) but missing from frontmatter figures list.`,
      );
    }
  }

  // Historical rule & business audience rule across all declared/used figures on this page
  const allPageFigures = new Set([...declared, ...usedInBody]);
  for (const id of allPageFigures) {
    const fig = figuresById.get(id);
    if (!fig) {
      throw new Error(`${rel}: frontmatter figure "${id}" does not exist in vic-veu.yaml`);
    }
    if (fig.effectiveTo) {
      const effTo = new Date(fig.effectiveTo);
      if (effTo.getTime() < now.getTime()) {
        if (!fig.supersededBy || !allPageFigures.has(fig.supersededBy)) {
          throw new Error(
            `${rel}: uses historical figure without its replacement ("${id}" requires "${fig.supersededBy}" on the same page).`,
          );
        }
      }
    }
    if (fig.audience === 'business' && fm.slug !== 'veu-minimum-co-payment') {
      throw new Error(
        `${rel}: business figure "${id}" is only allowed on /victoria/veu-minimum-co-payment/.`,
      );
    }
  }
}

// 5. Post-build HTML check (if dist exists): check JSON-LD for $ amounts and text outside data-figure
let schemaAmounts = 0;
if (fs.existsSync(distDir)) {
  const htmlFiles = walkFiles(distDir, /\.html$/);
  for (const htmlFile of htmlFiles) {
    const rel = path.relative(siteRoot, htmlFile);
    const html = fs.readFileSync(htmlFile, 'utf8');

    // Check JSON-LD blocks for currency amounts
    for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      const jsonText = m[1];
      const match = jsonText.match(/\$\s?\d/);
      if (match) {
        schemaAmounts++;
        throw new Error(`Currency amount "${match[0]}" found in JSON-LD schema in ${rel}`);
      }
    }

    // Strip script/style tags and elements carrying data-figure, then check for stray $ amounts
    let stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');

    // Remove table rows and spans marked with data-figure
    stripped = stripped
      .replace(/<tr[^>]*\bdata-figure=["'][^"']+["'][^>]*>[\s\S]*?<\/tr>/gi, '')
      .replace(/<span class="money-block"[^>]*\bdata-figure=["'][^"']+["'][^>]*>[\s\S]*?<\/span>\s*<\/span>/gi, '')
      .replace(/<span class="money-inline"[^>]*\bdata-figure=["'][^"']+["'][^>]*>[\s\S]*?<\/sup>\s*<\/span>/gi, '')
      .replace(/<[a-z0-9]+[^>]*\bdata-figure=["'][^"']+["'][^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, '');

    // Remove HTML tags to inspect visible text + check title/meta description attributes
    const titleMeta = [
      ...html.matchAll(/<title>([\s\S]*?)<\/title>/gi),
      ...html.matchAll(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/gi),
    ]
      .map((x) => x[1])
      .join(' ');
    const metaDollar = titleMeta.match(/\$\s?\d/);
    if (metaDollar) {
      rawAmounts++;
      throw new Error(`Raw dollar amount "${metaDollar[0]}" found in title/meta of ${rel}`);
    }

    const textOnly = stripped.replace(/<[^>]+>/g, ' ');
    const strayDollar = textOnly.match(/\$\s?\d[\d,]*/);
    if (strayDollar) {
      rawAmounts++;
      throw new Error(`Raw dollar amount "${strayDollar[0]}" outside data-figure in ${rel}`);
    }
  }
}

console.log(
  `check-figures: ${figuresById.size} figures, ${staleCount} stale, ${rawAmounts} raw amounts, ${schemaAmounts} schema amounts`,
);
console.log(
  `tool data: ${toolFileCount} ${toolFileCount === 1 ? 'file' : 'files'}, ${toolStaleCount} stale`,
);
