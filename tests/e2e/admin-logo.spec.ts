import { expect, test } from '@playwright/test'

// The admin shows the platform's own logo and name, not Payload's (Dan, 2026-11-04).
test('the sign-in screen shows the A1 Engine logo and tab title', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.getByRole('img', { name: 'A1 Engine' }).first()).toBeVisible()
  await expect(page).toHaveTitle(/A1 Engine/)
  await expect(page).not.toHaveTitle(/Payload/)
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute(
    'href',
    /^data:image\/svg\+xml/,
  )
})
