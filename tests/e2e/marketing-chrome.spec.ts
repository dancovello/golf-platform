import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The marketing nav, footer, founder card and live preview (plan phase 2.2), from Figma
// Marketing/Nav (175:1875), Nav Mobile (272:8990), Footer (175:1876) and Founder Card (264:8707).

const site = (path = '/') => `http://marketing.localhost:3100${path}`

test('desktop nav: Figma labels, current page, Coming next clock, glass after scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site('/e2e-pricing'))
  const nav = page.getByRole('navigation', { name: 'Main' }).first()
  await expect(nav.getByRole('link')).toHaveText([
    'Website builder',
    'Tee times',
    'Switching',
    'Pricing',
    'Trust',
  ])
  await expect(nav.getByText('(coming next)')).toHaveCount(1)
  const header = page.locator('.mk-nav')
  await expect(header.getByRole('link', { name: 'Club log in' })).toHaveAttribute(
    'href',
    /\/admin$/,
  )
  // The "Free homepage" button is gone (hand-off, 21 Oct); Switching is a nav link.
  await expect(header.getByRole('link', { name: 'Free homepage' })).toHaveCount(0)
  await expect(header.getByRole('link', { name: 'Book a demo' }).first()).toHaveAttribute(
    'href',
    '/book-a-demo',
  )
  await expect(header.getByRole('button', { name: 'Menu' })).toBeHidden()
  expect(await header.evaluate((el) => el.getBoundingClientRect().height)).toBe(65)

  await expect(header).toHaveAttribute('data-scrolled', 'false')
  await page.mouse.wheel(0, 600)
  await expect(header).toHaveAttribute('data-scrolled', 'true')
})

test('phone menu: opens as a sheet, keeps focus inside, Esc closes it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site('/e2e-pricing'))
  const menu = page.getByRole('button', { name: 'Menu' })
  await expect(menu).toBeVisible()
  expect(await menu.evaluate((el) => el.getBoundingClientRect().width)).toBe(44)
  await menu.click()
  const sheet = page.getByRole('dialog', { name: 'Menu' })
  await expect(sheet).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused()
  await expect(sheet.getByRole('link', { name: /Tee times/ })).toBeVisible()
  // Tab from the last item goes back to the first: focus stays in the sheet.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
  expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(menu).toBeFocused()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})

test('footer: the site map, legal links and this year', async ({ page }) => {
  await page.goto(site('/e2e-pricing'))
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByRole('heading')).toHaveText(['Product', 'Clubs', 'Trust'])
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toHaveAttribute(
    'href',
    '/accessibility',
  )
  await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute(
    'href',
    'mailto:hello@brandname.golf',
  )
  await expect(footer.getByText(`© ${new Date().getFullYear()} Brandname`)).toBeVisible()
})

test('nav and footer pass axe on phone and desktop', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(site('/e2e-pricing'))
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      result.violations.map((v) => v.id),
      `${width}px`,
    ).toEqual([])
  }
})

test('founder card: Figma wording from the settings, initial until a photo', async ({
  superAdminPage: page,
}) => {
  await page.goto('/dev/components')
  const card = page.getByRole('complementary', { name: /Who’s behind this/ })
  await expect(card.getByText('Dan', { exact: true })).toBeVisible()
  await expect(card.getByText(/more than eight years/)).toBeVisible()
  // No calendar link yet: the call goes to the Book a demo page; no phone, so no "Call".
  await expect(card.getByRole('link', { name: 'Book a call with Dan' })).toHaveAttribute(
    'href',
    '/book-a-demo',
  )
  await expect(card.getByRole('link', { name: 'Call Dan' })).toHaveCount(0)
})

test('live preview shows drafts to the super-admin only', async ({
  superAdminPage,
  editorPage,
  request,
}) => {
  await superAdminPage.goto('/dev/preview/e2e-draft')
  await expect(superAdminPage.getByRole('heading', { level: 1 })).toHaveText('Not published yet')
  expect((await editorPage.goto('/dev/preview/e2e-draft'))?.status()).toBe(404)
  expect((await request.get('/dev/preview/e2e-draft', { maxRedirects: 0 })).status()).toBe(404)
  expect((await request.get(site('/dev/preview/e2e-draft'), { maxRedirects: 0 })).status()).toBe(
    404,
  )
})
