import { expect, type Page, test } from '@playwright/test'

import { VISUAL_CLUBS, VISUAL_PAGES, VISUAL_VIEWPORTS } from './pages'

/**
 * The block-regression check (doc 04 §7): every block page and the header/footer, in both
 * colour themes, on desktop and mobile, compared with the approved pictures in
 * tests/visual/__screenshots__. A change that alters any of them fails the check.
 * Approved pictures are made on GitHub's Linux machines (workflow "Update block pictures"),
 * never on a Mac, because fonts render slightly differently.
 */
const settle = async (page: Page) => {
  // The sticky header has its own picture; keep it from being printed over the page's.
  await page.addStyleTag({ content: 'header.sh { position: static !important; }' })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((done) => img.addEventListener('load', done, { once: true })),
      ),
    )
  })
}

for (const club of VISUAL_CLUBS) {
  for (const viewport of VISUAL_VIEWPORTS) {
    test.describe(`${club.theme} · ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      for (const slug of VISUAL_PAGES) {
        test(`${slug} block`, async ({ page }) => {
          await page.goto(`/preview/${club.slug}/${slug}`)
          await settle(page)
          await expect(page.locator('main')).toHaveScreenshot(
            `${slug}--${club.slug}--${viewport.name}.png`,
            { animations: 'disabled', caret: 'hide' },
          )
        })
      }

      test('header and footer', async ({ page }) => {
        await page.goto(`/preview/${club.slug}/about`)
        await settle(page)
        await expect(page.locator('header.sh')).toHaveScreenshot(
          `header--${club.slug}--${viewport.name}.png`,
          { animations: 'disabled' },
        )
        await expect(page.locator('footer.sf')).toHaveScreenshot(
          `footer--${club.slug}--${viewport.name}.png`,
          // The © year changes once a year; don't let that fail the check.
          { animations: 'disabled', mask: [page.locator('.sf-legal p')] },
        )
      })
    })
  }
}
