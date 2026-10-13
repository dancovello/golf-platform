import { expect, test } from './fixtures'

// Club A's team page (Team A grid and B directory), seeded in tests/e2e/seed-world.ts.
const url = '/preview/test-club-a/team'

test('a person with a bio opens their profile, and Esc closes it', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: /Alex Pro/ }).click()
  const profile = page.getByRole('dialog', { name: 'Alex Pro' })
  await expect(profile).toBeVisible()
  await expect(profile.getByText('Alex has coached here for ten years.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(profile).toBeHidden()
})

test('email addresses are never whole in the page source, but still work', async ({
  page,
  request,
}) => {
  const html = await (await request.get(url)).text()
  expect(html).toContain('Alex Pro')
  expect(html).not.toContain('alex@club-a.example')

  await page.goto(url)
  const email = page.locator('.team-directory .team-contacts a').first()
  await expect(email).toHaveAttribute('href', 'mailto:alex@club-a.example')
  // The "@" is drawn by CSS, so the text itself is the two halves.
  await expect(email).toHaveText('alexclub-a.example')
  const at = await email
    .locator('.protected-at')
    .evaluate((el) => getComputedStyle(el, '::before').content)
  expect(at).toBe('"@"')
})
