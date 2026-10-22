import type { InputHTMLAttributes, ReactNode } from 'react'

import { MarketingIcon, type MarketingIconName } from '../MarketingIcon'

/*
 * Marketing controls that need no script, built from the Figma "Marketing · Controls" section
 * (219:8340) and the components beside it. States (hover, focus, pressed, disabled, selected)
 * are in marketing.css. Controls with state of their own are in ./interactive.tsx.
 */

/** Marketing/Text Link (219:8400): inline and footer links; the underline draws in from the left. */
export const TextLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="mk-text-link" href={href}>
    {children}
  </a>
)

/** Marketing/Nav Link (174:1853): Default, Hover, Current (aria-current), Pressed, Focus. */
export const NavLink = ({
  href,
  current = false,
  children,
}: {
  href: string
  current?: boolean
  children: ReactNode
}) => (
  <a className="mk-nav-link" href={href} aria-current={current ? 'page' : undefined}>
    {children}
  </a>
)

/** Marketing/Icon Button (219:8373): icon only, always labelled; 36px to see, 44px to tap. */
export const IconButton = ({
  icon,
  label,
  disabled = false,
}: {
  icon: MarketingIconName
  label: string
  disabled?: boolean
}) => (
  <button className="mk-icon-button" type="button" aria-label={label} disabled={disabled}>
    <MarketingIcon name={icon} size={16} />
  </button>
)

/**
 * Marketing/Field (185:3608): label above, tertiary placeholder, dawn border on focus, rose
 * border and a message saying what to do on error (linked with aria-describedby).
 */
export const Field = ({
  id,
  label,
  error,
  ...input
}: {
  id: string
  label: string
  error?: string | null
} & InputHTMLAttributes<HTMLInputElement>) => (
  <div className="mk-field">
    <label className="mk-field-label" htmlFor={id}>
      {label}
    </label>
    <input
      {...input}
      id={id}
      className="mk-field-input"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error ? (
      <p className="mk-field-error" id={`${id}-error`}>
        {error}
      </p>
    ) : null}
  </div>
)

/**
 * Marketing/Time Slot (219:8384): a radio. Taken slots are disabled and struck through, so
 * colour isn't the only signal.
 */
export const TimeSlots = ({
  name,
  legend,
  slots,
}: {
  name: string
  legend: string
  slots: { value: string; label: string; taken?: boolean; selected?: boolean }[]
}) => (
  <fieldset className="mk-slots">
    <legend className="mk-visually-hidden">{legend}</legend>
    {slots.map((slot) => (
      <label key={slot.value} className="mk-slot">
        <input
          type="radio"
          name={name}
          value={slot.value}
          disabled={slot.taken}
          defaultChecked={slot.selected}
        />
        <span>
          {slot.label}
          {slot.taken ? <span className="mk-visually-hidden"> (taken)</span> : null}
        </span>
      </label>
    ))}
  </fieldset>
)

/** Marketing/Filter Chip (186:3939): single-select radios, label and count. */
export const FilterChips = ({
  name,
  legend,
  options,
}: {
  name: string
  legend: string
  options: { value: string; label: string; count: number; selected?: boolean }[]
}) => (
  <fieldset className="mk-filter-chips">
    <legend className="mk-visually-hidden">{legend}</legend>
    {options.map((option) => (
      <label key={option.value} className="mk-filter-chip">
        <input type="radio" name={name} value={option.value} defaultChecked={option.selected} />
        <span className="mk-filter-chip-label">{option.label}</span>
        <span className="mk-filter-chip-count">{option.count}</span>
      </label>
    ))}
  </fieldset>
)
