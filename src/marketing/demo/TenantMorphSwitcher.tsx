'use client'

import { Children, type ReactNode, useEffect, useRef, useState } from 'react'

import { TenantChips } from '../site/controls/interactive'

/**
 * Shows one demo club's frame at a time (Figma Marketing/Tenant Morph description): on desktop
 * the club changes as the visitor scrolls past (about a viewport each); with reduced motion or on
 * phones it stays on the first club until a chip is chosen. Chips always switch it.
 */
export const TenantMorphSwitcher = ({
  clubs,
  children,
}: {
  clubs: { name: string; style: string; swatch: string }[]
  children: ReactNode
}) => {
  const frames = Children.toArray(children)
  const [active, setActive] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const [scrollDriven, setScrollDriven] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setScrollDriven(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!scrollDriven) return
    const onScroll = () => {
      const el = track.current
      if (!el) return
      const box = el.getBoundingClientRect()
      const travel = box.height - window.innerHeight
      if (travel <= 0) return
      const progress = Math.min(1, Math.max(0, -box.top / travel))
      setActive(Math.min(frames.length - 1, Math.floor(progress * frames.length)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollDriven, frames.length])

  return (
    <div
      ref={track}
      className="mk-morph"
      data-scroll-driven={scrollDriven}
      style={scrollDriven ? { height: `${frames.length * 100}vh` } : undefined}
    >
      <div className="mk-morph-sticky">
        <div className="mk-morph-frames">
          {frames.map((frame, i) => (
            <div
              key={i}
              className="mk-morph-frame"
              data-active={i === active}
              hidden={i !== active}
            >
              {frame}
            </div>
          ))}
        </div>
        <TenantChips
          label="Demo clubs"
          clubs={clubs}
          value={active}
          onChange={(index) => {
            setActive(index)
            if (scrollDriven && track.current) {
              const box = track.current.getBoundingClientRect()
              const travel = box.height - window.innerHeight
              const top = window.scrollY + box.top + (travel * (index + 0.5)) / frames.length
              window.scrollTo({ top, behavior: 'instant' })
            }
          }}
        />
      </div>
    </div>
  )
}
