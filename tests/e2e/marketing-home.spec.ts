import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The marketing home page (plan phase 4), from the Figma copy (src/marketing/starter/pages.ts),
// against "Home — Desktop" (176:2178) and "Home — Mobile" (273:8954).

const site = (path = '/') => `http://marketing.localhost:3100${path}`

test('the home page has every Figma section, in order, with one H1', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your club is better than your website.',
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 })).toContainText([
    'Most visitors meet your club online first.',
    'What you type is what members see.',
    'The site keeps up with the club.',
    'Your content comes with you.',
    'See your club on it.',
  ])
  // The price comes from the settings, not the copy.
  await expect(page.locator('.mk-home-hero-proof')).toContainText('£149 a month')
  await expect(page.getByRole('figure', { name: /Ashgrove Park/ })).toBeVisible()
  await expect(
    page.getByText('Golfshake survey, reported by The Golf Business · 13 Jan 2022'),
  ).toBeVisible()
  await expect(page.getByRole('complementary', { name: /Who’s behind this/ })).toBeVisible()
})

test('typing in the editor changes the real hero beside it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const headline = page.getByLabel('Headline')
  await headline.fill('Course closed until noon')
  const live = page.locator('.mk-live-card .hero h1')
  await expect(live).toHaveText('Course closed until noon')
  await expect(page.getByRole('figure', { name: /Course closed until noon/ })).toBeVisible()
  // The switch takes the second button away, as it would on the club's site.
  await expect(page.locator('.mk-live-card .hero .btn')).toHaveCount(2)
  await page.getByRole('switch', { name: 'Show visitor tee times button' }).click()
  await expect(page.locator('.mk-live-card .hero .btn')).toHaveCount(1)
})

test('a week at the club: moments light up as the page scrolls past them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site())
  const moments = page.locator('.mk-moment')
  await expect(moments).toHaveCount(4)
  await page.locator('.mk-week').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 300)
  await expect(page.locator('.mk-moment[data-state="active"]')).toHaveCount(1)
  // Live blocks only: each moment is marked Live.
  await expect(page.locator('.mk-moment .mk-badge--live')).toHaveCount(4)
})

test('phones: a swipeable week, stacked editor, full-width buttons, no sideways scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site())
  const facts = await page.evaluate(() => ({
    sideScroll: document.documentElement.scrollWidth > window.innerWidth,
    weekScrolls: (() => {
      const row = document.querySelector('.mk-week-moments')!
      return row.scrollWidth > row.clientWidth
    })(),
    heroButton: document.querySelector('.mk-home-hero-actions .mk-button')!.getBoundingClientRect(),
    chromeShown: getComputedStyle(document.querySelector('.mk-home-hero-demo .mk-chrome')!).display,
  }))
  expect(facts.sideScroll).toBe(false)
  expect(facts.weekScrolls).toBe(true)
  expect(Math.round(facts.heroButton.width)).toBe(350)
  expect(Math.round(facts.heroButton.height)).toBe(44)
  expect(facts.chromeShown).toBe('none')
  await expect(page.getByText('Swipe for the rest of the week →')).toBeVisible()
})

test('the home page passes axe on phone and desktop', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(site())
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
      `${width}px`,
    ).toEqual([])
  }
})

test('the super-admin can add the Figma pages; existing ones are left alone', async ({
  superAdminPage,
  editorPage,
}) => {
  const denied = await editorPage.request.post('/api/marketing-starter')
  expect(denied.status()).toBe(403)
  const response = await superAdminPage.request.post('/api/marketing-starter')
  expect(response.status()).toBe(200)
  // The seeded home page already exists, so it's skipped, not overwritten.
  expect((await response.json()).skipped).toContain('Home')
})
