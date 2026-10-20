'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { notFound } from 'next/navigation'

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
  const host = (await headers()).get(CLUB_HOST_HEADER)
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
  return (await submitEnquiry(club, prev, form, new Date(), onSaved)) ?? notFound()
}
