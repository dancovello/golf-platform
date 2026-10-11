'use client'

import { Button, useAuth } from '@payloadcms/ui'

/** Shown above the Accounts list, for super-admins only. */
export const InviteEditorButton = () => {
  const { user } = useAuth()
  if ((user as { role?: string } | null)?.role !== 'super-admin') return null
  return (
    <div style={{ marginBottom: '1rem' }}>
      <Button el="link" url="/admin/invite-editor">
        Invite an editor
      </Button>
    </div>
  )
}
