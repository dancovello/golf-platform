'use client'

import { type KeyboardEvent, useState } from 'react'

import { FLIPPER_STYLES } from '@/marketing/demo/flipper'

import { IconButton } from '../controls/controls'
import { DeviceStage } from './DeviceStage'

/**
 * Marketing/Block Flipper (183:2796), reworked (Dan, 26 Oct): one hero variant at a time, shown
 * on a laptop and a phone side by side, so the point is "it looks right on every screen".
 * Arrows, keys or a swipe flip both together. Each screen is the real Hero block in an embedded
 * page at that device's real width (club blocks change layout with the width), scaled to fit.
 * The blocks are pictures: hidden from screen readers, which hear the label and the variant
 * count instead.
 */
export const BlockFlipper = ({ address }: { address: string }) => {
  const [index, setIndex] = useState(0)

  const count = FLIPPER_STYLES.length
  const flip = (by: number) => setIndex((i) => (i + by + count) % count)
  const variant = FLIPPER_STYLES[index]
  const style = `${variant.label.replace('Hero · ', '')}, ${variant.headerLabel} header`

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') flip(-1)
    else if (event.key === 'ArrowRight') flip(1)
    else return
    event.preventDefault()
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
      <DeviceStage
        src={`/frame/hero/${variant.id}`}
        address={address}
        laptopLabel={`Demo club: the Hero block, ${style} style, on a laptop`}
        phoneLabel="Demo club: the same hero on a phone"
        onSwipe={flip}
      >
        {(laptop) => (
          <div className="mk-flipper-controls" style={{ width: `min(${laptop}px, 100%)` }}>
            <div className="mk-flipper-variant">
              <IconButton icon="chevron-left" label="Previous variant" onClick={() => flip(-1)} />
              <IconButton icon="chevron-right" label="Next variant" onClick={() => flip(1)} />
              <p className="mk-flipper-label" aria-live="polite">
                <span className="mk-flipper-name">{variant.label}</span>
                <span className="mk-flipper-count">
                  Variant {index + 1} of {count}, with the {variant.headerLabel} header. Swipe, or
                  use the arrow keys
                </span>
              </p>
            </div>
            <p className="mk-flipper-screens">
              <strong>Right on every screen.</strong> Phones get their own layout, not a squashed
              page.
            </p>
          </div>
        )}
      </DeviceStage>
    </div>
  )
}
