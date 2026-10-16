import type { ReactNode } from 'react'

import { formatPolicyDate, type PolicyFacts, RETENTION } from './policy'

type Section = { key: string; title: string; show?: boolean; body: ReactNode }

const Mail = ({ to }: { to: string }) => <a href={`mailto:${to}`}>{to}</a>

/** A textarea address, one line each. */
const Lines = ({ text }: { text: string }) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i, all) => (
      <span key={i}>
        {line}
        {i < all.length - 1 ? <br /> : null}
      </span>
    ))

/**
 * Every club's privacy policy (the wording agreed in the privacy-policy brief). Parts for
 * features a club doesn't use are left out completely, and sections are numbered as they're
 * drawn so the numbers stay in order. Every club detail is a React value, never text pasted
 * into a template, so a placeholder can't leak onto the page.
 */
export const PrivacyPolicy = ({
  facts,
  platformName,
  lastUpdated,
  additional,
}: {
  facts: PolicyFacts
  platformName: string
  /** ISO date, e.g. 2026-10-15. */
  lastUpdated: string
  /** The club's "Additional information", already drawn. Only shown when it has content. */
  additional?: ReactNode
}) => {
  const f = facts.features
  const contactBy = facts.privacyEmail ? (
    <>
      email <Mail to={facts.privacyEmail} />
    </>
  ) : (
    <>contact us using the details below</>
  )

  const essentialExamples = [
    f.accounts ? 'keeping you logged in' : null,
    f.bookings ? 'holding a booking slot while you pay' : null,
  ].filter((x): x is string => !!x)

  const sharedWith = [
    `${platformName}, our website provider, and the hosting, storage and email services they use`,
    f.payments ? 'Stripe, to process payments' : null,
    f.newsletter ? `${facts.newsletterProvider}, to send our newsletter` : null,
    f.ga ? 'Google, for analytics, only if you consent' : null,
  ].filter((x): x is string => !!x)

  const collected: { show: boolean; cells: ReactNode[] }[] = [
    {
      show: true,
      cells: [
        'Send an enquiry or contact form',
        'Name, email, phone (optional), your message',
        'To reply to you, including membership and visitor enquiries',
        'Legitimate interests',
      ],
    },
    {
      show: f.newsletter,
      cells: [
        'Sign up to our newsletter',
        'Email address, name if given',
        `To send club news. We use ${facts.newsletterProvider} to manage the list and send emails`,
        'Consent. Unsubscribe any time using the link in every email',
      ],
    },
    {
      show: f.accounts,
      cells: [
        'Create or use a member account',
        'Name, email, password (stored encrypted), membership details',
        'To let you log in and manage your membership and bookings',
        'Contract',
      ],
    },
    {
      show: f.bookings,
      cells: [
        'Make a booking',
        'Name, email, phone, booking details (date, time, players, facility)',
        'To take, confirm, change and manage your booking, and send reminders',
        'Contract',
      ],
    },
    {
      show: f.payments,
      cells: [
        'Pay online or give a card guarantee',
        'Card details are entered directly with Stripe. We only see the last four digits, card type and payment status',
        'To take payment and, where shown at booking, charge any no-show or late cancellation fee',
        'Contract',
      ],
    },
    {
      // Only Google Analytics collects this. Without it, server logs are the only visit data.
      show: f.ga,
      cells: [
        'Visit the website',
        'Pages viewed, device and browser type, approximate location (country/region), referring site',
        'To understand how the site is used and keep it working well',
        'Consent (Google Analytics, only if you accept analytics cookies)',
      ],
    },
    {
      show: true,
      cells: [
        'Visit the website (server logs)',
        'IP address, date and time, pages requested',
        'To keep the site secure and fix problems',
        'Legitimate interests',
      ],
    },
  ]

  const kept: { show: boolean; what: string; howLong: string }[] = [
    { show: true, what: 'Enquiries and contact messages', howLong: RETENTION.enquiries },
    { show: f.newsletter, what: 'Newsletter sign-ups', howLong: RETENTION.newsletter },
    { show: f.accounts, what: 'Member accounts', howLong: RETENTION.accounts },
    { show: f.bookings, what: 'Booking and payment records', howLong: RETENTION.bookings },
    { show: true, what: 'Server logs', howLong: RETENTION.serverLogs },
    { show: f.ga, what: 'Google Analytics data', howLong: RETENTION.ga },
  ]

  const sections: Section[] = [
    {
      key: 'who',
      title: 'Who we are',
      body: (
        <>
          <p>
            {facts.legalName}
            {facts.address ? `, ${facts.address.replace(/\s*\r?\n\s*/g, ', ')},` : ''} is
            responsible for your personal information. In data protection law, that makes us the{' '}
            <strong>controller</strong>.
          </p>
          <p>
            Our website runs on a platform provided by {platformName}. They host the site and
            process information on our behalf, under a written agreement that only lets them use it
            to run our website. That makes them our <strong>processor</strong>.
          </p>
          <p>
            We follow the UK General Data Protection Regulation (UK GDPR) and the Data Protection
            Act 2018.
          </p>
        </>
      ),
    },
    {
      key: 'collect',
      title: 'What we collect and why',
      body: (
        <>
          <p>
            We only collect what we need for the purpose below. The “legal basis” is the reason the
            law allows us to use it.
          </p>
          <div className="pp-table-wrap">
            <table className="pp-table">
              <caption className="pp-sr-only">What we collect and why</caption>
              <thead>
                <tr>
                  <th scope="col">What you do</th>
                  <th scope="col">What we collect</th>
                  <th scope="col">Why</th>
                  <th scope="col">Legal basis</th>
                </tr>
              </thead>
              <tbody>
                {collected
                  .filter((r) => r.show)
                  .map((r, i) => (
                    <tr key={i}>
                      <th scope="row">{r.cells[0]}</th>
                      {r.cells.slice(1).map((c, k) => (
                        <td key={k}>{c}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p>
            We never sell your personal information, and we don’t use it for automated decisions
            that affect you.
          </p>
          {f.payments ? (
            <p>
              <strong>Payments.</strong> Stripe processes card payments as an independent controller
              of that payment data. You can read{' '}
              <a href="https://stripe.com/gb/privacy" rel="noopener">
                Stripe’s privacy policy
              </a>
              . We never see or store your full card number.
            </p>
          ) : null}
        </>
      ),
    },
    {
      key: 'cookies',
      title: f.ga ? 'Cookies and analytics' : 'Cookies',
      body: (
        <>
          <p>We use a small number of cookies and similar technologies.</p>
          <ul>
            <li>
              <strong>Essential:</strong> needed for the site to work
              {essentialExamples.length > 0 ? `, such as ${essentialExamples.join(' or ')}` : ''}.
              These don’t need consent.
            </li>
            {f.spamCheck ? (
              <li>
                <strong>Spam protection:</strong> our contact form uses Cloudflare Turnstile to
                check that a message comes from a person, not a robot. It looks at technical details
                of your browser when you use the form, doesn’t track you across websites, and
                doesn’t need consent.
              </li>
            ) : null}
            {f.ga ? (
              <li>
                <strong>Google Analytics:</strong> only runs if you accept analytics cookies in our
                cookie banner. It helps us understand how visitors use the site. You can change your
                choice any time using the “Cookie settings” link in the footer.
              </li>
            ) : null}
          </ul>
        </>
      ),
    },
    {
      key: 'sharing',
      title: 'Who we share it with',
      body: (
        <>
          <p>
            We only share your information with organisations that help us run the website and our
            services:
          </p>
          <ul>
            {sharedWith.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p>
            We may also share information if the law requires it, for example with the police or a
            court.
          </p>
        </>
      ),
    },
    {
      key: 'transfers',
      title: 'Transfers outside the UK',
      body: (
        <p>
          Some of these providers store or access data outside the UK, including in the USA. Where
          they do, the transfer is protected by UK adequacy regulations (including the UK–US Data
          Bridge) or the ICO’s approved contract terms.
        </p>
      ),
    },
    {
      key: 'retention',
      title: 'How long we keep it',
      body: (
        <>
          <div className="pp-table-wrap">
            <table className="pp-table">
              <caption className="pp-sr-only">How long we keep it</caption>
              <thead>
                <tr>
                  <th scope="col">Information</th>
                  <th scope="col">How long</th>
                </tr>
              </thead>
              <tbody>
                {kept
                  .filter((r) => r.show)
                  .map((r) => (
                    <tr key={r.what}>
                      <th scope="row">{r.what}</th>
                      <td>{r.howLong}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p>After that we delete it or make it anonymous.</p>
        </>
      ),
    },
    {
      key: 'security',
      title: 'Keeping it secure',
      body: (
        <p>
          The site runs over an encrypted connection (HTTPS). Passwords are encrypted and access to
          personal information is limited to people who need it. No system is completely secure, but
          we take reasonable steps to protect your information.
        </p>
      ),
    },
    {
      key: 'children',
      title: 'Children',
      body: (
        <p>
          Our website isn’t aimed at children.
          {f.accounts
            ? ' Junior members under 13 can only have an account set up by a parent or guardian, who manages it on their behalf.'
            : ''}
        </p>
      ),
    },
    {
      key: 'rights',
      title: 'Your rights',
      body: (
        <>
          <p>You have the right to:</p>
          <ul>
            <li>ask for a copy of the information we hold about you</li>
            <li>ask us to correct anything that’s wrong</li>
            <li>ask us to delete your information</li>
            <li>ask us to limit how we use it, or object to us using it</li>
            <li>withdraw consent at any time, where we rely on consent</li>
            <li>ask for your information in a format you can take elsewhere</li>
          </ul>
          <p>
            To use any of these rights, {contactBy}. We’ll respond within one month. There’s no
            charge.
          </p>
        </>
      ),
    },
    {
      key: 'complaints',
      title: 'Complaints',
      body: (
        <>
          <p>
            If you’re unhappy with how we’ve handled your information, please contact us first
            {facts.privacyEmail ? (
              <>
                {' '}
                at <Mail to={facts.privacyEmail} />
              </>
            ) : null}{' '}
            so we can put it right.
          </p>
          <p>
            You can also complain to the Information Commissioner’s Office (ICO) at{' '}
            <a href="https://ico.org.uk/make-a-complaint" rel="noopener">
              ico.org.uk/make-a-complaint
            </a>{' '}
            or on <a href="tel:03031231113">0303 123 1113</a>.
          </p>
        </>
      ),
    },
    {
      key: 'changes',
      title: 'Changes to this policy',
      body: (
        <p>
          We may update this policy when our website or the law changes. The date at the top shows
          when it last changed.
        </p>
      ),
    },
    {
      key: 'additional',
      title: 'Additional information',
      show: facts.additionalInfo !== null && additional != null,
      body: <div className="pp-additional">{additional}</div>,
    },
    {
      key: 'contact',
      title: 'Contact us',
      body: (
        <p>
          {facts.legalName}
          {facts.address ? (
            <>
              <br />
              <Lines text={facts.address} />
            </>
          ) : null}
          {facts.privacyEmail ? (
            <>
              <br />
              Email: <Mail to={facts.privacyEmail} />
            </>
          ) : null}
          {facts.phone ? (
            <>
              <br />
              Phone: <a href={`tel:${facts.phone.replace(/[^+0-9]/g, '')}`}>{facts.phone}</a>
            </>
          ) : null}
        </p>
      ),
    },
  ]

  return (
    <article className="pv-section pp">
      <h1 className="t-display-l">Privacy policy</h1>
      <p className="t-body-s pp-updated">
        Last updated: <time dateTime={lastUpdated}>{formatPolicyDate(lastUpdated)}</time>
      </p>
      <p className="t-body-l">
        This policy explains how {facts.clubName} collects and uses your personal information when
        you use our website. We keep it short and plain. If anything is unclear, get in touch using
        the details at the end.
      </p>
      {sections
        .filter((s) => s.show !== false)
        .map((s, i) => (
          <section key={s.key} className="pp-section" aria-labelledby={`pp-${s.key}`}>
            <h2 id={`pp-${s.key}`} className="t-heading-l">
              {i + 1}. {s.title}
            </h2>
            {s.body}
          </section>
        ))}
    </article>
  )
}
