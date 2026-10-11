'use client'

import { Button } from '@payloadcms/ui'
import { useState } from 'react'

import { CopyableLink, type PasswordLink, postJSON } from './copyableLink'

export const InviteEditorForm = ({ clubs }: { clubs: { id: string; name: string }[] }) => {
  const [email, setEmail] = useState('')
  const [tenant, setTenant] = useState(clubs.length === 1 ? clubs[0].id : '')
  const [result, setResult] = useState<PasswordLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (clubs.length === 0) {
    return <p>Create a club first (Clubs → Create New), then invite its editors here.</p>
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          setResult(await postJSON<PasswordLink>('/api/users/invite', { email, tenant }))
        } catch (err) {
          setError((err as Error).message)
        } finally {
          setBusy(false)
        }
      }}
      style={{ maxWidth: '36rem', display: 'grid', gap: '1rem' }}
    >
      <div>
        <label htmlFor="invite-email">Editor’s email address</label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '0.5rem' }}
        />
      </div>
      <div>
        <label htmlFor="invite-club">Club</label>
        <select
          id="invite-club"
          required
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '0.5rem' }}
        >
          <option value="">Choose a club</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Inviting…' : 'Invite editor'}
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && <CopyableLink result={result} />}
    </form>
  )
}
