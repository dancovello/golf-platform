import type { Validate } from 'payload'

import { isSafeURL } from '../fields/link'

/** Word limits from the marketing block rules (Figma "CMS block rules"; doc 19). */
export const maxWords =
  (limit: number, required = false): Validate =>
  (value: unknown) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return required ? 'This is required.' : true
    const words = text.split(/\s+/).length
    return words <= limit ? true : `Keep this to ${limit} words or fewer (it has ${words}).`
  }

/** A marketing link: a page on this site ("/pricing") or a safe web address. */
export const marketingHref: Validate = (value: unknown) => {
  if (!value) return true
  if (typeof value !== 'string') return 'Enter an address.'
  if (/^\/[a-z0-9\-/]*$/.test(value) || isSafeURL(value)) return true
  return 'Use a page on this site, like /pricing, or a full address starting with https://.'
}

/**
 * Values copy may refer to, filled from the marketing settings by src/marketing/tokens.ts.
 * Kept here, free of app imports, because block definitions load inside the Payload config.
 */
export const TOKEN_HELP =
  'Use {price}, {vat}, {term} (months) and {notice} (days) for values from Settings, so they always match.'

/** Refuses a price typed straight into copy: use {price}. */
export const noTypedPrices = (value: unknown) =>
  typeof value === 'string' && /£\s?\d/.test(value)
    ? 'Use {price} for the monthly price, so it always matches the settings.'
    : true
