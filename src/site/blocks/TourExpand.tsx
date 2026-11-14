'use client'

import { useRef, useState } from 'react'

import { Expand } from '../components/Icons'
import type { SiteMedia } from './media'
import { TourMedia } from './TourMedia'

/**
 * Style A's "expand" button on the header photo: opens the same full-size viewer as styles B and
 * C (photos with thumbnails, the hole plan, the video). Media is what visitors come to a hole
 * for, so the button is a clear white pill in the corner, away from the title and facts. A
 * native dialog: Esc or the cross closes it and focus comes back here.
 */
export const TourExpand = ({
  photos,
  plan,
  video,
  title,
  number,
}: {
  photos: SiteMedia[]
  plan: SiteMedia | null
  video: string | null
  title: string
  number: string
}) => {
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const total = photos.length + (plan ? 1 : 0) + (video ? 1 : 0)
  return (
    <>
      <button
        type="button"
        className="tour-expand-btn t-label-s"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
          dialog.current?.showModal()
        }}
      >
        <Expand size={20} />
        <span>
          Expand<span className="tour-expand-count"> · {total}</span>
          <span className="visually-hidden"> photos and video of {title}</span>
        </span>
      </button>
      <dialog
        ref={dialog}
        className="tour-media-dialog"
        aria-label={`Photos and video: ${title}`}
        onClose={() => setOpen(false)}
      >
        {open ? (
          <TourMedia
            standalone
            onClose={() => dialog.current?.close()}
            photos={photos}
            plan={plan}
            video={video}
            title={title}
            number={number}
            sizes="100vw"
          />
        ) : null}
      </dialog>
    </>
  )
}
