import { isEnquiryPurpose } from '@/collections/enquiryPurposes'

import { Button } from '../components/Button'
import { Clock, Mail, Phone, Pin } from '../components/Icons'
import type { ClubSite } from '../loadClub'
import { sendEnquiry } from './actions'
import { ContactForm } from './ContactForm'
import { issueFormToken } from './formToken'
import { turnstileSiteKey } from './turnstile'
import type { ContactSettings } from './load'
import { ukToday } from './replyBy'
import { EMPTY_VALUES } from './validate'

import './contact.css'

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, '')}`

/**
 * Figma "Contact page & form": one form with a topic picker (doc 14 §3), the club's contact
 * details beside it. Idle, Errors and Sent states live in ContactForm. `about` preselects a
 * topic, e.g. a "Membership enquiries" button linking to /contact?about=membership.
 */
export const ContactPage = ({
  club,
  base,
  settings,
  about,
}: {
  club: ClubSite
  base: string
  settings: ContactSettings
  about: string | null
}) => {
  const phone = club.header.phone
  const email = club.footer.email
  const address = club.footer.address
  const details = [
    phone && {
      key: 'phone',
      icon: <Phone size={18} />,
      label: 'Phone',
      value: <a href={telHref(phone)}>{phone}</a>,
    },
    email && {
      key: 'email',
      icon: <Mail size={18} />,
      label: 'Email',
      value: <a href={`mailto:${email}`}>{email}</a>,
    },
    address && { key: 'address', icon: <Pin size={18} />, label: 'Address', value: address },
    settings.officeHours && {
      key: 'hours',
      icon: <Clock size={18} />,
      label: 'Office hours',
      value: settings.officeHours,
    },
  ].filter((d) => Boolean(d)) as {
    key: string
    icon: React.ReactNode
    label: string
    value: React.ReactNode
  }[]

  return (
    <section className="ct">
      <div className="ct-inner">
        <header className="ct-head">
          <p className="t-eyebrow ct-eyebrow">Contact</p>
          <h1 className="t-display-l">Get in touch</h1>
          <p className="t-body-l ct-intro">{settings.intro}</p>
        </header>
        <div className="ct-columns">
          <ContactForm
            action={sendEnquiry.bind(null, club.slug)}
            initial={{
              attempt: 0,
              token: issueFormToken(club.tenantID),
              values: { ...EMPTY_VALUES, purpose: isEnquiryPurpose(about) ? about : 'general' },
              errors: {},
              formError: null,
              sent: null,
            }}
            membershipTypes={settings.membershipTypes}
            today={ukToday(new Date())}
            offerNewsletter={Boolean(club.privacy.newsletterProvider)}
            againHref={`${base}/contact`}
            turnstileSiteKey={turnstileSiteKey()}
          />
          <aside className="ct-aside" aria-label="Other ways to reach us">
            {details.length > 0 ? (
              <div className="ct-card ct-reception">
                <h2 className="t-eyebrow ct-eyebrow">Reception</h2>
                <ul className="ct-details">
                  {details.map((d) => (
                    <li className="ct-line" key={d.key}>
                      {d.icon}
                      <div>
                        <p className="t-label-s ct-line-label">{d.label}</p>
                        <p className="t-body-m ct-line-value">{d.value}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {settings.aside ? (
              <div className="ct-card ct-note">
                <h2 className="t-body-m">{settings.aside.title}</h2>
                <p className="t-body-s">{settings.aside.text}</p>
                {club.header.booking ? (
                  <Button
                    label={club.header.booking.label}
                    link={club.header.booking.link}
                    base={base}
                    style="link"
                  />
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  )
}
