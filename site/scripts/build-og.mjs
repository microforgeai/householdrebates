import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const outDir = path.join(siteRoot, 'public/og');
const MAX_BYTES = 200 * 1024;

const require = createRequire(path.join(siteRoot, 'package.json'));
const { chromium } = require('playwright');

const OG_CARDS = [
  {
    kind: 'default',
    eyebrow: 'Victoria · Home & Business',
    headline: 'Victorian energy upgrade guides',
    subline: 'Plain-English rebate rules, upgrade scenarios, and sourced figures.',
    iconSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="#0d5c4d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 22L24 8l17 14"/><path d="M12 19v19a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V19"/><path d="M24 33c4.5-2 7-5.8 7-10.5-4.7 0-8.5 2.5-10.5 7 1 1.4 2.1 2.5 3.5 3.5Z"/></svg>`,
  },
  {
    kind: 'guide',
    eyebrow: 'Home Upgrade Guide',
    headline: 'Victorian home energy upgrade guides',
    subline: 'Heating and cooling, hot water, solar, batteries, insulation, and gas rules.',
    iconSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="#0d5c4d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="11" width="34" height="16" rx="4"/><path d="M13 21h22"/><path d="M15 33c0 3-2 4.5-2 6.5M24 33c0 3-2 4.5-2 6.5M33 33c0 3-2 4.5-2 6.5"/></svg>`,
  },
  {
    kind: 'area',
    eyebrow: 'Local Area Guide',
    headline: 'Victorian council & postcode energy guides',
    subline: 'Climate zones, mains gas status, VEU classifications, and local programs.',
    iconSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="#0d5c4d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M24 41s13-11.4 13-21a13 13 0 1 0-26 0c0 9.6 13 21 13 21Z"/><circle cx="24" cy="20" r="4.5"/></svg>`,
  },
  {
    kind: 'tool',
    eyebrow: 'Interactive Tool',
    headline: 'Victorian rebate & upgrade planning tools',
    subline: 'Check postcode zones, compare upgrade scenarios, and plan gas-to-electric steps.',
    iconSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="#0d5c4d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="15" x2="39" y2="15"/><circle cx="18" cy="15" r="4" fill="#e6f2ef"/><line x1="9" y1="26" x2="39" y2="26"/><circle cx="31" cy="26" r="4" fill="#e6f2ef"/><line x1="9" y1="37" x2="39" y2="37"/><circle cx="21" cy="37" r="4" fill="#e6f2ef"/></svg>`,
  },
  {
    kind: 'business',
    eyebrow: 'Commercial & Business',
    headline: 'Victorian business energy upgrade guides',
    subline: 'Commercial heating and cooling, LED lighting, cold rooms, hot water, and motors.',
    iconSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="#0d5c4d" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="20" height="31" rx="2"/><path d="M29 19h10a2 2 0 0 1 2 2v19H29"/><path d="M15 16h2M21 16h2M15 23h2M21 23h2M15 30h2M21 30h2M34 26h2M34 32h2"/></svg>`,
  },
];

function renderCardHtml(card) {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #faf8f5;
    color: #1c201e;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame {
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 2px solid #dcd7ce;
    position: relative;
    background: #faf8f5;
  }
  .accent-bar {
    height: 10px;
    width: 100%;
    background: #0d5c4d;
  }
  .body {
    flex: 1;
    padding: 58px 76px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 18px;
  }
  .brand-icon {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    background: #e6f2ef;
    border: 1.5px solid #8ec2b7;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-name {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #1c201e;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    padding: 10px 20px;
    border-radius: 999px;
    background: #e6f2ef;
    border: 1.5px solid #8ec2b7;
    color: #084237;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .copy {
    max-width: 980px;
  }
  h1 {
    font-size: 62px;
    font-weight: 750;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: #1c201e;
    margin-bottom: 22px;
  }
  .subline {
    font-size: 27px;
    line-height: 1.4;
    color: #45504c;
    font-weight: 450;
    max-width: 900px;
  }
  .footer {
    background: #eae5dc;
    border-top: 1.5px solid #dcd7ce;
    padding: 22px 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
    color: #1c201e;
  }
  .footer-domain {
    font-weight: 600;
    color: #0d5c4d;
  }
  .footer-notice {
    font-weight: 600;
    color: #1c201e;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="accent-bar"></div>
    <div class="body">
      <div class="top-row">
        <div class="brand">
          <div class="brand-icon">${card.iconSvg}</div>
          <span class="brand-name">Household Rebates</span>
        </div>
        <span class="pill">${card.eyebrow}</span>
      </div>
      <div class="copy">
        <h1>${card.headline}</h1>
        <p class="subline">${card.subline}</p>
      </div>
    </div>
    <div class="footer">
      <span class="footer-domain">householdrebates.com.au</span>
      <span class="footer-notice">Independent guide · Not a government website</span>
    </div>
  </div>
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const card of OG_CARDS) {
    const html = renderCardHtml(card);
    if (/\$|\b20\d{2}\b/.test(`${card.eyebrow} ${card.headline} ${card.subline}`)) {
      throw new Error(`OG card "${card.kind}" must not contain dollar figures or dates.`);
    }
    await page.setContent(html, { waitUntil: 'load' });
    const filePath = path.join(outDir, `${card.kind}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    const bytes = fs.statSync(filePath).size;
    if (bytes > MAX_BYTES) {
      throw new Error(
        `${card.kind}.png exceeds 200 KB limit (${bytes} bytes > ${MAX_BYTES} bytes)`,
      );
    }
    console.log(`build-og: wrote public/og/${card.kind}.png (${(bytes / 1024).toFixed(1)} KB)`);
  }

  await context.close();
} finally {
  await browser.close();
}
