import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isPlatformHost, normaliseHost } from './site/hosts'

/** Headers only this proxy sets (src/site/resolveSite.ts). Any a visitor sends are dropped. */
const CLUB_HOST = 'x-club-host'
const CLUB_ORIGIN = 'x-club-origin'

/** Paths that exist only on the platform's own address, never on a club's domain. */
const PLATFORM_ONLY = /^\/(admin|api|preview|sites|health|accounts-by-administrator)(\/|$)/

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
  // payload-totp needs the requested path to decide where to send someone mid-login
  // (set up or enter a code). Without it the admin redirects in a loop. Club sites use it too:
  // their "page not found" screen and the forward to a club's main address read it.
  headers.set('x-pathname', pathname)
  headers.set('x-search', search)

  // A club's own domain (build step 4): its pages are served from /sites/<host>/…, and the
  // admin, API and previews don't exist here.
  if (host && !isPlatformHost(host)) {
    if (PLATFORM_ONLY.test(pathname)) return notFound()
    headers.set(CLUB_HOST, host)
    headers.set(CLUB_ORIGIN, request.nextUrl.origin)
    const target = new URL(`/sites/${encodeURIComponent(host)}${pathname}${search}`, request.url)
    return NextResponse.rewrite(target, { request: { headers } })
  }

  // The platform's own address. /sites/… is only reachable through the rewrite above.
  if (/^\/sites(\/|$)/.test(pathname)) return notFound()

  // Payload's "create first user" screen can't be switched off in its config. Accounts are only
  // created by the platform script, so show an explanation instead. The account-creation hook
  // (src/access/accountCreation.ts) is the real protection; this only removes the misleading form.
  if (pathname === '/admin/create-first-user') {
    return NextResponse.rewrite(new URL('/accounts-by-administrator', request.url), {
      request: { headers },
    })
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Everything except Next.js's own files (scripts, styles, fonts, image resizing).
  matcher: ['/((?!_next/).*)'],
}
