import { siteFromPreview } from '@/site/resolveSite'
import { suggestResponse } from '@/site/routes/suggest'

export const dynamic = 'force-dynamic'

/** The header search panel's data on the staging preview (src/site/routes/suggest.ts). */
export async function GET(request: Request, { params }: { params: Promise<{ club: string }> }) {
  return suggestResponse(await siteFromPreview((await params).club, null), request)
}
