import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const buildLockDir = path.join(os.tmpdir(), 'hr-e2e-astro-build.lock');

async function acquireBuildLock(): Promise<() => void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      fs.mkdirSync(buildLockDir);
      return () => {
        try {
          fs.rmdirSync(buildLockDir);
        } catch {
          // ignore
        }
      };
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('Timed out waiting for e2e astro build lock');
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

test.describe('Rule-change email alerts (Prompt 29b)', () => {
  let tempOutDir = '';
  let enabledServer: http.Server | null = null;
  let enabledOrigin = '';

  test.beforeAll(async () => {
    tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hr-alerts-29b-'));

    const astroBin = path.join(siteRoot, 'node_modules/.bin/astro');
    const releaseLock = await acquireBuildLock();
    try {
      execFileSync(astroBin, ['build', '--outDir', tempOutDir], {
        cwd: siteRoot,
        env: {
          ...process.env,
          PUBLIC_LEADS_ENABLED: 'false',
          PUBLIC_ALERTS_ENABLED: 'true',
          PUBLIC_SERVER_COUNTRY: 'Malaysia',
          PUBLIC_ALERTS_PROVIDER: 'Example Mail Pty Ltd',
          PUBLIC_ALERTS_OVERSEAS_NOTE: '; it stores data in the United States and Ireland',
        },
        stdio: 'pipe',
      });
    } finally {
      releaseLock();
    }

    // Enforce the < 3 KB gzipped AlertSignup bundle guard on the enabled build too
    execFileSync(process.execPath, [path.join(siteRoot, 'scripts/check-bundles.mjs')], {
      cwd: siteRoot,
      env: {
        ...process.env,
        PUBLIC_ALERTS_ENABLED: 'true',
        ASTRO_DIST_DIR: tempOutDir,
      },
      stdio: 'pipe',
    });

    enabledServer = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.join(tempOutDir, urlPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!fs.existsSync(filePath) || !filePath.startsWith(tempOutDir)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    });

    await new Promise<void>((resolve) => {
      enabledServer!.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = enabledServer.address() as AddressInfo;
    enabledOrigin = `http://127.0.0.1:${addr.port}`;
  });

  test.afterAll(async () => {
    if (enabledServer) {
      await new Promise<void>((resolve) => enabledServer!.close(() => resolve()));
    }
    if (tempOutDir && fs.existsSync(tempOutDir)) {
      fs.rmSync(tempOutDir, { recursive: true, force: true });
    }
  });

  test('hides AlertSignup completely when PUBLIC_ALERTS_ENABLED=false and serves noindex /alerts/* utility pages', async ({
    page,
  }) => {
    for (const checkPath of [
      '/',
      '/victoria/gas-to-electric-hot-water-2027/',
      '/victoria/battery-rebate/',
      '/victoria/eligibility-checker/',
    ]) {
      await page.goto(checkPath);
      await expect(page.locator('[data-alert-signup]')).toHaveCount(0);
    }

    for (const util of [
      { path: '/alerts/confirmed/', heading: 'Email alerts confirmed' },
      { path: '/alerts/expired/', heading: 'Confirmation link expired' },
      { path: '/alerts/unsubscribed/', heading: "You're unsubscribed" },
    ]) {
      const res = await page.goto(util.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex\b/);
      await expect(page.locator('h1')).toHaveText(util.heading);
      await expect(page.locator('main a[href="/victoria/"]')).toBeVisible();
    }

    const sitemapRes = await page.goto('/sitemap-0.xml');
    const sitemapXml = await sitemapRes!.text();
    expect(sitemapXml).not.toContain('/alerts/');
  });

  test('validates unticked default + accessible errors, passes axe-core, and submits exact 5-key JSON payload on guide placement without leaking sessionStorage', async ({
    page,
  }) => {
    const capturedBodies: Record<string, unknown>[] = [];
    const capturedRawStrings: string[] = [];

    await page.route('**/api/form-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'signed-token-29b' }),
      });
    });

    await page.route('**/api/alerts/subscribe', async (route) => {
      const raw = route.request().postData() ?? '';
      capturedRawStrings.push(raw);
      capturedBodies.push(JSON.parse(raw) as Record<string, unknown>);
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          message: 'Check your inbox to confirm. Nothing is sent until you click the link.',
        }),
      });
    });

    await page.goto(`${enabledOrigin}/victoria/gas-to-electric-hot-water-2027/`);

    // Seed sessionStorage with simulated sensitive checker state to prove zero leakage
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        'hr_checker_v1',
        JSON.stringify({ S1: 'residential', R2: '3199', secretCanary: 'NEVER_SEND_ME_999' }),
      );
      window.sessionStorage.setItem(
        'hr_checker_prefill_v1',
        JSON.stringify({ activity: 'hotwater', currentSystem: 'mains-gas', postcode: '3199' }),
      );
    });

    // No footer placement anywhere
    await expect(page.locator('footer [data-alert-signup]')).toHaveCount(0);

    const card = page.locator('[data-alert-signup]');
    await expect(card).toHaveCount(1);
    await expect(page.locator('[data-answer] [data-alert-signup]')).toHaveCount(0);

    // Placement is below AnswerBlock and RuleStatusNotice
    const noticeBox = await page.locator('[data-rule-status-notice]').boundingBox();
    const cardBox = await card.boundingBox();
    expect(noticeBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.y).toBeGreaterThan(noticeBox!.y);

    // APP 5 collection notice resolved from config directly above submit button
    const noticeEl = card.locator('[data-alert-collection-notice]');
    await expect(noticeEl).toContainText(
      'Agenor Services Pty Ltd, ABN 29 644 447 263, privacy@householdrebates.com.au',
    );
    await expect(noticeEl).toContainText('Your email address is stored on our server in Malaysia.');
    await expect(noticeEl).toContainText('Example Mail Pty Ltd');
    await expect(noticeEl).toContainText('it stores data in the United States and Ireland');
    await expect(noticeEl.locator('a[href="/privacy/"]')).toHaveText('privacy policy');

    const emailInput = card.locator('[data-alert-email]');
    const consentCheckbox = card.locator('[data-alert-consent]');
    const submitBtn = card.locator('[data-alert-submit]');

    // Unticked by default
    await expect(consentCheckbox).not.toBeChecked();

    // WCAG 2.1 AA accessibility scan on the AlertSignup island
    const axeResults = await new AxeBuilder({ page }).include('[data-alert-signup]').analyze();
    expect(axeResults.violations).toEqual([]);

    // Error state 1: empty email
    await submitBtn.click();
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(card.locator('[data-alert-email-error]')).toBeVisible();
    expect(capturedBodies).toHaveLength(0);

    // Error state 2: valid email, unticked consent box
    await emailInput.fill('resident@example.com.au');
    await submitBtn.click();
    await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(consentCheckbox).toHaveAttribute('aria-invalid', 'true');
    await expect(card.locator('[data-alert-consent-error]')).toBeVisible();
    expect(capturedBodies).toHaveLength(0);

    // Tick consent and submit -> 202 success message
    await consentCheckbox.check();
    await submitBtn.click();

    const successBox = card.locator('[data-alert-success]');
    await expect(successBox).toBeVisible();
    await expect(successBox).toHaveText(
      'Check your inbox to confirm. Nothing is sent until you click the link.',
    );

    expect(capturedBodies).toHaveLength(1);
    expect(Object.keys(capturedBodies[0]).sort()).toEqual([
      'consent',
      'consentVersion',
      'email',
      'formToken',
      'website',
    ]);
    expect(capturedBodies[0]).toEqual({
      email: 'resident@example.com.au',
      consent: true,
      consentVersion: 'alerts-v2',
      formToken: 'signed-token-29b',
      website: '',
    });
    expect(capturedRawStrings[0]).not.toContain('NEVER_SEND_ME_999');
    expect(capturedRawStrings[0]).not.toContain('3199');
    expect(capturedRawStrings[0]).not.toContain('mains-gas');
  });

  test('renders AlertSignup on the Eligibility Checker result screen only (below CTAs, never on question steps) and never sends checker answers', async ({
    page,
  }) => {
    const capturedBodies: Record<string, unknown>[] = [];
    const capturedRawStrings: string[] = [];

    await page.route('**/api/form-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'checker-token-29b' }),
      });
    });

    await page.route('**/api/alerts/subscribe', async (route) => {
      const raw = route.request().postData() ?? '';
      capturedRawStrings.push(raw);
      capturedBodies.push(JSON.parse(raw) as Record<string, unknown>);
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          message: 'Check your inbox to confirm. Nothing is sent until you click the link.',
        }),
      });
    });

    await page.goto(`${enabledOrigin}/victoria/eligibility-checker/`);

    // Hidden while on question steps
    const mount = page.locator('[data-checker-alert-mount]');
    await expect(mount).toBeHidden();

    // Complete a Residential scenario to reach the result screen (populates sessionStorage naturally)
    await page.locator('input[data-option-id="residential"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('[data-postcode-input]').fill('3000');
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="own-and-live"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="house-or-townhouse"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="hot-water"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="gas-mains"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="no"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="heat-pump"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="yes"]').check();
    await page.locator('[data-checker-next]').click();

    await page.locator('input[data-option-id="no"]').check();
    await page.locator('[data-checker-next]').click();

    await expect(page.locator('[data-checker-result]')).toBeVisible();
    await expect(mount).toBeVisible();

    const ctasBox = await page.locator('[data-checker-ctas]').boundingBox();
    const alertBox = await page.locator('[data-alert-signup]').boundingBox();
    expect(ctasBox).not.toBeNull();
    expect(alertBox).not.toBeNull();
    expect(alertBox!.y).toBeGreaterThan(ctasBox!.y);

    await expect(page.locator('[data-alert-checker-note]')).toHaveText(
      "This only signs you up for rule-change emails. Your checker answers aren't sent.",
    );

    // Confirm sessionStorage currently holds the checker answers
    const sessionDump = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    expect(sessionDump).toContain('3000');
    expect(sessionDump).toContain('gas-mains');

    // Submit the alert form on the result screen
    await page.locator('[data-alert-email]').fill('checker-user@example.com.au');
    await page.locator('[data-alert-consent]').check();
    await page.locator('[data-alert-submit]').click();

    await expect(page.locator('[data-alert-success]')).toHaveText(
      'Check your inbox to confirm. Nothing is sent until you click the link.',
    );

    expect(capturedBodies).toHaveLength(1);
    expect(Object.keys(capturedBodies[0]).sort()).toEqual([
      'consent',
      'consentVersion',
      'email',
      'formToken',
      'website',
    ]);
    expect(capturedRawStrings[0]).not.toContain('3000');
    expect(capturedRawStrings[0]).not.toContain('gas-mains');
    expect(capturedRawStrings[0]).not.toContain('own-and-live');

    // Confirm Home has no AlertSignup when PUBLIC_ALERTS_ENABLED=true, while /victoria/battery-rebate/ renders its placement after the 1 January 2027 section
    await page.goto(`${enabledOrigin}/`);
    await expect(page.locator('[data-alert-signup]')).toHaveCount(0);

    await page.goto(`${enabledOrigin}/victoria/battery-rebate/`);
    const batteryCard = page.locator('[data-alert-signup]');
    await expect(batteryCard).toHaveCount(1);
    const jan2027Heading = page.locator('h2#what-changes-on-1-january-2027');
    await expect(jan2027Heading).toBeVisible();
    const janBox = await jan2027Heading.boundingBox();
    const batteryCardBox = await batteryCard.boundingBox();
    expect(janBox).not.toBeNull();
    expect(batteryCardBox).not.toBeNull();
    expect(batteryCardBox!.y).toBeGreaterThan(janBox!.y);
  });
});
