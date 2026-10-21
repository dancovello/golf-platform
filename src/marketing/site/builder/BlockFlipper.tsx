'use client'

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { DEVICES, FLIPPER_STYLES } from '@/marketing/demo/flipper'

import { IconButton } from '../controls/controls'
import { Segmented } from '../controls/interactive'
import { BrowserChrome } from '../parts'

/** The window at full size (Figma 183:3059): 960 wide with a 540-tall viewport. */
const WINDOW = { desktop: 960, tablet: 600, mobile: 320 }
const VIEWPORT_HEIGHT = 540

/**
 * Marketing/Block Flipper (183:2796): "Card stack of one block's variants (Hero A/B/C).
 * Arrows/swipe flip the stack; Device resizes the live block." Each variant is the real Hero
 * block in an embedded page at the device's real width (club blocks change layout with the
 * screen's width), scaled to fit the window. The block is a picture: hidden from screen
 * readers, which hear the label and the variant count instead.
 */
export const BlockFlipper = ({ address }: { address: string }) => {
  const [index, setIndex] = useState(0)
  const [device, setDevice] = useState(0)
  const [room, setRoom] = useState<number>(WINDOW.desktop)
  const stack = useRef<HTMLDivElement>(null)
  const swipe = useRef<number | null>(null)

  useLayoutEffect(() => {
    const box = stack.current
    if (!box) return
    const fit = () => setRoom(box.clientWidth)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const count = FLIPPER_STYLES.length
  const flip = (by: number) => setIndex((i) => (i + by + count) % count)
  const variant = FLIPPER_STYLES[index]
  const screen = DEVICES[device]
  const windowWidth = Math.min(WINDOW[screen.id], room)
  const scale = windowWidth / screen.width
  // Phones see a shorter window, in proportion.
  const viewportHeight = Math.round(Math.min(VIEWPORT_HEIGHT, (windowWidth / WINDOW.desktop) * 900))

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('[role="radiogroup"]')) return
    if (event.key === 'ArrowLeft') flip(-1)
    else if (event.key === 'ArrowRight') flip(1)
    else return
    event.preventDefault()
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') swipe.current = event.clientX
  }
  const onPointerUp = (event: PointerEvent) => {
    if (swipe.current === null) return
    const moved = event.clientX - swipe.current
    swipe.current = null
    if (Math.abs(moved) > 40) flip(moved < 0 ? 1 : -1)
  }

  return (
    <div
      className="mk-flipper"
      role="group"
      aria-roledescription="carousel"
      aria-label="Hero block variants"
      onKeyDown={onKey}
    >
      <div
        className="mk-flipper-stack"
        ref={stack}
        style={
          { '--window': `${windowWidth}px`, '--viewport': `${viewportHeight}px` } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <span className="mk-flipper-card mk-flipper-card--2" aria-hidden="true" />
        <span className="mk-flipper-card mk-flipper-card--1" aria-hidden="true" />
        <figure
          className="mk-flipper-window"
          style={{ width: windowWidth }}
          aria-label={`Demo club: the Hero block, ${variant.label.replace('Hero · ', '')} style, at ${screen.label.toLowerCase()} width`}
        >
          <BrowserChrome address={address} />
          <div className="mk-flipper-viewport" style={{ height: viewportHeight }}>
            <iframe
              key={`${variant.id}-${screen.id}`}
              src={`/frame/hero/${variant.id}`}
              title={`${variant.label}, ${screen.label}`}
              aria-hidden="true"
              tabIndex={-1}
              loading="lazy"
              style={{
                width: screen.width,
                height: Math.ceil(viewportHeight / scale),
                transform: `scale(${scale})`,
              }}
            />
          </div>
        </figure>
      </div>
      <div className="mk-flipper-controls">
        <div className="mk-flipper-variant">
          <IconButton icon="chevron-left" label="Previous variant" onClick={() => flip(-1)} />
          <IconButton icon="chevron-right" label="Next variant" onClick={() => flip(1)} />
          <p className="mk-flipper-label" aria-live="polite">
            <span className="mk-flipper-name">{variant.label}</span>
            <span className="mk-flipper-count">
              Variant {index + 1} of {count}. Swipe, or use the arrow keys
            </span>
          </p>
        </div>
        <Segmented
          label="Device width"
          options={DEVICES.map((d) => d.label)}
          onChange={setDevice}
        />
      </div>
    </div>
  )
}
