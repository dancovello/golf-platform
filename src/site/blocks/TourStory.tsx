import { ArrowLeft, ArrowRight } from '../components/Icons'
import { nines, pad2 } from './holeParts'
import { Paragraphs, Photo } from './parts'
import type { SiteHole } from './resolve'
import { hasAbout, holeTees, holeTitle, type Tour } from './tour'
import { TourPicker } from './TourPicker'
import { TourExpand } from './TourExpand'
import { TourStickyBar } from './TourStickyBar'
import {
  TourFacts,
  TourHazards,
  TourScorecardLink,
  TourTees,
  TourTip,
  TourTitle,
} from './tourParts'
import { TourVideoButton } from './TourVideoButton'

/** A numbered chip per hole, with its par; the current hole is filled (Figma "Tour / Hole chip"). */
const Chip = ({ tour, hole }: { tour: Tour; hole: SiteHole }) => (
  <a
    className="tour-chip"
    href={tour.href(hole.number)}
    aria-current={hole.number === tour.hole.number ? 'page' : undefined}
    aria-label={`${holeTitle(hole)}, par ${hole.par}`}
  >
    <span className="t-nav">{pad2(hole.number)}</span>
    <span className="t-data-label">Par {hole.par}</span>
  </a>
)

/** A round arrow to the hole before or after; dimmed, and not a link, at either end. */
export const TourArrow = ({
  tour,
  to,
  direction,
}: {
  tour: Tour
  to: SiteHole | null
  direction: 'previous' | 'next'
}) => {
  const icon = direction === 'previous' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />
  return to ? (
    <a
      className="tour-arrow"
      href={tour.href(to.number)}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} hole: ${holeTitle(to)}`}
    >
      {icon}
    </a>
  ) : (
    <span className="tour-arrow is-disabled" aria-hidden="true">
      {icon}
    </span>
  )
}

/** A large photo card to the hole before or after. */
const NeighbourCard = ({
  tour,
  hole,
  direction,
}: {
  tour: Tour
  hole: SiteHole
  direction: 'previous' | 'next'
}) => (
  <a
    className={`tour-neighbour is-${direction} ${hole.image ? 'on-image' : 'on-brand'}`}
    href={tour.href(hole.number)}
    style={hole.image?.shading}
  >
    {hole.image ? (
      <Photo image={hole.image} sizes="(max-width: 767px) 100vw, 600px" alt="" />
    ) : null}
    <span className="t-eyebrow tour-neighbour-label">
      {direction === 'previous' ? '← Previous hole' : 'Next hole →'}
    </span>
    <span className="t-heading-l tour-neighbour-name">
      <span className="tour-neighbour-number">{pad2(hole.number)}</span>
      {hole.name ? <span>{hole.name}</span> : null}
    </span>
    <span className="t-body-s tour-neighbour-par">Par {hole.par}</span>
  </a>
)

/**
 * Course tour A · Hole story (Figma 415:2962; mobile 417:3972…). A full-width photo with a huge
 * hole number, name and facts; the video and plan as buttons on it. Then a sticky numbered hole
 * picker, "About the hole" beside the tee card, "How to play it", the plan beside the pro's
 * tip, the hole's other photos, and large cards to the holes either side.
 */
export const TourStory = ({ tour }: { tour: Tour }) => {
  const { hole, course } = tour
  const parts = nines(course.holes)
  const more = hole.photos.slice(1)
  const tees = holeTees(hole, course.tees).length > 0
  return (
    <section className="tour tour-story">
      <div
        className={`tour-hero ${hole.image ? 'on-image' : 'on-brand is-no-photo'}`}
        style={hole.image?.shading}
      >
        {hole.image ? (
          <Photo image={hole.image} sizes="100vw" className="tour-hero-photo" eager />
        ) : null}
        {hole.photos.length || hole.plan || hole.video ? (
          <TourExpand
            photos={hole.photos}
            plan={hole.plan}
            video={hole.video}
            title={holeTitle(hole)}
            number={pad2(hole.number)}
          />
        ) : null}
        <div className="tour-wrap tour-hero-row">
          <p className="tour-hero-number" aria-hidden="true">
            {pad2(hole.number)}
          </p>
          <div className="tour-hero-title">
            <TourTitle tour={tour} className="t-display-l tour-hero-name" />
            <TourFacts hole={hole} />
          </div>
          {hole.video || hole.plan ? (
            <div className="tour-hero-actions">
              {hole.video ? (
                <TourVideoButton embedURL={hole.video} title={`Video: ${holeTitle(hole)}`} />
              ) : null}
              {hole.plan ? (
                <a className="btn btn-outline is-on-dark t-label-button" href="#hole-plan">
                  Hole plan
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TourStickyBar className="tour-picker-bar">
        <TourPicker className="tour-wrap tour-chips" label={`${tour.heading}: holes`}>
          {parts.map((holes, i) => (
            <span key={i} className="tour-chip-group">
              {parts.length > 1 ? (
                <span className="t-data-label tour-chip-nine" aria-hidden="true">
                  {i === 0 ? 'Out' : 'In'}
                </span>
              ) : null}
              {holes.map((h) => (
                <Chip key={h.number} tour={tour} hole={h} />
              ))}
            </span>
          ))}
          <span className="tour-chip-arrows">
            <TourArrow tour={tour} to={tour.previous} direction="previous" />
            <TourArrow tour={tour} to={tour.next} direction="next" />
          </span>
        </TourPicker>
      </TourStickyBar>

      {hasAbout(tour) ? (
        <div className="tour-wrap tour-about">
          {hole.description || hole.hazards.length ? (
            <div className="tour-about-text">
              {hole.description ? (
                <>
                  <h2 className="t-eyebrow tour-eyebrow">About the hole</h2>
                  <Paragraphs text={hole.description} className="t-body-l tour-description" />
                </>
              ) : null}
              <TourHazards hole={hole} />
            </div>
          ) : null}
          {tees || tour.scorecard ? (
            <div className="tour-tee-card">
              {tees ? <h2 className="t-eyebrow tour-eyebrow">From the tees</h2> : null}
              <TourTees tour={tour} />
              <TourScorecardLink tour={tour} />
            </div>
          ) : null}
        </div>
      ) : null}

      {hole.notes.length ? (
        <div className="tour-play">
          <div className="tour-wrap">
            <h2 className="t-heading-l tour-play-heading">How to play it</h2>
            <div className="tour-play-notes">
              {hole.notes.map((note) => (
                <div key={note.key} className="tour-note">
                  <h3 className="t-data-label tour-note-label">{note.label}</h3>
                  <p className="t-body-m">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {hole.plan || hole.tip ? (
        <div className={`tour-wrap tour-plan-tip${hole.plan ? '' : ' is-tip-only'}`}>
          {hole.plan ? (
            <div className="tour-plan" id="hole-plan">
              <Photo
                image={hole.plan}
                sizes="(max-width: 767px) 100vw, 400px"
                alt={hole.plan.alt || `Plan of ${holeTitle(hole)}`}
              />
            </div>
          ) : null}
          <TourTip tour={tour} size="l" />
        </div>
      ) : null}

      {more.length ? (
        <div className="tour-wrap tour-more">
          <h2 className="t-eyebrow tour-eyebrow">More from this hole</h2>
          <ul className={`tour-more-grid is-count-${Math.min(more.length, 3)}`}>
            {more.map((photo, i) => (
              <li key={i}>
                <Photo image={photo} sizes="(max-width: 767px) 100vw, 400px" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tour.previous || tour.next ? (
        <nav className="tour-wrap tour-neighbours" aria-label="Previous and next hole">
          {tour.previous ? (
            <NeighbourCard tour={tour} hole={tour.previous} direction="previous" />
          ) : (
            <span />
          )}
          {tour.next ? <NeighbourCard tour={tour} hole={tour.next} direction="next" /> : null}
        </nav>
      ) : null}
    </section>
  )
}
