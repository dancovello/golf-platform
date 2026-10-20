import * as Sentry from '@sentry/nextjs'

import { sentryEnabled, sentryOptions } from './monitoring/sentry'

/** Runs once when the server starts (Next.js instrumentation). Starts error alerts if
 * SENTRY_DSN is set (src/monitoring/sentry.ts). */
export async function register() {
  if (sentryEnabled()) Sentry.init(sentryOptions())
}

/** Every error while rendering a page or answering a request is reported (when enabled). */
export const onRequestError: typeof Sentry.captureRequestError = (...args) =>
  sentryEnabled() ? Sentry.captureRequestError(...args) : undefined
