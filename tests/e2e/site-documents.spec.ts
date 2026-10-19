import { expect, test } from './fixtures'

// Club A's document library (Document List C), seeded in tests/e2e/seed-world.ts.
const url = '/preview/test-club-a/documents'

test('search and category tabs filter the library', async ({ page, world }) => {
  await page.goto(url)
  const rows = page.locator('.dl-table tbody tr')
  await expect(rows).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Policies (2)' })).toBeVisible()

  await page.getByRole('searchbox').fill('privacy')
  await expect(rows).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'All (1)' })).toBeVisible()

  await page.getByRole('searchbox').fill('nothing like this')
  await expect(page.getByText('No documents match “nothing like this”.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await page.getByRole('button', { name: 'Forms (1)' }).click()
  await expect(rows).toHaveCount(1)
  expect(await page.content()).not.toContain(world.clubB.name)
})

test('each document downloads from its own address, with type and size in its name', async ({
  page,
}) => {
  await page.goto(url)
  const link = page.getByRole('link', { name: /^Download Safeguarding policy \(PDF, \d+ KB\)$/ })
  await expect(link).toHaveAttribute(
    'href',
    /\/documents\/[0-9a-f-]{36}\/[0-9a-z]{6}-safeguarding-policy\.pdf$/,
  )
})

test('a policy not reviewed for over a year is flagged, not hidden', async ({ page }) => {
  await page.goto(url)
  // "Today" is pinned to 15 July 2026 for the browser tests; reviewed 20 January 2025.
  await expect(page.locator('.dl-overdue').filter({ hasText: '20 January 2025' })).toBeVisible()
})

test('documents open in a new tab', async ({ page }) => {
  await page.goto(url)
  const download = page.locator('.dl-table tbody tr').first().getByRole('link')
  await expect(download).toHaveAttribute('target', '_blank')
  await expect(download).toHaveAccessibleDescription('Opens in a new tab')
})
