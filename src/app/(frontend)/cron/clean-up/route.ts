import config from '@payload-config'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'
// Deleting a year's worth of old enquiries and checking storage can take a little while.
export const maxDuration = 60

/** Vercel's scheduler sends "Authorization: Bearer <CRON_SECRET>" (vercel.json). */
const fromScheduler = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const sent = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return sent.length === expected.length && timingSafeEqual(sent, expected)
}

/**
 * The nightly clean-up (src/privacy/cleanUp.ts), queued and run through the Payload job queue.
 * Without CRON_SECRET, or without the right one, it doesn't exist.
 */
export async function GET(request: Request) {
  if (!fromScheduler(request)) return new Response('Page not found', { status: 404 })
  const payload = await getPayload({ config })
  await payload.jobs.queue({ task: 'cleanUp', input: {} })
  await payload.jobs.run({ limit: 1 })
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
