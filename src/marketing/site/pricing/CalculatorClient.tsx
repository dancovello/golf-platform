'use client'

import { useState } from 'react'

import { MarketingIcon } from '../MarketingIcon'
import { AvailabilityBadge, MarketingButton } from '../parts'
import { RollingNumber } from './RollingNumber'

const money = (pounds: number) => `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`

/**
 * Marketing/Pricing Calculator (185:3775; mobile 274:9203). Only live modules price: the website,
 * per course. A second course is offered only once its price is in Settings (open question Q3).
 */
export const CalculatorClient = ({
  title,
  terms,
  coursesText,
  comingNext,
  included,
  footnote,
  price,
  secondCourse,
  vatLabel,
}: {
  title: string
  terms: string
  coursesText: string
  comingNext: { title: string; body: string }[]
  included: string[]
  footnote: string
  price: number
  secondCourse: number | null
  vatLabel: string
}) => {
  const [courses, setCourses] = useState(1)
  const maxCourses = secondCourse === null ? 1 : 2
  const total = price + (courses === 2 && secondCourse !== null ? secondCourse : 0)
  return (
    <div className="mk-calc">
      <div className="mk-calc-build">
        <div className="mk-calc-top">
          <h2 className="mk-calc-title">{title}</h2>
          <p className="mk-calc-terms">{terms}</p>
        </div>
        <div className="mk-calc-row">
          <div className="mk-calc-text">
            <p className="mk-calc-name" id="mk-calc-courses">
              Courses
            </p>
            <p className="mk-calc-body">
              {coursesText}
              {secondCourse !== null ? (
                <span className="mk-calc-extra">
                  {' '}
                  Extra course + {money(secondCourse)} / month.
                </span>
              ) : null}
            </p>
          </div>
          <div className="mk-stepper" role="group" aria-labelledby="mk-calc-courses">
            <button
              type="button"
              aria-label="One fewer course"
              disabled={courses <= 1}
              onClick={() => setCourses(courses - 1)}
            >
              −
            </button>
            <output aria-live="polite" aria-label={`${courses} course${courses === 1 ? '' : 's'}`}>
              {courses}
            </output>
            <button
              type="button"
              aria-label="One more course"
              disabled={courses >= maxCourses}
              onClick={() => setCourses(courses + 1)}
            >
              +
            </button>
          </div>
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
            <RollingNumber text={money(total)} />
          </span>
          <span className="mk-calc-per">/ month {vatLabel}</span>
        </p>
        <dl className="mk-calc-breakdown">
          <div>
            <dt>Website, 1 course</dt>
            <dd>{money(price)}</dd>
          </div>
          {courses === 2 && secondCourse !== null ? (
            <div>
              <dt>Second course</dt>
              <dd>{money(secondCourse)}</dd>
            </div>
          ) : null}
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
