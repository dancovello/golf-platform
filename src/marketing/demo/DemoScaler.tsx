'use client'

import { type ReactNode, useLayoutEffect, useRef } from 'react'

/**
 * Scales a live club block to fit its frame (Figma: "a real block scaled inside it"). The block
 * is laid out at the design width (1366px, the club template's Figma width) and shrunk to the
 * frame's width; the frame's height follows. On phones (frame narrower than 600px) the block
 * isn't scaled: it shows the club's own phone layout at the frame's width.
 */
export const DemoScaler = ({
  designWidth = 1366,
  height,
  children,
}: {
  designWidth?: number
  /** The frame's height at the design width (it's clipped, not stretched). */
  height?: number
  children: ReactNode
}) => {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const box = outer.current
    const stage = inner.current
    if (!box || !stage) return
    const fit = () => {
      const width = box.clientWidth
      const scaled = width >= 600
      const scale = scaled ? width / designWidth : 1
      stage.style.width = scaled ? `${designWidth}px` : '100%'
      stage.style.transform = scaled ? `scale(${scale})` : 'none'
      const natural = stage.offsetHeight
      const shown = height ? Math.min(natural, height) : natural
      box.style.height = `${Math.round(shown * scale)}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [designWidth, height])
  return (
    <div ref={outer} className="mk-demo-viewport">
      <div ref={inner} className="mk-demo-stage">
        {children}
      </div>
    </div>
  )
}
