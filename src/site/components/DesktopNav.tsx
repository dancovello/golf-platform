'use client'

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type { DropdownStyle, LabelledLink, MenuItem } from '../loadClub'
import { ArrowRight, ChevronDown } from './Icons'
import { currentMenuIndex, linkTarget, siteHref } from './links'

/** Hover intent (spec 17): open after 80ms, close after 150ms. */
const OPEN_DELAY = 80
const CLOSE_DELAY = 150
/** Must match the close transition in header.css. */
const CLOSE_MS = 180

/** Up to 6 links a column, at most 3 columns (spec 17). */
export const dropdownColumns = (links: number) => Math.min(3, Math.max(1, Math.ceil(links / 6)))

/**
 * Top-level menu (Figma "Nav Item") with drop-down panels (Figma "Nav Dropdown / 1 · Panel" and
 * "2 · Panel + section tile", spec 17). Items with a drop-down are buttons: they open on click,
 * on a short hover, or with the down arrow (which also moves focus into the panel), and close
 * on Esc (focus returns to the button), a click outside, or when focus or the pointer leaves.
 *
 * One panel serves every section: it sits under the open item, with its text in line with the
 * item's label, and glides and resizes when another section opens. Every section's links are
 * in the page from the start, so they work for search engines and screen readers.
 */
export const DesktopNav = ({
  menu,
  base,
  currentPath,
  dropdown,
}: {
  menu: MenuItem[]
  base: string
  currentPath: string
  dropdown: DropdownStyle
}) => {
  // `open` is the section asked for; `shown` stays set while the panel fades out.
  const [open, setOpen] = useState<number | null>(null)
  const [shown, setShown] = useState<number | null>(null)
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number }>()
  // Opened from the keyboard: no motion (spec 17).
  const [instant, setInstant] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // A hover-then-click is one intention: the click keeps a hover-opened panel open.
  const openedByHover = useRef(false)
  const focusFirst = useRef(false)
  const lastY = useRef(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const currentIndex = currentMenuIndex(menu, base, currentPath)

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(fn, ms)
  }
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
  }

  // Keep the panel mounted for its close transition.
  useEffect(() => {
    if (open !== null) return
    const t = setTimeout(() => setShown(null), instant ? 0 : CLOSE_MS)
    return () => clearTimeout(t)
  }, [open, instant])

  // Place the panel under its item, then clamp it inside the header's container.
  useLayoutEffect(() => {
    if (open === null) return
    const place = () => {
      const button = buttons.current[open]
      const panel = panelRef.current
      const content = panel?.querySelector<HTMLElement>(`[data-section="${open}"]`)
      const frame = panel?.offsetParent
      const container = navRef.current?.closest('.sh-container')
      if (!button || !panel || !content || !frame || !container) return
      const b = button.getBoundingClientRect()
      const f = frame.getBoundingClientRect()
      const c = container.getBoundingClientRect()
      // The panel's size includes its border; its text sits 24px in, under the item's label.
      const border = (panel.offsetWidth - panel.clientWidth) / 2
      const width = content.offsetWidth + 2 * border
      const height = content.offsetHeight + 2 * border
      const left = Math.max(c.left, Math.min(b.left - 24 - border, c.right - width))
      setBox({ left: left - f.left, top: b.bottom - f.top + 8, width, height })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (open === null || !focusFirst.current) return
    focusFirst.current = false
    panelRef.current?.querySelector<HTMLElement>(`[data-section="${open}"] a`)?.focus()
  }, [open])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        buttons.current[open]?.focus()
        setOpen(null)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  useEffect(() => cancel, [])

  const show = (i: number | null, how: 'hover' | 'click' | 'key') => {
    cancel()
    openedByHover.current = how === 'hover' && i !== null
    setInstant(how === 'key')
    setOpen(i)
    if (i !== null) setShown(i)
  }

  const onItemEnter = (i: number | null, e: ReactMouseEvent) => {
    // Safe triangle, simply: heading down towards the open panel across another item doesn't
    // switch sections straight away, so the pointer can reach the panel diagonally.
    const towardsPanel = open !== null && i !== open && e.clientY > lastY.current
    later(() => show(i, 'hover'), towardsPanel ? CLOSE_DELAY : open === null ? OPEN_DELAY : 0)
  }

  // The section on screen: the one asked for, or the one fading out.
  const visible = open ?? shown

  return (
    <nav
      ref={navRef}
      className="sh-nav"
      aria-label="Main"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null)
      }}
      onMouseMove={(e) => {
        lastY.current = e.clientY
      }}
      onMouseLeave={() => later(() => show(null, 'hover'), CLOSE_DELAY)}
    >
      <ul className="sh-nav-list">
        {menu.map((item, i) => {
          const current = i === currentIndex
          if (item.children.length === 0) {
            const href = siteHref(base, item.link)
            return (
              <li key={i}>
                <a
                  className={`sh-nav-item t-nav${current ? ' is-current' : ''}`}
                  href={href}
                  aria-current={href === currentPath ? 'page' : undefined}
                  {...linkTarget(item.link)}
                  onMouseEnter={(e) => onItemEnter(null, e)}
                >
                  {item.label}
                </a>
              </li>
            )
          }
          return (
            <li key={i}>
              <button
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                className={`sh-nav-item t-nav${current ? ' is-current' : ''}`}
                aria-expanded={open === i}
                aria-controls={`${id}-panel-${i}`}
                onMouseEnter={(e) => onItemEnter(i, e)}
                onClick={(e) => {
                  // A keyboard "click" (Enter or Space) has no pointer position.
                  const how = e.detail === 0 ? 'key' : 'click'
                  const close = open === i && !openedByHover.current
                  show(close ? null : i, how)
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowDown') return
                  e.preventDefault()
                  focusFirst.current = true
                  show(i, 'key')
                }}
              >
                {item.label}
                <ChevronDown size={14} />
              </button>
            </li>
          )
        })}
      </ul>
      <div
        ref={panelRef}
        className={`sh-dd${open !== null ? ' is-open' : ''}${instant ? ' is-instant' : ''}`}
        hidden={visible === null}
        style={
          box
            ? ({
                '--dd-left': `${box.left}px`,
                '--dd-top': `${box.top}px`,
                '--dd-width': `${box.width}px`,
                '--dd-height': `${box.height}px`,
              } as CSSProperties)
            : undefined
        }
        onMouseEnter={cancel}
      >
        {menu.map((item, i) =>
          item.children.length === 0 ? null : (
            <Section
              key={i}
              id={`${id}-panel-${i}`}
              index={i}
              item={item}
              base={base}
              currentPath={currentPath}
              tile={dropdown === 'panelTile'}
              hidden={visible !== i}
            />
          ),
        )}
      </div>
    </nav>
  )
}

