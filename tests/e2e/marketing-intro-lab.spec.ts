import { expect, test } from './fixtures'

// The golf ball intro's tuning page (plan phase 7), for the super-admin only.

const LAB = '/dev/intro'

test('only the signed-in super-admin can see the intro tuning page', async ({
  request,
  editorPage,
}) => {
  expect((await request.get(LAB, { maxRedirects: 0 })).status()).toBe(404)
  expect((await editorPage.goto(LAB))?.status()).toBe(404)
  // Never on the company domain, even for the super-admin.
  const company = await request.get(`http://marketing.localhost:3100${LAB}`, { maxRedirects: 0 })
  expect(company.status()).toBe(404)
})

test('the reveal fades the ball out and brings the content in', async ({
  superAdminPage: page,
}) => {
  await page.goto(LAB)
  await expect(page.getByRole('complementary', { name: 'Ball settings' })).toBeVisible()
  const content = page.locator('.mk-intro-content')
  await expect(content).toHaveCSS('opacity', '0')
  await page.getByRole('button', { name: 'Play reveal' }).click()
  await expect(content).toHaveCSS('opacity', '1')
  await expect(page.locator('.mk-intro-ball')).toHaveCSS('opacity', '0')
  await page.getByRole('button', { name: 'Show ball again' }).click()
  await expect(page.locator('.mk-intro-ball')).toHaveCSS('opacity', '1')
})
