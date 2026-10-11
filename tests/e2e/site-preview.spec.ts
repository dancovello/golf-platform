import { expect, test } from './fixtures'

// The staging-only club preview (src/app/(frontend)/preview/[club]). Visitors aren't logged
// in, so these prove the page shows exactly one club and nothing about any other.

test("club A's preview shows club A and nothing of club B", async ({ page, world: w }) => {
  const response = await page.goto('/preview/test-club-a')
  expect(response?.status()).toBe(200)
  await expect(page.getByText(w.clubA.name, { exact: true })).toBeVisible()
  const html = await page.content()
  for (const secret of [w.clubB.name, w.clubB.id, w.pageB.title]) {
    expect(html, secret).not.toContain(secret)
  }
})

test('an unknown club is "not found"', async ({ page }) => {
  const response = await page.goto('/preview/no-such-club')
  expect(response?.status()).toBe(404)
})
