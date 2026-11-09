import type { DocumentListBlock } from '@/payload-types'

import { Download, FileIcon } from '../components/Icons'
import { siteToday } from '../today'
import { cardRows } from './cardRows'
import { DocumentLibrary } from './DocumentLibrary'
import { type DocRow, downloadLabel, isOverdue, reviewedDate } from './documentsShared'
import { TextLink } from './parts'
import type { BlockContext } from './resolve'
import { NEW_TAB } from '../components/links'

/**
 * Document List (docs/design/11), three styles: A Grouped (categories down the left, rows
 * on the right), B Cards (a few key documents), C Library (search + category tabs over a
 * table). Every document is the club's own; type and size come from the upload, and
 * "Last reviewed" turns to the warning colour after 12 months (never hidden).
 */
export const DocumentList = ({
  block,
  ctx,
  base,
}: {
  block: DocumentListBlock
  ctx: BlockContext
  base: string
}) => {
  const today = siteToday()
  const style = block.style ?? 'grouped'
  const docs: DocRow[] = (block.documents ?? []).flatMap((d) => {
    const doc = ctx.document(d)
    return doc
      ? [
          {
            ...doc,
            reviewed: reviewedDate(doc.lastReviewed, style === 'cards' ? 'short' : 'long'),
            overdue: isOverdue(doc, today),
          },
        ]
      : []
  })
  if (docs.length === 0) return null
  const viewAll = style === 'cards' ? ctx.link(block.viewAll) : null

  const header = (
    <div className="blk-header">
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
      </div>
      {viewAll ? <TextLink link={viewAll} base={base} /> : null}
    </div>
  )

  const meta = (d: DocRow) => (
    <span className="dl-meta t-label-s">
      <span className="dl-type">{[d.type, d.size].filter(Boolean).join(' · ')}</span>
      {d.reviewed ? (
        <span className={d.overdue ? 'dl-overdue' : undefined}>
          {style === 'cards' ? 'Reviewed' : 'Last reviewed'} {d.reviewed}
          {d.overdue ? ' · due for review' : ''}
        </span>
      ) : null}
    </span>
  )

  const row = (d: DocRow) => (
    <li key={d.id}>
      <a className="dl-row" href={d.url} aria-label={downloadLabel(d)} {...NEW_TAB}>
        <span className="dl-icon" aria-hidden="true">
          <FileIcon />
        </span>
        <span className="dl-row-text">
          <span className="t-body-m dl-title">{d.title}</span>
          {meta(d)}
        </span>
        <span className="dl-download t-label-s" aria-hidden="true">
          Download <Download />
        </span>
      </a>
    </li>
  )

  if (style === 'cards') {
    return (
      <section className="blk dl dl-cards-block on-subtle">
        <div className="blk-container">
          {header}
          <ul className={`dl-cards ${cardRows(docs.length, false)}`}>
            {docs.map((d) => (
              <li key={d.id}>
                <a className="dl-card" href={d.url} aria-label={downloadLabel(d)} {...NEW_TAB}>
                  <span className="dl-card-top">
                    <span className="dl-icon-plain" aria-hidden="true">
                      <FileIcon />
                    </span>
                    <span className="dl-tag t-label-s">{d.categoryName}</span>
                  </span>
                  <span className="t-heading-m dl-card-title">{d.title}</span>
                  <span className="dl-card-foot">
                    {meta(d)}
                    <Download />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  if (style === 'table') {
    return (
      <section className="blk dl dl-table-block">
        <div className="blk-container">
          {header}
          <DocumentLibrary docs={docs} heading={block.heading} />
        </div>
      </section>
    )
  }

  // A · Grouped, in the order the club's categories were added
  const groups = [...new Set(docs.map((d) => d.category))]
    .map((category) => {
      const inGroup = docs.filter((d) => d.category === category)
      return { name: inGroup[0]!.categoryName, order: inGroup[0]!.categoryOrder, docs: inGroup }
    })
    .sort((a, b) => a.order - b.order)
  return (
    <section className="blk dl dl-grouped">
      <div className="blk-container">
        {header}
        <div className="dl-groups">
          {groups.map((g) => (
            <div key={g.name} className="dl-group">
              <div className="dl-group-head">
                <h3 className="t-heading-m">{g.name}</h3>
                <p className="t-body-s dl-count">
                  {g.docs.length} {g.docs.length === 1 ? 'document' : 'documents'}
                </p>
              </div>
              <ul className="dl-rows">{g.docs.map(row)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
