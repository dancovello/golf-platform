import { expect, test } from './fixtures'

// Club A's site, seeded in tests/e2e/seed-world.ts. Every test here also fails if any response
// carries one of club B's secrets (tests/e2e/fixtures.ts), so club A's search can't leak club B.
const base = '/preview/test-club-a'

test('results are grouped by kind, with tabs that keep the search in the address', async ({
  page,
}) => {
  await page.goto(`${base}/search?q=event`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search results for “event”')
  const tabs = page.getByRole('navigation', { name: 'Kinds of result' })
  await expect(tabs.getByRole('link', { name: /^All/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { level: 2, name: /^Events/ })).toBeVisible()
  // Two of each kind on "All", then "See all".
  const events = page.locator('section[aria-labelledby="srch-group-event"] .srch-row')
  await expect(events).toHaveCount(2)
  await page.getByRole('link', { name: /^See all \d+ events/ }).click()
  await expect(page).toHaveURL(/\/search\?q=event&type=events$/)
  await expect(tabs.getByRole('link', { name: /^Events/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.srch-row')).toHaveCount(8)
  // The searched word is set in a heavier weight.
  await expect(page.locator('.srch-row .srch-hit').first()).toHaveText(/event/i)
})

test('the search box searches again, and a result opens its page', async ({ page }) => {
  await page.goto(`${base}/search?q=event`)
  const box = page.getByRole('searchbox', { name: 'Search the site' })
  await box.fill('hollow tining')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/search\?q=hollow\+tining$/)
  await page.getByRole('link', { name: 'Hollow tining week' }).click()
  await expect(page).toHaveURL(new RegExp(`${base}/news/hollow-tining-week$`))
})

test('club A finds its own page, never club B’s', async ({ page, world }) => {
  await page.goto(`${base}/search?q=membership`)
  await expect(page.getByRole('link', { name: world.pageA.title })).toBeVisible()
  await expect(page.getByText(world.pageB.title)).toHaveCount(0)
  await page.goto(`${base}/search?q=${encodeURIComponent('club b')}`)
  await expect(page.getByText(world.clubB.name)).toHaveCount(0)
})

test('drafts are never found', async ({ page }) => {
  await page.goto(`${base}/search?q=unfinished+draft`)
  await expect(page.getByRole('heading', { name: 'Nothing for “unfinished draft”' })).toBeVisible()
})

test('a misspelt search still gets there', async ({ page }) => {
  await page.goto(`${base}/search?q=hollw+tinning`)
  // Close spellings of a title are found straight away; otherwise "Did you mean" offers it.
  const suggestion = page.getByRole('link', { name: 'hollow tining', exact: true })
  if ((await suggestion.count()) > 0) await suggestion.click()
  await expect(page.getByRole('link', { name: 'Hollow tining week' })).toBeVisible()
})

test('the 404 page’s search box opens the results', async ({ page }) => {
  await page.goto(`${base}/no-such-page`)
  const box = page.getByRole('searchbox', { name: 'Search the site' })
  await box.fill('team')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/search\?q=team$/)
  await expect(page.getByRole('link', { name: 'Team', exact: true })).toBeVisible()
})

test('phones see the count and no row shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto(`${base}/search?q=event`)
  await expect(page.getByText(/^\d+ results for “event”$/)).toBeVisible()
  await expect(page.locator('.srch-action').first()).toBeHidden()
})
