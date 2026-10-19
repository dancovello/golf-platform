import type { ClubSite } from '../loadClub'
import { BookButton } from './BookButton'
import { DesktopNav } from './DesktopNav'
import { HeaderScroll } from './HeaderScroll'
import { SearchPanel } from '../search/SearchPanel'
import { SearchTrigger } from '../search/SearchTrigger'
import { Phone } from './Icons'
import { isExternal, siteHref } from './links'
import { quickLinks } from './quickLinks'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

/**
 * The site header in the club's chosen style (Figma "Header / A · Classic", "B · Transparent",
 * "C · App bar"), plus the mobile header and drawer below 1024px.
 *
 * Left out for v1, though the designs show them: Log in / My bookings (member accounts are
 * out of scope) and the live course status (arrives with the Course Status block). Search opens
 * the search panel (src/site/search).
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
        {/* Tablets only: phones search from the menu, as in Figma "Header / Mobile". */}
        <SearchTrigger base={base} className="is-tablet-only" />
        <BookButton club={club} base={base} short arrow={false} className="is-compact" />
        <MobileMenu
          menu={menu}
          base={base}
          currentPath={currentPath}
          logo={<Logo club={club} compact />}
          searchHref={`${base}/search`}
          phone={phone}
          bookButton={<BookButton club={club} base={base} className="is-block" />}
        />
      </div>
    </div>
  )

  return (
    <>
      <HeaderScroll
        className={`sh sh-${style}${transparent ? ' is-over-hero' : ''}`}
        threshold={style === 'classic' ? 200 : 0}
      >
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
                <div className="sh-container sh-row">
                  <a className="sh-logo-link" href={home} aria-label={`${club.name}, home`}>
                    <Logo club={club} />
                  </a>
                  <div className="sh-cell-end">
                    {nav}
                    <SearchTrigger base={base} />
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
                <div className="sh-actions">
                  <SearchTrigger base={base} />
                  <BookButton club={club} base={base} short />
                </div>
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
                <div className="sh-actions">
                  <SearchTrigger base={base} />
                  <BookButton club={club} base={base} short arrow={false} />
                </div>
              </div>
            </div>
          )}
        </div>
        {mobile}
      </HeaderScroll>
      <SearchPanel
        base={base}
        clubSlug={club.slug}
        clubName={club.name}
        phone={phone ?? club.announcement?.phone ?? null}
        shortcuts={quickLinks(club).map((l) => ({
          label: l.label,
          detail: null,
          href: siteHref(base, l.link),
          newTab: isExternal(l.link),
        }))}
        contact={{
          label: 'Contact the club',
          detail: phone ?? club.announcement?.phone ?? null,
          href: siteHref(base, { kind: 'page', slug: 'contact' }),
          newTab: false,
        }}
      />
    </>
  )
}
