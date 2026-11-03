/**
 * Prospect demos: a club's site shown publicly, before the club has signed up, at
 * /demo/<club short name>-<random ending> (docs/operations/prospect-demos.md). Anyone with the
 * link can view it; nobody can guess another club's. A demo lasts 30 days, never goes in a
 * sitemap, and is always "noindex". Going live turns the demo off and gives the club its own
 * web address, whose pages search engines may index (src/site/resolveSite.ts).
 *
 * Kept free of Payload and the database so the proxy and tests can use it.
 */
import { randomInt } from 'node:crypto'

export const DEMO_DAYS = 30

/** No look-alike characters (no 0/o, 1/l/i): the link is easy to read out or retype. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const DEMO_TOKEN_LENGTH = 16

const DAY_MS = 86_400_000

/** The random ending of a demo address. 16 characters is about 79 bits: not guessable by trying. */
export const newDemoToken = (): string =>
  Array.from({ length: DEMO_TOKEN_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

/** When a demo made now stops working. */
export const demoExpiry = (from = new Date()): Date => new Date(from.getTime() + DEMO_DAYS * DAY_MS)

/** The address part after /demo/: the club's short name, a dash, then the random ending. */
export const demoAddress = (slug: string, token: string) => `${slug}-${token}`

export const demoBase = (slug: string, token: string) => `/demo/${demoAddress(slug, token)}`

const ADDRESS = new RegExp(`^([a-z0-9]+(?:-[a-z0-9]+)*)-([${ALPHABET}]{${DEMO_TOKEN_LENGTH}})$`)

/** Splits what was typed after /demo/ into a club short name and random ending, or null. */
export const parseDemoAddress = (value: unknown): { slug: string; token: string } | null => {
  if (typeof value !== 'string' || value.length > 200) return null
  const found = ADDRESS.exec(value)
  return found ? { slug: found[1]!, token: found[2]! } : null
}

/** Whole days left, counting today as a day: 0 only once it has run out. */
export const demoDaysLeft = (expiresAt: Date | string, now = new Date()): number =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / DAY_MS))

export const demoHasExpired = (expiresAt: Date | string | null | undefined, now = new Date()) =>
  !expiresAt || new Date(expiresAt).getTime() <= now.getTime()

/** The wording on the demo bar, e.g. "Demo - expires in 12 days". */
export const demoLabel = (expiresAt: Date | string, now = new Date()): string => {
  const days = demoDaysLeft(expiresAt, now)
  if (days <= 1) return 'Demo - expires today'
  return `Demo - expires in ${days} days`
}
