'use client'

import { useAuth } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

const trim = (path: string) => path.replace(/\/+$/, '') || '/'

/**
 * The in-browser half of SuperAdminTwoFactorProvider. Payload moves from the login screen to the
 * dashboard without reloading the page, so the server-side check doesn't run then: this sends a
 * super-admin without two-factor to the set-up screen as soon as they're signed in.
 */
export const SuperAdminSetupRedirect = ({
  children,
  setupUrl,
}: {
  children?: ReactNode
  setupUrl: string
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const mustSetUp =
    (user as { role?: string; hasTotp?: boolean } | null)?.role === 'super-admin' &&
    !(user as { hasTotp?: boolean } | null)?.hasTotp
  useEffect(() => {
    if (mustSetUp && trim(pathname) !== trim(setupUrl)) {
      router.push(`${setupUrl}?back=${encodeURIComponent(pathname)}`)
    }
  }, [mustSetUp, pathname, router, setupUrl])
  return children
}
