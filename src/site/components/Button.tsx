import type { SiteLink } from '../loadClub'
import { ArrowRight } from './Icons'
import { isExternal, siteHref } from './links'

/** Figma "Button": Style = Accent / Solid / Outline / Link, Surface = Light / Dark. */
export type ButtonStyle = 'accent' | 'solid' | 'outline' | 'link'

export const Button = ({
  label,
  link,
  base,
  style,
  onDark = false,
  arrow = style === 'link',
}: {
  label: string
  link: SiteLink
  base: string
  style: ButtonStyle
  onDark?: boolean
  arrow?: boolean
}) => (
  <a
    className={`btn btn-${style}${onDark ? ' is-on-dark' : ''} t-label-button`}
    href={siteHref(base, link)}
    {...(isExternal(link) ? { rel: 'noopener' } : {})}
  >
    {label}
    {arrow ? <ArrowRight /> : null}
  </a>
)
