import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const docsCsvPath = path.join(repoRoot, 'docs/postcodes.csv');
const dataCsvPath = path.join(siteRoot, 'src/data/postcodes.csv');
const outPath = path.join(siteRoot, 'src/data/postcodes.json');

if (!fs.existsSync(dataCsvPath)) {
  throw new Error(`Missing ${dataCsvPath}. Copy docs/postcodes.csv into site/src/data/postcodes.csv unchanged.`);
}

if (fs.existsSync(docsCsvPath)) {
  const docsHash = crypto.createHash('sha256').update(fs.readFileSync(docsCsvPath)).digest('hex');
  const dataHash = crypto.createHash('sha256').update(fs.readFileSync(dataCsvPath)).digest('hex');
  if (docsHash !== dataHash) {
    throw new Error(
      `SHA-256 mismatch between docs/postcodes.csv (${docsHash}) and site/src/data/postcodes.csv (${dataHash}). postcodes.csv is read-only.`,
    );
  }
}

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

function parseOtherLgas(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return [];
  return trimmed
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(/^(.+?)\s*\((\d+(?:\.\d+)?)%\)$/);
      if (!m) {
        throw new Error(`Unable to parse other_lgas entry: "${entry}" in "${raw}"`);
      }
      return {
        lga: m[1].trim(),
        pct: Number(m[2]),
      };
    });
}

const rawText = fs.readFileSync(dataCsvPath, 'utf8');
const allRows = parseCsv(rawText);
const headers = allRows[0].map((h) => h.trim());
const expectedHeaders = [
  'postcode',
  'veu_area',
  'reticulated_gas',
  'veu_climatic_region',
  'heat_pump_zone',
  'localities',
  'primary_lga',
  'primary_lga_share_pct',
  'other_lgas',
  'dwellings_2021',
  'lga_locality_source',
  'notes',
];

if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error(
    `Unexpected postcodes.csv headers: got ${JSON.stringify(headers)}, expected ${JSON.stringify(expectedHeaders)}`,
  );
}

const rowsObj = {};
for (const cols of allRows.slice(1)) {
  const postcode = (cols[0] || '').trim();
  if (!/^3\d{3}$/.test(postcode)) {
    throw new Error(`Invalid Victorian postcode "${postcode}" in postcodes.csv`);
  }
  if (rowsObj[postcode]) {
    throw new Error(`Duplicate postcode "${postcode}" in postcodes.csv`);
  }

  const area = (cols[1] || '').trim();
  if (area !== 'Metropolitan' && area !== 'Regional') {
    throw new Error(`Invalid veu_area "${area}" for postcode ${postcode}`);
  }

  const gasRaw = (cols[2] || '').trim();
  if (gasRaw !== 'Yes' && gasRaw !== 'No') {
    throw new Error(`Invalid reticulated_gas "${gasRaw}" for postcode ${postcode}`);
  }
  const reticulatedGas = gasRaw === 'Yes';

  const climaticRegion = (cols[3] || '').trim();
  if (!['Mild', 'Cold', 'Hot'].includes(climaticRegion)) {
    throw new Error(`Invalid veu_climatic_region "${climaticRegion}" for postcode ${postcode}`);
  }

  const hpZone = Number((cols[4] || '').trim());
  if (hpZone !== 4 && hpZone !== 5) {
    throw new Error(`Invalid heat_pump_zone "${cols[4]}" for postcode ${postcode}`);
  }

  const localitiesRaw = (cols[5] || '').trim();
  const localitiesList = localitiesRaw
    ? localitiesRaw.split(';').map((s) => s.trim()).filter(Boolean)
    : [];
  const primary_lga = (cols[6] || '').trim();
  const shareRaw = (cols[7] || '').trim();
  const primary_lga_share_pct = shareRaw === '' ? null : Number(shareRaw);
  if (primary_lga_share_pct !== null && Number.isNaN(primary_lga_share_pct)) {
    throw new Error(`Invalid primary_lga_share_pct "${shareRaw}" for postcode ${postcode}`);
  }

  const other_lgas = parseOtherLgas(cols[8]);
  const dwellingsRaw = (cols[9] || '').trim();
  const dwellings_2021 = Number(dwellingsRaw);
  if (dwellingsRaw === '' || Number.isNaN(dwellings_2021)) {
    throw new Error(`Invalid dwellings_2021 "${dwellingsRaw}" for postcode ${postcode}`);
  }

  const lga_locality_source = (cols[10] || '').trim();
  const notes = (cols[11] || '').trim();

  rowsObj[postcode] = {
    postcode,
    area,
    veu_area: area,
    reticulatedGas,
    reticulated_gas: reticulatedGas,
    climaticRegion,
    veu_climatic_region: climaticRegion,
    hpZone,
    heat_pump_zone: hpZone,
    localities: localitiesRaw,
    localitiesList,
    primary_lga,
    primary_lga_share_pct,
    other_lgas,
    dwellings_2021,
    lga_locality_source,
    notes,
  };
}

const count = Object.keys(rowsObj).length;
if (count !== 719) {
  throw new Error(`Expected 719 rows in postcodes.csv, got ${count}`);
}

const checkedOn = process.env.CHECKED_ON || '2026-11-14';
const output = {
  source: 'vic-veu-spec-v25',
  specVersion: '25.0',
  checkedOn,
  rows: rowsObj,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`build-postcodes: ${count} rows written to src/data/postcodes.json (checkedOn ${checkedOn})`);
