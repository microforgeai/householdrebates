import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ORIGIN = 'https://householdrebates.com.au';

function parseRowRange(spec) {
  const out = new Set();
  for (const part of String(spec).split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      for (let i = Number(m[1]); i <= Number(m[2]); i++) out.add(i);
    } else if (/^\d+$/.test(part)) {
      out.add(Number(part));
    }
  }
  return out;
}

function loadEnabledSitemapSet() {
  const rollout = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/rollout.json'), 'utf8'));
  const urlMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/url-map.json'), 'utf8'));
  const enabledNums = parseRowRange(rollout.enabledRows);
  const gatedOk = new Set(rollout.gatedApproved ?? []);
  const allowedUrls = new Set();
  for (const r of urlMap) {
    if (!enabledNums.has(r.row)) continue;
    if (r.gated && !gatedOk.has(r.row)) continue;
    allowedUrls.add(`${SITE_ORIGIN}${r.url}`);
  }
  return allowedUrls;
}

function loadUpdatedOnMap() {
  const map = new Map();
  const contentRoot = path.join(__dirname, 'src/content');
  function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.mdx') ? [path.join(dir, e.name)] : [],
    );
  }
  for (const file of walk(contentRoot)) {
    const raw = fs.readFileSync(file, 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = YAML.parse(fmMatch[1]);
    let pathname = `/${fm.slug}/`;
    if (file.includes('/content/guides/') || file.includes('/content/areas/')) {
      pathname = `/victoria/${fm.slug}/`;
    } else if (fm.slug === 'home') {
      pathname = '/';
    } else if (fm.slug === 'victoria') {
      pathname = '/victoria/';
    } else if (fm.state === 'vic' && fm.section === 'tools') {
      pathname = `/victoria/${fm.slug}/`;
    }
    if (fm.updatedOn) {
      const isoDate = String(fm.updatedOn).slice(0, 10);
      map.set(`${SITE_ORIGIN}${pathname}`, new Date(`${isoDate}T00:00:00+11:00`).toISOString());
    }
  }
  return map;
}

const enabledSitemapSet = loadEnabledSitemapSet();
const updatedOnByFullUrl = loadUpdatedOnMap();

export default defineConfig({
  site: SITE_ORIGIN,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => enabledSitemapSet.has(page),
      serialize(item) {
        return {
          ...item,
          lastmod:
            updatedOnByFullUrl.get(item.url) ?? new Date('2026-11-13T00:00:00+11:00').toISOString(),
        };
      },
    }),
  ],
});
