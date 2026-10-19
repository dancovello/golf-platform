'use client'

import { useEffect, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight } from '../components/Icons'
import { pad2, TeeDot } from './holeParts'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'

/**
 * Hole-by-hole style B (Figma Hole Card "Overlay"): a scroll-snap track of tall photo cards on
 * the brand colour, with previous/next and "01 / 18" in the header. No autoplay; swipe or
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
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = holes.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null
      if (!first) return
      const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
      setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  const go = (to: number) => {
    const el = track.current
    const card = el?.children[to] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  return (
    <>
      <div className="blk-header">
        <div>
          {eyebrow ? <p className="t-eyebrow blk-eyebrow">{eyebrow}</p> : null}
          <h2 className="t-heading-l blk-heading">{heading}</h2>
        </div>
        <div className="hole-pager">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous hole"
          >
            <ArrowLeft />
          </button>
          <span className="t-label-s" aria-hidden="true">
            {pad2(index + 1)} / {pad2(count)}
          </span>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index >= count - 1}
            aria-label="Next hole"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      {/* Scrolls sideways, so it can be focused and scrolled from the keyboard too. */}
      <div ref={track} className="hole-track" role="list" aria-label={heading} tabIndex={0}>
        {holes.map((hole) => (
          <article
            key={hole.number}
            role="listitem"
            className="hole-overlay"
            aria-label={`Hole ${hole.number}${hole.name ? `, ${hole.name}` : ''}, par ${hole.par}`}
          >
            {hole.image ? (
              <Photo image={hole.image} sizes="(max-width: 767px) 80vw, 340px" alt="" />
            ) : null}
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
    </>
  )
}
