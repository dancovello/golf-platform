import { clubBSecrets } from './world'
import { expect, test } from './fixtures'

// The company's marketing site (src/proxy.ts, src/app/(marketing)). playwright.config.ts sets
// MARKETING_HOSTS to marketing.localhost (main) and www.marketing.localhost. These join the
// isolation checks: the company domain never shows a club, and a club's domain never shows
// the marketing site.

const port = 3100
const at = (host: string, path = '/') => `http://${host}:${port}${path}`
const site = (path?: string) => at('marketing.localhost', path)

test('the company domain shows the marketing site, under an enforced policy', async ({
  page,
  world: w,
}) => {
  const response = await page.goto(site())
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your club is better than your website.',
  )
  const headers = response?.headers() ?? {}
  expect(headers['content-security-policy']).toContain("'strict-dynamic'")
  expect(headers['content-security-policy']).not.toContain('google')
  // Not production, so search engines are asked to stay away.
  expect(headers['x-robots-tag']).toBe('noindex')
  const html = await page.content()
  for (const name of [w.clubA.name, w.clubB.name, ...clubBSecrets(w)]) {
    expect(html, name).not.toContain(name)
  }
})

test('a missing marketing page is the marketing 404', async ({ page }) => {
  const response = await page.goto(site('/no-such-page'))
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We can’t find that page.')
})

test("the company's other address forwards to its main one", async ({ request }) => {
  const response = await request.get(at('www.marketing.localhost', '/pricing?x=1'), {
    maxRedirects: 0,
  })
  expect(response.status()).toBe(308)
  expect(response.headers().location).toBe(site('/pricing?x=1'))
})

test("the admin, API, previews and clubs' routes don't exist on the company domain", async ({
  request,
}) => {
  for (const path of [
    '/admin',
    '/admin/login',
    '/api/pages',
    '/api/users/me',
    '/health',
    '/preview/test-club-a',
    '/sites/club-a.localhost/membership',
    '/marketing',
  ]) {
    const response = await request.get(site(path), { maxRedirects: 0 })
    expect(response.status(), path).toBe(404)
  }
})

test("a club's domain never shows the marketing site", async ({ page, world: w }) => {
  const response = await page.goto(at('club-a.localhost', '/marketing'))
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('link', { name: `${w.clubA.name}, home` }).first()).toBeVisible()
  expect(await page.content()).not.toContain('Your club is better than your website.')
})

test("the platform's own address forwards marketing pages to the company domain", async ({
  request,
}) => {
  const home = await request.get('/', { maxRedirects: 0 })
  expect(home.status()).toBe(308)
  expect(home.headers().location).toBe(site('/'))
  // /marketing/… is only reachable through the proxy.
  const direct = await request.get('/marketing', { maxRedirects: 0 })
  expect(direct.status()).toBe(404)
  // The admin and platform services stay where they are.
  expect((await request.get('/health')).status()).toBe(200)
  expect((await request.get('/admin/login', { maxRedirects: 0 })).status()).toBe(200)
})
