import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The Pricing page (plan phase 5.1), from the Figma copy (src/marketing/starter/pages.ts),
// against "Pricing — Desktop" (185:3821) and "Pricing — Mobile" (274:9185).

const site = (path = '/pricing') => `http://marketing.localhost:3100${path}`

test('every number on the page comes from the settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One club, one price.')
  await expect(page.locator('.mk-header-body').first()).toHaveText(
    '£149 a month + VAT for your website, on a 12-month term. No setup fee, and no charge per editor.',
  )
  await expect(page.locator('.mk-calc-terms')).toHaveText(
    'Billed monthly · 12-month minimum, then rolling',
  )
  await expect(page.locator('.mk-calc-price')).toContainText('£149')
  await expect(page.locator('.mk-calc-price')).toContainText('/ month + VAT')
  await expect(page.locator('.mk-calc-footnote')).toHaveText(
    'Prices exclude VAT. No setup fee. 90 days’ notice after the first 12 months.',
  )
  await expect(page.locator('.mk-cta-body')).toHaveText(
    '£149 a month + VAT, everything included. See it working on your own club first.',
  )
  // No token is ever shown raw.
  await expect(page.locator('main')).not.toContainText('{')
})

test('modules that aren’t live are marked Coming next and never priced', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const next = page.locator('.mk-calc-row--next')
  await expect(next).toHaveCount(3)
  await expect(next.locator('.mk-calc-name')).toContainText([
    'Tee-time bookings',
    'Members area',
    'Facilities booking',
  ])
  for (const row of await next.all()) {
    await expect(row.getByText('Price confirmed at launch')).toBeVisible()
    await expect(row.locator('.mk-calc-badge-desktop')).toContainText('Coming next')
    await expect(row).not.toContainText('£')
  }
})

test('one course only until a second-course price is set (Q3)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const courses = page.getByRole('group', { name: 'Courses' })
  await expect(courses.getByRole('button', { name: 'One more course' })).toBeDisabled()
  await expect(courses.getByRole('button', { name: 'One fewer course' })).toBeDisabled()
  await expect(courses.locator('output')).toHaveText('1')
  // The digits are drawn for the eye; screen readers get the plain price once.
  await expect(page.locator('.mk-calc-amount .mk-visually-hidden')).toHaveText('£149')
  await expect(page.locator('.mk-roll-digits')).toHaveAttribute('aria-hidden', 'true')
})

test('committee questions open and close, first one open', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 2, name: /Answers for/ })).toBeVisible()
  const first = page.getByRole('button', { name: 'How long is the contract?' })
  await expect(first).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('region', { name: 'How long is the contract?' })).toContainText(
    'A 12-month minimum, then it rolls monthly. Either side gives 90 days’ notice.',
  )
  const leave = page.getByRole('button', { name: 'What happens if we leave?' })
  await expect(leave).toHaveAttribute('aria-expanded', 'false')
  await leave.click()
  await expect(leave).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('region', { name: 'What happens if we leave?' })).toBeVisible()
  await expect(page.locator('.mk-faq')).toHaveCount(7)
})

test('desktop matches Figma: two calculator panels side by side, FAQ in two columns', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const build = await page.locator('.mk-calc-build').boundingBox()
  const total = await page.locator('.mk-calc-total').boundingBox()
  expect(build && total).toBeTruthy()
  // Total panel is 400 wide, to the right of the build panel, tops aligned.
  expect(Math.round(total!.width)).toBe(400)
  expect(total!.x).toBeGreaterThan(build!.x + build!.width - 1)
  expect(Math.abs(total!.y - build!.y)).toBeLessThan(2)
  // The questions are their own section, below a hairline, as in Figma.
  await expect(page.locator('.mk-section[data-kind="mkFaq"]')).toHaveCount(1)
  const header = await page.locator('.mk-faq-section .mk-header').boundingBox()
  const list = await page.locator('.mk-faq-list').boundingBox()
  expect(Math.round(header!.width)).toBe(400)
  expect(Math.round(list!.x - (header!.x + header!.width))).toBe(80)
})

test('phones: one calculator card, price first, no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  const price = await page.locator('.mk-calc-price').boundingBox()
  const terms = await page.locator('.mk-calc-terms').boundingBox()
  const button = await page.locator('.mk-calc .mk-button').boundingBox()
  // Figma mobile: one card, the price above the build list (no panel title), the button near the end.
  expect(price!.y).toBeLessThan(terms!.y)
  expect(button!.y).toBeGreaterThan(terms!.y)
  await expect(page.locator('.mk-calc-breakdown')).toBeHidden()
  // Figma phones left-align the centred intro (274:9199).
  await expect(page.locator('.mk-header--center').first()).toHaveCSS('text-align', 'start')
  await expect(page.locator('.mk-calc-badge-phone').first()).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

for (const width of [1440, 390]) {
  test(`no accessibility problems at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(site())
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}
