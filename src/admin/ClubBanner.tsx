'use client'

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

/**
 * At the top of a club's page, news story, event and so on, for the super-admin only (editors
 * have one club): which club it's being added to or belongs to (Dan, 2026-10-17).
 */
export const ClubBanner = () => {
  const { options, selectedTenantID } = useTenantSelection()
  const { id } = useDocumentInfo()
  const tenant = useFormFields(([fields]) => fields.tenant?.value)
  const tenantID = typeof tenant === 'string' ? tenant : selectedTenantID
  const club = options.find((o) => String(o.value) === String(tenantID))?.label
  if (!club) return null
  return (
    <p className="club-banner">
      {id ? 'This belongs to ' : 'You’re adding this for '}
      <strong>{String(club)}</strong>.
    </p>
  )
}
