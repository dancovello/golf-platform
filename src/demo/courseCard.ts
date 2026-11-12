/**
 * The demo club's Championship course card: name, par, stroke index and yards from the White,
 * Yellow and Red tees, with a few playing tips. Shared by the demo club seed
 * (src/demo/demoClub.ts) and the marketing site's course guide demo.
 */
export const HOLE_CARD: [string, number, number, number, number, number][] = [
  ['Heather Gate', 4, 7, 420, 398, 352],
  ['The Firs', 4, 1, 446, 425, 380],
  ['Short Cut', 3, 15, 168, 152, 128],
  ['Long Ride', 5, 5, 532, 510, 455],
  ['The Pond', 4, 11, 395, 372, 330],
  ['Spion Kop', 3, 13, 192, 176, 150],
  ['Dogleg', 4, 3, 431, 410, 362],
  ['Windmill', 5, 9, 548, 522, 470],
  ['Home Pine', 4, 17, 415, 392, 348],
  ['Bracken', 4, 4, 438, 418, 368],
  ['The Dell', 3, 16, 178, 160, 136],
  ['Long Acre', 5, 6, 560, 535, 478],
  ['Birches', 4, 2, 452, 430, 384],
  ['The Ditch', 3, 14, 205, 186, 160],
  ['Ridgeway', 5, 10, 520, 498, 446],
  ['Gorse', 4, 12, 402, 380, 335],
  ['Clubhouse View', 4, 8, 440, 418, 372],
  ['The Home Hole', 4, 18, 432, 410, 365],
]
export const HOLE_TIPS = [
  'Favour the right half of the fairway; the green slopes hard from back to front.',
  'The hardest hole on the card. A long iron in is normal, so bail out short, never left.',
  'Only a short iron, but the green is a shelf. Take one more club than you think.',
  'Reachable in two for the long hitters, but the cross-bunker at 280 yards catches many.',
]

/** Course tour details for the demo club: a few sets, shared round the holes. */
export const HOLE_TOUR_DETAILS = [
  {
    description:
      'A gently rising hole cut through an avenue of Scots pine. Out of bounds runs the length of the right side, so the tee shot sets up everything.\n\nThe green is two-tiered and slopes hard from back to front. Anything above the hole is a nervous two-putt.',
    noteTee:
      'Aim at the lone pine on the horizon. A three-wood to the left half leaves the best angle in.',
    noteApproach:
      'The front is open, so a running shot is the safe option when the wind is against.',
    noteGreen: 'Two tiers, with a steep step through the middle. Leave it below the hole.',
    hazards: ['Out of bounds right', 'Two-tier green', 'Greenside bunkers'],
  },
  {
    description:
      'The heather closes in from both sides here, and the fairway narrows just where most drives finish.',
    noteTee: 'Position matters more than length. Stay short of the cross-bunker.',
    noteGreen: 'It looks flat and is not: everything falls gently towards the clubhouse.',
    hazards: ['Cross-bunker', 'Heather both sides'],
  },
  {
    description: 'A hole that plays longer than its yardage, into the prevailing wind.',
    hazards: ['Into the wind'],
  },
]
