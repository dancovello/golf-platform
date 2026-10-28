import config from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { sentryEnabled } from '@/monitoring/sentry'

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
  const job = await payload.jobs.queue({ task: 'cleanUp', input: {} })
  const result = await payload.jobs.runByID({ id: job.id })
  const status = result.jobStatus?.[String(job.id)]?.status
  if (status !== 'success') {
    // The job queue catches the error and keeps the job for a retry. Say so, so the failure
    // shows in Vercel's cron log and in Sentry (audit CRON-2): the privacy policy's 12-month
    // promise depends on this running.
    const message = `Nightly clean-up failed (${status ?? 'did not run'}); it will retry tomorrow night`
    payload.logger.error(message)
    if (sentryEnabled()) {
      Sentry.captureMessage(message, 'error')
      await Sentry.flush(2000)
    }
    return Response.json({ ok: false }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
