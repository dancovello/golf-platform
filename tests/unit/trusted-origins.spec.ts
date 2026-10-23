import { describe, expect, it } from 'vitest'

import { trustedOrigins } from '@/auth/trustedOrigins'

/** Sign-in audit, finding A5: the login cookie is accepted only from the admin's addresses. */
describe('the addresses the admin is reached from', () => {
  it('on Vercel: the admin address and this deployment’s own addresses, never localhost', () => {
    expect(
      trustedOrigins({
        VERCEL: '1',
        ADMIN_URL: 'https://golf-platform-env-staging.vercel.app/',
        VERCEL_URL: 'golf-platform-abc123.vercel.app',
        VERCEL_BRANCH_URL: 'golf-platform-git-main.vercel.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'golf-platform.vercel.app',
      }),
    ).toEqual([
      'https://golf-platform-env-staging.vercel.app',
      'https://golf-platform-abc123.vercel.app',
      'https://golf-platform-git-main.vercel.app',
      'https://golf-platform.vercel.app',
    ])
  })

  it('locally: localhost, for development and the browser tests', () => {
    expect(trustedOrigins({})).toEqual(['http://localhost:3000', 'http://localhost:3100'])
  })

  it('ignores a value that is not an address', () => {
    expect(trustedOrigins({ VERCEL: '1', ADMIN_URL: 'not a url' })).toEqual([])
  })
})
