import config from '@payload-config'
import { getPayload } from 'payload'

import { enquiryPurposeLabel } from '@/collections/enquiryPurposes'

import { isExternal, siteHref } from '../components/links'
import { loadClubBySlug } from '../loadClub'
import { checkFormToken, issueFormToken } from './formToken'
import { DEFAULT_REPLIER, loadContactSettings, type ContactSettings } from './load'
import { newReference } from './reference'
import { formatReplyDate, replyByDate, ukToday } from './replyBy'
import type { ContactState, SentSummary } from './state'
import {
  type ContactValues,
  EMPTY_VALUES,
  fieldsFor,
  validateContact,
  valuesFromForm,
} from './validate'
import { siteBase } from '../preview'

/** Most messages one club takes in an hour, so a flood of junk can't bury real ones. */
export const HOURLY_LIMIT = 20

const EXPIRED = 'This form has been open a long time. Please press Send message again.'
const BUSY =
  'We’re receiving a lot of messages right now. Please try again later, or phone or email us instead.'

const excerptOf = (message: string) => {
  const flat = message.trim().replace(/\s+/g, ' ')
  return flat.length > 140 ? `${flat.slice(0, 139).trimEnd()}…` : flat
}

const summary = (
  v: ContactValues,
  settings: ContactSettings,
  reference: string,
  sentAt: Date,
  base: string,
): SentSummary => {
  const route = settings.routes[v.purpose]
  const next = route?.next
  return {
    firstName: v.name.trim().split(/\s+/)[0] ?? '',
    replier: route?.replier ?? DEFAULT_REPLIER,
    email: v.email.trim(),
    replyBy: formatReplyDate(replyByDate(sentAt, settings.replyDays)),
    reference,
    purposeLabel: enquiryPurposeLabel(v.purpose),
    excerpt: excerptOf(v.message),
    next: next
      ? { label: next.label, href: siteHref(base, next.link), external: isExternal(next.link) }
      : null,
  }
}

/**
 * Handles one press of Send message on a club's Contact page and saves the message under that
 * club's Enquiries. The club comes from the page address, never from the form. Spam checks,
 * none of which store anything about the visitor:
 * - a hidden "website" box only bots fill in;
 * - the signed time check (formToken.ts): too quick to be a person, or long expired;
 * - at most HOURLY_LIMIT messages per club per hour.
 * Bots caught by the first two are shown the normal "sent" screen, so they learn nothing.
 * Returns null for a club that doesn't exist. `onSaved` gets the new enquiry's ID (the page
 * emails the club with it, after replying to the visitor).
 */
export const submitEnquiry = async (
  clubSlug: string,
  prev: Pick<ContactState, 'attempt'>,
  form: FormData,
  now = new Date(),
  onSaved?: (enquiryID: string) => void,
): Promise<ContactState | null> => {
  const club = await loadClubBySlug(clubSlug)
  if (!club) return null
  const settings = await loadContactSettings(club.tenantID)
  const base = siteBase(club.slug)
  const attempt = prev.attempt + 1
  const values = valuesFromForm(form)
  const fresh = issueFormToken(club.tenantID, now.getTime())
  const keep = (extra: Partial<ContactState>): ContactState => ({
    attempt,
    token: fresh,
    values,
    errors: {},
    formError: null,
    sent: null,
    ...extra,
  })
  const pretendSent = () =>
    keep({
      values: EMPTY_VALUES,
      sent: summary(values, settings, newReference(club.name), now, base),
    })

  const honeypot = form.get('website')
  if (typeof honeypot === 'string' && honeypot.trim()) return pretendSent()
  const time = checkFormToken(form.get('token'), club.tenantID, now.getTime())
  if (time === 'too-fast') return pretendSent()
  if (time !== 'ok') return keep({ formError: EXPIRED })

  const errors = validateContact(values, {
    membershipTypes: settings.membershipTypes,
    today: ukToday(now),
  })
  if (Object.keys(errors).length > 0) return keep({ errors })

  const payload = await getPayload({ config })
  const { totalDocs: lastHour } = await payload.count({
    collection: 'enquiries',
    where: {
      and: [
        { tenant: { equals: club.tenantID } },
        { createdAt: { greater_than: new Date(now.getTime() - 3_600_000).toISOString() } },
      ],
    },
    overrideAccess: true,
  })
  if (lastHour >= HOURLY_LIMIT) return keep({ formError: BUSY })

  // Only the fields this topic shows are saved.
  const shown = new Set(fieldsFor(values.purpose))
  const optional = (field: 'phone' | 'membershipType' | 'preferredDate' | 'groupSize') =>
    shown.has(field) && values[field].trim() ? values[field].trim() : null
  const reference = await unusedReference(club.tenantID, club.name)
  const saved = await payload.create({
    collection: 'enquiries',
    data: {
      tenant: club.tenantID,
      reference,
      purpose: values.purpose,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: optional('phone'),
      membershipType: optional('membershipType'),
      preferredDate: optional('preferredDate')
        ? new Date(`${optional('preferredDate')}T12:00:00Z`).toISOString()
        : null,
      groupSize: optional('groupSize') ? Number(optional('groupSize')) : null,
      message: values.message.trim(),
      newsletter: Boolean(club.privacy.newsletterProvider) && values.newsletter,
      status: 'new',
    },
    overrideAccess: true,
  })
  onSaved?.(String(saved.id))
  return keep({ values: EMPTY_VALUES, sent: summary(values, settings, reference, now, base) })
}

/** A reference not already used in this club (checked within the club only). */
const unusedReference = async (tenantID: string, clubName: string) => {
  const payload = await getPayload({ config })
  for (let i = 0; i < 6; i++) {
    const reference = newReference(clubName, i < 3 ? 4 : 6)
    const { totalDocs } = await payload.count({
      collection: 'enquiries',
      where: { and: [{ tenant: { equals: tenantID } }, { reference: { equals: reference } }] },
      overrideAccess: true,
    })
    if (totalDocs === 0) return reference
  }
  return newReference(clubName, 8)
}
