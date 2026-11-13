import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distDir = path.join(siteRoot, 'dist');
const contentDir = path.join(siteRoot, 'src/content');

// Remove dist/solar-battery when SOLAR_SECTION_ENABLED !== 'true'
if (process.env.SOLAR_SECTION_ENABLED !== 'true') {
  const sbDir = path.join(distDir, 'solar-battery');
  if (fs.existsSync(sbDir)) {
    fs.rmSync(sbDir, { recursive: true, force: true });
  }
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  return m ? YAML.parse(m[1]) : null;
}

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).format(new Date(d));

const acFm = readFrontmatter(path.join(contentDir, 'guides/vic/air-conditioner-rebate.mdx'));
const hpFm = readFrontmatter(path.join(contentDir, 'guides/vic/heat-pump-rebate.mdx'));
const checkedStr = acFm ? fmtDate(acFm.checkedOn) : '13 Nov 2026';
const hpCheckedStr = hpFm ? fmtDate(hpFm.checkedOn) : '13 Nov 2026';

const llmsTxt = `# Household Rebates

> Independent guide to Victorian Energy Upgrades (VEU) discounts for reverse-cycle air conditioning and heat pump hot water, and Victoria's 1 March 2027 gas hot water rule. Run by Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne. Not a government website. Every dollar figure is indicative, dated and linked to the official Energy Victoria page it came from; the accredited provider confirms eligibility and the final discount.

## Victoria guides
- [Air conditioner rebate Victoria](https://householdrebates.com.au/victoria/air-conditioner-rebate/): VEU heating and cooling discounts by scenario, eligibility, and why to contact a provider before work starts. Figures checked ${checkedStr}.
- [Heat pump rebate Victoria](https://householdrebates.com.au/victoria/heat-pump-rebate/): VEU hot water discounts for electric and gas replacements. Figures checked ${hpCheckedStr}.
- [Gas to electric hot water from 1 March 2027](https://householdrebates.com.au/victoria/gas-to-electric-hot-water-2027/): what the rule means for existing homes and renters.
- [Reverse-cycle vs gas heater: the timing rule](https://householdrebates.com.au/victoria/reverse-cycle-vs-gas-heater/)
- [Eligibility checker](https://householdrebates.com.au/victoria/eligibility-checker/)

## How it works
- [How quotes and installers work](https://householdrebates.com.au/how-quotes-work/)
- [FAQ](https://householdrebates.com.au/faq/)

## About and sources
- [Sources and method](https://householdrebates.com.au/sources/): every official page used, with checked-on dates.
- [About](https://householdrebates.com.au/about/)
- [Privacy](https://householdrebates.com.au/privacy/)
- [Terms](https://householdrebates.com.au/terms/)

## Optional
- [Melbourne](https://householdrebates.com.au/victoria/melbourne/)
- [Geelong](https://householdrebates.com.au/victoria/geelong/)
- [Frankston](https://householdrebates.com.au/victoria/frankston/)
- [Mornington Peninsula](https://householdrebates.com.au/victoria/mornington-peninsula/)
`;

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'llms.txt'), llmsTxt, 'utf8');
console.log('build-llms: wrote dist/llms.txt');
