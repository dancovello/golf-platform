import type { ClubSite, SiteImage } from '../loadClub'
import { type Brand, AA_GRAPHIC, contrast, deriveTheme, luminance } from '@/theme/colour'

/** What the logo sits on: the page (and white bars), the brand colour, or a shaded photo. */
export type LogoSurface = 'page' | 'brand' | 'image'

export type LogoChoice =
  | { kind: 'image'; image: SiteImage; recolour: 'none' | 'white' | 'black'; plated?: boolean }
  | { kind: 'wordmark' }

/**
 * Picks the logo by its measured colour against the actual background, at 3:1 (WCAG AA for
 * graphics): the one uploaded for this kind of background first, then the other. If neither
 * reads, the logo is shown in white or black (fine for a one-colour logo, legible for any).
 * An older upload with no measurement is trusted to suit the background it was uploaded for.
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

  // A logo saved on a solid background (a white box round it) can't be shown through the page
  // or turned white: on a dark background it goes on a white plate instead, so it stays readable.
  const plated = (logo: SiteImage) => !lightBackground && logo.opaque === true && isLight(logo)
  const isLight = (logo: SiteImage) => !logo.colour || luminance(logo.colour) > 0.5

  if (reads(intended, true) && !plated(intended))
    return { kind: 'image', image: intended, recolour: 'none' }
  if (reads(other, false) && !plated(other))
    return { kind: 'image', image: other, recolour: 'none' }
  const any = intended ?? other
  if (!any) return { kind: 'wordmark' }
  if (any.opaque === true) {
    return lightBackground
      ? { kind: 'image', image: any, recolour: 'none' }
      : { kind: 'image', image: any, recolour: 'none', plated: true }
  }
  return { kind: 'image', image: any, recolour: lightBackground ? 'black' : 'white' }
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
    const recolour =
      (choice.recolour === 'none' ? '' : ` is-recoloured-${choice.recolour}`) +
      (choice.plated ? ' is-plated' : '')
    return (
      // eslint-disable-next-line @next/next/no-img-element -- R2 files, sized by CSS
      <img className={`sh-logo-img${extra}${recolour}`} src={choice.image.url} alt={club.name} />
    )
  }
  return (
    <span className={`sh-wordmark${extra}`}>
      <span className="sh-wordmark-name">{club.name}</span>
      {club.strapline ? <span className="sh-wordmark-strapline">{club.strapline}</span> : null}
    </span>
  )
}
