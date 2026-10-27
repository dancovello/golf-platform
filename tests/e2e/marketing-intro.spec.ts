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

test('a first visit plays the intro, and the first scroll reveals the page', async ({
  browser,
}) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  await expect(page.locator('.mk-intro')).toBeVisible()
  await expect(page.locator('.mk-nav')).toHaveCSS('opacity', '0')
  await expect(page.locator('.mk-intro-ball')).toHaveCSS('opacity', '1')

  await page.mouse.move(400, 300)
  await page.mouse.wheel(0, 400)
  await expect(page.locator('.mk-intro')).toBeHidden()
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
  await expect(page.locator('.mk-intro')).toBeHidden()
  await context.close()
})

test('any key, or the Scroll cue, reveals the page', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser)
  await page.goto(site())
  await expect(page.locator('.mk-intro')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.locator('.mk-intro')).toBeHidden()
  await context.close()

  const second = await freshVisitor(browser)
  await second.page.goto(site())
  await second.page.getByRole('button', { name: 'Scroll to skip the intro' }).click()
  await expect(second.page.locator('.mk-intro')).toBeHidden()
  await expect(second.page.locator('.mk-nav')).toHaveCSS('opacity', '1')
  await second.context.close()
})

test('no intro when the device asks for reduced motion', async ({ browser }) => {
  const { context, page } = await freshVisitor(browser, { reducedMotion: 'reduce' })
  await page.goto(site())
  expect(await introState(page)).toBeNull()
  await expect(page.locator('.mk-intro')).toBeHidden()
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
