import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './gestao/tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: './test-results/gestao',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:gestao',
    url: 'http://127.0.0.1:4175/gestao/login',
    reuseExistingServer: true,
  },
})
