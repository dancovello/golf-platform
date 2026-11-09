'use client'

import { type ReactNode, useState } from 'react'

import { swapLead } from './featuredOrder'

/**
 * Team style C: the lead person is shown large and the others are listed beside them. Pressing
 * someone in the list brings them to the lead spot, and the person who was leading takes their
 * place in the list, so the same slot keeps focus. Everything is drawn on the server and passed
 * in; this only decides who is showing. Without JavaScript the first lead stays shown.
 */
export const TeamFeatured = ({
  ids,
  panels,
  rows,
  names,
  footer,
}: {
  /** Everyone in order: the lead first, then the list. */
  ids: string[]
  panels: Record<string, ReactNode>
  rows: Record<string, ReactNode>
  names: Record<string, string>
  footer: ReactNode
}) => {
  const [order, setOrder] = useState(ids)
  const lead = order[0] ?? ''
  const swap = (slot: number) => setOrder((o) => swapLead(o, slot))

  return (
    <div className="team-featured-layout">
      <div className="team-featured-main" aria-live="polite">
        {panels[lead]}
      </div>
      {order.length > 1 || footer ? (
        <div className="team-featured-side">
          <ul className="team-side-list">
            {order.slice(1).map((id, i) => (
              <li key={i} className="team-row">
                <button
                  type="button"
                  className="team-row-button"
                  onClick={() => swap(i + 1)}
                  aria-label={`Show ${names[id]}`}
                >
                  {rows[id]}
                </button>
              </li>
            ))}
          </ul>
          {footer}
        </div>
      ) : null}
    </div>
  )
}
