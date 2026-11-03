'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { BlockHighlight } from './BlockHighlight'

const noSubscribe = () => () => {}

/** Inside the admin's live preview panel: reloads the page's content each time the page
 * being edited saves (pages autosave as you type) or Club Settings are saved, and points at the
 * block being edited (src/site/blockHighlight.ts). */
export const LiveRefresh = () => {
  const router = useRouter()
  // The site's own address, known only in the browser (nothing is drawn on the server).
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => null,
  )
  if (!origin) return null
  return (
    <>
      <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
      <BlockHighlight />
    </>
  )
}
