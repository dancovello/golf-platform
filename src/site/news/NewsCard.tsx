import { ArrowRight } from '../components/Icons'
import { Photo } from '../blocks/parts'
import type { SiteNewsCard } from '../news'

const LONDON = { timeZone: 'Europe/London' } as const

/** "8 Oct 2026" on cards. */
export const newsDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...LONDON,
  })

/** "8 October 2026" in an article's byline. */
export const newsLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...LONDON,
  })

export const newsHref = (base: string, slug: string) => `${base}/news/${slug}`

/** "COURSE NEWS · 8 OCT 2026" */
export const NewsMeta = ({ card }: { card: SiteNewsCard }) => (
  <p className="t-eyebrow news-meta">
    {card.categoryLabel} · <time dateTime={card.publishedAt}>{newsDate(card.publishedAt)}</time>
  </p>
)

/**
 * Figma "News Card": Stacked (grids and carousels; on phones in the archive it becomes the Row
 * layout, a square photo beside the title) or Feature (the lead story, text over the photo).
 * The title is the link, stretched over the whole card.
 */
export const NewsCard = ({
  card,
  base,
  layout = 'stacked',
  linkLabel = 'Read more',
  headingLevel = 3,
  sizes = '(max-width: 767px) 272px, (max-width: 1279px) 45vw, 384px',
}: {
  card: SiteNewsCard
  base: string
  layout?: 'stacked' | 'feature'
  linkLabel?: string
  headingLevel?: 2 | 3
  sizes?: string
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className={`news-card is-${layout}${card.image ? '' : ' no-image'}`}>
      {card.image || layout === 'stacked' ? (
        <div className="news-card-image">
          {card.image ? <Photo image={card.image} sizes={sizes} alt="" /> : null}
        </div>
      ) : null}
      <div className="news-card-body">
        <NewsMeta card={card} />
        <Heading className={`news-title ${layout === 'feature' ? 't-heading-l' : 't-heading-m'}`}>
          <a href={newsHref(base, card.slug)} className="news-card-link">
            {card.title}
          </a>
        </Heading>
        {card.excerpt ? (
          <p className={`${layout === 'feature' ? 't-body-m' : 't-body-s'} news-excerpt`}>
            {card.excerpt}
          </p>
        ) : null}
        <span className="t-label-button news-link news-read" aria-hidden="true">
          {linkLabel} <ArrowRight />
        </span>
      </div>
    </article>
  )
}
