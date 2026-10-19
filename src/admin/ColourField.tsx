'use client'

import { TextInput, useField } from '@payloadcms/ui'
import type { ChangeEvent } from 'react'
import type { TextFieldClientComponent } from 'payload'

const HEX = /^#[0-9a-f]{6}$/i

/**
 * A brand colour in Club Settings: the usual colour-code box, with a swatch beside it that
 * opens the computer's colour picker (Dan, 2026-10-17). Picking a colour fills in the code;
 * typing a code updates the swatch. The code is still what's saved and checked.
 */
export const ColourField: TextFieldClientComponent = ({ field, path: pathFromProps }) => {
  const path = pathFromProps ?? field.name
  const { value, setValue, showError } = useField<string>({ path })
  const label = typeof field.label === 'string' ? field.label : field.name
  const swatch = typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : '#ffffff'

  return (
    <TextInput
      path={path}
      label={field.label}
      description={field.admin?.description}
      required={field.required}
      value={value ?? ''}
      showError={showError}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value.trim())}
      BeforeInput={
        <input
          type="color"
          className="brand-colour-swatch"
          aria-label={`Pick the ${label.toLowerCase()} colour`}
          value={swatch}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
        />
      }
    />
  )
}
