import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

/** /admin/setup-totp used to be the authenticator-app set-up screen. There is nothing to set up
 * any more (decisions.md, 3 Nov), so an old bookmark or link just goes to the admin. */
export const EmailCodeSetupRedirect = ({ initPageResult }: AdminViewServerProps) => {
  const { routes, serverURL } = initPageResult.req.payload.config
  redirect(formatAdminURL({ adminRoute: routes.admin, path: '/', serverURL }))
}
