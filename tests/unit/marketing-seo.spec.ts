import { describe, expect, it } from 'vitest'

import {
  jsonForScript,
  marketingOrigin,
  organizationJsonLd,
  pagePath,
  robotsBody,
  sitemapXml,
} from '@/marketing/seo'

// What search engines are told about the company's marketing site (src/marketing/seo.ts).

describe('marketing site for search engines', () => {
  it('uses the main company address, or the brand domain until one is set', () => {
    expect(marketingOrigin(['brandname.golf', 'www.brandname.golf'])).toBe('https://brandname.golf')
    expect(marketingOrigin([])).toBe('https://brandname.golf')
  })

  it('welcomes search engines on production only, and points them at the sitemap', () => {
    expect(robotsBody(true, 'https://example.golf')).toContain('Allow: /')
    expect(robotsBody(true, 'https://example.golf')).toContain(
      'Sitemap: https://example.golf/sitemap.xml',
    )
    expect(robotsBody(false)).toBe('User-agent: *\nDisallow: /\n')
  })

  it('lists published pages, with the home page as the bare address', () => {
    expect(pagePath('home')).toBe('/')
    expect(pagePath('pricing')).toBe('/pricing')
    const xml = sitemapXml(new Set(['home', 'pricing']), 'https://example.golf')
    expect(xml).toContain('<loc>https://example.golf/</loc>')
    expect(xml).toContain('<loc>https://example.golf/pricing</loc>')
  })

  it('gives the company name, address and email, and can never close its script tag', () => {
    const data = organizationJsonLd('https://example.golf')
    expect(data).toMatchObject({ '@type': 'Organization', url: 'https://example.golf' })
    expect(jsonForScript({ name: '</script><b>' })).not.toContain('<')
    expect(JSON.parse(jsonForScript({ name: '</script>' }))).toEqual({ name: '</script>' })
  })
})