const Section = ({
  id,
  index,
  item,
  base,
  currentPath,
  tile,
  hidden,
}: {
  id: string
  index: number
  item: MenuItem
  base: string
  currentPath: string
  tile: boolean
  hidden: boolean
}) => {
  const link = (l: LabelledLink, className: string) => {
    const href = siteHref(base, l.link)
    return (
      <a
        className={className}
        href={href}
        aria-current={href === currentPath ? 'page' : undefined}
        {...linkTarget(l.link)}
      >
        <span>{l.label}</span>
        <ArrowRight size={14} />
      </a>
    )
  }
  // Two or three pages, one column each: the page as the column's heading, then its child pages.
  if (item.columns) {
    return (
      <div
        id={id}
        data-section={index}
        className={`sh-dd-section cols-${item.columns.length}`}
        hidden={hidden}
      >
        <div className="sh-dd-head">
          <p className="t-heading-m sh-dd-title">{item.label}</p>
        </div>
        <div className="sh-dd-cols">
          {item.columns.map((c, k) => (
            <div key={k} className="sh-dd-col">
              {link(c.heading, 't-label-s sh-dd-col-head')}
              <ul className="sh-dd-col-links">
                {c.links.map((l, j) => (
                  <li key={j}>{link(l, 't-nav sh-dd-link')}</li>
                ))}
                {c.more ? <li>{link(c.more, 't-label-s sh-dd-link sh-dd-more')}</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const columns = dropdownColumns(item.children.length)
  const overview = item.overview ? (
    <a className="t-label-s sh-dd-overview" href={siteHref(base, item.overview)}>
      Overview
      <ArrowRight size={14} />
    </a>
  ) : null
  return (
    <div
      id={id}
      data-section={index}
      className={`sh-dd-section${tile ? ' has-tile' : ''} cols-${columns}`}
      hidden={hidden}
    >
      {tile ? (
        <div className={`sh-dd-tile${item.image ? ' has-image' : ''}`}>
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
            <img
              src={item.image.url}
              srcSet={item.image.srcSet ?? undefined}
              sizes="236px"
              alt=""
              loading="lazy"
              style={{ objectPosition: item.image.position }}
            />
          ) : null}
          <p className="t-heading-m sh-dd-title">{item.label}</p>
          {overview}
        </div>
      ) : (
        <div className="sh-dd-head">
          <p className="t-heading-m sh-dd-title">{item.label}</p>
          {overview}
        </div>
      )}
      <ul className="sh-dd-links">
        {item.children.map((l, k) => (
          <li key={k}>{link(l, 't-nav sh-dd-link')}</li>
        ))}
      </ul>
    </div>
  )
}
