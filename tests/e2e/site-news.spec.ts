import { expect, test } from './fixtures'

// Club A's news, seeded in tests/e2e/seed-world.ts: nine live articles, one draft, and one
// dated after the pinned "today" (15 July 2026).
const base = '/preview/test-club-a'

test('the archive leads with the newest story, seven to a page', async ({ page, world }) => {
  await page.goto(`${base}/news`)
  await expect(page.getByRole('heading', { level: 1, name: 'Club news' })).toBeVisible()
  await expect(page.locator('.news-card.is-feature').getByRole('link')).toHaveText(
    'Hollow tining week',
  )
  await expect(page.locator('.news-card')).toHaveCount(7)
  await expect(page.getByText('Showing 1–7 of 9 articles')).toBeVisible()
  await expect(page.getByText('Unfinished draft')).toHaveCount(0)
  await expect(page.getByText('Club A news')).toHaveCount(0)
  expect(await page.content()).not.toContain(world.clubB.name)

  const pages = page.getByRole('navigation', { name: 'Pagination' })
  await expect(pages.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  await pages.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/\/news\?page=2$/)
  await expect(page.locator('.news-card')).toHaveCount(2)
  await expect(page.getByText('Showing 8–9 of 9 articles')).toBeVisible()
})

test('category pills and search filter the archive, kept in the address', async ({ page }) => {
  await page.goto(`${base}/news`)
  const pills = page.getByRole('navigation', { name: 'News categories' })
  await pills.getByRole('link', { name: 'Competitions' }).click()
  await expect(page).toHaveURL(/\/news\?category=competitions$/)
  await expect(pills.getByRole('link', { name: 'Competitions' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('.news-card')).toHaveCount(2)

  await page.getByRole('searchbox', { name: 'Search news' }).fill('fourball')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/category=competitions&q=fourball/)
  await expect(page.locator('.news-card')).toHaveCount(1)

  await page.goto(`${base}/news?category=clubhouse&q=bunker`)
  await expect(page.getByText('No articles match “bunker” in Clubhouse.')).toBeVisible()
  await page.getByRole('link', { name: 'Show all news' }).click()
  await expect(page).toHaveURL(new RegExp(`${base}/news$`))
})

test('an article shows its byline, photo, text and neighbours', async ({ page }) => {
  await page.goto(`${base}/news`)
  await page.getByRole('link', { name: 'Hollow tining week' }).click()
  await expect(page).toHaveURL(new RegExp(`${base}/news/hollow-tining-week$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hollow tining week')
  await expect(page.getByText('Owen Pryce, Course Manager')).toBeVisible()
  await expect(page.getByText('The 18th green, Monday morning')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'What to expect' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Previous article/ })).toContainText(
    'Club championship results',
  )
  // The newest live article has no newer neighbour.
  await expect(page.getByRole('link', { name: /Next article/ })).toHaveCount(0)
  await expect(page.getByText('14 July 2026')).toBeVisible()
  await expect(page.locator('.news-carousel .news-card')).toHaveCount(6)
  await expect(page.locator('.news-carousel').getByRole('link', { name: 'All news' })).toHaveCount(
    2,
  )
})

test('drafts, future articles and unknown addresses are not found', async ({ page }) => {
  for (const slug of ['unfinished-draft', 'club-a-news', 'no-such-article']) {
    const res = await page.goto(`${base}/news/${slug}`)
    expect(res?.status()).toBe(404)
  }
})
