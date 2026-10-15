/**
 * Seeds the two picture-check clubs (tests/visual/pages.ts) on top of the test world. Run by
 * tests/visual/setup-visual.ts through `payload run`, after the main setup has reset the
 * database. Everything here is deterministic, so screenshots only change when the site does.
 */
import { getPayload } from 'payload'

import config from '@/payload.config'

import { pdfFile, photoFile } from '../shared/media'
import { rt } from '../shared/richText'

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
    announcement: {
      style: 'rotator',
      tone: 'subtle',
      items: [
        {
          tag: 'course',
          message:
            'The Championship course reopens on Saturday 18 October after autumn hollow-tining. Buggies stay on paths until the greens recover, and the practice ground opens at 10:00 on weekdays.',
          link: { label: 'View tee times', type: 'url', url: 'https://booking.example.com' },
          expiresAt: '2026-12-31T12:00:00.000Z',
        },
        {
          tag: 'event',
          message: 'Captain’s Day is on Saturday 1 August. Entries close on 25 July.',
          expiresAt: '2026-12-31T12:00:00.000Z',
        },
      ],
    },
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
    announcement: {
      style: 'utility',
      tone: 'brand',
      showStatus: true,
      items: [
        {
          message:
            'Clubhouse terrace closed for refurbishment. Lunch and afternoon tea move to the Members’ Lounge.',
          expiresAt: '2026-10-31T12:00:00.000Z',
        },
      ],
    },
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
      announcement: p.announcement,
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
      location: {
        latitude: 51.392,
        longitude: -0.612,
        mapLabel: 'Clubhouse & car park',
        what3words: 'filled.count.soap',
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
        legalLinks: [{ link: { label: 'Terms', type: 'page', page: about.id } }],
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

  const history = (withMoreHeadings: boolean) =>
    rt.doc(
      rt.h2('A short history of the club'),
      rt.p(
        'The club was founded in 1926 by a group of members from the London Stock Exchange who wanted heathland golf within an hour of the City. They hired Harry Colt, fresh from his work at Sunningdale, and gave him one instruction: keep the heather.',
      ),
      rt.h3('The early years'),
      rt.p(
        'Colt routed the Championship course along the natural ridges, which is why the 2nd and 13th still play into the prevailing wind. You can see the ',
        rt.pageLink('original routing plan', about.id),
        ' in the clubhouse library.',
      ),
      rt.ul(
        '1926 — Club founded; Championship course opens',
        '1931 — Heathland course added for members’ families',
        '1953 — First county championship hosted',
        '2019 — Bunker restoration to Colt’s original plans',
      ),
      ...(withMoreHeadings ? [rt.h2('Championship golf')] : []),
      rt.image(
        cards[3].id,
        'The Swilcan-style bridge on the 18th, rebuilt in 1987 to the original drawings.',
      ),
      ...(withMoreHeadings ? [rt.h2('The club today')] : []),
      rt.p(
        'Today the club has 900 members and welcomes around 12,000 visitor rounds a year — but the heather, and Colt’s instruction, remain.',
      ),
    )
  await page('rich-text', 'Text', [
    { blockType: 'richText', style: 'article', content: history(false) },
    { blockType: 'richText', style: 'contents', content: history(true) },
    {
      blockType: 'richText',
      style: 'editorial',
      eyebrow: 'Our story',
      noteTitle: 'Did you know?',
      noteText: 'Colt charged the club £150 for both courses — about £9,000 today.',
      content: rt.doc(
        rt.p(
          'Ninety-nine years ago, a group of stockbrokers asked a young architect for heathland golf within an hour of the City. He gave them two courses and one rule: keep the heather.',
        ),
        rt.p(
          'The club was founded in 1926 by members of the London Stock Exchange. They hired Harry Colt, fresh from Sunningdale, who routed the Championship course along the natural ridges — which is why the 2nd and 13th still play into the prevailing wind.',
        ),
        rt.p(
          'The Heathland course followed in 1931 for members’ families, and in 1953 the club hosted its first county championship. In 2019 the bunkers were restored to Colt’s original drawings, found in the clubhouse library during a refurbishment.',
        ),
      ),
    },
  ])

  const rate = (label: string, subLabel: string | null, ...p: string[]) => ({
    label,
    subLabel,
    price1: p[0],
    price2: p[1],
    price3: p[2],
    price4: p[3],
  })
  const seasonsTab = (label: string, bump: number) => ({
    label,
    sections: [
      {
        name: 'Winter',
        period: 'November – March',
        startMonth: '11',
        endMonth: '3',
        note: 'Winter greens possible after frost',
        rows: [
          rate('Championship', null, `£${110 + bump}`),
          rate('Twilight', null, `£${75 + bump}`),
          rate('Heathland', null, `£${60 + bump}`),
        ],
      },
      {
        name: 'Spring & autumn',
        period: 'April, May & October',
        startMonth: '4',
        endMonth: '5',
        note: 'Fri–Sun & bank holidays +£30 per player',
        rows: [
          rate('Championship', null, `£${150 + bump}`),
          rate('Twilight', null, `£${95 + bump}`),
          rate('Heathland', null, `£${80 + bump}`),
        ],
      },
      {
        name: 'Summer',
        period: '1 June – 30 September',
        startMonth: '6',
        endMonth: '9',
        note: 'Fri–Sun & bank holidays +£40 per player',
        rows: [
          rate('Championship', null, `£${185 + bump}`),
          rate('Twilight', null, `£${120 + bump}`),
          rate('Heathland', null, `£${95 + bump}`),
        ],
      },
    ],
  })
  await page('rate-table', 'Green fees', [
    {
      blockType: 'rateTable',
      style: 'classic',
      eyebrow: 'Visitors',
      heading: 'Green fees',
      intro:
        'Per player, per round. Book online up to 60 days ahead; groups of 12 or more see society rates.',
      columns: [{ label: 'Mon–Thu' }, { label: 'Fri–Sun & BH' }],
      tabs: [
        {
          label: '2026 season',
          sections: [
            {
              rows: [
                rate('Championship — 18 holes', 'Tee times from 7.30am', '£185', '£225'),
                rate(
                  'Championship — Twilight',
                  'From 3pm (Apr–Sep), 12pm (Oct–Mar)',
                  '£120',
                  '£145',
                ),
                rate('Heathland — 18 holes', null, '£95', '£115'),
                rate('Heathland — Twilight', 'From 2pm', '£65', '£75'),
                rate('Junior (under 18)', 'With a paying adult', '£45', '£55'),
                rate('Buggy hire', 'Subject to course conditions', '£40', '£40'),
              ],
            },
          ],
        },
        {
          label: '2027 season',
          sections: [{ rows: [rate('Championship — 18 holes', null, '£195', '£235')] }],
        },
      ],
      footnote:
        'Bank holidays charged at weekend rates. Handicap certificate required on the Championship course.',
    },
    {
      blockType: 'rateTable',
      style: 'seasons',
      eyebrow: 'Green fees 2026',
      heading: 'Pay for the season you play',
      tabs: [
        seasonsTab('Visitor', 0),
        seasonsTab('Member’s guest', -40),
        seasonsTab('Society', -20),
      ],
      button: link('Check availability'),
    },
    {
      blockType: 'rateTable',
      style: 'matrix',
      eyebrow: 'Rates 2026',
      heading: 'Choose your round',
      columns: [
        { label: 'Weekday AM' },
        { label: 'Weekday PM' },
        { label: 'Weekend AM' },
        { label: 'Weekend PM' },
      ],
      tabs: [
        {
          label: 'Visitor',
          sections: [
            {
              rows: [
                rate('Championship', '18 holes · Handicap 24 max', '£185', '£120', '£225', '£145'),
                rate('Heathland', '18 holes', '£95', '£65', '£115', '£75'),
                rate('Heathland — 9 holes', 'Evenings from 5pm', '£50', '£40', '£60', '£45'),
                rate('Junior (under 18)', 'Any course, with an adult', '£45', '£30', '£55', '£35'),
              ],
            },
          ],
        },
        {
          label: 'Member’s guest',
          sections: [{ rows: [rate('Championship', null, '£95', '£70', '£110', '£80')] }],
        },
        {
          label: 'Society',
          sections: [{ rows: [rate('Championship', null, '£150', '£110', '—', '—')] }],
        },
      ],
      footnote:
        'AM = before 12pm. Weekend rates apply on bank holidays. All prices per player and include VAT.',
      asideEyebrow: 'Book direct',
      asideHeading: 'Best rate, always online',
      included: [
        { item: 'Range balls before your round' },
        { item: 'Locker, towel and changing rooms' },
        { item: 'Yardage book for the course' },
        { item: 'Free cancellation up to 48 hours' },
      ],
      showPhone: true,
    },
  ])

  // Mixed shapes for the masonry; more than 12 so the grid shows "Load more".
  const shapes: [number, number][] = [
    [1200, 1600],
    [1600, 1200],
    [1600, 1000],
    [1200, 1200],
    [1600, 1200],
    [1200, 1500],
    [1600, 1100],
    [1600, 1200],
    [1200, 1600],
    [1600, 1000],
    [1600, 1200],
    [1200, 1200],
    [1600, 1200],
    [1600, 1000],
  ]
  const albums = ['The course', 'Clubhouse', 'Events']
  const galleryPhotos = []
  for (const [i, [w, h]] of shapes.entries())
    galleryPhotos.push(await photo(`Gallery ${i + 1}`, w, h))
  const galleryImages = galleryPhotos.map((m, i) => ({
    image: m.id,
    caption: i === 0 ? 'The clubhouse from the 18th green, late September' : null,
    album: albums[i % 3],
  }))
  await page('gallery', 'Gallery', [
    {
      blockType: 'gallery',
      style: 'masonry',
      eyebrow: 'Gallery',
      heading: 'Around the club',
      images: galleryImages.slice(0, 9),
    },
    {
      blockType: 'gallery',
      style: 'grid',
      eyebrow: 'Gallery',
      heading: 'The course through the seasons',
      images: galleryImages,
    },
    {
      blockType: 'gallery',
      style: 'viewer',
      eyebrow: 'Gallery',
      heading: 'A walk round the course',
      images: galleryImages.slice(0, 10),
    },
  ])

  const doc = (title: string, category: string, lastReviewed?: string) =>
    payload.create({
      collection: 'documents',
      data: { title, category, lastReviewed, tenant: club.id } as never,
      file: pdfFile(`${title.toLowerCase().replace(/\W+/g, '-')}.pdf`),
    })
  const libraryDocs = [
    await doc('Championship course scorecard', 'course'),
    await doc('Local rules 2026', 'course', '2026-01-04'),
    await doc('Safeguarding policy', 'policies', '2026-03-12'),
    await doc('Equality, diversity & inclusion', 'policies', '2026-02-02'),
    await doc('Privacy notice', 'policies', '2025-05-20'),
    await doc('Membership application', 'forms'),
    await doc('Society booking form', 'forms'),
    await doc('Dress code', 'visitors', '2026-04-01'),
    await doc('AGM minutes 2026', 'minutes', '2026-04-14'),
  ]
  const ids = (...i: number[]) => i.map((n) => libraryDocs[n].id)
  await page('documents', 'Documents', [
    {
      blockType: 'documentList',
      style: 'grouped',
      eyebrow: 'Club documents',
      heading: 'Policies, forms and scorecards',
      documents: ids(0, 1, 2, 3, 4, 5, 6),
    },
    {
      blockType: 'documentList',
      style: 'cards',
      eyebrow: 'Club documents',
      heading: 'Before you play',
      documents: ids(0, 1, 7, 2, 6, 4),
      viewAll: link('All documents'),
    },
    {
      blockType: 'documentList',
      style: 'table',
      eyebrow: 'Document library',
      heading: 'Find a document',
      documents: ids(2, 3, 4, 5, 8, 0),
    },
  ])

  await page('map', 'Find us', [
    { blockType: 'map', style: 'split', eyebrow: 'Getting here', heading: 'Find the club' },
    {
      blockType: 'map',
      style: 'fullBleed',
      eyebrow: 'Visit us',
      heading: 'Twenty minutes from Heathrow',
    },
    {
      blockType: 'map',
      style: 'gettingHere',
      eyebrow: 'Getting here',
      heading: 'By road, rail or air',
      routes: [
        {
          mode: 'car',
          distance: '5 min from M25',
          directions:
            'M25 junction 13, then A30 towards Bagshot. The club entrance is on the left after the second roundabout; 120 free spaces.',
        },
        {
          mode: 'train',
          distance: '1.5 miles',
          directions:
            'Virginia Water station (South Western Railway, 45 min from London Waterloo). Taxis wait at the rank; we can book one ahead.',
        },
        {
          mode: 'air',
          distance: '20 min drive',
          directions:
            'London Heathrow is a 20-minute drive. The club can arrange a chauffeur for visiting parties of four or more.',
        },
      ],
    },
  ])

  await page('pull-quote', 'Quotes', [
    {
      blockType: 'pullQuote',
      style: 'centred',
      quote:
        'The finest piece of heathland golf in England, and the one I’d choose for my last round.',
      name: 'A visiting captain',
      role: 'Royal St George’s, 2025',
    },
    {
      blockType: 'pullQuote',
      style: 'overImage',
      quote:
        'We came for the golf and stayed for the people. Forty years on, I still look forward to the walk up the 18th.',
      name: 'Margaret Hughes',
      role: 'Member since 1985',
      image: wide.id,
    },
    {
      blockType: 'pullQuote',
      style: 'split',
      quote:
        'A rare course that rewards thinking over power. The 7th is as good a par four as you’ll find inland.',
      name: 'National golf magazine',
      role: 'Top 100 courses list',
      publication: 'Course review',
      year: '2026',
      image: cards[0].id,
    },
  ])

  const milestones = [
    {
      year: '1926',
      title: 'The club is founded',
      text: 'Members of the London Stock Exchange commission Harry Colt to lay out heathland golf within an hour of the City.',
      image: cards[3].id,
    },
    {
      year: '1931',
      title: 'A second course',
      text: 'The Heathland course opens for members’ families, routed through the old pine plantation.',
      image: cards[0].id,
    },
    {
      year: '1953',
      title: 'Championship golf arrives',
      text: 'The club hosts its first county championship; crowds of 3,000 follow the final.',
      image: cards[1].id,
    },
    {
      year: '1987',
      title: 'The new clubhouse',
      text: 'The Victorian lodge is extended, with the terrace that now overlooks the 18th green.',
      image: cards[2].id,
    },
    {
      year: '2019',
      title: 'Back to Colt',
      text: 'Every bunker is restored to Colt’s original drawings, found in the clubhouse library.',
      image: null,
    },
  ]
  await page('timeline', 'Our history', [
    {
      blockType: 'timeline',
      style: 'alternating',
      eyebrow: 'Our history',
      heading: 'Ninety-nine years in five moments',
      entries: milestones.slice(0, 4),
    },
    {
      blockType: 'timeline',
      style: 'horizontal',
      eyebrow: 'Our history',
      heading: 'A century in the heather',
      entries: milestones,
    },
    {
      blockType: 'timeline',
      style: 'ledger',
      eyebrow: 'Our history',
      heading: 'Year by year',
      intro: 'From a stockbrokers’ idea in 1926 to the bunker restoration of 2019.',
      entries: milestones,
    },
  ])

  const partners = [
    'Heathland Trust',
    'Fairway Collective',
    'County Golf Union',
    'Junior Golf Foundation',
    'Greens Certified',
    'The Links Guild',
  ].map((name) => ({ name, url: 'https://example.com' }))
  await page('logo-strip', 'Partners', [
    { blockType: 'logoStrip', style: 'row', eyebrow: 'Accredited & supported by', partners },
    {
      blockType: 'logoStrip',
      style: 'grid',
      eyebrow: 'Partners',
      heading: 'In good company',
      intro:
        'The organisations that certify our course, coach our juniors and help protect the heathland.',
      partners,
    },
    {
      blockType: 'logoStrip',
      style: 'marquee',
      eyebrow: 'Our partners',
      partners: [...partners, ...partners.slice(0, 2)],
    },
  ])

  const faqs = [
    {
      question: 'Do visitors need a handicap certificate?',
      answer:
        'Yes on the Championship course — a handicap of 24 (men) or 36 (women) or below. The Heathland course is open to all golfers, and our professionals can arrange a playing lesson if you’re new to the game.',
      topic: 'Visitors',
    },
    {
      question: 'What is the dress code?',
      answer:
        'Smart golf attire on the course; tailored shorts are fine in summer. Jeans and trainers are not permitted in the clubhouse.',
      topic: 'Visitors',
    },
    {
      question: 'Can I hire clubs and a trolley?',
      answer: 'Yes — book them with your tee time or ask at the pro shop on the day.',
      topic: 'Visitors',
    },
    {
      question: 'Are buggies available?',
      answer:
        'Buggies are available on the Heathland course all year and on the Championship course from April to October.',
      topic: 'The course',
    },
    {
      question: 'Is there a driving range?',
      answer: 'A 20-bay grass range with TrackMan, open from 7am.',
      topic: 'The course',
    },
    {
      question: 'Can I book a society day?',
      answer: 'Groups of 12 or more can book society packages from March to October.',
      topic: 'Events & societies',
    },
  ]
  await page('faq', 'Questions', [
    {
      blockType: 'faq',
      style: 'centred',
      eyebrow: 'Visitors',
      heading: 'Before you play',
      items: faqs,
      contactLink: link('Contact the pro shop'),
    },
    {
      blockType: 'faq',
      style: 'withContact',
      eyebrow: 'Questions',
      heading: 'Visiting the club',
      items: faqs,
      cardHeading: 'Talk to the pro shop',
      contactLink: link('Send a message'),
    },
    {
      blockType: 'faq',
      style: 'searchTopics',
      eyebrow: 'Help centre',
      heading: 'How can we help?',
      items: faqs,
      contactLink: link('Ask the pro shop'),
    },
  ])

  const person = (
    name: string,
    role: string,
    department: string,
    extra: Record<string, string> = {},
  ) =>
    payload.create({
      collection: 'staff',
      data: { name, role, department, tenant: club.id, ...extra } as never,
    })
  const first = (name: string) => name.split(' ')[0].toLowerCase()
  const contact = (name: string, phone: string) => ({ phone, email: `${first(name)}@club.co.uk` })
  const team = [
    await person('James Morrison', 'Head Professional', 'golf', {
      qualification: 'PGA Advanced',
      ...contact('James Morrison', '01932 704 510'),
      bio:
        'James has run the Academy for twelve years, after a decade on the European Challenge Tour. ' +
        'He coaches every level from first lesson to county squad, and still holds the ' +
        'Championship course record of 64.',
    }),
    await person('Sarah Whitfield', 'Course Manager', 'course', { qualification: 'BIGGA' }),
    await person('Tom Ashworth', 'Teaching Professional', 'golf', {
      qualification: 'PGA',
      ...contact('Tom Ashworth', '01932 704 511'),
    }),
    await person('Priya Nair', 'General Manager', 'club', contact('Priya Nair', '01932 704 500')),
    await person('Ed Lyle', 'Head Chef', 'clubhouse', contact('Ed Lyle', '01932 704 520')),
    await person(
      'Claire Benson',
      'Membership Secretary',
      'club',
      contact('Claire Benson', '01932 704 501'),
    ),
    await person('Owen Price', 'Assistant Professional', 'golf', {
      qualification: 'PGA Trainee',
      ...contact('Owen Price', '01932 704 512'),
    }),
    await person(
      'Hannah Cole',
      'Events Manager',
      'clubhouse',
      contact('Hannah Cole', '01932 704 521'),
    ),
  ]
  const staffIDs = (...i: number[]) => i.map((n) => team[n].id)
  await page('team', 'Our team', [
    {
      blockType: 'team',
      style: 'grid',
      eyebrow: 'The team',
      heading: 'The people behind the club',
      people: staffIDs(0, 1, 2, 3, 4, 5, 6, 7),
    },
    {
      blockType: 'team',
      style: 'directory',
      eyebrow: 'Contact',
      heading: 'Who to speak to',
      people: staffIDs(0, 2, 6, 3, 5, 4, 7),
      action: link('General enquiries'),
    },
    {
      blockType: 'team',
      style: 'featured',
      eyebrow: 'The Academy',
      heading: 'Meet the professionals',
      featured: team[0].id,
      people: staffIDs(2, 6),
      action: link('Book a lesson'),
      viewAll: link('All professionals'),
    },
  ])

  const tierLink = { type: 'page', page: about.id }
  const yes = 'yes'
  const vals = (...v: string[]) => v.map((value) => ({ value }))
  const benefits = (...t: string[]) => t.map((text) => ({ text }))
  const tiers = [
    {
      name: 'Five-day',
      price: '£1,780',
      period: 'per year',
      description: 'Weekday golf on both courses for those who play around the working week.',
      benefits: benefits(
        'Monday–Friday golf',
        'Book 14 days ahead',
        'Club competitions & handicap',
        'Three guest rounds at member rate',
        'Locker and bag storage',
      ),
      values: vals('Mon–Fri', '14 days', yes, '3', yes, yes),
      availability: 'Places available',
      link: tierLink,
    },
    {
      name: 'Full',
      price: '£2,450',
      period: 'per year',
      description:
        'Seven-day playing rights on both courses, with priority booking and full competition access.',
      benefits: benefits(
        'Unlimited golf, 7 days',
        'Book 21 days ahead',
        'Club competitions & handicap',
        'Six guest rounds at member rate',
        'Locker and bag storage',
      ),
      values: vals('7 days', '21 days', yes, '6', yes, yes),
      availability: 'Waiting list · c. 6 months',
      recommended: true,
      link: tierLink,
    },
    {
      name: 'Intermediate',
      price: '£1,150',
      period: 'per year · ages 18–29',
      description:
        'Full playing rights at a reduced rate, rising each year to full membership by 30.',
      benefits: benefits(
        'Unlimited golf, 7 days',
        'Book 14 days ahead',
        'Club competitions & handicap',
        'Two guest rounds at member rate',
        'Social events programme',
      ),
      values: vals('7 days', '14 days', yes, '2', '', ''),
      availability: 'Places available',
      link: tierLink,
    },
  ]
  const junior = {
    name: 'Junior',
    price: '£240',
    period: 'per year',
    description: 'Under 18s, through the Academy pathway.',
    values: vals('7 days', '7 days', yes, '', '', yes),
    availability: 'Academy assessment',
    link: tierLink,
  }
  await page('membership', 'Membership', [
    {
      blockType: 'membership',
      style: 'cards',
      eyebrow: 'Membership',
      heading: 'Find your place at the club',
      tiers,
      note: 'Joining fee equal to one year’s subscription, payable over three years. Prices for 2026/27, including VAT.',
    },
    {
      blockType: 'membership',
      style: 'compare',
      eyebrow: 'Membership',
      heading: 'Compare categories',
      tiers: [tiers[1], tiers[0], tiers[2], junior],
      features: [
        'Playing days',
        'Advance booking',
        'Competitions',
        'Guest rounds at member rate',
        'Locker',
        'Practice ground balls',
      ].map((label) => ({ label })),
      action: link('Book a tour'),
    },
    {
      blockType: 'membership',
      style: 'enquire',
      eyebrow: 'Membership',
      heading: 'Joining the club',
      intro:
        'We welcome new members throughout the year. Every application starts with a conversation and a round with the Captain.',
      tiers: [
        {
          ...tiers[1],
          description: 'Seven-day golf for those who want the club at the centre of their week.',
        },
        { ...tiers[0], description: 'Weekday golf with weekend competitions twice a month.' },
        { ...tiers[2], description: 'Ages 18–29, with fees that step up each year.' },
        junior,
      ],
      card: {
        heading: 'Not sure which fits?',
        text: 'Tell us how often you expect to play and the Membership Secretary will call you back.',
        link: link('Request a call back'),
        note: 'The Membership Secretary replies within two working days.',
      },
    },
  ])

  const holePhotos = [
    await photo('Hole one', 1600, 1067),
    await photo('Hole two', 1600, 1067),
    await photo('Hole three', 1600, 1067),
    await photo('Hole four', 1600, 1067),
  ]
  // Hole name, par, stroke index, white / yellow / red yards.
  const holeCard: [string, number, number, number, number, number][] = [
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
  const tips = [
    'A gentle opener through the heather. Favour the right half; the green slopes hard from back to front.',
    'The hardest hole on the card. A long iron in is normal — bail out short, never left.',
    'Only a short iron, but the green is a shelf. Take one more club than you think.',
  ]
  const championship = await payload.create({
    collection: 'courses',
    data: {
      name: 'The Championship course',
      tenant: club.id,
      tees: [
        { colour: 'white', rating: 74.1, slope: 138 },
        { colour: 'yellow', rating: 72.3, slope: 131 },
        { colour: 'red', rating: 75.2, slope: 134 },
      ],
      holes: holeCard.map(([name, par, strokeIndex, yardsWhite, yardsYellow, yardsRed], i) => ({
        name,
        par,
        strokeIndex,
        yardsWhite,
        yardsYellow,
        yardsRed,
        image: holePhotos[i % holePhotos.length].id,
        tip: tips[i % tips.length],
      })),
    } as never,
  })
  await page('holes', 'The course', [
    ...(['cards', 'carousel', 'guide'] as const).map((style) => ({
      blockType: 'holeGrid',
      style,
      eyebrow: 'The Championship course',
      heading: 'Hole by hole',
      course: championship.id,
    })),
  ])

  const printable = await doc('Championship course scorecard (print)', 'course')
  await page('scorecard', 'Scorecard', [
    {
      blockType: 'scorecard',
      style: 'classic',
      eyebrow: 'The Championship course',
      heading: 'Scorecard',
      course: championship.id,
      download: printable.id,
    },
    {
      blockType: 'scorecard',
      style: 'vertical',
      eyebrow: 'The Championship course',
      heading: 'Scorecard',
      course: championship.id,
      download: printable.id,
    },
    {
      blockType: 'scorecard',
      style: 'teeSelector',
      eyebrow: 'The Championship course',
      heading: 'Scorecard',
      course: championship.id,
      note: 'Yardages measured from the back of each tee. Course rating and slope shown for the selected tee.',
    },
  ])

  const statusRecord = (
    await payload.find({ collection: 'course-status', where: { tenant: { equals: club.id } } })
  ).docs[0]
  await payload.update({
    collection: 'course-status',
    id: statusRecord.id,
    data: {
      state: 'open',
      reason:
        'All 36 holes in play. Greens running at 10 on the Stimpmeter; temporary green on the 7th Heathland.',
      changedBy: 'the Course Manager',
      facilities: [
        { label: 'Championship course', state: 'open' },
        { label: 'Buggies', state: 'restricted', value: 'Paths only' },
        { label: 'Trolleys', state: 'open', value: 'Permitted' },
        { label: 'Practice ground', state: 'closed', value: 'Opens 10:00' },
        { label: 'Heathland course', state: 'open' },
        { label: 'Winter greens', state: 'open', value: 'Not in play' },
      ],
    } as never,
  })
  const statusPage = await page('course-status', 'Course status', [
    {
      blockType: 'courseStatus',
      style: 'board',
      eyebrow: 'Live from the greenkeeper',
      heading: 'Course status',
    },
  ])
  await payload.update({
    collection: 'pages',
    id: statusPage.id,
    data: {
      layout: [
        {
          blockType: 'courseStatus',
          style: 'board',
          eyebrow: 'Live from the greenkeeper',
          heading: 'Course status',
        },
        {
          blockType: 'courseStatus',
          style: 'band',
          statusPage: { type: 'page', page: statusPage.id },
        },
        {
          blockType: 'courseStatus',
          style: 'widget',
          eyebrow: 'Visitors',
          heading: 'Playing as a visitor',
          intro:
            'Visitors are welcome every day after 10am. Handicap certificates are required on the Championship course; the Heathland is open to all.',
          statusPage: { type: 'page', page: statusPage.id },
        },
      ],
    } as never,
  })

  // News template pages (VISUAL_TEMPLATES): nine live articles, so the archive has a second page.
  const newsPhotos = [wide, ...cards]
  const stories: [string, string, string, string][] = [
    [
      'Hollow-tining week: what to expect on the greens',
      'course',
      '2026-07-14',
      'Greens on both courses are cored from Monday. Here is how long recovery takes, and which tees stay open.',
    ],
    [
      'Club championship 2026: a play-off on the 18th decides it',
      'competitions',
      '2026-07-12',
      'Results, photos and the full leaderboard from a dramatic final day.',
    ],
    [
      'Summer menu: Cornish mussels and a new Sunday roast',
      'clubhouse',
      '2026-07-10',
      'Head chef Marta Ruiz on the dishes arriving in the clubhouse this month.',
    ],
    [
      'Intermediate membership opens to under-35s',
      'membership',
      '2026-07-08',
      'A full seven-day membership with a fee that steps up gradually to 35.',
    ],
    [
      'Why we are letting the heather grow back on the 7th',
      'course',
      '2026-07-06',
      'The course manager explains the five-year heathland plan.',
    ],
    [
      'New TrackMan bays open at the academy',
      'academy',
      '2026-07-04',
      'Four covered bays with simulator rounds, lessons and fitting. Members get 20% off.',
    ],
    [
      'Seniors’ Open raises £4,200 for the county air ambulance',
      'club',
      '2026-07-02',
      'Thank you to 112 players, 14 sponsors and every volunteer on the day.',
    ],
    [
      'Spring meeting report',
      'competitions',
      '2026-06-30',
      'Scores, winners and the best of the weekend.',
    ],
    [
      'Greenkeeping team grows',
      'club',
      '2026-06-28',
      'Two new greenkeepers join the course team this summer.',
    ],
  ]
  for (const [i, [title, category, date, excerpt]] of stories.entries()) {
    await payload.create({
      collection: 'news',
      data: {
        title,
        category,
        status: 'published',
        publishedAt: `${date}T12:00:00.000Z`,
        excerpt,
        image: newsPhotos[i % newsPhotos.length].id,
        ...(i === 0
          ? {
              author: 'Owen Pryce, Course manager',
              imageCaption: 'Hollow-tining the 4th green, October 2025.',
              body: rt.doc(
                rt.p(
                  'Every autumn the greens on both courses are hollow-tined: small cores of soil are lifted out so air, water and sand can reach the roots before winter.',
                ),
                rt.h2('What to expect'),
                rt.ul(
                  'Slower, bumpier greens for about two weeks',
                  'Temporary greens on the 4th and 11th for two days',
                  'Preferred lies through the green until the end of the month',
                ),
                rt.quote('Two weeks of patience buys us greens that hold up all winter.'),
                rt.p('Thank you for bearing with the team while the work is done.'),
              ),
            }
          : {}),
        tenant: club.id,
      } as never,
    })
  }

  await page('news-block', 'Latest news', [
    { blockType: 'newsFeed', style: 'carousel', eyebrow: 'News', heading: 'From the club' },
    {
      blockType: 'newsFeed',
      style: 'leadList',
      eyebrow: 'News',
      heading: `The latest from ${name}`,
    },
    { blockType: 'newsFeed', style: 'headlines', eyebrow: 'News', heading: 'Headlines' },
  ])

  // Events, after the picture check's fixed date (15 July 2026). UK summer time is UTC+1.
  const diary: [string, string, string, string, string | null, string | null, string][] = [
    [
      'Captain’s Drive-In Dinner',
      'social',
      '2026-07-24T18:00:00Z',
      'Clubhouse',
      '£45',
      '£38',
      'book',
    ],
    [
      'Autumn Foursomes',
      'competition',
      '2026-08-01T07:00:00Z',
      'Championship',
      '£20 entry',
      null,
      'book',
    ],
    [
      'Wine dinner with Berry Bros. & Rudd',
      'dining',
      '2026-08-08T18:30:00Z',
      'Harry Colt room',
      '£95',
      '£85',
      'book',
    ],
    [
      'Winter short-game clinic',
      'academy',
      '2026-09-12T09:00:00Z',
      'Academy',
      '£30',
      null,
      'enquire',
    ],
    [
      'Ladies’ Open',
      'competition',
      '2026-09-19T07:30:00Z',
      'Championship',
      '£35 entry',
      null,
      'book',
    ],
    [
      'Christmas lunch and carols',
      'dining',
      '2026-12-06T12:30:00Z',
      'Clubhouse',
      '£42',
      '£36',
      'soldOut',
    ],
    [
      'New Year’s Eve black-tie ball',
      'social',
      '2026-12-31T19:00:00Z',
      'Clubhouse',
      '£120',
      '£110',
      'book',
    ],
  ]
  for (const [
    i,
    [title, category, startsAt, venue, price, memberPrice, booking],
  ] of diary.entries()) {
    await payload.create({
      collection: 'events',
      data: {
        title,
        category,
        startsAt,
        venue,
        price,
        memberPrice,
        booking,
        status: 'published',
        image: cards[i % cards.length].id,
        timeNote: category === 'competition' ? 'shotgun' : null,
        link: booking === 'soldOut' ? undefined : link('Book'),
        tenant: club.id,
      } as never,
    })
  }
}

process.exit(0)
