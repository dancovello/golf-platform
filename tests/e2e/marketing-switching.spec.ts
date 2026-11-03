import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The Switching page (plan phase 5.2), from the Figma copy (src/marketing/starter/pages.ts),
// against "Switching — Desktop" (186:6494) and "Switching — Mobile" (300:9636).

const site = (path = '/switching') => `http://marketing.localhost:3100${path}`

test('the page has every Figma section, in order, with one H1', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We do the heavy lifting.')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.locator('.mk-ticks li')).toHaveCount(3)
  await expect(page.getByRole('heading', { level: 2 })).toContainText([
    'Your club',
    'Four steps to a live site.',
    'Your content',
    'What happens to',
    'Ready when your committee is.',
  ])
  // Four step cards replace the week-by-week section.
  await expect(page.locator('.mk-stepcard')).toHaveCount(4)
  // The week-by-week timeline is gone (hand-off, 21 Oct): no fixed switching timeline.
  await expect(page.locator('.mk-week-card')).toHaveCount(0)
  await expect(page.locator('.mk-faq')).toHaveCount(5)
  // N7: no promise that old page addresses forward.
  await expect(page.locator('main')).not.toContainText(/redirect/i)
})

test('asking for a demo: mistakes are explained, then it says we will be in touch', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const form = page.locator('.mk-request')
  await form.getByRole('button', { name: 'Send me my homepage' }).click()
  const alert = form.getByRole('alert')
  await expect(alert).toHaveText('There are 3 things to fix.')
  await expect(alert).toBeFocused()
  await expect(form.getByLabel('Club name')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByText('Enter your club’s name.')).toBeVisible()

  await form.getByLabel('Club name').fill('Ashgrove Park Golf Club')
  await form.getByLabel('Current website').fill('ashgroveparkgc.co.uk')
  await form.getByLabel('Email').fill('secretary@ashgrove.example')
  // A person takes more than a few seconds; quicker is treated as a bot (src/site/contact/formToken.ts).
  await page.waitForTimeout(3_100)
  await form.getByRole('button', { name: 'Send me my homepage' }).click()
  const sent = form.getByRole('status')
  await expect(sent.getByRole('heading', { name: 'Thanks. We’ll be in touch.' })).toBeFocused()
  await expect(sent).toContainText(
    'We’ll email secretary@ashgrove.example when your homepage is ready.',
  )
  // No date is promised.
  await expect(sent).not.toContainText(/by (Monday|Tuesday|Wednesday|Thursday|Friday)/)
})

test('desktop matches Figma: copy beside a 520px form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const copy = await page.locator('.mk-request-copy').boundingBox()
  const form = await page.locator('.mk-request').boundingBox()
  expect(Math.round(form!.width)).toBe(520)
  expect(Math.round(form!.x - (copy!.x + copy!.width))).toBe(96)
})

test('phones: form under the ticks, no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  const ticks = await page.locator('.mk-ticks').boundingBox()
  const form = await page.locator('.mk-request').boundingBox()
  expect(Math.round(form!.y - (ticks!.y + ticks!.height))).toBe(40)
  expect(Math.round(form!.width)).toBe(350)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

for (const width of [1440, 390]) {
  test(`no accessibility problems at ${width}px, before and after a mistake`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(site())
    const scan = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    expect((await scan()).violations).toEqual([])
    await page.locator('.mk-request').getByRole('button', { name: 'Send me my homepage' }).click()
    await expect(page.locator('.mk-request').getByRole('alert')).toBeVisible()
    expect((await scan()).violations).toEqual([])
  })
}
