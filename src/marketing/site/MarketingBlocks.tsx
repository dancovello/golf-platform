import { Fragment, type ReactNode } from 'react'

import { BRAND } from '@/brand'
import type { MarketingMedia, MarketingPage } from '@/payload-types'
import { Photo } from '@/site/blocks/parts'

import { DemoIntro } from './booking/BookingBlocks'
import { FounderCard } from './FounderCard'
import { Compare, ContentMoves, HomeHero, ProofStats } from './home/HomeBlocks'
import { EditLive } from './home/EditLive'
import { Week } from './home/Week'
import { MarketingIcon } from './MarketingIcon'
import { Faq, Filled, Pricing } from './pricing/PricingBlocks'
import { MarketingRichText } from './MarketingRichText'
import { AvailabilityBadge, BrowserChrome, MarketingButton, marketingPhoto } from './parts'
import { DemoExample, Migration, RequestHero } from './switching/SwitchingBlocks'

type Block = NonNullable<MarketingPage['layout']>[number]
type Header = Extract<Block, { blockType: 'mkSectionHeader' }>
type Cta = Extract<Block, { blockType: 'mkCtaBand' }>
type Features = Extract<Block, { blockType: 'mkFeatureCards' }>
type Media = Extract<Block, { blockType: 'mkMedia' }>

/**
 * Splits a page's blocks into sections (Figma CMS block rules, 212:8319): each Section Header
 * starts a new section, and the CTA Band is always a section of its own.
 */
const toSections = (blocks: Block[]): Block[][] => {
  const sections: Block[][] = []
  for (const block of blocks) {
    const startsNew =
      block.blockType === 'mkSectionHeader' ||
      block.blockType === 'mkCtaBand' ||
      block.blockType === 'mkHomeHero' ||
      block.blockType === 'mkRequestHero' ||
      block.blockType === 'mkDemoIntro' ||
      block.blockType === 'mkFounder' ||
      // Questions carry their own compact header and sit in their own section (185:3944).
      block.blockType === 'mkFaq' ||
      sections.at(-1)?.at(-1)?.blockType === 'mkCtaBand'
    if (startsNew || sections.length === 0) sections.push([block])
    else sections.at(-1)!.push(block)
  }
  return sections
}

