import { siteFromDomain } from '@/site/resolveSite'
import { robotsResponse } from '@/site/routes/seo'

export const dynamic = 'force-dynamic'

/** The club's robots.txt (src/site/routes/seo.ts). */
export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  return robotsResponse(await siteFromDomain((await params).domain))
}
