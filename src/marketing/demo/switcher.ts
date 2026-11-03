import type { Page } from '@/payload-types'
import type { FontSetID } from '@/theme/fontSets'

import { DEMO_CLUBS, type DemoClub, type DemoClubID } from './clubs'
import type { DemoPhotoKey } from './photos'

/**
 * The Block Switcher's content (Figma Marketing/Block Switcher 359:5798, "Every block, three
 * ways" and "Same block. A different club."): the Two-Column block in each of its three designs,
 * shown in each of two demo clubs' colours and fonts. Same words in both clubs, so the only
 * change is the club's identity. The real block draws them (/frame/two-column/<club>/<design>).
 */
export const SWITCHER_BLOCK = 'Text and image'

/** The two clubs offered, in the order of the chips (the Tenant Morph's first two). */
export const SWITCHER_CLUBS: DemoClub[] = DEMO_CLUBS.filter(
  (c) => c.id === 'heritage' || c.id === 'coastal',
)

/**
 * Carreg Bay wears a different font set here from its Tenant Morph hero (Figma 359:5496: a
 * bolder serif), so the switcher shows colours and fonts changing together.
 */
export const SWITCHER_FONT_SETS: Record<'heritage' | 'coastal', FontSetID> = {
  heritage: 'heritage',
  coastal: 'editorial',
}

export type SwitcherDesign = 'split' | 'collage' | 'keyFacts'

type TwoColumn = Extract<NonNullable<Page['layout']>[number], { blockType: 'twoColumn' }>

type Content = {
  id: SwitcherDesign
  /** The segment's label, and the line under the block's name. */
  label: string
  name: string
  eyebrow: string
  heading: string
  body: string
  link: string
  imageSide: 'left' | 'right'
  facts?: { label: string; value: string }[]
}

export const SWITCHER_DESIGNS: Content[] = [
  {
    id: 'split',
    label: 'A · Split',
    name: 'Split',
    eyebrow: 'The Academy',
    heading: 'Coaching built around how you play',
    body: 'Our PGA professionals shape every programme around your swing, not a template. TrackMan bays, a dedicated short-game area and on-course lessons mean what you practise on Tuesday shows up on Saturday. Beginners, juniors and low handicappers all start the same way: with a free assessment.',
    link: 'Meet the coaches',
    imageSide: 'left',
  },
  {
    id: 'collage',
    label: 'B · Collage',
    name: 'Collage',
    eyebrow: 'Stay & play',
    heading: 'Ten rooms above the eighteenth green',
    body: 'Wake to the groundstaff cutting the first fairway, breakfast on the terrace, and a tee time held for you at eight. Our lodge rooms sit a short walk from the first tee, with drying rooms, club storage and a late-night bar that knows its whisky.',
    link: 'Explore stay & play',
    imageSide: 'left',
  },
  {
    id: 'keyFacts',
    label: 'C · Key facts',
    name: 'Key facts',
    eyebrow: 'The Championship course',
    heading: 'Colt’s heathland, still unforgiving',
    body: 'Laid out in 1926 and barely touched since, the Championship plays across open heather and through Scots pine, with greens that reward an approach from the right side of the fairway.',
    link: 'Explore the course',
    imageSide: 'left',
    facts: [
      { label: 'Opened', value: '1926' },
      { label: 'Architect', value: 'H.S. Colt' },
      { label: 'Length', value: '7,174 yds' },
    ],
  },
]

/** Each club's pictures: the main photo, and the collage's smaller one. */
const PICTURES: Record<
  'heritage' | 'coastal',
  Record<SwitcherDesign, [DemoPhotoKey, DemoPhotoKey]>
> = {
  heritage: {
    split: ['parkland', 'parkland'],
    collage: ['heathland', 'lakeside'],
    keyFacts: ['heathland', 'heathland'],
  },
  coastal: {
    split: ['links', 'links'],
    collage: ['links', 'lakeside'],
    keyFacts: ['links', 'links'],
  },
}

export const isSwitcherClub = (id: string): id is 'heritage' | 'coastal' =>
  SWITCHER_CLUBS.some((c) => c.id === id)

export const isSwitcherDesign = (id: string): id is SwitcherDesign =>
  SWITCHER_DESIGNS.some((d) => d.id === id)

/** The Two-Column block for one design in one club. */
export const switcherBlock = (club: DemoClubID, design: SwitcherDesign): TwoColumn => {
  const content = SWITCHER_DESIGNS.find((d) => d.id === design)!
  const [image, inset] = PICTURES[club as 'heritage' | 'coastal'][design]
  return {
    blockType: 'twoColumn',
    style: design,
    tone: 'canvas',
    imageSide: content.imageSide,
    image,
    insetImage: design === 'collage' ? inset : null,
    eyebrow: content.eyebrow,
    heading: content.heading,
    body: content.body,
    link: { label: content.link, type: 'url', url: '#' },
    facts: content.facts ?? [],
  } as unknown as TwoColumn
}
