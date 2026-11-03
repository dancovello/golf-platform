'use client'

import { useEffect } from 'react'

import { blockElements, isHighlightMessage } from '../blockHighlight'

const OUTLINE_ID = 'live-block-outline'

/** Inside the admin's live preview only: scrolls to the block the editor is working on and
 * outlines it (src/site/blockHighlight.ts). Draws nothing on the site itself. */
export const BlockHighlight = () => {
  useEffect(() => {
    let current: number | null = null
    let frame = 0

    const outline = () => {
      let box = document.getElementById(OUTLINE_ID)
      if (!box) {
        box = document.createElement('div')
        box.id = OUTLINE_ID
        box.setAttribute('aria-hidden', 'true')
        Object.assign(box.style, {
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: '2147483000',
          border: '3px solid #2f6fed',
          background: 'rgba(47, 111, 237, 0.06)',
          boxSizing: 'border-box',
          borderRadius: '4px',
        })
        document.body.appendChild(box)
      }
      return box
    }

    /** Puts the outline around the block's current place on the page. */
    const draw = () => {
      const box = document.getElementById(OUTLINE_ID)
      const elements = current === null ? [] : blockElements(document, current)
      if (elements.length === 0) {
        if (box) box.style.display = 'none'
        return elements
      }
      const rects = elements.map((el) => el.getBoundingClientRect())
      const top = Math.min(...rects.map((r) => r.top)) + window.scrollY
      const left = Math.min(...rects.map((r) => r.left)) + window.scrollX
      const bottom = Math.max(...rects.map((r) => r.bottom)) + window.scrollY
      const right = Math.max(...rects.map((r) => r.right)) + window.scrollX
      Object.assign(outline().style, {
        display: 'block',
        top: `${top}px`,
        left: `${left}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`,
      })
      return elements
    }

    const redraw = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return
      if (!isHighlightMessage(e.data)) return
      current = e.data.index
      const elements = draw()
      if (elements[0]) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // Stop just under the site's header, which stays at the top while scrolling.
        const header = document.querySelector('header')
        const covered =
          header && getComputedStyle(header).position !== 'static' ? header.offsetHeight : 0
        const top = elements[0].getBoundingClientRect().top + window.scrollY - covered - 8
        window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' })
      }
    }

    // The page changes under the outline: it is saved and redrawn, the window is resized,
    // pictures load. Keep the outline on the block.
    window.addEventListener('message', onMessage)
    window.addEventListener('resize', redraw)
    const watcher = new MutationObserver(redraw)
    const main = document.querySelector('main')
    if (main) watcher.observe(main, { childList: true, subtree: true, attributes: true })
    const sizes = new ResizeObserver(redraw)
    sizes.observe(document.body)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('resize', redraw)
      watcher.disconnect()
      sizes.disconnect()
      cancelAnimationFrame(frame)
      document.getElementById(OUTLINE_ID)?.remove()
    }
  }, [])

  return null
}
