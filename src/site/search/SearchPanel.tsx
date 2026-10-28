'use client'

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { SearchKind } from '@/search/build'
import { MAX_QUERY, MIN_QUERY, searchWords } from '@/search/words'

import { ArrowRight, ArrowUpRight, Clock, Close, FileIcon, Search, User } from '../components/Icons'
import type { QuickAccess } from '@/search/answers'

import { AnswerCard } from './AnswerCard'
import { OPEN_SEARCH_EVENT } from './events'
import { Highlight } from './Highlight'

import './panel.css'
import { KINDS } from './kinds'
import type { PanelItem, PanelResults } from './panelData'
import { clearRecent, forgetSearch, readRecent, rememberSearch, whenSearched } from './recent'
import type { RecentSearch } from './recent'

/** Typing waits this long before searching (spec §3). */
const DEBOUNCE_MS = 120

export type PanelShortcut = { label: string; detail: string | null; href: string; newTab: boolean }

/**
 * The marketing site's picture of this panel (the Website builder page): the panel drawn in
 * place rather than over a page, typing `query` by itself and answering from sample club data
 * instead of the club's search. Nothing else about it differs.
 */
export type PanelDemo = {
  query: string
  quick: QuickAccess
  results: PanelResults
  /** False for visitors who prefer reduced motion: the query is shown typed already. Null
   * until that's known: the panel stays as it opens, with nothing searched. */
  animate: boolean | null
}

type Option = {
  id: string
  /** Identifies the row it belongs to (see row() below). */
  key: string
  /** Opens a page, or (recent searches) searches again. */
  href: string | null
  query?: string
  newTab?: boolean
}

type Fetched =
  | { state: 'idle' }
  | { state: 'loading'; q: string }
  | { state: 'done'; q: string; results: PanelResults }
  | { state: 'busy'; q: string }
  | { state: 'failed'; q: string }

/** The small picture at the start of a result row (Figma "Search/Suggestion", Result). */
const Lead = ({ item }: { item: PanelItem }) => {
  if (item.image && (item.kind === 'news' || item.kind === 'event' || item.kind === 'course')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
      <img
        className="sp-thumb"
        src={item.image.url}
        srcSet={item.image.srcSet ?? undefined}
        sizes="40px"
        alt=""
        style={{ objectPosition: item.image.position }}
      />
    )
  }
  const icon: Record<SearchKind, ReactNode> = {
    event: <Clock size={16} />,
    page: <ArrowUpRight size={16} />,
    news: <ArrowUpRight size={16} />,
    course: <ArrowUpRight size={16} />,
    person: <User size={16} />,
    document: <FileIcon size={16} />,
  }
  return (
    <span className="sp-tile" aria-hidden="true">
      {icon[item.kind]}
    </span>
  )
}

/**
 * The header search panel (Figma "Search/Dropdown", 2.1–2.5; phones "2.10–2.11"). A combobox:
 * the field has role=combobox and the results are one listbox of grouped options, moved through
 * with ↑ ↓ (aria-activedescendant) and opened with Enter; Enter with nothing picked opens the
 * full results page. Esc clears, a second Esc closes; Tab or a click outside closes. "/"
 * anywhere opens it. On phones it is a full-screen sheet with Cancel.
 */
