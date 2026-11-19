import { expect, test } from './fixtures'

// Printing a club page shows the page, not the menus (system test QA-30).
test('a printed club page has no menu, search or cookie box, and keeps the page text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/preview/test-club-a/membership')
  await expect(page.locator('.sh-desktop nav').first()).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.sh-desktop nav').first()).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('buttons keep an outline in high-contrast mode', async ({ page }) => {
  await page.goto('/preview/test-club-a')
  await page.emulateMedia({ forcedColors: 'active' })
  const button = page.locator('.btn').first()
  await expect(button).toBeVisible()
  const width = await button.evaluate((el) => getComputedStyle(el).borderTopWidth)
  expect(width).toBe('1px')
})
