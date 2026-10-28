import { publishedMarketingSlugs } from '@/marketing/content'
import { sitemapXml } from '@/marketing/seo'

export const dynamic = 'force-dynamic'

/**
 * The company domain's sitemap.xml (reached only through src/proxy.ts): every published
 * marketing page. Pages that are built but not published (Trust, the legal pages) aren't listed.
 */
export async function GET() {
  return new Response(sitemapXml(await publishedMarketingSlugs()), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
