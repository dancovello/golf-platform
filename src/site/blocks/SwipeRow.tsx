'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from '../components/Icons'

/**
 * A row of cards: a grid on larger screens (styled by the block), and on phones a swipe
 * carousel that runs to the screen edge with "01 / 04" and previous/next buttons below
 * (docs/design/13 v2). The cards stay ordinary links, so it works without JavaScript too.
 */
export const SwipeRow = ({
  className,
  label,
  children,
}: {
  className: string
  label: string
  children: ReactNode[]
}) => {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = children.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null
      if (!first) return
      const step = first.offsetWidth + 16
      setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  const go = (to: number) => {
    const el = track.current
    const card = el?.children[to] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: 'smooth' })
  }
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      <div ref={track} className={`${className} swipe-track`} role="list" aria-label={label}>
        {children.map((child, i) => (
          <div key={i} role="listitem">
            {child}
          </div>
        ))}
      </div>
      <div className="swipe-pager t-label-s" aria-hidden="true">
        <button type="button" tabIndex={-1} disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeft />
        </button>
        <span>
          {pad(index + 1)} / {pad(count)}
        </span>
        <button
          type="button"
          tabIndex={-1}
          disabled={index >= count - 1}
          onClick={() => go(index + 1)}
        >
          <ChevronRight />
        </button>
      </div>
    </>
  )
}
