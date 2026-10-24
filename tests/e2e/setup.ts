import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { type Cookie, expect, test as setup } from '@playwright/test'

import { currentCode } from '../shared/totp'
import { asSameOrigin } from './fixtures'
import { loadWorld, PASSWORD, STATE_DIR } from './world'

const clubCookie = (cookies: Pick<Cookie, 'name' | 'value'>[]) =>
  cookies.find((c) => c.name === 'payload-tenant')?.value

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
    asSameOrigin(page.context())
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
    if (who === 'editorA') {
      // The multi-tenant plugin's club cookie is written by the admin's own script once the page
      // has loaded, not by the server. Saving the login before that leaves every editor test
      // without it, and the screens that read it on their first load then fail: Club Settings
      // sends the editor back to /admin, and a new photo is refused ("Assigned Tenant"). On
      // slower CI machines that happened at random (24 Oct). So wait for it.
      await expect
        .poll(async () => clubCookie(await page.context().cookies()), {
          message: "the admin never set club A's club cookie for its editor",
          timeout: 15_000,
        })
        .toBe(w.clubA.id)
    }
    const path = `${STATE_DIR}/${who}.json`
    await page.context().storageState({ path })
    // What every later test starts from: club A's editor with club A picked; the super-admin
    // with no club picked (they choose one in the club selector).
    const saved = JSON.parse(readFileSync(path, 'utf8')) as { cookies: Cookie[] }
    expect(clubCookie(saved.cookies)).toBe(who === 'editorA' ? w.clubA.id : undefined)
  })
}
