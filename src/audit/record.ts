import * as Sentry from '@sentry/nextjs'
import type { Payload } from 'payload'

import { sentryEnabled } from '../monitoring/sentry'

/**
 * The audit log: who did what, and when (audit fix plan, step 12, finding M6). Written only by
 * this file's `recordAudit`, from server code; nobody can add, change or delete an entry
 * through the admin or the API, and only the super-admin can read them
 * (src/collections/AuditLog.ts). Entries are deleted 12 months after they're made by the nightly
 * clean-up (src/privacy/cleanUp.ts).
 *
 * What is recorded is deliberately short: who (account, role), which club, the action, and what
 * it was done to (an email address, a club or item name). Never page text, photos, passwords,
 * codes or IP addresses; and not every save, which would only bury the entries that matter.
 */
export const AUDIT_ACTIONS = [
  { value: 'sign-in', label: 'Signed in (password accepted)' },
  { value: 'two-factor-code-accepted', label: 'Two-factor code accepted' },
  { value: 'two-factor-set-up', label: 'Two-factor set up' },
  { value: 'two-factor-removed', label: 'Two-factor switched off' },
  { value: 'two-factor-reset', label: 'Two-factor reset' },
  { value: 'account-created', label: 'Account created' },
  { value: 'account-removed', label: 'Account removed' },
  { value: 'account-email-changed', label: 'Account email changed' },
  { value: 'password-changed', label: 'Password changed' },
  { value: 'password-reset', label: 'Password set from a link' },
  { value: 'password-link-issued', label: 'Password link issued' },
  { value: 'editor-invited', label: 'Editor invited' },
  { value: 'club-created', label: 'Club created' },
  { value: 'club-changed', label: 'Club changed (name, short name, web addresses, demo)' },
  { value: 'club-deleted', label: 'Club deleted' },
  { value: 'demo-club-built', label: 'Demo club built' },
  { value: 'marketing-starter-added', label: 'Marketing starter pages added' },
  { value: 'content-deleted', label: 'Club content deleted' },
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]['value']

export type AuditEntry = {
  action: AuditAction
  /** The signed-in account behind the action. None for scripts and scheduled jobs. */
  actor?: unknown
  clubId?: string | null
  clubName?: string | null
  /** What it was done to: an email address, a club or item name. */
  target?: string | null
  /** A short extra detail (what changed). */
  detail?: string | null
}

/** One line of plain text, cut to length: nothing a person typed can add lines or pad the log. */
const clip = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null
  const flat = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, ' ').trim()
  return flat ? flat.slice(0, max) : null
}

const idOf = (value: unknown): string | null =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string'
      ? (value as { id: string }).id
      : null

/** Who an account is, for the log: "system" when there's no signed-in account (a script). */
export const actorOf = (user: unknown) => {
  const u = user as { id?: unknown; email?: unknown; role?: unknown } | null | undefined
  if (!u || typeof u !== 'object') {
    return { actorId: null, actorEmail: null, actorRole: 'system' }
  }
  return {
    actorId: clip(u.id, 64),
    actorEmail: clip(u.email, 254),
    actorRole: u.role === 'super-admin' ? 'super-admin' : u.role === 'editor' ? 'editor' : 'system',
  }
}

export { idOf as auditIdOf }

/**
 * Saves one entry. Never throws and never joins the caller's database transaction, so a problem
 * with the log can't stop the action it describes (or leave that action's transaction broken);
 * the failure is logged and sent to Sentry instead.
 */
export const recordAudit = async (payload: Payload, entry: AuditEntry): Promise<void> => {
  try {
    await payload.create({
      collection: 'audit-log',
      data: {
        action: entry.action,
        ...actorOf(entry.actor),
        clubId: clip(entry.clubId, 64),
        clubName: clip(entry.clubName, 120),
        target: clip(entry.target, 200),
        detail: clip(entry.detail, 300),
      },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, `Audit log entry (${entry.action}) could not be saved`)
    if (sentryEnabled()) Sentry.captureMessage('Audit log entry could not be saved', 'error')
  }
}
