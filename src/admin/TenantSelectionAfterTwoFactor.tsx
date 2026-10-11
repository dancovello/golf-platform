import { TenantSelectionProvider } from '@payloadcms/plugin-multi-tenant/rsc'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof TenantSelectionProvider>

/**
 * The multi-tenant plugin's admin wrapper looks up the user's clubs on every admin page,
 * including the two-factor code screen. Until the code is entered payload-totp (correctly)
 * refuses that lookup, and the failure sent people back to the login page. Until then we give
 * the original wrapper no user, so it shows no clubs and fetches nothing; afterwards it gets
 * the real user and behaves exactly as before.
 */
export const TenantSelectionAfterTwoFactor = (props: Props) => {
  const codeEntered = (props.user as { _strategy?: string } | null)?._strategy === 'totp'
  // The plugin types `user` as always present, but its lookup returns no clubs when it is null.
  return <TenantSelectionProvider {...props} user={codeEntered ? props.user : (null as never)} />
}
