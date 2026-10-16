import type {
  Access,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Where,
} from 'payload'
import { APIError, ValidationError } from 'payload'

import { enforceAccountCreationRules } from '../access/accountCreation'
import { editorTenantID, isSuperAdmin } from '../access/roles'
import { inviteEndpoint, passwordLinkEndpoint } from '../accounts/endpoints'
import {
  passwordResetByEmailEnabled,
  RESET_EMAIL_INTERVAL_MS,
  resetEmailHTML,
  resetEmailSubject,
} from '../accounts/resetEmail'
import { resetTwoFactorEndpoint } from '../auth/resetTwoFactor'

export const MIN_PASSWORD_LENGTH = 12

const read: Access = ({ req: { user } }): boolean | Where => {
  if (!user) return false
  // Password accepted but two-factor code not entered yet: own account only. Payload re-reads
  // the logged-in account on every admin page, and without this nobody could reach the code
  // screen. Everything else stays refused until the code is entered.
  if ((user as { _strategy?: string })._strategy !== 'totp') return { id: { equals: user.id } }
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

/**
 * Our access rules, frozen. From step 2.3 the multi-tenant plugin replaces the functions on
 * `Users.access` in place, so anything that needs the originals must call these
 * (docs/plans/step-2-spike-findings.md, finding 1).
 */
export const usersAccess = Object.freeze({
  admin: ({ req: { user } }: { req: { user: unknown } }) => Boolean(user),
  // Further narrowed by enforceAccountCreationRules: super-admins only via the script.
  create: (({ req: { user } }) => isSuperAdmin(user)) as Access,
  read,
  update,
  delete: (({ req: { user } }) => isSuperAdmin(user)) as Access,
} satisfies CollectionConfig['access'])

const enforcePasswordLength: CollectionBeforeValidateHook = ({ collection, data }) => {
  const password = (data as { password?: unknown } | undefined)?.password
  if (typeof password === 'string' && password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        {
          message: `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          path: 'password',
        },
      ],
    })
  }
  return data
}

/**
 * - Payload's public "Forgot password?" emails a reset link (src/accounts/resetEmail.ts), but
 *   only where email is set up and ADMIN_URL is known. Elsewhere it is refused: with no email
 *   provider, Payload would write reset links into the server logs. The platform's own "set
 *   your password" links (src/accounts/passwordLinks.ts) always work.
 * - Setting a password through a link skips beforeValidate's view of the new password, so the
 *   minimum length is checked here as well.
 */
const passwordOperationRules: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (
    operation === 'forgotPassword' &&
    req.context?.passwordLinkByAdmin !== true &&
    !passwordResetByEmailEnabled()
  ) {
    throw new APIError(
      'Password reset by email is not available yet. Ask your platform administrator for a new link.',
      403,
    )
  }
  if (operation === 'resetPassword') {
    const password = (args as { data?: { password?: unknown } }).data?.password
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      throw new APIError(`Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400)
    }
  }
  return args
}

const visibleToSuperAdmins = (_data: unknown, _sibling: unknown, { user }: { user: unknown }) =>
  isSuperAdmin(user)

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Account', plural: 'Accounts' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'updatedAt'],
    components: { beforeListTable: ['/admin/InviteEditorButton#InviteEditorButton'] },
  },
  auth: {
    // Locks the account for 10 minutes after 5 wrong passwords.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    // The link's lifetime isn't set here: a setting here would also shorten the platform's
    // 72-hour "set your password" links. Payload's default for emailed links is one hour.
    forgotPassword: {
      minRequestInterval: RESET_EMAIL_INTERVAL_MS,
      generateEmailSubject: resetEmailSubject,
      generateEmailHTML: (args) => resetEmailHTML(String(args?.token ?? '')),
    },
  },
  access: { ...usersAccess },
  // payload-totp would refuse even reading your own account before the code is entered; our
  // `read` rule above applies the two-factor check itself, with that one exception.
  custom: { totp: { disableAccessWrapper: { read: true } } },
  endpoints: [inviteEndpoint, passwordLinkEndpoint, resetTwoFactorEndpoint],
  hooks: {
    beforeOperation: [passwordOperationRules],
    beforeValidate: [enforcePasswordLength],
    beforeChange: [enforceAccountCreationRules],
    // The multi-tenant plugin reads a user's clubs from a `tenants` list. We store exactly one
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
      // Super-admin buttons on a club editor's page: new password link, reset two-factor.
      name: 'accountActions',
      type: 'ui',
      admin: {
        components: { Field: '/admin/AccountActions#AccountActions' },
        condition: (data, sibling, ctx) =>
          visibleToSuperAdmins(data, sibling, ctx) && data?.role === 'editor' && Boolean(data?.id),
      },
    },
    {
      name: 'role',
      label: 'Account type',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Club editor', value: 'editor' },
        { label: 'Super-admin', value: 'super-admin' },
      ],
      // New accounts made in the admin screens can only be editors (super-admins come from the
      // script). Payload also applies this when saving, so trusted scripts get every option.
      filterOptions: ({ data, options, req }) =>
        data?.id || req.context?.allowAccountCreation === true
          ? options
          : options.filter(
              (option) => (typeof option === 'string' ? option : option.value) === 'editor',
            ),
      // Set once at creation and never changeable, by anyone. The database enforces this too.
      access: { update: () => false },
      admin: { condition: visibleToSuperAdmins },
    },
    {
      name: 'tenant',
      label: 'Club',
      type: 'relationship',
      relationTo: 'tenants',
      hasMany: false,
      access: { update: () => false },
      admin: {
        condition: (data, sibling, ctx) =>
          visibleToSuperAdmins(data, sibling, ctx) && data?.role === 'editor',
      },
      // Friendly messages; the database rejects the same cases on its own.
      validate: (value: unknown, { data }: { data: { role?: string } }) => {
        if (data?.role === 'editor' && !value) return 'Choose the club this editor belongs to.'
        if (data?.role === 'super-admin' && value) return 'Super-admins do not belong to a club.'
        return true
      },
    },
  ],
}
