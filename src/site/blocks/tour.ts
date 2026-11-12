import { holeSegment } from '@/blocks/courseTour/config'
import type { CourseTourBlock } from '@/payload-types'

import type { ClubSite } from '../loadClub'
import { mainYards } from './holeParts'
import type { BlockContext, ResolvedLink, SiteCourse, SiteHole, SiteTee } from './resolve'

/**
 * Everything a Course tour style needs to draw one hole (decisions.md, 12 Nov 2026). The three
 * styles show exactly the same things; only the layout differs.
 */
export type Tour = {
  /** The block's heading, e.g. "Course tour": names the list of holes. */
  heading: string
  course: SiteCourse
  hole: SiteHole
  /** None before the first hole or after the last. */
  previous: SiteHole | null
  next: SiteHole | null
  /** The address of a hole's page. */
  href: (number: number) => string
  /** "View full scorecard", when the block names a scorecard page. */
  scorecard: ResolvedLink | null
  club: ClubSite
  base: string
  /** The hole's name is the page's main heading, unless other blocks come before the tour. */
  titleTag: 'h1' | 'h2'
}

export const buildTour = ({
  block,
  ctx,
  club,
  base,
  pageSlug,
  holeNumber,
  titleTag,
}: {
  block: CourseTourBlock
  ctx: BlockContext
  club: ClubSite
  base: string
  pageSlug: string
  /** Which hole to show; the tour's own page shows the first. */
  holeNumber: number
  titleTag: 'h1' | 'h2'
}): Tour | null => {
  const course = ctx.course(block.course)
  const hole = course?.holes[holeNumber - 1]
  if (!course || !hole) return null
  return {
    heading: block.heading?.trim() || 'Course tour',
    course,
    hole,
    previous: course.holes[holeNumber - 2] ?? null,
    next: course.holes[holeNumber] ?? null,
    href: (number) => `${base}/${pageSlug}/${holeSegment(number)}`,
    scorecard: block.scorecardPage
      ? ctx.link({ type: 'page', page: block.scorecardPage }, 'View full scorecard')
      : null,
    club,
    base,
    titleTag,
  }
}

/** "Hole 7". */
export const holeNumberLabel = (hole: SiteHole) => `Hole ${hole.number}`

/** For page titles and screen readers: "Hole 7: The Dell", or "Hole 7". */
export const holeTitle = (hole: SiteHole) =>
  hole.name ? `${holeNumberLabel(hole)}: ${hole.name}` : holeNumberLabel(hole)

/** The facts row: par always; the rest only when the club gives them. */
export const holeFacts = (hole: SiteHole) => {
  const length = mainYards(hole)
  return [
    { label: 'Par', short: null, value: String(hole.par) },
    hole.strokeIndex ? { label: 'Stroke index', short: null, value: `${hole.strokeIndex}` } : null,
    hole.ladiesPar ? { label: 'Ladies’ par', short: null, value: `${hole.ladiesPar}` } : null,
    hole.ladiesStrokeIndex
      ? { label: 'Ladies’ stroke index', short: 'Ladies’ SI', value: `${hole.ladiesStrokeIndex}` }
      : null,
    length ? { label: 'Length', short: null, value: `${length} yds` } : null,
  ].filter((fact) => fact !== null)
}

/** The tees with a yardage for this hole, in the club's order. A tee without one isn't shown. */
export const holeTees = (hole: SiteHole, tees: SiteTee[]) =>
  tees.flatMap((tee, i) => (hole.yards[i] == null ? [] : [{ tee, yards: hole.yards[i] }]))

/** Whether the hole has anything for a "plan and tip" or "about" part, so empty parts leave no gap. */
export const hasAbout = (tour: Tour) =>
  Boolean(
    tour.hole.description ||
    tour.hole.hazards.length ||
    holeTees(tour.hole, tour.course.tees).length ||
    tour.scorecard,
  )
