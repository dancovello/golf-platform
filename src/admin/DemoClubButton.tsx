'use client'

import { Button } from '@payloadcms/ui'
import { useState } from 'react'

/** "Create demo club" above the Clubs list (staging only; see src/admin/DemoClubPanel.tsx). */
export const DemoClubButton = () => {
  const [state, setState] = useState<{ busy: boolean; message?: string; url?: string }>({
    busy: false,
  })
  const build = async () => {
    if (
      !window.confirm(
        'Build the demo club "Heathcote Golf Club"? If it already exists, it is deleted and built again from scratch. This takes a minute or two.',
      )
    ) {
      return
    }
    setState({ busy: true, message: 'Building the demo club… this takes a minute or two.' })
    try {
      const response = await fetch('/api/demo-club', { method: 'POST', credentials: 'include' })
      const body = (await response.json().catch(() => ({}))) as { message?: string; url?: string }
      setState({ busy: false, message: body.message ?? 'Something went wrong.', url: body.url })
    } catch {
      setState({ busy: false, message: 'The request failed. Check your connection and try again.' })
    }
  }
  return (
    <div style={{ marginBottom: '1rem' }}>
      <Button buttonStyle="secondary" disabled={state.busy} onClick={build}>
        {state.busy ? 'Building…' : 'Create demo club'}
      </Button>
      {state.message ? (
        <p role="status" style={{ marginTop: '0.5rem' }}>
          {state.message}{' '}
          {state.url ? (
            <a href={state.url} target="_blank" rel="noopener">
              Open the demo website
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
