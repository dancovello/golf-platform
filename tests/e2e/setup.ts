import { execFileSync } from 'node:child_process'

import { expect, test as setup } from '@playwright/test'

import { currentCode } from '../shared/totp'
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
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(w[who].email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
    if (who === 'superAdmin') {
      // Password accepted: the admin now asks for the two-factor code.
      await expect(page).toHaveURL(/\/admin\/verify-totp/)
      const verified = await page.request.post('/api/verify-totp', {
        data: { token: currentCode() },
      })
      expect(verified.ok()).toBe(true)
    } else {
      // Club editors sign in with their password only (decisions.md, 22 Oct): straight in.
      await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
    }
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    // Really signed in: the login cookie is there, and the API answers as this account.
    const cookies = await page.context().cookies()
    expect(cookies.map((c) => c.name)).toContain('payload-token')
    expect((await page.request.get('/api/users/me')).ok()).toBe(true)
    const me = await (await page.request.get('/api/users/me')).json()
    expect(me.user?.email).toBe(w[who].email)
    await page.context().storageState({ path: `${STATE_DIR}/${who}.json` })
  })
}
