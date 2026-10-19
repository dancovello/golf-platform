import { ArrowRight, ChevronRight } from './Icons'
import { linkTarget, siteHref } from './links'
import type { ClubSite, SiteLink } from '../loadClub'

import './notFound.css'

type QuickLink = { label: string; link: SiteLink }

/** Up to three useful places: the booking button, then the menu's direct links. */
const quickLinks = (club: ClubSite): QuickLink[] => {
  const links: QuickLink[] = []
  if (club.header.booking) links.push(club.header.booking)
  for (const item of club.header.menu) {
    if (links.length >= 3) break
    if (item.link) links.push({ label: item.label, link: item.link })
  }
  return links
}

/**
 * Figma "1.15 Page not found (404)": a friendly headline and a few ways on. Links are buttons on
 * desktop and a list of rows on phones (doc 14 §3). The design's "Search the site" box waits
 * for site search (an open decision), so it is left out rather than shown not working.
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
          The page you’re after has moved or never existed. Start from one of these instead.
        </p>
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
