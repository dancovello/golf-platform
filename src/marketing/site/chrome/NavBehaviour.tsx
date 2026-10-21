'use client'

import { useEffect } from 'react'

/**
 * The nav's behaviour (Figma Marketing/Nav and Nav Mobile descriptions): glass after 8px of
 * scroll; the phone menu opens as a sheet, keeps focus inside, closes on Esc or the close button,
 * and gives focus back to the menu button. Renders nothing.
 */
export const NavBehaviour = () => {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.mk-nav')
    const sheet = document.getElementById('mk-nav-sheet')
    const opener = nav?.querySelector<HTMLButtonElement>('[data-menu-open]')
    const closer = sheet?.querySelector<HTMLButtonElement>('[data-menu-close]')
    if (!nav || !sheet || !opener || !closer) return

    const onScroll = () => {
      nav.dataset.scrolled = String(window.scrollY > 8)
    }
    const focusables = () =>
      [...sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
        (el) => el.offsetParent !== null,
      )
    const close = () => {
      sheet.hidden = true
      opener.setAttribute('aria-expanded', 'false')
      document.documentElement.classList.remove('mk-sheet-open')
      opener.focus()
    }
    const open = () => {
      sheet.hidden = false
      opener.setAttribute('aria-expanded', 'true')
      document.documentElement.classList.add('mk-sheet-open')
      closer.focus()
    }
    const onKey = (event: KeyboardEvent) => {
      if (sheet.hidden) return
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    opener.addEventListener('click', open)
    closer.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      opener.removeEventListener('click', open)
      closer.removeEventListener('click', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  return null
}
