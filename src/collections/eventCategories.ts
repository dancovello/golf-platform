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
