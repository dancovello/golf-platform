import { Button } from '../components/Button'
import { ArrowRight } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import { pad2 } from './holeParts'
import { Paragraphs } from './parts'
import { Tabs } from './Tabs'
import { holeTitle, type Tour } from './tour'
import { TourFilmstrip } from './TourFilmstrip'
import { TourMedia } from './TourMedia'
import {
  TourFacts,
  TourHazards,
  TourPhoto,
  TourScorecardLink,
  TourTees,
  TourTip,
  TourTitle,
} from './tourParts'

/**
 * Course tour C · Course journey (Figma 423:5744; mobile 424:6377…). A dark filmstrip of every
 * hole with progress; the media viewer beside the hole's number, name, facts and tees, with the
 * club's booking button; tabs (an overview, then one per "how to play it" note the club wrote);
 * the pro's tip on a dark band; and "Up next" to carry on round the course.
 */
export const TourJourney = ({ tour }: { tour: Tour }) => {
  const { hole, course, next, previous } = tour
  const booking = tour.club.header.booking
  const overview = hole.description || hole.hazards.length > 0
  const tabs = [
    ...(overview
      ? [
          {
            label: 'Overview',
            panel: (
              <div className="tour-wrap tour-overview">
                {hole.description ? (
                  <div className="tour-overview-text">
                    <Paragraphs text={hole.description} className="t-body-l tour-description" />
                  </div>
                ) : null}
                <TourHazards hole={hole} />
              </div>
            ),
          },
        ]
      : []),
    ...hole.notes.map((note) => ({
      label: note.label,
      panel: (
        <div className="tour-wrap tour-overview">
          <div className="tour-overview-text">
            <p className="t-body-l tour-description">{note.text}</p>
          </div>
        </div>
      ),
    })),
  ]
  return (
    <section className="tour tour-journey">
      <div className="tour-film on-brand">
        <div className="tour-wrap">
          <TourFilmstrip
            heading={tour.heading}
            current={hole.number}
            holes={course.holes.map((h) => ({
              number: h.number,
              label: holeTitle(h),
              name: h.name,
              par: h.par,
              href: tour.href(h.number),
              image: h.image,
            }))}
          />
        </div>
      </div>

      <div className="tour-wrap tour-journey-head">
        <div className="tour-journey-media on-brand">
          <TourMedia
            photos={hole.photos}
            plan={hole.plan}
            video={hole.video}
            title={holeTitle(hole)}
            number={pad2(hole.number)}
            sizes="(max-width: 1023px) 100vw, 700px"
          />
        </div>
        <div className="tour-journey-info">
          <div className="tour-journey-title">
            <p className="tour-journey-number" aria-hidden="true">
              {pad2(hole.number)}
            </p>
            <TourTitle tour={tour} className="t-display-l tour-journey-name" />
          </div>
          <TourFacts hole={hole} />
          <TourTees tour={tour} />
          {booking || tour.scorecard ? (
            <div className="tour-journey-actions">
              {booking ? (
                <a
                  className="btn btn-solid t-label-button"
                  href={siteHref(tour.base, booking.link)}
                  {...linkTarget(booking.link)}
                >
                  {booking.label}
                  <ArrowRight />
                </a>
              ) : null}
              <TourScorecardLink tour={tour} label="Full scorecard" />
            </div>
          ) : null}
        </div>
      </div>

      {tabs.length ? (
        <div className="tour-journey-tabs">
          <Tabs
            variant="tabs"
            label="About this hole"
            labels={tabs.map((t) => t.label)}
            panels={tabs.map((t) => t.panel)}
          />
        </div>
      ) : null}

      {hole.tip ? (
        <div className="tour-journey-tip on-brand">
          <div className="tour-wrap">
            <TourTip tour={tour} size="l" />
          </div>
        </div>
      ) : null}

      {next ? (
        <div className="tour-wrap tour-next">
          <div className="tour-next-text">
            <p className="t-eyebrow tour-eyebrow">
              Up next · {next.number} of {course.holes.length}
            </p>
            <p className="t-heading-l tour-next-name">
              <span className="tour-next-number">{pad2(next.number)}</span>
              {next.name ? <span>{next.name}</span> : null}
            </p>
            <p className="t-body-l tour-next-par">Par {next.par}</p>
            <div className="tour-next-actions">
              <a className="btn btn-solid t-label-button" href={tour.href(next.number)}>
                Continue to hole {next.number}
                <ArrowRight />
              </a>
              {previous ? (
                <Button
                  label={`Back to hole ${previous.number}`}
                  link={{ kind: 'url', href: tour.href(previous.number) }}
                  base={tour.base}
                  style="link"
                  arrow={false}
                />
              ) : null}
            </div>
          </div>
          <TourPhoto
            hole={next}
            sizes="(max-width: 767px) 100vw, 560px"
            className="tour-next-photo"
          />
        </div>
      ) : null}
    </section>
  )
}
