import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(siteRoot, 'src/content/pages');
const ruleStatusPath = path.join(siteRoot, 'src/data/rule-status.json');

const leadsEnabled = process.env.PUBLIC_LEADS_ENABLED === 'true';
const alertsEnabled = process.env.PUBLIC_ALERTS_ENABLED === 'true';
const legalSlugs = ['privacy', 'terms'];

const parsedBySlug = new Map();

for (const slug of legalSlugs) {
  const filePath = path.join(pagesDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    throw new Error(`Missing frontmatter in ${slug}.mdx`);
  }
  const fm = YAML.parse(fmMatch[1]);
  parsedBySlug.set(slug, { raw, fm });

  if (leadsEnabled && fm.legalReviewed !== true) {
    throw new Error(
      `Refusing build with PUBLIC_LEADS_ENABLED=true: ${slug}.mdx has legalReviewed=${fm.legalReviewed}. A lawyer must review and sign off first.`,
    );
  }
}

const privacyEntry = parsedBySlug.get('privacy');
if (!privacyEntry || !/^##\s+\d+\.\s+Email alerts\b/m.test(privacyEntry.raw)) {
  throw new Error('privacy.mdx is missing the required "Email alerts" section.');
}

if (alertsEnabled) {
  const blockers = [];

  for (const slug of legalSlugs) {
    const entry = parsedBySlug.get(slug);
    if (entry.fm.legalReviewed !== true) {
      blockers.push(`${slug}.mdx has legalReviewed=${entry.fm.legalReviewed} (lawyer review required)`);
    }
  }

  if (privacyEntry.fm.alertsLegalReviewed !== true) {
    blockers.push(
      `privacy.mdx has alertsLegalReviewed=${Boolean(privacyEntry.fm.alertsLegalReviewed)} (lawyer sign-off on the Email alerts privacy section required)`,
    );
  }

  const ruleStatusRaw = JSON.parse(fs.readFileSync(ruleStatusPath, 'utf8'));
  const ewStatus = ruleStatusRaw?.electionWatch?.status;
  if (ewStatus === 'pending' || !['rechecked-unchanged', 'rechecked-changed'].includes(ewStatus)) {
    blockers.push(
      `rule-status.json has electionWatch.status="${ewStatus}" (post-election re-check must complete before enabling PUBLIC_ALERTS_ENABLED=true)`,
    );
  }

  const provider = (process.env.PUBLIC_ALERTS_PROVIDER ?? '').trim();
  const overseasNote = (process.env.PUBLIC_ALERTS_OVERSEAS_NOTE ?? '').trim();
  if (!provider || /<<|>>/.test(provider)) {
    blockers.push('PUBLIC_ALERTS_PROVIDER is unset or contains unresolved <<...>> placeholders');
  }
  if (!overseasNote || /<<|>>/.test(overseasNote)) {
    blockers.push(
      'PUBLIC_ALERTS_OVERSEAS_NOTE is unset or contains unresolved <<...>> placeholders (set "; it may store data outside Australia" or "none")',
    );
  }

  if (blockers.length > 0) {
    throw new Error(
      `Refusing build with PUBLIC_ALERTS_ENABLED=true:\n  - ${blockers.join('\n  - ')}`,
    );
  }
}

console.log(
  `check-legal: OK (PUBLIC_LEADS_ENABLED=${leadsEnabled}, PUBLIC_ALERTS_ENABLED=${alertsEnabled}).`,
);
