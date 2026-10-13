import { expect, test } from './fixtures'

// Club A's help page (FAQ C), seeded in tests/e2e/seed-world.ts.
const url = '/preview/test-club-a/help'

test('topic tabs, search and the empty state', async ({ page }) => {
  await page.goto(url)
  const questions = page.locator('.faq-item summary')
  await expect(questions).toHaveCount(2) // Visitors tab
  await page.getByRole('button', { name: 'The course (1)' }).click()
  await expect(questions).toHaveText(['Is there a driving range?'])
  await page.getByRole('searchbox').fill('dress')
  await expect(questions).toHaveText(['What is the dress code?'])
  await page.getByRole('searchbox').fill('caddies')
  await expect(page.getByText('No answers for “caddies”.')).toBeVisible()
})

test('a link to a question opens it', async ({ page }) => {
  await page.goto(`${url}#faq-is-there-a-driving-range`)
  await expect(page.locator('#faq-is-there-a-driving-range')).toHaveAttribute('open', '')
  await expect(page.getByText('A 20-bay grass range.')).toBeVisible()
})

test('the questions are described for search engines', async ({ page }) => {
  await page.goto(url)
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  )
  expect(data['@type']).toBe('FAQPage')
  expect(data.mainEntity).toHaveLength(3)
})
