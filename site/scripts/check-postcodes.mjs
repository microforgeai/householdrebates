import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const docsCsvPath = path.join(repoRoot, 'docs/postcodes.csv');
const dataCsvPath = path.join(siteRoot, 'src/data/postcodes.csv');
const postcodesJsonPath = path.join(siteRoot, 'src/data/postcodes.json');
const areasDir = path.join(siteRoot, 'src/content/areas/vic');

const maxAgeDays = Number(process.env.MAX_FIGURE_AGE_DAYS || 45);
const now = new Date();
const melbStr = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Melbourne',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);
const [mY, mM, mD] = melbStr.split('-').map(Number);
const todayMelbUtc = Date.UTC(mY, mM - 1, mD);

const diffs = [];
function expectEq(label, actual, expected) {
  const aStr = JSON.stringify(actual);
  const eStr = JSON.stringify(expected);
  if (aStr !== eStr) {
    diffs.push(`${label}: got ${aStr}, expected ${eStr}`);
  }
}

// 1. Verify docs/postcodes.csv === site/src/data/postcodes.csv and freshness
if (!fs.existsSync(dataCsvPath) || !fs.existsSync(postcodesJsonPath)) {
  throw new Error('Missing src/data/postcodes.csv or src/data/postcodes.json');
}
if (fs.existsSync(docsCsvPath)) {
  const h1 = crypto.createHash('sha256').update(fs.readFileSync(docsCsvPath)).digest('hex');
  const h2 = crypto.createHash('sha256').update(fs.readFileSync(dataCsvPath)).digest('hex');
  expectEq('SHA-256(docs/postcodes.csv vs src/data/postcodes.csv)', h2, h1);
}

const pcData = JSON.parse(fs.readFileSync(postcodesJsonPath, 'utf8'));
const checkedMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(pcData.checkedOn || ''));
if (!checkedMatch) {
  diffs.push(`postcodes.json missing valid checkedOn (${pcData.checkedOn})`);
} else {
  const checkedUtc = Date.UTC(Number(checkedMatch[1]), Number(checkedMatch[2]) - 1, Number(checkedMatch[3]));
  const ageDays = Math.floor((todayMelbUtc - checkedUtc) / (1000 * 60 * 60 * 24));
  if (ageDays > maxAgeDays) {
    diffs.push(`postcodes.json checkedOn ${pcData.checkedOn} is stale (${ageDays} days > ${maxAgeDays} days)`);
  }
}

const rowsByPc = pcData.rows;
const allRows = Object.values(rowsByPc).sort((a, b) => a.postcode.localeCompare(b.postcode));

const byLga = (lga) =>
  allRows.filter((r) => r.primary_lga === lga).sort((a, b) => a.postcode.localeCompare(b.postcode));
const byLgas = (lgas) =>
  allRows.filter((r) => lgas.includes(r.primary_lga)).sort((a, b) => a.postcode.localeCompare(b.postcode));
const pcsOf = (list) => list.map((r) => r.postcode);

// 2. Statewide totals (Row 54 /victoria/postcode/ & Row 74 /victoria/lpg-homes/)
expectEq('Statewide total postcodes', allRows.length, 719);
expectEq('Statewide Metropolitan count', allRows.filter((r) => r.area === 'Metropolitan').length, 281);
expectEq('Statewide Regional count', allRows.filter((r) => r.area === 'Regional').length, 438);
expectEq('Statewide reticulated gas count', allRows.filter((r) => r.reticulatedGas).length, 406);
expectEq('Statewide no-reticulated-gas count', allRows.filter((r) => !r.reticulatedGas).length, 313);
expectEq('Statewide Mild count', allRows.filter((r) => r.climaticRegion === 'Mild').length, 404);
expectEq('Statewide Cold count', allRows.filter((r) => r.climaticRegion === 'Cold').length, 268);
expectEq('Statewide Hot count', allRows.filter((r) => r.climaticRegion === 'Hot').length, 47);
expectEq('Statewide heat pump zone 4 count', allRows.filter((r) => r.hpZone === 4).length, 608);
expectEq('Statewide heat pump zone 5 count', allRows.filter((r) => r.hpZone === 5).length, 111);
expectEq('Statewide zero-dwelling PO-box postcodes', allRows.filter((r) => r.dwellings_2021 === 0).length, 25);

