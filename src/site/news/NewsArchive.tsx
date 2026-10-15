import { NEWS_CATEGORIES, newsCategoryLabel } from '@/collections/newsCategories'

import { Search } from '../components/Icons'
import { NEWS_PER_PAGE, type newsArchive } from '../news'
import { NewsCard } from './NewsCard'
import { Pagination } from './Pagination'

import '../blocks/blocks.css'
import '../components/buttons.css'
import './news.css'

type Archive = Awaited<ReturnType<typeof newsArchive>>

/** The archive address with filters, so results can be shared (doc 14 §3). */
const archiveHref = (
  base: string,
  f: { category?: string | null; q?: string | null; page?: number },
) => {
  const params = new URLSearchParams()
  if (f.category) params.set('category', f.category)
  if (f.q) params.set('q', f.q)
  if (f.page && f.page > 1) params.set('page', String(f.page))
  const query = params.toString()
  return `${base}/news${query ? `?${query}` : ''}`
}

/**
 * The news archive (Figma "News archive"): category pills ("All" first, one at a time) and a
 * search box, both kept in the address; the newest story on each page as a feature card, then
 * a grid of six (a list on phones); numbered pages. Works without JavaScript (links and a
 * plain form).
 */
export const NewsArchive = ({ archive, base }: { archive: Archive; base: string }) => {
  const { category, q, cards, page, pages, total } = archive
  const [lead, ...rest] = cards
  const first = (page - 1) * NEWS_PER_PAGE + 1
  const last = first + cards.length - 1

  return (
    <section className="news-page news-archive">
      <header className="news-archive-header">
        <p className="t-eyebrow news-eyebrow">News</p>
        <h1 className="t-display-l">Club news</h1>
        <p className="t-body-l news-archive-intro">
          Course updates, results and stories from the clubhouse.
        </p>
      </header>

      <div className="news-filters">
        <nav className="news-pills" aria-label="News categories">
          {[{ label: 'All', value: null as string | null }, ...NEWS_CATEGORIES].map((c) => (
            <a
              key={c.label}
              className={`news-pill t-label-s${category === c.value ? ' is-active' : ''}`}
              href={archiveHref(base, { category: c.value, q })}
              aria-current={category === c.value ? 'page' : undefined}
            >
              {c.label}
            </a>
          ))}
        </nav>
        <form className="news-search" role="search" action={`${base}/news`} method="get">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <Search size={20} />
          <label className="news-visually-hidden" htmlFor="news-q">
            Search news
          </label>
          <input
            id="news-q"
            className="t-body-m"
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search news"
            maxLength={60}
          />
        </form>
      </div>

      {lead ? (
        <>
          <NewsCard
            card={lead}
            base={base}
            layout="feature"
            linkLabel="Read the story"
            headingLevel={2}
            sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1279px) calc(100vw - 80px), 1200px"
          />
          {rest.length > 0 ? (
            <ul className="news-grid" aria-label="More articles">
              {rest.map((card) => (
                <li key={card.slug}>
                  <NewsCard card={card} base={base} headingLevel={2} />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="news-pagination-wrap">
            <Pagination
              page={page}
              pages={pages}
              href={(n) => archiveHref(base, { category, q, page: n })}
            />
            <p className="t-label-s news-count">
              Showing {first}–{last} of {total} {total === 1 ? 'article' : 'articles'}
            </p>
          </div>
        </>
      ) : (
        <div className="news-empty">
          <span className="news-empty-icon" aria-hidden="true">
            <Search size={24} />
          </span>
          <h2 className="t-heading-m">
            {total > 0
              ? 'There’s no page with that number'
              : q
                ? `No articles match “${q}”${category ? ` in ${newsCategoryLabel(category)}` : ''}.`
                : category
                  ? `No ${newsCategoryLabel(category).toLowerCase()} yet`
                  : 'No news yet'}
          </h2>
          <p className="t-body-s">
            {total > 0 || category || q
              ? 'Try another topic, or see everything we’ve published.'
              : 'Check back soon for course updates, results and stories from the club.'}
          </p>
          {total > 0 || category || q ? (
            <a className="btn btn-solid t-label-button" href={archiveHref(base, {})}>
              Show all news
            </a>
          ) : null}
        </div>
      )}
    </section>
  )
}
