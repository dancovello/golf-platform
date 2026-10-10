import type { Access, CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

import { editorTenantID, isSuperAdmin } from '../access/roles'

const read: Access = ({ req: { user } }): boolean | Where => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = editorTenantID(user)
  if (tenantID === null) return { id: { equals: user.id } }
  // An editor sees themselves and other editors of their own club. Never super-admins.
  return {
    or: [
      { id: { equals: user.id } },
      { and: [{ role: { equals: 'editor' } }, { tenant: { equals: tenantID } }] },
    ],
  }
}

const update: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return { id: { equals: user.id } }
}

// Our rules, kept frozen. The multi-tenant plugin replaces `Users.access` functions in place
// with wrapped versions, so the plugin's override (payload.config.ts) must call these
// originals; calling `Users.access` from there would call itself forever.
export const usersAccess = Object.freeze({
  admin: ({ req: { user } }: { req: { user: unknown } }) => Boolean(user),
  // Editors are created by a super-admin; super-admins only by the CLI script (see hook).
  create: (({ req: { user } }) => isSuperAdmin(user)) as Access,
  read,
  update,
  delete: (({ req: { user } }) => isSuperAdmin(user)) as Access,
} satisfies CollectionConfig['access'])

export const Users: CollectionConfig = {
  slug: 'users',
  // Document locking is off: Payload's lock records are readable by every logged-in user,
  // across clubs. See docs/plans/step-2-spike-findings.md.
  lockDocuments: false,
  admin: { useAsTitle: 'email' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: { ...usersAccess },
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        if (operation !== 'create') return data
        const trustedScript = context.allowAccountCreation === true
        if (data.role === 'super-admin' && !trustedScript) {
          throw new APIError(
            'Super-admin accounts can only be created by the platform script.',
            403,
          )
        }
        if (data.role === 'editor' && !trustedScript && !isSuperAdmin(req.user)) {
          throw new APIError('Accounts can only be created by a platform administrator.', 403)
        }
        if (data.role !== 'editor' && data.role !== 'super-admin') {
          throw new APIError('Accounts can only be created by a platform administrator.', 403)
        }
        return data
      },
    ],
    // The multi-tenant plugin reads a user's clubs from `tenants`. We store exactly one
    // club in `tenant` (enforced by the database) and present it in the plugin's shape.
    afterRead: [
      ({ doc }) => {
        const tenant = doc.tenant ?? null
        doc.tenants = tenant === null ? [] : [{ tenant }]
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Club editor', value: 'editor' },
        { label: 'Super-admin', value: 'super-admin' },
      ],
      // Set once at creation. Never changeable, by anyone (the database enforces this too).
      access: { update: () => false },
      admin: { readOnly: false },
    },
    {
      name: 'tenant',
      label: 'Club',
      type: 'relationship',
      relationTo: 'tenants',
      hasMany: false,
      access: { update: () => false },
      admin: { condition: (data) => data?.role === 'editor' },
    },
  ],
}
