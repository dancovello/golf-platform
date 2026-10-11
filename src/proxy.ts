import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Payload's "create first user" screen can't be switched off in its config. Accounts are only
// created by the platform script, so show an explanation instead. The account-creation hook
// (src/access/accountCreation.ts) is the real protection; this only removes the misleading form.
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL('/accounts-by-administrator', request.url))
}

export const config = {
  matcher: ['/admin/create-first-user'],
}
