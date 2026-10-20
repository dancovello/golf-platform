import { expect, test } from './fixtures'

// The club's header on the public site (staging preview): club A has a "Golf" drop-down and
// a "Membership" link (tests/e2e/seed-world.ts).
const home = '/preview/test-club-a'

test.describe('desktop header', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('menu, drop-down and booking button', async ({ page, world }) => {
    await page.goto(home)
    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Membership' })).toHaveAttribute(
      'href',
      `${home}/membership`,
    )
    await expect(page.getByRole('link', { name: 'Book a tee time' })).toHaveAttribute(
      'href',
      'https://booking.example.com',
    )

    const golf = nav.getByRole('button', { name: 'Golf' })
    await golf.click()
    await expect(golf).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('link', { name: 'Green fees' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(golf).toHaveAttribute('aria-expanded', 'false')
    await expect(golf).toBeFocused()

    // The down arrow opens the drop-down and moves into it.
    await page.keyboard.press('ArrowDown')
    await expect(nav.getByRole('link', { name: 'Green fees' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(golf).toBeFocused()

    // Hover first (opens after a moment), then click: it must stay open, not toggle shut.
    await page.mouse.move(700, 600)
    await golf.hover()
    await expect(golf).toHaveAttribute('aria-expanded', 'true')
    await golf.click()
    await expect(golf).toHaveAttribute('aria-expanded', 'true')
    // A second click closes it.
    await golf.click()
    await expect(golf).toHaveAttribute('aria-expanded', 'false')

    expect(await page.content()).not.toContain(world.clubB.name)
  })

  test("a club page shows the club's header and marks the current menu item", async ({ page }) => {
    await page.goto(`${home}/membership`)
    await expect(page.getByRole('heading', { level: 1, name: 'Membership (Club A)' })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Membership' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test("club B's page is not reachable through club A's address", async ({ page }) => {
    // Both clubs have /membership; club A's address must only ever show club A's page.
    await page.goto(`${home}/membership`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Membership (Club A)')
    expect((await page.goto(`${home}/no-such-page`))?.status()).toBe(404)
  })
})

test.describe('mobile header', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('the menu drawer opens, shows a sub-menu, and closes with Esc', async ({ page }) => {
    await page.goto(home)
    const menuButton = page.getByRole('button', { name: 'Menu', exact: true })
    await menuButton.click()
    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: 'Golf' }).click()
    await expect(drawer.getByRole('link', { name: 'Green fees' })).toBeVisible()
    await drawer.getByRole('button', { name: 'Golf' }).click() // back
    await expect(drawer.getByRole('link', { name: 'Membership' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(menuButton).toBeFocused()
  })
})

// A menu too long for the screen gets the menu button instead (src/site/components/headerFit.ts).
// Clubs seeded in tests/e2e/seed-world.ts: header-<style> have nine items, header-six six short.
test.describe('menu that does not fit', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  const noSidewaysScroll = async (page: import('@playwright/test').Page) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth, 'the page scrolls sideways').toBe(clientWidth)
  }

  for (const style of ['classic', 'transparent', 'appbar']) {
    test(`header style ${style}: nine items switch to the menu button`, async ({ page }) => {
      await page.goto(`/preview/header-${style}/about`)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
      const menuButton = page.getByRole('button', { name: 'Menu', exact: true })
      await expect(menuButton).toBeVisible()
      await noSidewaysScroll(page)

      await menuButton.click()
      const drawer = page.getByRole('dialog', { name: 'Menu' })
      for (const label of ['Golf', 'Saltmarsh Links Resort', 'Contact us'])
        await expect(drawer.getByRole('link', { name: label })).toBeVisible()
    })
  }

  test('six short items stay a full menu', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/preview/header-six/about')
    await page.evaluate(() => document.fonts.ready)
    const nav = page.getByRole('navigation', { name: 'Main' })
    for (const label of ['Golf', 'Contact'])
      await expect(nav.getByRole('link', { name: label })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeHidden()
    await noSidewaysScroll(page)
  })

  test('the check runs again when the window or the menu changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/preview/header-six/about')
    const nav = page.getByRole('navigation', { name: 'Main' })
    const menuButton = page.getByRole('button', { name: 'Menu', exact: true })
    await expect(nav).toBeVisible()

    await page.setViewportSize({ width: 900, height: 800 })
    await expect(menuButton).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(nav).toBeVisible()
    await expect(menuButton).toBeHidden()

    // A label grows (as when a web font arrives): the row no longer fits.
    await nav
      .getByRole('link', { name: 'Clubhouse' })
      .evaluate((a) => (a.textContent = 'The Clubhouse, Restaurant and Function Rooms'))
    await expect(menuButton).toBeVisible()
    await expect(nav).toBeHidden()
    await noSidewaysScroll(page)
  })

  test('decided before the page loads its scripts, so the full menu never flashes', async ({
    page,
  }) => {
    // Block the app's scripts: only the small script after the header runs.
    await page.route(/\/_next\/static\/.*\.js(\?|$)/, (route) => route.abort())
    await page.goto('/preview/header-classic/about')
    await expect(page.locator('header.sh')).toHaveAttribute('data-compact', 'true')
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible()
  })
})

test.describe('narrow phone', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  // Clubs seeded in tests/e2e/seed-world.ts, one per header style, all with a long name.
  for (const style of ['classic', 'transparent', 'appbar']) {
    test(`header style ${style} keeps the page within the screen`, async ({ page }) => {
      await page.goto(`/preview/header-${style}/about`)
      await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, 'the page scrolls sideways').toBe(clientWidth)
    })
  }
})

test('the footer shows club A details and nothing of club B', async ({ page, world }) => {
  await page.goto(home)
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByText('Heathland golf since 1926.')).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Membership' })).toHaveAttribute(
    'href',
    `${home}/membership`,
  )
  await expect(footer.getByRole('link', { name: 'hello@club-a.example' })).toHaveAttribute(
    'href',
    'mailto:hello@club-a.example',
  )
  await expect(footer.getByText('Clubhouse')).toBeVisible()
  await expect(footer.getByText(`© ${new Date().getFullYear()} Test Club A`)).toBeVisible()
  expect(await page.content()).not.toContain(world.clubB.name)
})

test('"Skip to content" is the first thing Tab reaches, and hidden until then', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/preview/test-club-a')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  // Hidden (a 1px box), so it never covers the announcement bar on phones.
  expect((await skip.boundingBox())?.height ?? 0).toBeLessThanOrEqual(1)
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()
  expect((await skip.boundingBox())?.height ?? 0).toBeGreaterThan(20)
})
