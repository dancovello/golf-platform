import { siteFromDemo } from '@/site/resolveSite'
import { suggestResponse } from '@/site/routes/suggest'

export const dynamic = 'force-dynamic'

/** The header search panel's data on a prospect demo (src/site/routes/suggest.ts). */
export async function GET(request: Request, { params }: { params: Promise<{ club: string }> }) {
  const site = await siteFromDemo((await params).club)
  return suggestResponse(site === 'expired' ? null : site, request)
}
