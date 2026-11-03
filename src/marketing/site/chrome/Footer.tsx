import { BRAND } from '@/brand'

import { publishedMarketingSlugs } from '../../content'
import { marketingSettings } from '../../settings'
import { TextLink } from '../controls/controls'
import { FOOTER_COLUMNS, LEGAL_LINKS, onlyPublished } from './links'
import { Wordmark } from './Wordmark'

/**
 * Marketing/Footer (175:1876) and Footer Mobile (272:8991). Link columns mirror the site map.
 * The status dot is left out until it's fed by real monitoring (hand-off §7). Links to pages
 * that aren't published yet are left out.
 */
export const Footer = async () => {
  const published = await publishedMarketingSlugs()
  const { site, contact, social } = await marketingSettings()
  const socials = [
    ['LinkedIn', social?.linkedin],
    ['Instagram', social?.instagram],
    ['X', social?.x],
    ['YouTube', social?.youtube],
    ['Facebook', social?.facebook],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  const companyLine = [
    contact?.registeredName,
    contact?.companyNumber ? `Company number ${contact.companyNumber}` : null,
    contact?.vatNumber ? `VAT number ${contact.vatNumber}` : null,
    contact?.registeredAddress?.replace(/\s*\n\s*/g, ', '),
  ]
    .filter(Boolean)
    .join(' · ')
  const columns = FOOTER_COLUMNS.map((column) => ({
    heading: column.heading,
    links: onlyPublished<{ label: string; href: string }>(column.links, published),
  })).filter((column) => column.links.length > 0)
  const legal = onlyPublished(LEGAL_LINKS, published)
  return (
    <footer className="mk-footer">
      <div className="mk-container mk-footer-inner">
        <div className="mk-footer-top">
          <div className="mk-footer-brand">
            <Wordmark />
            {site?.footerTagline ? <p>{site.footerTagline}</p> : null}
            {contact?.phone ? (
              <p>
                <a href={`tel:${contact.phone.replace(/[^+0-9]/g, '')}`}>{contact.phone}</a>
              </p>
            ) : null}
            {socials.length > 0 ? (
              <ul className="mk-footer-social" aria-label="Social media">
                {socials.map(([label, href]) => (
                  <li key={label}>
                    <TextLink href={href}>{label}</TextLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <nav className="mk-footer-columns" aria-label="Footer">
            {columns.map((column) => (
              <div key={column.heading} className="mk-footer-column">
                <h2>{column.heading}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <TextLink href={link.href}>{link.label}</TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mk-footer-bottom">
          <p>
            © {new Date().getFullYear()} {BRAND.name}
          </p>
          {companyLine ? <p className="mk-footer-company">{companyLine}</p> : null}
          {legal.length > 0 ? (
            <ul aria-label="Legal">
              {legal.map((link) => (
                <li key={link.href}>
                  <TextLink href={link.href}>{link.label}</TextLink>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
