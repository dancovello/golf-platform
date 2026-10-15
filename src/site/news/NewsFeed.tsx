import type { NewsFeedBlock } from '@/payload-types'

import { ArrowRight } from '../components/Icons'
import type { ClubSite } from '../loadClub'
import { latestNews, type SiteNewsCard } from '../news'
import { Photo } from '../blocks/parts'
import { NewsCard, NewsMeta, newsHref } from './NewsCard'
import { NewsCarousel } from './NewsCarousel'

import './news.css'

/** A text headline (News B list, News C rail). B shows a small photo on phones. */
const Headline = ({
  card,
  base,
  thumbnail = false,
}: {
  card: SiteNewsCard
  base: string
  thumbnail?: boolean
}) => (
  <article className={`news-headline${thumbnail && card.image ? ' has-thumb' : ''}`}>
    {thumbnail && card.image ? (
      <div className="news-headline-thumb">
        <Photo image={card.image} sizes="96px" alt="" />
      </div>
    ) : null}
    <div className="news-headline-body">
      <NewsMeta card={card} />
      <h3 className="t-heading-m news-title">
        <a href={newsHref(base, card.slug)} className="news-card-link">
          {card.title}
        </a>
      </h3>
      <span className="t-label-button news-link news-read" aria-hidden="true">
        Read <ArrowRight />
      </span>
    </div>
  </article>
)

/**
 * The News block (doc 14 "News — carousel block options"): A Card carousel (the latest six,
 * ending on "All news"), B Lead + list (the latest as a feature card, the next three as
 * headlines) and C Headlines rail (text only on the brand colour). Always the club's own
 * published news; nothing shows until there is some.
 */
export const NewsFeed = async ({
  block,
  club,
  base,
}: {
  block: NewsFeedBlock
  club: ClubSite
  base: string
}) => {
  const style = block.style ?? 'carousel'
  const cards = await latestNews(club.tenantID, style === 'leadList' ? 4 : 6, block.category)
  if (cards.length === 0) return null
  const eyebrow = block.eyebrow?.trim() || 'News'
  const allHref = block.category ? `${base}/news?category=${block.category}` : `${base}/news`

  if (style === 'leadList') {
    const [lead, ...rest] = cards
    return (
      <section className="blk news-carousel news-lead-list">
        <div className="blk-container">
          <div className="blk-header">
            <div className="news-carousel-titles">
              <p className="t-eyebrow news-eyebrow">{eyebrow}</p>
              <h2 className="t-heading-l blk-heading">{block.heading}</h2>
            </div>
            <a className="btn btn-link t-label-button news-link news-all-top" href={allHref}>
              All news <ArrowRight />
            </a>
          </div>
          <div className="news-lead-columns">
            <NewsCard
              card={lead}
              base={base}
              layout="feature"
              linkLabel="Read the story"
              sizes="(max-width: 1023px) 100vw, 792px"
            />
            {rest.length > 0 ? (
              <div className="news-headline-list">
                {rest.map((card) => (
                  <Headline key={card.slug} card={card} base={base} thumbnail />
                ))}
              </div>
            ) : null}
          </div>
          <a className="btn btn-outline t-label-button news-all-bottom" href={allHref}>
            All news <ArrowRight />
          </a>
        </div>
      </section>
    )
  }

  if (style === 'headlines') {
    return (
      <NewsCarousel eyebrow={eyebrow} heading={block.heading} allHref={allHref} variant="headlines">
        {cards.map((card) => (
          <Headline key={card.slug} card={card} base={base} />
        ))}
      </NewsCarousel>
    )
  }

  return (
    <NewsCarousel eyebrow={eyebrow} heading={block.heading} allHref={allHref}>
      {cards.map((card) => (
        <NewsCard key={card.slug} card={card} base={base} />
      ))}
    </NewsCarousel>
  )
}
