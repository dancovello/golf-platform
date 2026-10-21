import { BRAND } from '@/brand'
import type { MarketingMedia, MarketingPage } from '@/payload-types'

import { MarketingRichText } from './MarketingRichText'

type Block = NonNullable<MarketingPage['layout']>[number]

/**
 * Draws a marketing page's sections. Plain, semantic markup for now: the look (tokens, type,
 * spacing) arrives in plan phases 1.3 and 2. The first Section Header on a page is its one H1.
 */
export const MarketingBlocks = ({ blocks }: { blocks: Block[] }) => {
  const firstHeader = blocks.findIndex((b) => b.blockType === 'mkSectionHeader')
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.blockType) {
          case 'mkSectionHeader': {
            const Heading = i === firstHeader ? 'h1' : 'h2'
            return (
              <header key={block.id ?? i} data-block="section-header">
                {block.eyebrow ? <p>{block.eyebrow}</p> : null}
                <Heading>{block.title}</Heading>
                {block.subhead ? <p>{block.subhead}</p> : null}
              </header>
            )
          }
          case 'mkRichText':
            return (
              <section key={block.id ?? i} data-block="rich-text">
                <MarketingRichText value={block.content} />
              </section>
            )
          case 'mkMedia': {
            const image = typeof block.image === 'object' ? (block.image as MarketingMedia) : null
            if (!image?.url) return null
            return (
              <figure
                key={block.id ?? i}
                data-block="media"
                data-ratio={block.ratio}
                data-frame={block.frame}
              >
                {/* Sized and cropped properly in phase 2 (next/image, focal point). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.sizes?.w1600?.url ?? image.url} alt={image.alt} />
                {block.caption ? <figcaption>{block.caption}</figcaption> : null}
              </figure>
            )
          }
          case 'mkFeatureCards':
            return (
              <section key={block.id ?? i} data-block="feature-cards">
                <ul>
                  {block.cards.map((card, j) => (
                    <li key={card.id ?? j}>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                      {card.availability === 'coming-next' ? <p>Coming next</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            )
          case 'mkCtaBand':
            return (
              <section key={block.id ?? i} data-block="cta-band">
                <h2>{block.title}</h2>
                {block.subhead ? <p>{block.subhead}</p> : null}
                {/* The decided buttons (hand-off §3). Their pages arrive in phase 5. */}
                <p>
                  <a href="/book-a-demo">Book a demo</a>{' '}
                  <a href="/switching">Get your free homepage</a>
                </p>
              </section>
            )
          default:
            return null
        }
      })}
      {/* Keeps the contact email reachable until the footer exists (phase 2). */}
      <footer>
        <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
      </footer>
    </>
  )
}
