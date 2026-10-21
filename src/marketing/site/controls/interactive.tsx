'use client'

import { type KeyboardEvent, type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'

import { MarketingIcon } from '../MarketingIcon'

/*
 * Marketing controls with state of their own, built from the Figma "Marketing · Controls"
 * section (219:8340) and the components beside it. Behaviour follows each component's
 * description in Figma; the look is in marketing.css.
 */

/**
 * Marketing/Switch (219:8357): role="switch" with aria-checked. The knob travels with a spring
 * and stretches to 22px while pressed. 40×24 to see, 44×44 to tap.
 */
export const Switch = ({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
}: {
  label: string
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) => {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="mk-switch"
      onClick={() => {
        setChecked(!checked)
        onChange?.(!checked)
      }}
    >
      <span className="mk-switch-knob" />
    </button>
  )
}

/** Moves focus between a group's buttons with the arrow keys, Home and End. */
const arrowKeys = (event: KeyboardEvent<HTMLElement>, select: (index: number) => void) => {
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-index]')]
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (current < 0) return
  const last = buttons.length - 1
  const next =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? current === last
        ? 0
        : current + 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? current === 0
          ? last
          : current - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : null
  if (next === null) return
  event.preventDefault()
  buttons[next].focus()
  select(next)
}

/**
 * Marketing/Pill Tab (219:8393): tabs in a tablist. The active pill slides between tabs; the
 * arrow keys move focus. Panels are the caller's (the tab's id controls them).
 */
export const PillTabs = ({
  label,
  tabs,
  defaultIndex = 0,
  onChange,
}: {
  label: string
  tabs: string[]
  defaultIndex?: number
  onChange?: (index: number) => void
}) => {
  const [active, setActive] = useState(defaultIndex)
  const list = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active])
  const select = (index: number) => {
    setActive(index)
    onChange?.(index)
  }
  return (
    <div
      ref={list}
      className="mk-pill-tabs"
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => arrowKeys(event, select)}
    >
      {pill ? (
        <span className="mk-pill-indicator" style={{ left: pill.left, width: pill.width }} />
      ) : null}
      {tabs.map((tab, i) => (
        <button
          key={tab}
          type="button"
          role="tab"
          data-index={i}
          className="mk-pill-tab"
          aria-selected={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => select(i)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

/**
 * Marketing/Segment Option (183:2637): options in a segmented control, in a 3px-padded tint
 * track. One is chosen at a time (radio group).
 */
export const Segmented = ({
  label,
  options,
  defaultIndex = 0,
  onChange,
}: {
  label: string
  options: string[]
  defaultIndex?: number
  onChange?: (index: number) => void
}) => {
  const [active, setActive] = useState(defaultIndex)
  const select = (index: number) => {
    setActive(index)
    onChange?.(index)
  }
  return (
    <div
      className="mk-segmented"
      role="radiogroup"
      aria-label={label}
      onKeyDown={(event) => arrowKeys(event, select)}
    >
      {options.map((option, i) => (
        <button
          key={option}
          type="button"
          role="radio"
          data-index={i}
          className="mk-segment"
          aria-checked={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => select(i)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

/**
 * Marketing/Tenant Chip (176:1947): the club switcher under the hero. The swatch is the club's
 * brand colour.
 */
export const TenantChips = ({
  label,
  clubs,
  defaultIndex = 0,
  onChange,
}: {
  label: string
  clubs: { name: string; style: string; swatch: string }[]
  defaultIndex?: number
  onChange?: (index: number) => void
}) => {
  const [active, setActive] = useState(defaultIndex)
  const select = (index: number) => {
    setActive(index)
    onChange?.(index)
  }
  return (
    <div
      className="mk-tenant-chips"
      role="radiogroup"
      aria-label={label}
      onKeyDown={(event) => arrowKeys(event, select)}
    >
      {clubs.map((club, i) => (
        <button
          key={club.name}
          type="button"
          role="radio"
          data-index={i}
          className="mk-tenant-chip"
          aria-checked={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => select(i)}
        >
          <span className="mk-tenant-swatch" style={{ background: club.swatch }} />
          <span className="mk-tenant-name">{club.name}</span>
          <span className="mk-tenant-style">{club.style}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Marketing/FAQ Item (185:3621): a disclosure (button + aria-expanded). The answer opens with a
 * 180ms height transition; instant with reduced motion.
 */
export const FaqItem = ({
  question,
  children,
  defaultOpen = false,
}: {
  question: string
  children: ReactNode
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="mk-faq" data-open={open}>
      <h3 className="mk-faq-heading">
        <button
          type="button"
          className="mk-faq-question"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          <span>{question}</span>
          <span className="mk-faq-icon">
            <MarketingIcon name={open ? 'minus' : 'plus'} size={18} />
          </span>
        </button>
      </h3>
      <div className="mk-faq-answer" id={id} role="region" aria-label={question} inert={!open}>
        <div className="mk-faq-answer-inner">{children}</div>
      </div>
    </div>
  )
}
