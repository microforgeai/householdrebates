import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const EXCLUDED_SITEMAP_PATHS = new Set([
  'https://householdrebates.com.au/thanks/',
  'https://householdrebates.com.au/form-error/',
  'https://householdrebates.com.au/404/',
  'https://householdrebates.com.au/solar-battery/',
]);

export default defineConfig({
  site: 'https://householdrebates.com.au',
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
      filter: (page) => !EXCLUDED_SITEMAP_PATHS.has(page),
      serialize(item) {
        return {
          ...item,
          lastmod: new Date('2026-11-13T00:00:00+11:00').toISOString(),
        };
      },
    }),
  ],
});
