import { isSuperAdmin, superAdminOnly } from '../access/roles'

/**
 * The company website's content is the super-admin's alone (decision 2026-10-21). Club editors
 * can't read, change or even see it in the admin: it's not theirs, and they shouldn't learn
 * more about the platform than their own club. The website reads it on the server, published
 * versions only (src/marketing/content.ts).
 */
export const marketingAccess = {
  create: superAdminOnly,
  read: superAdminOnly,
  update: superAdminOnly,
  delete: superAdminOnly,
}

/** Hides a collection or settings screen from everyone but the super-admin. */
export const hiddenFromEditors = ({ user }: { user: unknown }) => !isSuperAdmin(user)

/** The admin sidebar heading for everything about the company website. */
export const MARKETING_GROUP = 'Company website'
