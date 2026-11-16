/**
 * Extra questions a club can switch on for a Contact page topic (feature gap G5, 15 Nov 2026):
 * what visitor, society and event enquiries asked on the 50 audited club sites. A fixed set,
 * not a form builder. Date of birth and postal address are left out on purpose: the form only
 * collects what the club needs to reply. A plain module so the website can use it without
 * loading the CMS.
 */
export const ENQUIRY_EXTRAS = [
  { key: 'course', label: 'Which course', kind: 'text', max: 40 },
  { key: 'organisation', label: 'Society or company name', kind: 'text', max: 80 },
  { key: 'caddies', label: 'Caddies', kind: 'count', max: 50 },
  { key: 'buggies', label: 'Buggies', kind: 'count', max: 50 },
  { key: 'trolleys', label: 'Trolleys', kind: 'count', max: 100 },
  { key: 'hireClubs', label: 'Sets of hire clubs', kind: 'count', max: 100 },
  { key: 'catering', label: 'Food and dietary needs', kind: 'long', max: 300 },
  { key: 'heardFrom', label: 'How did you hear about us', kind: 'text', max: 80 },
] as const

export type ExtraKey = (typeof ENQUIRY_EXTRAS)[number]['key']

export const EXTRA_KEYS = ENQUIRY_EXTRAS.map((e) => e.key) as ExtraKey[]

export const extraFor = (key: string) => ENQUIRY_EXTRAS.find((e) => e.key === key)

export const isExtraKey = (value: unknown): value is ExtraKey =>
  typeof value === 'string' && EXTRA_KEYS.includes(value as ExtraKey)

/** The select options for Club Settings. */
export const EXTRA_OPTIONS = ENQUIRY_EXTRAS.map((e) => ({ label: e.label, value: e.key }))
