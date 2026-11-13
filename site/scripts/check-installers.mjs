import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const siteInstallersDir = path.join(repoRoot, 'site/src/content/installers');
const apiInstallersPath = path.join(repoRoot, 'api/installers.json');

const yamlFiles = fs.existsSync(siteInstallersDir)
  ? fs.readdirSync(siteInstallersDir).filter((f) => f.endsWith('.yaml'))
  : [];

const siteInstallers = yamlFiles
  .map((f) => YAML.parse(fs.readFileSync(path.join(siteInstallersDir, f), 'utf8')))
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

const apiInstallers = JSON.parse(fs.readFileSync(apiInstallersPath, 'utf8')).sort((a, b) =>
  String(a.id).localeCompare(String(b.id)),
);

if (JSON.stringify(siteInstallers) !== JSON.stringify(apiInstallers)) {
  throw new Error(
    `Installer mismatch: site/src/content/installers has ${siteInstallers.length} entries while api/installers.json has ${apiInstallers.length} entries (or fields differ).`,
  );
}

console.log(`check-installers: OK (${siteInstallers.length} active installers synchronized between site and api).`);
