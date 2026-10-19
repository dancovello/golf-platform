import type { SiteLink } from '../loadClub'

/** Where the club's site lives: /preview/<club> on staging until real domains (step 4). */
export const siteHref = (base: string, link: SiteLink | null): string => {
  if (!link) return base || '/'
  if (link.kind === 'url') return link.href
  return link.slug === 'home' ? base || '/' : `${base}/${link.slug}`
}

export const isExternal = (link: SiteLink | null) =>
  link?.kind === 'url' && /^https?:\/\//i.test(link.href)

/** The hidden "Opens in a new tab" note each club page carries (ClubShell); new-tab links
 * point screen readers at it, so no link's visible text changes. */
export const NEW_TAB_NOTE_ID = 'opens-new-tab'

/** Links to other websites and to documents open in a new tab (Dan, 2026-10-17). */
export const NEW_TAB = {
  target: '_blank',
  rel: 'noopener noreferrer',
  'aria-describedby': NEW_TAB_NOTE_ID,
} as const

/** NEW_TAB for a link to another website; nothing for the club's own pages. */
export const linkTarget = (link: SiteLink | null) => (isExternal(link) ? NEW_TAB : {})
