'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight } from '../components/Icons'

/**
 * Timeline B's horizontal strip: scroll-snap cards with a pager that moves three at a time
 * and shows the years in view (e.g. "1926 — 1953"). Arrow keys scroll when focused.
 */
export const TimelineTrack = ({
  years,
  children,
  label,
}: {
  years: string[]
  children: ReactNode[]
  label: string
}) => {
  const track = useRef<HTMLOListElement>(null)
  const [range, setRange] = useState<[number, number]>([0, Math.min(3, years.length) - 1])

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => {
      const items = [...el.children] as HTMLElement[]
      const box = el.getBoundingClientRect()
      const visible = items
        .map((it, i) => ({ i, r: it.getBoundingClientRect() }))
        .filter(({ r }) => r.left >= box.left - 4 && r.right <= box.right + 4)
        .map(({ i }) => i)
      if (visible.length) setRange([visible[0], visible[visible.length - 1]])
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const page = (dir: number) => {
    const el = track.current
    const first = el?.children[0] as HTMLElement | undefined
    if (!el || !first) return
    el.scrollBy({ left: dir * 3 * (first.offsetWidth + 32), behavior: 'smooth' })
  }

  return (
    <>
      <div className="tl-pager">
        <button
          type="button"
          aria-label="Earlier"
          onClick={() => page(-1)}
          disabled={range[0] === 0}
        >
          <ArrowLeft />
        </button>
        <span className="t-label-s" aria-live="polite">
          {years[range[0]]} — {years[range[1]]}
        </span>
        <button
          type="button"
          aria-label="Later"
          onClick={() => page(1)}
          disabled={range[1] >= years.length - 1}
        >
          <ArrowRight />
        </button>
      </div>
      <ol ref={track} className="tl-track" tabIndex={0} aria-label={label}>
        {children}
      </ol>
    </>
  )
}
