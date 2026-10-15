import { defineConfig, devices } from '@playwright/test'

// Admin-screen half of the tenant-isolation suite (CLAUDE.md non-negotiable 3), CI job "browser-checks".
// Runs against a production build (`pnpm build` first) on the golf_test database.
const isCI = !!process.env.CI
const port = 3100
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // All browsers share one local server; too many at once makes redirects time out.
  workers: 4,
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
      testIgnore: /tests\/visual\//,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // The picture check (CI job "browser-checks"): pnpm exec playwright test --project=visual
    {
      name: 'visual-setup',
      testDir: './tests/visual',
      testMatch: /setup-visual\.ts$/,
      dependencies: ['setup'],
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      testMatch: /\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
      dependencies: ['visual-setup'],
    },
  ],
  // Approved pictures, one set, made on Linux (see tests/visual/blocks.spec.ts).
  snapshotPathTemplate: 'tests/visual/__screenshots__/{arg}{ext}',
  // Never write approved pictures as a side effect (e.g. a missing one on a Mac): only the
  // "Update block pictures" workflow makes them, with an explicit --update-snapshots.
  updateSnapshots: 'none',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  webServer: {
    command: `node_modules/.bin/next start -p ${port}`,
    url: `${baseURL}/health`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    // When APP_DATABASE_URL is set (CI does), the website runs as the limited golf_app account,
    // proving it can do everything it needs without owner rights. Seeding still uses the owner.
    // SITE_PREVIEW turns on the staging-only club preview pages (src/site/preview.ts).
    env: {
      SITE_PREVIEW: 'on',
      // Pins "today" for date-dependent blocks (src/site/today.ts), so pictures are stable.
      SITE_FIXED_TODAY: '2026-07-15',
      ...(process.env.APP_DATABASE_URL ? { DATABASE_URL: process.env.APP_DATABASE_URL } : {}),
    },
  },
})
