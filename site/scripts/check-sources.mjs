import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcesDir = path.resolve(__dirname, '../src/content/sources');

const files = fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yaml'));
let failed = 0;

for (const file of files) {
  const data = YAML.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8'));
  try {
    const res = await fetch(data.url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'HouseholdRebates-SourceCheck/1.0' },
    });
    console.log(`${res.status} ${file} -> ${data.url}`);
    if (!res.ok && res.status !== 403 && res.status !== 405) {
      failed++;
    }
  } catch (err) {
    console.error(`ERR ${file} -> ${data.url}: ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}
