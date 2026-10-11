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
