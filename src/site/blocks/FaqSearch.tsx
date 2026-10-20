'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Search } from '../components/Icons'
import { type FaqItem, faqID } from './faqShared'

/**
 * FAQ C: search filters questions and answers as you type (result count read out), topic
 * tabs filter by topic with counts, and a link to #faq-{slug} opens and scrolls to it.
 */
export const FaqSearch = ({
  items,
  firstOpen,
  emptyContact,
}: {
  items: FaqItem[]
  firstOpen: boolean
  emptyContact: { href: string; label: string } | null
}) => {
  const [query, setQuery] = useState('')
  const topics = useMemo(
    () => [...new Set(items.map((i) => i.topic).filter((t): t is string => Boolean(t)))],
    [items],
  )
  const [topic, setTopic] = useState<string | null>(topics[0] ?? null)
  const list = useRef<HTMLDivElement>(null)
  const q = query.trim().toLowerCase()
  const matching = items.filter((i) => !q || `${i.question} ${i.answer}`.toLowerCase().includes(q))
  const shown = q ? matching : topic ? matching.filter((i) => i.topic === topic) : matching

  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const target = items.find((i) => faqID(i.question) === id)
      if (!target) return
      setQuery('')
      setTopic(target.topic ?? null)
      requestAnimationFrame(() => {
        const el = document.getElementById(id) as HTMLDetailsElement | null
        if (el) {
          el.open = true
          el.scrollIntoView({ block: 'start' })
        }
      })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [items])

  return (
    <>
      <label className="faq-search">
        <Search />
        <span className="visually-hidden">Search questions</span>
        <input
          type="search"
          className="t-body-m"
          placeholder="Search questions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {topics.length > 1 && !q ? (
        <div className="tabs tabs-tabs faq-topics" role="group" aria-label="Topics">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              className={`tab t-label-s${topic === t ? ' is-active' : ''}`}
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
            >
              {t} ({items.filter((i) => i.topic === t).length})
            </button>
          ))}
        </div>
      ) : null}
      <p className="visually-hidden" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'answer' : 'answers'}
      </p>
      <div ref={list} className="faq-list">
        {shown.length === 0 ? (
          <p className="t-body-m faq-empty">
            No answers for “{query}”.{' '}
            {emptyContact ? <a href={emptyContact.href}>{emptyContact.label}</a> : null}
          </p>
        ) : (
          shown.map((item, i) => (
            <details
              key={item.question}
              id={faqID(item.question)}
              className="faq-item"
              open={firstOpen && i === 0 && !q}
            >
              <summary className="t-body-l">{item.question}</summary>
              <div className="faq-answer t-body-m">
                {item.answer.split(/\n\s*\n/).map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </>
  )
}
