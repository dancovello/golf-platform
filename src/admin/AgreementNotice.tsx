import Link from 'next/link'
import type { ServerProps } from 'payload'

import { editorTenantID } from '../access/roles'
import { clubHasAccepted } from '../agreement/acceptance'

/**
 * At the top of Club Settings for an editor whose club hasn't accepted the current data
 * processing agreement: settings can't be saved until it has (src/collections/ClubSettings.ts).
 */
export const AgreementNotice = async ({ payload, user }: ServerProps) => {
  const tenantID = editorTenantID(user)
  if (!tenantID || (await clubHasAccepted(payload, tenantID))) return null
  return (
    <div
      role="note"
      style={{
        margin: '0 0 1.5rem',
        padding: '1rem 1.25rem',
        border: '1px solid var(--theme-warning-500)',
        background: 'var(--theme-warning-100)',
        borderRadius: 4,
      }}
    >
      <strong>Your club needs to accept the data processing agreement.</strong> Until it does,
      changes here can’t be saved.{' '}
      <Link href="/admin/collections/agreement-acceptances/create">
        Read and accept the agreement
      </Link>
    </div>
  )
}
