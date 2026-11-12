import { Button } from '../components/Button'
import { pad2, TeeDot } from './holeParts'
import { Photo } from './parts'
import type { SiteHole } from './resolve'
import { holeFacts, holeTees, holeTitle, type Tour } from './tour'

/**
 * The parts all three Course tour styles share (Figma "Tour / Tee row", key facts, tags). Each
 * returns nothing when the club left it empty, so no style draws an empty box or a lone heading.
 */

/** The hole's name as the heading; with no name the number is the heading ("Hole 7"). */
export const TourTitle = ({
  tour,
  className,
  showNumber = false,
}: {
  tour: Tour
  className: string
  /** Where no big number is drawn nearby (style B), a hole without a name shows "Hole 7". */
  showNumber?: boolean
}) => {
  const Tag = tour.titleTag
  return tour.hole.name ? (
    <Tag className={className}>
      <span className="visually-hidden">Hole {tour.hole.number}: </span>
      {tour.hole.name}
    </Tag>
  ) : (
    <Tag className={showNumber ? className : 'visually-hidden'}>{holeTitle(tour.hole)}</Tag>
  )
}

/** Par, stroke index, the ladies' figures and the length from the main tee. */
export const TourFacts = ({ hole }: { hole: SiteHole }) => (
  <dl className="tour-facts">
    {holeFacts(hole).map((fact) => (
      <div key={fact.label} className="tour-fact">
        <dt className="t-data-label">
          {fact.short ? (
            <>
              <span className="tour-wide">{fact.label}</span>
              <span className="tour-narrow">{fact.short}</span>
            </>
          ) : (
            fact.label
          )}
        </dt>
        <dd className="t-data-serif">{fact.value}</dd>
      </div>
    ))}
  </dl>
)

/** One row per tee with a yardage for this hole: colour dot, the club's name for it, yards. */
export const TourTees = ({ tour }: { tour: Tour }) => {
  const rows = holeTees(tour.hole, tour.course.tees)
  if (rows.length === 0) return null
  return (
    <ul className="tour-tees" aria-label="Yards from each tee">
      {rows.map(({ tee, yards }) => (
        <li key={tee.colour} className="tour-tee">
          <TeeDot tee={tee} />
          <span className="t-body-s tour-tee-name">{tee.name}</span>
          <span className="t-data-sans tour-tee-yards">
            {yards}
            <span className="visually-hidden"> yards</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** "View full scorecard", when the block points at a scorecard page. */
export const TourScorecardLink = ({ tour, label }: { tour: Tour; label?: string }) =>
  tour.scorecard ? (
    <Button
      label={label ?? tour.scorecard.label}
      link={tour.scorecard.link}
      base={tour.base}
      style="link"
    />
  ) : null

/** "Watch out for": the hole's hazard tags. */
export const TourHazards = ({ hole }: { hole: SiteHole }) =>
  hole.hazards.length === 0 ? null : (
    <div className="tour-hazards">
      <p className="t-data-label tour-hazards-label">Watch out for</p>
      <ul className="tour-tags">
        {hole.hazards.map((hazard, i) => (
          <li key={i} className="t-data-label tour-tag">
            {hazard}
          </li>
        ))}
      </ul>
    </div>
  )

/** The playing tip as a quote, with who it is from underneath when the course says. */
export const TourTip = ({ tour, size }: { tour: Tour; size: 'l' | 'm' }) =>
  tour.hole.tip ? (
    <figure className="tour-tip">
      <figcaption className="t-eyebrow tour-eyebrow">The pro’s tip</figcaption>
      <blockquote className={`t-quote-${size} tour-tip-quote`}>“{tour.hole.tip}”</blockquote>
      {tour.course.tipFrom ? <p className="t-body-s tour-tip-from">{tour.course.tipFrom}</p> : null}
    </figure>
  ) : null

/** A hole's photo, or with none a panel in the club's colour carrying the hole's number. */
export const TourPhoto = ({
  hole,
  sizes,
  className = '',
  eager = false,
}: {
  hole: SiteHole
  sizes: string
  className?: string
  eager?: boolean
}) =>
  hole.image ? (
    <Photo image={hole.image} sizes={sizes} className={className} eager={eager} alt="" />
  ) : (
    <span className={`tour-no-photo on-brand ${className}`} aria-hidden="true">
      {pad2(hole.number)}
    </span>
  )
