import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const csvPath = path.join(repoRoot, 'docs/url-map.csv');
const outPath = path.resolve(__dirname, '../src/data/url-map.json');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

if (!fs.existsSync(csvPath)) {
  console.error(`import-url-map: missing ${csvPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8');
const allRows = parseCsv(raw);
const headers = allRows[0];
const dataRows = allRows.slice(1);

const colIdx = Object.fromEntries(headers.map((h, i) => [h.trim(), i]));
const urlRegex = /^\/([a-z0-9-]+\/)*$/;
const errors = [];

const parsed = dataRows.map((cols, idx) => {
  const rowNum = idx + 1;
  const waveRaw = (cols[colIdx.wave] || '').trim();
  const wave = waveRaw.startsWith('0') ? 0 : Number(waveRaw);
  const status = (cols[colIdx.status] || '').trim();
  const url = (cols[colIdx.url_slug] || '').trim();
  const template = (cols[colIdx.page_type_template] || '').trim();
  const question = (cols[colIdx.primary_target_question] || '').trim();
  const secondaryQuestions = (cols[colIdx.secondary_questions] || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const linksRaw = (cols[colIdx.internal_links] || '').trim();
  const internalLinks = linksRaw
    ? linksRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s.startsWith('/') ? s : '*'))
    : [];
  const cta = (cols[colIdx.cta] || '').trim();
  const priorityRaw = (cols[colIdx.priority_and_intent] || '').trim();
  const priorityMatch = priorityRaw.match(/^(P[123])/);
  const priority = priorityMatch ? priorityMatch[1] : '';
  const notes = (cols[colIdx.notes] || '').trim();
  const factsCheckedOn = (cols[colIdx.facts_checked_on] || '').trim();
  const gated = url === '/victoria/shepparton/';

  if (!urlRegex.test(url)) {
    errors.push(`Row ${rowNum}: invalid URL "${url}"`);
  }

  return {
    row: rowNum,
    url,
    wave,
    status,
    template,
    question,
    secondaryQuestions,
    internalLinks,
    cta,
    priority,
    priorityAndIntent: priorityRaw,
    notes,
    factsCheckedOn,
    checkedOn: factsCheckedOn,
    gated,
  };
});

if (parsed.length !== 74) {
  errors.push(`Expected 74 rows, got ${parsed.length}`);
}

const waveCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
const urlSet = new Set();
for (const item of parsed) {
  waveCounts[item.wave] = (waveCounts[item.wave] || 0) + 1;
  if (urlSet.has(item.url)) {
    errors.push(`Duplicate URL: ${item.url}`);
  }
  urlSet.add(item.url);
}

if (
  waveCounts[0] !== 16 ||
  waveCounts[1] !== 19 ||
  waveCounts[2] !== 12 ||
  waveCounts[3] !== 17 ||
  waveCounts[4] !== 10
) {
  errors.push(
    `Wave counts mismatch: got wave0=${waveCounts[0]}, wave1=${waveCounts[1]}, wave2=${waveCounts[2]}, wave3=${waveCounts[3]}, wave4=${waveCounts[4]} (expected 16/19/12/17/10)`,
  );
}

for (const item of parsed) {
  for (const link of item.internalLinks) {
    if (link !== '*' && !urlSet.has(link)) {
      errors.push(`Row ${item.row} (${item.url}): internalLink "${link}" not in URL map`);
    }
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`import-url-map ERROR: ${e}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');

console.log(
  `url-map: ${parsed.length} rows (wave0 ${waveCounts[0]}, wave1 ${waveCounts[1]}, wave2 ${waveCounts[2]}, wave3 ${waveCounts[3]}, wave4 ${waveCounts[4]}); 0 errors`,
);

