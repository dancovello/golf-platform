import config from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { probeAsCanaryA } from '@/canary/probe'
import { canaryTargets } from '@/canary/targets'
import { sentryEnabled } from '@/monitoring/sentry'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const fromScheduler = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const sent = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return sent.length === expected.length && timingSafeEqual(sent, expected)
}

/**
 * The hourly live isolation canary (docs/operations/canary.md). Doesn't exist without Vercel's
 * scheduler secret, or until the canary account is set up (CANARY_EDITOR_EMAIL and
 * CANARY_EDITOR_PASSWORD). Any attempt that reaches canary club B raises a Sentry alert.
 */
export async function GET(request: Request) {
  const email = process.env.CANARY_EDITOR_EMAIL
  const password = process.env.CANARY_EDITOR_PASSWORD
  if (!fromScheduler(request) || !email || !password) {
    return new Response('Page not found', { status: 404 })
  }
  const payload = await getPayload({ config })
  const targets = await canaryTargets(payload)
  const report = async (message: string, level: 'fatal' | 'error') => {
    payload.logger.error(message)
    if (sentryEnabled()) {
      Sentry.captureMessage(message, level)
      await Sentry.flush(2000)
    }
  }
  if (!targets) {
    await report('Isolation canary: canary club B not found, so nothing was checked', 'error')
    return Response.json({ ok: false, reason: 'not set up' }, { status: 500 })
  }
  // Only ever sign in at the admin's own configured address, never one taken from the request.
  const origin = process.env.ADMIN_URL
  if (!origin) {
    await report('Isolation canary: ADMIN_URL is not set, so nothing was checked', 'error')
    return Response.json({ ok: false, reason: 'not set up' }, { status: 500 })
  }
  try {
    const leaks = await probeAsCanaryA({
      baseURL: origin,
      email,
      password,
      targets,
      bypass: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    })
    if (leaks.length > 0) {
      await report(`ISOLATION CANARY: club A reached club B: ${leaks.join('; ')}`, 'fatal')
      return Response.json({ ok: false, leaks: leaks.length }, { status: 500 })
    }
    return Response.json({ ok: true, checked: targets.records.length })
  } catch (error) {
    await report(`Isolation canary couldn't run: ${(error as Error).message}`, 'error')
    return Response.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
