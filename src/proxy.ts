import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Payload's "create first user" screen can't be switched off in its config. Accounts are only
  // created by the platform script, so show an explanation instead. The account-creation hook
  // (src/access/accountCreation.ts) is the real protection; this only removes the misleading form.
  if (pathname === '/admin/create-first-user') {
    return NextResponse.rewrite(new URL('/accounts-by-administrator', request.url))
  }

  // payload-totp needs the requested path to decide where to send someone mid-login
  // (set up or enter a code). Without it the admin redirects in a loop.
  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/admin/:path*'],
}
