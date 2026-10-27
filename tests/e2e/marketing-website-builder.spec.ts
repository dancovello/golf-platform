import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The Website builder page (plan phase 6.1), from the Figma copy (src/marketing/starter/pages.ts),
// against "Website builder — Desktop" (183:3008). Figma has no phone frame for it.

const site = (path = '/website-builder') => `http://marketing.localhost:3100${path}`

test('every Figma section in order, one H1, and no product film (Q8)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Make it yours.\nIt’ll still look right.',
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 })).toContainText([
    'Your colours, kept readable.',
    'Your course, hole by hole.',
    'Everything members look for.',
    'Sorted before you log in.',
    'See your club on it.',
  ])
  await expect(page.locator('video')).toHaveCount(0)
  await expect(page.locator('.mk-details li')).toHaveCount(6)
  await expect(page.locator('.mk-showcase-card')).toHaveCount(4)
  const cards = page.locator('.mk-features--cards > li')
  await expect(cards).toHaveCount(8)
  await expect(page.locator('.mk-features--cards .mk-badge--coming-next')).toHaveCount(1)
  // Claims the product can't back yet stay off the page (N7, N8, Q5).
  const main = page.locator('main')
  await expect(main).not.toContainText(/redirect/i)
  await expect(main).not.toContainText(/alt text is required/i)
  await expect(main).not.toContainText(/before (it|they) (goes live|save)/i)
})

test('Block Flipper: a laptop and a phone flip together, at their real widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const flipper = page.getByRole('group', { name: 'Hero block variants' })
  const laptop = flipper.locator('.mk-flipper-window iframe')
  const phone = flipper.locator('.mk-phone iframe')
  await expect(laptop).toHaveAttribute('src', '/frame/hero/heritage')
  await expect(phone).toHaveAttribute('src', '/frame/hero/heritage')
  await expect(flipper.locator('.mk-flipper-label')).toContainText('Variant 1 of 3')
  await flipper.getByRole('button', { name: 'Next variant' }).click()
  await expect(laptop).toHaveAttribute('src', '/frame/hero/resort')
  await expect(phone).toHaveAttribute('src', '/frame/hero/resort')
  await expect(flipper.locator('.mk-flipper-name')).toHaveText('Hero · Resort')
  await page.keyboard.press('ArrowRight')
  await expect(laptop).toHaveAttribute('src', '/frame/hero/bookingLed')
  await flipper.getByRole('button', { name: 'Previous variant' }).click()
  await expect(flipper.locator('.mk-flipper-count')).toContainText('Variant 2 of 3')
  // No device tabs any more (Dan, 26 Oct): both screens show at once, at their real widths.
  await expect(flipper.getByRole('radio')).toHaveCount(0)
  expect(await laptop.evaluate((el) => (el as HTMLIFrameElement).style.width)).toBe('1366px')
  expect(await phone.evaluate((el) => (el as HTMLIFrameElement).style.width)).toBe('390px')
  await expect(page.frameLocator('.mk-phone iframe').locator('.hero')).toBeVisible()
})

test('the hero frame: the real Hero block, inert, only for known styles', async ({ page }) => {
  const ok = await page.goto(site('/frame/hero/resort'))
  expect(ok?.status()).toBe(200)
  await expect(page.locator('main.club-theme')).toHaveAttribute('inert', '')
  await expect(page.locator('.hero')).toBeVisible()
  expect((await page.goto(site('/frame/hero/nonsense')))?.status()).toBe(404)
})

test('Token Dial: picking a colour re-skins the demo and explains the text colour', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const dial = page.locator('.mk-dial')
  const button = dial.locator('.mk-demo .btn-accent').first()
  await expect(dial.getByRole('radio', { name: 'Primrose' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(button).toHaveCSS('background-color', 'rgb(242, 226, 140)')
  await expect(dial.locator('.mk-dial-note')).toContainText(
    'so its buttons use your dark text colour',
  )
  // Keyboard: arrows move round the swatches.
  await dial.getByRole('radio', { name: 'Primrose' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(dial.getByRole('radio', { name: 'Fairway' })).toBeFocused()
  await expect(button).toHaveCSS('background-color', 'rgb(31, 77, 58)')
  await expect(button).toHaveCSS('color', 'rgb(250, 247, 241)')
  await expect(dial.locator('.mk-dial-note')).toContainText('Fairway is deep enough for light text')
  const ratio = Number((await dial.locator('.mk-dial-value strong').textContent())!.split(':')[0])
  expect(ratio).toBeGreaterThanOrEqual(4.5)
})

test('the hole carousel moves on by itself, and the showcase shows four live features', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const guide = page.getByRole('figure', { name: /course guide, hole by hole/ })
  await expect(guide).toContainText('Heather Gate')
  await expect(guide.locator('.mk-chrome-address')).toHaveText('ashgrovepark.golf/the-course')
  await guide.scrollIntoViewIfNeeded()
  await page.mouse.move(0, 0)
  const track = guide.locator('.hole-track')
  await expect
    .poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 8000 })
    .toBeGreaterThan(0)

  const cards = page.locator('.mk-showcase-card')
  await expect(cards.locator('h3')).toHaveText([
    'The course report, first thing',
    'Fixtures members can find',
    'Search that answers',
    'Change a fee once',
  ])
  await expect(cards.nth(0)).toContainText('Cut & rolled')
  await expect(cards.nth(2).locator('.mk-sc-answer')).toContainText('£55')
})

test('phones: no sideways scroll, flipper fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  const window = await page.locator('.mk-flipper-window').boundingBox()
  expect(window!.width).toBeLessThanOrEqual(350)
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