export const SearchPanel = ({
  base,
  clubSlug,
  clubName,
  shortcuts,
  contact,
  phone,
  demo,
}: {
  base: string
  clubSlug: string
  clubName: string
  /** Useful places when there's nothing to show yet, or nothing matched. */
  shortcuts: PanelShortcut[]
  /** The club's contact page, offered when there's room or nothing matched. */
  contact: PanelShortcut
  phone: string | null
  demo?: PanelDemo
}) => {
  const [open, setOpen] = useState(Boolean(demo))
  const [query, setQuery] = useState('')
  const [fetched, setFetched] = useState<Fetched>({ state: 'idle' })
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [quick, setQuick] = useState<QuickAccess | null>(demo?.quick ?? null)
  const input = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [top, setTop] = useState(0)
  const uid = useId().replace(/:/g, '')
  const listID = `${uid}-list`
  const optionID = (i: number) => `${uid}-opt-${i}`

  const resultsHref = (q: string) => `${base}/search?q=${encodeURIComponent(q.trim())}`

  const close = useCallback(() => {
    setOpen(false)
    setActive(-1)
    returnFocus.current?.focus()
  }, [])

  // Opening: from the header buttons (an event) or "/" anywhere outside a text field.
  useEffect(() => {
    if (demo) return
    const show = () => {
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      const header = document.querySelector('.sh')
      setTop(Math.max(0, (header?.getBoundingClientRect().bottom ?? 0) + 16))
      setRecent(readRecent(clubSlug))
      setOpen(true)
      // Live values for quick access (course status, prices, hours, what's on), fresh each time.
      fetch(`${base}/search/suggest`, { headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? (r.json() as Promise<{ quick?: QuickAccess }>) : null))
        .then((data) => setQuick(data?.quick ?? null))
        .catch(() => setQuick(null))
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      show()
    }
    window.addEventListener(OPEN_SEARCH_EVENT, show)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, show)
      window.removeEventListener('keydown', onKey)
    }
  }, [clubSlug, base, demo])

  // While open: focus the field and keep the page behind still.
  useEffect(() => {
    if (!open || demo) return
    input.current?.focus()
    input.current?.select()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open, demo])

  // Searching as you type: from two characters, after a short pause, latest answer wins.
  const trimmed = query.trim()
  useEffect(() => {
    if (!open || trimmed.length < MIN_QUERY || searchWords(trimmed).length === 0) return
    if (demo) {
      // The sample answer arrives once the whole query is typed, as a real one would.
      if (trimmed !== demo.query) return
      const timer = window.setTimeout(
        () => setFetched({ state: 'done', q: trimmed, results: demo.results }),
        DEBOUNCE_MS,
      )
      return () => window.clearTimeout(timer)
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${base}/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (response.status === 429) {
          setFetched({ state: 'busy', q: trimmed })
          return
        }
        if (!response.ok) throw new Error(String(response.status))
        const results = (await response.json()) as PanelResults
        setFetched({ state: 'done', q: trimmed, results })
        setActive(-1)
        setAnnouncement(
          results.total === 0
            ? `No results for ${trimmed}`
            : `${results.total} ${results.total === 1 ? 'result' : 'results'}`,
        )
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          setFetched({ state: 'failed', q: trimmed })
        }
      }
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, trimmed, base, demo])

  // Demo: type the query a letter at a time, hold the answer, clear it and start again.
  useEffect(() => {
    if (!demo || demo.animate === null) return
    if (!demo.animate) {
      const shown = setTimeout(() => setQuery(demo.query), 0)
      return () => clearTimeout(shown)
    }
    let count = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      count = count > demo.query.length + 40 ? 0 : count + 1
      setQuery(demo.query.slice(0, Math.min(count, demo.query.length)))
      if (count === 0) setFetched({ state: 'idle' })
      timer = setTimeout(tick, count === 0 ? 900 : 90)
    }
    timer = setTimeout(tick, 900)
    return () => clearTimeout(timer)
  }, [demo])

  const typing = trimmed.length >= MIN_QUERY && searchWords(trimmed).length > 0
  // Earlier results stay on screen, with the spinner, until the answer for these words arrives.
  const current = fetched.state !== 'idle' && fetched.q === trimmed
  const results = typing && fetched.state === 'done' ? fetched.results : null
  const loading = typing && !current

  // Results in the order they're shown: events, pages and courses beside news, people and
  // documents (Figma 2.2), so ↑ ↓ follow the screen.
  const mainKinds: SearchKind[] = ['event', 'page', 'course']
  const shownGroups = results
    ? [
        ...results.groups.filter((g) => mainKinds.includes(g.kind)),
        ...results.groups.filter((g) => !mainKinds.includes(g.kind)),
      ]
    : []

  // Quick access: the booking and menu shortcuts, then the live values, then Contact if there's
  // room. "Try one of these" (nothing found): a couple of shortcuts and Contact.
  const quickRows = useMemo<PanelShortcut[]>(() => {
    const live = (quick?.items ?? []).flatMap((i) =>
      i.href ? [{ label: i.label, detail: i.detail, href: i.href, newTab: false }] : [],
    )
    const rows = [...shortcuts, ...live].slice(0, 5)
    return rows.length < 4 ? [...rows, contact] : rows
  }, [shortcuts, quick, contact])
  const tryRows = useMemo(() => [...shortcuts.slice(0, 2), contact], [shortcuts, contact])
  const events = useMemo(() => quick?.events ?? [], [quick])
  const answer = results?.answer ?? null

  // Every row the arrow keys move through, in reading order.
  const options = useMemo<Option[]>(() => {
    const list: Option[] = []
    const shortcut = (s: PanelShortcut) =>
      list.push({ id: '', key: `short:${s.label}`, href: s.href, newTab: s.newTab })
    if (!typing) {
      recent.forEach((r) => list.push({ id: '', key: `recent:${r.q}`, href: null, query: r.q }))
      quickRows.forEach(shortcut)
      events.forEach((e) => list.push({ id: '', key: `event:${e.title}:${e.when}`, href: e.href }))
    } else if (results) {
      const { best } = results
      if (best) list.push({ id: '', key: 'best', href: best.href, newTab: best.newTab })
      shownGroups.forEach((g) =>
        g.items.forEach((item) =>
          list.push({
            id: '',
            key: `${item.kind}:${item.id}`,
            href: item.href,
            newTab: item.newTab,
          }),
        ),
      )
      if (results.total === 0 && !results.answer) tryRows.forEach(shortcut)
    }
    return list.map((o, i) => ({ ...o, id: optionID(i) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shownGroups comes from results
  }, [typing, recent, quickRows, events, tryRows, results, uid])

  const go = (option: Option) => {
    if (option.query !== undefined) {
      setQuery(option.query)
      input.current?.focus()
      return
    }
    if (!option.href) return
    if (typing) rememberSearch(clubSlug, trimmed)
    if (option.newTab) window.open(option.href, '_blank', 'noopener,noreferrer')
    else window.location.assign(option.href)
  }

  const seeAll = () => {
    if (!typing) return
    rememberSearch(clubSlug, trimmed)
    window.location.assign(resultsHref(trimmed))
  }

  // A shorter list after new results: nothing picked.
  const activeIndex = active < options.length ? active : -1

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (options.length === 0) return
      e.preventDefault()
      // Wraps through every row and back to the field itself (-1).
      const n = options.length
      setActive((i) =>
        e.key === 'ArrowDown' ? (i + 1 >= n ? -1 : i + 1) : i - 1 < -1 ? n - 1 : i - 1,
      )
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) go(options[activeIndex])
      else seeAll()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) {
        setQuery('')
        setActive(-1)
      } else close()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      close()
    }
  }

  // Keep the picked row in view.
  useEffect(() => {
    if (active < 0) return
    document.getElementById(optionID(active))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionID only depends on uid
  }, [active])

  if (!open) return null

  const words = searchWords(trimmed)
  const row = (content: ReactNode, key: string, className = '') => {
    const i = options.findIndex((o) => o.key === key)
    const option = options[i]
    if (!option) return null
    return (
      <li
        key={option.id}
        id={option.id}
        role="option"
        aria-selected={activeIndex === i}
        className={`sp-option ${className}${activeIndex === i ? ' is-active' : ''}`}
        onMouseMove={() => setActive(i)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => go(option)}
      >
        {content}
      </li>
    )
  }
  const itemRow = (item: PanelItem, key: string, extra = '') =>
    row(
      <>
        <Lead item={item} />
        <span className="sp-text">
          <span className="sp-title">
            <Highlight text={item.title} words={words} />
          </span>
          {item.meta ? <span className="sp-meta t-label-s">{item.meta}</span> : null}
        </span>
        <span className="sp-kind t-data-label">{KINDS[item.kind].singular}</span>
      </>,
      key,
      extra,
    )
  const shortcutRows = (list: PanelShortcut[]) =>
    list.map((s) =>
      row(
        <>
          <span className="sp-tile" aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
          <span className="sp-text">
            <span className="sp-title">{s.label}</span>
            {s.detail ? <span className="sp-meta t-label-s">{s.detail}</span> : null}
          </span>
          <ArrowRight size={14} />
        </>,
        `short:${s.label}`,
      ),
    )
  const groupHeader = (id: string, label: string, count?: number, seeAllHref?: string) => (
    <div className="sp-group-header" role="presentation">
      <span className="t-eyebrow" id={id}>
        {label}
        {count !== undefined ? (
          <span className="t-label-s sp-count">
            <span aria-hidden="true">·</span>
            {count}
          </span>
        ) : null}
      </span>
      {seeAllHref ? (
        <a className="t-label-s sp-see-all" href={seeAllHref} tabIndex={-1}>
          See all
          <span className="srch-visually-hidden"> {label.toLowerCase()}</span>
          <ArrowRight size={12} />
        </a>
      ) : null}
    </div>
  )

  let body: ReactNode = null
  let intro: ReactNode = null
  if (!typing) {
    body = (
      <div className="sp-columns" role="presentation">
        <div className="sp-main" role="presentation">
          {recent.length > 0 ? (
            <div className="sp-group" role="group" aria-labelledby={`${uid}-recent`}>
              <div className="sp-group-header" role="presentation">
                <span className="t-eyebrow" id={`${uid}-recent`}>
                  Recent
                </span>
                <button
                  type="button"
                  className="t-label-s sp-see-all"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearRecent(clubSlug)
                    setRecent([])
                    input.current?.focus()
                  }}
                >
                  Clear <ArrowRight size={12} />
                </button>
              </div>
              <ul className="sp-list" role="presentation">
                {recent.map((r) =>
                  row(
                    <>
                      <span className="sp-icon" aria-hidden="true">
                        <Clock size={16} />
                      </span>
                      <span className="sp-text">
                        <span className="sp-title">{r.q}</span>
                        <span className="sp-meta t-label-s">{whenSearched(r.at)}</span>
                      </span>
                      <button
                        type="button"
                        className="sp-remove"
                        tabIndex={-1}
                        aria-label={`Remove “${r.q}” from recent searches`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          forgetSearch(clubSlug, r.q)
                          setRecent(readRecent(clubSlug))
                          input.current?.focus()
                        }}
                      >
                        <Close size={14} />
                      </button>
                    </>,
                    `recent:${r.q}`,
                  ),
                )}
              </ul>
            </div>
          ) : null}
          <div className="sp-group" role="group" aria-labelledby={`${uid}-quick`}>
            {groupHeader(`${uid}-quick`, 'Quick access')}
            <ul className="sp-list" role="presentation">
              {shortcutRows(quickRows)}
            </ul>
          </div>
        </div>
        {events.length > 0 && quick ? (
          <div className="sp-aside" role="presentation">
            <div className="sp-group" role="group" aria-labelledby={`${uid}-week`}>
              {groupHeader(`${uid}-week`, quick.eventsHeading)}
              <ul className="sp-list" role="presentation">
                {events.map((e) =>
                  row(
                    <>
                      {e.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
                        <img
                          className="sp-thumb"
                          src={e.image.url}
                          srcSet={e.image.srcSet ?? undefined}
                          sizes="40px"
                          alt=""
                          style={{ objectPosition: e.image.position }}
                        />
                      ) : (
                        <span className="sp-tile" aria-hidden="true">
                          <Clock size={16} />
                        </span>
                      )}
                      <span className="sp-text">
                        <span className="sp-title">{e.title}</span>
                        <span className="sp-meta t-label-s">{e.when}</span>
                      </span>
                      <span className="sp-kind t-data-label">Event</span>
                    </>,
                    `event:${e.title}:${e.when}`,
                  ),
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    )
  } else if (fetched.state === 'busy' && fetched.q === trimmed) {
    intro = (
      <p className="t-body-s sp-hint" role="status">
        That’s a lot of searches in a minute. Please wait a moment and try again.
      </p>
    )
  } else if (fetched.state === 'failed' && fetched.q === trimmed) {
    intro = (
      <p className="t-body-s sp-hint" role="status">
        Search isn’t working just now. Press Enter to try the full results page.
      </p>
    )
  } else if (results && results.total === 0 && !answer) {
    intro = (
      <div className="sp-none">
        <p className="sp-none-title">Nothing for “{results.query}”</p>
        {results.suggestion ? (
          <p className="t-body-s sp-suggest">
            Did you mean{' '}
            <button
              type="button"
              className="sp-suggest-link"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery(results.suggestion ?? '')}
            >
              {results.suggestion}
            </button>
            ?
          </p>
        ) : null}
      </div>
    )
    body = (
      <div className="sp-group" role="group" aria-labelledby={`${uid}-try`}>
        {groupHeader(`${uid}-try`, 'Try one of these')}
        <ul className="sp-list" role="presentation">
          {shortcutRows(tryRows)}
        </ul>
      </div>
    )
  } else if (results) {
    const group = (g: PanelResults['groups'][number]) => (
      <div key={g.kind} className="sp-group" role="group" aria-labelledby={`${uid}-g-${g.kind}`}>
        {groupHeader(
          `${uid}-g-${g.kind}`,
          KINDS[g.kind].plural,
          g.count,
          g.count > g.items.length
            ? `${base}/search?q=${encodeURIComponent(trimmed)}&type=${KINDS[g.kind].param}`
            : undefined,
        )}
        <ul className="sp-list" role="presentation">
          {g.items.map((item) => itemRow(item, `${item.kind}:${item.id}`))}
        </ul>
      </div>
    )
    const best = results.best
    // A smart answer takes the best match's place (spec §3), above the lists.
    if (answer) intro = <AnswerCard answer={answer} compact />
    body = (
      <div className="sp-columns" role="presentation">
        <div className="sp-main" role="presentation">
          {best ? (
            <div className="sp-group" role="group" aria-labelledby={`${uid}-best`}>
              {groupHeader(`${uid}-best`, 'Best match')}
              <ul className="sp-list" role="presentation">
                {itemRow(best, 'best', 'is-best')}
              </ul>
            </div>
          ) : null}
          {shownGroups.filter((g) => mainKinds.includes(g.kind)).map(group)}
        </div>
        {shownGroups.some((g) => !mainKinds.includes(g.kind)) ? (
          <div className="sp-aside" role="presentation">
            {shownGroups.filter((g) => !mainKinds.includes(g.kind)).map(group)}
          </div>
        ) : null}
      </div>
    )
  } else {
    intro = (
      <div className="sp-skeleton" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="sp-skeleton-row">
            <span />
            <span />
          </span>
        ))}
      </div>
    )
  }

  const total = results?.total ?? 0

  return (
    <div className={demo ? 'sp-layer is-demo' : 'sp-layer'}>
      {demo ? null : <div className="sp-scrim" onClick={close} aria-hidden="true" />}
      <div
        ref={panel}
        className="sp-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Search ${clubName}`}
        style={{ ['--sp-top' as string]: `${top}px` }}
      >
        <div className="sp-top">
          <form
            className="sp-field"
            role="search"
            action={`${base}/search`}
            method="get"
            onSubmit={(e) => {
              e.preventDefault()
              seeAll()
            }}
          >
            <span className="sp-field-icon" aria-hidden="true">
              {loading ? <span className="sp-spinner" /> : <Search size={22} />}
            </span>
            <input
              ref={input}
              className="sp-input"
              type="search"
              name="q"
              role="combobox"
              aria-label={`Search ${clubName}`}
              aria-expanded={options.length > 0}
              aria-controls={listID}
              aria-autocomplete="list"
              aria-activedescendant={
                active >= 0 && options[active] ? options[active].id : undefined
              }
              placeholder={`Search ${clubName}`}
              value={query}
              maxLength={MAX_QUERY}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {query ? (
              <button
                type="button"
                className="sp-clear t-label-s"
                aria-label="Clear the search"
                onClick={() => {
                  setQuery('')
                  input.current?.focus()
                }}
              >
                <span className="sp-clear-label">Clear</span> <Close size={14} />
              </button>
            ) : null}
            <kbd className="sp-key sp-esc">esc</kbd>
          </form>
          <button type="button" className="sp-cancel t-body-m" onClick={close}>
            Cancel
          </button>
        </div>
        <div className="sp-body">
          {intro}
          <div className="sp-listbox" id={listID} role="listbox" aria-label="Search suggestions">
            {body}
          </div>
          {typing && results && total > 0 ? (
            <a
              className="btn btn-solid t-label-button sp-see-all-mobile"
              href={resultsHref(trimmed)}
              onClick={() => rememberSearch(clubSlug, trimmed)}
            >
              See all {total} {total === 1 ? 'result' : 'results'}
              <ArrowRight />
            </a>
          ) : null}
        </div>
        <div className="sp-footer">
          <span className="sp-hints" aria-hidden="true">
            <span>
              <kbd className="sp-key">↑↓</kbd> Move
            </span>
            <span>
              <kbd className="sp-key">↵</kbd> Open
            </span>
            <span>
              <kbd className="sp-key">esc</kbd> Close
            </span>
          </span>
          {typing && results && total > 0 ? (
            <a
              className="t-label-button sp-see-everything"
              href={resultsHref(trimmed)}
              onClick={() => rememberSearch(clubSlug, trimmed)}
            >
              See all {total} {total === 1 ? 'result' : 'results'} for “{trimmed}”
              <kbd className="sp-key">↵</kbd>
            </a>
          ) : results && total === 0 && phone ? (
            <span className="t-label-s sp-still-stuck">
              Still stuck? The office can help:{' '}
              <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>
            </span>
          ) : null}
        </div>
        <p className="srch-visually-hidden" role="status" aria-live="polite">
          {typing ? announcement : ''}
        </p>
      </div>
    </div>
  )
}
