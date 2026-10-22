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
