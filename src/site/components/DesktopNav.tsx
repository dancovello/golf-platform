'use client'

import { useEffect, useId, useRef, useState } from 'react'

import type { MenuItem } from '../loadClub'
import { ChevronDown } from './Icons'
import { isExternal, siteHref } from './links'

/**
 * Top-level menu (Figma "Nav Item") with drop-down link groups (Figma "Mega Menu", 1.2).
 * Items with groups are buttons: they open on click, or after hovering for 150ms, and close
 * on Esc (focus returns to the button), on a click outside, or when focus leaves the menu.
 */
export const DesktopNav = ({
  menu,
  base,
  currentPath,
}: {
  menu: MenuItem[]
  base: string
  currentPath: string
}) => {
  const [open, setOpen] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Whether the open menu was opened by hovering: a click then keeps it open rather than
  // closing it, since a hover-then-click is one intention.
  const openedByHover = useRef(false)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()

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

  const hover = (i: number | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      openedByHover.current = i !== null
      setOpen(i)
    }, 150)
  }

  const isCurrent = (item: MenuItem) => {
    const hrefs = [
      ...(item.link ? [siteHref(base, item.link)] : []),
      ...item.groups.flatMap((g) => g.links.map((l) => siteHref(base, l.link))),
    ]
    return hrefs.some((h) => h === currentPath)
  }

  return (
    <nav
      ref={navRef}
      className="sh-nav"
      aria-label="Main"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null)
      }}
      onMouseLeave={() => hover(null)}
    >
      <ul className="sh-nav-list">
        {menu.map((item, i) => {
          const current = isCurrent(item)
          if (item.groups.length === 0) {
            const href = siteHref(base, item.link)
            return (
              <li key={i}>
                <a
                  className={`sh-nav-item t-nav${current ? ' is-current' : ''}`}
                  href={href}
                  aria-current={href === currentPath ? 'page' : undefined}
                  {...(isExternal(item.link) ? { rel: 'noopener' } : {})}
                  onMouseEnter={() => hover(null)}
                >
                  {item.label}
                </a>
              </li>
            )
          }
          const panelId = `${id}-panel-${i}`
          return (
            <li key={i} onMouseEnter={() => hover(i)}>
              <button
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                className={`sh-nav-item t-nav${current ? ' is-current' : ''}`}
                aria-expanded={open === i}
                aria-controls={panelId}
                onClick={() => {
                  if (hoverTimer.current) clearTimeout(hoverTimer.current)
                  const close = open === i && !openedByHover.current
                  openedByHover.current = false
                  setOpen(close ? null : i)
                }}
              >
                {item.label}
                <ChevronDown size={14} />
              </button>
              <div id={panelId} className="sh-mega" hidden={open !== i}>
                <div className="sh-mega-inner">
                  {item.groups.map((group, g) => (
                    <div key={g} className="sh-mega-group">
                      <p className="t-eyebrow sh-mega-heading">{group.heading}</p>
                      <ul>
                        {group.links.map((l, k) => {
                          const href = siteHref(base, l.link)
                          return (
                            <li key={k}>
                              <a
                                className="t-body-m sh-mega-link"
                                href={href}
                                aria-current={href === currentPath ? 'page' : undefined}
                                {...(isExternal(l.link) ? { rel: 'noopener' } : {})}
                              >
                                {l.label}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
