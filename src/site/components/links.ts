import type { SiteLink } from '../loadClub'

/** Where the club's site lives: /preview/<club> on staging until real domains (step 4). */
export const siteHref = (base: string, link: SiteLink | null): string => {
  if (!link) return base || '/'
  if (link.kind === 'url') return link.href
  return link.slug === 'home' ? base || '/' : `${base}/${link.slug}`
}

export const isExternal = (link: SiteLink | null) =>
  link?.kind === 'url' && /^https?:\/\//i.test(link.href)
