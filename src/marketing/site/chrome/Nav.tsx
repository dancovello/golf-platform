import { headers } from 'next/headers'

import { MarketingIcon } from '../MarketingIcon'
import { MarketingButton } from '../parts'
import { clubLogInHref, NAV_LINKS } from './links'
import { NavBehaviour } from './NavBehaviour'
import { Wordmark } from './Wordmark'

/** The Coming next clock beside a nav item (Availability Badge, icon only, with words for screen
 * readers). */
const ComingNext = () => (
  <span className="mk-nav-coming-next">
    <MarketingIcon name="clock" size={12} />
    <span className="mk-visually-hidden">(coming next)</span>
  </span>
)

/**
 * Marketing/Nav (175:1875) on desktop and Marketing/Nav Mobile (272:8990) on phones. Top is
 * transparent; after 8px of scroll it turns to glass with a hairline (NavBehaviour). The phone
 * menu is a full-height sheet: focus stays inside it, and Esc closes it.
 */
export const Nav = async () => {
  const path = (await headers()).get('x-pathname') ?? '/'
  const isCurrent = (href: string) => path === href || path.startsWith(`${href}/`)
  const logIn = clubLogInHref()
  return (
    <header className="mk-nav" data-scrolled="false">
      <div className="mk-nav-bar">
        <Wordmark />
        <nav className="mk-nav-links" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <span key={link.href} className="mk-nav-item">
              <a
                className="mk-nav-link"
                href={link.href}
                aria-current={isCurrent(link.href) ? 'page' : undefined}
              >
                {link.label}
              </a>
              {'comingNext' in link ? <ComingNext /> : null}
            </span>
          ))}
        </nav>
        <div className="mk-nav-actions">
          <span className="mk-nav-desktop-only">
            <MarketingButton label="Club log in" href={logIn} variant="ghost" arrow={false} />
          </span>
          <span className="mk-nav-desktop-only">
            <MarketingButton
              label="Free homepage"
              href="/switching"
              variant="ghost"
              arrow={false}
            />
          </span>
          <span className="mk-nav-book">
            <MarketingButton label="Book a demo" href="/book-a-demo" variant="primary" />
          </span>
          <button
            type="button"
            className="mk-nav-menu-button"
            aria-label="Menu"
            aria-expanded="false"
            aria-controls="mk-nav-sheet"
            data-menu-open
          >
            <MarketingIcon name="menu" size={20} />
          </button>
        </div>
      </div>
      <div
        className="mk-nav-sheet"
        id="mk-nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden
      >
        <div className="mk-nav-bar">
          <Wordmark />
          <div className="mk-nav-actions">
            <MarketingButton
              label="Book a demo"
              href="/book-a-demo"
              variant="primary"
              arrow={false}
            />
            <button
              type="button"
              className="mk-nav-menu-button"
              aria-label="Close menu"
              data-menu-close
            >
              <MarketingIcon name="close" size={20} />
            </button>
          </div>
        </div>
        <nav className="mk-nav-sheet-links" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? 'page' : undefined}
            >
              {link.label}
              {'comingNext' in link ? <ComingNext /> : null}
            </a>
          ))}
        </nav>
        <div className="mk-nav-sheet-actions">
          <MarketingButton label="Club log in" href={logIn} variant="secondary" arrow={false} />
          <MarketingButton
            label="Book a demo"
            href="/book-a-demo"
            variant="primary"
            arrow={false}
          />
        </div>
      </div>
      <NavBehaviour />
    </header>
  )
}
