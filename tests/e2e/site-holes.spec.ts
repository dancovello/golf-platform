import { expect, test } from './fixtures'

// Club A's course page (Hole-by-hole A and C), seeded in tests/e2e/seed-world.ts.
const url = '/preview/test-club-a/course'

test('a hole card opens its details, and Esc closes them', async ({ page }) => {
  await page.goto(url)
  await page.locator('.hole-card').first().click()
  const details = page.getByRole('dialog', { name: 'Hole 1' })
  await expect(details).toBeVisible()
  await expect(details.getByText('Par 4 · SI 1')).toBeVisible()
  await expect(details.getByText('White')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
})

test('the course guide shows three holes, then all of them', async ({ page }) => {
  await page.goto(url)
  const rows = page.locator('.hole-guide .hole-row')
  await expect(rows.filter({ visible: true })).toHaveCount(3)
  await page.getByRole('button', { name: 'Show all 9 holes' }).click()
  await expect(rows.filter({ visible: true })).toHaveCount(9)
  await expect(page.locator('#hole-9')).toBeVisible()
})
