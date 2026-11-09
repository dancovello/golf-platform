'use client'

import { mainYards, pad2 } from './holeParts'
import { useHoleDialog } from './HoleDialog'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'
import { SwipeRow } from './SwipeRow'

const SIZES = '(max-width: 767px) 80vw, (max-width: 1023px) 50vw, 384px'

/**
 * Hole-by-hole style A: a card per hole (Figma Hole Card "Masters": 3:2 photo, number and
 * name, par and yards from the main tee). A card opens the hole's pop-up (HoleDialog). Swipes on phones.
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
  const { show, dialog } = useHoleDialog(tees)

  const cards = holes.map((hole) => {
    const yards = mainYards(hole)
    return (
      <button
        key={hole.number}
        type="button"
        className={`hole-card${hole.image ? '' : ' is-no-photo'}`}
        aria-haspopup="dialog"
        onClick={() => show(hole)}
      >
        {hole.image ? (
          <div className="hole-card-image">
            <Photo image={hole.image} sizes={SIZES} alt="" />
          </div>
        ) : null}
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
      {dialog}
    </>
  )
}
