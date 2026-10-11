import { execFileSync } from 'node:child_process'

import { expect, test as setup } from '@playwright/test'

import { loadWorld, PASSWORD, STATE_DIR } from './world'

// Seed first, then log in: these steps depend on each other.
setup.describe.configure({ mode: 'serial' })

setup('seed two test clubs', () => {
  execFileSync('node_modules/.bin/payload', ['run', 'tests/e2e/seed-world.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })
})

for (const who of ['editorA', 'superAdmin'] as const) {
  setup(`log in through the admin screen as ${who}`, async ({ page }) => {
    const w = loadWorld()
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(w[who].email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await page.context().storageState({ path: `${STATE_DIR}/${who}.json` })
  })
}
