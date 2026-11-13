import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');

const inputArg = process.argv[2] || 'data-src/veu-spec-v25.pdf';
const pdfPath = path.resolve(process.cwd(), inputArg);

if (!fs.existsSync(pdfPath)) {
  throw new Error(`SPEC25 PDF not found at ${pdfPath}. Download it into site/data-src/veu-spec-v25.pdf first.`);
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

const map = new Map();
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
  if (map.has(postcode)) {
    if (JSON.stringify(map.get(postcode)) !== serialized) {
      conflicts++;
    }
  } else {
    map.set(postcode, entry);
  }
}

if (conflicts !== 0) {
  throw new Error(`Postcode extraction failed: found ${conflicts} conflicting duplicate postcode rows.`);
}
if (map.size !== 719) {
  throw new Error(`Postcode extraction failed: expected 719 unique postcodes, got ${map.size}.`);
}

const sortedRows = Object.fromEntries(
  [...map.entries()].sort(([a], [b]) => a.localeCompare(b)),
);

const checkedOn = process.env.CHECKED_ON || '2026-11-13';
const outputObj = {
  source: 'vic-veu-spec-v25',
  specVersion: '25.0',
  checkedOn,
  rows: sortedRows,
};

const outRel = 'src/data/vic-veu-postcodes.json';
const outPath = path.join(siteRoot, outRel);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(outputObj, null, 2)}\n`, 'utf8');

console.log(`veu-postcodes: ${map.size} rows, ${conflicts} conflicts, written ${outRel}`);
