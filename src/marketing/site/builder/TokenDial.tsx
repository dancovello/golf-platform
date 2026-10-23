'use client'

import { createContext, type CSSProperties, type ReactNode, useContext, useState } from 'react'

import { DIAL_SWATCHES, readDial } from '@/marketing/demo/tokenDial'
import { type Brand, brandCSSVariables } from '@/theme/colour'

import { MarketingIcon } from '../MarketingIcon'

const Picked = createContext<Brand | null>(null)

/**
 * Marketing/Token Dial (183:2934): "Visitor picks a club colour; the demo site re-skins via
 * tokens." The demo club's real hero beside it takes the colour; the readout shows what a club
 * site does with it (src/marketing/demo/tokenDial.ts), read out when it changes.
 */
export const TokenDial = ({ base, frame }: { base: Brand; frame: ReactNode }) => {
  const [index, setIndex] = useState(DIAL_SWATCHES.length - 1)
  const swatch = DIAL_SWATCHES[index]
  const reading = readDial(base, swatch)
  const pick = (i: number) => setIndex((i + DIAL_SWATCHES.length) % DIAL_SWATCHES.length)
  return (
    <Picked.Provider value={reading.brand}>
      <div className="mk-dial">
        <div className="mk-dial-controls">
          <p className="mk-dial-label" id="mk-dial-label">
            Club colour
          </p>
          <div
            className="mk-dial-swatches"
            role="radiogroup"
            aria-labelledby="mk-dial-label"
            onKeyDown={(e) => {
              const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
              if (!by) return
              e.preventDefault()
              const next = (index + by + DIAL_SWATCHES.length) % DIAL_SWATCHES.length
              pick(next)
              e.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
            }}
          >
            {DIAL_SWATCHES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                role="radio"
                aria-checked={i === index}
                aria-label={s.name}
                tabIndex={i === index ? 0 : -1}
                className="mk-dial-swatch"
                style={{ '--swatch': s.hex } as CSSProperties}
                onClick={() => pick(i)}
              />
            ))}
          </div>
          <p className="mk-dial-hex">
            <span className="mk-dial-chip" style={{ background: swatch.hex }} aria-hidden="true" />
            <span>
              {swatch.hex} · {reading.text} text
            </span>
          </p>
          <div className="mk-dial-contrast">
            <span>Button text contrast</span>
            <span className="mk-dial-value">
              <strong>{reading.ratio} : 1</strong>
              <span className="mk-dial-pass">AA</span>
            </span>
          </div>
          <p className="mk-dial-note" aria-live="polite">
            <MarketingIcon name="info" size={16} />
            <span>{reading.note}</span>
          </p>
        </div>
        {frame}
      </div>
    </Picked.Provider>
  )
}

/** Inside the demo frame: the picked colour applied as the club's own tokens. */
export const DialColours = ({ children }: { children: ReactNode }) => {
  const brand = useContext(Picked)
  if (!brand) return <>{children}</>
  return (
    <div className="club-theme mk-dial-skin" style={brandCSSVariables(brand) as CSSProperties}>
      {children}
    </div>
  )
}
