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

test('the space above the ball shows the logo, or a message in the headline style', async ({
  superAdminPage: page,
}) => {
  await page.goto(LAB)
  await expect(page.getByRole('complementary', { name: 'Ball settings' })).toBeVisible()
  // The logo is the default.
  await expect(page.locator('.mk-intro-mark .mk-intro-logo')).toBeVisible()

  await page.getByRole('radio', { name: 'Message' }).check()
  await page.getByLabel('Message (line breaks are kept)').fill('A website worth\nplaying for.')
  const message = page.locator('.mk-intro-mark .mk-intro-message')
  await expect(message).toContainText('A website worth')
  await expect(page.locator('.mk-intro-mark .mk-intro-logo')).toHaveCount(0)
  // The headline style, but not a second H1 on the page.
  await expect(message).toHaveClass(/mk-display-xl/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

  await page.getByRole('radio', { name: 'Nothing' }).check()
  await expect(page.locator('.mk-intro-mark')).toHaveCount(0)

  // It goes with the ball when the reveal plays.
  await page.getByRole('radio', { name: 'Logo' }).check()
  await page.getByRole('button', { name: 'Play reveal' }).click()
  await expect(page.locator('.mk-intro-ball')).toHaveCSS('opacity', '0')
})
