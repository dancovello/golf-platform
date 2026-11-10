'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight } from '../components/Icons'

/**
 * A carousel of cards for every screen size: three across on a wide screen, two on a tablet,
 * and one and a bit on a phone so the next card peeks in. Below it sit a thin progress line, a
 * "01 / 05" count and two round arrow buttons. The cards stay ordinary links, so the row still
 * scrolls (by touch, trackpad or keyboard) without JavaScript. Styles are in ctaCardGrid.css.
 */
export const CardCarousel = ({ label, children }: { label: string; children: ReactNode[] }) => {
  const track = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ index: 0, start: 0, size: 100, fits: false })
  const count = children.length

  const measure = useCallback(() => {
    const el = track.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
    setState({
      index: Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))),
      start: (el.scrollLeft / el.scrollWidth) * 100,
      size: Math.min(100, (el.clientWidth / el.scrollWidth) * 100),
      fits: el.scrollWidth <= el.clientWidth + 1,
    })
  }, [count])

  useEffect(() => {
    const el = track.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const go = (to: number) => {
    const el = track.current
    const card = el?.children[Math.min(count - 1, Math.max(0, to))] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  const atEnd = state.start + state.size >= 99.5

  return (
    <div className="cg-carousel">
      <div ref={track} className="cg-carousel-track" role="list" aria-label={label}>
        {children.map((child, i) => (
          <div key={i} role="listitem">
            {child}
          </div>
        ))}
      </div>
      <div className={`cg-carousel-controls${state.fits ? ' is-hidden' : ''}`} aria-hidden="true">
        <span className="t-label-s cg-carousel-count">
          {pad(state.index + 1)} <span className="cg-carousel-of">/ {pad(count)}</span>
        </span>
        <span className="cg-carousel-progress">
          <span
            className="cg-carousel-thumb"
            style={{ width: `${state.size}%`, left: `${state.start}%` }}
          />
        </span>
        <span className="cg-carousel-buttons">
          <button
            type="button"
            tabIndex={-1}
            disabled={state.start <= 0.5}
            onClick={() => go(state.index - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button type="button" tabIndex={-1} disabled={atEnd} onClick={() => go(state.index + 1)}>
            <ArrowRight size={18} />
          </button>
        </span>
      </div>
    </div>
  )
}
