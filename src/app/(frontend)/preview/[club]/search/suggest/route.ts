import { findAnswer, quickAccess } from '@/search/answers'
import { searchGrouped } from '@/search/query'
import { allowSearch, visitorKey } from '@/search/rateLimit'
import { loadClubBySlug } from '@/site/loadClub'
import { siteBase, sitePreviewEnabled } from '@/site/preview'
import { toPanelResults } from '@/site/search/panelData'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    // Answers change as the club edits its site, and say nothing worth keeping.
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })

/** The header search panel's results as the visitor types, and its quick access before that
 * (src/site/search/SearchPanel.tsx). */
export async function GET(request: Request, { params }: { params: Promise<{ club: string }> }) {
  if (!sitePreviewEnabled()) return json({ error: 'Not found' }, 404)
  const club = await loadClubBySlug((await params).club)
  if (!club) return json({ error: 'Not found' }, 404)
  if (!allowSearch(visitorKey(request.headers))) return json({ error: 'busy' }, 429)
  const base = siteBase(club.slug)
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  // Nothing typed yet: the panel's quick access (live course status, prices, hours, events).
  if (!q) return json({ quick: await quickAccess(club, base) })
  const [results, answer] = await Promise.all([
    searchGrouped(club.tenantID, q, { perKind: 2, best: true }),
    findAnswer(club, base, q),
  ])
  return json(toPanelResults(results, base, answer))
}
