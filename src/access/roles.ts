import type { Access } from 'payload'

export type AccountRole = 'super-admin' | 'editor'

type MaybeUser = unknown

export const isSuperAdmin = (user: MaybeUser): boolean =>
  Boolean(user && (user as { role?: AccountRole }).role === 'super-admin')

/** The single club an editor belongs to, or null. */
export const editorTenantID = (user: MaybeUser): number | null => {
  if (!user || isSuperAdmin(user)) return null
  const tenant = (user as { tenant?: number | { id: number } | null }).tenant
  if (tenant === null || tenant === undefined) return null
  return typeof tenant === 'object' ? tenant.id : tenant
}

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

/** Any logged-in account. The multi-tenant plugin narrows editors to their own club. */
export const loggedIn: Access = ({ req: { user } }) => Boolean(user)
