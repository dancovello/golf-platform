'use server'

import { after } from 'next/server'
import { notFound } from 'next/navigation'

import { sitePreviewEnabled } from '../preview'
import { sendEnquiryAlert } from './alert'
import type { ContactState } from './state'
import { submitEnquiry } from './submit'

/** The Contact form's Send button (React form action). Bound to the club's short name by the
 * page; submitEnquiry looks the club up again, so a changed name only reaches that club. */
export async function sendEnquiry(
  clubSlug: string,
  prev: ContactState,
  form: FormData,
): Promise<ContactState> {
  if (!sitePreviewEnabled() || typeof clubSlug !== 'string') notFound()
  // The club's email alert goes after the visitor has their answer, so a slow or failed
  // email never holds up or breaks the form (the message is already saved either way).
  const onSaved = (id: string) => after(() => sendEnquiryAlert(id).then(() => undefined))
  return (await submitEnquiry(clubSlug, prev, form, new Date(), onSaved)) ?? notFound()
}
