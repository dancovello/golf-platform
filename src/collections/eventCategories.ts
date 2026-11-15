/** Event categories, in the order the archive's filter pills show them. A plain module so the
 * website can use it without loading the CMS. */
export const EVENT_CATEGORIES = [
  { label: 'Social', value: 'social' },
  { label: 'Dining', value: 'dining' },
  { label: 'Competitions', value: 'competition' },
  { label: 'Academy', value: 'academy' },
  { label: 'Members only', value: 'members' },
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]['value']

export const eventCategoryLabel = (value: string | null | undefined) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? 'Event'

/**
 * Who can enter a competition (G3, 15 Nov 2026). "Ladies" on the website, as clubs say it;
 * the value stays "women" like the tees.
 */
export const EVENT_ENTRANTS = [
  { label: 'Men', value: 'men' },
  { label: 'Ladies', value: 'women' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Juniors', value: 'juniors' },
  { label: 'Seniors', value: 'seniors' },
] as const

export type EventEntrant = (typeof EVENT_ENTRANTS)[number]['value']

export const eventEntrantLabel = (value: string) =>
  EVENT_ENTRANTS.find((c) => c.value === value)?.label ?? value
