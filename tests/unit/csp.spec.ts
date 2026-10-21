import { describe, expect, it } from 'vitest'

import { buildPolicy, policyHeaderName } from '@/security/csp'

const env = {
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  MEDIA_PUBLIC_URL: 'https://pub-123.r2.dev/golf-media',
  MEDIA_S3_ENDPOINT: 'https://acc.r2.cloudflarestorage.com',
}
const directive = (policy: string, name: string) =>
  policy.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''

describe('content security policy', () => {
  it('only lets scripts with this page view’s code run (and what they load)', () => {
    const policy = buildPolicy('site', 'abc123', env)
    expect(directive(policy, 'script-src')).toContain("'nonce-abc123'")
    expect(directive(policy, 'script-src')).toContain("'strict-dynamic'")
    expect(directive(policy, 'script-src')).not.toContain("'unsafe-inline'")
    expect(directive(policy, 'script-src')).not.toContain("'unsafe-eval'")
    expect(directive(policy, 'object-src')).toBe("object-src 'none'")
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'self'")
    expect(directive(policy, 'form-action')).toBe("form-action 'self'")
  })

  it('allows the club photo domain, the map, the spam check and analytics', () => {
    const policy = buildPolicy('site', 'n', env)
    expect(directive(policy, 'img-src')).toContain('https://pub-123.r2.dev')
    expect(directive(policy, 'media-src')).toContain('https://pub-123.r2.dev')
    expect(directive(policy, 'frame-src')).toContain('https://www.openstreetmap.org')
    expect(directive(policy, 'frame-src')).toContain('https://challenges.cloudflare.com')
    expect(directive(policy, 'connect-src')).toContain('https://*.google-analytics.com')
  })

  it('only the admin may upload straight to storage', () => {
    expect(buildPolicy('site', 'n', env)).not.toContain('r2.cloudflarestorage.com')
    expect(directive(buildPolicy('admin', 'n', env), 'connect-src')).toContain(
      'https://acc.r2.cloudflarestorage.com',
    )
  })

  it("Vercel's toolbar works on staging and previews, never on production", () => {
    expect(buildPolicy('site', 'n', env)).not.toContain('vercel.live')
    expect(buildPolicy('site', 'n', { ...env, VERCEL_ENV: 'preview' })).toContain(
      'https://vercel.live',
    )
  })

  it('eval only in development', () => {
    expect(buildPolicy('site', 'n', { ...env, NODE_ENV: 'development' })).toContain("'unsafe-eval'")
  })

  it('club sites are enforced; the admin reports only, for now', () => {
    expect(policyHeaderName('site')).toBe('Content-Security-Policy')
    expect(policyHeaderName('admin')).toBe('Content-Security-Policy-Report-Only')
  })
})
