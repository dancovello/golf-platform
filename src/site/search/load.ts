import { headers } from 'next/headers'

import { type Answer, findAnswer } from '@/search/answers'
import type { SearchKind } from '@/search/build'
import {
  type GroupedSearch,
  type SearchPage,
  type SearchSort,
  type SearchWhen,
  WHEN_OPTIONS,
  searchClub,
  searchGrouped,
  searchWhenCounts,
} from '@/search/query'
import { allowSearch, visitorKey } from '@/search/rateLimit'
import { searchWords, tidyQuery } from '@/search/words'

import type { ClubSite } from '../loadClub'
import { kindFromParam } from './kinds'

/** Results on one page of a single kind's tab. */
export const RESULTS_PER_PAGE = 20
/** Results of each kind on the "All" tab before "See all". */
export const PER_KIND_ON_ALL = 2

export type SearchFilters = {
  q: string
  kind: SearchKind | null
  when: SearchWhen | null
  sort: SearchSort
  page: number
}

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)

/** The filters in the address (/search?q=twilight&type=events&when=upcoming), tidied. */
export const readFilters = (query: Record<string, string | string[] | undefined>) => {
  const when = one(query.when)
  return {
    q: tidyQuery(one(query.q)),
    kind: kindFromParam(one(query.type)),
    when: WHEN_OPTIONS.find((w) => w === when) ?? null,
    sort: one(query.sort) === 'newest' ? 'newest' : 'best',
    page: Math.min(Math.max(Number.parseInt(one(query.page) ?? '1', 10) || 1, 1), 50),
  } satisfies SearchFilters
}

export type SearchView =
  | { state: 'empty'; filters: SearchFilters }
  | { state: 'busy'; filters: SearchFilters }
  | {
      state: 'results'
      filters: SearchFilters
      words: string[]
      /** "All": up to two of each kind. */
      grouped: GroupedSearch | null
      /** One kind: a page of results. */
      list: SearchPage | null
      counts: GroupedSearch['counts']
      total: number
      whenCounts: Record<SearchWhen, number>
      suggestion: string | null
      /** "Top answer" above the results, on the All tab (spec §4). */
      answer: Answer | null
    }

/** Everything the results page shows for these filters, for one club. */
export const loadSearch = async (
  club: ClubSite,
  base: string,
  filters: SearchFilters,
): Promise<SearchView> => {
  const tenantID = club.tenantID
  const words = searchWords(filters.q)
  if (filters.q.length < 2 || words.length === 0) return { state: 'empty', filters }
  if (!allowSearch(visitorKey(await headers()))) return { state: 'busy', filters }

  const [grouped, list, whenCounts, answer] = await Promise.all([
    filters.kind
      ? Promise.resolve(null)
      : searchGrouped(tenantID, filters.q, {
          perKind: PER_KIND_ON_ALL,
          when: filters.when,
          sort: filters.sort,
        }),
    filters.kind
      ? searchClub(tenantID, filters.q, {
          kind: filters.kind,
          when: filters.when,
          sort: filters.sort,
          limit: RESULTS_PER_PAGE,
          offset: (filters.page - 1) * RESULTS_PER_PAGE,
        })
      : Promise.resolve(null),
    searchWhenCounts(tenantID, filters.q, filters.kind),
    filters.kind || filters.when ? Promise.resolve(null) : findAnswer(club, base, filters.q),
  ])
  const counts = (grouped ?? list)!.counts
  return {
    state: 'results',
    filters,
    words,
    grouped,
    list,
    counts,
    total: (grouped ?? list)!.total,
    whenCounts,
    suggestion: (grouped ?? list)!.suggestion,
    answer,
  }
}
