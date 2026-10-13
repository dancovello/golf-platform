'use client'

import { useMemo, useState } from 'react'

import { Download, Search } from '../components/Icons'
import { type DocRow, downloadLabel } from './documentsShared'

/**
 * Document library (Document List C): search as you type (title and category) and category
 * tabs with live counts, over a real table. Phones show each row as a stacked card.
 */
export const DocumentLibrary = ({ docs, heading }: { docs: DocRow[]; heading: string }) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const q = query.trim().toLowerCase()
  const matching = useMemo(
    () => docs.filter((d) => !q || `${d.title} ${d.categoryName}`.toLowerCase().includes(q)),
    [docs, q],
  )
  const shown = category ? matching.filter((d) => d.category === category) : matching
  const categories = [...new Map(docs.map((d) => [d.category, d.categoryName])).entries()]

  return (
    <>
      <label className="dl-search">
        <Search />
        <span className="visually-hidden">Search documents</span>
        <input
          type="search"
          className="t-body-m"
          placeholder="Search documents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="tabs tabs-tabs dl-tabs" role="group" aria-label="Categories">
        {[[null, 'All'] as const, ...categories].map(([value, name]) => {
          const count = value
            ? matching.filter((d) => d.category === value).length
            : matching.length
          return (
            <button
              key={value ?? 'all'}
              type="button"
              className={`tab t-label-s${category === value ? ' is-active' : ''}`}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {name} ({count})
            </button>
          )
        })}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {shown.length} documents
      </p>
      {shown.length === 0 ? (
        <p className="t-body-m dl-empty">
          No documents match “{query}”.{' '}
          <button type="button" className="dl-clear" onClick={() => setQuery('')}>
            Clear search
          </button>
        </p>
      ) : (
        <table className="dl-table">
          <caption className="visually-hidden">{heading}</caption>
          <thead>
            <tr className="t-data-label">
              <th scope="col">Document</th>
              <th scope="col">Category</th>
              <th scope="col">Last reviewed</th>
              <th scope="col">Size</th>
              <th scope="col">
                <span className="visually-hidden">Download</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id}>
                <th scope="row" className="t-body-m">
                  {d.title}
                </th>
                <td>
                  <span className="dl-tag t-label-s">{d.categoryName}</span>
                </td>
                <td className={`t-body-s${d.overdue ? ' dl-overdue' : ''}`}>{d.reviewed ?? '—'}</td>
                <td className="t-body-s">{d.size}</td>
                <td className="dl-download-cell">
                  <a
                    className="dl-download t-label-s"
                    href={d.url}
                    aria-label={downloadLabel(d)}
                    download
                  >
                    Download <Download />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
