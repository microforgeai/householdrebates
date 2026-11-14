import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const siteConsentFile = path.join(repoRoot, 'site/src/data/consent/vic-v1.ts');
const apiConsentFile = path.join(repoRoot, 'api/src/consent.ts');
const leadFormFile = path.join(repoRoot, 'site/src/components/LeadForm.astro');

const siteAlertsConsentFile = path.join(repoRoot, 'site/src/data/consent/alerts-v1.ts');
const apiAlertsConsentFile = path.join(repoRoot, 'api/src/alerts/consent.ts');
const alertSignupIslandFile = path.join(repoRoot, 'site/src/components/AlertSignupIsland.astro');

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function extractTemplateBlock(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const CONSENT_TEMPLATE_V2 = \{([\s\S]*?)\} as const;/);
  if (!match) {
    throw new Error(`CONSENT_TEMPLATE_V2 not found in ${filePath}`);
  }
  return match[1].trim();
}

function parseTsStringProperty(block, propName, filePath) {
  const re = new RegExp(`${propName}:\\s*(['"\`])([\\s\\S]*?)\\1\\s*,`, 'm');
  const m = block.match(re);
  if (!m) {
    throw new Error(`Property "${propName}" not found in CONSENT_TEMPLATE_V2 (${filePath})`);
  }
  return m[2];
}

function extractAlertsConsentBlock(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(
    /export const ALERTS_CONSENT_TEMPLATES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\};/,
  );
  if (!match) {
    throw new Error(`ALERTS_CONSENT_TEMPLATES not found in ${filePath}`);
  }
  return match[1].trim();
}

