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
