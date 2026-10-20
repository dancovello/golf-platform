import type { MenuItem, SiteLink } from '../loadClub'

/** Where the club's site lives: /preview/<club> on staging until real domains (step 4). */
export const siteHref = (base: string, link: SiteLink | null): string => {
  if (!link) return base || '/'
  if (link.kind === 'url') return link.href
  return link.slug === 'home' ? base || '/' : `${base}/${link.slug}`
}

/**
 * Which top-level menu item to underline as the current section: at most one. A page can sit
 * under several items (Contact under both Visitors and About), so an item that links straight
 * to the page wins, then the first item listing it in a drop-down. -1 when none does.
 */
export const currentMenuIndex = (menu: MenuItem[], base: string, currentPath: string): number => {
  const direct = menu.findIndex((item) => item.link && siteHref(base, item.link) === currentPath)
  if (direct !== -1) return direct
  return menu.findIndex((item) => item.children.some((l) => siteHref(base, l.link) === currentPath))
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