/** Block/Section Header (210:7950). Page size once per page, in the intro; Section elsewhere. */
export const SectionHeader = ({
  block,
  size,
}: {
  block: Pick<Header, 'eyebrow' | 'title' | 'subhead' | 'align'>
  size: 'page' | 'section'
}) => {
  const Heading = size === 'page' ? 'h1' : 'h2'
  return (
    <header className={`mk-header mk-header--${size} mk-header--${block.align ?? 'left'}`}>
      {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
      <Heading className="mk-header-title">{block.title}</Heading>
      {block.subhead ? (
        <p className="mk-header-body">
          <Filled text={block.subhead} />
        </p>
      ) : null}
    </header>
  )
}

/** Block/CTA Band (210:7951): title, optional body, the main button and an optional second. */
export const CtaBand = ({
  block,
}: {
  block: Pick<Cta, 'title' | 'subhead' | 'primary' | 'secondary'>
}) => {
  const primary = block.primary?.label && block.primary.href ? block.primary : null
  const secondary = block.secondary?.label && block.secondary.href ? block.secondary : null
  return (
    <div className="mk-cta">
      <h2 className="mk-cta-title">{block.title}</h2>
      {block.subhead ? (
        <p className="mk-cta-body">
          <Filled text={block.subhead} />
        </p>
      ) : null}
      {primary || secondary ? (
        <div className="mk-cta-actions">
          {primary ? (
            <MarketingButton label={primary.label!} href={primary.href!} variant="primary" />
          ) : null}
          {secondary ? (
            <MarketingButton label={secondary.label!} href={secondary.href!} variant="secondary" />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Block/Media (210:8045): fixed ratios, cover-cropped at the focal point, Plain or Window. */
const MediaBlock = ({ block }: { block: Media }) => {
  const doc = typeof block.image === 'object' ? (block.image as MarketingMedia) : null
  const photo = doc ? marketingPhoto(doc) : null
  if (!photo) return null
  const narrow = block.ratio === '4:5'
  return (
    <figure className="mk-media" data-ratio={block.ratio} data-frame={block.frame}>
      <div className="mk-media-frame">
        {block.frame === 'window' ? (
          <BrowserChrome address={block.windowAddress || BRAND.domain} />
        ) : null}
        <Photo
          image={photo}
          className="mk-media-image"
          sizes={narrow ? '(min-width: 520px) 480px, 100vw' : '(min-width: 760px) 720px, 100vw'}
        />
      </div>
      {block.caption ? <figcaption className="mk-media-caption">{block.caption}</figcaption> : null}
    </figure>
  )
}

/**
 * Block/Feature Card (217:32022). Rows: no box, hairline above, icon beside text, two columns.
 * Cards: boxed, in equal rows; a card with a link is the link.
 */
const FeatureCards = ({ block }: { block: Features }) => {
  const asCards = block.style === 'cards'
  return (
    <ul
      className={`mk-features mk-features--${asCards ? 'cards' : 'rows'}`}
      data-count={block.cards.length}
    >
      {block.cards.map((card, i) => {
        const link = card.linkLabel && card.linkHref ? card : null
        const content = (
          <>
            <span className="mk-feature-icon">
              <MarketingIcon name={card.icon} size={20} />
            </span>
            <span className="mk-feature-text">
              {card.availability === 'coming-next' ? (
                <AvailabilityBadge status="coming-next" size="small" />
              ) : null}
              <h3 className="mk-feature-title">{card.title}</h3>
              <span className="mk-feature-body">{card.body}</span>
              {link && asCards ? (
                <span className="mk-feature-link">
                  {link.linkLabel}
                  <MarketingIcon name="arrow-right" size={14} />
                </span>
              ) : null}
              {link && !asCards ? (
                <a className="mk-feature-link" href={link.linkHref!}>
                  {link.linkLabel}
                  <MarketingIcon name="arrow-right" size={14} />
                </a>
              ) : null}
            </span>
          </>
        )
        return (
          <li key={card.id ?? i} className="mk-feature">
            {asCards && link ? (
              <a className="mk-feature-inner" href={link.linkHref!}>
                {content}
              </a>
            ) : (
              <div className="mk-feature-inner">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const drawBlock = (
  block: Block,
  isFirstHeader: boolean,
  page: { onBookingPage: boolean },
): ReactNode => {
  switch (block.blockType) {
    case 'mkSectionHeader':
      return <SectionHeader block={block} size={isFirstHeader ? 'page' : 'section'} />
    case 'mkRichText':
      return (
        <div className="mk-prose">
          <MarketingRichText value={block.content} />
        </div>
      )
    case 'mkMedia':
      return <MediaBlock block={block} />
    case 'mkFeatureCards':
      return <FeatureCards block={block} />
    case 'mkCtaBand':
      return <CtaBand block={block} />
    case 'mkHomeHero':
      return <HomeHero block={block} />
    case 'mkProofStats':
      return <ProofStats block={block} />
    case 'mkCompare':
      return <Compare block={block} />
    case 'mkEditLive':
      return <EditLive block={block} />
    case 'mkWeek':
      return <Week block={block} />
    case 'mkContentMoves':
      return <ContentMoves block={block} />
    case 'mkFounder':
      return <FounderCard message={block.message} onBookingPage={page.onBookingPage} />
    case 'mkPricing':
      return <Pricing block={block} />
    case 'mkFaq':
      return <Faq block={block} />
    case 'mkRequestHero':
      return <RequestHero block={block} />
    case 'mkDemoExample':
      return <DemoExample block={block} />
    case 'mkMigration':
      return <Migration block={block} />
    case 'mkDemoIntro':
      return <DemoIntro block={block} />
    default:
      return null
  }
}

/** A section is named after its first block that isn't a header: some Figma sections have
 * their own spacing (e.g. the home hero, the founder card). */
const kindOf = (section: Block[]) =>
  section.find((b) => b.blockType !== 'mkSectionHeader')?.blockType ?? section[0].blockType

/** Draws a marketing page's sections: 1200px container, hairline between sections. */
export const MarketingBlocks = ({ blocks }: { blocks: Block[] }) => {
  // The page's one H1: a page intro block (home hero, Switching or Book a demo) if there is
  // one, otherwise the first Section Header.
  const hasOwnH1 = blocks.some((b) =>
    ['mkHomeHero', 'mkRequestHero', 'mkDemoIntro'].includes(b.blockType),
  )
  const onBookingPage = blocks.some((b) => b.blockType === 'mkDemoIntro')
  const firstHeader = hasOwnH1 ? undefined : blocks.find((b) => b.blockType === 'mkSectionHeader')
  return (
    <>
      {toSections(blocks).map((section, i) => (
        <section
          key={section[0].id ?? i}
          className={`mk-section${section[0].blockType === 'mkCtaBand' ? ' mk-section--cta' : ''}`}
          data-kind={kindOf(section)}
        >
          <div className="mk-container mk-stack">
            {section.map((block, j) => (
              <Fragment key={block.id ?? j}>
                {drawBlock(block, block === firstHeader, { onBookingPage })}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
