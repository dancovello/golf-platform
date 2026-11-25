import type { Payload } from 'payload'

import { allowRequest, DEMO_VISITS_PER_DAY } from '@/security/rateLimit'

import { demoHasExpired, parseDemoAddress } from './demo'

/**
 * Counting visits to prospect demos (Dan, 25 Nov 2026), so Dan can see whether a club opened
 * the link he sent. Only the time and the page are kept: no IP address, no location, no device,
 * no cookie and nothing stored in the visitor's browser.
 *
 * The page tells the server once it has opened in a browser (src/site/components/DemoVisit.tsx),
 * rather than the server counting every request: email link checkers and chat link previews
 * fetch a link without running the page, so they aren't counted as visits.
 */

/** Longest page address kept. */
const MAX_PAGE = 200

/**
 * The part of the page address after /demo/<address>, e.g. "/" or "/green-fees". Null if the
 * page isn't part of this demo. Anything after ? or # is dropped (search words stay private).
 */
export const demoVisitPage = (address: string, pathname: unknown): string | null => {
  if (typeof pathname !== 'string') return null
  const base = `/demo/${address}`
  const path = pathname.split(/[?#]/)[0]!
  if (path !== base && !path.startsWith(`${base}/`)) return null
  const page = path.slice(base.length).replace(/\/+$/, '') || '/'
  if (page.length > MAX_PAGE || !/^[\w\-/.%~]+$/.test(page)) return null
  return page
}

/**
 * Saves one visit to the demo at `address` (what comes after /demo/), if that demo is switched
 * on and hasn't expired. Each demo saves at most DEMO_VISITS_PER_DAY visits a day, so the
 * table can't be flooded. Says whether a visit was saved.
 */
export const recordDemoVisit = async (
  payload: Payload,
  address: unknown,
  pathname: unknown,
  now = new Date(),
): Promise<boolean> => {
  if (typeof address !== 'string') return false
  const parsed = parseDemoAddress(address)
  if (!parsed) return false
  const page = demoVisitPage(address, pathname)
  if (!page) return false
  const { docs } = await payload.find({
    collection: 'tenants',
    where: {
      and: [
        { demoEnabled: { equals: true } },
        { demoToken: { equals: parsed.token } },
        { slug: { equals: parsed.slug } },
      ],
    },
    select: { demoExpiresAt: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const club = docs[0]
  if (!club || demoHasExpired(club.demoExpiresAt, now)) return false
  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  if (!(await allowRequest(db, DEMO_VISITS_PER_DAY, `demo:${club.id}`, now))) return false
  await payload.create({
    collection: 'demo-visits',
    data: { clubId: String(club.id), visitedAt: now.toISOString(), page },
    overrideAccess: true,
    depth: 0,
  })
  return true
}
