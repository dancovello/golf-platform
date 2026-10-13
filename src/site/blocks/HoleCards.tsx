'use client'

import { useRef, useState } from 'react'

import { Close } from '../components/Icons'
import { mainYards, pad2, TeeYards } from './holeParts'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'
import { SwipeRow } from './SwipeRow'

const SIZES = '(max-width: 767px) 80vw, (max-width: 1023px) 50vw, 384px'

/**
 * Hole-by-hole style A: a card per hole (Figma Hole Card "Masters": 3:2 photo, number and
 * name, par and yards from the main tee). A card opens the hole's details (every tee and the
 * playing tip) in a native modal dialog. Swipes on phones.
 */
export const HoleCards = ({
  holes,
  tees,
  label,
}: {
  holes: SiteHole[]
  tees: SiteTee[]
  label: string
}) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<SiteHole | null>(null)

  const cards = holes.map((hole) => {
    const yards = mainYards(hole)
    return (
      <button
        key={hole.number}
        type="button"
        className="hole-card"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(hole)
          dialog.current?.showModal()
        }}
      >
        <div className="hole-card-image">
          {hole.image ? <Photo image={hole.image} sizes={SIZES} alt="" /> : null}
        </div>
        <div className="hole-card-info">
          <div className="hole-card-title">
            <span className="t-data-label hole-number">Hole No. {pad2(hole.number)}</span>
            <span className="t-heading-m">{hole.name ?? `Hole ${hole.number}`}</span>
          </div>
          <dl className="hole-stats">
            <div>
              <dt className="t-data-label">Par</dt>
              <dd className="t-data-serif">{hole.par}</dd>
            </div>
            {yards != null ? (
              <div>
                <dt className="t-data-label">Yards</dt>
                <dd className="t-data-serif">{yards}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </button>
    )
  })

  return (
    <>
      <SwipeRow className="hole-cards" label={label}>
        {cards}
      </SwipeRow>
      <dialog
        ref={dialog}
        className="hole-dialog"
        aria-label={open ? `Hole ${open.number}${open.name ? `, ${open.name}` : ''}` : undefined}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
      >
        {open ? (
          <div className="hole-dialog-body">
            {open.image ? (
              <div className="hole-dialog-image">
                <Photo image={open.image} sizes="(max-width: 767px) 100vw, 480px" alt="" />
              </div>
            ) : null}
            <div className="hole-dialog-text">
              <p className="t-data-label hole-number">Hole No. {pad2(open.number)}</p>
              <h3 className="t-heading-l">{open.name ?? `Hole ${open.number}`}</h3>
              <p className="t-label-s hole-par">
                Par {open.par}
                {open.strokeIndex ? ` · SI ${open.strokeIndex}` : ''}
              </p>
              {open.tip ? <p className="t-body-m hole-tip">{open.tip}</p> : null}
              <TeeYards hole={open} tees={tees} />
            </div>
            <button
              type="button"
              className="hole-dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
            >
              <Close />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
