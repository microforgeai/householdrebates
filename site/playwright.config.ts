import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: false,
  },
});
