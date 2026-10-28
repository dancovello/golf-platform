import { defineConfig, devices } from '@playwright/test'

// Admin-screen half of the tenant-isolation suite (CLAUDE.md non-negotiable 3).
// Runs against a production build (`pnpm build` first) on the golf_test database.
const isCI = !!process.env.CI
const port = 3100
const baseURL = `http://localhost:${port}`

// The specs that prove one club can't see another's data through the browser or the REST API.
// They are the CI job "tenant-isolation" and nothing else, so that job only goes red for a real
// separation problem. Every other browser test is the CI job "browser-tests".
const ISOLATION_SPECS =
  /tests\/e2e\/(admin-isolation|api-isolation|api-isolation-fuzz|canary|red-team)\.spec\.ts$/

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
      name: 'isolation',
      testMatch: ISOLATION_SPECS,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      // Timing-sensitive tests (animations, uploads) on a shared CI machine: one more try than
      // the isolation specs get, so a slow moment is not reported as a failure.
      retries: isCI ? 2 : 0,
      testIgnore: [/tests\/visual\//, ISOLATION_SPECS],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // The picture check (CI job "block-regression"): pnpm exec playwright test --project=visual
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
    // A fresh data cache each run (src/site/cache.ts): the test clubs are re-made with new IDs.
    command: `rm -rf .next/cache/fetch-cache && node_modules/.bin/next start -p ${port}`,
    url: `${baseURL}/health`,
    // Never an older server left running: it may be an older build with an older cache.
    reuseExistingServer: false,
    timeout: 120_000,
    // When APP_DATABASE_URL is set (CI does), the website runs as the limited golf_app account,
    // proving it can do everything it needs without owner rights. Seeding still uses the owner.
    // SITE_PREVIEW turns on the staging-only club preview pages (src/site/preview.ts).
    env: {
      SITE_PREVIEW: 'on',
      // Pins "today" for date-dependent blocks (src/site/today.ts), so pictures are stable.
      SITE_FIXED_TODAY: '2026-07-15',
      // The company website's addresses (src/site/hosts.ts): browsers send *.localhost here.
      MARKETING_HOSTS: 'marketing.localhost,www.marketing.localhost',
      ...(process.env.APP_DATABASE_URL ? { DATABASE_URL: process.env.APP_DATABASE_URL } : {}),
    },
  },
})
