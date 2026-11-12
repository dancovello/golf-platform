'use client'

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight } from '../components/Icons'

/**
 * The one set of carousel controls for the whole site (Dan, 2026-11-11: the card grid style B
 * controls everywhere): a "01 / 05" count, a thin progress line and two round arrow buttons.
 * Every carousel pairs `useCarousel` (which watches a scrolling track) with `CarouselControls`
 * (which draws them), so a carousel looks and behaves the same wherever it appears. The controls
 * sit inside the page column while the track itself runs to the edge of the window (blocks.css).
 */
export type CarouselState = { index: number; start: number; size: number; fits: boolean }

export const useCarousel = <T extends HTMLElement>(count: number) => {
  const track = useRef<T>(null)
  const [state, setState] = useState<CarouselState>({ index: 0, start: 0, size: 100, fits: false })

  const measure = useCallback(() => {
    const el = track.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    const step = first.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0)
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

  const go = useCallback(
    (to: number) => {
      const el = track.current
      const card = el?.children[Math.min(count - 1, Math.max(0, to))] as HTMLElement | undefined
      if (!el || !card) return
      // The track pads itself by the same amount as its scroll-padding, so the card lands on
      // the page column's edge rather than the window's.
      const inset = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft - inset, behavior: 'smooth' })
    },
    [count],
  )

  return { track: track as RefObject<T>, state, go }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export const CarouselControls = ({
  state,
  count,
  go,
  by = 1,
  label,
  noun = 'card',
  className = '',
}: {
  state: CarouselState
  count: number
  go: (to: number) => void
  /** How many cards an arrow moves. */
  by?: number
  /** Replaces the "01 / 05" count (the timeline shows the years in view instead). */
  label?: ReactNode
  /** For the buttons' names: "Previous hole", "Next card". */
  noun?: string
  className?: string
}) => {
  const atEnd = state.start + state.size >= 99.5
  return (
    <div className={`carctl${state.fits ? ' is-hidden' : ''}${className ? ` ${className}` : ''}`}>
      <span className="t-label-s carctl-count" aria-hidden="true">
        {label ?? (
          <>
            {pad2(state.index + 1)} <span className="carctl-of">/ {pad2(count)}</span>
          </>
        )}
      </span>
      <span className="carctl-progress" aria-hidden="true">
        <span
          className="carctl-thumb"
          style={{ width: `${state.size}%`, left: `${state.start}%` }}
        />
      </span>
      <span className="carctl-buttons">
        <button
          type="button"
          aria-label={`Previous ${noun}`}
          disabled={state.start <= 0.5}
          onClick={() => go(state.index - by)}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={`Next ${noun}`}
          disabled={atEnd}
          onClick={() => go(state.index + by)}
        >
          <ArrowRight size={18} />
        </button>
      </span>
    </div>
  )
}
