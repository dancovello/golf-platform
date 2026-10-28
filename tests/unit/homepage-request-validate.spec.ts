import { describe, expect, it } from 'vitest'

import { cleanWebsite, validateRequest } from '@/marketing/requests/validate'

// The Homepage Request Form's checks (hand-off §10: "Validate URL loosely").

describe('the current website, loosely', () => {
  it('accepts an address with or without https:// or www', () => {
    expect(cleanWebsite('ashgroveparkgc.co.uk')).toBe('https://ashgroveparkgc.co.uk')
    expect(cleanWebsite(' www.ashgrove.golf/ ')).toBe('https://www.ashgrove.golf')
    expect(cleanWebsite('http://ashgrove.org.uk/home')).toBe('http://ashgrove.org.uk/home')
  })

  it('refuses things that can’t be a club’s website', () => {
    for (const bad of [
      '',
      'ashgrove',
      'not a site',
      'javascript:alert(1)',
      'ftp://club.co.uk',
      'https://user:pw@club.co.uk',
      'mailto:a@b.com',
    ]) {
      expect(cleanWebsite(bad), bad).toBeNull()
    }
  })
})

describe('the form', () => {
  it('needs all three, with a plain message for each', () => {
    expect(validateRequest({ clubName: '', website: '', email: '' })).toEqual({
      clubName: 'Enter your club’s name.',
      website: 'Enter your club’s current website.',
      email: 'Enter your email address.',
    })
    expect(
      validateRequest({
        clubName: 'Ashgrove',
        website: 'ashgrove.golf',
        email: 'sec@ashgrove.golf',
      }),
    ).toEqual({})
    expect(
      validateRequest({ clubName: 'A', website: 'a.golf', email: 'not-an-email' }).email,
    ).toMatch(/like you@yourclub/)
  })
})
