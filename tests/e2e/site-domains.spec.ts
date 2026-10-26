import { MIN_FILL_MS } from '@/site/contact/formToken'

import { clubBSecrets } from './world'
import { expect, homeLink, test } from './fixtures'

// Clubs on their own domains (build step 4, src/proxy.ts and src/site/resolveSite.ts).
// Browsers send every *.localhost address to this computer, so each test club "owns" one:
// club A has club-a.localhost (main) and old-club-a.localhost; club B has club-b.localhost.
// These join the tenant-isolation suite: an address only ever shows its own club.

const port = 3100
const at = (host: string, path = '/') => `http://${host}:${port}${path}`
const clubA = (path?: string) => at('club-a.localhost', path)
const clubB = (path?: string) => at('club-b.localhost', path)

test("club A's domain shows club A, with clean page addresses", async ({ page, world: w }) => {
  const response = await page.goto(clubA())
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(w.clubA.name)
  await expect(homeLink(page, w.clubA.name).first()).toBeVisible()
  const html = await page.content()
  expect(html).not.toContain('/preview/')
  for (const secret of clubBSecrets(w)) expect(html, secret).not.toContain(secret)

  await page.goto(clubA('/membership'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(w.pageA.title)
  await expect(page).toHaveTitle(`${w.pageA.title} | ${w.clubA.name}`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', clubA('/membership'))
})

test('the same address on two domains shows each club its own page', async ({ page, world: w }) => {
  await page.goto(clubB('/membership'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(w.pageB.title)
  expect(await page.content()).not.toContain(w.pageA.title)
  await page.goto(clubA('/membership'))
  expect(await page.content()).not.toContain(w.pageB.title)
})

test("another of the club's addresses forwards to its main one", async ({ request }) => {
  const response = await request.get(at('old-club-a.localhost', '/membership?x=1'), {
    maxRedirects: 0,
  })
  expect(response.status()).toBe(308)
  expect(response.headers().location).toBe(clubA('/membership?x=1'))
})

test('an address no club has says nothing about any club', async ({ page, world: w }) => {
  const response = await page.goto(at('nobody.localhost', '/membership'))
  expect(response?.status()).toBe(404)
  const html = await page.content()
  for (const name of [w.clubA.name, w.clubB.name, w.pageA.title]) {
    expect(html, name).not.toContain(name)
  }
})

test("a missing page on a club's domain is that club's own 404", async ({ page, world: w }) => {
  const response = await page.goto(clubA('/no-such-page'))
  expect(response?.status()).toBe(404)
  await expect(homeLink(page, w.clubA.name).first()).toBeVisible()
  expect(await page.content()).not.toContain(w.clubB.name)
})

test("the admin, API, previews and other clubs' routes don't exist on a club's domain", async ({
  request,
}) => {
  for (const path of [
    '/admin',
    '/admin/login',
    '/api/pages',
    '/api/users/me',
    '/health',
    '/preview/test-club-a',
    '/sites/club-b.localhost/membership',
    '/sites/club-a.localhost/membership',
  ]) {
    const response = await request.get(clubA(path), { maxRedirects: 0 })
    expect(response.status(), path).toBe(404)
  }
  // /sites/… is only reachable through the proxy's rewrite, never on the platform's address.
  const direct = await request.get('/sites/club-a.localhost/membership', { maxRedirects: 0 })
  expect(direct.status()).toBe(404)
})

test("a visitor can't pose as another club with request headers", async ({ request, world: w }) => {
  const response = await request.get(clubA('/membership'), {
    headers: { 'x-club-host': 'club-b.localhost', 'x-club-origin': clubB() },
  })
  const html = await response.text()
  expect(html).toContain(w.pageA.title)
  expect(html).not.toContain(w.pageB.title)
})

test("search on club A's domain never finds club B", async ({ request, world: w }) => {
  const panel = await request.get(clubA('/search/suggest?q=membership'))
  expect(panel.ok()).toBe(true)
  const results = await panel.text()
  expect(results).not.toContain(w.pageB.title)
  expect(results).not.toContain('/preview/')
  const page = await (await request.get(clubA('/search?q=membership'))).text()
  expect(page).toContain('href="/membership"')
  expect(page).not.toContain(w.pageB.title)
})

test("robots.txt and sitemap.xml are the club's own", async ({ request, world: w }) => {
  // Not production, so search engines are asked to stay away (privacy decision, 15 October).
  expect(await (await request.get(clubA('/robots.txt'))).text()).toContain('Disallow: /')
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /')
  const sitemap = await (await request.get(clubA('/sitemap.xml'))).text()
  expect(sitemap).toContain(`<loc>${clubA('/membership')}</loc>`)
  expect(sitemap).not.toContain('club-b.localhost')
  expect(sitemap).not.toContain(w.clubB.id)
})

test("the Contact form on club A's domain saves into club A", async ({ page, editorPage }) => {
  test.slow()
  await page.goto(clubA('/contact'))
  await page.getByLabel('Full name').fill('Domain Visitor')
  await page.getByLabel('Email address').fill('domain.visitor@example.com')
  await page.getByLabel('Your message').fill('Sent from the club’s own address.')
  await new Promise((resolve) => setTimeout(resolve, MIN_FILL_MS + 500))
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(
    page.getByRole('heading', { name: 'Thanks, Domain — your message is with us' }),
  ).toBeVisible()
  const reference = /TCA-ENQ-\d{4}/.exec((await page.getByRole('status').textContent()) ?? '')?.[0]
  expect(reference).toBeTruthy()
  const saved = await (
    await editorPage.request.get(`/api/enquiries?where[reference][equals]=${reference}`)
  ).json()
  expect(saved.totalDocs).toBe(1)
})
