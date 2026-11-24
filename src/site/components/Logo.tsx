import type { ClubSite, SiteImage } from '../loadClub'
import { type Brand, AA_GRAPHIC, contrast, deriveTheme, luminance } from '@/theme/colour'

/** What the logo sits on: the page (and white bars), the brand colour, or a shaded photo. */
export type LogoSurface = 'page' | 'brand' | 'image'

export type LogoChoice = { kind: 'image'; image: SiteImage } | { kind: 'wordmark' }

/**
 * Picks which uploaded logo to show; it is always shown exactly as uploaded, never recoloured.
 * The one uploaded for this kind of background comes first, unless its measured colour fails
 * 3:1 against the background (WCAG AA for graphics) and the other logo passes. An older upload
 * with no measurement is trusted to suit the background it was uploaded for. A club with only
 * one logo gets that logo everywhere; a club wanting a white version on dark uploads one.
 * No logo at all: the club name, in the surface's text colour.
 */
export const chooseLogo = (
  brand: Brand,
  logos: { onLight: SiteImage | null; onDark: SiteImage | null },
  surface: LogoSurface,
): LogoChoice => {
  const theme = deriveTheme(brand)
  const [background, text] =
    surface === 'page'
      ? [brand.light, theme.page.text]
      : surface === 'brand'
        ? [brand.primary, theme.brand.text]
        : [theme.image.shade, theme.image.text]
  const lightBackground = luminance(text) < luminance(background)
  const [intended, other] = lightBackground
    ? [logos.onLight, logos.onDark]
    : [logos.onDark, logos.onLight]

  const reads = (logo: SiteImage | null, trusted: boolean): logo is SiteImage =>
    logo !== null && (logo.colour ? contrast(logo.colour, background) >= AA_GRAPHIC : trusted)

  if (reads(intended, true)) return { kind: 'image', image: intended }
  if (reads(other, false)) return { kind: 'image', image: other }
  // Read from `logos`: the checks above have narrowed `intended` and `other` away.
  const any = lightBackground ? (logos.onLight ?? logos.onDark) : (logos.onDark ?? logos.onLight)
  return any ? { kind: 'image', image: any } : { kind: 'wordmark' }
}

/**
 * Goes inside a link around a Logo, after it. The link takes its name from what it shows (the
 * logo's alt text, or the name and strapline) plus ", home". An aria-label would hide the
 * strapline from screen readers and voice control (WCAG 2.5.3, Label in Name).
 */
export const HomeHint = () => <span className="sh-visually-hidden">, home</span>

/** The club's logo for `surface`, or its name set in the heading font with the strapline beneath. */
export const Logo = ({
  club,
  surface = 'page',
  compact = false,
  className = '',
}: {
  club: ClubSite
  surface?: LogoSurface
  compact?: boolean
  className?: string
}) => {
  const choice = chooseLogo(
    club.brand,
    { onLight: club.logoOnLight, onDark: club.logoOnDark },
    surface,
  )
  const extra = `${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`
  if (choice.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- R2 files, sized by CSS
      <img className={`sh-logo-img${extra}`} src={choice.image.url} alt={club.name} />
    )
  }
  return (
    <span className={`sh-wordmark${extra}`}>
      <span className="sh-wordmark-name">{club.name}</span>
      {club.strapline ? <span className="sh-wordmark-strapline">{club.strapline}</span> : null}
    </span>
  )
}
