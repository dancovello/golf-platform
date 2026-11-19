import AxeBuilder from '@axe-core/playwright'

import { expect, openReady, test } from './fixtures'

// The admin's main screens must keep passing the accessibility checks that matter most to a
// screen-reader user: every checkbox, button and drop-down has a name, and text is readable
// (system test QA-05). Payload draws most of these screens, so a few of its own known problems
// are left out (listed below) rather than hiding new ones.

const SCREENS = [
  '/admin',
  '/admin/collections/pages',
  '/admin/collections/news',
  '/admin/collections/media',
  '/admin/account',
  '/admin/collections/pages/create',
]

// Payload's own page-tab bar: a tab whose name differs from its visible text, and a list that
// holds a non-list child. Not ours to change.
const PAYLOAD_OWN = new Set(['label-content-name-mismatch', 'list'])

for (const url of SCREENS) {
  test(`${url}: controls have names and text is readable`, async ({ editorPage: page }) => {
    await openReady(page, url)
    await page.waitForTimeout(1500)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const found = result.violations.filter((v) => !PAYLOAD_OWN.has(v.id))
    expect(
      found.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`),
    ).toEqual([])
  })
}

for (const width of [390, 768]) {
  test(`the account screen fits a ${width}px-wide screen (QA-04)`, async ({ editorPage: page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openReady(page, '/admin/account')
    await page.waitForTimeout(1000)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  })
}
