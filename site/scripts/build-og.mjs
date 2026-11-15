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

const BRAND_HOUSE_SVG = `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
  <rect width="64" height="64" rx="14" fill="#0d5c4d"/>
  <path d="M14 31L32 16l18 15v17a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V31z" fill="none" stroke="#faf8f5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26 50V36h12v14" fill="none" stroke="#faf8f5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const OG_CARDS = [
  {
    kind: 'default',
    eyebrow: 'Victoria · Home & Business',
    headline: 'Victorian energy upgrade guides',
    subline: 'Plain-English rebate rules, upgrade scenarios, and sourced figures.',
  },
  {
    kind: 'guide',
    eyebrow: 'Home Upgrade Guide',
    headline: 'Victorian home energy upgrade guides',
    subline: 'Heating and cooling, hot water, solar, batteries, insulation, and gas rules.',
  },
  {
    kind: 'area',
    eyebrow: 'Local Area Guide',
    headline: 'Victorian council & postcode energy guides',
    subline: 'Climate zones, mains gas status, VEU classifications, and local programs.',
  },
  {
    kind: 'tool',
    eyebrow: 'Interactive Tool',
    headline: 'Victorian rebate & upgrade planning tools',
    subline: 'Check postcode zones, compare upgrade scenarios, and plan gas-to-electric steps.',
  },
  {
    kind: 'business',
    eyebrow: 'Commercial & Business',
    headline: 'Victorian business energy upgrade guides',
    subline: 'Commercial heating and cooling, LED lighting, cold rooms, hot water, and motors.',
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
    width: 64px;
    height: 64px;
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
          <div class="brand-icon">${BRAND_HOUSE_SVG}</div>
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
