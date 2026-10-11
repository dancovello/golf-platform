'use client'

import { Button } from '@payloadcms/ui'
import { useState } from 'react'

export type PasswordLink = { link: string; email: string; expiresInHours: number }

/** Shows a "set your password" link with a copy button and plain-English instructions. */
export const CopyableLink = ({ result }: { result: PasswordLink }) => {
  const [copied, setCopied] = useState(false)
  return (
    <div role="status" style={{ marginTop: '1.5rem' }}>
      <p>
        Send this link to <strong>{result.email}</strong>. It works once, for{' '}
        {result.expiresInHours} hours. They&rsquo;ll choose a password, then set up two-factor
        login.
      </p>
      <label htmlFor="password-link">Set-your-password link</label>
      <input
        id="password-link"
        readOnly
        value={result.link}
        onFocus={(e) => e.currentTarget.select()}
        style={{ width: '100%', padding: '0.5rem', margin: '0.5rem 0', fontFamily: 'monospace' }}
      />
      <Button
        buttonStyle="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(result.link)
          setCopied(true)
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  )
}

/** POSTs to one of our account endpoints and returns the JSON, or throws the server's message. */
export const postJSON = async <T,>(url: string, body?: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(json?.errors?.[0]?.message ?? json?.message ?? 'Something went wrong.')
  }
  return json as T
}
