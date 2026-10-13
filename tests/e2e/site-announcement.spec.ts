import { expect, test } from './fixtures'

// Club A's announcement (style A), seeded in tests/e2e/seed-world.ts.
const url = '/preview/test-club-a/membership'

test('a long notice can be read in full, and can be dismissed for the visit', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto(url)
  const bar = page.getByRole('region', { name: 'Site announcement' })
  await expect(bar).toContainText('The Championship course reopens')
  await expect(bar).not.toContainText('An expired notice')

  await bar.getByRole('button', { name: 'Read more' }).click()
  await expect(bar.getByRole('button', { name: 'Show less' })).toBeVisible()

  await bar.getByRole('button', { name: 'Dismiss announcement' }).click()
  await expect(bar).toBeHidden()
  await page.reload()
  await expect(page.getByRole('region', { name: 'Site announcement' })).toBeHidden()
})
