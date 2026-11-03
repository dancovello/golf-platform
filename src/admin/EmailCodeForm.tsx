'use client'

import { Button, toast } from '@payloadcms/ui'
import { useState } from 'react'

/** Where to go once the code is accepted: the page they were heading for, but only if it is
 * inside this site's admin. `back` comes from the address bar, so anyone can put one in a link
 * (a `javascript:` or another site's address must never be followed). */
export const safeBackURL = (adminRoute: string, back: string | undefined, origin: string) => {
  const adminRoot = new URL(adminRoute, origin).href
  if (!back) return adminRoot
  try {
    const url = new URL(back, origin)
    const inside = url.pathname === adminRoute || url.pathname.startsWith(`${adminRoute}/`)
    const plain = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
    return url.origin === origin && plain && inside ? url.href : adminRoot
  } catch {
    return adminRoot
  }
}

type Reply = { ok: boolean; message?: string }

const post = async (url: string, body?: unknown): Promise<Reply> => {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  try {
    return (await res.json()) as Reply
  } catch {
    return { ok: false, message: 'Something went wrong. Try again.' }
  }
}

export const EmailCodeForm = ({
  adminRoute,
  apiRoute,
  back,
  maskedEmail,
  serverURL,
}: {
  adminRoute: string
  apiRoute: string
  back?: string
  maskedEmail: string
  serverURL: string
}) => {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    const reply = await post(`${serverURL}${apiRoute}/send-email-code`)
    setBusy(false)
    if (reply.ok) {
      setSent(true)
      toast.success('Code sent')
    } else {
      setError(reply.message ?? 'Something went wrong. Try again.')
    }
  }

  const check = async () => {
    setBusy(true)
    setError(null)
    const reply = await post(`${serverURL}${apiRoute}/verify-totp`, { token: code })
    if (reply.ok) {
      // A full page load, so the server sees the new cookie.
      window.location.replace(safeBackURL(adminRoute, back, window.location.origin))
      return
    }
    setBusy(false)
    setError(reply.message ?? 'Something went wrong. Try again.')
  }

  if (!sent) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <p style={{ margin: 0 }}>
          To finish signing in, we’ll email a 6-digit code to <strong>{maskedEmail}</strong>.
        </p>
        <Button onClick={send} disabled={busy}>
          {busy ? 'Sending…' : 'Email me a code'}
        </Button>
        <button
          type="button"
          onClick={() => setSent(true)}
          disabled={busy}
          style={{ background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer' }}
        >
          I already have a code
        </button>
        {error ? (
          <p role="alert" style={{ margin: 0, color: 'var(--theme-error-500)' }}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void check()
      }}
      style={{ display: 'grid', gap: '1rem' }}
    >
      <p style={{ margin: 0 }}>
        We’ve emailed a code to <strong>{maskedEmail}</strong>. It works once and lasts 10 minutes.
      </p>
      <div>
        <label htmlFor="email-code">6-digit code</label>
        <input
          id="email-code"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.5rem',
            fontSize: '1.5rem',
            letterSpacing: '0.4em',
            textAlign: 'center',
          }}
        />
      </div>
      <Button type="submit" disabled={busy || code.length !== 6}>
        {busy ? 'Checking…' : 'Sign in'}
      </Button>
      <button
        type="button"
        onClick={send}
        disabled={busy}
        style={{ background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer' }}
      >
        Send a new code
      </button>
      {error ? (
        <p role="alert" style={{ margin: 0, color: 'var(--theme-error-500)' }}>
          {error}
        </p>
      ) : null}
    </form>
  )
}
