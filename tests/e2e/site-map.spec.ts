import { expect, test } from './fixtures'

// Club A's map page (Map A · Split), seeded in tests/e2e/seed-world.ts with a position.
const url = '/preview/test-club-a/find-us'

test('the interactive map loads only when asked, and directions go to the club', async ({
  page,
}) => {
  // Never contact OpenStreetMap from the tests.
  let mapRequests = 0
  await page.route('https://www.openstreetmap.org/**', (route) => {
    mapRequests++
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' })
  })
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Find the club' })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(mapRequests).toBe(0)

  await expect(page.getByRole('link', { name: 'Get directions' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/dir/?api=1&destination=51.392,-0.612',
  )

  await page.getByRole('button', { name: 'Load interactive map' }).click()
  const map = page.frameLocator('iframe[title^="Map showing Test Club A"]')
  await expect(map.getByText('map')).toBeVisible()
  expect(mapRequests).toBe(1)
})
