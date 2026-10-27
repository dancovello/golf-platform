import { BRAND } from '@/brand'
import { marketingHosts } from '@/site/hosts'

/**
 * What search engines are told about the company's marketing site (phase 8): its address, the
 * robots.txt, the sitemap and the company details. Kept free of Payload so it can be tested alone.
 */

/** The company website's main address, e.g. "https://brandname.golf", with no trailing slash. */
export const marketingOrigin = (hosts = marketingHosts()): string =>
  `https://${hosts[0] ?? BRAND.domain}`

/** A page's address on the site: the home page is "/", the others "/pricing". */
export const pagePath = (slug: string): string => (slug === 'home' ? '/' : `/${slug}`)

/** robots.txt: search engines are welcome on production only. */
export const robotsBody = (production: boolean, origin = marketingOrigin()): string =>
  production
    ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** sitemap.xml for the published pages. */
export const sitemapXml = (slugs: Iterable<string>, origin = marketingOrigin()): string => {
  const urls = [...slugs]
    .map((slug) => `  <url><loc>${escape(`${origin}${pagePath(slug)}`)}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** The company's details for search engines (schema.org Organization), from src/brand.ts. */
export const organizationJsonLd = (origin = marketingOrigin()) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: origin,
  email: BRAND.email,
})

/** JSON for a script tag: "<" is escaped so the data can never close the tag early. */
export const jsonForScript = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')
