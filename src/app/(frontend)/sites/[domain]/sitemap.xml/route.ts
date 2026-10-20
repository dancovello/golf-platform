import { siteFromDomain } from '@/site/resolveSite'
import { sitemapResponse } from '@/site/routes/seo'

export const dynamic = 'force-dynamic'

/** The club's sitemap.xml (src/site/routes/seo.ts). */
export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  return sitemapResponse(await siteFromDomain((await params).domain))
}
