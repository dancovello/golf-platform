import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  buildPolicy,
  newNonce,
  policyHeaderName,
  type PolicyKind,
  REPORT_PATH,
} from './security/csp'
import { isPlatformHost, normaliseHost } from './site/hosts'

/** Headers only this proxy sets (src/site/resolveSite.ts). Any a visitor sends are dropped. */
const CLUB_HOST = 'x-club-host'
const CLUB_ORIGIN = 'x-club-origin'

/** Paths that exist only on the platform's own address, never on a club's domain. */
const PLATFORM_ONLY = /^\/(admin|api|preview|sites|health|accounts-by-administrator)(\/|$)/

/**
 * A fresh one-time code and the content security policy for this page view (src/security/csp.ts).
 * Next.js reads the policy from the request to stamp the code on its own scripts; pages read
 * `x-nonce` for theirs (the header-fit script). Returns what to put on the response.
 */
const addPolicy = (kind: PolicyKind, headers: Headers) => {
  const nonce = newNonce()
  const name = policyHeaderName(kind)
  const value = buildPolicy(kind, nonce)
  headers.set('x-nonce', nonce)
  headers.set(name, value)
  return (response: NextResponse) => {
    response.headers.set(name, value)
    return response
  }
}

const notFound = () =>
  new NextResponse('Page not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  })

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = normaliseHost(request.headers.get('host') ?? '')

  const headers = new Headers(request.headers)
  headers.delete(CLUB_HOST)
  headers.delete(CLUB_ORIGIN)
  // Only this proxy decides the policy and the code: a visitor sending their own would
  // otherwise choose which scripts run.
  headers.delete('x-nonce')
  headers.delete('content-security-policy')
  headers.delete('content-security-policy-report-only')
  // payload-totp needs the requested path to decide where to send someone mid-login
  // (set up or enter a code). Without it the admin redirects in a loop. Club sites use it too:
  // their "page not found" screen and the forward to a club's main address read it.
  headers.set('x-pathname', pathname)
  headers.set('x-search', search)

  // A club's own domain (build step 4): its pages are served from /sites/<host>/…, and the
  // admin, API and previews don't exist here.
  if (host && !isPlatformHost(host)) {
    if (PLATFORM_ONLY.test(pathname)) return notFound()
    // Browsers report blocked items to the address they're on; the report address is shared.
    if (pathname === REPORT_PATH) return NextResponse.next({ request: { headers } })
    headers.set(CLUB_HOST, host)
    headers.set(CLUB_ORIGIN, request.nextUrl.origin)
    const withPolicy = addPolicy('site', headers)
    const target = new URL(`/sites/${encodeURIComponent(host)}${pathname}${search}`, request.url)
    return withPolicy(NextResponse.rewrite(target, { request: { headers } }))
  }

  // The platform's own address. /sites/… is only reachable through the rewrite above.
  if (/^\/sites(\/|$)/.test(pathname)) return notFound()

  // Payload's "create first user" screen can't be switched off in its config. Accounts are only
  // created by the platform script, so show an explanation instead. The account-creation hook
  // (src/access/accountCreation.ts) is the real protection; this only removes the misleading form.
  if (pathname === '/admin/create-first-user') {
    const withPolicy = addPolicy('admin', headers)
    return withPolicy(
      NextResponse.rewrite(new URL('/accounts-by-administrator', request.url), {
        request: { headers },
      }),
    )
  }

  // Club pages on the staging preview (and the admin's live preview): enforced. The admin:
  // report-only for now (src/security/csp.ts). Other addresses (API, /health) keep the basic
  // policy from next.config.ts.
  const kind: PolicyKind | null = /^\/preview(\/|$)/.test(pathname)
    ? 'site'
    : /^\/admin(\/|$)/.test(pathname)
      ? 'admin'
      : null
  if (!kind) return NextResponse.next({ request: { headers } })
  const withPolicy = addPolicy(kind, headers)
  return withPolicy(NextResponse.next({ request: { headers } }))
}

export const config = {
  // Everything except Next.js's own files (scripts, styles, fonts, image resizing).
  matcher: ['/((?!_next/).*)'],
}
