import { expect, test } from './fixtures'

// Club A's events archive, seeded in tests/e2e/seed-world.ts (8 events plus the dinner).
const url = '/preview/test-club-a/events'

test('category pills filter the archive, kept in the address', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Coming up' })).toBeVisible()
  await page.getByRole('link', { name: 'Competitions' }).click()
  await expect(page).toHaveURL(/\?category=competition$/)
  await expect(page.locator('.event-card')).toHaveCount(2)
  await expect(page.getByText('Showing 2 of 2 events')).toBeVisible()
})

test('"Show more events" adds six more', async ({ page }) => {
  await page.goto(url)
  await expect(page.locator('.event-card')).toHaveCount(6)
  await page.getByRole('link', { name: 'Show more events' }).click()
  await expect(page).toHaveURL(/\?show=12$/)
  await expect(page.locator('.event-card')).toHaveCount(9)
  await expect(page.getByRole('link', { name: 'Show more events' })).toHaveCount(0)
})

// Dan, 2026-10-17 (option A): a card holds when, where and price together, with the button
// inside the card at its foot, so buttons line up across a row.
test('event cards keep their details and button together, buttons lined up', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(url)
  const cards = page.locator('.event-card.is-stacked')
  await expect(cards.first().getByRole('term').first()).toHaveText('When')
  const bottoms = await cards.evaluateAll((els) =>
    els.slice(0, 3).map((card) => {
      const button = card.querySelector('.event-action')
      if (!button) return null
      const c = card.getBoundingClientRect()
      const b = button.getBoundingClientRect()
      return {
        inside: b.bottom <= c.bottom && b.top >= c.top,
        fromFoot: Math.round(c.bottom - b.bottom),
        top: Math.round(c.top),
      }
    }),
  )
  for (const b of bottoms) expect(b?.inside).toBe(true)
  // Cards in the same row: the buttons sit the same distance from the foot.
  const row = bottoms.filter((b) => b && b.top === bottoms[0]?.top)
  expect(new Set(row.map((b) => b?.fromFoot)).size).toBe(1)
})
