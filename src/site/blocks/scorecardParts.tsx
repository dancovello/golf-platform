import { TeeDot } from './holeParts'
import type { SiteCourse, SiteHole, SiteTee } from './resolve'

export const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-GB'))

/** Sum of a value over some holes; null if any hole is missing it. */
export const sum = (holes: SiteHole[], value: (h: SiteHole) => number | null) => {
  let total = 0
  for (const h of holes) {
    const v = value(h)
    if (v == null) return null
    total += v
  }
  return total
}

/** Front nine, back nine; "Out", "In" (or "Total" for a 9-hole course). */
export const halves = (holes: SiteHole[]) =>
  holes.length > 9
    ? [
        { label: 'Front nine', total: 'Out', holes: holes.slice(0, 9) },
        { label: 'Back nine', total: 'In', holes: holes.slice(9) },
      ]
    : [{ label: 'Holes', total: 'Total', holes }]

/** The ladies' card differs from the men's, so the scorecard shows extra rows for it. */
export const hasLadiesPar = (holes: SiteHole[]) => holes.some((h) => h.ladiesPar != null)
export const hasLadiesSI = (holes: SiteHole[]) => holes.some((h) => h.ladiesStrokeIndex != null)
export const ladiesPar = (h: SiteHole) => h.ladiesPar ?? h.par

/** The figures band: par, length (one tee or each), course rating and slope. */
export const Summary = ({
  course,
  tees,
  ratingTee,
}: {
  course: SiteCourse
  /** Tees whose total length to show. */
  tees: SiteTee[]
  /** Whose rating and slope to show. */
  ratingTee: SiteTee | undefined
}) => {
  const par = sum(course.holes, (h) => h.par)
  const men = ratingTee?.rating != null || ratingTee?.slope != null
  const women = ratingTee?.ratingWomen != null || ratingTee?.slopeWomen != null
  const both = men && women
  const lengthOf = (t: SiteTee) => sum(course.holes, (h) => h.yards[course.tees.indexOf(t)] ?? null)
  return (
    <dl className="sc-summary">
      <div>
        <dt className="t-data-label">Par</dt>
        <dd className="t-data-serif">{fmt(par)}</dd>
      </div>
      {tees.map((t) => (
        <div key={t.colour}>
          <dt className="t-data-label">{tees.length > 1 ? t.name : 'Length'}</dt>
          <dd className="t-data-serif">{lengthOf(t) == null ? '—' : `${fmt(lengthOf(t))} yds`}</dd>
        </div>
      ))}
      {ratingTee?.rating != null ? (
        <div>
          <dt className="t-data-label">{both ? 'Course rating (men)' : 'Course rating'}</dt>
          <dd className="t-data-serif">{ratingTee.rating.toFixed(1)}</dd>
        </div>
      ) : null}
      {ratingTee?.slope != null ? (
        <div>
          <dt className="t-data-label">{both ? 'Slope (men)' : 'Slope'}</dt>
          <dd className="t-data-serif">{ratingTee.slope}</dd>
        </div>
      ) : null}
      {ratingTee?.ratingWomen != null ? (
        <div>
          <dt className="t-data-label">{men ? 'Course rating (women)' : 'Course rating'}</dt>
          <dd className="t-data-serif">{ratingTee.ratingWomen.toFixed(1)}</dd>
        </div>
      ) : null}
      {ratingTee?.slopeWomen != null ? (
        <div>
          <dt className="t-data-label">{men ? 'Slope (women)' : 'Slope'}</dt>
          <dd className="t-data-serif">{ratingTee.slopeWomen}</dd>
        </div>
      ) : null}
    </dl>
  )
}

export const TeeLabel = ({ tee, suffix = '' }: { tee: SiteTee; suffix?: string }) => (
  <span className="sc-tee">
    <TeeDot tee={tee} />
    {tee.name}
    {suffix}
  </span>
)
