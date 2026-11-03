/**
 * Two-factor login by emailed code: required for super-admins, optional for club editors
 * (decisions.md, 22 Oct and 3 Nov). Editors who had set the old authenticator up still need a code.
 * The tests can't read an inbox, so they plant a known code (tests/e2e/code.ts).
 * Each test starts logged out, in its own browser, unless it uses a logged-in fixture.
 */
import type { Page } from '@playwright/test'

import { plantCode, TEST_CODE } from './code'
import { asSameOrigin, expect, openReady, test } from './fixtures'
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

test('typing the emailed code logs you in', async ({ page, world }) => {
  await logInWithPassword(page, world.editorTypesCode.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  await page.waitForLoadState('networkidle')
  // The test can't read an inbox: it plants a known code, then says it already has one.
  plantCode(world.editorTypesCode.email)
  await page.getByRole('button', { name: 'I already have a code' }).click()
  await page.getByLabel('6-digit code').fill(TEST_CODE)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
  expect((await page.request.get('/api/pages')).status()).toBe(200)
})

test('a wrong code is refused', async ({ page, world }) => {
  await logInWithPassword(page, world.editorWrongCode.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  plantCode(world.editorWrongCode.email)
  const response = await page.request.post('/api/verify-totp', { data: { token: '000000' } })
  expect((await response.json()).ok).toBe(false)
  expect((await page.request.get('/api/pages')).status()).toBe(403)
})

test('a code works once', async ({ page, browser, baseURL, world }) => {
  const email = world.editorCodeOnce.email
  await logInWithPassword(page, email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  plantCode(email)
  const first = await page.request.post('/api/verify-totp', { data: { token: TEST_CODE } })
  expect((await first.json()).ok).toBe(true)
  // The same code, from a second sign-in with the password, is no longer good.
  const other = await browser.newContext({ baseURL })
  asSameOrigin(other)
  const second = await other.newPage()
  await logInWithPassword(second, email)
  const again = await second.request.post('/api/verify-totp', { data: { token: TEST_CODE } })
  expect((await again.json()).ok).toBe(false)
  await other.close()
})

test('a code can only be asked for after the password is accepted', async ({ page }) => {
  const res = await page.request.post('/api/send-email-code')
  expect(res.status()).toBe(401)
  expect((await res.json()).ok).toBe(false)
  const verify = await page.request.post('/api/verify-totp', { data: { token: TEST_CODE } })
  expect((await verify.json()).ok).toBe(false)
})

test('a club editor without two-factor signs in with their password alone', async ({
  page,
  world,
}) => {
  await logInWithPassword(page, world.editorNotSetUp.email)
  await expect(page).toHaveURL(/\/admin$/)
  expect((await page.request.get('/api/pages')).status()).toBe(200)
})

test('a super-admin is always asked for the emailed code before anything else', async ({
  page,
  world,
}) => {
  await logInWithPassword(page, world.superAdminCodeOnly.email)
  await expect(page).toHaveURL(/\/admin\/verify-totp/)
  await page.goto('/admin/collections/pages')
  await expect(page).toHaveURL(/\/admin\/(verify-totp|login)/)
  for (const path of ['/api/pages', '/api/tenants', '/api/club-settings']) {
    const res = await page.request.get(path)
    // Refused outright, or an empty list: either way, nothing.
    const body = res.ok() ? await res.json() : { totalDocs: 0 }
    expect({ path, seen: body.totalDocs }).toEqual({ path, seen: 0 })
  }
})

test('the authenticator app is gone: no set-up or switch-off', async ({ superAdminPage }) => {
  for (const path of ['/api/setup-totp', '/api/remove-totp']) {
    const res = await superAdminPage.request.post(path, { data: { token: '000000' } })
    expect({ path, status: res.status() }).toEqual({ path, status: 404 })
  }
  // The old set-up address just goes to the admin.
  await superAdminPage.goto('/admin/setup-totp')
  await expect(superAdminPage).toHaveURL(/\/admin$/)
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
