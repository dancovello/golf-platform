import { ArrowRight } from '../components/Icons'
import { Photo } from '../blocks/parts'
import type { SiteNewsCard } from '../news'

export const newsDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  })

export const newsHref = (base: string, slug: string) => `${base}/news/${slug}`

/** "COURSE NEWS · 8 OCT 2026" */
export const NewsMeta = ({ card }: { card: SiteNewsCard }) => (
  <p className="t-eyebrow news-meta">
    {card.categoryLabel} · <time dateTime={card.publishedAt}>{newsDate(card.publishedAt)}</time>
  </p>
)

/**
 * Figma "News Card": Stacked (grids, carousels), Row (lists) or Feature (lead story, text over
 * the photo). The title is the link; the whole card is clickable through it.
 */
export const NewsCard = ({
  card,
  base,
  layout = 'stacked',
  linkLabel = 'Read more',
  headingLevel = 3,
  sizes = '(max-width: 767px) 80vw, (max-width: 1023px) 50vw, 384px',
}: {
  card: SiteNewsCard
  base: string
  layout?: 'stacked' | 'row' | 'feature'
  linkLabel?: string
  headingLevel?: 2 | 3
  sizes?: string
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const href = newsHref(base, card.slug)
  return (
    <article className={`news-card is-${layout}`}>
      {card.image || layout !== 'feature' ? (
        <div className="news-card-image">
          {card.image ? <Photo image={card.image} sizes={sizes} alt="" /> : null}
        </div>
      ) : null}
      <div className="news-card-body">
        <NewsMeta card={card} />
        <Heading className={layout === 'feature' ? 't-heading-l' : 't-heading-m'}>
          <a href={href} className="news-card-link">
            {card.title}
          </a>
        </Heading>
        {card.excerpt && layout !== 'row' ? (
          <p className={`${layout === 'feature' ? 't-body-m' : 't-body-s'} news-excerpt`}>
            {card.excerpt}
          </p>
        ) : null}
        <span className="t-label-button news-read" aria-hidden="true">
          {linkLabel} <ArrowRight />
        </span>
      </div>
    </article>
  )
}
