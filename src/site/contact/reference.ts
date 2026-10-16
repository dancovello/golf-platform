import { randomInt } from 'node:crypto'

const SKIP = new Set(['golf', 'the', 'and', 'of', '&'])

/** The club part of a reference: initials of its name, e.g. Heathcote Golf Club → "HC". */
export const referencePrefix = (clubName: string) => {
  const initials = clubName
    .split(/[\s-]+/)
    .filter((w) => w && !SKIP.has(w.toLowerCase()))
    .map((w) => w.replace(/[^a-z]/gi, '').charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 3)
  return initials || 'CL'
}

/** e.g. "HC-ENQ-4821". Random, so it says nothing about how many messages a club gets. */
export const newReference = (clubName: string, digits = 4) =>
  `${referencePrefix(clubName)}-ENQ-${randomInt(10 ** (digits - 1), 10 ** digits)}`
