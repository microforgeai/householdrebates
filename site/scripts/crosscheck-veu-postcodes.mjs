import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');

const inputArg = process.argv[2] || 'data-src/veu-spec-v25.pdf';
const pdfPath = path.resolve(siteRoot, inputArg);
const postcodesJsonPath = path.join(siteRoot, 'src/data/postcodes.json');

if (!fs.existsSync(postcodesJsonPath)) {
  throw new Error(`Missing ${postcodesJsonPath}. Run node scripts/build-postcodes.mjs first.`);
}
if (!fs.existsSync(pdfPath)) {
  throw new Error(`SPEC25 PDF not found at ${pdfPath}.`);
}

function extractRawText(filePath) {
  try {
    return execFileSync('pdftotext', ['-raw', filePath, '-'], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    if (process.platform === 'darwin') {
      const swiftScript = `
import Foundation
import PDFKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let doc = PDFDocument(url: url) else { exit(1) }
for i in 0..<doc.pageCount {
  if let s = doc.page(at: i)?.string {
    print(s)
  }
}
`;
      return execFileSync('/usr/bin/swift', ['-e', swiftScript, filePath], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      });
    }
    throw new Error('pdftotext (poppler) is required to extract text from the SPEC25 PDF.');
  }
}

const rawText = extractRawText(pdfPath);
const markerMatch = rawText.match(/Table A\s*[–-]\s*List of postcodes/i);
if (!markerMatch || markerMatch.index === undefined) {
  throw new Error('Could not find "Table A – List of postcodes" in SPEC25 PDF text.');
}

const afterMarker = rawText.slice(markerMatch.index);
const rowRegex = /^(3\d{3}) (Metropolitan|Regional) (Yes|No) (Mild|Cold|Hot) ([45])$/;

const pdfMap = new Map();
let conflicts = 0;

for (const rawLine of afterMarker.split(/\r?\n/)) {
  const line = rawLine.replace(/\s+/g, ' ').trim();
  const m = line.match(rowRegex);
  if (!m) continue;
  const [, postcode, area, gasStr, climaticRegion, hpZoneStr] = m;
  const entry = {
    area,
    reticulatedGas: gasStr === 'Yes',
    climaticRegion,
    hpZone: Number(hpZoneStr),
  };
  const serialized = JSON.stringify(entry);
  if (pdfMap.has(postcode)) {
    if (JSON.stringify(pdfMap.get(postcode)) !== serialized) {
      conflicts++;
    }
  } else {
    pdfMap.set(postcode, entry);
  }
}

if (conflicts !== 0) {
  throw new Error(`SPEC25 PDF parse failed: found ${conflicts} conflicting duplicate postcode rows.`);
}
if (pdfMap.size !== 719) {
  throw new Error(`SPEC25 PDF parse failed: expected 719 unique postcodes, got ${pdfMap.size}.`);
}

const postcodesData = JSON.parse(fs.readFileSync(postcodesJsonPath, 'utf8'));
const csvRows = postcodesData.rows || {};
const csvKeys = Object.keys(csvRows);

const mismatches = [];

if (csvKeys.length !== pdfMap.size) {
  mismatches.push(`Row count mismatch: postcodes.json has ${csvKeys.length}, SPEC25 PDF has ${pdfMap.size}`);
}

for (const [pc, pdfEntry] of pdfMap.entries()) {
  const csvRow = csvRows[pc];
  if (!csvRow) {
    mismatches.push(`Postcode ${pc} is in SPEC25 PDF but missing from postcodes.json`);
    continue;
  }
  if (
    csvRow.area !== pdfEntry.area ||
    csvRow.reticulatedGas !== pdfEntry.reticulatedGas ||
    csvRow.climaticRegion !== pdfEntry.climaticRegion ||
    csvRow.hpZone !== pdfEntry.hpZone
  ) {
    mismatches.push(
      `Postcode ${pc} mismatch vs SPEC25 PDF: CSV=${JSON.stringify({
        area: csvRow.area,
        reticulatedGas: csvRow.reticulatedGas,
        climaticRegion: csvRow.climaticRegion,
        hpZone: csvRow.hpZone,
      })} vs PDF=${JSON.stringify(pdfEntry)}`,
    );
  }
}

if (mismatches.length > 0) {
  for (const m of mismatches) {
    console.error(`STOP mismatch: ${m}`);
  }
  process.exit(1);
}

console.log(`postcodes: ${csvKeys.length} rows; 0 mismatches against the SPEC25 parse`);
