'use client'

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react'

/**
 * Tabs (Figma "Tab", underlined) or a Segmented Control (Figma "Segmented Control", pills).
 * Every panel is drawn on the server; this only switches which one shows. Arrow keys move
 * between tabs, as the ARIA tabs pattern expects.
 */
export const Tabs = ({
  labels,
  panels,
  variant,
  label,
}: {
  labels: string[]
  panels: ReactNode[]
  variant: 'tabs' | 'segments'
  label: string
}) => {
  const [active, setActive] = useState(0)
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  if (labels.length <= 1) return <>{panels[0]}</>

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (active + step + labels.length) % labels.length
    setActive(next)
    refs.current[next]?.focus()
  }

  return (
    <>
      <div className={`tabs tabs-${variant}`} role="tablist" aria-label={label} onKeyDown={onKey}>
        {labels.map((l, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            className={`tab t-label-s${active === i ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {l}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
        >
          {panel}
        </div>
      ))}
    </>
  )
}
