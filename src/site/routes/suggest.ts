import { findAnswer, quickAccess } from '@/search/answers'
import { searchGrouped } from '@/search/query'
import { withinLimit } from '@/security/limitRequest'
import { SEARCH_LIMIT } from '@/security/rateLimit'
import type { ResolvedSite } from '@/site/resolveSite'
import { toPanelResults } from '@/site/search/panelData'

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    // Answers change as the club edits its site, and say nothing worth keeping.
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })

/** The header search panel's results as the visitor types, and its quick access before that
 * (src/site/search/SearchPanel.tsx). Null `site`: no such club here. */
export const suggestResponse = async (site: ResolvedSite | null, request: Request) => {
  if (!site) return json({ error: 'Not found' }, 404)
  if (!(await withinLimit(SEARCH_LIMIT, request.headers))) return json({ error: 'busy' }, 429)
  const { club, base } = site
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  // Nothing typed yet: the panel's quick access (live course status, prices, hours, events).
  if (!q) return json({ quick: await quickAccess(club, base) })
  const [results, answer] = await Promise.all([
    searchGrouped(club.tenantID, q, { perKind: 2, best: true }),
    findAnswer(club, base, q),
  ])
  return json(toPanelResults(results, base, answer))
}
