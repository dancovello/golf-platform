import { NEWS_CATEGORIES, newsCategoryLabel } from '@/collections/newsCategories'

import { Search } from '../components/Icons'
import type { newsArchive } from '../news'
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
 * search box, both kept in the address; the newest story as a feature card on the first
 * page; six to a page; numbered pages. Works without JavaScript (links and a plain form).
 */
export const NewsArchive = ({ archive, base }: { archive: Archive; base: string }) => {
  const { category, q, cards, page, pages, total } = archive
  const filtered = Boolean(category || q)
  const [lead, ...rest] = !filtered && page === 1 ? cards : [null, ...cards]
  const first = (page - 1) * 6 + 1
  const last = first + cards.length - 1

  return (
    <section className="blk news-archive">
      <div className="blk-container">
        <header className="news-archive-header">
          <p className="t-eyebrow blk-eyebrow">News</p>
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
                className={`tab t-label-s${category === c.value ? ' is-active' : ''}`}
                href={archiveHref(base, { category: c.value, q })}
                aria-current={category === c.value ? 'page' : undefined}
              >
                {c.label}
              </a>
            ))}
          </nav>
          <form className="news-search" role="search" action={`${base}/news`} method="get">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <Search />
            <label className="visually-hidden" htmlFor="news-q">
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

        {cards.length === 0 ? (
          <div className="news-empty">
            <p className="t-heading-m">
              {q
                ? `No articles match “${q}”${category ? ` in ${newsCategoryLabel(category)}` : ''}.`
                : `No articles in ${newsCategoryLabel(category)} yet.`}
            </p>
            <a className="btn btn-outline t-label-button" href={archiveHref(base, {})}>
              Show all news
            </a>
          </div>
        ) : (
          <>
            {lead ? (
              <div className="news-lead">
                <NewsCard
                  card={lead}
                  base={base}
                  layout="feature"
                  linkLabel="Read the story"
                  headingLevel={2}
                  sizes="(max-width: 1023px) 100vw, 1200px"
                />
              </div>
            ) : null}
            <div className="news-grid">
              {rest.map((card) =>
                card ? <NewsCard key={card.slug} card={card} base={base} headingLevel={2} /> : null,
              )}
            </div>
            <p className="t-label-s news-count">
              Showing {first}–{last} of {total} {total === 1 ? 'article' : 'articles'}
            </p>
            <Pagination
              page={page}
              pages={pages}
              href={(n) => archiveHref(base, { category, q, page: n })}
            />
          </>
        )}
      </div>
    </section>
  )
}
