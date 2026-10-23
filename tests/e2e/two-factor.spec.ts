/**
 * Two-factor login: required for super-admins, optional for club editors (decisions.md, 22 Oct).
 * Editors who have set it up still need their code.
 * Each test starts logged out, in its own browser, unless it uses a logged-in fixture.
 */
import type { Page } from '@playwright/test'

import { currentCode } from '../shared/totp'

import { expect, openReady, test } from './fixtures'
import { PASSWORD } from './world'

const logInWithPassword = async (page: Page, email: string) => {
  await openReady(page, '/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
}

test('a password alone reaches only the code screen', async ({ page, world }) => {
  await logInWithPassword(page, world.editorLoginOnly.email)
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
  await logInWithPassword(page, world.editorTypesCode.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  await page.waitForLoadState('networkidle')
  // The plugin's six digit boxes have no labels (an accessibility gap, noted for follow-up),
  // and the first textbox is its hidden combined field, so the first visible box is the second.
  await page.getByRole('textbox').nth(1).click()
  await page.keyboard.type(currentCode())
  // After the code, the plugin sends you back where you came from (sometimes the login page,
  // which then forwards to the dashboard), so allow for the extra hop when the machine is busy.
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
  expect((await page.request.get('/api/pages')).status()).toBe(200)
})

test('a wrong code is refused', async ({ page, world }) => {
  await logInWithPassword(page, world.editorWrongCode.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  const wrong = currentCode() === '000000' ? '111111' : '000000'
  const response = await page.request.post('/api/verify-totp', { data: { token: wrong } })
  expect((await response.json()).ok).toBe(false)
  expect((await page.request.get('/api/pages')).status()).toBe(403)
})

test('a club editor without two-factor signs in with their password alone', async ({
  page,
  world,
}) => {
  await logInWithPassword(page, world.editorNotSetUp.email)
  await expect(page).toHaveURL(/\/admin$/)
  expect((await page.request.get('/api/pages')).status()).toBe(200)
})

test('a super-admin without two-factor must set it up before anything else', async ({
  page,
  world,
}) => {
  await logInWithPassword(page, world.superAdminNotSetUp.email)
  await expect(page).toHaveURL(/\/admin\/setup-totp/)
  await page.goto('/admin/collections/pages')
  await expect(page).toHaveURL(/\/admin\/setup-totp/)
  for (const path of ['/api/pages', '/api/tenants', '/api/club-settings']) {
    const res = await page.request.get(path)
    // Refused outright, or an empty list: either way, nothing.
    const body = res.ok() ? await res.json() : { totalDocs: 0 }
    expect({ path, seen: body.totalDocs }).toEqual({ path, seen: 0 })
  }
})

test("a super-admin can't switch their two-factor off", async ({ superAdminPage }) => {
  const res = await superAdminPage.request.post('/api/remove-totp', {
    data: { token: currentCode() },
  })
  expect(res.status()).toBe(403)
  expect((await superAdminPage.request.get('/api/pages')).status()).toBe(200)
})

test.describe('resetting two-factor (lost phone)', () => {
  test("the super-admin can reset an editor's two-factor; they then sign in with a password", async ({
    superAdminPage,
    page,
    world,
  }) => {
    const reset = await superAdminPage.request.post(
      `/api/users/${world.editorToReset.id}/reset-two-factor`,
    )
    expect(reset.status()).toBe(200)
    await logInWithPassword(page, world.editorToReset.email)
    // Two-factor is optional for editors: no code asked, and they can set it up again.
    await expect(page).toHaveURL(/\/admin$/)
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
