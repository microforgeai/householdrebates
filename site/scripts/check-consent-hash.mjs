import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const siteConsentFile = path.join(repoRoot, 'site/src/data/consent/vic-v1.ts');
const apiConsentFile = path.join(repoRoot, 'api/src/consent.ts');
const siteAlertsConsentFile = path.join(repoRoot, 'site/src/data/consent/alerts-v1.ts');
const apiAlertsConsentFile = path.join(repoRoot, 'api/src/alerts/consent.ts');

function extractTemplateBlock(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const CONSENT_TEMPLATE_V1 = \{([\s\S]*?)\} as const;/);
  if (!match) {
    throw new Error(`CONSENT_TEMPLATE_V1 not found in ${filePath}`);
  }
  return match[1].trim();
}

function extractAlertsConsentBlock(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const ALERTS_CONSENT_TEMPLATES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/);
  if (!match) {
    throw new Error(`ALERTS_CONSENT_TEMPLATES not found in ${filePath}`);
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

const siteAlertsBlock = extractAlertsConsentBlock(siteAlertsConsentFile);
const apiAlertsBlock = extractAlertsConsentBlock(apiAlertsConsentFile);

const siteAlertsHash = crypto.createHash('sha256').update(siteAlertsBlock, 'utf8').digest('hex');
const apiAlertsHash = crypto.createHash('sha256').update(apiAlertsBlock, 'utf8').digest('hex');

if (siteAlertsHash !== apiAlertsHash) {
  throw new Error(
    `Alerts consent template mismatch between site (${siteAlertsHash}) and api (${apiAlertsHash})!`,
  );
}

console.log(
  `check-consent-hash: OK (leads SHA-256 ${siteHash.slice(0, 16)}…, alerts SHA-256 ${siteAlertsHash.slice(0, 16)}… match across site and api).`,
);
