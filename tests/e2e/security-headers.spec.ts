import { expect, test } from './fixtures'

// next.config.ts: every page and API response tells browsers not to let other sites frame it,
// to stay on https, and not to guess file types.
for (const path of ['/preview/test-club-a', '/admin/login', '/api/pages', '/health']) {
  test(`security headers on ${path}`, async ({ request }) => {
    const headers = (await request.get(path, { maxRedirects: 0 })).headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-powered-by']).toBeUndefined()
  })
}
