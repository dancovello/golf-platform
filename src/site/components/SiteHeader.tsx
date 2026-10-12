import type { ClubSite } from '../loadClub'
import { BookButton } from './BookButton'
import { DesktopNav } from './DesktopNav'
import { HeaderScroll } from './HeaderScroll'
import { Phone } from './Icons'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

/**
 * The site header in the club's chosen style (Figma "Header / A · Classic", "B · Transparent",
 * "C · App bar"), plus the mobile header and drawer below 1024px.
 *
 * Left out for v1, though the designs show them: Log in / My bookings (member accounts are
 * out of scope), search (no site search yet) and the live course status (arrives with the
 * Course Status block).
 */
export const SiteHeader = ({
  club,
  base,
  currentPath,
  overHero = false,
}: {
  club: ClubSite
  base: string
  currentPath: string
  /** Style B only: sit transparently over a full-bleed hero until the page scrolls. */
  overHero?: boolean
}) => {
  const { style, menu, phone } = club.header
  const home = base || '/'
  const nav = <DesktopNav menu={menu} base={base} currentPath={currentPath} />
  const transparent = style === 'transparent' && overHero

  const mobile = (
    <div className="sh-mobile">
      <a className="sh-logo-link" href={home} aria-label={`${club.name}, home`}>
        <Logo club={club} compact onDark={transparent} />
      </a>
      <div className="sh-mobile-actions">
        <BookButton club={club} base={base} short arrow={false} className="is-compact" />
        <MobileMenu
          menu={menu}
          base={base}
          currentPath={currentPath}
          logo={<Logo club={club} compact />}
          phone={phone}
          bookButton={<BookButton club={club} base={base} className="is-block" />}
        />
      </div>
    </div>
  )

  return (
    <HeaderScroll
      className={`sh sh-${style}${transparent ? ' is-over-hero' : ''}`}
      threshold={style === 'classic' ? 200 : 0}
    >
      <a className="sh-skip" href="#main">
        Skip to content
      </a>
      <div className="sh-desktop">
        {style === 'classic' ? (
          <>
            {phone ? (
              <div className="sh-utility">
                <div className="sh-container sh-utility-inner">
                  <span />
                  <a
                    className="t-label-s sh-utility-link"
                    href={`tel:${phone.replace(/[^+0-9]/g, '')}`}
                  >
                    <Phone /> {phone}
                  </a>
                </div>
              </div>
            ) : null}
            <div className="sh-main">
              <div className="sh-container sh-row sh-row-classic">
                <div className="sh-cell-start">{nav}</div>
                <a className="sh-logo-link" href={home} aria-label={`${club.name}, home`}>
                  <Logo club={club} />
                </a>
                <div className="sh-cell-end">
                  <BookButton club={club} base={base} />
                </div>
              </div>
            </div>
          </>
        ) : style === 'transparent' ? (
          <div className="sh-main">
            <div className="sh-container sh-row">
              <a className="sh-logo-link" href={home} aria-label={`${club.name}, home`}>
                <Logo club={club} onDark={transparent} />
              </a>
              {nav}
              <BookButton club={club} base={base} short />
            </div>
          </div>
        ) : (
          <div className="sh-main">
            <div className="sh-container sh-row">
              <div className="sh-appbar-left">
                <a className="sh-logo-link" href={home} aria-label={`${club.name}, home`}>
                  <Logo club={club} compact />
                </a>
                {nav}
              </div>
              <BookButton club={club} base={base} short arrow={false} />
            </div>
          </div>
        )}
      </div>
      {mobile}
    </HeaderScroll>
  )
}
