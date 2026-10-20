import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { CONTRAST_CLUBS, VISUAL_PAGES, VISUAL_TEMPLATES } from './pages'

/**
 * Every block and template page, for every test club's colours (one of them a pale brand
 * colour with too-faint text), checked for WCAG AA text contrast with axe. Text colours are
 * chosen by contrast (src/theme/colour.ts), so whatever colours a club picks, this stays at
 * zero. Text over photos is checked by the colour tests instead: axe can't see the photo.
 */
for (const club of CONTRAST_CLUBS) {
  const paths = [
    '',
    ...VISUAL_PAGES.map((p) => `/${p}`),
    ...VISUAL_TEMPLATES.map((t) => `/${t.path}`),
  ]
  test(`${club.theme}: all text reads at 4.5:1 on its background`, async ({ page }) => {
    test.setTimeout(240_000)
    await page.setViewportSize({ width: 1366, height: 900 })
    const problems: string[] = []
    for (const path of paths) {
      await page.goto(`/preview/${club.slug}${path}`)
      for (const scrolled of [false, true]) {
        if (scrolled) {
          // The transparent header turns solid once the page scrolls.
          await page.mouse.wheel(0, 600)
          await page.waitForTimeout(400) // the header's colour change takes 200ms
        }
        const { violations } = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze()
        for (const v of violations) {
          for (const node of v.nodes) problems.push(`${path || '/'}: ${node.target.join(' ')}`)
        }
      }
    }
    expect(problems).toEqual([])
  })
}
