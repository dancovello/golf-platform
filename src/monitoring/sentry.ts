import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Error alerts (build step 6, decided stack: Sentry). Server-side only: an error in the website
 * or admin is reported to Sentry, which emails Dan. Nothing runs in visitors' browsers, so club
 * sites load no extra script and need no consent.
 *
 * Off unless SENTRY_DSN is set (Vercel production and staging). Personal details never leave:
 * no cookies, headers, form contents, query strings, accounts or IP addresses, and anything
 * that looks like an email address is blanked (scrubEvent).
 */
export const sentryEnabled = () => Boolean(process.env.SENTRY_DSN?.trim())

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const blank = (text: string | undefined) => text?.replace(EMAIL, '[email]')

/** Strips everything personal from an error report before it's sent. */
export const scrubEvent = (event: ErrorEvent): ErrorEvent => {
  if (event.request) {
    const url = event.request.url?.split('?')[0]
    event.request = { method: event.request.method, ...(url ? { url } : {}) }
  }
  delete event.user
  delete event.breadcrumbs
  delete event.extra
  event.message = blank(event.message)
  for (const exception of event.exception?.values ?? []) {
    exception.value = blank(exception.value)
  }
  return event
}

export const sentryOptions = () => ({
  dsn: process.env.SENTRY_DSN?.trim(),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  // Errors only: no performance tracing, no logs, no breadcrumbs of what happened before.
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
})
