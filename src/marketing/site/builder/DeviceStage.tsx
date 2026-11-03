'use client'

import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { DEVICES } from '@/marketing/demo/flipper'

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
 * A laptop window with a phone overlapping its bottom-right corner (Dan, 26 Oct), each showing
 * `src` in an embedded page at that device's real width (club blocks change layout with the
 * width), scaled to fit. Shared by the Block Flipper and the Block Switcher. The pair is sized
 * to fit the screen; `children` is drawn under it, given the laptop's width. A swipe calls
 * `onSwipe(±1)`. The pictures are hidden from screen readers: the parent labels them.
 */
export const DeviceStage = ({
  src,
  address,
  laptopLabel,
  phoneLabel,
  onSwipe,
  children,
}: {
  src: string
  address: string
  laptopLabel: string
  phoneLabel: string
  onSwipe?: (by: 1 | -1) => void
  children: (laptopWidth: number) => ReactNode
}) => {
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

  const laptopHeight = Math.round(size.laptop * LAPTOP_RATIO)
  const laptopScale = size.laptop / LAPTOP.width
  // The phone's screen, inside a 6px bezel.
  const phoneScreen = size.phone - 12
  const phoneScale = phoneScreen / PHONE.width
  const phoneHeight = Math.round(PHONE_HEIGHT * phoneScale) + 12

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') swipe.current = event.clientX
  }
  const onPointerUp = (event: PointerEvent) => {
    if (swipe.current === null) return
    const moved = event.clientX - swipe.current
    swipe.current = null
    if (Math.abs(moved) > 40) onSwipe?.(moved < 0 ? 1 : -1)
  }

  return (
    <>
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
            aria-label={laptopLabel}
          >
            <BrowserChrome address={address} />
            <div className="mk-flipper-viewport" style={{ height: laptopHeight }}>
              <iframe
                key={`${src}-laptop`}
                src={src}
                title={laptopLabel}
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
            aria-label={phoneLabel}
          >
            <div className="mk-phone-screen">
              <iframe
                key={`${src}-phone`}
                src={src}
                title={phoneLabel}
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
      {children(size.laptop)}
    </>
  )
}
