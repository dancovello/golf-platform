import { expect, test } from './fixtures'

// The header search panel on club A's site (tests/e2e/seed-world.ts). The leak watcher
// (tests/e2e/fixtures.ts) fails any test whose responses carry club B's data, including the
// panel's own results feed.
const base = '/preview/test-club-a'

test('the header button opens the panel; typing shows grouped results', async ({ page }) => {
  await page.goto(`${base}/news`)
  await page.locator('.sh-desktop').getByRole('link', { name: 'Search' }).click()
  const panel = page.getByRole('dialog', { name: /^Search / })
  const box = panel.getByRole('combobox')
  await expect(box).toBeFocused()
  await box.fill('event')
  const list = panel.getByRole('listbox')
  await expect(list.getByRole('group', { name: 'Best match' })).toBeVisible()
  await expect(list.getByRole('group', { name: /^Events/ })).toBeVisible()
  // Up to two of each kind.
  await expect(list.getByRole('group', { name: /^Events/ }).getByRole('option')).toHaveCount(2)
  await expect(panel.getByRole('link', { name: /^See all \d+ results for “event”/ })).toBeVisible()
})

test('arrow keys pick a result and Enter opens it', async ({ page }) => {
  await page.goto(base)
  await page.locator('.sh-desktop').getByRole('link', { name: 'Search' }).click()
  const box = page.getByRole('combobox')
  await box.fill('hollow tining')
  await expect(page.getByRole('option', { name: /Hollow tining week/ }).first()).toBeVisible()
  await box.press('ArrowDown')
  const active = await box.getAttribute('aria-activedescendant')
  expect(active).toBeTruthy()
  await expect(page.locator(`[id="${active}"]`)).toHaveAttribute('aria-selected', 'true')
  await box.press('Enter')
  await expect(page).toHaveURL(new RegExp(`${base}/news/hollow-tining-week$`))
})

test('Enter with nothing picked opens the results page, and the search is remembered', async ({
  page,
}) => {
  await page.goto(base)
  await page.keyboard.press('/')
  const box = page.getByRole('combobox')
  await expect(box).toBeFocused()
  await box.fill('team')
  await expect(page.getByRole('option').first()).toBeVisible()
  await box.press('Enter')
  await expect(page).toHaveURL(/\/search\?q=team$/)
  // Next time, it's under Recent.
  await page.keyboard.press('/')
  await expect(page.getByRole('group', { name: 'Recent' }).getByRole('option')).toContainText(
    'team',
  )
})

test('Esc clears the search, then closes the panel', async ({ page }) => {
  await page.goto(base)
  const button = page.locator('.sh-desktop').getByRole('link', { name: 'Search' })
  await button.click()
  const box = page.getByRole('combobox')
  await box.fill('course')
  await box.press('Escape')
  await expect(box).toHaveValue('')
  await box.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(button).toBeFocused()
})

test('club A’s panel never shows club B’s page', async ({ page, world }) => {
  await page.goto(base)
  await page.keyboard.press('/')
  await page.getByRole('combobox').fill('membership')
  await expect(page.getByRole('option', { name: world.pageA.title })).toBeVisible()
  await expect(page.getByText(world.pageB.title)).toHaveCount(0)
  // The feed itself, asked directly for club B's page by its title. (It repeats the words it
  // was asked for, so look at what it found, not the whole reply.)
  const feed = await page.request.get(
    `${base}/search/suggest?q=${encodeURIComponent(world.pageB.title)}`,
  )
  const found = (await feed.json()) as {
    best: { id: string; title: string } | null
    groups: { items: { id: string; title: string }[] }[]
  }
  const items = [found.best, ...found.groups.flatMap((g) => g.items)].filter(Boolean)
  expect(items.length).toBeGreaterThan(0)
  for (const item of items) {
    expect(item?.id).not.toBe(world.pageB.id)
    expect(item?.title).not.toBe(world.pageB.title)
  }
})

test('nothing found offers shortcuts', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('/')
  await page.getByRole('combobox').fill('xyzzy plugh')
  await expect(page.getByText('Nothing for “xyzzy plugh”')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Try one of these' })).toBeVisible()
})

test('phones search from the menu, in a full-screen sheet with Cancel', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(base)
  // Phones search from the menu (the phone header has no search button, as designed).
  await expect(page.locator('.sh-mobile').getByRole('link', { name: 'Search' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'Search the site' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  const box = await panel.boundingBox()
  expect(box?.width).toBe(375)
  await panel.getByRole('combobox').fill('event')
  await expect(panel.getByRole('link', { name: /^See all \d+ results$/ })).toBeVisible()
  await panel.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('without the panel’s script, the search button still opens the results page', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto(base)
  await page.locator('.sh-desktop').getByRole('link', { name: 'Search' }).click()
  await expect(page).toHaveURL(new RegExp(`${base}/search$`))
  await context.close()
})

test('before typing, the panel offers quick access and what’s coming up', async ({ page }) => {
  await page.goto(base)
  await page.keyboard.press('/')
  const quick = page.getByRole('group', { name: 'Quick access' })
  await expect(quick.getByRole('option', { name: /Book a tee time/ })).toBeVisible()
  // Club A's events start in August (the browser tests run on 15 July 2026).
  await expect(page.getByRole('group', { name: 'Coming up' }).getByRole('option')).toHaveCount(2)
})

test('a question gets an answer card in place of the best match, on the panel and the page', async ({
  page,
}) => {
  await page.goto(base)
  await page.keyboard.press('/')
  await page.getByRole('combobox').fill('next event')
  const card = page.getByRole('region', { name: /^Next event: / })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading')).toHaveText('Event 1')
  await expect(page.getByRole('group', { name: 'Best match' })).toHaveCount(0)

  await page.goto(`${base}/search?q=next+event`)
  await expect(page.getByRole('region', { name: /^Next event: Event 1/ })).toBeVisible()
})

test('tablets have a search button in the header', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1024 })
  await page.goto(base)
  await page.locator('.sh-mobile').getByRole('link', { name: 'Search' }).click()
  await expect(page.getByRole('dialog', { name: /^Search / })).toBeVisible()
})
