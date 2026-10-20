import config from '@payload-config'
import { getPayload } from 'payload'

import { newsForSitemap } from '@/site/news'
import { PUBLISHED } from '@/site/published'
import type { ResolvedSite } from '@/site/resolveSite'

const text = (body: string, type: string) =>
  new Response(body, {
    headers: { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600' },
  })

/**
 * The club's robots.txt. Search engines are welcome on a club's own domain on production;
 * everywhere else (staging, previews, unknown addresses) they're asked to stay away.
 */
export const robotsResponse = (site: ResolvedSite | null) => {
  if (!site?.indexable || !site.origin) return text('User-agent: *\nDisallow: /\n', 'text/plain')
  return text(
    `User-agent: *\nAllow: /\nDisallow: /search\n\nSitemap: ${site.origin}/sitemap.xml\n`,
    'text/plain',
  )
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The club's sitemap: its published pages and articles, plus the built-in pages. */
export const sitemapResponse = async (site: ResolvedSite | null) => {
  if (!site?.origin) return new Response('Not found', { status: 404 })
  const { origin, club } = site
  const payload = await getPayload({ config })
  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { and: [{ tenant: { equals: club.tenantID } }, PUBLISHED] },
    select: { slug: true, updatedAt: true },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const news = await newsForSitemap(club.tenantID)
  const entries: { path: string; updatedAt?: string | null }[] = [
    ...pages.map((p) => ({ path: p.slug === 'home' ? '/' : `/${p.slug}`, updatedAt: p.updatedAt })),
    ...(pages.some((p) => p.slug === 'home') ? [] : [{ path: '/' }]),
    { path: '/news' },
    ...news.map((n) => ({ path: `/news/${n.slug}`, updatedAt: n.updatedAt })),
    { path: '/events' },
    { path: '/contact' },
    { path: '/privacy' },
  ]
  const urls = entries
    .map(({ path, updatedAt }) => {
      const loc = `<loc>${escape(`${origin}${path === '/' ? '/' : path}`)}</loc>`
      const mod = updatedAt ? `<lastmod>${escape(updatedAt.slice(0, 10))}</lastmod>` : ''
      return `  <url>${loc}${mod}</url>`
    })
    .join('\n')
  return text(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'application/xml',
  )
}
