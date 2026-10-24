import type { Payload } from 'payload'

import { emailEnabled } from '../email/adapter'

import { adminURL } from './resetEmail'

/**
 * Emails a club editor their "set your password" link, when the super-admin invites them or
 * makes them a new link (plan part C, 2026-10-20). The admin still shows the link to copy, in
 * case the email goes to spam.
 *
 * Only where email is set up (RESEND_API_KEY) and the admin's address is known (ADMIN_URL), so
 * the link in the email is always the admin's real address. Staging sends every email to
 * EMAIL_OVERRIDE_TO (src/email/adapter.ts), never to the person invited.
 */
export const passwordLinkEmailEnabled = () => emailEnabled() && adminURL() !== null

/** At most one of these emails per account every 15 minutes (a double click, or pressing the
 * button again, shouldn't send several). Counted per server instance, like the search limit:
 * only a signed-in super-admin can send them, so this is about tidiness, not abuse. */
export const LINK_EMAIL_INTERVAL_MS = 15 * 60 * 1000
const lastSent = new Map<string, number>()

/** Removes anything that could break an email header line. */
const oneLine = (value: string, max = 80) =>
  value
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, max)

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export type LinkEmail = {
  to: string
  clubName: string
  link: string
  expiresInHours: number
  /** A first invitation, or a new link for an existing editor. */
  kind: 'invite' | 'new-link'
}

export const linkEmailContent = ({ clubName, link, expiresInHours, kind }: LinkEmail) => {
  const club = oneLine(clubName, 60)
  const subject =
    kind === 'invite'
      ? `You're invited to edit the ${club} website`
      : `Your new link for the ${club} website`
  const opening =
    kind === 'invite'
      ? `You've been invited to edit the ${club} website.`
      : `Here's a new link to set your password for the ${club} website.`
  const steps = [
    `Choose a password (at least 12 characters).`,
    `Sign in with your email address and that password. For extra security you can also turn on two-factor login from your account page.`,
  ]
  const expiry = `The link works once, for ${expiresInHours} hours. If it runs out, ask for a new one.`
  const text = [
    opening,
    '',
    'Open this link to get started:',
    link,
    '',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    expiry,
    '',
    "If you weren't expecting this email, you can ignore it.",
  ].join('\n')
  const html = [
    `<p>${escape(opening)}</p>`,
    `<p><a href="${escape(link)}">Set your password</a></p>`,
    `<ol>${steps.map((s) => `<li>${escape(s)}</li>`).join('')}</ol>`,
    `<p>${escape(expiry)}</p>`,
    `<p>If you weren’t expecting this email, you can ignore it.</p>`,
  ].join('\n')
  return { subject, text, html }
}

export type LinkEmailResult = { emailed: boolean; emailNote: string | null }

/** Sends the email if it can, and says what happened in words the admin screen can show. */
export const sendLinkEmail = async (
  payload: Payload,
  email: LinkEmail,
  now = Date.now(),
): Promise<LinkEmailResult> => {
  if (!passwordLinkEmailEnabled()) {
    return { emailed: false, emailNote: null }
  }
  const key = email.to.toLowerCase()
  const previous = lastSent.get(key)
  if (previous !== undefined && now - previous < LINK_EMAIL_INTERVAL_MS) {
    return {
      emailed: false,
      emailNote:
        'A link was emailed to them in the last 15 minutes, so no email was sent this time.',
    }
  }
  const { subject, text, html } = linkEmailContent(email)
  try {
    await payload.sendEmail({ to: email.to, subject, text, html })
  } catch (error) {
    payload.logger.error({ err: error }, 'Set-your-password email failed')
    return { emailed: false, emailNote: "The email couldn't be sent." }
  }
  lastSent.set(key, now)
  return { emailed: true, emailNote: null }
}

/** For tests only: forget which emails were sent. */
export const resetLinkEmailLimit = () => lastSent.clear()
