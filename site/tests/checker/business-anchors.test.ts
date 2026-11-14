import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUSINESS_RESULT_LINKS } from '../../src/lib/checker/links';
import messagesData from '../../src/lib/checker/messages-data.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const hubMdxPath = path.join(siteRoot, 'src/content/guides/vic/business-energy-upgrades.mdx');
const hubHtmlPath = path.join(siteRoot, 'dist/victoria/business-energy-upgrades/index.html');

const BUSINESS_N_MESSAGE_IDS = [
  'N-SCHED',
  'N-LIGHT',
  'N-COLD',
  'N-PRV',
  'N-PV-30',
  'N-BIZ-RES',
] as const;

describe('Business hub anchors for BUSINESS_RESULT_LINKS and business N-* messages', () => {
  it('every #anchor in BUSINESS_RESULT_LINKS and business N-* messages exists in business-energy-upgrades MDX and built HTML', () => {
    const anchors = new Set<string>();

    for (const entry of Object.values(BUSINESS_RESULT_LINKS)) {
      if (entry.url.startsWith('/victoria/business-energy-upgrades/#')) {
        const hash = entry.url.split('#')[1];
        if (hash) anchors.add(hash);
      }
    }

    for (const msgId of BUSINESS_N_MESSAGE_IDS) {
      const msg = messagesData.find((m) => m.id === msgId);
      expect(msg, `Expected business message ${msgId} in messages-data.json`).toBeDefined();
      const hrefs = msg?.specHrefs ?? [];
      expect(hrefs.length, `Expected ${msgId} to link to a business hub anchor`).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href.startsWith('/victoria/business-energy-upgrades/#')).toBe(true);
        const hash = href.split('#')[1];
        expect(hash).toBeTruthy();
        anchors.add(hash);
      }
    }

    expect(anchors.size).toBeGreaterThanOrEqual(10);

    const mdxSource = fs.readFileSync(hubMdxPath, 'utf8');
    for (const anchor of anchors) {
      expect(
        mdxSource,
        `Missing id="${anchor}" in src/content/guides/vic/business-energy-upgrades.mdx`,
      ).toContain(`id="${anchor}"`);
    }

    expect(
      fs.existsSync(hubHtmlPath),
      'dist/victoria/business-energy-upgrades/index.html must exist (run astro build before vitest)',
    ).toBe(true);
    const builtHtml = fs.readFileSync(hubHtmlPath, 'utf8');
    for (const anchor of anchors) {
      expect(
        builtHtml,
        `Missing id="${anchor}" in built dist/victoria/business-energy-upgrades/index.html`,
      ).toContain(`id="${anchor}"`);
    }
  });
});
