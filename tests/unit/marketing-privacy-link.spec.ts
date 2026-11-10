import { describe, expect, it } from 'vitest'

import { onlyPublished, privacyPolicyHref } from '@/marketing/site/chrome/links'

// The cookie banner on a1engine.co links to the privacy policy. Before this rule it always
// linked to /privacy, which was "page not found" until the page was published (10 Nov 2026).
describe('the cookie banner’s privacy policy link', () => {
  it('goes to the privacy page once it is published', () => {
    expect(privacyPolicyHref(new Set(['home', 'privacy']))).toBe('/privacy')
  })

  it('names no link while the privacy page is unpublished or missing', () => {
    expect(privacyPolicyHref(new Set(['home', 'pricing']))).toBeNull()
    expect(privacyPolicyHref(new Set())).toBeNull()
  })

  it('follows the same rule as the footer’s Privacy link', () => {
    const footer = [{ href: '/privacy' }]
    for (const published of [new Set(['privacy']), new Set(['home'])]) {
      const inFooter = onlyPublished(footer, published).length > 0
      expect(privacyPolicyHref(published) !== null).toBe(inFooter)
    }
  })
})
