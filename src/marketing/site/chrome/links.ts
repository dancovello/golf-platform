import { BRAND } from '@/brand'

/** The marketing site map (hand-off §6; labels from Figma Marketing/Nav and Footer). */
export const NAV_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Who it’s for', href: '/who-its-for' },
  { label: 'Switching to us', href: '/switching' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Trust', href: '/trust' },
] as const

export const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Who it’s for', href: '/who-its-for' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Clubs',
    links: [
      { label: 'Switching to us', href: '/switching' },
      { label: 'Book a demo', href: '/book-a-demo' },
      { label: 'Contact', href: `mailto:${BRAND.email}` },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Security', href: '/trust' },
      { label: 'Data processing', href: '/trust#data-processing' },
    ],
  },
] as const

export const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
] as const

/**
 * Leaves out links to this site's pages that aren't published. Other links (email, the admin)
 * always stay. "/trust#data-processing" counts as the Trust page; "/" as the home page.
 */
export const onlyPublished = <T extends { href: string }>(
  links: readonly T[],
  published: Set<string>,
): T[] =>
  links.filter((link) => {
    if (!link.href.startsWith('/')) return true
    const slug = link.href.slice(1).split(/[#?]/)[0] || 'home'
    return published.has(slug)
  })
