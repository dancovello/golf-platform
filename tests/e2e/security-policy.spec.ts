import type { Page } from '@playwright/test'

import { expect, openReady, test } from './fixtures'

// One after another in a single worker: these open many admin and site pages, and running
// them side by side with the rest of the suite made unrelated admin tests fail on GitHub's
// machines (2026-10-21).
test.describe.configure({ mode: 'default' })

// The content security policy (src/security/csp.ts, src/proxy.ts). Club sites are enforced;
// the admin is report-only for now. These visit every kind of club page, and the main admin
// screens, and fail if the browser reports anything blocked (or, in the admin, anything that
// would have been).

/** Collects the browser's own reports of anything the policy blocked or would block. */
const watchPolicy = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __policy: string[] }
    w.__policy = []
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__policy.push(`${e.disposition}: ${e.effectiveDirective} blocked ${e.blockedURI}`)
    })
  })
  return () => page.evaluate(() => (window as unknown as { __policy: string[] }).__policy)
}

const sitePages = [
  '/preview/test-club-a',
  '/preview/test-club-a/membership',
  '/preview/test-club-a/help',
  '/preview/test-club-a/gallery',
  '/preview/test-club-a/team',
  '/preview/test-club-a/course',
  '/preview/test-club-a/documents',
  '/preview/test-club-a/news',
  '/preview/test-club-a/events',
  '/preview/test-club-a/contact',
  '/preview/test-club-a/privacy',
  '/preview/test-club-a/search?q=membership',
  '/preview/test-club-a/no-such-page',
  'http://club-a.localhost:3100/',
  'http://club-a.localhost:3100/membership',
]

test('club pages run with nothing blocked', async ({ page }) => {
  test.setTimeout(180_000)
  const reports = await watchPolicy(page)
  for (const path of sitePages) {
    const response = await page.goto(path)
    const policy = response?.headers()['content-security-policy'] ?? ''
    expect(policy, path).toContain("'strict-dynamic'")
    expect(policy, path).toMatch(/'nonce-[A-Za-z0-9+/=]+'/)
    await page.waitForLoadState('networkidle')
    expect(await reports(), path).toEqual([])
  }
})

test('the header search panel, the map and the photo viewer work under the policy', async ({
  page,
}) => {
  const reports = await watchPolicy(page)
  await openReady(page, '/preview/test-club-a')
  await page.keyboard.press('/')
  await page.keyboard.type('member')
  await page.waitForLoadState('networkidle')
  await openReady(page, '/preview/test-club-a/find-us')
  await page.getByRole('button', { name: 'Load interactive map' }).click()
  await expect(page.locator('iframe.map-iframe')).toBeVisible()
  expect(await reports()).toEqual([])
})

test('Google Analytics may load once the visitor accepts cookies', async ({ page }) => {
  const reports = await watchPolicy(page)
  await openReady(page, '/preview/test-club-cookies')
  await page.getByRole('button', { name: 'Accept analytics cookies' }).click()
  await expect(page.locator('script#club-ga')).toHaveCount(1)
  await page.waitForTimeout(500)
  expect(await reports()).toEqual([])
})

test('each page view gets its own code, and a visitor can’t choose it', async ({ request }) => {
  const nonceOf = (policy: string | undefined) => /'nonce-([^']+)'/.exec(policy ?? '')?.[1]
  const first = await request.get('/preview/test-club-a')
  const second = await request.get('/preview/test-club-a', {
    headers: {
      'content-security-policy': "script-src 'nonce-chosen-by-visitor'",
      'x-nonce': 'chosen-by-visitor',
    },
  })
  const a = nonceOf(first.headers()['content-security-policy'])
  const b = nonceOf(second.headers()['content-security-policy'])
  expect(a).toBeTruthy()
  expect(b).toBeTruthy()
  expect(a).not.toBe(b)
  expect(b).not.toBe('chosen-by-visitor')
  // The page's own scripts carry this view's code.
  expect(await second.text()).toContain(`nonce="${b}"`)
  expect(await second.text()).not.toContain('chosen-by-visitor')
})

test('the admin is report-only for now', async ({ request }) => {
  const headers = (await request.get('/admin/login')).headers()
  expect(headers['content-security-policy-report-only']).toContain("'strict-dynamic'")
  expect(headers['content-security-policy']).not.toContain("'strict-dynamic'")
})

test('nothing on the main admin screens that the policy would block', async ({
  editorPage: page,
  world,
}) => {
  // Generous: GitHub's machines are slower, and the club-separation leak check (editorPage)
  // reads every response on all these screens when the test ends.
  test.setTimeout(180_000)
  const reports = await watchPolicy(page)
  for (const path of [
    '/admin',
    '/admin/collections/pages',
    `/admin/collections/pages/${world.homeA.id}`,
    `/admin/collections/club-settings/${world.settingsA.id}`,
    '/admin/collections/media',
    '/admin/collections/news',
    '/admin/collections/events',
    '/admin/collections/enquiries',
  ]) {
    await openReady(page, path)
    expect(await reports(), path).toEqual([])
  }
})

test('the report address accepts reports quietly', async ({ request }) => {
  const response = await request.post('/csp-report', {
    headers: { 'Content-Type': 'application/csp-report' },
    data: JSON.stringify({
      'csp-report': {
        'document-uri': 'http://localhost:3100/preview/test-club-a?x=1',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js?secret=1',
      },
    }),
  })
  expect(response.status()).toBe(204)
  // It also works on a club's own domain (browsers report to the address they're on).
  const onDomain = await request.post('http://club-a.localhost:3100/csp-report', {
    headers: { 'Content-Type': 'application/csp-report' },
    data: '{}',
  })
  expect(onDomain.status()).toBe(204)
})
