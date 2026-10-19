import type { SearchKind } from '@/search/build'

// No server-only imports: the header search panel (browser) uses this too.

/** How each kind of result is named and what its row's shortcut says (spec §2). */
export const KINDS: Record<
  SearchKind,
  { param: string; plural: string; singular: string; action: string }
> = {
  event: { param: 'events', plural: 'Events', singular: 'Event', action: 'View' },
  page: { param: 'pages', plural: 'Pages', singular: 'Page', action: 'Open' },
  news: { param: 'news', plural: 'News', singular: 'News', action: 'Read' },
  course: { param: 'courses', plural: 'Courses', singular: 'Course', action: 'View course' },
  person: { param: 'people', plural: 'People', singular: 'Person', action: 'Open' },
  document: { param: 'documents', plural: 'Documents', singular: 'Document', action: 'Download' },
}

/** The order results are always shown in (spec §2). */
export const KIND_ORDER: SearchKind[] = ['event', 'page', 'news', 'course', 'person', 'document']

/** "events" in the address → "event". */
export const kindFromParam = (value: unknown): SearchKind | null =>
  KIND_ORDER.find((k) => KINDS[k].param === value) ?? null

const UK = 'Europe/London'

/** "Thu 23 Apr, 17:00" */
export const eventWhen = (iso: string) => {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: UK,
  })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: UK })
  return `${day.replace(',', '')}, ${time}`
}

/** "2 April 2026" */
export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: UK,
  })

/** "March 2026" */
export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: UK })

/** The small line beside the kind, e.g. "Thu 23 Apr, 17:00 · Competition" or a person's role. */
export const resultMeta = (r: {
  kind: SearchKind
  eyebrow: string | null
  date: string | null
  details: { fileType?: string; fileSize?: string }
}): string => {
  switch (r.kind) {
    case 'event':
      return [r.date ? eventWhen(r.date) : null, r.eyebrow].filter(Boolean).join(' · ')
    case 'news':
      return r.date ? longDate(r.date) : (r.eyebrow ?? '')
    case 'document':
      return [
        r.details.fileType,
        r.details.fileSize,
        r.date ? `Reviewed ${monthYear(r.date)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    default:
      return r.eyebrow ?? ''
  }
}
