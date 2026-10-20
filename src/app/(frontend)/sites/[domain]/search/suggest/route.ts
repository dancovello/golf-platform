import { siteFromDomain } from '@/site/resolveSite'
import { suggestResponse } from '@/site/routes/suggest'

export const dynamic = 'force-dynamic'

/** The header search panel's data on a club's own domain (src/site/routes/suggest.ts). */
export async function GET(request: Request, { params }: { params: Promise<{ domain: string }> }) {
  return suggestResponse(await siteFromDomain((await params).domain), request)
}
