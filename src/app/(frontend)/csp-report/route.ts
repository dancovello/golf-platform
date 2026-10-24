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

/** Line breaks and other control characters out, length capped: a sender can't write extra
 * lines into the log or pad it (headers audit, finding 4). */
const clean = (value: string, max: number) =>
  value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, ' ').slice(0, max)

/** The policy's own directive names; anything else is logged as "unknown". */
const DIRECTIVES = new Set([
  'default-src',
  'script-src',
  'script-src-elem',
  'script-src-attr',
  'style-src',
  'style-src-elem',
  'style-src-attr',
  'img-src',
  'media-src',
  'font-src',
  'connect-src',
  'frame-src',
  'child-src',
  'worker-src',
  'manifest-src',
  'object-src',
  'base-uri',
  'form-action',
  'frame-ancestors',
  'report-uri',
  'report-to',
  'sandbox',
  'require-trusted-types-for',
  'trusted-types',
  'upgrade-insecure-requests',
])
const directiveOf = (value: unknown) => {
  // Older browsers send the whole rule ("script-src 'self' …"): keep its name.
  const name = typeof value === 'string' ? value.trim().split(/\s/)[0]?.toLowerCase() : ''
  return name && DIRECTIVES.has(name) ? name : 'unknown'
}

const pathOf = (value: unknown) => {
  if (typeof value !== 'string') return null
  try {
    return clean(new URL(value).pathname, 200)
  } catch {
    return null
  }
}

const originOf = (value: unknown) => {
  if (typeof value !== 'string') return null
  if (!value.includes('://')) return clean(value, 40) // e.g. "inline", "eval"
  try {
    return clean(new URL(value).origin, 200)
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
      directive: directiveOf(
        r['effective-directive'] ?? r.effectiveDirective ?? r['violated-directive'],
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
