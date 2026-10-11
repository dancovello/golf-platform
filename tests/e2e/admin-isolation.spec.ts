/**
 * Admin-screen tenant isolation: club A's editor must not be able to see, or discover,
 * club B or any super-admin anywhere in the admin. Every response is also checked for
 * club B data by the `editorPage` fixture.
 */
import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'
import type { World } from './world'

test.describe("club A's editor", () => {
  test('sees only Accounts, Pages and Club Settings in the menu', async ({ editorPage: page }) => {
    await page.goto('/admin')
    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('link', { name: 'Pages' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Club Settings' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Accounts' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Clubs' })).toHaveCount(0)
  })

  test("the pages list shows only club A's page", async ({ editorPage: page, world }) => {
    await page.goto('/admin/collections/pages')
    await expect(page.getByRole('link', { name: world.pageA.title })).toBeVisible()
    await expect(page.getByText(world.pageB.title)).toHaveCount(0)
  })

  test('the accounts list shows only club A editors', async ({ editorPage: page, world }) => {
    await page.goto('/admin/collections/users')
    await expect(page.getByRole('link', { name: world.editorA.email })).toBeVisible()
    await expect(page.getByRole('link', { name: world.editorA2.email })).toBeVisible()
    await expect(page.getByText(world.editorB.email)).toHaveCount(0)
    await expect(page.getByText(world.superAdmin.email)).toHaveCount(0)
  })

  test("Club Settings opens club A's own settings", async ({ editorPage: page, world }) => {
    await page.goto('/admin')
    await page.getByRole('link', { name: 'Show all Club Settings' }).click()
    await expect(page).toHaveURL(
      new RegExp(`/admin/collections/club-settings/${world.settingsA.id}`),
    )
    await expect(page.getByLabel('Club name shown on the website')).toHaveValue(world.clubA.name)
  })

  test('has no club switcher, and the new-page form has no club picker', async ({
    editorPage: page,
  }) => {
    await page.goto('/admin/collections/pages/create')
    await expect(page.getByLabel('Title')).toBeVisible()
    await expect(page.getByLabel(/club|tenant/i)).toHaveCount(0)
    await expect(page.getByText(/select tenant|tenant/i)).toHaveCount(0)
  })

  test('their account page shows no account type or club', async ({ editorPage: page }) => {
    await page.goto('/admin/account')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByText('Account type')).toHaveCount(0)
    await expect(page.getByLabel('Club')).toHaveCount(0)
  })

  test('cannot open the create-account form', async ({ editorPage: page }) => {
    await page.goto('/admin/collections/users/create')
    await expect(page.getByText('You are not allowed to access this page.')).toBeVisible()
  })

  // Typing another club's addresses straight into the browser. Each must look exactly like
  // the same address with a made-up ID, so the editor can't even tell the record exists.
  const MADE_UP_ID = '00000000-0000-4000-8000-000000000000'
  // What the editor ends up looking at: the response status, the address they land on, and the
  // main content. The side menu is left out because it can finish drawing at slightly different
  // moments, which made the comparison flaky on slower machines. Waiting for the network to go
  // quiet (rather than a fixed delay) means each screen is fully drawn before it's read.
  const screenText = async (page: Page, path: string, id: string) => {
    const response = await page.goto(path)
    await page.waitForLoadState('networkidle')
    const main = page.getByRole('main')
    const content =
      (await main.count()) > 0 ? await main.innerText() : await page.locator('body').innerText()
    return [response?.status(), new URL(page.url()).pathname + new URL(page.url()).search, content]
      .join('\n')
      .replaceAll(id, '<ID>')
  }

  for (const target of [
    { label: "club B's page", collection: 'pages', id: (w: World) => w.pageB.id },
    { label: "club B's settings", collection: 'club-settings', id: (w: World) => w.settingsB.id },
    { label: "club B's editor", collection: 'users', id: (w: World) => w.editorB.id },
    { label: 'the super-admin', collection: 'users', id: (w: World) => w.superAdmin.id },
    { label: "club B's club record", collection: 'tenants', id: (w: World) => w.clubB.id },
  ]) {
    test(`the address of ${target.label} looks exactly like a record that doesn't exist`, async ({
      editorPage: page,
      world,
      echoed,
    }) => {
      const id = target.id(world)
      echoed.add(id)
      const real = await screenText(page, `/admin/collections/${target.collection}/${id}`, id)
      const madeUp = await screenText(
        page,
        `/admin/collections/${target.collection}/${MADE_UP_ID}`,
        MADE_UP_ID,
      )
      expect(real).toEqual(madeUp)
      expect(real).not.toContain(world.clubB.name)
    })
  }

  test('the clubs list is not available', async ({ editorPage: page, world }) => {
    const response = await page.goto('/admin/collections/tenants')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(world.clubA.name)).toHaveCount(0)
  })
})

test.describe('the super-admin (proves the checks above can see club B when allowed)', () => {
  test('sees both clubs and every account', async ({ superAdminPage: page, world }) => {
    await page.goto('/admin/collections/tenants')
    await expect(page.getByRole('link', { name: world.clubA.name })).toBeVisible()
    await expect(page.getByRole('link', { name: world.clubB.name })).toBeVisible()
    await page.goto('/admin/collections/users')
    await expect(page.getByRole('link', { name: world.editorB.email })).toBeVisible()
  })
})

test('the "create first user" address shows an explanation, not a form', async ({ page }) => {
  await page.goto('/admin/create-first-user')
  await expect(
    page.getByRole('heading', { name: 'Accounts are created by a platform administrator' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveCount(0)
})
