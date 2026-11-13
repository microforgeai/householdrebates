import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const siteConsentFile = path.join(repoRoot, 'site/src/data/consent/vic-v1.ts');
const apiConsentFile = path.join(repoRoot, 'api/src/consent.ts');

function extractTemplateBlock(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const CONSENT_TEMPLATE_V1 = \{([\s\S]*?)\} as const;/);
  if (!match) {
    throw new Error(`CONSENT_TEMPLATE_V1 not found in ${filePath}`);
  }
  return match[1].trim();
}

const siteBlock = extractTemplateBlock(siteConsentFile);
const apiBlock = extractTemplateBlock(apiConsentFile);

const siteHash = crypto.createHash('sha256').update(siteBlock, 'utf8').digest('hex');
const apiHash = crypto.createHash('sha256').update(apiBlock, 'utf8').digest('hex');

if (siteHash !== apiHash) {
  throw new Error(
    `Consent template mismatch between site (${siteHash}) and api (${apiHash})!`,
  );
}

console.log(`check-consent-hash: OK (SHA-256 ${siteHash.slice(0, 16)}… matches across site and api).`);
