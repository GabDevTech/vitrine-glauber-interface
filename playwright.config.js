import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node node_modules/@nestjs/cli/bin/nest.js start',
      cwd: 'api',
      url: 'http://127.0.0.1:3000/api/v1/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'node node_modules/vite/bin/vite.js --configLoader runner --host 0.0.0.0',
      url: 'http://127.0.0.1:4180',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
