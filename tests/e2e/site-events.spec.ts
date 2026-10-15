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