const figuresYamlPath = path.join(siteRoot, 'src/content/figures/vic-veu.yaml');
if (fs.existsSync(figuresYamlPath)) {
  const figs = YAML.parse(fs.readFileSync(figuresYamlPath, 'utf8')) || [];
  const noGasFig = figs.find((f) => f.id === 'vic-veu-table-a-no-gas-postcodes');
  const totalPcFig = figs.find((f) => f.id === 'vic-veu-table-a-total-postcodes');
  expectEq(
    'vic-veu.yaml vic-veu-table-a-no-gas-postcodes vs postcodes.csv',
    noGasFig?.amountMax,
    allRows.filter((r) => !r.reticulatedGas).length,
  );
  expectEq('vic-veu.yaml vic-veu-table-a-total-postcodes vs postcodes.csv', totalPcFig?.amountMax, allRows.length);
}

// 3. Location rows in docs/url-map.csv against postcodes.csv
function parseCsvSimple(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const norm = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (inQuotes) {
      if (ch === '"') {
        if (norm[i + 1] === '"') {
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
      if (row.length > 1 || row[0] !== '') rows.push(row);
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

const urlMapCsvPath = path.join(repoRoot, 'docs/url-map.csv');
const csvRows = parseCsvSimple(fs.readFileSync(urlMapCsvPath, 'utf8'));
const csvHdr = csvRows[0].map((h) => h.trim());
const slugIdx = csvHdr.indexOf('url_slug');
const factsIdx = csvHdr.indexOf('key_verified_facts_with_source_urls');
const notesIdx = csvHdr.indexOf('notes');
const mapRowsByUrl = new Map(
  csvRows.slice(1).map((cols) => [
    (cols[slugIdx] || '').trim(),
    { verifiedFacts: cols[factsIdx] || '', notes: cols[notesIdx] || '' },
  ]),
);
function requireMapFact(url, substring) {
  const row = mapRowsByUrl.get(url);
  if (!row) {
    diffs.push(`Missing ${url} in docs/url-map.csv`);
    return;
  }
  const hay = `${row.verifiedFacts} || ${row.notes}`;
  if (!hay.includes(substring)) {
    diffs.push(`${url}: docs/url-map.csv row missing expected fact "${substring}"`);
  }
}

// Frankston (row 10) & Mornington Peninsula (row 15)
const frankston = byLga('Frankston');
expectEq('Frankston count', frankston.length, 5);
expectEq('Frankston postcodes', pcsOf(frankston), ['3198', '3199', '3200', '3201', '3910']);

const mornPen = byLga('Mornington Peninsula');
expectEq('Mornington Peninsula count', mornPen.length, 25);

// Geelong (row 12 / map changes table: 14 postcodes, 3212–3227 excluding 3221 and 3225)
const geelong = byLga('Greater Geelong');
expectEq('Greater Geelong count', geelong.length, 14);
expectEq(
  'Greater Geelong postcodes (without 3221/3225)',
  pcsOf(geelong),
  ['3212', '3213', '3214', '3215', '3216', '3217', '3218', '3219', '3220', '3222', '3223', '3224', '3226', '3227'],
);
expectEq('3221 primary_lga', rowsByPc['3221']?.primary_lga, 'Surf Coast');
expectEq('3225 primary_lga', rowsByPc['3225']?.primary_lga, 'Queenscliffe');
expectEq(
  'Greater Geelong all Regional + Mild + zone 4',
  geelong.every((r) => r.area === 'Regional' && r.climaticRegion === 'Mild' && r.hpZone === 4),
  true,
);

// Ballarat (row 46)
requireMapFact('/victoria/ballarat/', '8 Ballarat-council postcodes');
const ballarat = byLga('Ballarat');
expectEq('Ballarat count', ballarat.length, 8);
expectEq('Ballarat all Regional + Cold', ballarat.every((r) => r.area === 'Regional' && r.climaticRegion === 'Cold'), true);
expectEq('Ballarat gas + zone 5', pcsOf(ballarat.filter((r) => r.reticulatedGas && r.hpZone === 5)), [
  '3350',
  '3352',
  '3355',
  '3356',
  '3357',
]);
expectEq('Ballarat gas + zone 4', pcsOf(ballarat.filter((r) => r.reticulatedGas && r.hpZone === 4)), ['3358']);
expectEq('Ballarat no-gas PO-box', pcsOf(ballarat.filter((r) => !r.reticulatedGas)), ['3353', '3354']);

// Bendigo (row 47)
requireMapFact('/victoria/bendigo/', '11 Greater Bendigo postcodes');
const bendigo = byLga('Greater Bendigo');
expectEq('Greater Bendigo count', bendigo.length, 11);
expectEq(
  'Greater Bendigo all Regional + Cold + zone 4',
  bendigo.every((r) => r.area === 'Regional' && r.climaticRegion === 'Cold' && r.hpZone === 4),
  true,
);
expectEq('Greater Bendigo gas', pcsOf(bendigo.filter((r) => r.reticulatedGas)), ['3550', '3551', '3555', '3556']);
expectEq('Greater Bendigo no gas', pcsOf(bendigo.filter((r) => !r.reticulatedGas)), [
  '3515',
  '3523',
  '3552',
  '3554',
  '3557',
  '3558',
  '3570',
]);

// Shepparton (row 48)
requireMapFact('/victoria/shepparton/', '13 Greater Shepparton postcodes');
const shepparton = byLga('Greater Shepparton');
expectEq('Greater Shepparton count', shepparton.length, 13);
expectEq(
  'Greater Shepparton all Regional + Cold + zone 4',
  shepparton.every((r) => r.area === 'Regional' && r.climaticRegion === 'Cold' && r.hpZone === 4),
  true,
);
expectEq('Greater Shepparton gas', pcsOf(shepparton.filter((r) => r.reticulatedGas)), [
  '3610',
  '3616',
  '3618',
  '3629',
  '3630',
  '3631',
]);
expectEq('Greater Shepparton no gas', pcsOf(shepparton.filter((r) => !r.reticulatedGas)), [
  '3614',
  '3617',
  '3632',
  '3633',
  '3634',
  '3646',
  '3647',
]);

// Wyndham (row 49)
requireMapFact('/victoria/wyndham/', '5 Wyndham postcodes');
const wyndham = byLga('Wyndham');
expectEq('Wyndham count', wyndham.length, 5);
expectEq(
  'Wyndham all gas + Mild + zone 4',
  wyndham.every((r) => r.reticulatedGas && r.climaticRegion === 'Mild' && r.hpZone === 4),
  true,
);
expectEq('Wyndham Metro', pcsOf(wyndham.filter((r) => r.area === 'Metropolitan')), ['3024', '3027', '3029', '3030']);
expectEq('Wyndham Regional', pcsOf(wyndham.filter((r) => r.area === 'Regional')), ['3211']);

// Casey (row 50)
requireMapFact('/victoria/casey/', '11 Casey postcodes');
const casey = byLga('Casey');
expectEq('Casey count', casey.length, 11);
expectEq(
  'Casey all Metro + gas + zone 4',
  casey.every((r) => r.area === 'Metropolitan' && r.reticulatedGas && r.hpZone === 4),
  true,
);
expectEq('Casey Cold', pcsOf(casey.filter((r) => r.climaticRegion === 'Cold')), ['3980']);

// Whittlesea (row 51)
requireMapFact('/victoria/whittlesea/', '11 Whittlesea postcodes');
const whittlesea = byLga('Whittlesea');
expectEq('Whittlesea count', whittlesea.length, 11);
expectEq(
  'Whittlesea all Metro + gas + Mild + zone 4',
  whittlesea.every((r) => r.area === 'Metropolitan' && r.reticulatedGas && r.climaticRegion === 'Mild' && r.hpZone === 4),
  true,
);

// Yarra Ranges (row 52)
requireMapFact('/victoria/yarra-ranges/', '26 Yarra Ranges postcodes');
const yarraRanges = byLga('Yarra Ranges');
expectEq('Yarra Ranges count', yarraRanges.length, 26);
expectEq('Yarra Ranges all gas', yarraRanges.every((r) => r.reticulatedGas), true);
expectEq('Yarra Ranges Cold count', yarraRanges.filter((r) => r.climaticRegion === 'Cold').length, 15);
expectEq('Yarra Ranges Mild count', yarraRanges.filter((r) => r.climaticRegion === 'Mild').length, 11);
expectEq('Yarra Ranges zone 5', pcsOf(yarraRanges.filter((r) => r.hpZone === 5)), [
  '3139',
  '3140',
  '3158',
  '3160',
  '3770',
  '3775',
  '3777',
]);
expectEq('Yarra Ranges Regional', pcsOf(yarraRanges.filter((r) => r.area === 'Regional')), ['3799']);

// Solstice (row 53)
requireMapFact('/victoria/solstice-gas-shutdown-towns/', 'All 10 postcodes');
const solsticeExpected = [
  ['3515', 'Greater Bendigo', 'Cold'],
  ['3523', 'Greater Bendigo', 'Cold'],
  ['3585', 'Swan Hill', 'Hot'],
  ['3549', 'Swan Hill', 'Hot'],
  ['3463', 'Mount Alexander', 'Cold'],
  ['3579', 'Gannawarra', 'Hot'],
  ['3638', 'Moira', 'Cold'],
  ['3264', 'Corangamite', 'Mild'],
  ['3909', 'East Gippsland', 'Mild'],
  ['3888', 'East Gippsland', 'Mild'],
];
for (const [pc, lga, clim] of solsticeExpected) {
  const r = rowsByPc[pc];
  expectEq(`Solstice ${pc} area/gas/lga/climate`, [r?.area, r?.reticulatedGas, r?.primary_lga, r?.climaticRegion], [
    'Regional',
    false,
    lga,
    clim,
  ]);
}

// North-West Corridor (row 56)
for (const pc of ['3023', '3335', '3336', '3337', '3338', '3427', '3428', '3429']) {
  const r = rowsByPc[pc];
  expectEq(`Corridor ${pc}`, [r?.area, r?.reticulatedGas, r?.climaticRegion, r?.hpZone], [
    'Metropolitan',
    true,
    'Mild',
    4,
  ]);
}
for (const pc of ['3431', '3438']) {
  const r = rowsByPc[pc];
  expectEq(`Corridor ${pc}`, [r?.area, r?.climaticRegion, r?.hpZone], ['Metropolitan', 'Cold', 5]);
}
expectEq('Corridor 3437', [rowsByPc['3437']?.area, rowsByPc['3437']?.climaticRegion, rowsByPc['3437']?.hpZone], [
  'Regional',
  'Cold',
  5,
]);
expectEq('Corridor 3430 gas', rowsByPc['3430']?.reticulatedGas, false);
expectEq('Corridor 3427 split', [rowsByPc['3427']?.primary_lga, rowsByPc['3427']?.primary_lga_share_pct], ['Melton', 93]);

// Macedon Ranges (row 57)
requireMapFact('/victoria/macedon-ranges/', "12 of the shire's 13 postcodes are 'Cold'");
const macedon = byLga('Macedon Ranges');
expectEq('Macedon Ranges count', macedon.length, 13);
expectEq('Macedon Ranges Cold count', macedon.filter((r) => r.climaticRegion === 'Cold').length, 12);
expectEq('Macedon Ranges no gas', pcsOf(macedon.filter((r) => !r.reticulatedGas)), ['3430', '3432', '3433', '3446']);

// Mitchell (row 58)
requireMapFact('/victoria/mitchell/', '12 Mitchell-council postcodes');
const mitchell = byLga('Mitchell');
expectEq('Mitchell count', mitchell.length, 12);
expectEq('Mitchell includes 3661 (no gas)', [pcsOf(mitchell).includes('3661'), rowsByPc['3661']?.reticulatedGas], [
  true,
  false,
]);
expectEq('Mitchell Metro/Regional/zone4', [
  mitchell.filter((r) => r.area === 'Metropolitan').length,
  mitchell.filter((r) => r.area === 'Regional').length,
  mitchell.every((r) => r.hpZone === 4),
], [4, 8, true]);
expectEq('Mitchell no gas', pcsOf(mitchell.filter((r) => !r.reticulatedGas)), [
  '3521',
  '3522',
  '3661',
  '3662',
  '3758',
  '3762',
]);

// Latrobe Valley (row 59)
requireMapFact('/victoria/latrobe-valley/', '9 Latrobe-council postcodes');
const latrobe = byLga('Latrobe');
expectEq('Latrobe count', latrobe.length, 9);
expectEq('Latrobe includes 3841 (no gas)', [pcsOf(latrobe).includes('3841'), rowsByPc['3841']?.reticulatedGas], [
  true,
  false,
]);
expectEq(
  'Latrobe all Regional + Mild',
  latrobe.every((r) => r.area === 'Regional' && r.climaticRegion === 'Mild'),
  true,
);
expectEq('Latrobe no gas', pcsOf(latrobe.filter((r) => !r.reticulatedGas)), ['3841', '3854', '3856', '3869', '3870']);

// Mildura (row 60)
requireMapFact('/victoria/mildura/', 'All 12 Mildura-council postcodes');
const mildura = byLga('Mildura');
expectEq('Mildura count', mildura.length, 12);
expectEq(
  'Mildura all Regional + Hot + zone 4',
  mildura.every((r) => r.area === 'Regional' && r.climaticRegion === 'Hot' && r.hpZone === 4),
  true,
);
expectEq('Mildura gas count', mildura.filter((r) => r.reticulatedGas).length, 7);
expectEq('Mildura no-gas count', mildura.filter((r) => !r.reticulatedGas).length, 5);

// Plan Melbourne Metro Hubs (rows 61–64 + inner Melbourne 52) from metro-regions.json
const metroRegionsPath = path.join(siteRoot, 'src/data/metro-regions.json');
const linksDataPath = path.join(siteRoot, 'src/lib/checker/links-data.json');
if (!fs.existsSync(metroRegionsPath)) {
  throw new Error('Missing src/data/metro-regions.json');
}
const metroRegions = JSON.parse(fs.readFileSync(metroRegionsPath, 'utf8'));
const mrChecked = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(metroRegions.checkedOn || ''));
if (!mrChecked) {
  diffs.push(`metro-regions.json missing valid checkedOn (${metroRegions.checkedOn})`);
} else {
  const mrUtc = Date.UTC(Number(mrChecked[1]), Number(mrChecked[2]) - 1, Number(mrChecked[3]));
  const mrAge = Math.floor((todayMelbUtc - mrUtc) / (1000 * 60 * 60 * 24));
  if (mrAge > maxAgeDays) {
    diffs.push(`metro-regions.json checkedOn ${metroRegions.checkedOn} is stale (${mrAge} days > ${maxAgeDays} days)`);
  }
}

const regionBySlug = new Map((metroRegions.regions || []).map((r) => [r.slug, r]));
expectEq(
  'metro-regions.json slugs',
  [...regionBySlug.keys()],
  ['melbourne', 'melbourne-north', 'melbourne-west', 'melbourne-east', 'melbourne-south-east'],
);

if (fs.existsSync(linksDataPath)) {
  const linksData = JSON.parse(fs.readFileSync(linksDataPath, 'utf8'));
  const expectedMetroHubByLga = {};
  for (const reg of metroRegions.regions || []) {
    for (const lga of reg.lgas) {
      expectedMetroHubByLga[lga] = { url: reg.url, label: reg.checkerLabel };
    }
  }
  expectEq('links-data.json metroHubByLga vs metro-regions.json', linksData.metroHubByLga, expectedMetroHubByLga);
}

const north = byLgas(regionBySlug.get('melbourne-north').lgas);
expectEq('Melbourne North stats', [
  north.length,
  north.filter((r) => r.area === 'Metropolitan').length,
  north.filter((r) => r.area === 'Regional').length,
  north.filter((r) => r.area === 'Regional').every((r) => r.primary_lga === 'Mitchell'),
  north.filter((r) => !r.reticulatedGas).length,
  north.filter((r) => r.climaticRegion === 'Cold').length,
], [66, 58, 8, true, 6, 9]);

const west = byLgas(regionBySlug.get('melbourne-west').lgas);
expectEq('Melbourne West stats', [
  west.length,
  west.every((r) => r.climaticRegion === 'Mild' && r.reticulatedGas),
  pcsOf(west.filter((r) => r.area === 'Regional')),
], [34, true, ['3211']]);

const east = byLgas(regionBySlug.get('melbourne-east').lgas);
expectEq('Melbourne East stats', [
  east.length,
  east.filter((r) => r.area === 'Metropolitan').length,
  pcsOf(east.filter((r) => r.area === 'Regional')),
  east.every((r) => r.reticulatedGas),
  east.filter((r) => r.climaticRegion === 'Cold').length,
  pcsOf(east.filter((r) => r.hpZone === 5)),
], [65, 64, ['3799'], true, 15, ['3139', '3140', '3158', '3160', '3770', '3775', '3777']]);

const southEast = byLgas(regionBySlug.get('melbourne-south-east').lgas);
expectEq('Melbourne South-East stats', [
  southEast.length,
  southEast.every((r) => r.reticulatedGas),
  pcsOf(southEast.filter((r) => r.area === 'Regional')),
  pcsOf(southEast.filter((r) => r.climaticRegion === 'Cold')),
], [67, true, ['3981'], ['3980', '3981']]);

const innerMelb = byLgas(regionBySlug.get('melbourne').lgas);
expectEq('Inner Melbourne hub stats', [
  innerMelb.length,
  innerMelb.every((r) => r.area === 'Metropolitan' && r.reticulatedGas && r.climaticRegion === 'Mild' && r.hpZone === 4),
], [52, true]);

// 4. Verify area MDX files' postcodes match postcodes.csv
const areaSlugExpectedPcs = {
  melbourne: pcsOf(innerMelb),
  geelong: pcsOf(geelong),
  frankston: pcsOf(frankston),
  'mornington-peninsula': pcsOf(mornPen),
  ballarat: pcsOf(ballarat),
  bendigo: pcsOf(bendigo),
  shepparton: pcsOf(shepparton),
  wyndham: pcsOf(wyndham),
  casey: pcsOf(casey),
  whittlesea: pcsOf(whittlesea),
  'yarra-ranges': pcsOf(yarraRanges),
  'solstice-gas-shutdown-towns': solsticeExpected.map(([pc]) => pc),
  'north-west-corridor': [
    '3023',
    '3335',
    '3336',
    '3337',
    '3338',
    '3427',
    '3428',
    '3429',
    '3430',
    '3431',
    '3437',
    '3438',
  ],
  'macedon-ranges': pcsOf(macedon),
  mitchell: pcsOf(mitchell),
  'latrobe-valley': pcsOf(latrobe),
  mildura: pcsOf(mildura),
  'melbourne-north': pcsOf(north),
  'melbourne-west': pcsOf(west),
  'melbourne-east': pcsOf(east),
  'melbourne-south-east': pcsOf(southEast),
};

for (const file of fs.readdirSync(areasDir).filter((f) => f.endsWith('.mdx'))) {
  const full = path.join(areasDir, file);
  const raw = fs.readFileSync(full, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  const fm = YAML.parse(fmMatch[1]);
  const slug = fm.slug;
  const pcs = (fm.postcodes || []).map(String);

  for (const pc of pcs) {
    if (!rowsByPc[pc]) {
      diffs.push(`areas/vic/${file}: postcode ${pc} missing from postcodes.csv`);
    }
  }

  if (areaSlugExpectedPcs[slug]) {
    if (slug === 'solstice-gas-shutdown-towns') {
      expectEq(`areas/vic/${file} postcodes`, [...pcs].sort(), [...areaSlugExpectedPcs[slug]].sort());
    } else {
      expectEq(`areas/vic/${file} postcodes`, [...pcs].sort(), areaSlugExpectedPcs[slug]);
    }
  }

  // 5. When dist/ is built, verify rendered <tr data-postcode> rows in dist/victoria/<slug>/index.html match postcodes.json
  const distHtmlPath = path.join(siteRoot, 'dist/victoria', slug, 'index.html');
  if (fs.existsSync(distHtmlPath) && fm.veuPostcodeTable !== false) {
    const html = fs.readFileSync(distHtmlPath, 'utf8');
    const secMatch = html.match(/<section\b[^>]*\bdata-postcode-table\b[^>]*>([\s\S]*?)<\/section>/i);
    if (!secMatch) {
      diffs.push(`dist/victoria/${slug}/index.html: missing <section data-postcode-table>`);
    } else {
      const decodeHtml = (s) =>
        s
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;|&apos;/g, "'")
          .replace(/&nbsp;/g, ' ');
      const formatExpectedCouncil = (row) => {
        const primary = row.primary_lga ?? 'Unknown';
        if (row.primary_lga_share_pct === null || row.primary_lga_share_pct === undefined) {
          return `${primary} (PO box, indicative)`;
        }
        if (row.other_lgas && row.other_lgas.length > 0) {
          const others = row.other_lgas.map((o) => `${o.lga} ${o.pct}%`).join(', ');
          return `${primary} ${row.primary_lga_share_pct}% (${others})`;
        }
        return `${primary} (${row.primary_lga_share_pct}%)`;
      };
      const trMatches = [...secMatch[1].matchAll(/<tr\b[^>]*\bdata-postcode=["'](\d{4})["'][^>]*>([\s\S]*?)<\/tr>/gi)];
      expectEq(
        `dist/victoria/${slug}/index.html rendered postcode order`,
        trMatches.map((m) => m[1]),
        pcs,
      );
      for (const tr of trMatches) {
        const pc = tr[1];
        const row = rowsByPc[pc];
        if (!row) continue;
        const cells = [...tr[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
          decodeHtml(c[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(),
        );
        const expectedLocalities =
          row.localitiesList && row.localitiesList.length > 0
            ? row.localitiesList.join(', ')
            : String(row.localities ?? '').replace(/;\s*/g, ', ');
        const expectedCells = [
          pc,
          expectedLocalities,
          formatExpectedCouncil(row),
          row.area,
          row.reticulatedGas ? 'Yes' : 'No',
          row.climaticRegion,
          `Zone ${row.hpZone}`,
        ];
        expectEq(`dist/victoria/${slug}/index.html row ${pc}`, cells, expectedCells);
      }
    }
  }
}

if (diffs.length > 0) {
  console.error(`check-postcodes FAILED with ${diffs.length} difference(s):`);
  for (const d of diffs) {
    console.error(`  - ${d}`);
  }
  process.exit(1);
}

console.log(
  `check-postcodes: every location row matches postcodes.csv (0 differences; Melbourne ${innerMelb.length}, North ${north.length}, West ${west.length}, East ${east.length}, South-East ${southEast.length}, Mildura ${mildura.length}, Mitchell ${mitchell.length} incl. 3661, Latrobe ${latrobe.length} incl. 3841, Geelong ${geelong.length} without 3221/3225)`,
);
