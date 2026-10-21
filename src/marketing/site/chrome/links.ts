import { BRAND } from '@/brand'

/** The marketing site map (hand-off §6; labels from Figma Marketing/Nav and Footer). */
export const NAV_LINKS = [
  { label: 'Website builder', href: '/website-builder' },
  // Bookings isn't built yet: the nav shows the clock (Coming next) beside it.
  { label: 'Tee times', href: '/bookings', comingNext: true },
  { label: 'Switching', href: '/switching' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Trust', href: '/trust' },
] as const

export const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Website builder', href: '/website-builder' },
      { label: 'Tee times', href: '/bookings' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Clubs',
    links: [
      { label: 'Switching', href: '/switching' },
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

/** "Club log in" goes to the admin, on its own address (decision C). */
export const clubLogInHref = () => {
  try {
    return new URL('/admin', process.env.ADMIN_URL).toString()
  } catch {
    return '/admin'
  }
}
