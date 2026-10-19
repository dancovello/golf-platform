import type { SearchKind } from '@/search/build'
import type { SearchResult, SearchSort, SearchWhen } from '@/search/query'
import { MAX_QUERY } from '@/search/words'

import { quickLinks } from '../components/quickLinks'
import { ArrowRight, Check, ChevronDown, Close, Search } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import type { ClubSite } from '../loadClub'
import { Pagination } from '../news/Pagination'
import { KIND_ORDER, KINDS } from './kinds'
import { RESULTS_PER_PAGE, type SearchFilters, type SearchView } from './load'
import { AnswerCard } from './AnswerCard'
import { ResultRow } from './ResultRow'

import '../blocks/blocks.css'
import '../components/buttons.css'
import '../news/news.css'
import './panel.css'
import './search.css'

/** The results address with these filters, so every view can be shared (spec §5). */
export const searchHref = (
  base: string,
  f: Partial<{
    q: string
    kind: SearchKind | null
    when: SearchWhen | null
    sort: SearchSort
    page: number
  }>,
) => {
  const params = new URLSearchParams()
  if (f.q) params.set('q', f.q)
  if (f.kind) params.set('type', KINDS[f.kind].param)
  if (f.when) params.set('when', f.when)
  if (f.sort === 'newest') params.set('sort', 'newest')
  if (f.page && f.page > 1) params.set('page', String(f.page))
  const query = params.toString()
  return `${base}/search${query ? `?${query}` : ''}`
}

