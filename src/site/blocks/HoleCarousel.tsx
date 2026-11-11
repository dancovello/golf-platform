'use client'

import { CarouselControls, useCarousel } from './CarouselControls'
import { pad2, TeeDot } from './holeParts'
import { holeLabel, useHoleDialog } from './HoleDialog'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'

/**
 * Hole-by-hole style B (Figma Hole Card "Overlay"): a scroll-snap track of tall photo cards on
 * the brand colour, with the shared carousel controls below. No autoplay; swipe or
 * scroll works without JavaScript.
 */
export const HoleCarousel = ({
  holes,
  tees,
  eyebrow,
  heading,
}: {
  holes: SiteHole[]
  tees: SiteTee[]
  eyebrow: string | null
  heading: string
}) => {
  const { show, dialog } = useHoleDialog(tees)
  const { track, state, go } = useCarousel<HTMLDivElement>(holes.length)

  return (
    <>
      <div className="blk-header">
        <div>
          {eyebrow ? <p className="t-eyebrow blk-eyebrow">{eyebrow}</p> : null}
          <h2 className="t-heading-l blk-heading">{heading}</h2>
        </div>
      </div>
      {/* Scrolls sideways, so it can be focused and scrolled from the keyboard too. */}
      <div ref={track} className="hole-track" role="list" aria-label={heading} tabIndex={0}>
        {holes.map((hole) => (
          <article
            key={hole.number}
            role="listitem"
            className={`hole-overlay ${hole.image ? 'on-image' : 'on-brand'}`}
            style={hole.image?.shading}
            aria-label={`Hole ${hole.number}${hole.name ? `, ${hole.name}` : ''}, par ${hole.par}`}
          >
            {hole.image ? (
              <Photo image={hole.image} sizes="(max-width: 767px) 80vw, 340px" alt="" />
            ) : null}
            <button
              type="button"
              className="hole-hit"
              aria-haspopup="dialog"
              aria-label={`${holeLabel(hole)}: open details`}
              onClick={() => show(hole)}
            />
            <div className="hole-overlay-top">
              <span className="t-display-xl">{pad2(hole.number)}</span>
              <span className="t-label-s hole-chip">Par {hole.par}</span>
            </div>
            <div className="hole-overlay-bottom">
              {hole.name ? <h3 className="t-heading-caps">{hole.name}</h3> : null}
              <ul className="hole-overlay-tees">
                {tees.map((t, i) =>
                  hole.yards[i] == null ? null : (
                    <li key={t.colour} className="t-label-s hole-chip">
                      <TeeDot tee={t} />
                      <span className="visually-hidden">{t.name}</span>
                      {hole.yards[i]}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <CarouselControls state={state} count={holes.length} go={go} noun="hole" />
      {dialog}
    </>
  )
}
