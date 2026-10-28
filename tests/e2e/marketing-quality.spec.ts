import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

// Phase 9 quality pass (docs/plans/phase-9-quality-pass.md): every published marketing page gets
// the automatic accessibility check at phone, tablet and desktop widths, a keyboard-only pass,
// a 400% zoom check, and tablet screenshots for Dan. Automatic checks catch only part of the
// problems; the accessibility statement still says "designed to meet" until a person has used a
// screen reader on the site.

const site = (path: string) => `http://marketing.localhost:3100${path}`

// The published pages from the Figma copy (src/marketing/starter/pages.ts). The legal pages stay
// drafts until Dan's wording is in, so they aren't visited here (marketing-info.spec.ts).
const PAGES = [
  '/',
  '/pricing',
  '/switching',
  '/book-a-demo',
  '/website-builder',
  '/bookings',
  '/trust',
  '/accessibility',
  '/changelog',
  '/no-such-page',
]

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )

const overflowsSideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test('axe finds nothing on any marketing page at phone, tablet and desktop widths', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of PAGES) {
      await page.goto(site(path))
      expect(await violations(page), `${path} at ${width}px`).toEqual([])
    }
  }
})

test('every page works at 400% zoom: no sideways scrolling, axe still clean', async ({ page }) => {
  test.setTimeout(120_000)
  // 400% zoom on a 1280px-wide window is a 320 x 256 CSS pixel screen (WCAG 1.4.10 Reflow).
  await page.setViewportSize({ width: 320, height: 256 })
  for (const path of PAGES) {
    await page.goto(site(path))
    expect(await overflowsSideways(page), `${path} scrolls sideways at 400%`).toBeLessThanOrEqual(1)
    expect(await violations(page), `${path} at 400%`).toEqual([])
  }
})

type Stop = { label: string; visibleMark: boolean }

const tabThrough = async (page: Page, limit: number) => {
  const stops: Stop[] = []
  let repeats = 0
  let previous = ''
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      el.setAttribute('data-tabbed', '')
      const style = getComputedStyle(el)
      const outlined = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      const shadowed = style.boxShadow !== 'none'
      // Text fields mark focus with their border colour (the Figma design). That counts when the
      // colour really changes and stands out from the field's own background by 3:1 (WCAG 1.4.11).
      const channels = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      const luminance = (colour: string) => {
        const [r, g, b] = channels(colour).map((v) => {
          const c = v / 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
      }
      const focusedBorder = style.borderTopColor
      // The field's own fill is see-through, so the page behind it is what the border shows against.
      const background = getComputedStyle(document.body).backgroundColor
      ;(el as HTMLElement).blur()
      const restingBorder = getComputedStyle(el).borderTopColor
      ;(el as HTMLElement).focus()
      const [light, dark] = [luminance(focusedBorder), luminance(background)].sort((a, b) => b - a)
      const borderMark = focusedBorder !== restingBorder && (light! + 0.05) / (dark! + 0.05) >= 3
      const name =
        el.getAttribute('aria-label') ||
        el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) ||
        el.getAttribute('href') ||
        el.tagName
      const kind = el.getAttribute('type') ? ` type=${el.getAttribute('type')}` : ''
      return {
        label: `${el.tagName.toLowerCase()}${kind} “${name}” in .${el.parentElement?.className} (border ${focusedBorder}, was ${restingBorder}, field ${background})`,
        visibleMark: outlined || shadowed || borderMark,
      }
    })
    // Focus left the page (to the browser's own controls): the whole page has been walked.
    if (!stop) break
    repeats = stop.label === previous ? repeats + 1 : 0
    previous = stop.label
    expect(repeats, `keyboard trapped on ${stop.label}`).toBeLessThan(3)
    stops.push(stop)
  }
  return stops
}

test('keyboard only: every stop shows where you are, nothing traps you, nothing is skipped', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const path of PAGES) {
    await page.goto(site(path))
    // Colour fades would be measured half way; the final colours are what matter here.
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important }' })
    const stops = await tabThrough(page, 200)
    expect(stops.length, `${path} has keyboard stops`).toBeGreaterThan(0)
    expect(
      stops.filter((s) => !s.visibleMark).map((s) => s.label),
      `${path}: stops with no visible focus mark`,
    ).toEqual([])

    // Every visible link and button must have been one of the stops (the demos' own controls count).
    const missed = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')]
        .filter((el) => {
          const box = el.getBoundingClientRect()
          return (
            box.width > 0 &&
            box.height > 0 &&
            getComputedStyle(el).visibility !== 'hidden' &&
            el.tabIndex >= 0 &&
            !el.closest('[inert], [aria-hidden="true"]') &&
            !(el as HTMLButtonElement).disabled &&
            !el.hasAttribute('data-tabbed') &&
            // Radio groups and tab lists: Tab visits one member and the arrow keys move between
            // them (checked as a group below), so the other members are not Tab stops.
            !el.closest('[role="radiogroup"], [role="tablist"]') &&
            // Native radio buttons work the same way: Tab visits one of a named set.
            !(
              el instanceof HTMLInputElement &&
              el.type === 'radio' &&
              [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')].some(
                (other) => other.name === el.name && other.hasAttribute('data-tabbed'),
              )
            )
          )
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()} “${el.textContent?.trim().slice(0, 40) || el.getAttribute('aria-label') || el.getAttribute('href')}”`,
        ),
    )
    const skippedGroups = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[role="radiogroup"], [role="tablist"]')]
        .filter(
          (group) =>
            group.getBoundingClientRect().width > 0 &&
            !group.closest('[inert], [aria-hidden="true"]'),
        )
        .filter((group) => !group.querySelector('[data-tabbed]'))
        .map((group) => group.getAttribute('aria-label') ?? group.className),
    )
    expect(skippedGroups, `${path}: groups the Tab key never entered`).toEqual([])
    expect(missed, `${path}: controls the Tab key never reached`).toEqual([])
  }
})

test('tablet screenshots for Dan, and nothing runs off the side', async ({ page }, testInfo) => {
  test.setTimeout(180_000)
  // Tablet isn't designed, so these are pictures to look at, not pictures to match.
  for (const [width, height] of [
    [768, 1024],
    [1024, 768],
  ] as const) {
    await page.setViewportSize({ width, height })
    for (const path of PAGES.filter((p) => p !== '/no-such-page')) {
      await page.goto(site(path))
      expect(
        await overflowsSideways(page),
        `${path} scrolls sideways at ${width}px`,
      ).toBeLessThanOrEqual(1)
      const name = `tablet-${width}-${path === '/' ? 'home' : path.slice(1)}.png`
      await testInfo.attach(name, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })
    }
  }
})
