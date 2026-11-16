/**
 * Course handicap tables (G7, 15 Nov 2026), worked out from a tee's rating, slope and par with
 * the World Handicap System formula: Course Handicap = Handicap Index × (Slope ÷ 113) +
 * (Course Rating − Par), rounded to the nearest whole number (halves go up). The table groups
 * the indexes that give the same course handicap, as clubs print them. A playing handicap
 * applies an allowance (such as 95%) to the course handicap and rounds again.
 */

export type HandicapRow = {
  /** The lowest and highest index in this band, to one decimal place. */
  from: number
  to: number
  courseHandicap: number
  /** Only when an allowance other than 100% is applied. */
  playingHandicap: number | null
}

/** The highest index the World Handicap System allows. */
export const MAX_INDEX = 54

// "+ 0" turns a rounded -0 into 0.
const round = (n: number) => Math.round(n) + 0

/** The course handicap for one index (in tenths, to avoid fractions drifting). */
export const courseHandicap = (indexTenths: number, rating: number, slope: number, par: number) =>
  round((indexTenths / 10) * (slope / 113) + (rating - par))

/**
 * The table for one tee and one set of players: bands of index with the same course handicap,
 * from index 0.0 to 54.0. Null when the rating, slope or par is missing.
 */
export const handicapTable = (
  { rating, slope, par }: { rating: number | null; slope: number | null; par: number | null },
  allowancePercent = 100,
): HandicapRow[] | null => {
  if (rating == null || slope == null || par == null) return null
  const playing = (ch: number) =>
    allowancePercent === 100 ? null : round(ch * (allowancePercent / 100))
  const rows: HandicapRow[] = []
  for (let tenths = 0; tenths <= MAX_INDEX * 10; tenths++) {
    const ch = courseHandicap(tenths, rating, slope, par)
    const last = rows[rows.length - 1]
    if (last && last.courseHandicap === ch) last.to = tenths / 10
    else
      rows.push({
        from: tenths / 10,
        to: tenths / 10,
        courseHandicap: ch,
        playingHandicap: playing(ch),
      })
  }
  return rows
}

/** "+3" for a plus handicap, "0" for scratch, otherwise "12". */
export const showHandicap = (n: number) => (n < 0 ? `+${-n}` : String(n))

/** "10.4 – 11.2" (or one figure when a band is a single index). */
export const showRange = (row: Pick<HandicapRow, 'from' | 'to'>) =>
  row.from === row.to ? row.from.toFixed(1) : `${row.from.toFixed(1)} – ${row.to.toFixed(1)}`
