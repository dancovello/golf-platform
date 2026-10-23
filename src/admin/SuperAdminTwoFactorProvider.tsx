import { formatAdminURL } from '@payloadcms/ui/shared'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ComponentProps, ReactNode } from 'react'
import { TOTPProvider } from 'payload-totp/rsc'

import { isSuperAdmin } from '../access/roles'
import { SuperAdminSetupRedirect } from './SuperAdminSetupRedirect'

type Props = ComponentProps<typeof TOTPProvider>

const trim = (path: string) => path.replace(/\/+$/, '') || '/'

/**
 * payload-totp's admin wrapper, with one rule added (src/auth/superAdminTwoFactor.ts): a
 * super-admin who hasn't set two-factor up is sent to the set-up screen before anything else.
 * Club editors may use a password only, so the plugin itself no longer forces set-up. Checked
 * here on page loads, and in the browser (SuperAdminSetupRedirect) right after logging in.
 */
export const SuperAdminTwoFactorProvider = async (props: Props) => {
  const { payload, user, children } = props as Props & {
    payload: { config: { routes: { admin: string }; serverURL: string } }
    user?: { hasTotp?: boolean } | null
    children?: ReactNode
  }
  const setupUrl = formatAdminURL({ adminRoute: payload.config.routes.admin, path: '/setup-totp' })
  if (user && isSuperAdmin(user) && !user.hasTotp) {
    const pathname = (await headers()).get('x-pathname') ?? '/'
    if (trim(pathname) !== trim(setupUrl)) {
      redirect(`${payload.config.serverURL}${setupUrl}?back=${encodeURIComponent(pathname)}`)
    }
  }
  return (
    <TOTPProvider {...props}>
      <SuperAdminSetupRedirect setupUrl={setupUrl}>{children}</SuperAdminSetupRedirect>
    </TOTPProvider>
  )
}
