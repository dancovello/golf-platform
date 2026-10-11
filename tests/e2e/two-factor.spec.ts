/**
 * Two-factor login, required for every account (docs/architecture/decisions.md).
 * Each test starts logged out, in its own browser, unless it uses a logged-in fixture.
 */
import type { Page } from '@playwright/test'

import { currentCode } from '../shared/totp'

import { expect, test } from './fixtures'
import { PASSWORD } from './world'

const logInWithPassword = async (page: Page, email: string) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
}

test('a password alone reaches only the code screen', async ({ page, world }) => {
  await logInWithPassword(page, world.editorA.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  // Opening an admin screen before entering the code sends you back to the code or login
  // screen; either way nothing is shown.
  await page.goto('/admin/collections/pages')
  await expect(page).toHaveURL(/\/admin\/(verify-totp|login)/)
  await expect(page.getByText(world.pageA.title)).toHaveCount(0)
  for (const path of ['/api/pages', '/api/club-settings', '/api/tenants']) {
    expect((await page.request.get(path)).status(), path).toBe(403)
  }
})

test('typing the code from the authenticator app logs you in', async ({ page, world }) => {
  await logInWithPassword(page, world.editorA.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  // The plugin's six digit boxes have no labels (an accessibility gap, noted for follow-up),
  // and the first textbox is its hidden combined field, so the first visible box is the second.
  await page.getByRole('textbox').nth(1).click()
  await page.keyboard.type(currentCode())
  await expect(page).toHaveURL(/\/admin$/)
  expect((await page.request.get('/api/pages')).status()).toBe(200)
})

test('a wrong code is refused', async ({ page, world }) => {
  await logInWithPassword(page, world.editorA2.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  const wrong = currentCode() === '000000' ? '111111' : '000000'
  const response = await page.request.post('/api/verify-totp', { data: { token: wrong } })
  expect((await response.json()).ok).toBe(false)
  expect((await page.request.get('/api/pages')).status()).toBe(403)
})

test('an account without two-factor must set it up before anything else', async ({
  page,
  world,
}) => {
  await logInWithPassword(page, world.editorNotSetUp.email)
  await expect(page).toHaveURL(/\/admin\/setup-totp/)
  await page.goto('/admin/collections/pages')
  await expect(page).toHaveURL(/\/admin\/setup-totp/)
  expect((await page.request.get('/api/pages')).status()).toBe(403)
})

test.describe('resetting two-factor (lost phone)', () => {
  test("the super-admin can reset an editor's two-factor; they set it up again", async ({
    superAdminPage,
    page,
    world,
  }) => {
    const reset = await superAdminPage.request.post(
      `/api/users/${world.editorToReset.id}/reset-two-factor`,
    )
    expect(reset.status()).toBe(200)
    await logInWithPassword(page, world.editorToReset.email)
    await expect(page).toHaveURL(/\/admin\/setup-totp/)
  })

  test('an editor cannot reset anyone', async ({ editorPage, world }) => {
    const reset = await editorPage.request.post(`/api/users/${world.editorA2.id}/reset-two-factor`)
    expect(reset.status()).toBe(403)
  })

  test("a super-admin's two-factor can't be reset from the admin", async ({
    superAdminPage,
    world,
  }) => {
    const reset = await superAdminPage.request.post(
      `/api/users/${world.superAdmin.id}/reset-two-factor`,
    )
    expect(reset.status()).toBe(400)
  })
})
