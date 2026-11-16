/** Course status states (Figma "Course Status"). Dots use system colours, always with words. */
export const STATUS_STATES = [
  { label: 'Open', value: 'open' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'Closed', value: 'closed' },
] as const

export type StatusState = (typeof STATUS_STATES)[number]['value']

/** After this long without a change the site says the status may be out of date (doc 05). */
export const STATUS_STALE_HOURS = 24

/**
 * Planned notices (G4, 15 Nov 2026). Their values are status states, so they share the dots:
 * a closure is red, a restriction amber, information green.
 */
export const NOTICE_KINDS = [
  { label: 'Closure', value: 'closed' },
  { label: 'Restriction', value: 'restricted' },
  { label: 'Information', value: 'open' },
] as const

/** Notices show as "coming up" this many days before they start. */
export const NOTICE_LEAD_DAYS = 30
