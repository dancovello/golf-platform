import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { sentryEnabled } from '@/monitoring/sentry'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Vercel's scheduler sends "Authorization: Bearer <CRON_SECRET>" (vercel.json). */
const fromScheduler = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const sent = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return sent.length === expected.length && timingSafeEqual(sent, expected)
}

/** Long enough for a sleeping database to wake up, short enough to report a hung one. */
const TIMEOUT_MS = 15_000

const FAILED_MESSAGE = 'Database check failed: club sites cannot reach the database'

/**
 * The hourly database check (docs/operations/monitoring.md). The uptime monitor only proves the
 * app answers; this proves the database does too, and emails through Sentry when it doesn't.
 * Hourly rather than with the 5-minute uptime check, so the database can still sleep when idle
 * (decided 9 Nov 2026: a 5-minute check would keep it awake, about £15 a month).
 * Without CRON_SECRET, or without the right one, it doesn't exist.
 */
export async function GET(request: Request) {
  if (!fromScheduler(request)) return new Response('Page not found', { status: 404 })
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const payload = await getPayload({ config })
    const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } })
      .drizzle
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('no answer in time')), TIMEOUT_MS)
    })
    await Promise.race([db.execute(sql`SELECT 1`), timeout]).finally(() => clearTimeout(timer))
  } catch (error) {
    // The reason goes to the server log only. Sentry gets one fixed message, so every failure
    // lands on the same issue rather than a new one per error wording.
    console.error(`${FAILED_MESSAGE} (${error instanceof Error ? error.message : 'unknown'})`)
    if (sentryEnabled()) {
      Sentry.captureMessage(FAILED_MESSAGE, 'fatal')
      await Sentry.flush(2000)
    }
    return Response.json({ ok: false }, { status: 500, headers })
  }
  return Response.json({ ok: true }, { headers })
}