const WHEN_LABELS: Record<SearchWhen, string> = {
  upcoming: 'Upcoming',
  past: 'Past 12 months',
  older: 'Older',
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six']

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Figma "Search/Field", Large: the search box at the top of the results page. */
const SearchField = ({ base, q }: { base: string; q: string }) => (
  <form className="srch-field" role="search" action={`${base}/search`} method="get">
    <Search size={22} />
    <label className="srch-visually-hidden" htmlFor="srch-q">
      Search the site
    </label>
    <input
      id="srch-q"
      className="srch-input"
      type="search"
      name="q"
      defaultValue={q}
      placeholder="Search the site"
      maxLength={MAX_QUERY}
      autoComplete="off"
      enterKeyHint="search"
    />
    {q ? (
      <a className="srch-clear t-label-s" href={`${base}/search`}>
        Clear <Close size={14} />
      </a>
    ) : null}
    <button className="srch-visually-hidden" type="submit">
      Search
    </button>
  </form>
)

/** Figma "Search/Results Tab": All, then each kind with results; empty kinds are hidden. */
const Tabs = ({
  base,
  filters,
  counts,
  total,
}: {
  base: string
  filters: SearchFilters
  counts: Record<SearchKind, number>
  total: number
}) => {
  const tabs: { kind: SearchKind | null; label: string; count: number }[] = [
    { kind: null, label: 'All', count: total },
    ...KIND_ORDER.filter((k) => counts[k] > 0 || filters.kind === k).map((k) => ({
      kind: k,
      label: KINDS[k].plural,
      count: counts[k],
    })),
  ]
  return (
    <nav className="srch-tabs" aria-label="Kinds of result">
      {tabs.map((t) => {
        const active = filters.kind === t.kind
        return (
          <a
            key={t.label}
            className={`srch-tab${active ? ' is-active' : ''}`}
            href={searchHref(base, { ...filters, kind: t.kind, page: 1 })}
            aria-current={active ? 'page' : undefined}
          >
            <span>{t.label}</span>
            <span className="srch-count t-label-s">
              {t.count}
              <span className="srch-visually-hidden"> results</span>
            </span>
          </a>
        )
      })}
    </nav>
  )
}

/** Figma "Search/Filter Option": a checkbox-style link with its count; 0 is dimmed. */
const FilterOption = ({
  href,
  label,
  count,
  checked,
}: {
  href: string
  label: string
  count: number
  checked: boolean
}) => (
  <a
    className={`srch-option${checked ? ' is-checked' : ''}${count === 0 && !checked ? ' is-empty' : ''}`}
    href={href}
    aria-current={checked ? 'true' : undefined}
  >
    <span className="srch-check" aria-hidden="true">
      {checked ? <Check size={12} /> : null}
    </span>
    <span className="t-body-s srch-option-label">{label}</span>
    <span className="t-label-s srch-option-count">{count}</span>
  </a>
)

const Refine = ({
  base,
  filters,
  counts,
  whenCounts,
}: {
  base: string
  filters: SearchFilters
  counts: Record<SearchKind, number>
  whenCounts: Record<SearchWhen, number>
}) => (
  <aside className="srch-refine" aria-label="Refine results">
    <p className="t-eyebrow srch-refine-title">Refine</p>
    <div className="srch-refine-group">
      <p className="t-label-s srch-refine-label">Type</p>
      {KIND_ORDER.map((k) => (
        <FilterOption
          key={k}
          label={KINDS[k].plural}
          count={counts[k]}
          checked={filters.kind === k}
          href={searchHref(base, { ...filters, kind: filters.kind === k ? null : k, page: 1 })}
        />
      ))}
    </div>
    <div className="srch-refine-group">
      <p className="t-label-s srch-refine-label">When</p>
      {(Object.keys(WHEN_LABELS) as SearchWhen[]).map((w) => (
        <FilterOption
          key={w}
          label={WHEN_LABELS[w]}
          count={whenCounts[w]}
          checked={filters.when === w}
          href={searchHref(base, { ...filters, when: filters.when === w ? null : w, page: 1 })}
        />
      ))}
    </div>
    <ContactHelp base={base} />
  </aside>
)

/** "Can't find it?": the club's contact page. */
const ContactHelp = ({ base }: { base: string }) => (
  <div className="srch-help">
    <h2 className="t-heading-m">Can’t find it?</h2>
    <p className="t-body-s">Ask the club and the team will point you to it.</p>
    <a
      className="btn btn-link t-label-button"
      href={siteHref(base, { kind: 'page', slug: 'contact' })}
    >
      Contact the club
      <ArrowRight />
    </a>
  </div>
)

/** Sort: Best match or Newest, as a small menu that works without JavaScript. */
const Sort = ({ base, filters }: { base: string; filters: SearchFilters }) => (
  <details className="srch-sort">
    <summary className="t-body-s">
      Sort by{' '}
      <span className="srch-sort-current">
        {filters.sort === 'newest' ? 'Newest' : 'Best match'}
      </span>
      <ChevronDown size={12} />
    </summary>
    <div className="srch-sort-menu">
      {(['best', 'newest'] as SearchSort[]).map((s) => (
        <a
          key={s}
          className="t-body-s"
          href={searchHref(base, { ...filters, sort: s, page: 1 })}
          aria-current={filters.sort === s ? 'true' : undefined}
        >
          {s === 'newest' ? 'Newest' : 'Best match'}
        </a>
      ))}
    </div>
  </details>
)

/** Up to three useful places and the office phone, for an empty or fruitless search. */
const Shortcuts = ({ club, base }: { club: ClubSite; base: string }) => {
  const links = quickLinks(club)
  const phone = club.header.phone ?? club.announcement?.phone ?? null
  return (
    <div className="srch-shortcuts">
      {links.length > 0 ? (
        <ul className="srch-shortcut-list">
          {links.map((l) => (
            <li key={l.label}>
              <a
                className="srch-shortcut t-body-m"
                href={siteHref(base, l.link)}
                {...linkTarget(l.link)}
              >
                {l.label}
                <ArrowRight size={16} />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {phone ? (
        <p className="t-body-s srch-phone">
          Or call the office on <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>.
        </p>
      ) : null}
    </div>
  )
}

const Group = ({
  base,
  filters,
  kind,
  count,
  results,
  words,
}: {
  base: string
  filters: SearchFilters
  kind: SearchKind
  count: number
  results: SearchResult[]
  words: string[]
}) => (
  <section className="srch-group" aria-labelledby={`srch-group-${kind}`}>
    <header className="srch-group-header">
      <h2 className="t-eyebrow srch-group-title" id={`srch-group-${kind}`}>
        {KINDS[kind].plural} <span className="t-label-s srch-group-count">{count}</span>
      </h2>
      {count > results.length ? (
        <a
          className="t-label-s srch-see-all"
          href={searchHref(base, { ...filters, kind, page: 1 })}
        >
          See all {count} {KINDS[kind].plural.toLowerCase()}
          <ArrowRight size={12} />
        </a>
      ) : null}
    </header>
    {results.map((r) => (
      <ResultRow key={`${r.kind}:${r.id}`} result={r} words={words} base={base} />
    ))}
  </section>
)

/**
 * The search results page (Figma "2.6 Results — all" to "2.9", "2.12 Mobile — results"): the
 * search box, a count and sort, tabs per kind, the results (two of each kind on "All") and a
 * column to refine them. Works without JavaScript: every view is a link or a plain form.
 */
export const SearchResults = ({
  club,
  base,
  view,
}: {
  club: ClubSite
  base: string
  view: SearchView
}) => {
  const { filters } = view

  if (view.state !== 'results') {
    return (
      <section className="srch-page">
        <div className="srch-inner">
          <h1 className="srch-visually-hidden">Search</h1>
          <SearchField base={base} q={filters.q} />
          {view.state === 'busy' ? (
            <p className="t-body-m srch-message" role="status">
              That’s a lot of searches in a minute. Please wait a moment and try again.
            </p>
          ) : (
            <div className="srch-start">
              <p className="t-heading-m">Search {club.name}</p>
              <p className="t-body-s srch-summary">
                Pages, news, events, courses, people and documents.
              </p>
              <Shortcuts club={club} base={base} />
            </div>
          )}
        </div>
      </section>
    )
  }

  const { counts, total, words, grouped, list, whenCounts, suggestion, answer } = view
  const kindsWithResults = KIND_ORDER.filter((k) => counts[k] > 0).length
  const summary =
    total === 0
      ? 'No results'
      : filters.kind
        ? plural(counts[filters.kind], 'result', 'results') +
          ` in ${KINDS[filters.kind].plural.toLowerCase()}`
        : kindsWithResults > 1
          ? `${plural(total, 'result', 'results')} across ${NUMBER_WORDS[kindsWithResults]} kinds of page`
          : plural(total, 'result', 'results')

  return (
    <section className="srch-page">
      <div className="srch-inner">
        <h1 className="srch-visually-hidden">Search results for “{filters.q}”</h1>
        <SearchField base={base} q={filters.q} />
        <div className="srch-summary-row">
          <p className="t-body-s srch-summary" role="status">
            <span className="srch-summary-wide">{summary}</span>
            <span className="srch-summary-narrow">
              {plural(total, 'result', 'results')} for “{filters.q}”
            </span>
          </p>
          {total > 0 ? <Sort base={base} filters={filters} /> : null}
        </div>

        {total === 0 && !filters.when && !filters.kind && !answer ? (
          <div className="srch-none">
            <h2 className="t-display-l srch-none-title">Nothing for “{filters.q}”</h2>
            {suggestion ? (
              <p className="t-body-l srch-suggest">
                Did you mean{' '}
                <a href={searchHref(base, { q: suggestion })}>
                  <strong>{suggestion}</strong>
                </a>
                ?
              </p>
            ) : (
              <p className="t-body-l srch-suggest">Try fewer or different words, or start here.</p>
            )}
            <Shortcuts club={club} base={base} />
          </div>
        ) : (
          <>
            {total > 0 ? (
              <Tabs base={base} filters={filters} counts={counts} total={total} />
            ) : null}
            <div className="srch-columns">
              <div className="srch-results">
                {total === 0 && !answer ? (
                  <p className="t-body-m srch-message">
                    Nothing matches these filters.{' '}
                    <a href={searchHref(base, { q: filters.q })}>Show every result</a>.
                  </p>
                ) : null}
                {answer ? <AnswerCard answer={answer} /> : null}
                {grouped?.groups.map((g) => (
                  <Group
                    key={g.kind}
                    base={base}
                    filters={filters}
                    kind={g.kind}
                    count={counts[g.kind]}
                    results={g.results}
                    words={words}
                  />
                ))}
                {list && filters.kind && list.results.length > 0 ? (
                  <>
                    <section className="srch-group" aria-label={KINDS[filters.kind].plural}>
                      {list.results.map((r) => (
                        <ResultRow
                          key={`${r.kind}:${r.id}`}
                          result={r}
                          words={words}
                          base={base}
                          headingLevel={2}
                        />
                      ))}
                    </section>
                    <Pagination
                      page={filters.page}
                      pages={Math.ceil(counts[filters.kind] / RESULTS_PER_PAGE)}
                      href={(page) => searchHref(base, { ...filters, page })}
                    />
                  </>
                ) : null}
              </div>
              <Refine base={base} filters={filters} counts={counts} whenCounts={whenCounts} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
