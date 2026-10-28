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
import { BrowserChrome } from '../parts'

const LAPTOP = DEVICES.find((d) => d.id === 'desktop')!
const PHONE = DEVICES.find((d) => d.id === 'mobile')!
/** The laptop's screen is 16:9; the phone's is a 390 × 844 iPhone screen. */
const LAPTOP_RATIO = 9 / 16
const PHONE_HEIGHT = 844
/** The phone's width as a share of the laptop window's: bigger on small screens, to stay legible. */
const phoneShare = (room: number) => (room < 600 ? 0.36 : 0.26)
/** Browser bar (40) + the phone hanging 24 below the window + air above. */
const CHROME = 40
const PHONE_DROP = 24
/** The controls under the devices, with the gap above them. */
const CONTROLS = 96
const MAX_LAPTOP = 960

type Size = { laptop: number; phone: number }

/** The biggest pair that fits the room across and the screen's height (less the sticky nav). */
const fit = (room: number, screenHeight: number): Size => {
  const share = phoneShare(room)
  // The phone overlaps the laptop's right edge by half its width.
  const byWidth = room / (1 + share / 2)
  const byHeight = (screenHeight - 96 - CONTROLS - 32 - CHROME - PHONE_DROP) / LAPTOP_RATIO
  const laptop = Math.max(240, Math.floor(Math.min(MAX_LAPTOP, byWidth, byHeight)))
  return { laptop, phone: Math.round(laptop * share) }
}

/**
 * Marketing/Block Flipper (183:2796), reworked (Dan, 26 Oct): one hero variant at a time, shown
 * on a laptop and a phone side by side, so the point is "it looks right on every screen".
 * Arrows, keys or a swipe flip both together. Each screen is the real Hero block in an embedded
 * page at that device's real width (club blocks change layout with the width), scaled to fit.
 * The pair is sized to fit the screen. The blocks are pictures: hidden from screen readers,
 * which hear the label and the variant count instead.
 */
export const BlockFlipper = ({ address }: { address: string }) => {
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<Size>({ laptop: MAX_LAPTOP, phone: 250 })
  const stack = useRef<HTMLDivElement>(null)
  const swipe = useRef<number | null>(null)

  useLayoutEffect(() => {
    const box = stack.current
    if (!box) return
    const update = () => setSize(fit(box.clientWidth, window.innerHeight))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(box)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const count = FLIPPER_STYLES.length
  const flip = (by: number) => setIndex((i) => (i + by + count) % count)
  const variant = FLIPPER_STYLES[index]
  const laptopHeight = Math.round(size.laptop * LAPTOP_RATIO)
  const laptopScale = size.laptop / LAPTOP.width
  // The phone's screen, inside a 6px bezel.
  const phoneScreen = size.phone - 12
  const phoneScale = phoneScreen / PHONE.width
  const phoneHeight = Math.round(PHONE_HEIGHT * phoneScale) + 12
  const style = variant.label.replace('Hero · ', '')

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
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
      data-fit-screen=""
    >
      <div
        className="mk-flipper-stack"
        ref={stack}
        style={
          {
            '--window': `${size.laptop}px`,
            '--viewport': `${laptopHeight}px`,
            '--phone': `${size.phone}px`,
          } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div
          className="mk-devices"
          style={{
            width: size.laptop + size.phone / 2,
            height: CHROME + laptopHeight + PHONE_DROP,
          }}
        >
          <figure
            className="mk-flipper-window"
            style={{ width: size.laptop }}
            aria-label={`Demo club: the Hero block, ${style} style, on a laptop`}
          >
            <BrowserChrome address={address} />
            <div className="mk-flipper-viewport" style={{ height: laptopHeight }}>
              <iframe
                key={`${variant.id}-laptop`}
                src={`/frame/hero/${variant.id}`}
                title={`${variant.label}, on a laptop`}
                aria-hidden="true"
                tabIndex={-1}
                loading="lazy"
                style={{
                  width: LAPTOP.width,
                  height: Math.ceil(laptopHeight / laptopScale),
                  transform: `scale(${laptopScale})`,
                }}
              />
            </div>
          </figure>
          <figure
            className="mk-phone"
            style={{ width: size.phone, height: phoneHeight }}
            aria-label={`Demo club: the same hero on a phone`}
          >
            <div className="mk-phone-screen">
              <iframe
                key={`${variant.id}-phone`}
                src={`/frame/hero/${variant.id}`}
                title={`${variant.label}, on a phone`}
                aria-hidden="true"
                tabIndex={-1}
                loading="lazy"
                style={{
                  width: PHONE.width,
                  height: PHONE_HEIGHT,
                  transform: `scale(${phoneScale})`,
                }}
              />
            </div>
          </figure>
        </div>
      </div>
      <div className="mk-flipper-controls" style={{ width: `min(${size.laptop}px, 100%)` }}>
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
        <p className="mk-flipper-screens">
          <strong>Right on every screen.</strong> Phones get their own layout, not a squashed page.
        </p>
      </div>
    </div>
  )
}
