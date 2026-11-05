/**
 * How a row of cards lays out on a wide screen, for every card block, so a lone card never sits
 * on a row of its own: 1-3 cards go on one line, 4 go on one line or 2 + 2, 5 go 2 + 3, 6 go 3 + 3.
 * Returns class names; the matching rules are in blocks.css (`cards-2x2`, `cards-5`).
 * Tablets and phones keep each block's own rules (two across, then a swipe row).
 */
export const cardRows = (count: number, fourAcross: boolean): string => {
  if (count <= 1) return 'cols-1'
  if (count === 2) return 'cols-2'
  if (count === 3) return 'cols-3'
  if (count === 4) return fourAcross ? 'cols-4' : 'cols-3 cards-2x2'
  if (count === 5) return 'cols-3 cards-5'
  return 'cols-3'
}
