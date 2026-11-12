import { nines, pad2 } from './holeParts'
import { Paragraphs } from './parts'
import type { SiteHole } from './resolve'
import { holeTees, holeTitle, type Tour } from './tour'
import { TourMedia } from './TourMedia'
import { TourPicker } from './TourPicker'
import { TourStickyBar } from './TourStickyBar'
import { TourArrow } from './TourStory'
import {
  TourFacts,
  TourHazards,
  TourPhoto,
  TourScorecardLink,
  TourTees,
  TourTip,
  TourTitle,
} from './tourParts'

/** The hole before or after, in the bar under the details: a small photo, number, name, par. */
const BarLink = ({
  tour,
  hole,
  direction,
}: {
  tour: Tour
  hole: SiteHole
  direction: 'previous' | 'next'
}) => (
  <a className={`tour-bar-link is-${direction}`} href={tour.href(hole.number)}>
    <TourPhoto hole={hole} sizes="112px" className="tour-bar-photo" />
    <span className="tour-bar-text">
      <span className="t-eyebrow tour-bar-label">
        {direction === 'previous' ? '← Previous' : 'Next →'}
      </span>
      <span className="t-heading-m tour-bar-name">
        <span className="tour-bar-number">{pad2(hole.number)}</span>
        {hole.name ? <span>{hole.name}</span> : null}
      </span>
      <span className="t-body-s tour-bar-par">Par {hole.par}</span>
    </span>
  </a>
)

/**
 * Course tour B · Split-screen guide (Figma 419:4695; mobile 422:5364…). A slim numbered rail
 * of holes; then the photos, plan and video pinned on the left at the window's height while the
 * details scroll on the right; then a bar to the holes either side. On phones everything stacks
 * and the bar stays at the bottom of the screen.
 */
export const TourSplit = ({ tour }: { tour: Tour }) => {
  const { hole, course } = tour
  const parts = nines(course.holes)
  const tees = holeTees(hole, course.tees).length > 0
  return (
    <section className="tour tour-split">
      <TourStickyBar className="tour-rail-bar">
        <TourPicker className="tour-wrap tour-rail" label={`${tour.heading}: holes`}>
          <TourArrow tour={tour} to={tour.previous} direction="previous" />
          {parts.map((holes, i) => (
            <span key={i} className="tour-rail-group">
              {holes.map((h) => (
                <a
                  key={h.number}
                  className="t-label-s tour-dot"
                  href={tour.href(h.number)}
                  aria-current={h.number === hole.number ? 'page' : undefined}
                  aria-label={`${holeTitle(h)}, par ${h.par}`}
                >
                  {pad2(h.number)}
                </a>
              ))}
            </span>
          ))}
          <TourArrow tour={tour} to={tour.next} direction="next" />
        </TourPicker>
      </TourStickyBar>

      <div className="tour-split-body">
        <div className="tour-split-media on-brand">
          <TourMedia
            photos={hole.photos}
            plan={hole.plan}
            video={hole.video}
            title={holeTitle(hole)}
            number={pad2(hole.number)}
            sizes="(max-width: 1023px) 100vw, 46vw"
          />
        </div>
        <div className="tour-split-details">
          <div className="tour-split-title">
            {hole.name ? (
              <p className="t-eyebrow tour-eyebrow" aria-hidden="true">
                Hole {hole.number}
              </p>
            ) : null}
            <TourTitle tour={tour} className="t-display-l tour-split-name" showNumber />
          </div>
          <TourFacts hole={hole} />
          {tees || tour.scorecard ? (
            <div className="tour-tee-card">
              {tees ? <h2 className="t-eyebrow tour-eyebrow">From the tees</h2> : null}
              <TourTees tour={tour} />
              <TourScorecardLink tour={tour} />
            </div>
          ) : null}
          {hole.description ? (
            <div className="tour-split-about">
              <h2 className="t-eyebrow tour-eyebrow">About the hole</h2>
              <Paragraphs text={hole.description} className="t-body-m tour-description" />
            </div>
          ) : null}
          <TourHazards hole={hole} />
          {hole.notes.length ? (
            <div className="tour-split-play">
              <h2 className="t-heading-m">How to play it</h2>
              {hole.notes.map((note) => (
                <div key={note.key} className="tour-split-note">
                  <h3 className="t-data-label tour-note-label">{note.label}</h3>
                  <p className="t-body-m">{note.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {hole.tip ? (
            <div className="tour-split-tip">
              <TourTip tour={tour} size="m" />
            </div>
          ) : null}
        </div>
      </div>

      {tour.previous || tour.next ? (
        <nav className="tour-bar" aria-label="Previous and next hole">
          <div className="tour-wrap tour-bar-row">
            {tour.previous ? (
              <BarLink tour={tour} hole={tour.previous} direction="previous" />
            ) : (
              <span />
            )}
            {tour.next ? <BarLink tour={tour} hole={tour.next} direction="next" /> : null}
          </div>
        </nav>
      ) : null}
    </section>
  )
}
