import { defineConfig, devices } from '@playwright/test'

// Admin-screen half of the tenant-isolation suite (CLAUDE.md non-negotiable 3).
// Runs against a production build (`pnpm build` first) on the golf_test database.
const isCI = !!process.env.CI
const port = 3100
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /setup\.ts$/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: `node_modules/.bin/next start -p ${port}`,
    url: `${baseURL}/health`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
