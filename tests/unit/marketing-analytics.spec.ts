import { describe, expect, it } from 'vitest'

import { marketingGAId } from '@/marketing/analytics'

describe('marketing analytics ID', () => {
  it('uses a real Google Analytics ID, trimmed', () => {
    expect(marketingGAId('G-LQXZHBBCGP')).toBe('G-LQXZHBBCGP')
    expect(marketingGAId(' G-LQXZHBBCGP ')).toBe('G-LQXZHBBCGP')
  })

  it('is off when empty, missing or the wrong kind of ID', () => {
    for (const value of [undefined, '', '  ', 'GTM-522LKHRT', 'UA-12345-1', 'g-lqxzhbbcgp']) {
      expect(marketingGAId(value)).toBeNull()
    }
  })
})
