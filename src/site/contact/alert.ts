import config from '@payload-config'
import { getPayload } from 'payload'

import { enquiryPurposeLabel } from '@/collections/enquiryPurposes'
import { emailEnabled } from '@/email/adapter'
import { allowRequest, WEBSITE_FORM_EMAILS, CONTACT_ALERTS_PER_CLUB } from '@/security/rateLimit'

import { loadClubBySlug } from '../loadClub'

/** Keeps visitor-typed text out of email headers: one line, no angle brackets or quotes. */
const headerSafe = (value: string, max = 80) =>
  value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>"]/g, '')
    .trim()
    .slice(0, max)

const ukDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))

export type AlertResult = 'sent' | 'email-off' | 'no-inbox' | 'not-found' | 'daily-limit'

/**
 * Emails a new Contact page message to the club: to the inbox set for its topic in Club
 * Settings → Contact page, or the footer email if there isn't one. Replying answers the
 * visitor. Plain text only, so nothing the visitor typed can become a link or markup. Records
 * when it was sent on the enquiry; a failure is logged and the message is still in the admin.
 *
 * At most 25 alerts per club per day, and 70 website-form emails a day in all (WEBSITE_FORM_EMAILS), so one club's flood can't
 * use up the email allowance other clubs' alerts and everyone's password resets share (public
 * forms audit, finding 2). Past that the message is saved, with "Emailed to the club" blank.
 */
export const sendEnquiryAlert = async (enquiryID: string): Promise<AlertResult> => {
  if (!emailEnabled()) return 'email-off'
  const payload = await getPayload({ config })
  const enquiry = await payload
    .findByID({ collection: 'enquiries', id: enquiryID, depth: 0, overrideAccess: true })
    .catch(() => null)
  const tenantID =
    enquiry?.tenant && typeof enquiry.tenant === 'object' ? enquiry.tenant.id : enquiry?.tenant
  if (!enquiry || !tenantID) return 'not-found'

  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { id: { equals: tenantID } },
    select: { slug: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const club = tenants[0] ? await loadClubBySlug(String(tenants[0].slug)) : null
  if (!club) return 'not-found'
  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenantID } },
    select: { contact: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const routes = (docs[0]?.contact?.purposes ?? []) as { purpose?: string; inbox?: string | null }[]
  const to = routes.find((r) => r.purpose === enquiry.purpose)?.inbox?.trim() || club.footer.email
  if (!to) {
    payload.logger.warn(`Enquiry ${enquiry.reference}: no inbox or footer email to send it to`)
    return 'no-inbox'
  }

  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  if (
    !(await allowRequest(db, CONTACT_ALERTS_PER_CLUB, `club:${tenantID}`)) ||
    !(await allowRequest(db, WEBSITE_FORM_EMAILS, 'all'))
  ) {
    payload.logger.warn(
      `Enquiry ${enquiry.reference}: not emailed, the daily alert limit is reached (it's in the admin)`,
    )
    return 'daily-limit'
  }

  const about = enquiryPurposeLabel(enquiry.purpose)
  const firstName = enquiry.name.trim().split(/\s+/)[0]
  const lines = [
    `New message from the Contact page on your website.`,
    '',
    `About: ${about}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : null,
    enquiry.membershipType ? `Membership type: ${enquiry.membershipType}` : null,
    enquiry.preferredDate ? `Date: ${ukDate(enquiry.preferredDate)}` : null,
    enquiry.groupSize ? `Number of people: ${enquiry.groupSize}` : null,
    enquiry.newsletter ? 'Would like the club newsletter: yes' : null,
    '',
    'Message:',
    enquiry.message,
    '',
    `Reference: ${enquiry.reference}`,
    '',
    `Reply to this email to answer ${firstName} directly. The message is also in your website's editing tools under Enquiries, where you can mark it handled.`,
  ].filter((line): line is string => line !== null)

  try {
    await payload.sendEmail({
      from: `${headerSafe(club.name, 60)} website <${payload.email.defaultFromAddress}>`,
      to,
      replyTo: enquiry.email,
      subject: `New enquiry: ${about} from ${headerSafe(enquiry.name)} (${enquiry.reference})`,
      text: lines.join('\n'),
    })
  } catch (error) {
    payload.logger.error({ err: error }, `Enquiry ${enquiry.reference}: alert email failed`)
    throw error
  }
  await payload.update({
    collection: 'enquiries',
    id: enquiry.id,
    data: { alertSentAt: new Date().toISOString() },
    overrideAccess: true,
  })
  return 'sent'
}
