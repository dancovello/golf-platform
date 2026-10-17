import { expect, test } from './fixtures'

// Club A's home page starts with a Heritage hero (tests/e2e/site-hero seed in seed-world.ts).
const home = '/preview/test-club-a'

test('the home page shows the hero with sized photo copies and its buttons', async ({
  page,
  world,
}) => {
  await page.goto(home)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A round worth travelling for')
  const photo = page.getByRole('img', { name: 'Heathland fairway at dawn' })
  await expect(photo).toBeVisible()
  expect(await photo.getAttribute('srcset')).toMatch(/640w.*1024w.*1600w.*2400w/)
  // Only the hero's links: the menu and footer have their own "Membership".
  const hero = page.getByRole('main')
  await expect(hero.getByRole('link', { name: 'Visitors' })).toHaveAttribute(
    'href',
    `${home}/membership`,
  )
  await expect(hero.getByRole('link', { name: 'Membership' })).toHaveAttribute(
    'href',
    'https://example.com/join',
  )
  expect(await page.content()).not.toContain(world.clubB.name)
})

test('the hero photo loads on a phone too, with the smaller copy', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(home)
  const photo = page.getByRole('img', { name: 'Heathland fairway at dawn' })
  await expect(photo).toBeVisible()
  const chosen = await photo.evaluate((img: HTMLImageElement) => img.currentSrc)
  expect(chosen).toMatch(/\.webp$/)
  await context.close()
})

test('/home redirects to the club home', async ({ page }) => {
  await page.goto(`${home}/home`)
  await expect(page).toHaveURL(new RegExp(`${home}$`))
})

for (const size of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812 },
]) {
  test(`the hero fills the window below the header, no further (${size.name})`, async ({
    page,
  }) => {
    await page.setViewportSize(size)
    await page.goto(home)
    const hero = page.getByRole('main').locator('section').first()
    await expect
      .poll(async () => {
        const box = await hero.boundingBox()
        return Math.round((box?.y ?? 0) + (box?.height ?? 0))
      })
      .toBe(size.height)
  })
}
