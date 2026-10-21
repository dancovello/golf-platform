import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The live demo engine (plan phase 3): real club blocks with a demo club's colours, scaled in
// Browser Chrome (Figma CMS block rules), and the Tenant Morph (176:2177). Shown on the
// super-admin's review page until the home page uses it (phase 4).

test('a demo is a real club block, scaled, with the club’s colours kept inside the frame', async ({
  superAdminPage: page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dev/components')
  const frame = page.getByRole('figure', { name: 'Demo club: Ashgrove Park’s home page' })
  await expect(frame).toBeVisible()
  await expect(frame.getByText('ashgrovepark.golf')).toBeVisible()
  const facts = await frame.evaluate((el) => {
    const club = el.querySelector<HTMLElement>('.mk-demo-club')!
    const stage = el.querySelector<HTMLElement>('.mk-demo-stage')!
    return {
      // The real Hero block's markup, not a picture.
      hero: Boolean(club.querySelector('section.hero.hero-heritage h1')),
      brand: getComputedStyle(club).getPropertyValue('--brand-primary').trim(),
      inert: club.inert,
      hidden: club.getAttribute('aria-hidden'),
      stageWidth: stage.offsetWidth,
      transform: getComputedStyle(stage).transform,
      outsideBrand: getComputedStyle(document.body).getPropertyValue('--brand-primary').trim(),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }
  })
  expect(facts.hero).toBe(true)
  expect(facts.brand.toLowerCase()).toBe('#1b2a22')
  expect(facts.inert).toBe(true)
  expect(facts.hidden).toBe('true')
  expect(facts.stageWidth).toBe(1366)
  expect(facts.transform).toMatch(/^matrix\(0\.\d+, 0, 0, 0\.\d+, 0, 0\)$/)
  expect(facts.outsideBrand).toBe('')
  expect(facts.bodyBackground).toBe('rgb(9, 26, 19)')
})

test('the Tenant Morph switches clubs with its chips; Booking-led shows only what works', async ({
  superAdminPage: page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dev/components')
  const chips = page.getByRole('radiogroup', { name: 'Demo clubs' })
  await expect(page.getByRole('figure', { name: /Ashgrove Park/ })).toBeVisible()
  await chips.getByRole('radio', { name: /Carreg Bay Links/ }).click()
  await expect(page.getByRole('figure', { name: /Carreg Bay Links/ })).toBeVisible()
  await expect(page.getByRole('figure', { name: /Ashgrove Park/ })).toBeHidden()
  await chips.getByRole('radio', { name: /Carreg Bay Links/ }).focus()
  await page.keyboard.press('ArrowRight')
  const kingsmere = page.getByRole('figure', { name: /Kingsmere/ })
  await expect(kingsmere).toBeVisible()
  await expect(chips.getByRole('radio', { name: /Kingsmere/ })).toBeFocused()
  // No tee-time search bar (not built): the club's booking button only.
  expect(await kingsmere.locator('.hero-bookingLed').count()).toBe(1)
  expect(await kingsmere.getByText('Find tee times').count()).toBe(0)
})

test('the review page with demos passes axe', async ({ superAdminPage: page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dev/components')
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('[disabled]')
    .analyze()
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([])
})
