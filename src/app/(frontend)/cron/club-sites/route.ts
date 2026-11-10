import config from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { checkClubSites } from '@/monitoring/clubSites'
import { sentryEnabled } from '@/monitoring/sentry'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Vercel's scheduler sends "Authorization: Bearer <CRON_SECRET>" (vercel.json). */
const fromScheduler = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const sent = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return sent.length === expected.length && timingSafeEqual(sent, expected)
}

/**
 * The hourly club address check (docs/operations/monitoring.md): fetches the home page of every
 * club that has its own web address and, for each one that doesn't answer, sends Sentry one
 * issue of its own ("Club site not answering: <address>"), which emails Dan. Sentry's free
 * plan has one uptime monitor (the production admin's), so this covers every club's own
 * address without another service. Production only: staging and previews have no club domains.
 * A club address is public, not personal. Without CRON_SECRET, or without the right one, it
 * doesn't exist.
 */
export async function GET(request: Request) {
  if (!fromScheduler(request)) return new Response('Page not found', { status: 404 })
  const headers = { 'Cache-Control': 'no-store' }
  if (process.env.VERCEL_ENV !== 'production') {
    return Response.json({ ok: true, skipped: 'not production' }, { headers })
  }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { 'domains.hostname': { exists: true } },
    select: { domains: true },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  // The club's main address (the first in its list; the others forward to it).
  const hosts = docs
    .map((club) => club.domains?.[0]?.hostname)
    .filter((host): host is string => Boolean(host))

  const { down, checked, notChecked } = await checkClubSites(hosts)

  for (const host of down) {
    const message = `Club site not answering: ${host}`
    console.error(message)
    if (sentryEnabled()) {
      // One issue per club, so each club's outage is its own email and its own history.
      Sentry.captureMessage(message, { level: 'error', fingerprint: ['club-site-down', host] })
    }
  }
  if (notChecked > 0) {
    // Out of time: say so, so a widespread outage never looks like a quiet hour.
    const message = `Club site check ran out of time: ${notChecked} of ${hosts.length} clubs not checked`
    console.error(message)
    if (sentryEnabled()) {
      Sentry.captureMessage(message, { level: 'error', fingerprint: ['club-site-check-late'] })
    }
  }
  if ((down.length > 0 || notChecked > 0) && sentryEnabled()) await Sentry.flush(2000)

  return Response.json(
    { ok: down.length === 0 && notChecked === 0, checked, down: down.length },
    { status: down.length === 0 && notChecked === 0 ? 200 : 500, headers },
  )
}
