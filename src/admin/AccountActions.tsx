'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

import { CopyableLink, type PasswordLink, postJSON } from './copyableLink'

/**
 * On a club editor's account page, for super-admins: make a new set-your-password link, or
 * reset their two-factor login (lost phone). The server checks permission for both.
 */
export const AccountActions = () => {
  const { id } = useDocumentInfo()
  const [link, setLink] = useState<PasswordLink | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!id) return null

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="account-actions" style={{ margin: '1.5rem 0' }}>
      <h3 id="account-actions">Account actions</h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button
          buttonStyle="secondary"
          disabled={busy}
          onClick={() =>
            run(async () => setLink(await postJSON<PasswordLink>(`/api/users/${id}/password-link`)))
          }
        >
          New set-your-password link
        </Button>
        <Button
          buttonStyle="secondary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (
                !window.confirm(
                  'Reset this editor’s two-factor login? They’ll sign in with their password only, and can set it up again from their account page.',
                )
              )
                return
              const res = await postJSON<{ message: string }>(`/api/users/${id}/reset-two-factor`)
              setMessage(res.message)
            })
          }
        >
          Reset two-factor login
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
      {link && <CopyableLink result={link} />}
    </section>
  )
}
