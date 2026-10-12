'use client'

import { useEffect, useState } from 'react'

import type { Heading } from './RichTextContent'

/**
 * "On this page" (Rich Text B): a sticky list of the H2/H3 headings, highlighting the section
 * being read. Phones and tablets get it as a collapsible list above the text.
 */
export const OnThisPage = ({ headings }: { headings: Heading[] }) => {
  const [current, setCurrent] = useState(headings[0]?.id)

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible[0]) setCurrent(visible[0].target.id)
      },
      { rootMargin: '0px 0px -70% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  const list = (
    <ul className="rt-toc-list">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? 'is-sub' : undefined}>
          <a
            href={`#${h.id}`}
            className={`t-body-s${current === h.id ? ' is-current' : ''}`}
            aria-current={current === h.id ? 'location' : undefined}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <nav className="rt-toc rt-toc-wide" aria-label="On this page">
        <p className="t-eyebrow rt-toc-title">On this page</p>
        {list}
      </nav>
      <details className="rt-toc rt-toc-narrow">
        <summary className="t-eyebrow rt-toc-title">On this page</summary>
        <nav aria-label="On this page">{list}</nav>
      </details>
    </>
  )
}
