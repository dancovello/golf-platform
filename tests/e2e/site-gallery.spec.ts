import { expect, test } from './fixtures'

// Club A's gallery page: a Grid gallery of 13 photos (tests/e2e/seed-world.ts).
const url = '/preview/test-club-a/gallery'

test('"Load more" shows the rest of the photos', async ({ page }) => {
  await page.goto(url)
  const photos = page.getByRole('button', { name: /^Open photo:/ })
  await expect(photos).toHaveCount(12)
  await expect(page.getByText('Showing 12 of 13')).toBeVisible()
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(photos).toHaveCount(13)
})

test('the viewer opens at a photo, moves with the arrow keys and closes with Esc', async ({
  page,
}) => {
  await page.goto(url)
  const third = page.getByRole('button', { name: 'Open photo: Gallery photo 3' })
  await third.click()
  const viewer = page.getByRole('dialog', { name: 'Around the club' })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByText('03 / 12')).toBeVisible()
  await expect(viewer.getByRole('img', { name: 'Gallery photo 3' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(viewer.getByText('04 / 12')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(third).toBeFocused()
})
