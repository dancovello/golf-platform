/**
 * Tee colours (Figma "Tee Marker"). System colours, the same for every club; always shown
 * with a word, never colour alone. A plain module so the website can use it without the CMS.
 * Black is for clubs whose back tees sit behind the whites (course tour, 12 Nov 2026). Green,
 * gold, orange, purple and silver were added after the 50-club audit (G1, 15 Nov 2026).
 */
export const TEE_COLOURS = [
  { label: 'White', value: 'white' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Black', value: 'black' },
  { label: 'Green', value: 'green' },
  { label: 'Gold', value: 'gold' },
  { label: 'Orange', value: 'orange' },
  { label: 'Purple', value: 'purple' },
  { label: 'Silver', value: 'silver' },
] as const

export type TeeColour = (typeof TEE_COLOURS)[number]['value']

/** Who plays a tee. Most tees are played by everyone; some are men's or women's only. */
export const TEE_PLAYERS = [
  { label: 'Everyone', value: 'both' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
] as const

export type TeePlayers = (typeof TEE_PLAYERS)[number]['value']

/** Most tees a course can have (Worplesdon has eight: four men's, four women's). */
export const MAX_TEES = 8

/** The longest name a club can give a tee, e.g. "Championship Back Markers". */
export const TEE_NAME_MAX = 25

/** The slot numbers a hole's yards can be stored in: 1 to 8. */
export const TEE_SLOTS = Array.from({ length: MAX_TEES }, (_, i) => i + 1)

/** The hole field that holds the yards for a tee slot, e.g. "yards3". */
export const yardsSlotField = (slot: number) => `yards${slot}` as `yards${number}`

/**
 * Each tee keeps its own slot for its yards, so reordering tees never mixes up the yards.
 * Tees that already have a slot keep it; new tees take the lowest free slots, in order.
 * The admin form and the save hook both use this, so they always agree.
 */
export const teeSlots = (tees: { slot?: number | null }[]): number[] => {
  const taken = new Set<number>()
  const slots = tees.map((t) => {
    const s = t.slot
    if (typeof s === 'number' && s >= 1 && s <= MAX_TEES && !taken.has(s)) {
      taken.add(s)
      return s
    }
    return 0
  })
  return slots.map((s) => {
    if (s) return s
    const free = TEE_SLOTS.find((n) => !taken.has(n)) ?? 0
    taken.add(free)
    return free
  })
}

type TeeNameParts = {
  colour: TeeColour
  name?: string | null
  players?: TeePlayers | null
  winter?: boolean | null
}

/**
 * A tee's name on the website: the club's own, or else built from its colour, e.g. "White",
 * "Winter yellow", "Women's red".
 */
export const teeName = (tee: TeeNameParts) => {
  const own = tee.name?.trim()
  if (own) return own
  const colour = TEE_COLOURS.find((c) => c.value === tee.colour)?.label ?? tee.colour
  const words = [
    tee.players === 'women' ? 'Women’s' : null,
    tee.winter ? 'Winter' : null,
    colour,
  ].filter((w): w is string => Boolean(w))
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(' ')
}

/** A tee's name as a web address part, for "?tee=women-s-red". */
export const teeKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
