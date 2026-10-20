/**
 * Cloudflare Turnstile: a free "are you a person?" check on the Contact form, usually
 * invisible (docs/architecture/decisions.md). On only when both keys are set:
 * - TURNSTILE_SITE_KEY: public, sent to the browser to draw the check;
 * - TURNSTILE_SECRET_KEY: secret, used here to ask Cloudflare whether a check was passed.
 * Without it, a script could fill one club's hourly message allowance and block real visitors.
 */
export const turnstileSiteKey = (): string | null =>
  process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY?.trim() || null : null

export const TURNSTILE_ACTION = 'contact'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileResult = 'ok' | 'failed' | 'unavailable'

/**
 * Asks Cloudflare whether this browser passed the check. Each answer from the browser works
 * once, for 5 minutes (the widget renews it while the page is open). The visitor's IP address
 * isn't sent: it's optional, and the platform keeps no visitor details.
 */
export const verifyTurnstile = async (token: unknown): Promise<TurnstileResult> => {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Staging and local: the check is optional. Production never takes messages without it:
    // a script could fill a club's hourly allowance and block real visitors.
    if (process.env.VERCEL_ENV !== 'production') return 'ok'
    console.error('Contact form refused a message: TURNSTILE_SECRET_KEY is not set on production')
    return 'unavailable'
  }
  if (typeof token !== 'string' || !token || token.length > 2048) return 'failed'
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return 'unavailable'
    const result = (await response.json()) as {
      success?: boolean
      action?: string
      metadata?: { result_with_testing_key?: boolean }
    }
    if (result.success !== true) return 'failed'
    // Cloudflare's test keys (which always pass) don't report the form. Fine for trying it out
    // on staging; never on production, where a test key would mean no real check at all.
    if (result.metadata?.result_with_testing_key === true) {
      return process.env.VERCEL_ENV === 'production' ? 'failed' : 'ok'
    }
    // The check must have been made for this form, not copied from another form or site.
    return result.action === TURNSTILE_ACTION ? 'ok' : 'failed'
  } catch {
    return 'unavailable'
  }
}
