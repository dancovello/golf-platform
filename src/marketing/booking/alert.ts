import config from '@payload-config'
import { getPayload } from 'payload'

import { BRAND } from '@/brand'
import { emailEnabled } from '@/email/adapter'
import {
  allowRequest,
  DEMO_BOOKINGS_EMAILED_PER_DAY,
  WEBSITE_FORM_EMAILS,
} from '@/security/rateLimit'

import { longDay } from './calendar'

/** Keeps typed text out of email headers: one line, no angle brackets or quotes. */
const headerSafe = (value: string, max = 80) =>
  value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>"]/g, '')
    .trim()
    .slice(0, max)

export type BookingEmailResult = {
  alert: 'sent' | 'email-off' | 'no-inbox' | 'not-found' | 'failed' | 'daily-limit'
  confirmation: 'sent' | 'skipped' | 'failed'
}

/**
 * After a demo booking is saved: emails it to the company inbox (Company website → Settings →
 * Requests) and sends the visitor a confirmation with the video link. Plain text only, so
 * nothing typed can become a link or markup. The visitor's confirmation is sent only after the
 * alert has gone, and both count towards the daily allowances (this form's own, and the
 * allowance the website forms share), so the form can't use up the emails password resets need.
 * Past either limit the booking is saved, with its "sent" dates left blank. A failure is logged
 * and the booking is still in the admin.
 */
export const sendDemoBookingEmails = async (id: string): Promise<BookingEmailResult> => {
  const result: BookingEmailResult = { alert: 'email-off', confirmation: 'skipped' }
  if (!emailEnabled()) return result
  const payload = await getPayload({ config })
  const booking = await payload
    .findByID({ collection: 'demo-bookings', id, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!booking) return { ...result, alert: 'not-found' }
  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  if (!(await allowRequest(db, DEMO_BOOKINGS_EMAILED_PER_DAY, 'all'))) {
    payload.logger.warn(`Demo booking ${booking.id}: not emailed, the daily limit is reached`)
    return { ...result, alert: 'daily-limit' }
  }
  const settings = await payload.findGlobal({
    slug: 'marketing-settings',
    depth: 0,
    overrideAccess: true,
  })
  const inbox = settings.requests?.inbox?.trim() || null
  const link = settings.demoCalls?.videoLink?.trim() || null
  const from = `${headerSafe(BRAND.name, 60)} <${payload.email.defaultFromAddress}>`
  const when = `${longDay(booking.date)} at ${booking.time} (UK time)`
  const send = async (to: string, subject: string, lines: string[], replyTo?: string) => {
    if (!(await allowRequest(db, WEBSITE_FORM_EMAILS, 'all'))) {
      payload.logger.warn(`Demo booking ${booking.id}: email not sent, daily email limit reached`)
      return 'daily-limit' as const
    }
    await payload.sendEmail({ from, to, replyTo, subject, text: lines.join('\n') })
    return 'sent' as const
  }

  if (!inbox) {
    result.alert = 'no-inbox'
    payload.logger.warn(
      `Demo booking ${booking.id}: no inbox set in Company website → Settings → Requests`,
    )
  } else {
    try {
      result.alert = await send(
        inbox,
        `Demo booked: ${headerSafe(booking.club)}, ${booking.date} ${booking.time}`,
        [
          'A club has booked a demo call.',
          '',
          `When: ${when}`,
          `Name: ${booking.name}`,
          `Role: ${booking.role || 'not given'}`,
          `Club: ${booking.club}`,
          `Email: ${booking.email}`,
          '',
          'Reply to this email to answer them directly. The booking is also in the admin under Company website → Demo bookings, where you can cancel it to free the time.',
        ],
        booking.email,
      )
      if (result.alert === 'sent') {
        await payload.update({
          collection: 'demo-bookings',
          id: booking.id,
          data: { alertSentAt: new Date().toISOString() },
          overrideAccess: true,
        })
      }
    } catch (error) {
      result.alert = 'failed'
      payload.logger.error({ err: error }, `Demo booking ${booking.id}: alert email failed`)
    }
  }

  try {
    const sent = await send(
      booking.email,
      `Your ${BRAND.name} demo is booked: ${longDay(booking.date)} at ${booking.time}`,
      [
        `Hi ${headerSafe(booking.name.split(' ')[0] ?? booking.name, 40)},`,
        '',
        `Your demo is booked for ${when}.`,
        '',
        link
          ? `Join the video call here: ${link}`
          : 'We’ll send the video call link before the call.',
        '',
        'Feel free to bring anyone from your committee. If the time no longer suits, reply to this email and we’ll find another.',
        '',
        `${BRAND.name}`,
      ],
      inbox ?? undefined,
    )
    result.confirmation = sent === 'sent' ? 'sent' : 'skipped'
    if (sent === 'sent') {
      await payload.update({
        collection: 'demo-bookings',
        id: booking.id,
        data: { confirmationSentAt: new Date().toISOString() },
        overrideAccess: true,
      })
    }
  } catch (error) {
    result.confirmation = 'failed'
    payload.logger.error({ err: error }, `Demo booking ${booking.id}: confirmation email failed`)
  }
  return result
}
