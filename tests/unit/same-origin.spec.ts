import { describe, expect, it } from 'vitest'

import { fromAnotherSite } from '@/security/sameOrigin'

const request = (origin?: string) =>
  new Request('https://admin.example.com/api/demo-club', {
    method: 'POST',
    headers: origin === undefined ? {} : { origin },
  })

describe('fromAnotherSite', () => {
  it('allows the admin itself and requests with no Origin', () => {
    expect(fromAnotherSite(request('https://admin.example.com'))).toBe(false)
    expect(fromAnotherSite(request())).toBe(false)
  })

  it('refuses other sites, and Origins that aren’t web addresses', () => {
    expect(fromAnotherSite(request('https://evil.example'))).toBe(true)
    expect(fromAnotherSite(request('null'))).toBe(true)
    expect(fromAnotherSite(request('not a url'))).toBe(true)
  })
})
