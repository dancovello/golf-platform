import { ArrowRight, ChevronRight } from './Icons'
import { CompactSearch } from '../search/CompactSearch'
import { linkTarget, siteHref } from './links'
import type { ClubSite } from '../loadClub'
import { type QuickLink, quickLinks } from './quickLinks'

import '../search/search.css'
import './notFound.css'

/**
 * Figma "1.15 Page not found (404)": a friendly headline and a few ways on. Links are buttons on
 * desktop and a list of rows on phones (doc 14 §3), with the "Search the site" box above them.
 */
export const PageNotFound = ({ club, base }: { club: ClubSite; base: string }) => {
  const links = [
    ...quickLinks(club),
    { label: 'Home', link: { kind: 'page', slug: 'home' } } as QuickLink,
  ]
  const href = (l: QuickLink) =>
    l.link.kind === 'page' && l.link.slug === 'home' ? base : siteHref(base, l.link)
  return (
    <section className="nf">
      <div className="nf-inner">
        <p className="t-eyebrow nf-eyebrow">Error 404</p>
        <h1 className="t-display-xl nf-title">Lost in the heather</h1>
        <p className="t-body-l nf-text">
          The page you’re after has moved or never existed. Search the site, or start from one of
          these.
        </p>
        <CompactSearch base={base} id="nf-search" className="nf-search" />
        <ul className="nf-links">
          {links.map((l) => (
            <li key={l.label}>
              <a className="nf-link t-label-button" href={href(l)} {...linkTarget(l.link)}>
                <span>{l.label}</span>
                <ArrowRight />
                <ChevronRight />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
