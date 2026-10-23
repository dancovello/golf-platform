import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// Club A uses no optional features. "Test Club Cookies" uses all of them, including Google
// Analytics (tests/e2e/seed-world.ts).
const plain = '/preview/test-club-a'
// On the club's own address: previews never show the cookie banner (headers audit, finding 1).
const cookies = 'http://club-cookies.localhost:3100'
const GA = /googletagmanager\.com/

const axe = async (page: import('@playwright/test').Page) =>
  (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)

test('every club has a privacy policy, linked from the footer', async ({ page }) => {
  await page.goto(`${plain}/membership`)
  const footer = page.getByRole('contentinfo')
  await footer.getByRole('link', { name: 'Privacy policy' }).click()
  await expect(page).toHaveURL(`${plain}/privacy`)
  await expect(page).toHaveTitle('Privacy policy | Test Club A')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy')
  await expect(page.getByRole('heading', { level: 2, name: '12. Contact us' })).toBeVisible()
})

test('a club without optional features: nothing about them, and no cookie banner', async ({
  page,
}) => {
  await page.goto(`${plain}/privacy`)
  const text = await page.getByRole('main').innerText()
  expect(text).not.toMatch(/\{\{|\[IF|booking|account|stripe|payment|google|newsletter|banner/i)
  await expect(page.getByTestId('cookie-banner')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Cookie settings' })).toHaveCount(0)
  expect(await axe(page)).toEqual([])
})

test('Google Analytics waits for consent, and the choice can be changed', async ({
  page,
  context,
}) => {
  const gaRequests: string[] = []
  await context.route(GA, (route) => {
    gaRequests.push(route.request().url())
    return route.fulfill({ contentType: 'text/javascript', body: '' })
  })

  await page.goto(`${cookies}/privacy`)
  const banner = page.getByTestId('cookie-banner')
  await expect(banner).toBeVisible()
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0)
  expect(gaRequests).toEqual([])
  expect(await axe(page)).toEqual([])

  await banner.getByRole('button', { name: 'Accept analytics cookies' }).click()
  await expect(banner).toBeHidden()
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(1)
  await expect.poll(() => gaRequests.length).toBeGreaterThan(0)
  expect(gaRequests[0]).toContain('id=G-TEST12345')

  // Remembered on the next page, with no banner.
  await page.goto(`${cookies}/privacy`)
  await expect(page.getByTestId('cookie-banner')).toHaveCount(0)
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(1)

  // "Cookie settings" in the footer reopens the banner; rejecting stops Google loading.
  await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' }).click()
  await expect(page.getByTestId('cookie-banner')).toBeVisible()
  await page.getByRole('button', { name: 'Reject analytics cookies' }).click()
  await page.waitForLoadState('load')
  gaRequests.length = 0
  await page.goto(`${cookies}/privacy`)
  await expect(page.getByTestId('cookie-banner')).toHaveCount(0)
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0)
  expect(gaRequests).toEqual([])
})

test('a club with every optional part: its own details and an extra section', async ({ page }) => {
  await page.goto(`${cookies}/privacy`)
  const main = page.getByRole('main')
  await expect(main).toContainText('Test Club Cookies Limited, 1 Fairway Road, Testtown, TE1 1ST')
  await expect(main.getByRole('link', { name: 'privacy@cookies.example' }).first()).toHaveAttribute(
    'href',
    'mailto:privacy@cookies.example',
  )
  await expect(main).toContainText('We use Mailchimp')
  await expect(main).toContainText('Google Analytics')
  await expect(
    page.getByRole('heading', { level: 2, name: '12. Additional information' }),
  ).toBeVisible()
  await expect(main).toContainText('We use CCTV in the car park.')
  await expect(page.getByRole('heading', { level: 2, name: '13. Contact us' })).toBeVisible()
})
