'use client'

import { TextInput, useField } from '@payloadcms/ui'
import { useState, type ChangeEvent } from 'react'
import type { TextFieldClientComponent, UIFieldClientComponent } from 'payload'

import { BRAND_INPUTS, type BrandInput } from '../theme/colour'
import { CURATED_SHADES, READY_MADE_PALETTES } from '../theme/curatedColours'

const HEX = /^#[0-9a-f]{6}$/i

const isBrandInput = (name: string): name is BrandInput =>
  (BRAND_INPUTS as readonly string[]).includes(name)

/**
 * A brand colour in Club Settings: the colour-code box with a preview swatch, and underneath
 * a choice of shades we know look good (src/theme/curatedColours.ts). Picking a shade fills
 * in the code. A club with its own brand colours types the code instead (Dan, 2026-10-20).
 * The code is still what's saved and checked.
 */
export const ColourField: TextFieldClientComponent = ({ field, path: pathFromProps }) => {
  const path = pathFromProps ?? field.name
  const { value, setValue, showError } = useField<string>({ path })
  const label = typeof field.label === 'string' ? field.label : field.name
  const current = typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : undefined
  const families = isBrandInput(field.name) ? CURATED_SHADES[field.name] : []
  const [open, setOpen] = useState(
    () =>
      families.find((f) => current && f.shades.includes(current))?.family ?? families[0]?.family,
  )
  const shades = families.find((f) => f.family === open)?.shades ?? []

  return (
    <div className="brand-colour">
      <TextInput
        path={path}
        label={field.label}
        description={field.admin?.description}
        required={field.required}
        value={value ?? ''}
        showError={showError}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value.trim())}
        BeforeInput={
          <span
            className="brand-colour-swatch"
            aria-hidden="true"
            style={{ background: current ?? 'transparent' }}
          />
        }
      />
      {families.length > 0 ? (
        <div
          className="brand-colour-choices"
          role="group"
          aria-label={`Suggested ${label.toLowerCase()} colours`}
        >
          <div className="brand-colour-families">
            {families.map((f) => (
              <button
                key={f.family}
                type="button"
                className="brand-colour-family"
                aria-pressed={f.family === open}
                onClick={() => setOpen(f.family)}
              >
                {f.family}
              </button>
            ))}
          </div>
          <div className="brand-colour-shades">
            {shades.map((shade) => (
              <button
                key={shade}
                type="button"
                className="brand-colour-shade"
                style={{ background: shade }}
                aria-label={`Use ${shade}`}
                aria-pressed={shade === current}
                title={shade}
                onClick={() => setValue(shade)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** "Start from a ready-made palette": one click sets all five brand colours. */
export const PalettePicker: UIFieldClientComponent = () => {
  const fields = {
    primary: useField<string>({ path: 'branding.primary' }),
    secondary: useField<string>({ path: 'branding.secondary' }),
    accent: useField<string>({ path: 'branding.accent' }),
    light: useField<string>({ path: 'branding.light' }),
    dark: useField<string>({ path: 'branding.dark' }),
  }
  const isCurrent = (brand: Record<BrandInput, string>) =>
    BRAND_INPUTS.every((key) => String(fields[key].value ?? '').toUpperCase() === brand[key])

  return (
    <div className="brand-palettes">
      <p className="brand-palettes__label">Start from a ready-made palette</p>
      <p className="field-description">
        Each one sets all five colours below. You can then change any of them.
      </p>
      <div className="brand-palettes__list">
        {READY_MADE_PALETTES.map(({ name, brand }) => (
          <button
            key={name}
            type="button"
            className="brand-palette"
            aria-pressed={isCurrent(brand)}
            onClick={() => BRAND_INPUTS.forEach((key) => fields[key].setValue(brand[key]))}
          >
            <span className="brand-palette__strip" aria-hidden="true">
              {BRAND_INPUTS.map((key) => (
                <span key={key} style={{ background: brand[key] }} />
              ))}
            </span>
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
