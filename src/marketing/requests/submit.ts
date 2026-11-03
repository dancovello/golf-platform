import config from '@payload-config'
import { getPayload } from 'payload'

import { allowRequest, HOMEPAGE_REQUESTS_PER_HOUR } from '@/security/rateLimit'
import { checkFormToken, issueFormToken } from '@/site/contact/formToken'
import { verifyTurnstile } from '@/site/contact/turnstile'

import type { RequestState } from './state'
import { EMPTY_REQUEST, cleanWebsite, requestFromForm, validateRequest } from './validate'

/** The form's signed time check is scoped to this form, so a club form's token won't do. */
export const REQUEST_FORM_SCOPE = 'marketing-homepage-request'

/** Cloudflare's "are you a person?" check is made for this form only. */
export const REQUEST_TURNSTILE_ACTION = 'homepage'

/** Most requests the site takes in an hour, so a flood of junk can't bury real ones. */
export const HOURLY_LIMIT = 20

const EXPIRED = 'This form has been open a long time. Please press the button again.'
const NOT_CHECKED = 'We couldn’t confirm this came from a person. Please press the button again.'
const CHECK_UNAVAILABLE =
  'We couldn’t send your request just now. Please try again in a minute, or email us instead.'
const BUSY = 'We’re receiving a lot of requests right now. Please try again later, or email us.'

export const newRequestToken = (now = Date.now()) => issueFormToken(REQUEST_FORM_SCOPE, now)

export const initialRequestState = (now = Date.now()): RequestState => ({
  attempt: 0,
  token: newRequestToken(now),
  values: EMPTY_REQUEST,
  errors: {},
  formError: null,
  sent: null,
})

/**
 * Handles one press of the Homepage Request Form's button and saves the request. Spam checks,
 * the same as the club Contact form's (src/site/contact/submit.ts), none storing anything
 * about the visitor beyond what they typed:
 * - a hidden "website" box only bots fill in;
 * - the signed time check (after the fields are checked): too quick to be a person, or long
 *   expired;
 * - Cloudflare's "are you a person?" check, when switched on;
 * - at most 5 sends per visitor in 10 minutes (`visitorAllowed`, from the page's request);
 * - at most HOURLY_LIMIT requests an hour, counted in one step (no overshoot).
 * Bots caught by the first two see the normal "thanks" screen, so they learn nothing.
 * `onSaved` gets the new request's ID (the action emails it after answering the visitor).
 */
export const submitHomepageRequest = async (
  prev: Pick<RequestState, 'attempt'>,
  form: FormData,
  now = new Date(),
  onSaved?: (id: string) => void,
  { visitorAllowed }: { visitorAllowed?: () => Promise<boolean> } = {},
): Promise<RequestState> => {
  const attempt = prev.attempt + 1
  const values = requestFromForm(form)
  let nextToken = newRequestToken(now.getTime())
  const keep = (extra: Partial<RequestState>): RequestState => ({
    attempt,
    token: nextToken,
    values,
    errors: {},
    formError: null,
    sent: null,
    ...extra,
  })
  const sent = () => keep({ values: EMPTY_REQUEST, sent: { email: values.email.trim() } })

  const honeypot = form.get('website')
  if (typeof honeypot === 'string' && honeypot.trim()) return sent()
  // The fields first: someone pressing the button straight away on an empty form is told what
  // to fill in, not taken for a bot. Bots fill every field, so the time check still sees them.
  const time = checkFormToken(form.get('token'), REQUEST_FORM_SCOPE, now.getTime())
  // Kept while it checks out, so someone fixing a typo isn't taken for a bot.
  if (time === 'ok' || time === 'too-fast') nextToken = String(form.get('token'))
  const errors = validateRequest(values)
  if (Object.keys(errors).length > 0) return keep({ errors })
  if (time === 'too-fast') return sent()
  if (time !== 'ok') return keep({ formError: EXPIRED })

  // Checked after the fields: an answer works only once, so a form sent back for fixing keeps
  // it for the next try. If Cloudflare can't be reached nothing is saved.
  const person = await verifyTurnstile(form.get('turnstile'), REQUEST_TURNSTILE_ACTION)
  if (person === 'failed') return keep({ formError: NOT_CHECKED })
  if (person === 'unavailable') return keep({ formError: CHECK_UNAVAILABLE })

  if (visitorAllowed && !(await visitorAllowed())) return keep({ formError: BUSY })

  const payload = await getPayload({ config })
  // Counted and checked in one database step, so requests sent at the same moment can't all
  // see room for one more.
  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  if (!(await allowRequest(db, HOMEPAGE_REQUESTS_PER_HOUR, 'all', now))) {
    return keep({ formError: BUSY })
  }
  const { totalDocs: lastHour } = await payload.count({
    collection: 'homepage-requests',
    where: { createdAt: { greater_than: new Date(now.getTime() - 3_600_000).toISOString() } },
    overrideAccess: true,
  })
  if (lastHour >= HOURLY_LIMIT) return keep({ formError: BUSY })

  const saved = await payload.create({
    collection: 'homepage-requests',
    data: {
      status: 'new',
      clubName: values.clubName.trim(),
      website: cleanWebsite(values.website) ?? values.website.trim(),
      email: values.email.trim(),
    },
    overrideAccess: true,
  })
  onSaved?.(String(saved.id))
  return sent()
}
