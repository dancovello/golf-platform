import * as Sentry from '@sentry/nextjs'

import { sentryEnabled } from '@/monitoring/sentry'
import { withinLimit } from '@/security/limitRequest'
import { CSP_REPORT_LIMIT } from '@/security/rateLimit'

export const dynamic = 'force-dynamic'

/**
 * Where browsers report anything the content security policy blocked, or (for the admin, while
 * it's report-only) would have blocked (src/security/csp.ts). Each report is written to the
 * server log, and to Sentry when it's set up, so the admin can be switched to enforced once the
 * reports are clean.
 *
 * Only the page's path and the blocked item's origin are kept: no query strings, nothing about
 * the visitor. At most 60 reports a minute from everyone together, counted across every server
 * (src/security/rateLimit.ts), so it can't be used to flood the logs.
 */

const pathOf = (value: unknown) => {
  if (typeof value !== 'string') return null
  try {
    return new URL(value).pathname
  } catch {
    return null
  }
}

const originOf = (value: unknown) => {
  if (typeof value !== 'string') return null
  if (!value.includes('://')) return value.slice(0, 40) // e.g. "inline", "eval"
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

type Report = Record<string, unknown>

/** Both formats browsers send: the older {"csp-report": {...}} and the newer list of reports. */
const reportsIn = (body: unknown): Report[] => {
  if (Array.isArray(body)) {
    return body
      .map((r) => (r as { body?: Report })?.body)
      .filter((r): r is Report => Boolean(r && typeof r === 'object'))
  }
  const one = (body as { 'csp-report'?: Report } | null)?.['csp-report']
  return one && typeof one === 'object' ? [one] : []
}

export async function POST(request: Request) {
  // A database problem drops the report rather than failing: reports are only for the log.
  const allowed = await withinLimit(CSP_REPORT_LIMIT, request.headers, { visitor: 'all' }).catch(
    () => false,
  )
  if (!allowed) return new Response(null, { status: 204 })

  const text = (await request.text().catch(() => '')).slice(0, 10_000)
  let body: unknown = null
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 204 })
  }

  for (const r of reportsIn(body).slice(0, 5)) {
    const summary = {
      page: pathOf(r['document-uri'] ?? r.documentURL),
      directive: String(
        r['effective-directive'] ?? r.effectiveDirective ?? r['violated-directive'] ?? '',
      ),
      blocked: originOf(r['blocked-uri'] ?? r.blockedURL),
      reportOnly: (r.disposition ?? '') === 'report',
    }
    const line = `Security policy ${summary.reportOnly ? 'would block' : 'blocked'} ${summary.blocked ?? 'something'} (${summary.directive}) on ${summary.page ?? 'a page'}`
    console.warn(line)
    if (sentryEnabled()) Sentry.captureMessage(line, { level: 'warning', extra: summary })
  }
  return new Response(null, { status: 204 })
}
