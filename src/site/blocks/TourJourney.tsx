import { Button } from '../components/Button'
import { ArrowRight } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import { pad2 } from './holeParts'
import type { SiteMedia } from './media'
import { Paragraphs, Photo } from './parts'
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
  // Each tab gets a photo of its own where the hole has enough of them, so the tabs are not
  // just words (Dan, 13 Nov: "media is key"). Hole 1's photo is already in the viewer above.
  const pool = hole.photos
  const photoFor = (i: number) => (pool.length > 1 ? pool[(i % (pool.length - 1)) + 1] : null)
  const tabPhoto = (image: SiteMedia | null, isPlan = false) =>
    image ? (
      <div className={`tour-step-photo${isPlan ? ' is-plan' : ''}`}>
        <Photo
          image={image}
          sizes="(max-width: 767px) 100vw, 520px"
          alt={isPlan ? image.alt || `Plan of ${holeTitle(hole)}` : ''}
        />
      </div>
    ) : null
  const tabs = [
    ...(overview
      ? [
          {
            label: 'Overview',
            panel: (
              <div className={`tour-wrap tour-overview${photoFor(0) ? ' has-photo' : ''}`}>
                <div className="tour-overview-text">
                  {hole.description ? (
                    <Paragraphs text={hole.description} className="t-body-l tour-description" />
                  ) : null}
                  <TourHazards hole={hole} />
                </div>
                {tabPhoto(photoFor(0))}
              </div>
            ),
          },
        ]
      : []),
    ...hole.notes.map((note, i) => {
      // "Step 2 of 3": the order the hole is played in, with the step being read marked.
      const image = note.key === 'green' && hole.plan ? hole.plan : photoFor(i + (overview ? 1 : 0))
      return {
        label: note.label,
        panel: (
          <div className="tour-wrap tour-step">
            <div className="tour-step-text">
              <ol className="t-data-label tour-steps" aria-label="Playing order">
                {hole.notes.map((n, j) => (
                  <li key={n.key} aria-current={j === i ? 'step' : undefined}>
                    <span>{pad2(j + 1)}</span>
                    <span>{n.label}</span>
                  </li>
                ))}
              </ol>
              <p className="t-quote-l tour-step-quote">{note.text}</p>
            </div>
            {tabPhoto(image, image === hole.plan)}
          </div>
        ),
      }
    }),
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
