'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/**
 * Moves a club block's sideways track (e.g. the hole carousel's .hole-track) on one card every
 * few seconds while it's on screen, looping back to the start. Pauses while the pointer is over
 * it, and stays still for visitors who prefer reduced motion. The block inside is a picture, so
 * this is the only way it moves.
 */
export const AutoAdvance = ({
  track,
  every = 2800,
  children,
}: {
  /** The scrolling element inside, e.g. ".hole-track". */
  track: string
  every?: number
  children: ReactNode
}) => {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = root.current
    const el = box?.querySelector<HTMLElement>(track)
    if (!box || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let visible = false
    let hovered = false
    let index = 0
    const seen = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0.4,
    })
    seen.observe(box)
    const enter = () => (hovered = true)
    const leave = () => (hovered = false)
    box.addEventListener('pointerenter', enter)
    box.addEventListener('pointerleave', leave)
    const timer = window.setInterval(() => {
      if (!visible || hovered) return
      const cards = el.children
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      index = atEnd ? 0 : (index + 1) % cards.length
      const card = cards[index] as HTMLElement | undefined
      if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
    }, every)
    return () => {
      window.clearInterval(timer)
      seen.disconnect()
      box.removeEventListener('pointerenter', enter)
      box.removeEventListener('pointerleave', leave)
    }
  }, [track, every])

  return <div ref={root}>{children}</div>
}
