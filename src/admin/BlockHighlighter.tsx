'use client'

import { useLivePreviewContext } from '@payloadcms/ui'
import { useEffect } from 'react'

import { HIGHLIGHT_MESSAGE, type HighlightMessage } from '@/site/blockHighlight'

import { blockIndexOf } from './blockRow'

/** Takes no space on the page. While the live preview is open, tells it which block is being
 * worked on, so it can scroll to that block and outline it (src/site/blockHighlight.ts). */
export const BlockHighlighter = () => {
  const { iframeRef } = useLivePreviewContext()

  useEffect(() => {
    const tell = (index: number | null) => {
      const message: HighlightMessage = { type: HIGHLIGHT_MESSAGE, index }
      iframeRef.current?.contentWindow?.postMessage(message, window.location.origin)
    }
    // Focusing a field or button in a block, or clicking its header (some browsers don't
    // focus a button on click), points at that block. Typing in another field, such as the
    // page title, clears the outline; clicking elsewhere (Save, the menu) leaves it.
    const onFocus = (e: FocusEvent) => {
      const index = blockIndexOf(e.target)
      if (index !== null) return tell(index)
      if (e.target instanceof Element && e.target.matches('input, textarea, select')) tell(null)
    }
    const onClick = (e: MouseEvent) => {
      const index = blockIndexOf(e.target)
      if (index !== null) tell(index)
    }
    document.addEventListener('focusin', onFocus)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('click', onClick)
    }
  }, [iframeRef])

  return null
}
