/**
 * Seeds the two picture-check clubs (tests/visual/pages.ts) on top of the test world. Run by
 * tests/visual/setup-visual.ts through `payload run`, after the main setup has reset the
 * database. Everything here is deterministic, so screenshots only change when the site does.
 */
import { getPayload } from 'payload'

import config from '@/payload.config'

import { photoFile } from '../shared/media'

const payload = await getPayload({ config: await config })

const palettes = {
  'visual-default': {
    branding: {
      primary: '#1B2A22',
      secondary: '#717E6A',
      accent: '#B39462',
      light: '#FAF7F1',
      dark: '#111814',
      fontSet: 'heritage',
      strapline: 'Golf Club · 1926',
    },
    header: 'classic',
    footer: 'brandColumns',
  },
  'visual-coastal': {
    branding: {
      primary: '#16324F',
      secondary: '#6E8CA0',
      accent: '#C9A13B',
      light: '#F6F4EF',
      dark: '#0F1A24',
      fontSet: 'editorial',
      strapline: 'Links · 1891',
    },
    header: 'appBar',
    footer: 'editorial',
  },
} as const

for (const [slug, p] of Object.entries(palettes)) {
  const name = slug === 'visual-default' ? 'Heathcote' : 'Saltmarsh Links'
  const club = await payload.create({ collection: 'tenants', data: { name, slug } })
  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: club.id } },
    limit: 1,
  })
  const photo = (alt: string, w: number, h: number) =>
    photoFile(`${alt.toLowerCase().replace(/\W+/g, '-')}.jpg`, w, h).then((file) =>
      payload.create({ collection: 'media', data: { alt, tenant: club.id }, file }),
    )
  const wide = await photo('Fairway at first light', 2400, 1200)
  const cards = [
    await photo('The course', 1600, 1200),
    await photo('Visitors', 1600, 1200),
    await photo('Membership', 1600, 1200),
    await photo('Heritage', 1600, 1200),
  ]

  const pages: Record<string, string> = {}
  const page = async (pageSlug: string, title: string, layout: unknown[]) => {
    const doc = await payload.create({
      collection: 'pages',
      data: { title, slug: pageSlug, tenant: club.id, layout } as never,
    })
    pages[pageSlug] = String(doc.id)
    return doc
  }
  const about = await page('about', 'About the club', [])

  await payload.update({
    collection: 'club-settings',
    id: docs[0].id,
    data: {
      clubName: name,
      branding: p.branding,
      header: {
        style: p.header,
        phone: '01932 704 500',
        booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
        menu: [
          {
            label: 'Golf',
            groups: [
              {
                heading: 'Play',
                links: [{ link: { label: 'Green fees', type: 'page', page: about.id } }],
              },
            ],
          },
          { label: 'Visitors', link: { type: 'page', page: about.id } },
          { label: 'Membership', link: { type: 'page', page: about.id } },
          { label: 'Clubhouse', link: { type: 'page', page: about.id } },
        ],
      },
      footer: {
        style: p.footer,
        about: 'Heathland golf since 1926, twenty minutes from Heathrow.',
        linkColumns: [
          {
            heading: 'Explore',
            links: [
              { link: { label: 'The courses', type: 'page', page: about.id } },
              { link: { label: 'Membership', type: 'page', page: about.id } },
            ],
          },
        ],
        hours: [
          { place: 'Clubhouse', times: '7am – 9pm' },
          { place: 'Pro shop', times: '7am – 7pm' },
        ],
        email: 'hello@example.com',
        address: 'Heath Lane, Virginia Water GU25 4LS',
        social: [{ network: 'instagram', url: 'https://instagram.com/example' }],
        secondaryButton: { label: 'Membership enquiries', type: 'page', page: about.id },
        legalLinks: [{ link: { label: 'Privacy', type: 'page', page: about.id } }],
      },
    } as never,
  })

  const link = (label: string) => ({ label, type: 'page', page: about.id })

  // One page per block, every style of that block in turn (tests/visual/pages.ts).
  await page('hero', 'Hero', [
    {
      blockType: 'hero',
      style: 'heritage',
      mediaType: 'image',
      image: wide.id,
      eyebrow: 'Est. 1926 · Surrey heathland',
      headline: 'The quiet grandeur of heathland golf',
      primaryButton: link('Explore the courses'),
      secondaryLink: link('Visitor tee times'),
    },
    {
      blockType: 'hero',
      style: 'resort',
      mediaType: 'image',
      image: wide.id,
      eyebrow: 'Stay & play · Resort golf',
      headline: 'Thirty-six holes, one unhurried escape',
      caption: 'The 18th, across the lake, at dusk',
      primaryButton: link('Book a tee time'),
      secondaryLink: link('Plan your stay'),
    },
    {
      blockType: 'hero',
      style: 'bookingLed',
      mediaType: 'image',
      image: wide.id,
      eyebrow: 'Visitors welcome · 7 days a week',
      headline: 'Your morning on the Championship course',
    },
  ])

  const card = (title: string, i: number, extra: Record<string, unknown> = {}) => ({
    title,
    image: cards[i].id,
    link: { type: 'page', page: about.id },
    ...extra,
  })
  await page('cta-card-grid', 'Card grid', [
    {
      blockType: 'ctaCardGrid',
      style: 'editorial',
      eyebrow: 'Explore the club',
      heading: 'Everything begins on the first tee',
      viewAll: link('View all'),
      cards: [
        card('The Course', 0, {
          description: 'Two championship layouts through heathland and pine.',
        }),
        card('Visitors', 1, { description: 'Green fees, dress code and how to book a round.' }),
        card('Membership', 2, {
          description: 'Full, flexible and junior categories, with a guided tour.',
        }),
      ],
    },
    {
      blockType: 'ctaCardGrid',
      style: 'immersive',
      eyebrow: 'Explore the club',
      heading: 'Find your way around the club',
      cards: [
        card('The Course', 0, { eyebrow: '36 holes · Heathland' }),
        card('Visitors', 1, { eyebrow: 'Tee times daily' }),
        card('Membership', 2, { eyebrow: 'Enquiries open' }),
      ],
    },
    {
      blockType: 'ctaCardGrid',
      style: 'index',
      heading: 'A club for every kind of golfer',
      intro:
        'From a first lesson to a lifetime membership — start with the part of the club that matters to you.',
      cards: [
        card('The Course', 0, {
          description: 'Two championship layouts through heathland and pine.',
        }),
        card('Visitors', 1, { description: 'Green fees, dress code and how to book a round.' }),
        card('Membership', 2, {
          description: 'Full, flexible and junior categories, with a guided tour.',
        }),
        card('Heritage', 3, {
          description: 'A century of championships, architects and characters.',
        }),
      ],
    },
  ])

  const body =
    'Our PGA professionals shape every programme around your swing, not a template. TrackMan bays, a dedicated short-game area and on-course lessons mean what you practise on Tuesday shows up on Saturday.\n\nBeginners, juniors and low handicappers all start the same way: with a free assessment.'
  await page('two-column', 'Image and text', [
    {
      blockType: 'twoColumn',
      style: 'split',
      imageSide: 'left',
      tone: 'canvas',
      image: cards[1].id,
      eyebrow: 'The academy',
      heading: 'Coaching built around how you play',
      body,
      link: link('Meet the coaches'),
    },
    {
      blockType: 'twoColumn',
      style: 'split',
      imageSide: 'right',
      tone: 'brand',
      image: cards[2].id,
      eyebrow: 'The academy',
      heading: 'Coaching built around how you play',
      body,
      link: link('Meet the coaches'),
    },
    {
      blockType: 'twoColumn',
      style: 'collage',
      imageSide: 'left',
      image: cards[0].id,
      insetImage: cards[3].id,
      eyebrow: 'Stay & play',
      heading: 'Ten rooms above the eighteenth green',
      body: 'Wake to the groundstaff cutting the first fairway, breakfast on the terrace, and a tee time held for you at eight. Our lodge rooms sit a short walk from the first tee, with drying rooms, club storage and a late-night bar that knows its whisky.',
      link: link('Explore stay & play'),
    },
    {
      blockType: 'twoColumn',
      style: 'keyFacts',
      imageSide: 'right',
      image: cards[0].id,
      eyebrow: 'The Championship course',
      heading: "Colt's heathland, still unforgiving",
      body: 'Laid out in 1926 and barely touched since, the Championship plays across open heather and through Scots pine, with greens that reward an approach from the right side of the fairway.',
      facts: [
        { label: 'Opened', value: '1926' },
        { label: 'Architect', value: 'H.S. Colt' },
        { label: 'Length', value: '7,174 yds' },
      ],
      link: link('Explore the course'),
    },
  ])
}

process.exit(0)
