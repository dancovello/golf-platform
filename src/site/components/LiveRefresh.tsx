'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}

/** Inside the admin's live preview panel: reloads the page's content each time the page
 * being edited saves (pages autosave as you type) or Club Settings are saved. */
export const LiveRefresh = () => {
  const router = useRouter()
  // The site's own address, known only in the browser (nothing is drawn on the server).
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => null,
  )
  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
