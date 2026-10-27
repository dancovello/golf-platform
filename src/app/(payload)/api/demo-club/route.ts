import config from '@payload-config'
import { getPayload } from 'payload'

import { isSuperAdminWithCode } from '@/auth/fullyAuthenticated'
import { buildDemoClub, DEMO_NAME } from '@/demo/demoClub'
import { fromAnotherSite } from '@/security/sameOrigin'
import { sitePreviewEnabled } from '@/site/preview'

// Building the demo club makes a few dozen pictures, so it can take a minute or two.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const reply = (message: string, status = 200, extra: Record<string, unknown> = {}) =>
  Response.json({ message, ...extra }, { status })

/**
 * POST /api/demo-club: builds (or rebuilds) the demo club (src/demo/demoClub.ts). Staging and
 * local only, never production, and only for a super-admin with their code entered. A route
 * of its own rather than a Payload endpoint, so it can run for longer than a normal request.
 * `?check=1` stops after the checks (used by the browser tests).
 */
export async function POST(request: Request) {
  if (!sitePreviewEnabled()) return reply('The demo club is only available on staging.', 404)
  // Only from the admin itself: a form on another site can't trigger it.
  if (fromAnotherSite(request)) return reply('You are not allowed to do this.', 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isSuperAdminWithCode(user)) {
    return reply('You are not allowed to do this.', 403)
  }
  if (new URL(request.url).searchParams.get('check') === '1') return reply('Allowed.')
  try {
    const result = await buildDemoClub(payload)
    return reply(`${DEMO_NAME} is ready, with ${result.pages} pages.`, 200, { url: result.url })
  } catch (error) {
    payload.logger.error({ err: error }, 'Building the demo club failed')
    return reply(`Building the demo club failed: ${(error as Error).message}`, 500)
  }
}
