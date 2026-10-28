import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { trackDbTiming } from '@/monitoring/trackDbTiming'
import { addressCached } from './cache'

import { SLUG } from '@/fields/slug'

import { canSeeDrafts, draftAccess } from './livePreviewAccess'
import { type ClubSite, clubIDBySlug, loadClubBySlug } from './loadClub'
import { siteBase, sitePreviewEnabled } from './preview'

/**
 * Which club a request is for, and where that club's site starts. There are exactly two ways
 * in (build step 4):
 *
 * - **The club's own domain** (`www.yourclub.co.uk/membership`). src/proxy.ts rewrites the
 *   request to `/sites/<host>/membership` and sets `x-club-host`. The club is found only from
 *   its list of web addresses; pages start at "/".
 * - **The preview** (`/preview/<club>/membership`), on staging only, plus the admin's live
 *   preview (`?live=1`) for that club's signed-in editors and the super-admin everywhere.
 *
 * Nothing a visitor sends can pick a club any other way.
 */
export type ResolvedSite = {
  club: ClubSite
  /** Where the club's pages start: "" on its own domain, "/preview/<club>" on staging. */
  base: string
  /** The club's main address with scheme, e.g. "https://www.yourclub.co.uk", on its own domain
   * only (canonical links, sitemap). Null on the preview. */
  origin: string | null
  /** Search engines may index it: the club's own domain on production only. */
  indexable: boolean
}

/** Headers src/proxy.ts sets on a club-domain request (any sent by the visitor are dropped). */
export const CLUB_HOST_HEADER = 'x-club-host'
export const CLUB_ORIGIN_HEADER = 'x-club-origin'

/** The club that owns a web address, and its main address (the first in its list). */
export const findClubByHost = cache((host: string) => clubByHost(host))

/** Cached by address (src/site/cache.ts): cleared whenever any club's addresses change. */
const clubByHost = addressCached(
  'clubByHost',
  async (host: string): Promise<{ slug: string; mainHost: string } | null> => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'tenants',
      where: { 'domains.hostname': { equals: host } },
      select: { slug: true, domains: true },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const tenant = docs[0]
    const mainHost = tenant?.domains?.[0]?.hostname
    if (!tenant?.slug || !mainHost) return null
    return { slug: tenant.slug, mainHost }
  },
)

/**
 * The club site for a request on a club's own domain. `domainParam` is the `[domain]` route
 * segment; it must match the address the proxy saw, so `/sites/<another club's domain>` typed
 * into the address bar finds nothing (the proxy refuses such paths too).
 *
 * `redirect` is set when the request came in on one of the club's other addresses: the caller
 * forwards the visitor to the same page on the main address.
 */
export const siteFromDomain = cache(
  async (domainParam: string): Promise<(ResolvedSite & { redirect: string | null }) | null> => {
    await trackDbTiming()
    const h = await headers()
    const host = h.get(CLUB_HOST_HEADER)
    if (!host || host !== decodeURIComponent(domainParam)) return null
    const found = await findClubByHost(host)
    if (!found) return null
    const club = await loadClubBySlug(found.slug)
    if (!club) return null
    // The scheme and port the visitor used (http and a port only on a developer's computer).
    const seen = new URL(h.get(CLUB_ORIGIN_HEADER) ?? `https://${host}`)
    const origin = `${seen.protocol}//${found.mainHost}${seen.port ? `:${seen.port}` : ''}`
    return {
      club,
      base: '',
      origin,
      indexable: process.env.VERCEL_ENV === 'production',
      redirect: found.mainHost === host ? null : origin,
    }
  },
)

/**
 * The club site for a `/preview/<club>` request. On staging (SITE_PREVIEW=on) anyone behind
 * the Vercel login can view it. Elsewhere, including production, only the admin's live
 * preview works, and only for someone allowed to see that club's drafts.
 */
export const siteFromPreview = cache(
  async (slug: string, live: unknown): Promise<ResolvedSite | null> => {
    // Only names that could be a club's are looked up.
    if (typeof slug !== 'string' || !SLUG.test(slug)) return null
    const open = sitePreviewEnabled()
    if (!open) {
      // Who's asking comes first, so someone who can't see this club's drafts gets the same
      // answer, after the same work, whether or not the club exists (audit T2,
      // docs/security/audit-tenancy.md).
      const access = await draftAccess(live)
      if (!access) return null
      if (access !== 'every club' && (await clubIDBySlug(slug)) !== access.tenantID) return null
    }
    await trackDbTiming()
    const club = await loadClubBySlug(slug)
    if (!club) return null
    if (!open && !(await canSeeDrafts(club.tenantID, live))) return null
    return { club, base: siteBase(club.slug), origin: null, indexable: false }
  },
)
