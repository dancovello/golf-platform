import { RichTextContent } from '../blocks/RichTextContent'
import { Photo } from '../blocks/parts'
import { SwipeRow } from '../blocks/SwipeRow'
import { ArrowRight } from '../components/Icons'
import type { SiteNewsPost } from '../news'
import { NewsCard, newsDate, newsHref } from './NewsCard'

import '../blocks/blocks.css'
import '../blocks/richText.css'
import '../components/buttons.css'
import './news.css'

/**
 * A news article (Figma "News post"): breadcrumb, title, summary, byline, main photo with
 * caption, the article as Text style A, its category, previous and next articles and three
 * more to read.
 */
export const NewsPost = ({ post, base }: { post: SiteNewsPost; base: string }) => (
  <>
    <article className="news-post">
      <header className="news-post-header">
        <nav className="t-label-s news-breadcrumb" aria-label="Breadcrumb">
          <a href={`${base}/news`}>News</a>
          <span aria-hidden="true"> / </span>
          <a href={`${base}/news?category=${post.category}`}>{post.categoryLabel}</a>
        </nav>
        <h1 className="t-display-l">{post.title}</h1>
        {post.excerpt ? <p className="t-body-l news-post-summary">{post.excerpt}</p> : null}
        <p className="t-body-s news-byline">
          {post.author ? <>{post.author} · </> : null}
          <time dateTime={post.publishedAt}>{newsDate(post.publishedAt)}</time> ·{' '}
          {post.readingMinutes} min read
        </p>
      </header>
      {post.image ? (
        <figure className="news-post-image">
          <Photo image={post.image} sizes="(max-width: 1279px) 100vw, 1200px" eager />
          {post.imageCaption ? (
            <figcaption className="t-label-s">{post.imageCaption}</figcaption>
          ) : null}
        </figure>
      ) : null}
      {post.body ? (
        <div className="blk rt rt-article">
          <div className="blk-container rt-layout">
            <div className="rt-prose">
              <RichTextContent value={post.body} ctx={post.ctx} base={base} />
            </div>
          </div>
        </div>
      ) : null}
      <footer className="news-post-footer">
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
                <span className="t-heading-m">{post.previous.title}</span>
              </a>
            ) : (
              <span />
            )}
            {post.next ? (
              <a className="post-nav-link is-next" href={newsHref(base, post.next.slug)}>
                <span className="t-eyebrow">Next article →</span>
                <span className="t-heading-m">{post.next.title}</span>
              </a>
            ) : null}
          </nav>
        ) : null}
      </footer>
    </article>
    {post.more.length > 0 ? (
      <section className="blk on-subtle news-more">
        <div className="blk-container">
          <div className="blk-header">
            <h2 className="t-heading-l blk-heading">More news</h2>
            <a className="btn btn-link t-label-button" href={`${base}/news`}>
              All news <ArrowRight />
            </a>
          </div>
          <SwipeRow className="news-grid" label="More news">
            {post.more.map((card) => (
              <NewsCard key={card.slug} card={card} base={base} />
            ))}
          </SwipeRow>
        </div>
      </section>
    ) : null}
  </>
)
