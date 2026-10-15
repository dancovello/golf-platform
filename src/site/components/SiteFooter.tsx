import type { ClubSite, LabelledLink } from '../loadClub'
import { CookieSettingsButton } from '../privacy/CookieConsent'
import { BookButton } from './BookButton'
import { ArrowRight, Mail, Phone, Pin } from './Icons'
import { isExternal, siteHref } from './links'
import { Logo } from './Logo'

/**
 * The site footer in the club's chosen style (Figma "Footer / A · Brand columns",
 * "B · Newsletter band", "C · Editorial").
 *
 * Left out for v1: the newsletter sign-up (waits for the email provider decision, so style B
 * shows its columns without the band) and today's open/closed dot next to the hours.
 *
 * The bottom row always starts with "Privacy policy" (src/site/privacy), which clubs can't
 * remove, then "Cookie settings" when the club uses Google Analytics.
 */
export const SiteFooter = ({ club, base }: { club: ClubSite; base: string }) => {
  const f = club.footer
  const dark = f.style !== 'lightColumns'
  const year = new Date().getFullYear()

  const a = (l: LabelledLink, className: string) => (
    <a
      className={className}
      href={siteHref(base, l.link)}
      {...(isExternal(l.link) ? { rel: 'noopener' } : {})}
    >
      {l.label}
    </a>
  )

  const column = (heading: string, links: LabelledLink[], key: number) => (
    <div key={key} className="sf-col">
      <p className="t-eyebrow sf-eyebrow">{heading}</p>
      <ul className="sf-list">
        {links.map((l, i) => (
          <li key={i}>{a(l, 't-body-s sf-link')}</li>
        ))}
      </ul>
    </div>
  )

  const hours =
    f.hours.length > 0 ? (
      <div className="sf-col sf-hours">
        <p className="t-eyebrow sf-eyebrow">Opening hours</p>
        <dl className="sf-hours-list t-body-s">
          {f.hours.map((h, i) => (
            <div key={i} className="sf-hours-row">
              <dt>{h.place}</dt>
              <dd>{h.times}</dd>
            </div>
          ))}
        </dl>
        {f.hoursLink ? a(f.hoursLink, 't-label-s sf-hours-link') : null}
      </div>
    ) : null

  const phone = club.header.phone
  const contactRows = [
    phone ? (
      <a key="p" className="sf-contact t-body-s" href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>
        <Phone /> {phone}
      </a>
    ) : null,
    f.email ? (
      <a key="e" className="sf-contact t-body-s" href={`mailto:${f.email}`}>
        <Mail /> {f.email}
      </a>
    ) : null,
    f.address ? (
      f.directions ? (
        <a key="a" className="sf-contact t-body-s" href={f.directions} rel="noopener">
          <Pin /> {f.address}
        </a>
      ) : (
        <span key="a" className="sf-contact t-body-s">
          <Pin /> {f.address}
        </span>
      )
    ) : null,
  ].filter(Boolean)
  const contact = (withHeading: boolean) =>
    contactRows.length > 0 ? (
      <div className="sf-col">
        {withHeading ? <p className="t-eyebrow sf-eyebrow">Contact</p> : null}
        <address className="sf-contact-list">{contactRows}</address>
      </div>
    ) : null

  const brand = (
    <div className="sf-col sf-brand">
      <a className="sf-logo" href={base || '/'} aria-label={`${club.name}, home`}>
        <Logo club={club} onDark={dark} />
      </a>
      {f.about ? <p className="t-body-s sf-about">{f.about}</p> : null}
      {f.style === 'brandColumns' ? contact(false) : null}
    </div>
  )

  return (
    <footer className={`sf sf-${f.style}${dark ? ' is-dark' : ''}`}>
      <div className="sf-container">
        {f.style === 'editorial' ? (
          <>
            <p className="t-display-xl sf-wordmark">{club.name}</p>
            <div className="sf-columns">
              {hours}
              {contact(true)}
              {f.social.length > 0 ? (
                <div className="sf-col">
                  <p className="t-eyebrow sf-eyebrow">Follow</p>
                  <ul className="sf-list">
                    {f.social.map((s) => (
                      <li key={s.url}>
                        <a className="t-body-s sf-link" href={s.url} rel="noopener">
                          {SOCIAL_NAMES[s.network] ?? s.network}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="sf-col sf-cta">
                <BookButton club={club} base={base} />
                {f.secondaryButton ? (
                  <a
                    className="t-label-button sf-secondary"
                    href={siteHref(base, f.secondaryButton.link)}
                    {...(isExternal(f.secondaryButton.link) ? { rel: 'noopener' } : {})}
                  >
                    {f.secondaryButton.label} <ArrowRight />
                  </a>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="sf-columns">
            {brand}
            {(f.style === 'brandColumns' ? f.linkColumns.slice(0, 1) : f.linkColumns).map((c, i) =>
              column(c.heading, c.links, i),
            )}
            {hours}
            {f.style === 'lightColumns' ? contact(true) : null}
          </div>
        )}
        <div className="sf-legal t-label-s">
          <ul className="sf-legal-links">
            <li>
              <a className="sf-link" href={`${base}/privacy`}>
                Privacy policy
              </a>
            </li>
            {club.privacy.gaMeasurementId ? (
              <li>
                <CookieSettingsButton className="sf-link sf-cookie-settings" />
              </li>
            ) : null}
            {f.legalLinks.map((l, i) => (
              <li key={i}>{a(l, 'sf-link')}</li>
            ))}
          </ul>
          <p>
            © {year} {club.name}
          </p>
        </div>
      </div>
    </footer>
  )
}

const SOCIAL_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}
