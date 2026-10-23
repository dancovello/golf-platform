import { expect, openReady, test } from './fixtures'

// Audit 2026-10-22: content security policy and headers (docs/security/audit-csp-headers.md).
// Each test describes how things SHOULD be, and fails today. They are marked `test.fail` so
// they prove the gap without blocking CI. When a fix lands, the test starts passing,
// Playwright then reports it as failing, and the `test.fail` marker should be removed.

test.describe.configure({ mode: 'default' })

// Finding 1 (medium). Club previews (/preview/<club>) are served from the admin's own
// address. Anything that manages to run on a preview page (Google's analytics script today,
// or any future gap in the policy) runs with the signed-in person's admin access.
test.fail(
  'a script on a club preview cannot use the super-admin’s access',
  async ({ superAdminPage: page }) => {
    await openReady(page, '/preview/test-club-a')
    // Stands in for any script that gets to run on the preview page.
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/tenants?limit=100&depth=0', { credentials: 'include' })
      const body = (await response.json().catch(() => ({}))) as { docs?: unknown[] }
      return { status: response.status, clubs: body.docs?.length ?? 0 }
    })
    // Today: 200, and every club is listed (and could be changed the same way).
    expect(result.clubs).toBe(0)
  },
)

test.fail('Google Analytics never loads on the admin’s own address', async ({ page }) => {
  await openReady(page, '/preview/test-club-cookies')
  await page.getByRole('button', { name: 'Accept analytics cookies' }).click()
  await page.waitForTimeout(500)
  // Today: Google's script is added to the page, on the same address as the admin.
  expect(await page.locator('script#club-ga').count()).toBe(0)
})

// Finding 2 (medium). The admin's policy only reports; it blocks nothing (decided 21 Oct,
// review due 28 Oct). The admin is where one account can reach every club.
test.fail('the admin’s policy is enforced', async ({ request }) => {
  const headers = (await request.get('/admin/login')).headers()
  expect(headers['content-security-policy'] ?? '').toContain("'strict-dynamic'")
})

// Finding 3 (low). Pages on the platform's own address outside /admin and /preview get only
// the basic policy, which says nothing about scripts.
test.fail(
  'the “accounts are made by the administrator” page has a script policy',
  async ({ request }) => {
    const headers = (await request.get('/accounts-by-administrator')).headers()
    expect(headers['content-security-policy'] ?? '').toContain('script-src')
  },
)

// Finding 5 (low). No Cross-Origin-Opener-Policy: another website that opens the admin in a
// new window keeps a handle on it (it can send it elsewhere, or count its frames).
test.fail('the admin cuts its ties to the window that opened it', async ({ request }) => {
  const headers = (await request.get('/admin/login')).headers()
  expect(headers['cross-origin-opener-policy']).toBe('same-origin')
})
