import type { Browser, BrowserContextOptions, Page } from '@playwright/test'

import { expect, test } from './fixtures'

// The homepage golf ball intro (plan phase 7, src/marketing/intro). These tests open their own
// browser: the shared fixtures mark the intro as seen so it stays out of other tests' way.

const site = (path = '/') => `http://marketing.localhost:3100${path}`

const freshVisitor = async (browser: Browser, options: BrowserContextOptions = {}) => {
  const context = await browser.newContext(options)
  return { context, page: await context.newPage() }
}
const introState = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-intro'))
// The intro only listens for keys, scrolls and clicks once the page has hydrated, which can
// be after the browser's load event (slow machines, CI). HomeIntro marks <html
// data-intro-started> in the same step that adds its listeners, so wait for that before
// interacting: a key pressed earlier is simply lost and the intro never ends.
const introListening = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-intro-started', '')
// The reveal takes about a second, but CI draws the 3D ball in software while other browsers
// run alongside, and 5 seconds was not always enough. This is only how long to wait, not how
// long the intro takes.
const introHidden = (page: Page) =>
  expect(page.locator('.mk-intro')).toBeHidden({ timeout: 20_000 })

test('a first visit plays the intro, and the first scroll reveals the page', async ({
  browser,
}) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  await expect(page.locator('.mk-intro')).toBeVisible()
  await introListening(page)
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '0')
  await expect(page.locator('.mk-intro-ball')).toHaveCSS('opacity', '1')

  await page.mouse.move(400, 300)
  await page.mouse.wheel(0, 400)
  await introHidden(page)
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '1')
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  // The scroll that started the reveal didn't move the page...
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  // ...and afterwards the page scrolls as normal.
  await page.mouse.wheel(0, 400)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  // Once per session: back on the homepage, no intro.
  await page.goto(site('/pricing'))
  await page.goto(site())
  expect(await introState(page)).toBeNull()
  await introHidden(page)
  await context.close()
})

test('the logo sits just above the ball and is part of the intro', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  const mark = page.locator('.mk-intro .mk-intro-mark')
  await expect(mark).toBeVisible()
  // Its bottom edge is above the ball's top edge (46% down the screen, Dan's setting).
  const box = (await mark.boundingBox())!
  const height = page.viewportSize()!.height
  expect(box.y + box.height).toBeLessThanOrEqual(height * 0.46)
  expect(box.y).toBeGreaterThanOrEqual(0)
  // It is inside the ball's layer, so it fades out with the ball, and goes with the intro.
  await expect(page.locator('.mk-intro-ball .mk-intro-mark')).toHaveCount(1)
  await page.keyboard.press('Tab')
  await introHidden(page)
  await context.close()
})

test('refreshing the homepage replays the intro, from the top', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  await introListening(page)
  await page.keyboard.press('Tab')
  await introHidden(page)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  await page.reload()
  await expect(page.locator('.mk-intro')).toBeVisible()
  // The intro puts the page back at the top as it starts, so check only once it has.
  await introListening(page)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.keyboard.press('Tab')
  await introHidden(page)
  // Scrolling is back to normal afterwards.
  expect(await page.evaluate(() => window.history.scrollRestoration)).toBe('auto')
  await context.close()
})

test('any key, or the Scroll cue, reveals the page', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  await expect(page.locator('.mk-intro')).toBeVisible()
  await introListening(page)
  await page.keyboard.press('Tab')
  await introHidden(page)
  await context.close()

  const second = await freshVisitor(browser)
  await second.page.goto(site())
  await introListening(second.page)
  await second.page.getByRole('button', { name: 'Scroll to skip the intro' }).click()
  await introHidden(second.page)
  await expect(second.page.locator('.mk-nav')).toHaveCSS('opacity', '1')
  await second.context.close()
})

test('no intro when the device asks for reduced motion', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser, { reducedMotion: 'reduce' })
  await page.goto(site())
  expect(await introState(page)).toBeNull()
  await introHidden(page)
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '1')
  await context.close()
})

test('no intro on other pages, or on a link to a section further down', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site('/pricing'))
  expect(await introState(page)).toBeNull()
  await page.goto(site('/#main'))
  expect(await introState(page)).toBeNull()
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '1')
  await context.close()
})

test('the page still appears if the intro’s code never loads', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  // Block every script file: only the small script in the page itself runs.
  await context.route('**/_next/static/chunks/**/*.js', (route) => route.abort())
  await page.goto(site())
  expect(await introState(page)).toBe('play')
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '1', { timeout: 8_000 })
  expect(await introState(page)).toBeNull()
  await context.close()
})
