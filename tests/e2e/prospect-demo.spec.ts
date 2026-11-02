import { clubBSecrets } from './world'
import { expect, homeLink, test } from './fixtures'

// Prospect demos (src/site/demo.ts): a club's site shown publicly at /demo/<club>-<ending>, no
// login. Part of the tenant-isolation suite: a demo link opens that one club and nothing else.

const port = 3100
const marketing = (path: string) => `http://marketing.localhost:${port}${path}`

test('a demo link shows that club, with a "Demo - expires in 30 days" strip, and nothing of club B', async ({
  page,
  world: w,
}) => {
  const response = await page.goto(`/demo/${w.demoLive.address}`)
  expect(response?.status()).toBe(200)
  await expect(homeLink(page, w.demoLive.name).first()).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(/^Demo - expires in (29|30) days$/)
  const html = await page.content()
  for (const secret of [...clubBSecrets(w), w.clubA.name]) {
    expect(html, secret).not.toContain(secret)
  }
  // Pages and links stay inside the demo.
  await page.goto(`/demo/${w.demoLive.address}/contact`)
  await expect(page.getByRole('status')).toBeVisible()
})

test('demo pages are never indexed: noindex in the page and the header', async ({
  page,
  request,
  world: w,
}) => {
  const response = await page.goto(`/demo/${w.demoLive.address}`)
  expect(response?.headers()['x-robots-tag']).toContain('noindex')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  const onCompanySite = await request.get(marketing(`/demo/${w.demoLive.address}`))
  expect(onCompanySite.status()).toBe(200)
  expect(onCompanySite.headers()['x-robots-tag']).toContain('noindex')
})

test('a demo link works on the company address', async ({ page, world: w }) => {
  const response = await page.goto(marketing(`/demo/${w.demoLive.address}`))
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('status')).toHaveText(/^Demo - expires in/)
})

test('a guessed or wrong demo link is "not found", and says nothing about the club', async ({
  page,
  world: w,
}) => {
  const [slug] = w.demoLive.address.split(/-(?=[^-]+$)/)
  for (const path of [
    `/demo/${slug}`,
    `/demo/${slug}-aaaaaaaaaaaaaaaa`,
    `/demo/test-club-a-aaaaaaaaaaaaaaaa`,
    `/demo/test-club-a`,
  ]) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
    expect(await page.content(), path).not.toContain(w.demoLive.name)
  }
})

test('an expired demo says so, and shows nothing of the club', async ({ page, world: w }) => {
  const response = await page.goto(`/demo/${w.demoExpired.address}`)
  await expect(page.getByRole('heading', { name: 'This demo has expired' })).toBeVisible()
  expect(await page.content()).not.toContain(w.demoExpired.name)
  expect(response?.headers()['x-robots-tag']).toContain('noindex')
})

test('the contact form on a demo is replaced by a note and sends nothing', async ({
  page,
  world: w,
}) => {
  await page.goto(`/demo/${w.demoLive.address}/contact`)
  await expect(page.getByRole('heading', { name: 'This is a demo' })).toBeVisible()
  await expect(page.getByRole('button', { name: /send message/i })).toHaveCount(0)
})

test("demo links don't exist on a club's own domain", async ({ request, world: w }) => {
  const response = await request.get(`http://club-a.localhost:${port}/demo/${w.demoLive.address}`)
  expect(response.status()).toBe(404)
})

test("search on a demo finds that club's pages and never club B's", async ({ page, world: w }) => {
  await page.goto(`/demo/${w.demoLive.address}/search?q=membership`)
  expect(await page.content()).not.toContain(w.pageB.title)
  const suggest = await page.request.get(`/demo/${w.demoLive.address}/search/suggest?q=membership`)
  expect(suggest.status()).toBe(200)
  expect(await suggest.text()).not.toContain(w.pageB.title)
})
