import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  CONSENT_TEMPLATE_V2,
  renderConsentSnapshot as renderSiteConsentSnapshot,
} from '../../src/data/consent/vic-v1';
import { renderConsentSnapshot as renderApiConsentSnapshot } from '../../../api/src/consent';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const tempInstallerPath = path.join(
  siteRoot,
  'src/content/installers/_e2e-mock-installer.yaml',
);

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

const INITIAL_INSTALLER = {
  id: 'inst-bayside-01',
  tradingName: 'Bayside Electrification Pty Ltd',
  accreditedProvider: 'VEU Certifiers Victoria Pty Ltd',
};

const ROUTED_INSTALLER = {
  id: 'inst-geelong-02',
  tradingName: 'Barwon Heat Pumps Pty Ltd',
  accreditedProvider: 'Southern VEU Accredited Pty Ltd',
};

test.describe('LeadForm on-screen consent vs stored renderConsentSnapshot() (#6 & #12)', () => {
  let tempOutDir = '';
  let enabledServer: http.Server | null = null;
  let enabledOrigin = '';

  test.beforeAll(async () => {
    tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hr-leads-40-'));
    const astroBin = path.join(siteRoot, 'node_modules/.bin/astro');

    const mockYaml = [
      `id: ${INITIAL_INSTALLER.id}`,
      `tradingName: ${INITIAL_INSTALLER.tradingName}`,
      `legalName: ${INITIAL_INSTALLER.tradingName}`,
      'abn: "12345678901"',
      `accreditedProvider: ${INITIAL_INSTALLER.accreditedProvider}`,
      'isAccreditedProvider: false',
      'activities:',
      '  - rcac',
      '  - hotwater',
      'postcodes:',
      '  - "3000"',
      '  - "3199"',
      'licence:',
      '  type: "VBA Plumbing & ESV Electrical"',
      '  number: "LIC-998877"',
      'agreementSignedOn: 2026-11-13',
      'agreementVersion: "2026-v1"',
      'contactEmailForLeads: "leads@bayside-example.com.au"',
      'publicBlurb: "Licensed heat pump and reverse-cycle installer."',
      'active: true',
      '',
    ].join('\n');

    fs.writeFileSync(tempInstallerPath, mockYaml, 'utf8');
    try {
      execFileSync(astroBin, ['build', '--outDir', tempOutDir], {
        cwd: siteRoot,
        env: {
          ...process.env,
          PUBLIC_LEADS_ENABLED: 'true',
          PUBLIC_ALERTS_ENABLED: 'false',
          PUBLIC_SERVER_COUNTRY: 'Malaysia',
          PUBLIC_LEADS_EMAIL_PROVIDER_NOTE: 'Postmark (United States)',
        },
        stdio: 'pipe',
      });
    } finally {
      if (fs.existsSync(tempInstallerPath)) {
        fs.unlinkSync(tempInstallerPath);
      }
    }

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
    if (fs.existsSync(tempInstallerPath)) {
      fs.unlinkSync(tempInstallerPath);
    }
    if (enabledServer) {
      await new Promise<void>((resolve) => enabledServer!.close(() => resolve()));
    }
    if (tempOutDir && fs.existsSync(tempOutDir)) {
      fs.rmSync(tempOutDir, { recursive: true, force: true });
    }
  });

  test('matches on-screen consent text and SHA-256 word-for-word against stored renderConsentSnapshot() across activities, channels, and dynamic routing', async ({
    page,
  }) => {
    await page.route('**/api/form-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'signed-lead-token-40' }),
      });
    });

    await page.route('**/api/routing*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ installers: [ROUTED_INSTALLER] }),
      });
    });

    await page.goto(`${enabledOrigin}/`);

    const form = page.locator('form[data-lead-form]');
    await expect(form).toBeVisible();

    // #12: Unbundled read notice sits outside the checkbox label and directly above submit button
    const readNotice = form.locator('[data-consent-read-notice]');
    await expect(readNotice).toBeVisible();
    const normalizedReadNotice = (await readNotice.textContent())!.replace(/\s+/g, ' ').trim();
    expect(normalizedReadNotice).toBe(CONSENT_TEMPLATE_V2.readNoticeText);
    await expect(form.locator('label[for="lf-consent"] [data-consent-read-notice]')).toHaveCount(0);

    // 1. Default rcac + tick phone & email -> compare screen text & SHA-256 to renderConsentSnapshot()
    await form.locator('#lf-cp-phone').check();
    await form.locator('#lf-cp-email').check();

    const readOnScreenSnapshot = async () => {
      const p1 = ((await form.locator('[data-consent-who]').textContent()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const p2 = ((await form.locator('[data-consent-checkbox-text]').textContent()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const p3 = ((await form.locator('[data-consent-disclaimer]').textContent()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const textSnapshot = `${p1}\n\n${p2}\n\n${p3}`;
      const textSha256 = crypto.createHash('sha256').update(textSnapshot, 'utf8').digest('hex');
      return { textSnapshot, textSha256 };
    };

    const screenRcac = await readOnScreenSnapshot();
    const expectedSiteRcac = renderSiteConsentSnapshot({
      activity: 'rcac',
      recipients: [INITIAL_INSTALLER],
      channels: ['phone', 'email'],
      serverCountry: 'Malaysia',
      emailProviderAndCountry: 'Postmark (United States)',
    });
    const expectedApiRcac = renderApiConsentSnapshot({
      activity: 'rcac',
      recipients: [INITIAL_INSTALLER],
      channels: ['phone', 'email'],
      serverCountry: 'Malaysia',
      emailProviderAndCountry: 'Postmark (United States)',
    });

    await expect(form.locator('[data-consent-version]')).toHaveValue('vic-rcac-v2');
    expect(screenRcac.textSnapshot).toBe(expectedSiteRcac.textSnapshot);
    expect(screenRcac.textSnapshot).toBe(expectedApiRcac.textSnapshot);
    expect(screenRcac.textSha256).toBe(expectedApiRcac.textSha256);

    // 2. Switch activity to hotwater, tick site_visit as well, and trigger postcode routing to 3220
    await form.locator('[data-lf-activity]').selectOption('hotwater');
    await form.locator('#lf-cp-visit').check();
    const postcodeInput = form.locator('[data-lf-postcode]');
    await postcodeInput.fill('3220');
    await postcodeInput.dispatchEvent('change');

    await expect(form.locator('[data-installer-names]').first()).toHaveText(
      ROUTED_INSTALLER.tradingName,
    );
    await expect(form.locator('[data-consent-version]')).toHaveValue('vic-hotwater-v2');

    const screenHotwater = await readOnScreenSnapshot();
    const expectedApiHotwater = renderApiConsentSnapshot({
      activity: 'hotwater',
      recipients: [ROUTED_INSTALLER],
      channels: ['phone', 'email', 'site_visit'],
      serverCountry: 'Malaysia',
      emailProviderAndCountry: 'Postmark (United States)',
    });

    expect(screenHotwater.textSnapshot).toBe(expectedApiHotwater.textSnapshot);
    expect(screenHotwater.textSha256).toBe(expectedApiHotwater.textSha256);
  });
});
