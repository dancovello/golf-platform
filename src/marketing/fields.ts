import type { Validate } from 'payload'

/** Word limits from the marketing block rules (Figma "CMS block rules"; doc 19). */
export const maxWords =
  (limit: number, required = false): Validate =>
  (value: unknown) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return required ? 'This is required.' : true
    const words = text.split(/\s+/).length
    return words <= limit ? true : `Keep this to ${limit} words or fewer (it has ${words}).`
  }
