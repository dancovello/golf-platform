'use server'

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'

import { withinLimit } from '@/security/limitRequest'
import { HOMEPAGE_REQUEST_VISITOR_LIMIT } from '@/security/rateLimit'
import { CLUB_HOST_HEADER } from '@/site/resolveSite'

import { sendHomepageRequestEmails } from './alert'
import type { RequestState } from './state'
import { submitHomepageRequest } from './submit'

/**
 * The Homepage Request Form's button (React form action). Only the company website takes
 * requests: sent through a club's address (src/proxy.ts marks those), it's refused. The emails
 * go after the visitor has their answer, so a slow or failed email never holds up the form;
 * the request is already saved either way.
 */
export async function requestHomepage(prev: RequestState, form: FormData): Promise<RequestState> {
  const requestHeaders = await headers()
  if (requestHeaders.get(CLUB_HOST_HEADER)) notFound()
  const onSaved = (id: string) => after(() => sendHomepageRequestEmails(id).then(() => undefined))
  // At most 5 sends per visitor in 10 minutes, checked here rather than by page address: a
  // server action runs from any page address (as the Contact form, public forms audit 1).
  const visitorAllowed = () => withinLimit(HOMEPAGE_REQUEST_VISITOR_LIMIT, requestHeaders)
  return submitHomepageRequest(prev, form, new Date(), onSaved, { visitorAllowed })
}
