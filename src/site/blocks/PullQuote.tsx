import type { PullQuoteBlock } from '@/payload-types'

import { isImage, Photo } from './parts'
import type { BlockContext } from './resolve'

/**
 * Pull-Quote (docs/design/11), three styles: A Centred (large opening mark), B Over a photo
 * (uniform 55% scrim so any photo stays legible), C Split (4:5 photo, publication tag).
 * Always a <figure> with the quote and who said it.
 */
export const PullQuote = ({ block, ctx }: { block: PullQuoteBlock; ctx: BlockContext }) => {
  const style = block.style ?? 'centred'
  const image = style === 'centred' ? null : ctx.media(block.image)
  const hasImage = isImage(image)
  const quoteClass = style === 'split' ? 't-quote-m' : 't-quote-l'
  const quote = block.quote.trim().replace(/^["“]|["”]$/g, '')

  const figure = (
    <figure className="pq-figure">
      {style === 'centred' ? (
        <span className="t-display-xl pq-mark" aria-hidden="true">
          “
        </span>
      ) : null}
      {style === 'split' && block.publication ? (
        <p className="t-label-s pq-source">
          {block.publication}
          {block.year ? ` · ${block.year}` : ''}
        </p>
      ) : null}
      <blockquote className="pq-quote">
        <p className={quoteClass}>{style === 'centred' ? quote : `“${quote}”`}</p>
      </blockquote>
      <figcaption className="pq-caption">
        <span className="pq-rule" aria-hidden="true" />
        <span>
          <span className="t-label-s pq-name">{block.name}</span>
          {block.role ? <span className="t-label-s pq-role">{block.role}</span> : null}
        </span>
      </figcaption>
    </figure>
  )

  if (style === 'overImage' && hasImage) {
    return (
      <section className="pq pq-over">
        <Photo image={image} sizes="100vw" className="pq-bg" alt="" />
        <div className="pq-scrim" aria-hidden="true" />
        <div className="pq-over-inner">{figure}</div>
      </section>
    )
  }

  if (style === 'split') {
    return (
      <section className="blk pq pq-split on-subtle">
        <div className={`blk-container pq-split-grid${hasImage ? '' : ' no-image'}`}>
          {hasImage ? (
            <Photo image={image} sizes="(max-width: 767px) 100vw, 440px" className="pq-split-img" />
          ) : null}
          {figure}
        </div>
      </section>
    )
  }

  return (
    <section className="blk pq pq-centred">
      <div className="blk-container">{figure}</div>
    </section>
  )
}
