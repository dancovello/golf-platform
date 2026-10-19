import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import type { Access } from 'payload'

export type AccountRole = 'super-admin' | 'editor'

type RelationValue = string | { id: string } | null | undefined

export const isSuperAdmin = (user: unknown): boolean =>
  Boolean(user && (user as { role?: AccountRole }).role === 'super-admin')

/** The single club an editor belongs to, or null (super-admins and anonymous visitors). */
export const editorTenantID = (user: unknown): string | null => {
  if (!user || isSuperAdmin(user)) return null
  const tenant = (user as { tenant?: RelationValue }).tenant
  if (tenant === null || tenant === undefined) return null
  return typeof tenant === 'object' ? tenant.id : tenant
}

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

/** Any logged-in account. For club-owned collections the multi-tenant plugin then narrows
 * editors to their own club's records (src/tenancy.ts). */
export const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/**
 * Creating a club's content (pages, news, events, team, courses, photos, documents). Editors:
 * yes, and the multi-tenant plugin puts it in their own club. The super-admin: only once a
 * club is picked in the club selector, so it's always clear which club it's for (Dan,
 * 2026-10-17). Trusted scripts (the demo club, seeds) bypass access rules entirely.
 */
export const clubContentCreate: Access = ({ req }) => {
  if (!req.user) return false
  if (!isSuperAdmin(req.user)) return true
  return Boolean(getTenantFromCookie(req.headers, 'text'))
}
