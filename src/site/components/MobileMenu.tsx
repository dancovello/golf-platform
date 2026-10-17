'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import type { MenuItem } from '../loadClub'
import { ChevronLeft, ChevronRight, Close, Menu, Phone } from './Icons'
import { linkTarget, siteHref } from './links'

/**
 * Mobile menu button and drawer (Figma 1.3 Menu Drawer / 1.4 Sub-menu). A modal dialog:
 * focus stays inside, the page behind doesn't scroll, and Esc or Close returns focus to the
 * menu button. Sections with link groups open a sub-menu with a back link.
 */
export const MobileMenu = ({
  menu,
  base,
  currentPath,
  logo,
  phone,
  bookButton,
}: {
  menu: MenuItem[]
  base: string
  currentPath: string
  logo: ReactNode
  phone: string | null
  bookButton: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<number | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    setSection(null)
    trigger.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('button, a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key !== 'Tab' || !dialog.current) return
      const items = [...dialog.current.querySelectorAll<HTMLElement>('a[href], button')]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open)
      dialog.current
        ?.querySelector<HTMLElement>('.sh-drawer-body button, .sh-drawer-body a')
        ?.focus()
  }, [section, open])

  const link = (label: string, l: MenuItem['link'], className: string) => {
    const href = siteHref(base, l)
    return (
      <a
        className={className}
        href={href}
        aria-current={href === currentPath ? 'page' : undefined}
        onClick={() => setOpen(false)}
        {...linkTarget(l)}
      >
        {label}
      </a>
    )
  }

  const current = section === null ? null : menu[section]

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="sh-icon-button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="site-menu-drawer"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </button>
      {open ? (
        <div
          ref={dialog}
          id="site-menu-drawer"
          className="sh-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="sh-drawer-top">
            {current ? (
              <button
                type="button"
                className="sh-drawer-back t-nav"
                onClick={() => setSection(null)}
              >
                <ChevronLeft size={16} />
                {current.label}
              </button>
            ) : (
              <span>{logo}</span>
            )}
            <button
              type="button"
              className="sh-icon-button"
              aria-label="Close menu"
              onClick={close}
            >
              <Close />
            </button>
          </div>
          <div className="sh-drawer-body">
            {current ? (
              current.groups.map((group, g) => (
                <div key={g} className="sh-drawer-group">
                  {group.heading ? (
                    <p className="t-eyebrow sh-drawer-heading">{group.heading}</p>
                  ) : null}
                  <ul>
                    {group.links.map((l, k) => (
                      <li key={k}>{link(l.label, l.link, 't-body-l sh-drawer-sublink')}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <ul className="sh-drawer-sections">
                {menu.map((item, i) => (
                  <li key={i}>
                    {item.groups.length > 0 ? (
                      <button
                        type="button"
                        className="t-heading-m sh-drawer-section"
                        onClick={() => setSection(i)}
                      >
                        {item.label}
                        <ChevronRight />
                      </button>
                    ) : (
                      link(item.label, item.link, 't-heading-m sh-drawer-section')
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sh-drawer-foot">
            {phone ? (
              <a
                className="t-label-s sh-drawer-phone"
                href={`tel:${phone.replace(/[^+0-9]/g, '')}`}
              >
                <Phone /> {phone}
              </a>
            ) : null}
            {bookButton}
          </div>
        </div>
      ) : null}
    </>
  )
}
