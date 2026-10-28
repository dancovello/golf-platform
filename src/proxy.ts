import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  buildPolicy,
  newNonce,
  policyHeaderName,
  type PolicyKind,
  REPORT_PATH,
} from './security/csp'
import { isMarketingHost, isPlatformHost, marketingHosts, normaliseHost } from './site/hosts'

/** Headers only this proxy sets (src/site/resolveSite.ts). Any a visitor sends are dropped. */
const CLUB_HOST = 'x-club-host'
const CLUB_ORIGIN = 'x-club-origin'

/** Paths that exist only on the platform's own address, never on a club's domain. */
const PLATFORM_ONLY = /^\/(admin|api|preview|sites|health|accounts-by-administrator)(\/|$)/

/**
 * The company's marketing site is served from /marketing/… (src/app/(marketing)), reached only
 * through the rewrites below. On the platform's own address, these paths stay the platform's;
 * everything else is the marketing site.
 */
const MARKETING = '/marketing'
const PLATFORM_PATHS =
  /^\/(admin|api|preview|health|accounts-by-administrator|cron|csp-report|robots\.txt|_vercel|__nextjs[\w-]*)(\/|$)/
const INTERNAL_ONLY = /^\/(sites|marketing)(\/|$)/
/** Marketing review pages (super-admin only): on the platform's own address, never the company's. */
const REVIEW = /^\/dev(\/|$)/

/** Search engines may index the marketing site only on the company's domain, on production. */
const NOINDEX = 'noindex'

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

/**
 * Every page on the platform's own address (the admin and its previews alike): a website that
 * opens one in a new window keeps no handle on it (headers audit, finding 5). The previews get
 * it too, so the live preview's pop-out window can still talk to the admin that opened it.
 */
const isolateWindow = (response: NextResponse) => {
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  return response
}

const notFound = () =>
  new NextResponse('Page not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  })

/** The same request on another address (keeps http and the port locally). */
const onHost = (request: NextRequest, host: string) => {
  const url = request.nextUrl.clone()
  url.hostname = host
  return NextResponse.redirect(url, 308)
}

/** Show the marketing site page for this path, with its own policy. */
const marketing = (
  request: NextRequest,
  headers: Headers,
  pathname: string,
  search: string,
  indexable: boolean,
) => {
  const withPolicy = addPolicy('marketing', headers)
  const target = new URL(`${MARKETING}${pathname === '/' ? '' : pathname}${search}`, request.url)
  const response = withPolicy(NextResponse.rewrite(target, { request: { headers } }))
  if (!indexable) response.headers.set('X-Robots-Tag', NOINDEX)
  return response
}

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

  // The company's own domain: only the marketing site. The admin lives on its own address
  // (ADMIN_URL), so editors' logins never share an address with the public pages.
  if (host && isMarketingHost(host)) {
    const [main] = marketingHosts()
    if (host !== main) return onHost(request, main)
    if (PLATFORM_ONLY.test(pathname) || INTERNAL_ONLY.test(pathname) || REVIEW.test(pathname)) {
      return notFound()
    }
    if (pathname === REPORT_PATH) return NextResponse.next({ request: { headers } })
    return marketing(request, headers, pathname, search, process.env.VERCEL_ENV === 'production')
  }

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

  // The platform's own address. /sites/… and /marketing/… are only reachable through the
  // rewrites.
  if (INTERNAL_ONLY.test(pathname)) return notFound()

  // Anything that isn't the admin, API, previews or a platform service is the marketing site:
  // forwarded to the company's domain once it exists, otherwise shown here (staging and
  // previews), never indexed.
  // The marketing review pages (/dev/…, super-admin only) stay here, where the admin's login is.
  if (REVIEW.test(pathname)) return marketing(request, headers, pathname, search, false)

  if (!PLATFORM_PATHS.test(pathname)) {
    const [main] = marketingHosts()
    if (main) return onHost(request, main)
    return marketing(request, headers, pathname, search, false)
  }

  // Payload's "create first user" screen can't be switched off in its config. Accounts are only
  // created by the platform script, so show an explanation instead. The account-creation hook
  // (src/access/accountCreation.ts) is the real protection; this only removes the misleading form.
  if (pathname === '/admin/create-first-user') {
    const withPolicy = addPolicy('admin', headers)
    return isolateWindow(
      withPolicy(
        NextResponse.rewrite(new URL('/accounts-by-administrator', request.url), {
          request: { headers },
        }),
      ),
    )
  }

  // Club pages on the staging preview (and the admin's live preview): enforced. The admin:
  // report-only for now (src/security/csp.ts). Everything else here (the API, /health,
  // /accounts-by-administrator): the enforced platform policy (headers audit, finding 3).
  // Vercel's and Next.js's own development paths keep the basic policy from next.config.ts.
  const kind: PolicyKind | null = /^\/preview(\/|$)/.test(pathname)
    ? 'site'
    : /^\/admin(\/|$)/.test(pathname)
      ? 'admin'
      : /^\/(_vercel|__nextjs[\w-]*)(\/|$)/.test(pathname)
        ? null
        : 'platform'
  if (!kind) return NextResponse.next({ request: { headers } })
  const withPolicy = addPolicy(kind, headers)
  return isolateWindow(withPolicy(NextResponse.next({ request: { headers } })))
}

export const config = {
  // Everything except Next.js's own files (scripts, styles, fonts, image resizing).
  matcher: ['/((?!_next/).*)'],
}
