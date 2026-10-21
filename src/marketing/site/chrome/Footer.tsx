import { TextLink } from '../controls/controls'
import { FOOTER_COLUMNS, LEGAL_LINKS } from './links'
import { Wordmark } from './Wordmark'
import { BRAND } from '@/brand'

/**
 * Marketing/Footer (175:1876) and Footer Mobile (272:8991). Link columns mirror the site map.
 * The status dot is left out until it's fed by real monitoring (hand-off §7).
 */
export const Footer = () => (
  <footer className="mk-footer">
    <div className="mk-container mk-footer-inner">
      <div className="mk-footer-top">
        <div className="mk-footer-brand">
          <Wordmark />
          <p>Golf club websites your team can update in minutes. Tee-time booking coming next.</p>
        </div>
        <nav className="mk-footer-columns" aria-label="Footer">
          {FOOTER_COLUMNS.map((column) => (
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
        <ul aria-label="Legal">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <TextLink href={link.href}>{link.label}</TextLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
)
