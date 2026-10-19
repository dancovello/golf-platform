import type { ClubSite, SiteLink } from '../loadClub'

export type QuickLink = { label: string; link: SiteLink }

/** Up to three useful places: the booking button, then the menu's direct links. */
export const quickLinks = (club: ClubSite): QuickLink[] => {
  const links: QuickLink[] = []
  if (club.header.booking) links.push(club.header.booking)
  for (const item of club.header.menu) {
    if (links.length >= 3) break
    if (item.link) links.push({ label: item.label, link: item.link })
  }
  return links
}
