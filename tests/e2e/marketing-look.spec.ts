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
    expect(style.headingFont.toLowerCase(), path).toContain('silka')
  }
})

test("the marketing look never reaches a club's site", async ({ page }) => {
  await page.goto('http://club-a.localhost:3100/')
  const style = await bodyStyle(page)
  expect(style.canvas).toBe('')
  expect(style.headingFont.toLowerCase()).not.toContain('silka')
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

// Measurements from the Figma marketing blocks (210:7925) and mobile frames (297:9754), on the
// seeded page that uses every block (tests/e2e/seed-world.ts → /e2e-blocks).
const measure = (page: Page) =>
  page.evaluate(() => {
    const box = (el: Element | null) => el?.getBoundingClientRect()
    const style = (sel: string) => getComputedStyle(document.querySelector(sel)!)
    const cta = style('.mk-cta-title')
    const cards = style('.mk-features--cards')
    return {
      pageTitle: [
        style('.mk-header--page .mk-header-title').fontSize,
        style('.mk-header--page .mk-header-title').letterSpacing,
      ],
      ctaTitle: [cta.fontSize, cta.lineHeight, cta.letterSpacing],
      buttons: [...document.querySelectorAll('.mk-cta .mk-button')].map((b) => ({
        height: box(b)!.height,
        width: Math.round(box(b)!.width),
        color: getComputedStyle(b).color,
        background: getComputedStyle(b).backgroundColor,
      })),
      cardColumns: cards.gridTemplateColumns,
      cardGap: cards.columnGap,
      rowsBorder: style('.mk-features--rows .mk-feature-inner').borderTopWidth,
      ctaPadding: [style('.mk-section--cta').paddingTop, style('.mk-section--cta').paddingBottom],
      sidePadding: box(document.querySelector('.mk-cta'))!.left,
      sideScroll: document.documentElement.scrollWidth > window.innerWidth,
    }
  })

test('desktop matches the Figma blocks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site('/e2e-blocks'))
  const m = await measure(page)
  // H1 (display XL) made smaller on 28 Oct (commit 2ea7fc7): 72px desktop, 40px phone.
  expect(m.pageTitle).toEqual(['72px', '-1.44px'])
  expect(m.ctaTitle).toEqual(['60px', '63px', '-1.08px'])
  expect(m.buttons).toEqual([
    {
      height: 36,
      width: expect.any(Number),
      color: 'rgb(9, 26, 19)',
      background: 'rgb(243, 241, 234)',
    },
    {
      height: 36,
      width: expect.any(Number),
      color: 'rgb(243, 241, 234)',
      background: 'rgba(243, 241, 234, 0.04)',
    },
  ])
  // Three cards: 384px each, 24px apart, filling the 1200px container.
  expect(m.cardColumns).toBe('384px 384px 384px')
  expect(m.cardGap).toBe('24px')
  expect(m.rowsBorder).toBe('1px')
  expect(m.ctaPadding).toEqual(['96px', '128px'])
  expect(m.sideScroll).toBe(false)
})

test('phones match the Figma mobile frames', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site('/e2e-blocks'))
  const m = await measure(page)
  expect(m.pageTitle).toEqual(['40px', '-0.72px'])
  expect(m.ctaTitle).toEqual(['32px', '36px', '-0.384px'])
  // Full-width 44px buttons, 20px from the edges.
  expect(m.buttons.map((b) => [b.height, b.width])).toEqual([
    [44, 350],
    [44, 350],
  ])
  expect(m.sidePadding).toBe(20)
  expect(m.ctaPadding).toEqual(['64px', '64px'])
  expect(m.sideScroll).toBe(false)
})
