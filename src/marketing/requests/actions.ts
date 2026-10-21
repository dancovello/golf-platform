'use server'

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'

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
  if ((await headers()).get(CLUB_HOST_HEADER)) notFound()
  const onSaved = (id: string) => after(() => sendHomepageRequestEmails(id).then(() => undefined))
  return submitHomepageRequest(prev, form, new Date(), onSaved)
}
