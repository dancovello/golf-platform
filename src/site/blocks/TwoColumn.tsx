import type { TwoColumnBlock } from '@/payload-types'

import { isImage, Paragraphs, Photo, TextLink } from './parts'
import type { BlockContext } from './resolve'

/**
 * Two-Column Image + Text (docs/design/10), three styles: A Split (edge-to-edge 50/50, canvas
 * or brand panel), B Collage (4:5 photo with an overlapping 4:3 inset), C Key facts (photo,
 * copy and up to three facts). Photo on the left or right.
 */
export const TwoColumn = ({
  block,
  ctx,
  base,
}: {
  block: TwoColumnBlock
  ctx: BlockContext
  base: string
}) => {
  const image = ctx.media(block.image)
  if (!isImage(image)) return null
  const inset = block.style === 'collage' ? ctx.media(block.insetImage) : null
  const link = ctx.link(block.link)
  const style = block.style ?? 'split'
  const right = block.imageSide === 'right'
  const brand = style === 'split' && block.tone === 'brand'

  const copy = (
    <div className="tc-copy">
      {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
      <h2 className="t-heading-l blk-heading tc-heading">{block.heading}</h2>
      <div className="tc-body">
        <Paragraphs text={block.body} className="t-body-m" />
      </div>
      {style === 'keyFacts' && block.facts?.length ? (
        <dl className={`tc-facts${block.facts.some((f) => f.value.length > 10) ? ' is-long' : ''}`}>
          {block.facts.map((f, i) => (
            <div key={i} className="tc-fact">
              <dt className="t-data-label">{f.label}</dt>
              <dd className="t-data-serif">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {link ? (
        <div className="tc-link">
          <TextLink link={link} base={base} onDark={brand} />
        </div>
      ) : null}
    </div>
  )

  if (style === 'split') {
    return (
      <section className={`tc tc-split${right ? ' is-right' : ''}${brand ? ' on-brand' : ''}`}>
        <div className="tc-split-media">
          <Photo image={image} sizes="(max-width: 767px) 100vw, 50vw" className="tc-img" />
        </div>
        <div className="tc-split-panel">{copy}</div>
      </section>
    )
  }

  return (
    <section
      className={`blk tc tc-${style}${right ? ' is-right' : ''}${style === 'keyFacts' ? ' on-subtle' : ''}`}
    >
      <div className="blk-container tc-grid">
        <div className="tc-media">
          <Photo
            image={image}
            sizes="(max-width: 767px) 100vw, 700px"
            className="tc-img tc-primary"
          />
          {isImage(inset) ? (
            <Photo
              image={inset}
              sizes="(max-width: 767px) 50vw, 360px"
              className="tc-img tc-inset"
            />
          ) : null}
        </div>
        {copy}
      </div>
    </section>
  )
}
