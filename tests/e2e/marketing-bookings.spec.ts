import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The Bookings page, a Coming next preview (plan phase 6.2), from the Figma copy
// (src/marketing/starter/pages.ts), against "Bookings — Desktop" (184:3614).

const site = (path = '/bookings') => `http://marketing.localhost:3100${path}`

test('the page says plainly that booking is coming next', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Keep the tee sheet\nyou use today.',
  )
  await expect(page.locator('.mk-preview-label')).toHaveText(
    /Coming next · designs from our build\s*Not live yet\. Prices and times are examples\./,
  )
  await expect(page.getByRole('heading', { level: 2 })).toContainText([
    'Your rules, set once.',
    'Everything bookable,',
    'Start with the website.',
  ])
  // Hand-off §6: no brand names, no "three taps", no "one basket".
  const main = page.locator('main')
  for (const banned of [/toptracer/i, /three taps/i, /one basket/i]) {
    await expect(main).not.toContainText(banned)
  }
})

test('tee sheet: hold a slot, release it, then book it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const sheet = page.locator('.mk-tee-sim')
  const slot = sheet.locator('.mk-tee-slot', { hasText: '07:50' })
  await expect(sheet.locator('.mk-tee-panel h3')).toHaveText('Pick a time')
  // Full, members-only and competition slots can't be held.
  const full = sheet.locator('.mk-tee-slot', { hasText: '07:00' })
  await expect(full).toHaveAttribute('aria-disabled', 'true')
  await full.dispatchEvent('click')
  await expect(sheet.locator('.mk-tee-panel h3')).toHaveText('Pick a time')

  await slot.click()
  await expect(slot).toHaveAttribute('aria-pressed', 'true')
  await expect(slot).toContainText(/Held · 0\d:\d\d/)
  await expect(sheet.locator('.mk-tee-panel h3')).toHaveText('Sat 18 Oct, 07:50')
  await expect(sheet.getByRole('status')).toHaveText(
    'Sat 18 Oct, 07:50 held for you for ten minutes.',
  )
  await sheet.getByRole('button', { name: 'Release' }).click()
  await expect(slot).toHaveAttribute('aria-pressed', 'false')

  await slot.click()
  await sheet.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(sheet.locator('.mk-tee-panel h3')).toHaveText('You’re booked')
  await expect(sheet.locator('.mk-tee-summary')).toContainText('Sat 18 Oct · 07:50')
  await expect(slot).toContainText('Fully booked')
  await expect(slot).toHaveAttribute('aria-disabled', 'true')
})

test('club settings: the card guarantee adds a step and unlocks the no-show fee', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const panel = page.locator('.mk-settings-demo')
  const steps = panel.locator('.mk-flow-step-name')
  await expect(steps).toHaveText(['Choose a time', 'Add players', 'Card details', 'Confirm'])
  const guarantee = panel.getByRole('switch', { name: 'Card guarantee' })
  const noShow = panel.getByRole('switch', { name: 'No-show fee' })
  await guarantee.click()
  await expect(steps).toHaveText(['Choose a time', 'Add players', 'Confirm'])
  await expect(noShow).toBeDisabled()
  await expect(noShow).toHaveAttribute('aria-checked', 'false')
  await expect(panel).toContainText('No card needed. Members and visitors book in three steps.')
  await guarantee.click()
  await expect(noShow).toBeEnabled()
  await expect(panel).toContainText('your team can charge the no-show fee in one click')
})

test('facilities: tabs change the facility; booking says it is coming next', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const carousel = page.locator('.mk-facilities')
  await expect(carousel.locator('.mk-facilities-title')).toHaveText('Floodlit driving range')
  await expect(carousel.getByRole('radio', { name: /17:30 · Bay 4/ })).toBeChecked()
  await carousel.getByRole('tab', { name: 'Spa' }).click()
  await expect(carousel.locator('.mk-facilities-title')).toHaveText('Spa & recovery')
  await expect(carousel.getByRole('radio', { name: /14:00 · Massage/ })).toBeChecked()
  await carousel.getByRole('button', { name: 'Book a treatment' }).click()
  await expect(carousel.getByRole('status')).toHaveText(
    'Facility booking is coming next. This is a preview.',
  )
})

test('phones: no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  await page.waitForTimeout(500)
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
