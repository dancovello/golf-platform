import { expect, test } from './fixtures'

test('a missing page shows the club’s own “not found” page, with a 404', async ({ page }) => {
  const response = await page.goto('/preview/test-club-a/no-such-page')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Lost in the heather' })).toBeVisible()
  const ways = page.locator('.nf-links')
  await expect(ways.getByRole('link', { name: 'Book a tee time' })).toHaveAttribute(
    'href',
    'https://booking.example.com',
  )
  await expect(ways.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'href',
    '/preview/test-club-a',
  )
})

test('an unknown club gets a plain 404 that names no club', async ({ page, world }) => {
  const response = await page.goto('/preview/no-such-club/anything')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  const html = await page.content()
  expect(html).not.toContain(world.clubA.name)
  expect(html).not.toContain(world.clubB.name)
})
