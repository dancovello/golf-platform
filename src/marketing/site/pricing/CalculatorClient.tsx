import { MarketingIcon } from '../MarketingIcon'
import { AvailabilityBadge, MarketingButton } from '../parts'
import { RollingNumber } from './RollingNumber'

const money = (pounds: number) => `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`

/**
 * Marketing/Pricing Calculator (185:3775; mobile 274:9203). Only live modules price: the website.
 * There is no course selector: the number of courses is part of each club's own setup (Dan,
 * 9 Nov 2026), and no VAT wording appears because the company is not VAT registered.
 */
export const CalculatorClient = ({
  title,
  terms,
  comingNext,
  included,
  footnote,
  price,
}: {
  title: string
  terms: string
  comingNext: { title: string; body: string }[]
  included: string[]
  footnote: string
  price: number
}) => {
  return (
    <div className="mk-calc">
      <div className="mk-calc-build">
        <div className="mk-calc-top">
          <h2 className="mk-calc-title">{title}</h2>
          <p className="mk-calc-terms">{terms}</p>
        </div>
        {comingNext.length ? (
          <div className="mk-calc-next">
            <p className="mk-calc-next-heading">
              Coming next
              {/* Phones show this once here, in place of each row's own line. */}
              <span className="mk-calc-next-later"> · prices confirmed at launch</span>
            </p>
            {comingNext.map((module) => (
              <div key={module.title} className="mk-calc-row mk-calc-row--next">
                <div className="mk-calc-text">
                  <p className="mk-calc-name">
                    {module.title}
                    <span className="mk-calc-badge-phone">
                      <AvailabilityBadge status="coming-next" size="small" />
                    </span>
                  </p>
                  <p className="mk-calc-body">{module.body}</p>
                </div>
                <p className="mk-calc-later">Price confirmed at launch</p>
                <span className="mk-calc-badge-desktop">
                  <AvailabilityBadge status="coming-next" size="small" />
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mk-calc-total">
        <p className="mk-calc-label">Your plan</p>
        <p className="mk-calc-price" aria-live="polite">
          <span className="mk-calc-amount">
            <RollingNumber text={money(price)} />
          </span>
          <span className="mk-calc-per">/ month</span>
        </p>
        <dl className="mk-calc-breakdown">
          <div>
            <dt>Your club’s website</dt>
            <dd>{money(price)}</dd>
          </div>
        </dl>
        <ul className="mk-calc-included">
          {included.map((item) => (
            <li key={item}>
              <MarketingIcon name="check" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <MarketingButton label="Book a demo" href="/book-a-demo" variant="primary" />
        <p className="mk-calc-footnote">{footnote}</p>
      </div>
    </div>
  )
}
