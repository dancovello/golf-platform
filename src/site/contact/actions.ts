'use server'

import { notFound } from 'next/navigation'

import { sitePreviewEnabled } from '../preview'
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
  return (await submitEnquiry(clubSlug, prev, form)) ?? notFound()
}
