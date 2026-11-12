'use client'

import { useState } from 'react'

import { VideoDialog } from './VideoDialog'
import type { VideoItem } from './VideoPlayer'

/**
 * Style A's "Watch the video" button. Nothing is requested from YouTube or Vimeo until it is
 * pressed; the video then plays in the same pop-up as the Video block (Esc or the cross closes
 * it and focus comes back here).
 */
export const TourVideoButton = ({ embedURL, title }: { embedURL: string; title: string }) => {
  const [open, setOpen] = useState(false)
  const item: VideoItem = {
    id: embedURL,
    title,
    caption: null,
    provider: embedURL.includes('vimeo') ? 'vimeo' : 'youtube',
    embedURL,
    poster: { src: '', srcSet: null, position: 'center' },
    width: null,
    height: null,
  }
  return (
    <>
      <button
        type="button"
        className="btn btn-accent t-label-button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Watch the video
      </button>
      <VideoDialog item={open ? item : null} onClose={() => setOpen(false)} />
    </>
  )
}
