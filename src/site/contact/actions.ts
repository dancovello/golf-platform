'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { notFound } from 'next/navigation'

import { withinLimit } from '@/security/limitRequest'
import { CONTACT_VISITOR_LIMIT } from '@/security/rateLimit'

import { sitePreviewEnabled } from '../preview'
import { CLUB_HOST_HEADER, siteFromDomain } from '../resolveSite'
import { sendEnquiryAlert } from './alert'
import type { ContactState } from './state'
import { submitEnquiry } from './submit'

/**
 * The Contact form's Send button (React form action). On a club's own domain the club comes
 * from the address the form was sent to (src/proxy.ts), never from the form. On the staging
 * preview the page binds the club's short name; submitEnquiry looks the club up again.
 */
export async function sendEnquiry(
  clubSlug: string,
  prev: ContactState,
  form: FormData,
): Promise<ContactState> {
  const requestHeaders = await headers()
  const host = requestHeaders.get(CLUB_HOST_HEADER)
  let club: string | { slug: string; base: string }
  if (host) {
    const site = await siteFromDomain(host)
    if (!site) notFound()
    club = { slug: site.club.slug, base: site.base }
  } else {
    if (!sitePreviewEnabled() || typeof clubSlug !== 'string') notFound()
    club = clubSlug
  }
  // The club's email alert goes after the visitor has their answer, so a slow or failed
  // email never holds up or breaks the form (the message is already saved either way).
  const onSaved = (id: string) => after(() => sendEnquiryAlert(id).then(() => undefined))
  // At most 5 sends per visitor in 10 minutes, so one visitor can't use up the club's hourly
  // allowance (public forms audit, finding 1). Checked here rather than by the address the form
  // was posted to: a server action runs from any page address.
  const visitorAllowed = () => withinLimit(CONTACT_VISITOR_LIMIT, requestHeaders)
  return (
    (await submitEnquiry(club, prev, form, new Date(), onSaved, { visitorAllowed })) ?? notFound()
  )
}
