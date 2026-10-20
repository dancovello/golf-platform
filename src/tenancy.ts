import { isSuperAdmin } from './access/roles'

/**
 * The single source of truth for which collections belong to a club.
 *
 * - The multi-tenant plugin (payload.config.ts) adds a required club field to each of these
 *   and limits editors to their own club's records.
 * - The tenant-isolation suite (tests/int/isolation.int.spec.ts) tests every one of them.
 * - tests/unit/tenancy-guard.spec.ts fails if a collection is in neither list below.
 */
export const clubOwnedCollections = {
  pages: {},
  media: {},
  documents: {},
  staff: {},
  courses: {},
  news: {},
  'agreement-acceptances': {},
  events: {},
  enquiries: {},
  // One record per club: the plugin's "global" mode. Never a real Payload global.
  'club-settings': { isGlobal: true },
  'course-status': { isGlobal: true },
} as const

/** Platform-level collections, scoped by their own access rules instead of the plugin. */
export const platformCollections = ['users', 'tenants'] as const

export type ClubOwnedSlug = keyof typeof clubOwnedCollections

/** Shown first in a club-owned item's form, to the super-admin only (src/admin/ClubBanner). */
export const clubBannerField = {
  name: 'clubBanner',
  type: 'ui' as const,
  admin: {
    components: { Field: '/admin/ClubBanner#ClubBanner' },
    condition: (_data: unknown, _sibling: unknown, { user }: { user: unknown }) =>
      isSuperAdmin(user),
  },
}
