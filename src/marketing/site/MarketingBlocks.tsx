import { Fragment, type ReactNode } from 'react'

import { BRAND } from '@/brand'
import type { MarketingMedia, MarketingPage } from '@/payload-types'

import { MarketingRichText } from './MarketingRichText'

type Block = NonNullable<MarketingPage['layout']>[number]

/**
 * Splits a page's blocks into sections (Figma "CMS block rules"): each Section header starts a
 * new section, and the CTA band is always a section of its own, with less space above it.
 */
const toSections = (blocks: Block[]): Block[][] => {
  const sections: Block[][] = []
  for (const block of blocks) {
    const startsNew =
      block.blockType === 'mkSectionHeader' ||
      block.blockType === 'mkCtaBand' ||
      sections.at(-1)?.at(-1)?.blockType === 'mkCtaBand'
    if (startsNew || sections.length === 0) sections.push([block])
    else sections.at(-1)!.push(block)
  }
  return sections
}

/** Draws one block. The first Section header on the page is its one H1, at page size. */
const drawBlock = (block: Block, isFirstHeader: boolean): ReactNode => {
  switch (block.blockType) {
    case 'mkSectionHeader': {
      const Heading = isFirstHeader ? 'h1' : 'h2'
      return (
        <header className="mk-section-header">
          {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
          <Heading className={isFirstHeader ? 'mk-display-xl' : 'mk-display-l'}>
            {block.title}
          </Heading>
          {block.subhead ? <p className="mk-body-l mk-secondary">{block.subhead}</p> : null}
        </header>
      )
    }
    case 'mkRichText':
      return (
        <div className="mk-prose mk-body-l">
          <MarketingRichText value={block.content} />
        </div>
      )
    case 'mkMedia': {
      const image = typeof block.image === 'object' ? (block.image as MarketingMedia) : null
      if (!image?.url) return null
      return (
        <figure className="mk-media" data-ratio={block.ratio} data-frame={block.frame}>
          {/* Sized with next/image and cropped at the focal point in phase 2. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.sizes?.w1600?.url ?? image.url}
            alt={image.alt}
            style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
          />
          {block.caption ? (
            <figcaption className="mk-body-s mk-secondary">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    }
    case 'mkFeatureCards':
      return (
        <ul className="mk-cards" data-count={block.cards.length}>
          {block.cards.map((card, j) => (
            <li key={card.id ?? j} className="mk-card">
              <h3 className="mk-heading-s">{card.title}</h3>
              <p className="mk-body-m mk-secondary">{card.body}</p>
              {card.availability === 'coming-next' ? (
                <p className="mk-label-s mk-badge">Coming next</p>
              ) : null}
            </li>
          ))}
        </ul>
      )
    case 'mkCtaBand':
      return (
        <div className="mk-cta">
          <h2 className="mk-display-l">{block.title}</h2>
          {block.subhead ? <p className="mk-body-l mk-secondary">{block.subhead}</p> : null}
          {/* The decided buttons (hand-off §3). Styled as buttons in phase 2; pages in phase 5. */}
          <p className="mk-cta-actions mk-label">
            <a href="/book-a-demo">Book a demo</a>
            <a href="/switching">Get your free homepage</a>
          </p>
        </div>
      )
    default:
      return null
  }
}

/** Draws a marketing page's sections. Components get their full design in phase 2. */
export const MarketingBlocks = ({ blocks }: { blocks: Block[] }) => {
  const firstHeader = blocks.find((b) => b.blockType === 'mkSectionHeader')
  return (
    <>
      {toSections(blocks).map((section, i) => (
        <section
          key={section[0].id ?? i}
          className={`mk-section${section[0].blockType === 'mkCtaBand' ? ' mk-section--cta' : ''}`}
        >
          <div className="mk-container">
            {section.map((block, j) => (
              <Fragment key={block.id ?? j}>{drawBlock(block, block === firstHeader)}</Fragment>
            ))}
          </div>
        </section>
      ))}
      {/* Keeps the contact email reachable until the footer exists (phase 2). */}
      <footer className="mk-section">
        <div className="mk-container mk-body-s mk-secondary">
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        </div>
      </footer>
    </>
  )
}
