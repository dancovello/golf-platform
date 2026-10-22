'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * "Add the Figma pages" above the marketing Pages list: adds the pages from the Figma copy as
 * drafts (src/marketing/starter/pages.ts). Pages that already exist are left alone.
 */
export const StarterPagesButton = () => {
  const router = useRouter()
  const [state, setState] = useState<{ busy: boolean; message?: string }>({ busy: false })
  const add = async () => {
    setState({ busy: true, message: 'Adding the pages…' })
    try {
      const response = await fetch('/api/marketing-starter', {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      setState({ busy: false, message: body.message ?? 'Something went wrong.' })
      router.refresh()
    } catch {
      setState({ busy: false, message: 'The request failed. Check your connection and try again.' })
    }
  }
  return (
    <div style={{ marginBottom: '1rem' }}>
      <Button buttonStyle="secondary" disabled={state.busy} onClick={add}>
        {state.busy ? 'Adding…' : 'Add the Figma pages (as drafts)'}
      </Button>
      {state.message ? (
        <p role="status" style={{ marginTop: '0.5rem' }}>
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
