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
}

process.exit(0)
