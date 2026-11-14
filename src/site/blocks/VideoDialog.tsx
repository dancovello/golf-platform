'use client'

import { useEffect, useRef, useState } from 'react'

import { Close } from '../components/Icons'
import { type VideoItem, VideoFrame } from './VideoPlayer'

/**
 * The pop-up window that plays a video (a native dialog: focus stays inside, Esc, the cross or
 * a press outside closes it, and focus goes back to the picture that opened it). The page
 * behind cannot scroll while it is open, and a spinner shows until the player has loaded so
 * the window never looks empty or glitchy. Closing it stops the video.
 */
export const VideoDialog = ({ item, onClose }: { item: VideoItem | null; onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = dialog.current
    if (!item || !el) return
    // An uploaded file has no frame to wait for.
    setLoaded(Boolean(item.fileURL))
    if (!el.open) el.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [item])

  return (
    <dialog
      ref={dialog}
      className="vd-dialog"
      aria-label={item?.title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close()
      }}
    >
      {item ? (
        <div className="vd-dialog-body">
          <div className="vd-dialog-head">
            <p className="t-label-m vd-dialog-title">{item.title}</p>
            <button
              type="button"
              className="vd-dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
            >
              <Close />
            </button>
          </div>
          <div className={`vd-dialog-frame${loaded ? ' is-loaded' : ''}`}>
            {loaded ? null : (
              <span className="vd-loader" role="status" aria-label="Loading video" />
            )}
            <VideoFrame item={item} onLoad={() => setLoaded(true)} />
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
