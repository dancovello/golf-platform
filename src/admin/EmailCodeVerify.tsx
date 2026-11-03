import { MinimalTemplate } from '@payloadcms/next/templates'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import { hasEnteredCode } from '../auth/fullyAuthenticated'

import { EmailCodeForm } from './EmailCodeForm'

/** "d•••@googlemail.com": enough to recognise the inbox, not enough to learn the address. */
export const maskEmail = (email: string): string => {
  const [name = '', domain = ''] = email.split('@')
  return `${name.slice(0, 1)}•••@${domain}`
}

/**
 * /admin/verify-totp: the second step of signing in. The password has been accepted; the person
 * asks for a code, we email it, they type it in (src/auth/emailCodeEndpoints.ts). Replaces
 * payload-totp's authenticator-app screen at the same address, because its redirects point here.
 */
export const EmailCodeVerify = ({ initPageResult, searchParams }: AdminViewServerProps) => {
  const { req } = initPageResult
  const { routes, serverURL } = req.payload.config
  const user = req.user as { email?: string; hasTotp?: boolean } | null

  if (!user) redirect(formatAdminURL({ adminRoute: routes.admin, path: '/login', serverURL }))
  // Nothing to enter: no second step for this account, or the code is already in.
  if (!user.hasTotp || hasEnteredCode(req.user)) {
    redirect(formatAdminURL({ adminRoute: routes.admin, path: '/', serverURL }))
  }

  const back = typeof searchParams?.back === 'string' ? searchParams.back : undefined
  return (
    <MinimalTemplate>
      <div style={{ maxWidth: '28rem', margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Check your email</h1>
        <EmailCodeForm
          adminRoute={routes.admin}
          apiRoute={routes.api}
          back={back}
          maskedEmail={maskEmail(user.email ?? '')}
          serverURL={serverURL}
        />
      </div>
    </MinimalTemplate>
  )
}
