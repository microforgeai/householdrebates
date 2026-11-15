import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const outDir = path.join(repoRoot, 'docs/design/p42');

const require = createRequire(path.join(siteRoot, 'package.json'));
const { chromium } = require('playwright');

const phase = process.argv[2];
if (phase !== 'before' && phase !== 'after') {
  console.error('Usage: node scripts/capture-p42.mjs <before|after>');
  process.exit(1);
}

const PORT = 4389;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'checker', path: '/victoria/eligibility-checker/' },
  { slug: 'ac-guide', path: '/victoria/air-conditioner-rebate/' },
  { slug: 'melbourne', path: '/victoria/melbourne/' },
  { slug: 'about', path: '/about/' },
];

const VIEWPORTS = [
  { label: '375x812', width: 375, height: 812 },
  { label: '1280x800', width: 1280, height: 800 },
];

const SCHEMES = ['light', 'dark'];

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'serve-dist.mjs')], {
      cwd: siteRoot,
      env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let ready = false;
    child.stdout.on('data', (chunk) => {
      if (!ready && String(chunk).includes('Serving dist')) {
        ready = true;
        resolve(child);
      }
    });
    child.stderr.on('data', (chunk) => {
      if (!ready) reject(new Error(String(chunk)));
    });
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`serve-dist exited early with code ${code}`));
    });
  });
}

fs.mkdirSync(outDir, { recursive: true });
const serverProc = await startServer();
const browser = await chromium.launch({ headless: true });

try {
  // 1. Capture 20 viewport screenshots (5 pages × 2 viewports × 2 color schemes)
  for (const scheme of SCHEMES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme,
      });
      const page = await context.newPage();
      for (const target of PAGES) {
        await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' });
        if (target.slug === 'checker') {
          await page.locator('[data-checker-hydrated="true"]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        }
        const fileName = `${phase}-${target.slug}-${vp.label}-${scheme}.png`;
        await page.screenshot({
          path: path.join(outDir, fileName),
          fullPage: false,
        });
      }
      await context.close();
    }
  }

  // 2. Measure exact DOM & layout metrics
  const mobileCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: 'light',
  });
  const mPage = await mobileCtx.newPage();

  await mPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const homeMobile = await mPage.evaluate(() => {
    const main = document.querySelector('main');
    const h1 = document.querySelector('h1');
    const notice = document.querySelector('.independence-notice');
    const noticeInner = document.querySelector('.independence-notice__inner') || notice;
    const header = document.querySelector('.site-header');
    const noticeStyle = noticeInner ? getComputedStyle(noticeInner) : null;
    const lineHeight = noticeStyle ? parseFloat(noticeStyle.lineHeight) || 20.8 : 20.8;
    // Measure rendered client rects across text spans/lines inside notice
    let noticeLines = 0;
    if (noticeInner) {
      const range = document.createRange();
      range.selectNodeContents(noticeInner);
      const lineTops = new Set();
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 1 && r.height > 1) {
          lineTops.add(Math.round(r.top / 4) * 4);
        }
      }
      noticeLines = lineTops.size || Math.round(noticeInner.getBoundingClientRect().height / lineHeight);
    }
    const words = (main?.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    const linksInMain = main ? main.querySelectorAll('a').length : 0;
    const tablesInMain = main ? main.querySelectorAll('table').length : 0;
    const noticeHeight = notice ? Math.round(notice.getBoundingClientRect().height) : 0;
    const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
    return {
      scrollHeight: document.documentElement.scrollHeight,
      screensAt812: Number((document.documentElement.scrollHeight / 812).toFixed(1)),
      mainWordCount: words,
      linksInMain,
      tablesInMain,
      h1TopPx: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
      h1FontSizePx: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
      noticeHeightPx: noticeHeight,
      noticeLines,
      noticeText: notice ? notice.textContent.replace(/\s+/g, ' ').trim() : '',
      headerHeightPx: headerHeight,
      chromeShareOfViewportPct: Number((((noticeHeight + headerHeight) / 812) * 100).toFixed(1)),
    };
  });

  await mPage.goto(`${BASE_URL}/victoria/eligibility-checker/`, { waitUntil: 'networkidle' });
  await mPage.locator('[data-checker-hydrated="true"]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const checkerMobile = await mPage.evaluate(() => {
    const h1 = document.querySelector('h1');
    const step1 = document.querySelector('[data-checker-step="S1"]') || document.querySelector('[data-checker-step]');
    const rect = step1 ? step1.getBoundingClientRect() : null;
    return {
      h1TopPx: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
      firstQuestionTopPx: rect ? Math.round(rect.top) : null,
      firstQuestionBottomPx: rect ? Math.round(rect.bottom) : null,
      firstQuestionFullyInViewport: rect ? rect.top >= 0 && rect.bottom <= 812 : false,
    };
  });
  await mobileCtx.close();

  // 320px overflow check across key pages
  const narrowCtx = await browser.newContext({
    viewport: { width: 320, height: 812 },
    colorScheme: 'light',
  });
  const nPage = await narrowCtx.newPage();
  const overflow320 = {};
  for (const target of PAGES) {
    await nPage.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' });
    overflow320[target.slug] = await nPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
  }
  await narrowCtx.close();

  // Desktop 1280x800 H1 size & header check
  const deskCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });
  const dPage = await deskCtx.newPage();
  await dPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const homeDesktop = await dPage.evaluate(() => {
    const h1 = document.querySelector('h1');
    const header = document.querySelector('.site-header');
    const notice = document.querySelector('.independence-notice');
    return {
      h1FontSizePx: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
      h1TopPx: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
      headerHeightPx: header ? Math.round(header.getBoundingClientRect().height) : null,
      noticeHeightPx: notice ? Math.round(notice.getBoundingClientRect().height) : null,
    };
  });
  await deskCtx.close();

  const metrics = {
    phase,
    capturedAt: new Date().toISOString(),
    homeMobile,
    checkerMobile,
    homeDesktop,
    overflow320,
  };

  fs.writeFileSync(
    path.join(outDir, `metrics-${phase}.json`),
    `${JSON.stringify(metrics, null, 2)}\n`,
    'utf8',
  );
  console.log(`capture-p42 (${phase}): saved 20 screenshots + metrics-${phase}.json`);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
  serverProc.kill('SIGTERM');
}
