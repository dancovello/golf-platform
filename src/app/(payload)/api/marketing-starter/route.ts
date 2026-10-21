import config from '@payload-config'
import { getPayload } from 'payload'

import { isSuperAdmin } from '@/access/roles'
import { addStarterPages } from '@/marketing/starter/pages'

export const dynamic = 'force-dynamic'

const reply = (message: string, status = 200, extra: Record<string, unknown> = {}) =>
  Response.json({ message, ...extra }, { status })

/**
 * POST /api/marketing-starter: adds the marketing pages from the Figma copy as drafts
 * (src/marketing/starter/pages.ts), skipping any address already used. Only for the
 * super-admin with their code entered, and only from the admin itself.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return reply('You are not allowed to do this.', 403)
  }
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const signedIn = user as (typeof user & { _strategy?: string }) | null
  if (!signedIn || !isSuperAdmin(signedIn) || signedIn._strategy !== 'totp') {
    return reply('You are not allowed to do this.', 403)
  }
  const { added, skipped } = await addStarterPages(payload)
  const parts = [
    added.length ? `Added as drafts: ${added.join(', ')}.` : null,
    skipped.length ? `Already there, left alone: ${skipped.join(', ')}.` : null,
  ].filter(Boolean)
  return reply(parts.join(' ') || 'Nothing to add.', 200, { added, skipped })
}
