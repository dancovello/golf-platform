'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/**
 * A sideways-scrolling row of holes (style A's chips, B's rail, C's filmstrip on phones). The
 * holes are ordinary links, so it works without JavaScript; this only slides the row so the
 * hole being viewed starts in view. It moves the row itself, never the page.
 */
export const TourPicker = ({
  className,
  label,
  children,
}: {
  className: string
  label: string
  children: ReactNode
}) => {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const row = ref.current
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!row || !current) return
    const r = row.getBoundingClientRect()
    const c = current.getBoundingClientRect()
    row.scrollLeft += c.left - r.left - (r.width - c.width) / 2
  }, [])
  return (
    <nav ref={ref} className={className} aria-label={label}>
      {children}
    </nav>
  )
}
