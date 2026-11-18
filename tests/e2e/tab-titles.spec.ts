import { expect, test } from './fixtures'

// QA-14 and QA-23: browser tab titles that say something useful.
const at = (host: string, path = '/') => `http://${host}:3100${path}`

test("a missing page on a club's site names the club, not the platform", async ({
  page,
  world: w,
}) => {
  const response = await page.goto(at('club-a.localhost', '/no-such-page'))
  expect(response?.status()).toBe(404)
  await expect(page).toHaveTitle(`Page not found | ${w.clubA.name}`)
})

test('the company site: a missing page and the home page have useful titles', async ({ page }) => {
  const missing = await page.goto(at('marketing.localhost', '/no-such-page'))
  expect(missing?.status()).toBe(404)
  await expect(page).toHaveTitle('Page not found | A1 Engine')

  await page.goto(at('marketing.localhost', '/'))
  const title = await page.title()
  expect(title).toMatch(/^A1 Engine \| ./)
  expect(title).not.toBe('Home')
})
