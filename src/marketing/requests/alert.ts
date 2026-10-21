import config from '@payload-config'
import { getPayload } from 'payload'

import { BRAND } from '@/brand'
import { emailEnabled } from '@/email/adapter'

import { formatDueDate } from './workingDays'

/** Keeps typed text out of email headers: one line, no angle brackets or quotes. */
const headerSafe = (value: string, max = 80) =>
  value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>"]/g, '')
    .trim()
    .slice(0, max)

export type RequestEmailResult = {
  alert: 'sent' | 'email-off' | 'no-inbox' | 'not-found' | 'failed'
  confirmation: 'sent' | 'email-off' | 'not-found' | 'failed'
}

/**
 * After a homepage request is saved: emails it to the company inbox (Company website →
 * Settings → Requests), then sends the club a plain confirmation with the promised date.
 * Plain text only, so nothing typed can become a link or markup. The confirmation leaves out
 * the website the club typed, so the form can't be used to send links to strangers. Each
 * email that goes is stamped on the request; a failure is logged and the request is still in
 * the admin.
 */
export const sendHomepageRequestEmails = async (id: string): Promise<RequestEmailResult> => {
  if (!emailEnabled()) return { alert: 'email-off', confirmation: 'email-off' }
  const payload = await getPayload({ config })
  const request = await payload
    .findByID({ collection: 'homepage-requests', id, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!request) return { alert: 'not-found', confirmation: 'not-found' }
  const settings = await payload.findGlobal({
    slug: 'marketing-settings',
    depth: 0,
    overrideAccess: true,
  })
  const inbox = settings.requests?.inbox?.trim() || null
  const from = `${headerSafe(BRAND.name, 60)} <${payload.email.defaultFromAddress}>`
  const due = formatDueDate(new Date(request.dueBy))
  const club = headerSafe(request.clubName)
  const result: RequestEmailResult = { alert: 'no-inbox', confirmation: 'failed' }

  if (inbox) {
    try {
      await payload.sendEmail({
        from,
        to: inbox,
        replyTo: request.email,
        subject: `Homepage request: ${club} (due ${due})`,
        text: [
          'A club has asked for its free homepage (Switching page).',
          '',
          `Club: ${request.clubName}`,
          `Current website: ${request.website}`,
          `Email: ${request.email}`,
          `Promised by: ${due}`,
          '',
          'Reply to this email to answer them directly. The request is also in the admin under Company website → Homepage requests.',
        ].join('\n'),
      })
      result.alert = 'sent'
      await payload.update({
        collection: 'homepage-requests',
        id: request.id,
        data: { alertSentAt: new Date().toISOString() },
        overrideAccess: true,
      })
    } catch (error) {
      result.alert = 'failed'
      payload.logger.error({ err: error }, `Homepage request ${request.id}: alert email failed`)
    }
  } else {
    payload.logger.warn(
      `Homepage request ${request.id}: no inbox set in Company website → Settings → Requests`,
    )
  }

  try {
    await payload.sendEmail({
      from,
      to: request.email,
      ...(inbox ? { replyTo: inbox } : {}),
      subject: 'Your free homepage is on its way',
      text: [
        'Hello,',
        '',
        `Thanks for asking us to rebuild ${club}’s homepage. We’ll email it to you by ${due}.`,
        '',
        'We build it from your current site. Nothing on your live site changes, and there’s nothing else you need to do.',
        '',
        'If you didn’t ask for this, you can ignore this email.',
        '',
        BRAND.name,
      ].join('\n'),
    })
    result.confirmation = 'sent'
    await payload.update({
      collection: 'homepage-requests',
      id: request.id,
      data: { confirmationSentAt: new Date().toISOString() },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, `Homepage request ${request.id}: confirmation failed`)
  }
  return result
}
