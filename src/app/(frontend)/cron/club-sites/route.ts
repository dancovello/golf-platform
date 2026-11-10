import config from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { sentryEnabled } from '@/monitoring/sentry'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Vercel's scheduler sends "Authorization: Bearer <CRON_SECRET>" (vercel.json). */
const fromScheduler = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const sent = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return sent.length === expected.length && timingSafeEqual(sent, expected)
}

const TIMEOUT_MS = 10_000
const AT_A_TIME = 5

/** Whether the club's home page loads (any redirect followed). */
const answers = async (host: string) => {
  try {
    const response = await fetch(`https://${host}/`, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'A1-Engine-site-check' },
    })
    return response.ok
  } catch {
    return false
  }
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

  const down: string[] = []
  for (let i = 0; i < hosts.length; i += AT_A_TIME) {
    const batch = hosts.slice(i, i + AT_A_TIME)
    const results = await Promise.all(batch.map(answers))
    batch.forEach((host, k) => {
      if (!results[k]) down.push(host)
    })
  }

  for (const host of down) {
    const message = `Club site not answering: ${host}`
    console.error(message)
    if (sentryEnabled()) {
      // One issue per club, so each club's outage is its own email and its own history.
      Sentry.captureMessage(message, { level: 'error', fingerprint: ['club-site-down', host] })
    }
  }
  if (down.length > 0 && sentryEnabled()) await Sentry.flush(2000)

  return Response.json(
    { ok: down.length === 0, checked: hosts.length, down: down.length },
    { status: down.length === 0 ? 200 : 500, headers },
  )
}
