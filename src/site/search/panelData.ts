import type { Answer } from '@/search/answers'
import type { SearchKind } from '@/search/build'
import type { GroupedSearch, SearchResult } from '@/search/query'

import { siteHref } from '../components/links'
import { resultMeta } from './kinds'

// No server-only imports: the header search panel (browser) uses these types.

/** One row in the header panel: only what it shows (never an email address or page text). */
export type PanelItem = {
  kind: SearchKind
  id: string
  title: string
  meta: string
  href: string
  /** Documents and other websites open in a new tab. */
  newTab: boolean
  image: { url: string; srcSet: string | null; position: string } | null
}

export type PanelResults = {
  query: string
  best: PanelItem | null
  groups: { kind: SearchKind; count: number; items: PanelItem[] }[]
  total: number
  suggestion: string | null
  /** A smart answer, shown in place of the best match (spec §3). Never an email address. */
  answer: Answer | null
}

const toItem = (r: SearchResult, base: string): PanelItem => ({
  kind: r.kind,
  id: r.id,
  title: r.title,
  meta: resultMeta(r),
  href: siteHref(base, r.link),
  newTab: r.kind === 'document' || (r.link.kind === 'url' && /^https?:\/\//i.test(r.link.href)),
  image: r.details.image
    ? {
        url: r.details.image.url,
        srcSet: r.details.image.srcSet,
        position: r.details.image.position,
      }
    : null,
})

/** The header panel's view of a search (spec §3: best match, then up to two of each kind). */
export const toPanelResults = (
  s: GroupedSearch,
  base: string,
  answer: Answer | null = null,
): PanelResults => ({
  query: s.query,
  // The answer takes the best match's place.
  best: s.best && !answer ? toItem(s.best, base) : null,
  answer: answer ? { ...answer, email: null } : null,
  groups: s.groups.map((g) => ({
    kind: g.kind,
    count: s.counts[g.kind],
    items: g.results.map((r) => toItem(r, base)),
  })),
  total: s.total,
  suggestion: s.suggestion,
})