function extractAlertsV2Text(block, filePath) {
  const m = block.match(/\[ALERTS_CONSENT_VERSION_V2\]:\s*(['"`])([\s\S]*?)\1\s*,?/m);
  if (!m) {
    throw new Error(`ALERTS_CONSENT_VERSION_V2 entry not found in ${filePath}`);
  }
  return m[2];
}

function extractBalancedElementByAttr(markup, tagName, attrName, filePath) {
  const openRe = new RegExp(`<${tagName}\\b[^>]*\\b${attrName}\\b[^>]*>`, 'i');
  const openMatch = openRe.exec(markup);
  if (!openMatch) {
    throw new Error(`Missing <${tagName} ${attrName}> in ${filePath}`);
  }
  let depth = 1;
  let pos = openMatch.index + openMatch[0].length;
  const tagScan = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagScan.lastIndex = pos;
  let tm;
  while ((tm = tagScan.exec(markup)) !== null) {
    if (tm[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        return markup.slice(openMatch.index + openMatch[0].length, tm.index);
      }
    } else if (!tm[0].endsWith('/>')) {
      depth++;
    }
  }
  throw new Error(`Unclosed <${tagName} ${attrName}> in ${filePath}`);
}

function normalizeLeadFormConsentFragment(rawFragment) {
  return rawFragment
    .replace(/<strong\b[^>]*\bdata-installer-list\b[^>]*>\s*\{installerList\}\s*<\/strong>/g, '{{INSTALLER_LIST}}')
    .replace(/<strong\b[^>]*\bdata-ap-list\b[^>]*>\s*\{apList\}\s*<\/strong>/g, '{{AP_LIST}}')
    .replace(/<span\b[^>]*\bdata-server-country\b[^>]*>\s*\{serverCountry\}\s*<\/span>/g, '{{SERVER_COUNTRY}}')
    .replace(
      /<span\b[^>]*\bdata-email-provider-country\b[^>]*>\s*\{emailProviderAndCountry\}\s*<\/span>/g,
      '{{EMAIL_PROVIDER_AND_COUNTRY}}',
    )
    .replace(/<strong\b[^>]*\bdata-installer-names\b[^>]*>\s*\{installerNames\}\s*<\/strong>/g, '{{INSTALLER_NAMES}}')
    .replace(/<span\b[^>]*\bdata-activity-label\b[^>]*>\s*\{defaultActivityLabel\}\s*<\/span>/g, '{{ACTIVITY_LABEL}}')
    .replace(/<span\b[^>]*\bdata-channel-list\b[^>]*>\s*\{defaultChannelList\}\s*<\/span>/g, '{{CHANNEL_LIST}}')
    .replace(/\{SITE\.name\}/g, 'Household Rebates')
    .replace(/\{SITE\.publisher\.legalName\}/g, 'Agenor Services Pty Ltd')
    .replace(/\{SITE\.publisher\.abn\}/g, '{{ABN}}')
    .replace(/\{SITE\.publisher\.privacyEmail\}/g, 'privacy@householdrebates.com.au')
    .replace(/\{\s*['"`]\s*['"`]\s*\}/g, ' ')
    .replace(/<a\b[^>]*>/gi, '')
    .replace(/<\/a>/gi, '')
    .replace(/<\/?strong\b[^>]*>/gi, '')
    .replace(/<\/?span\b[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Compare site vs API CONSENT_TEMPLATE_V2
const siteBlock = extractTemplateBlock(siteConsentFile);
const apiBlock = extractTemplateBlock(apiConsentFile);

const siteHash = sha256(siteBlock);
const apiHash = sha256(apiBlock);

if (siteHash !== apiHash) {
  throw new Error(
    `Consent template mismatch between site (${siteHash}) and api (${apiHash})!`,
  );
}

// 2. Compare rendered LeadForm.astro markup against CONSENT_TEMPLATE_V2
const expectedWho = parseTsStringProperty(siteBlock, 'whoGetsDetailsTemplate', siteConsentFile);
const expectedCheckbox = parseTsStringProperty(siteBlock, 'checkboxTemplate', siteConsentFile);
const expectedReadNotice = parseTsStringProperty(siteBlock, 'readNoticeText', siteConsentFile);
const expectedDisclaimer = parseTsStringProperty(siteBlock, 'disclaimerText', siteConsentFile);
const expectedCombinedLeads = `${expectedWho}\n\n${expectedCheckbox}\n\n${expectedDisclaimer}\n\n${expectedReadNotice}`;

const leadFormMarkup = fs.readFileSync(leadFormFile, 'utf8');
const renderedWho = normalizeLeadFormConsentFragment(
  extractBalancedElementByAttr(leadFormMarkup, 'p', 'data-consent-who', leadFormFile),
);
const renderedCheckbox = normalizeLeadFormConsentFragment(
  extractBalancedElementByAttr(leadFormMarkup, 'span', 'data-consent-checkbox-text', leadFormFile),
);
const renderedDisclaimer = normalizeLeadFormConsentFragment(
  extractBalancedElementByAttr(leadFormMarkup, 'p', 'data-consent-disclaimer', leadFormFile),
);
const renderedReadNotice = normalizeLeadFormConsentFragment(
  extractBalancedElementByAttr(leadFormMarkup, 'p', 'data-consent-read-notice', leadFormFile),
);
const renderedCombinedLeads = `${renderedWho}\n\n${renderedCheckbox}\n\n${renderedDisclaimer}\n\n${renderedReadNotice}`;

const expectedLeadsRenderHash = sha256(expectedCombinedLeads);
const actualLeadsRenderHash = sha256(renderedCombinedLeads);

if (expectedLeadsRenderHash !== actualLeadsRenderHash) {
  throw new Error(
    `Rendered consent text in LeadForm.astro (${actualLeadsRenderHash}) does not match CONSENT_TEMPLATE_V2 (${expectedLeadsRenderHash})!\n` +
      `Expected:\n${expectedCombinedLeads}\n\nActual in LeadForm.astro:\n${renderedCombinedLeads}`,
  );
}

// 3. Compare site vs API ALERTS_CONSENT_TEMPLATES
const siteAlertsBlock = extractAlertsConsentBlock(siteAlertsConsentFile);
const apiAlertsBlock = extractAlertsConsentBlock(apiAlertsConsentFile);

const siteAlertsHash = sha256(siteAlertsBlock);
const apiAlertsHash = sha256(apiAlertsBlock);

if (siteAlertsHash !== apiAlertsHash) {
  throw new Error(
    `Alerts consent template mismatch between site (${siteAlertsHash}) and api (${apiAlertsHash})!`,
  );
}

// 4. Compare rendered AlertSignupIsland.astro markup against ALERTS_CONSENT_TEMPLATES['alerts-v2']
const expectedAlertsV2 = extractAlertsV2Text(siteAlertsBlock, siteAlertsConsentFile);
const alertIslandMarkup = fs.readFileSync(alertSignupIslandFile, 'utf8');
const renderedAlertsSpan = extractBalancedElementByAttr(
  alertIslandMarkup,
  'span',
  'data-alert-consent-text',
  alertSignupIslandFile,
)
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const expectedAlertsRenderHash = sha256(expectedAlertsV2);
const actualAlertsRenderHash = sha256(renderedAlertsSpan);

if (expectedAlertsRenderHash !== actualAlertsRenderHash) {
  throw new Error(
    `Rendered consent text in AlertSignupIsland.astro (${actualAlertsRenderHash}) does not match ALERTS_CONSENT_TEMPLATES['alerts-v2'] (${expectedAlertsRenderHash})!\n` +
      `Expected:\n${expectedAlertsV2}\n\nActual in AlertSignupIsland.astro:\n${renderedAlertsSpan}`,
  );
}

console.log(
  `check-consent-hash: OK (leads SHA-256 ${expectedLeadsRenderHash.slice(0, 16)}…, alerts SHA-256 ${expectedAlertsRenderHash.slice(0, 16)}… match across rendered Astro forms, site templates, and api).`,
);
