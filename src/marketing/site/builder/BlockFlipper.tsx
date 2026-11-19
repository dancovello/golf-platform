'use client'

import { useState } from 'react'

import { FLIPPER_STYLES, flipperFontName } from '@/marketing/demo/flipper'

import { Segmented } from '../controls/interactive'
import { DeviceStage } from './DeviceStage'

/**
 * Marketing/Block Flipper (183:2796), reworked (Dan, 26 Oct): one hero variant at a time, shown
 * on a laptop and a phone side by side, so the point is "it looks right on every screen".
 * The A, B and C pills (or a swipe) change both together. Each screen is the real Hero block in
 * an embedded page at that device's real width (club blocks change layout with the width), scaled to fit.
 * The blocks are pictures: hidden from screen readers, which hear the label and the variant
 * count instead.
 */
export const BlockFlipper = ({ address }: { address: string }) => {
  const [index, setIndex] = useState(0)

  const count = FLIPPER_STYLES.length
  const flip = (by: number) => setIndex((i) => (i + by + count) % count)
  const variant = FLIPPER_STYLES[index]
  const style = `${variant.label.replace('Hero · ', '')}, ${variant.headerLabel} header`

  return (
    <div
      className="mk-flipper"
      role="group"
      aria-roledescription="carousel"
      aria-label="Hero block variants"
      data-fit-screen=""
    >
      <DeviceStage
        src={`/frame/hero/${variant.id}`}
        warm={FLIPPER_STYLES.map((v) => `/frame/hero/${v.id}`)}
        address={address}
        laptopLabel={`Demo club: the Hero block, ${style} style, on a laptop`}
        phoneLabel="Demo club: the same hero on a phone"
        onSwipe={flip}
      >
        {(laptop) => (
          <div className="mk-flipper-controls" style={{ width: `min(${laptop}px, 100%)` }}>
            <p className="mk-flipper-label" aria-live="polite">
              <span className="mk-flipper-name">{variant.label}</span>
              <span className="mk-flipper-count">
                Variant {index + 1} of {count}, with the {variant.headerLabel} header,{' '}
                {flipperFontName(variant.id)} fonts.
              </span>
            </p>
            <Segmented
              label="Hero variant"
              options={FLIPPER_STYLES.map(
                (v, i) => `${'ABC'[i]} · ${v.label.replace('Hero · ', '')}`,
              )}
              value={index}
              onChange={setIndex}
            />
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
