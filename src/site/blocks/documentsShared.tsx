import { DOCUMENT_CATEGORIES } from '@/collections/documentCategories'

import type { SiteDocument } from './resolve'

// No server-only imports here: DocumentLibrary (browser) uses this file.

export const categoryName = (value: string) =>
  DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? 'Other'

export const reviewedDate = (iso: string | null, style: 'long' | 'short') =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: style === 'long' ? 'numeric' : undefined,
        month: style === 'long' ? 'long' : 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

/** Doc 05: a policy not reviewed for 12 months is flagged, never hidden. */
export const isOverdue = (doc: SiteDocument, today: Date) =>
  Boolean(doc.lastReviewed) &&
  today.getTime() - new Date(doc.lastReviewed as string).getTime() > 365 * 24 * 60 * 60 * 1000

export const downloadLabel = (doc: SiteDocument) =>
  `Download ${doc.title} (${[doc.type, doc.size].filter(Boolean).join(', ')})`

export type DocRow = SiteDocument & {
  categoryName: string
  reviewed: string | null
  overdue: boolean
}
