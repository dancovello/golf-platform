'use client'

import { type ReactNode, useRef, useState } from 'react'

import { Close, Play } from '../components/Icons'
import { holeFigures, pad2, TeeYards } from './holeParts'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'

/** The hole's name for screen readers and headings: "Hole 7, The Dell". */
export const holeLabel = (hole: SiteHole) =>
  `Hole ${hole.number}${hole.name ? `, ${hole.name}` : ''}`

/**
 * The hole's video, if it has one. Shows the hole's photo with a play button and loads the
 * YouTube or Vimeo player only when the visitor presses play (the same privacy rule as the
 * Video block). It lives inside the pop-up, so closing the pop-up removes it and stops it.
 */
const HoleVideo = ({ hole, embedURL }: { hole: SiteHole; embedURL: string }) => {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <iframe
        className="hole-dialog-iframe"
        src={embedURL}
        title={`Video: ${holeLabel(hole)}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    )
  }
  return (
    <button
      type="button"
      className="hole-dialog-poster"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${holeLabel(hole)}`}
    >
      {hole.image ? (
        <Photo image={hole.image} sizes="(max-width: 767px) 100vw, 480px" alt="" />
      ) : null}
      <span className="vd-play" aria-hidden="true">
        <Play size={24} />
      </span>
    </button>
  )
}

/**
 * One pop-up for every hole of a block (a native dialog: focus stays inside, Esc, the cross or a
 * press outside closes it, and focus goes back to the card). Shows the hole's photo, or its
 * video when it has one, with its figures, playing tip and every tee's yards. Used by all three
 * hole-by-hole styles. Returns `show` (to open a hole) and `dialog` (to put in the page).
 */
export const useHoleDialog = (
  tees: SiteTee[],
): { show: (hole: SiteHole) => void; dialog: ReactNode } => {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<SiteHole | null>(null)

  const show = (hole: SiteHole) => {
    setOpen(hole)
    ref.current?.showModal()
  }

  const dialog = (
    <dialog
      ref={ref}
      className="hole-dialog"
      aria-label={open ? holeLabel(open) : undefined}
      onClose={() => setOpen(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close()
      }}
    >
      {open ? (
        <div className={`hole-dialog-body${open.image || open.video ? '' : ' is-no-photo'}`}>
          {open.video ? (
            <div className="hole-dialog-image is-video">
              <HoleVideo hole={open} embedURL={open.video} />
            </div>
          ) : open.image ? (
            <div className="hole-dialog-image">
              <Photo image={open.image} sizes="(max-width: 767px) 100vw, 480px" alt="" />
            </div>
          ) : null}
          <div className="hole-dialog-text">
            <p className="t-data-label hole-number">Hole No. {pad2(open.number)}</p>
            <h3 className="t-heading-l">{open.name ?? `Hole ${open.number}`}</h3>
            <p className="t-label-s hole-par">{holeFigures(open)}</p>
            {open.tip ? <p className="t-body-m hole-tip">{open.tip}</p> : null}
            <TeeYards hole={open} tees={tees} />
          </div>
          <button
            type="button"
            className="hole-dialog-close"
            onClick={() => ref.current?.close()}
            aria-label="Close"
          >
            <Close />
          </button>
        </div>
      ) : null}
    </dialog>
  )

  return { show, dialog }
}
