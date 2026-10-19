import type { CtaCardGridBlock } from '@/payload-types'

import { Button } from '../components/Button'
import { ArrowRight } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import type { BlockContext, ResolvedLink } from './resolve'
import { SwipeRow } from './SwipeRow'

type Card = {
  title: string
  description: string | null
  eyebrow: string | null
  image: NonNullable<ReturnType<BlockContext['media']>>
  link: ResolvedLink
}

/**
 * CTA Card Grid (docs/design/09), three styles. The whole card is one link; arrows inside it
 * are decoration. No "Explore" label (Dan, 2026-10-17): it looked like a separate link. Phones: A swipes (with a "View all" card last),
 * B stacks as image strips, C stacks as a numbered list (docs/design/13).
 */
export const CtaCardGrid = ({
  block,
  ctx,
  base,
}: {
  block: CtaCardGridBlock
  ctx: BlockContext
  base: string
}) => {
  const style = block.style ?? 'editorial'
  const cards: Card[] = (block.cards ?? []).flatMap((c) => {
    const image = ctx.media(c.image)
    const link = ctx.link(c.link, c.title)
    return image && link && image.mimeType.startsWith('image/')
      ? [
          {
            title: c.title,
            description: c.description ?? null,
            eyebrow: c.eyebrow ?? null,
            image,
            link,
          },
        ]
      : []
  })
  if (cards.length === 0) return null
  const viewAll = style === 'editorial' ? ctx.link(block.viewAll) : null
  const columns = style === 'index' && cards.length === 4 ? 4 : 3

  const img = (card: Card, sizes: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
    <img
      className="cg-img"
      src={card.image.url}
      srcSet={card.image.srcSet ?? undefined}
      sizes={sizes}
      alt=""
      loading="lazy"
      style={{ objectPosition: card.image.position }}
    />
  )
  const external = (l: ResolvedLink) => linkTarget(l.link)
  const sizes = `(max-width: 767px) 82vw, (max-width: 1023px) 50vw, ${Math.round(1200 / columns)}px`

  const cardEls = cards.map((card, i) => {
    const href = siteHref(base, card.link.link)
    if (style === 'immersive') {
      return (
        <a key={i} className="cg-card cg-immersive" href={href} {...external(card.link)}>
          <div className="cg-media">{img(card, sizes)}</div>
          <div className="cg-scrim" aria-hidden="true" />
          <div className="cg-copy">
            {card.eyebrow ? <p className="t-eyebrow cg-eyebrow">{card.eyebrow}</p> : null}
            <h3 className="t-heading-caps cg-title">{card.title}</h3>
          </div>
          <span className="cg-glass" aria-hidden="true">
            <ArrowRight />
          </span>
        </a>
      )
    }
    if (style === 'index') {
      return (
        <a key={i} className="cg-card cg-index" href={href} {...external(card.link)}>
          <div className="cg-media">{img(card, sizes)}</div>
          <div className="cg-row">
            <span className="t-label-s cg-number">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="t-heading-m cg-title">{card.title}</h3>
            <span className="cg-arrow" aria-hidden="true">
              <ArrowRight />
            </span>
          </div>
          {card.description ? <p className="t-body-s cg-description">{card.description}</p> : null}
        </a>
      )
    }
    return (
      <a key={i} className="cg-card cg-editorial" href={href} {...external(card.link)}>
        <div className="cg-media">{img(card, sizes)}</div>
        <div className="cg-body">
          <h3 className="t-heading-m cg-title">{card.title}</h3>
          {card.description ? <p className="t-body-s cg-description">{card.description}</p> : null}
        </div>
      </a>
    )
  })

  const header = (
    <div
      className={`blk-header${style === 'immersive' ? ' is-centred' : ''}${style === 'index' ? ' is-split' : ''}`}
    >
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
        {viewAll ? (
          <a
            className="t-label-button cg-viewall-mobile"
            href={siteHref(base, viewAll.link)}
            {...external(viewAll)}
          >
            {viewAll.label} <ArrowRight />
          </a>
        ) : null}
      </div>
      {style === 'index' && block.intro ? (
        <p className="t-body-m blk-intro">{block.intro}</p>
      ) : null}
      {viewAll ? (
        <span className="cg-viewall-desktop">
          <Button label={viewAll.label} link={viewAll.link} base={base} style="outline" arrow />
        </span>
      ) : null}
    </div>
  )

  const surface = style === 'immersive' ? ' on-brand' : style === 'index' ? ' on-subtle' : ''
  return (
    <section className={`blk cg cg-${style}-grid${surface}`}>
      <div className="blk-container">
        {header}
        {style === 'editorial' ? (
          <SwipeRow className={`cg-grid cols-${columns}`} label={block.heading}>
            {[
              ...cardEls,
              ...(viewAll
                ? [
                    <a
                      key="all"
                      className="cg-card cg-all"
                      href={siteHref(base, viewAll.link)}
                      {...external(viewAll)}
                    >
                      <span className="t-heading-m">{viewAll.label}</span>
                      <ArrowRight />
                    </a>,
                  ]
                : []),
            ]}
          </SwipeRow>
        ) : (
          <div className={`cg-grid cols-${columns}`}>{cardEls}</div>
        )}
      </div>
    </section>
  )
}
