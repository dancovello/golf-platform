import { expect, test } from './fixtures'

// The course tours of "Test Club Tour", seeded in tests/e2e/seed-world.ts: an 18-hole course
// whose holes are filled in to different degrees (hole 1 a photo only, hole 2 everything,
// hole 3 a name and a photo, hole 4 nothing at all, hole 6 everything at its longest), one
// page per design style, and a 9-hole tour of a course with no photos.
const club = '/preview/test-club-tour'
const styles = [
  { name: 'A · Hole story', page: `${club}/tour` },
  { name: 'B · Split-screen guide', page: `${club}/tour-split` },
  { name: 'C · Course journey', page: `${club}/tour-journey` },
]

/** Nothing on the page is wider than the window (no sideways page scroll). */
const fitsWindow = async (page: import('@playwright/test').Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )

for (const style of styles) {
  test.describe(style.name, () => {
    test('a full hole shows every part the club filled in', async ({ page }) => {
      await page.goto(`${style.page}/hole-2`)
      await expect(page).toHaveTitle('Hole 2: The Firs | The Old Course | Test Club Tour')
      const tour = page.locator('.tour')
      await expect(tour.getByRole('heading', { level: 1 })).toHaveText('Hole 2: The Firs')
      // Facts: the ladies' figures only show because this hole has them.
      const facts = tour.locator('.tour-facts').first()
      await expect(facts).toContainText('Par4')
      await expect(facts).toContainText('Stroke index1')
      await expect(facts).toContainText('Ladies’ par5')
      await expect(facts).toContainText('Length461 yds')
      // Tees in the club's order, with the club's own names.
      await expect(tour.locator('.tour-tee-name')).toHaveText([
        'Championship Back Markers',
        'White',
        'Yellow',
        'Forward',
      ])
      await expect(tour.getByText('A long, gently rising par 4')).toBeVisible()
      await expect(tour.getByText('Ditch at 296')).toBeVisible()
      await expect(tour.getByText('Take one more club than you think')).toBeVisible()
      await expect(tour.getByText('James Holt, Head professional')).toBeVisible()
      await expect(tour.getByRole('link', { name: /scorecard/i }).first()).toHaveAttribute(
        'href',
        `${club}/scorecard`,
      )
      // Nothing is asked of YouTube until the visitor presses play.
      await expect(page.locator('iframe')).toHaveCount(0)
    })

    test('a hole with nothing but its par draws no empty parts', async ({ page }) => {
      await page.goto(`${style.page}/hole-4`)
      await expect(page).toHaveTitle('Hole 4 | The Old Course | Test Club Tour')
      const tour = page.locator('.tour')
      await expect(tour.getByRole('heading', { level: 1 })).toHaveText('Hole 4')
      await expect(tour.locator('.tour-facts').first()).toHaveText('Par5')
      for (const text of ['About the hole', 'Watch out for', 'How to play it', 'The pro’s tip'])
        await expect(tour.getByText(text)).toHaveCount(0)
      await expect(tour.locator('.tour-tee')).toHaveCount(0)
      await expect(tour.getByRole('button', { name: /video/i })).toHaveCount(0)
    })

    test('the first and last holes have no hole before or after them', async ({ page }) => {
      await page.goto(`${style.page}/hole-1`)
      const tour = page.locator('.tour')
      await expect(tour.getByRole('link', { name: /Hole 2: The Firs/ }).first()).toBeVisible()
      await expect(tour.getByRole('link', { name: /^Previous hole/ })).toHaveCount(0)
      await page.goto(`${style.page}/hole-18`)
      await expect(tour.getByRole('heading', { level: 1 })).toHaveText('Hole 18: Hole name 18')
      await expect(tour.getByRole('link', { name: /^Next hole/ })).toHaveCount(0)
      await expect(tour.getByText('Up next')).toHaveCount(0)
    })

    test('the hole picker marks the current hole and goes to another', async ({ page }) => {
      await page.goto(`${style.page}/hole-2`)
      const current = page.locator('.tour [aria-current="page"]')
      await expect(current.first()).toHaveAttribute('href', `${style.page}/hole-2`)
      await page.locator(`.tour a[href="${style.page}/hole-3"]`).first().click()
      await expect(page).toHaveURL(`${style.page}/hole-3`)
      await expect(page.locator('.tour').getByRole('heading', { level: 1 })).toHaveText(
        'Hole 3: Short Cut',
      )
    })

    test('the longest text and the most photos a hole can have still fit', async ({ page }) => {
      // Hole 6 has every field at its limit: a 30-character name, 12 photos, 8 long tags.
      for (const width of [1366, 768, 360]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${style.page}/hole-6`)
        expect(await fitsWindow(page), `${width}px wide`).toBe(true)
      }
      await expect(page.locator('.tour-tag')).toHaveCount(8)
    })

    test('on a phone the longest tee name fits and nothing spills sideways', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 })
      for (const hole of [2, 4, 18]) {
        await page.goto(`${style.page}/hole-${hole}`)
        expect(await fitsWindow(page)).toBe(true)
      }
      await page.goto(`${style.page}/hole-2`)
      const row = page.locator('.tour-tee').first()
      const name = await row.locator('.tour-tee-name').boundingBox()
      const yards = await row.locator('.tour-tee-yards').boundingBox()
      // The name ends before the yardage starts: they never overlap, however long the name.
      expect((name?.x ?? 0) + (name?.width ?? 0)).toBeLessThanOrEqual((yards?.x ?? 0) + 1)
    })
  })
}

test('the tour’s own page shows the first hole', async ({ page }) => {
  await page.goto(`${club}/tour`)
  await expect(page).toHaveTitle('Course tour | Test Club Tour')
  await expect(page.locator('.tour').getByRole('heading', { level: 1 })).toHaveText('Hole 1')
  await expect(page.locator('.tour [aria-current="page"]').first()).toHaveAttribute(
    'href',
    `${club}/tour/hole-1`,
  )
})

test('a hole the course does not have is a "page not found"', async ({ page }) => {
  for (const path of [
    `${club}/tour/hole-19`, // no course has 19 holes
    `${club}/tour-nine/hole-12`, // a 9-hole course
    `${club}/tour/hole-0`,
    `${club}/tour/hole-02`,
    `${club}/scorecard/hole-2`, // a page without a course tour
  ]) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
  }
})

test('a 9-hole course with no photos still gives every hole a page', async ({ page }) => {
  await page.goto(`${club}/tour-nine/hole-9`)
  const tour = page.locator('.tour')
  await expect(tour.getByRole('heading', { level: 1 })).toHaveText('Hole 9')
  await expect(tour.locator('.tour-chip')).toHaveCount(9)
  // No "Out" and "In" for nine holes, and no broken images.
  await expect(tour.locator('.tour-chip-nine')).toHaveCount(0)
  await expect(tour.locator('img')).toHaveCount(0)
})

test('style A: the video opens in a pop-up, and Esc closes it', async ({ page }) => {
  await page.goto(`${club}/tour/hole-2`)
  const button = page.getByRole('button', { name: 'Watch the video' })
  await button.click()
  const dialog = page.getByRole('dialog', { name: 'Video: Hole 2: The Firs' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com/)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(button).toBeFocused()
})

// Styles B and C share one media viewer (src/site/blocks/TourMedia.tsx).
for (const style of styles.slice(1)) {
  test.describe(`${style.name}: media viewer`, () => {
    test('switches between photos, the plan and the video', async ({ page }) => {
      await page.goto(`${style.page}/hole-2`)
      const media = page.locator('.tour-media').first()
      const show = media.getByRole('group', { name: 'Show' })
      await expect(show.getByRole('button')).toHaveText(['Photos', 'Hole plan', 'Video'])
      await show.getByRole('button', { name: 'Hole plan' }).click()
      await expect(media.getByAltText('Plan of the second hole')).toBeVisible()
      await show.getByRole('button', { name: 'Video' }).click()
      // Still nothing from YouTube: only pressing play loads the player.
      await expect(page.locator('iframe')).toHaveCount(0)
      await media.getByRole('button', { name: 'Play video: Hole 2: The Firs' }).click()
      await expect(media.locator('iframe')).toHaveAttribute('src', /youtube/)
      // Leaving the video removes the player, which stops it.
      await show.getByRole('button', { name: 'Photos' }).click()
      await expect(page.locator('iframe')).toHaveCount(0)
    })

    test('moves through the photos by arrow and by keyboard', async ({ page }) => {
      await page.goto(`${style.page}/hole-2`)
      const media = page.locator('.tour-media').first()
      const count = media.locator('.tour-media-count')
      await expect(count).toHaveText('Photo 1 / 4')
      await media.getByRole('button', { name: 'Next photo' }).click()
      await expect(count).toHaveText('Photo 2 / 4')
      await expect(media.getByAltText('Looking back to the tee')).toBeVisible()
      await page.keyboard.press('ArrowRight')
      await expect(count).toHaveText('Photo 3 / 4')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await expect(count).toHaveText('Photo 4 / 4')
    })

    test('expands into a pop-up; Esc closes it and focus comes back', async ({ page }) => {
      await page.goto(`${style.page}/hole-2`)
      const expand = page.getByRole('button', { name: 'Expand' })
      await expand.click()
      const dialog = page.getByRole('dialog', { name: 'Photos and video: Hole 2: The Firs' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: /^Photo \d/ })).toHaveCount(4)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(expand).toBeFocused()
      await expand.click()
      await dialog.getByRole('button', { name: 'Close' }).click()
      await expect(dialog).toBeHidden()
    })

    test('a hole with twelve photos counts them all', async ({ page }) => {
      await page.goto(`${style.page}/hole-6`)
      const media = page.locator('.tour-media').first()
      await expect(media.locator('.tour-media-count')).toHaveText('Photo 1 / 12')
      await media.getByRole('button', { name: 'Previous photo' }).click()
      await expect(media.locator('.tour-media-count')).toHaveText('Photo 12 / 12')
      // No video on this hole, so the switch offers photos and the plan only.
      await expect(media.getByRole('group', { name: 'Show' }).getByRole('button')).toHaveText([
        'Photos',
        'Hole plan',
      ])
    })

    test('offers only what the hole has', async ({ page }) => {
      // Hole 3 has one photo: no switch, no count, no arrows.
      await page.goto(`${style.page}/hole-3`)
      const media = page.locator('.tour-media').first()
      await expect(media.getByRole('group', { name: 'Show' })).toHaveCount(0)
      await expect(media.locator('.tour-media-count')).toHaveCount(0)
      await expect(media.getByRole('button', { name: 'Expand' })).toBeVisible()
      // Hole 4 has no photo at all: the hole's number on the club's colour, nothing to expand.
      await page.goto(`${style.page}/hole-4`)
      await expect(media.locator('.tour-media-none')).toHaveText('04')
      await expect(media.getByRole('button', { name: 'Expand' })).toHaveCount(0)
    })
  })
}

test('style C: the filmstrip shows one nine at a time, and tabs follow the notes', async ({
  page,
}) => {
  await page.goto(`${club}/tour-journey/hole-2`)
  const strip = page.locator('.tour-film-strip')
  await expect(strip.locator(`a[href="${club}/tour-journey/hole-9"]`)).toBeVisible()
  await expect(strip.locator(`a[href="${club}/tour-journey/hole-10"]`)).toBeHidden()
  await page.getByRole('button', { name: 'Back nine' }).click()
  await expect(strip.locator(`a[href="${club}/tour-journey/hole-10"]`)).toBeVisible()
  await page.getByRole('button', { name: 'All 18' }).click()
  await expect(strip.locator('a:visible')).toHaveCount(18)

  await expect(page.getByRole('tab')).toHaveText([
    'Overview',
    'Off the tee',
    'The approach',
    'On the green',
  ])
  await page.getByRole('tab', { name: 'The approach' }).click()
  await expect(page.getByText('Most players come in with a long iron')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Continue to hole 3' })).toHaveAttribute(
    'href',
    `${club}/tour-journey/hole-3`,
  )
  // Hole 18 has one note and no description: its text shows without any tabs.
  await page.goto(`${club}/tour-journey/hole-18`)
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.getByText('It runs away from you.')).toBeVisible()
})

test('style A: the header has an Expand button that opens the photos, plan and video', async ({
  page,
}) => {
  await page.goto(`${club}/tour/hole-2`)
  const expand = page.locator('.tour-hero').getByRole('button', { name: /^Expand/ })
  await expect(expand).toBeVisible()
  await expand.click()
  const dialog = page.getByRole('dialog', { name: 'Photos and video: Hole 2: The Firs' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /^Photo \d/ })).toHaveCount(4)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(expand).toBeFocused()
  // A hole with no photo, plan or video has nothing to expand.
  await page.goto(`${club}/tour/hole-4`)
  await expect(page.locator('.tour-hero').getByRole('button', { name: /^Expand/ })).toHaveCount(0)
})

test('style C: the bar under the filmstrip moves as the strip scrolls', async ({ page }) => {
  await page.goto(`${club}/tour-journey/hole-2`)
  await page.getByRole('button', { name: 'All 18' }).click()
  const marker = page.locator('.tour-film-progress span')
  const before = await marker.evaluate((el) => parseFloat(el.style.left))
  await page.locator('.tour-film-strip').evaluate((el) => el.scrollTo({ left: el.scrollWidth }))
  await expect
    .poll(() => marker.evaluate((el) => parseFloat(el.style.left)))
    .toBeGreaterThan(before + 10)
})

test('style C: each tab carries more than one sentence', async ({ page }) => {
  await page.goto(`${club}/tour-journey/hole-2`)
  await page.getByRole('tab', { name: 'Off the tee' }).click()
  const panel = page.getByRole('tabpanel')
  await expect(panel.getByRole('list', { name: 'Playing order' })).toBeVisible()
  await expect(panel.locator('.tour-step-photo img')).toBeVisible()
})
