import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

// The marketing site's look (plan phase 1.3): its own tokens and fonts, scoped so they never
// reach a club site, a skip link, and no automatically detectable accessibility problems.

const site = (path = '/') => `http://marketing.localhost:3100${path}`

const violations = async (page: Page) =>
  (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
  ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)

const bodyStyle = (page: Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body)
    return {
      background: style.backgroundColor,
      canvas: style.getPropertyValue('--mk-surface-canvas').trim(),
      headingFont: getComputedStyle(document.querySelector('h1') ?? document.body).fontFamily,
    }
  })

test('marketing pages use the marketing colours and fonts', async ({ page }) => {
  for (const path of ['/', '/e2e-pricing', '/no-such-page']) {
    await page.goto(site(path))
    const style = await bodyStyle(page)
    expect(style.background, path).toBe('rgb(9, 26, 19)')
    expect(style.canvas, path).toBe('#091a13')
    expect(style.headingFont.toLowerCase(), path).toContain('newsreader')
  }
})

test("the marketing look never reaches a club's site", async ({ page }) => {
  await page.goto('http://club-a.localhost:3100/')
  const style = await bodyStyle(page)
  expect(style.canvas).toBe('')
  expect(style.headingFont.toLowerCase()).not.toContain('newsreader')
  expect(await page.locator('body.mk').count()).toBe(0)
})

test('the first Tab reaches “Skip to content”, which jumps to the page', async ({ page }) => {
  await page.goto(site('/e2e-pricing'))
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await skip.press('Enter')
  await expect(page).toHaveURL(/#main$/)
})

test('no accessibility problems axe can find, on phone and desktop widths', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/e2e-pricing', '/no-such-page']) {
      await page.goto(site(path))
      expect(await violations(page), `${path} at ${width}px`).toEqual([])
    }
  }
})
