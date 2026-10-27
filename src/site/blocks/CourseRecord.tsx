import { useId } from 'react'

import type { CourseRecordBlock } from '@/payload-types'

import { isImage, Photo } from './parts'
import type { BlockContext } from './resolve'

/**
 * Course record (Figma page "Course Record"), three styles: A Honours board (dark band with
 * a ringed portrait), B Signed card (score box and ruled fields), C Feature split (big photo
 * beside the score). Photo is optional in all three; the layout keeps its footprint without it.
 */
export const CourseRecord = ({ block, ctx }: { block: CourseRecordBlock; ctx: BlockContext }) => {
  const labelId = useId()
  const style = block.style ?? 'board'
  const photo = ctx.media(block.photo)
  const image = isImage(photo) ? photo : null
  const eyebrow = block.eyebrow?.trim() || 'Course record'
  const toPar = block.underPar ? `${block.underPar} under par` : null
  const detail = block.courseDetail?.trim() || null
  const description = block.description?.trim() || null
  const summary = [`${eyebrow}: ${block.score}`, toPar, block.holderName, block.year]
    .filter(Boolean)
    .join(', ')

  // The numeral on its own says little to a screen reader, so it carries the whole record.
  const score = (className: string) => (
    <p className={className}>
      <span className="cr-sr">{summary}</span>
      <span aria-hidden="true">{block.score}</span>
    </p>
  )

  if (style === 'card') {
    return (
      <section className="blk cr cr-card on-subtle" aria-labelledby={labelId}>
        <div className={`cr-card-box${image ? ' has-photo' : ''}`}>
          {image ? (
            <Photo
              image={image}
              sizes="(max-width: 767px) 100vw, 360px"
              className="cr-card-photo"
            />
          ) : null}
          <div className="cr-card-body">
            <div className="cr-card-head t-label-s">
              <p id={labelId} className="t-eyebrow cr-card-eyebrow">
                {eyebrow}
              </p>
              {detail ? <p className="cr-card-detail">{detail}</p> : null}
            </div>
            <div className="cr-card-main">
              <div className="cr-scorebox" aria-hidden="true">
                <p className="t-data-label cr-label">Gross</p>
                <p className="cr-numeral">{block.score}</p>
                {toPar ? <p className="t-label-s cr-card-par">{toPar}</p> : null}
              </div>
              <p className="cr-sr">{summary}</p>
              <dl className="cr-fields">
                <div className="cr-field">
                  <dt className="t-data-label cr-label">Player</dt>
                  <dd className="t-quote-m cr-card-name">{block.holderName}</dd>
                </div>
                <div className="cr-field">
                  <dt className="t-data-label cr-label">Year</dt>
                  <dd className="t-data-sans">{block.year}</dd>
                </div>
                {description ? (
                  <div className="cr-field">
                    <dt className="t-data-label cr-label">Notes</dt>
                    <dd className="t-body-m cr-card-notes">{description}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (style === 'split') {
    const figures = (
      <>
        {score('cr-numeral cr-split-numeral')}
        {toPar || detail ? (
          <div className="cr-split-par">
            {toPar ? <p className="t-heading-m cr-split-topar">{toPar}</p> : null}
            {detail ? <p className="t-label-s cr-split-detail">{detail}</p> : null}
          </div>
        ) : null}
      </>
    )
    return (
      <section className="blk cr cr-split" aria-labelledby={labelId}>
        <div className="blk-container cr-split-grid">
          {image ? (
            <Photo
              image={image}
              sizes="(max-width: 767px) 100vw, 544px"
              className="cr-split-photo"
            />
          ) : (
            <div className="cr-split-panel on-brand">{figures}</div>
          )}
          <div className="cr-split-content">
            <p id={labelId} className="t-eyebrow cr-split-eyebrow">
              {eyebrow}
            </p>
            {image ? <div className="cr-split-score">{figures}</div> : null}
            {image ? <hr className="cr-split-rule" /> : null}
            <div className="cr-split-holder">
              <h2 className="t-heading-l">{block.holderName}</h2>
              <p className="t-eyebrow cr-split-year">{block.year}</p>
            </div>
            {description ? <p className="t-body-l cr-split-text">{description}</p> : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="blk cr cr-board on-brand" aria-labelledby={labelId}>
      <div className="cr-board-outer">
        <div className="cr-board-inner">
          {image ? (
            <div className="cr-portrait">
              <Photo image={image} sizes="112px" className="cr-portrait-img" />
            </div>
          ) : null}
          <div className="cr-board-score">
            {score('cr-numeral')}
            {toPar ? <p className="t-eyebrow cr-board-par">{toPar}</p> : null}
          </div>
          <div className="cr-board-divider" aria-hidden="true" />
          <div className="cr-board-details">
            <div className="cr-board-eyebrow">
              <span className="cr-board-rule" aria-hidden="true" />
              <p id={labelId} className="t-eyebrow">
                {eyebrow}
              </p>
            </div>
            <h2 className="t-heading-caps">{block.holderName}</h2>
            <p className="t-eyebrow cr-board-meta">
              {block.year}
              {detail ? (
                <>
                  <span aria-hidden="true">·</span>
                  {detail}
                </>
              ) : null}
            </p>
            {description ? <p className="t-body-m cr-board-text">{description}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
