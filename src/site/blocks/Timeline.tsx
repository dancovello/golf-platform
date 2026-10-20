import type { TimelineBlock } from '@/payload-types'

import { isImage, Photo } from './parts'
import type { BlockContext } from './resolve'
import { TimelineTrack } from './TimelineTrack'

const yearAttr = (year: string) => (/^\d{4}$/.test(year.trim()) ? year.trim() : undefined)

/**
 * Timeline (docs/design/11), three styles: A Alternating (centre spine, accent markers,
 * entries left and right with optional 3:2 photos), B Horizontal (scrolling strip on the
 * brand colour, oversized years, pager), C Ledger (sticky intro beside a ruled list).
 * Always an ordered list; years in <time>.
 */
export const Timeline = ({ block, ctx }: { block: TimelineBlock; ctx: BlockContext }) => {
  const style = block.style ?? 'alternating'
  const entries = block.entries ?? []
  if (entries.length === 0) return null

  const header = (
    <div className={`blk-header${style === 'alternating' ? ' is-centred' : ''}`}>
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
        {style === 'ledger' && block.intro ? (
          <p className="t-body-m blk-intro tl-intro">{block.intro}</p>
        ) : null}
      </div>
    </div>
  )

  if (style === 'horizontal') {
    return (
      <section className="blk tl tl-horizontal on-brand">
        <div className="blk-container tl-h-layout">
          {header}
          <TimelineTrack years={entries.map((e) => e.year)} label={block.heading}>
            {entries.map((e, i) => (
              <li key={i} className="tl-card">
                <span className="tl-marker" aria-hidden="true" />
                <time className="t-display-xl tl-year" dateTime={yearAttr(e.year)}>
                  {e.year}
                </time>
                <h3 className="t-heading-m tl-title">{e.title}</h3>
                <p className="t-body-s tl-text">{e.text}</p>
              </li>
            ))}
          </TimelineTrack>
        </div>
      </section>
    )
  }

  if (style === 'ledger') {
    return (
      <section className="blk tl tl-ledger on-subtle">
        <div className="blk-container tl-ledger-grid">
          <div className="tl-ledger-intro">{header}</div>
          <ol className="tl-ledger-list">
            {entries.map((e, i) => (
              <li key={i}>
                <time className="t-data-serif tl-year" dateTime={yearAttr(e.year)}>
                  {e.year}
                </time>
                <div>
                  <h3 className="t-heading-m tl-title">{e.title}</h3>
                  <p className="t-body-s tl-text">{e.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section className="blk tl tl-alternating">
      <div className="blk-container">
        {header}
        <ol className="tl-spine">
          {entries.map((e, i) => {
            const image = ctx.media(e.image)
            return (
              <li key={i} className={`tl-entry${i % 2 ? ' is-right' : ''}`}>
                <div className="tl-copy">
                  <time className="t-heading-l tl-year" dateTime={yearAttr(e.year)}>
                    {e.year}
                  </time>
                  <h3 className="t-heading-m tl-title">{e.title}</h3>
                  <p className="t-body-s tl-text">{e.text}</p>
                </div>
                <span className="tl-marker" aria-hidden="true" />
                <div className="tl-media">
                  {isImage(image) ? (
                    <Photo
                      image={image}
                      sizes="(max-width: 767px) 100vw, 480px"
                      className="tl-img"
                    />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
