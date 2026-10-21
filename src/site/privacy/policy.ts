/**
 * The facts every club's privacy policy is written from (src/site/privacy/PrivacyPolicy.tsx).
 * The wording lives in code, not in the CMS, so a club can't edit or delete it; changing the
 * template changes every club at once.
 */

import { BRAND } from '../../brand'
import { turnstileSiteKey } from '../contact/turnstile'

/** The platform company named as the clubs' processor (src/brand.ts; the name isn't chosen yet). */
export const PLATFORM_NAME = BRAND.name

/** When the template last changed. Update it with every wording change: all clubs follow. */
export const POLICY_LAST_UPDATED = '2026-10-21'

/** How long each kind of information is kept. One list, so it can become per-club later. */
export const RETENTION = {
  enquiries:
    '12 months after we mark it answered, or 12 months after it arrives if it is never marked answered',
  newsletter: 'Until you unsubscribe',
  accounts: 'While your account is open, then 2 years',
  bookings: '6 years, for accounting and tax',
  serverLogs: 'Up to 30 days',
  ga: '14 months',
} as const

/** What a club uses. Each switches a part of the policy on. */
export type PolicyFeatures = {
  newsletter: boolean
  /** Member login. Not built yet (out of scope for v1), so always off. */
  accounts: boolean
  /** The booking portal. Not built yet (out of scope for v1), so always off. */
  bookings: boolean
  /** Stripe. Not built yet (out of scope for v1), so always off. */
  payments: boolean
  ga: boolean
  /** Cloudflare's spam check on the Contact form (src/site/contact/turnstile.ts). */
  spamCheck: boolean
}

/** Everything the policy says about one club, with the fallbacks already applied. */
export type PolicyFacts = {
  clubName: string
  legalName: string
  /** The postal address, or null until the club adds one. */
  address: string | null
  /** Where privacy requests go, or null until the club adds an email. */
  privacyEmail: string | null
  phone: string | null
  newsletterProvider: string
  /** The club's extra section (rich text), or null when it has nothing in it. */
  additionalInfo: unknown
  features: PolicyFeatures
}

export type PrivacySettings = {
  legalName: string | null
  email: string | null
  newsletterProvider: string | null
  gaMeasurementId: string | null
  additionalInfo: unknown
}

const GA_ID = /^G-[A-Z0-9]{4,15}$/

/** A Google Analytics 4 measurement ID, e.g. G-AB12CD34EF. Checked again before it's used. */
export const isGAMeasurementID = (value: unknown): value is string =>
  typeof value === 'string' && GA_ID.test(value.trim())

/** Whether a rich-text value has any words in it (an emptied editor leaves blank paragraphs). */
export const hasText = (value: unknown): boolean => {
  const walk = (node: { text?: unknown; children?: unknown } | undefined): boolean =>
    !!node &&
    ((typeof node.text === 'string' && node.text.trim() !== '') ||
      (Array.isArray(node.children) && node.children.some(walk)))
  return walk((value as { root?: { children?: unknown } } | null)?.root)
}

/** The policy's facts for one club, from its settings, with the fallbacks from the brief. */
export const policyFacts = (club: {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  privacy: PrivacySettings
}): PolicyFacts => {
  const p = club.privacy
  return {
    clubName: club.name,
    legalName: p.legalName || club.name,
    address: club.address,
    privacyEmail: p.email || club.email,
    phone: club.phone,
    newsletterProvider: p.newsletterProvider || 'our email marketing provider',
    additionalInfo: hasText(p.additionalInfo) ? p.additionalInfo : null,
    features: {
      // There's no newsletter sign-up on the site yet (it waits for the email provider), so
      // naming a newsletter service is what turns this on.
      newsletter: !!p.newsletterProvider,
      accounts: false,
      bookings: false,
      payments: false,
      ga: isGAMeasurementID(p.gaMeasurementId),
      spamCheck: turnstileSiteKey() !== null,
    },
  }
}

/** "15 October 2026" */
export const formatPolicyDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`))
