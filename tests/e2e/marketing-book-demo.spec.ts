import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// Book a demo (plan phase 5.3), from the Figma copy (src/marketing/starter/pages.ts), against
// "Book a demo — Desktop" (187:7336) and "Book a demo — Mobile" (275:9525). Until a calendar is
// connected (Q4) the page offers email; the booking component is on the review page.

const site = (path = '/book-a-demo') => `http://marketing.localhost:3100${path}`

test('the page: one H1, what to expect, email, founder card, and no CTA band', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Let’s talk about\nyour club.')
  await expect(
    page.getByRole('list', { name: 'What to expect' }).getByRole('listitem'),
  ).toHaveCount(4)
  const email = page.locator('.mk-demo-email').getByRole('link', { name: 'hello@brandname.golf' })
  await expect(email).toHaveAttribute('href', /^mailto:hello@brandname\.golf\?subject=Demo$/)
  await expect(page.getByRole('link', { name: /^Email hello@brandname\.golf/ })).toBeVisible()
  const founder = page.getByRole('complementary', { name: /Who’s behind this/ })
  await expect(founder).toContainText('I run every demo myself')
  // No button back to the page you're on.
  await expect(founder.getByRole('link', { name: /Book a call/ })).toHaveCount(0)
  await expect(page.locator('.mk-cta')).toHaveCount(0)
  // Hand-off §6: never say how long the call lasts.
  await expect(page.locator('main')).not.toContainText(/\d+\s*(min|minute|hour)/i)
})

test('desktop: booking panel 560px beside the copy, email under the list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const copy = await page.locator('.mk-demo-intro-copy').boundingBox()
  const panel = await page.locator('.mk-demo-intro-panel').boundingBox()
  const email = await page.locator('.mk-demo-intro > .mk-demo-email').boundingBox()
  expect(Math.round(panel!.width)).toBe(560)
  expect(Math.round(panel!.x - (copy!.x + copy!.width))).toBe(80)
  expect(email!.x).toBe(copy!.x)
  expect(email!.y).toBeLessThan(panel!.y + panel!.height)
})

test('phones: the email line moves under the booking panel; no sideways scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  const panel = await page.locator('.mk-demo-intro-panel').boundingBox()
  const email = await page.locator('.mk-demo-intro > .mk-demo-email').boundingBox()
  expect(Math.round(email!.y - (panel!.y + panel!.height))).toBe(16)
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

test('the booking component (review page): details, weekdays only by keyboard, booked', async ({
  superAdminPage: page,
}) => {
  await page.goto('/dev/components')
  const booking = page.locator('.mk-booking')
  await booking.scrollIntoViewIfNeeded()
  await booking.getByRole('button', { name: 'Next: pick a time' }).click()
  await expect(booking.getByText('Enter your name.')).toBeVisible()
  await booking.getByLabel('Your name').fill('Rhian Morgan')
  await booking.getByLabel('Club name').fill('Ashgrove Park Golf Club')
  await booking.getByLabel('Email').fill('rhian@ashgrove.example')
  await booking.getByRole('button', { name: 'Next: pick a time' }).click()
  await expect(booking.locator('[aria-current="step"]')).toHaveText('Pick a time')

  // Weekends are never bookable; the first free day is chosen and keyboard-focusable.
  const weekend = booking.locator('.mk-booking-day').filter({ hasText: /^\d+$/ })
  for (const day of await weekend.all()) {
    const iso = (await day.getAttribute('data-date'))!
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay()
    if (dow === 0 || dow === 6) expect(await day.getAttribute('data-state')).not.toBe('open')
  }
  const chosen = booking.locator('.mk-booking-day[data-state="chosen"]')
  await expect(chosen).toHaveCount(1)
  await chosen.focus()
  await page.keyboard.press('ArrowRight')
  await expect(booking.locator('.mk-booking-day:focus')).toHaveCount(1)

  await booking.locator('.mk-slot', { hasText: '11:30' }).click()
  await expect(booking.getByRole('radio', { name: '11:30' })).toBeChecked()
  const confirm = booking.getByRole('button', { name: /^Confirm .+, 11:30$/ })
  await confirm.click()
  await expect(booking.getByRole('status').getByRole('heading')).toHaveText(
    /^See you \w+day, Rhian$/,
  )
  await expect(booking.getByRole('status')).toContainText('on video. The invite is in your inbox.')
})
