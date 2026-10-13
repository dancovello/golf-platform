import { expect, type Page, test } from '@playwright/test'

import { VISUAL_CLUBS, VISUAL_PAGES, VISUAL_VIEWPORTS } from './pages'

/**
 * The block-regression check (doc 04 §7): every block page and the header/footer, in both
 * colour themes, on desktop and mobile, compared with the approved pictures in
 * tests/visual/__screenshots__. A change that alters any of them fails the check.
 * Approved pictures are made on GitHub's Linux machines (workflow "Update block pictures"),
 * never on a Mac, because fonts render slightly differently.
 */
const settle = async (page: Page, { hideHeader = true, hideBar = true } = {}) => {
  // Block pictures leave the header and announcement bar out (each has its own picture): the
  // header reacts to scrolling, the camera scrolls to photograph long pages, and the bar's
  // height can land on a fraction of a pixel, which would shift every block picture.
  await page.addStyleTag({
    content: hideHeader
      ? 'header.sh, .ab { display: none !important; }'
      : `header.sh { position: static !important; }${hideBar ? ' .ab { display: none !important; }' : ''}`,
  })
  await page.evaluate(async () => {
    // Photos further down load lazily; load them all before the picture is taken.
    for (const img of document.images) img.loading = 'eager'
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((img) =>
        img.complete && img.naturalWidth > 0
          ? img.decode().catch(() => null)
          : new Promise((done) => {
              img.addEventListener('load', done, { once: true })
              img.addEventListener('error', done, { once: true })
            }),
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
            // Dates that change by themselves (e.g. "Prices last updated") are masked.
            { animations: 'disabled', caret: 'hide', mask: [page.locator('[data-volatile]')] },
          )
        })
      }

      test('announcement bar', async ({ page }) => {
        // Rotating notices stand still for people who prefer reduced motion, and here.
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(`/preview/${club.slug}/about`)
        await settle(page, { hideHeader: false, hideBar: false })
        await expect(page.getByRole('region', { name: 'Site announcement' })).toHaveScreenshot(
          `announcement--${club.slug}--${viewport.name}.png`,
          { animations: 'disabled' },
        )
      })

      test('header and footer', async ({ page }) => {
        await page.goto(`/preview/${club.slug}/about`)
        await settle(page, { hideHeader: false })
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
