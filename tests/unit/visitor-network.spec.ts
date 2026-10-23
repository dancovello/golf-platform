import { describe, expect, it } from 'vitest'

import { visitorNetwork } from '@/security/rateLimit'

/** Search audit, finding 3: an IPv6 visitor is their /64 network, not each address in it. */
describe('which part of an address is one visitor', () => {
  it('counts every address in one IPv6 /64 as the same visitor', () => {
    const a = visitorNetwork('2001:db8:1234:5678::1')
    expect(a).toBe('2001:db8:1234:5678::/64')
    expect(visitorNetwork('2001:0db8:1234:5678:ffff:eeee:dddd:cccc')).toBe(a)
    expect(visitorNetwork('[2001:db8:1234:5678::9]')).toBe(a)
    expect(visitorNetwork('2001:db8:1234:5678::9%eth0')).toBe(a)
  })

  it('keeps different /64 networks apart', () => {
    expect(visitorNetwork('2001:db8:1234:5679::1')).not.toBe(
      visitorNetwork('2001:db8:1234:5678::1'),
    )
    expect(visitorNetwork('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(visitorNetwork('::1')).toBe('0:0:0:0::/64')
  })

  it('leaves IPv4, IPv4 written as IPv6, and non-addresses as they are', () => {
    expect(visitorNetwork('203.0.113.7')).toBe('203.0.113.7')
    expect(visitorNetwork('::ffff:203.0.113.7')).toBe('203.0.113.7')
    expect(visitorNetwork('unknown')).toBe('unknown')
    expect(visitorNetwork('club:3f9a0c1e-7b2d-4c1a-9e8f-1a2b3c4d5e6f')).toBe(
      'club:3f9a0c1e-7b2d-4c1a-9e8f-1a2b3c4d5e6f',
    )
  })
})
