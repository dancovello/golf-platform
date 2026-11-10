import * as Sentry from '@sentry/nextjs'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterLoginHook,
  CollectionAfterOperationHook,
} from 'payload'

import { sentryEnabled } from '../monitoring/sentry'
import { auditIdOf, recordAudit } from './record'

/**
 * The hooks that write audit entries (src/audit/record.ts) for accounts, sign-ins and clubs.
 * Each one only reads what it's handed and calls `recordAudit`, which can't fail the action.
 */

/** The club an account belongs to (editors), as the log's club ID. */
const clubOf = (doc: { tenant?: unknown } | null | undefined) => auditIdOf(doc?.tenant)

/**
 * Password accepted. For a super-admin, or an editor who has set up two-factor, the code comes
 * next and is recorded separately (src/auth/superAdminTwoFactor.ts).
 *
 * EMERGENCY_ADMIN_EMAIL: the offline emergency super-admin account (docs/operations/incident-plan.md).
 * If that account ever signs in, Sentry emails Dan at once. Does nothing while the variable is unset.
 */
export const auditSignIn: CollectionAfterLoginHook = async ({ req, user }) => {
  const u = user as { email?: string; tenant?: unknown }
  await recordAudit(req.payload, {
    action: 'sign-in',
    actor: user,
    clubId: clubOf(u),
    target: u.email,
  })
  const emergency = process.env.EMERGENCY_ADMIN_EMAIL?.trim().toLowerCase()
  if (emergency && u.email?.toLowerCase() === emergency && sentryEnabled()) {
    Sentry.captureMessage('Emergency super-admin account signed in', 'fatal')
    await Sentry.flush(2000)
  }
  return user
}

export const auditAccountChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const account = doc as { email?: string; role?: string; tenant?: unknown }
  if (operation === 'create') {
    await recordAudit(req.payload, {
      action: 'account-created',
      actor: req.user,
      clubId: clubOf(account),
      target: account.email,
      detail: account.role,
    })
  } else {
    const before = (previousDoc as { email?: string } | undefined)?.email
    if (before && account.email && before !== account.email) {
      await recordAudit(req.payload, {
        action: 'account-email-changed',
        actor: req.user,
        clubId: clubOf(account),
        target: account.email,
        detail: `was ${before}`,
      })
    }
    // Set by notePasswordChange (src/auth/sessionLimit.ts) when this save sets a new password.
    if (req.context.passwordChanged === true) {
      await recordAudit(req.payload, {
        action: 'password-changed',
        actor: req.user,
        clubId: clubOf(account),
        target: account.email,
      })
    }
  }
  return doc
}

export const auditAccountRemoved: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const account = doc as { email?: string; tenant?: unknown }
  await recordAudit(req.payload, {
    action: 'account-removed',
    actor: req.user,
    clubId: clubOf(account),
    target: account.email,
  })
  return doc
}

/** A password set from an emailed or platform link (nobody is signed in at that point). */
export const auditPasswordReset: CollectionAfterOperationHook = async ({
  operation,
  req,
  result,
}) => {
  if (operation === 'resetPassword') {
    const id = (result as { user?: { id?: string } })?.user?.id
    const account = id
      ? await req.payload
          .findByID({ collection: 'users', id, depth: 0, overrideAccess: true })
          .catch(() => null)
      : null
    await recordAudit(req.payload, {
      action: 'password-reset',
      actor: account,
      clubId: clubOf(account),
      target: account?.email,
    })
  }
  return result
}

const CLUB_FIELDS = ['name', 'slug'] as const

const hostsOf = (club: { domains?: { hostname?: string }[] | null } | undefined) =>
  (club?.domains ?? []).map((d) => d?.hostname).filter(Boolean)

export const auditClubChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const club = doc as {
    id: string
    name?: string
    slug?: string
    demoEnabled?: boolean
    domains?: { hostname?: string }[]
  }
  if (operation === 'create') {
    await recordAudit(req.payload, {
      action: 'club-created',
      actor: req.user,
      clubId: club.id,
      clubName: club.name,
      target: club.name,
    })
    return doc
  }
  const before = (previousDoc ?? {}) as typeof club
  const changes: string[] = []
  for (const field of CLUB_FIELDS) {
    if (before[field] !== club[field]) changes.push(`${field}: ${before[field]} → ${club[field]}`)
  }
  const [was, now] = [hostsOf(before).join(', '), hostsOf(club).join(', ')]
  if (was !== now) changes.push(`web addresses: ${was || 'none'} → ${now || 'none'}`)
  if (Boolean(before.demoEnabled) !== Boolean(club.demoEnabled)) {
    changes.push(`public demo: ${club.demoEnabled ? 'on' : 'off'}`)
  }
  if (changes.length > 0) {
    await recordAudit(req.payload, {
      action: 'club-changed',
      actor: req.user,
      clubId: club.id,
      clubName: club.name,
      target: club.name,
      detail: changes.join('; '),
    })
  }
  return doc
}

export const auditClubDeleted: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const club = doc as { id: string; name?: string }
  await recordAudit(req.payload, {
    action: 'club-deleted',
    actor: req.user,
    clubId: club.id,
    clubName: club.name,
    target: club.name,
  })
  return doc
}
