import { RichTextContent } from '../blocks/RichTextContent'
import { Photo } from '../blocks/parts'
import type { SiteNewsPost } from '../news'
import { NewsCard, newsHref, newsLongDate } from './NewsCard'
import { NewsCarousel } from './NewsCarousel'
import { ShareLink } from './ShareLink'

import '../blocks/blocks.css'
import '../blocks/richText.css'
import '../components/buttons.css'
import './news.css'

/**
 * A news article (Figma "News post"): breadcrumb, title, summary, byline with Share, main photo
 * with caption, the article as Text style A, its category, previous and next articles, and more
 * news as Carousel A.
 */
export const NewsPost = ({ post, base }: { post: SiteNewsPost; base: string }) => (
  <>
    <article className="news-post">
      <header className="news-page news-post-header">
        <div className="news-post-titles">
          <nav className="t-label-s news-breadcrumb" aria-label="Breadcrumb">
            <a href={`${base}/news`}>News</a>
            <span aria-hidden="true">/</span>
            <a href={`${base}/news?category=${post.category}`}>{post.categoryLabel}</a>
          </nav>
          <h1 className="t-display-l">{post.title}</h1>
          {post.excerpt ? <p className="t-body-l news-post-summary">{post.excerpt}</p> : null}
          <div className="news-post-meta">
            <p className="t-body-s news-byline">
              {post.author ? <>{post.author} · </> : null}
              <time dateTime={post.publishedAt}>{newsLongDate(post.publishedAt)}</time> ·{' '}
              {post.readingMinutes} min read
            </p>
            <ShareLink title={post.title} />
          </div>
        </div>
        {post.image ? (
          <figure className="news-post-image">
            <Photo
              image={post.image}
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) calc(100vw - 80px), 1200px"
              eager
            />
            {post.imageCaption ? (
              <figcaption className="t-label-s">{post.imageCaption}</figcaption>
            ) : null}
          </figure>
        ) : null}
      </header>
      {post.body ? (
        <div className="blk rt rt-article">
          <div className="blk-container rt-layout">
            <div className="rt-prose">
              <RichTextContent value={post.body} ctx={post.ctx} base={base} />
            </div>
          </div>
        </div>
      ) : null}
      <footer className="news-page news-post-footer">
        <p className="t-label-s news-filed">
          Filed under{' '}
          <a className="t-data-label news-tag" href={`${base}/news?category=${post.category}`}>
            {post.categoryLabel}
          </a>
        </p>
        {post.previous || post.next ? (
          <nav className="post-nav" aria-label="More articles">
            {post.previous ? (
              <a className="post-nav-link is-previous" href={newsHref(base, post.previous.slug)}>
                <span className="t-eyebrow">← Previous article</span>
                <span className="t-heading-m post-nav-title">{post.previous.title}</span>
              </a>
            ) : null}
            {post.next ? (
              <a className="post-nav-link is-next" href={newsHref(base, post.next.slug)}>
                <span className="t-eyebrow">Next article →</span>
                <span className="t-heading-m post-nav-title">{post.next.title}</span>
              </a>
            ) : null}
          </nav>
        ) : null}
      </footer>
    </article>
    {post.more.length > 0 ? (
      <NewsCarousel eyebrow="News" heading="More from the club" allHref={`${base}/news`}>
        {post.more.map((card) => (
          <NewsCard key={card.slug} card={card} base={base} />
        ))}
      </NewsCarousel>
    ) : null}
  </>
)
