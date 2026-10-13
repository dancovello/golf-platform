/** Course status states (Figma "Course Status"). Dots use system colours, always with words. */
export const STATUS_STATES = [
  { label: 'Open', value: 'open' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'Closed', value: 'closed' },
] as const

export type StatusState = (typeof STATUS_STATES)[number]['value']

/** After this long without a change the site says the status may be out of date (doc 05). */
export const STATUS_STALE_HOURS = 24
