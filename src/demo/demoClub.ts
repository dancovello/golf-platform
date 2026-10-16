import type { Payload } from 'payload'

import { demoPDF, portrait, scene, type SceneOptions } from './pictures'
import { rt } from './richText'

/**
 * The demo club: a complete, fictional club ("Heathcote Golf Club", from the Figma file) for
 * trying everything on staging. Every block is used in each of its design styles somewhere on
 * the site, with the menu, footer, news, events, team, courses, documents, course status,
 * announcement bar, cookie banner, contact settings and a few enquiries all filled in.
 *
 * Only ever the club with the address DEMO_SLUG is touched: building replaces it, and nothing
 * else is read or changed. Not available on production (src/app/(payload)/api/demo-club).
 */
export const DEMO_SLUG = 'heathcote-demo'
export const DEMO_NAME = 'Heathcote Golf Club'

const DAY = 86_400_000
/** A date the given number of days from now, at a UTC hour (UK time is the same or +1). */
const daysFromNow = (days: number, hourUTC = 12) => {
  const d = new Date(Date.now() + days * DAY)
  d.setUTCHours(hourUTC, 0, 0, 0)
  return d.toISOString()
}

type ID = string | number
type Link =
  | { type: 'page'; page: ID }
  | { type: 'builtIn'; builtIn: 'news' | 'events' | 'contact' | 'privacy' }
  | { type: 'url'; url: string }

const CLUB_OWNED = [
  'enquiries',
  'events',
  'news',
  'pages',
  'staff',
  'courses',
  'documents',
  'media',
  'course-status',
  'club-settings',
] as const

/** Removes the demo club and everything in it. Refuses if it has accounts or an accepted
 * agreement (those are real records, never deleted by a button). */
export const removeDemoClub = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: DEMO_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const club = docs[0]
  if (!club) return false
  const own = { tenant: { equals: club.id } }
  const accounts = await payload.count({ collection: 'users', where: own, overrideAccess: true })
  const agreements = await payload.count({
    collection: 'agreement-acceptances',
    where: own,
    overrideAccess: true,
  })
  if (accounts.totalDocs > 0 || agreements.totalDocs > 0) {
    throw new Error(
      'The demo club has editor accounts or an accepted agreement, so it can’t be rebuilt automatically.',
    )
  }
  for (const collection of CLUB_OWNED) {
    await payload.delete({ collection, where: own, overrideAccess: true })
  }
  await payload.delete({ collection: 'tenants', id: club.id, overrideAccess: true })
  return true
}

/** Builds the demo club from scratch (replacing any earlier one). Takes about a minute. */
export const buildDemoClub = async (payload: Payload) => {
  await removeDemoClub(payload)
  const club = await payload.create({
    collection: 'tenants',
    data: { name: DEMO_NAME, slug: DEMO_SLUG },
    overrideAccess: true,
  })
  const tenant = club.id
  const create = <T>(collection: string, data: Record<string, unknown>, file?: unknown) =>
    payload.create({
      collection: collection as never,
      data: { ...data, tenant } as never,
      ...(file ? { file: file as never } : {}),
      overrideAccess: true,
    }) as Promise<T & { id: ID }>

  // ---------- Pictures ----------
  const picture = async (alt: string, w: number, h: number, o: SceneOptions) => {
    const data = await scene(w, h, o)
    const name = `${alt.toLowerCase().replace(/\W+/g, '-').slice(0, 40)}.jpg`
    return create<{ id: ID }>(
      'media',
      { alt: `Illustration: ${alt}` },
      { data, mimetype: 'image/jpeg', name, size: data.length },
    )
  }
  const wide = await picture('the first fairway at dawn', 2400, 1200, {
    sky: 'dawn',
    land: 'heath',
    seed: 2,
  })
  const dusk = await picture('the clubhouse lawn at dusk', 2400, 1200, {
    sky: 'dusk',
    land: 'pine',
    seed: 3,
  })
  const morning = await picture('the practice ground in the morning', 2400, 1200, {
    sky: 'morning',
    land: 'links',
    seed: 4,
  })
  const photos = [] as { id: ID }[]
  const views: [string, SceneOptions][] = [
    ['heather either side of the 2nd fairway', { sky: 'noon', land: 'heath', seed: 6 }],
    ['pines framing the 7th green', { sky: 'morning', land: 'pine', seed: 8 }],
    ['autumn colour on the Heathland course', { sky: 'evening', land: 'autumn', seed: 5 }],
    ['frost on the 12th tee', { sky: 'winter', land: 'heath', seed: 10 }],
    ['the long 4th from the back tee', { sky: 'noon', land: 'links', seed: 12 }],
    ['the terrace above the 18th', { sky: 'dusk', land: 'heath', seed: 7 }],
    ['the academy bays at first light', { sky: 'dawn', land: 'pine', seed: 14 }],
    ['the Heathland course in late summer', { sky: 'morning', land: 'autumn', seed: 9 }],
  ]
  for (const [alt, o] of views) photos.push(await picture(alt, 1600, 1200, o))
  const tall = [
    await picture('a path through the pines', 1200, 1600, {
      sky: 'morning',
      land: 'pine',
      seed: 1,
    }),
    await picture('the flag on the 9th', 1200, 1600, { sky: 'noon', land: 'heath', seed: 16 }),
  ]

  // ---------- Team ----------
  const tones = [
    ['#e5e1d6', '#9aa58f'],
    ['#dfe5e8', '#8b9aa5'],
    ['#ece4da', '#a8957d'],
    ['#e2e6dc', '#7f8f72'],
  ]
  const person = async (
    i: number,
    name: string,
    role: string,
    department: string,
    extra: Record<string, unknown> = {},
  ) => {
    const [bg, fg] = tones[i % tones.length]
    const data = await portrait(bg, fg)
    const photo = await create<{ id: ID }>(
      'media',
      { alt: `Placeholder portrait of ${name}` },
      {
        data,
        mimetype: 'image/jpeg',
        name: `${name.toLowerCase().replace(/\W+/g, '-')}.jpg`,
        size: data.length,
      },
    )
    return create<{ id: ID }>('staff', { name, role, department, photo: photo.id, ...extra })
  }
  const email = (name: string) => `${name.split(' ')[0].toLowerCase()}@heathcote.example`
  const team = [
    await person(0, 'James Morrison', 'Head Professional', 'golf', {
      qualification: 'PGA Advanced',
      email: email('James Morrison'),
      phone: '01932 704 510',
      bio: 'James has run the Academy for twelve years, after a decade on the European Challenge Tour. He coaches every level from first lesson to county squad, and still holds the Championship course record of 64.',
    }),
    await person(1, 'Sarah Whitfield', 'Course Manager', 'course', {
      qualification: 'BIGGA',
      bio: 'Sarah leads a team of eleven greenkeepers and the five-year heathland restoration plan.',
    }),
    await person(2, 'Tom Ashworth', 'Teaching Professional', 'golf', {
      qualification: 'PGA',
      email: email('Tom Ashworth'),
      phone: '01932 704 511',
    }),
    await person(3, 'Priya Nair', 'General Manager', 'club', {
      email: email('Priya Nair'),
      phone: '01932 704 500',
    }),
    await person(0, 'Ed Lyle', 'Head Chef', 'clubhouse', {
      email: email('Ed Lyle'),
      phone: '01932 704 520',
    }),
    await person(1, 'Claire Benson', 'Membership Secretary', 'club', {
      email: email('Claire Benson'),
      phone: '01932 704 501',
    }),
    await person(2, 'Owen Price', 'Assistant Professional', 'golf', {
      qualification: 'PGA Trainee',
      email: email('Owen Price'),
      phone: '01932 704 512',
    }),
    await person(3, 'Hannah Cole', 'Events Manager', 'clubhouse', {
      email: email('Hannah Cole'),
      phone: '01932 704 521',
    }),
    await person(0, 'Richard Hale', 'Club Captain', 'committee'),
    await person(1, 'Anne Fairley', 'Ladies’ Captain', 'committee'),
  ]
  const people = (...i: number[]) => i.map((n) => team[n].id)

  // ---------- Documents ----------
  const document = (title: string, category: string, lastReviewed?: string) =>
    create<{ id: ID }>(
      'documents',
      { title, category, ...(lastReviewed ? { lastReviewed } : {}) },
      {
        data: demoPDF(),
        mimetype: 'application/pdf',
        name: `${title.toLowerCase().replace(/\W+/g, '-')}.pdf`,
        size: demoPDF().length,
      },
    )
  const docs = {
    champCard: await document('Championship course scorecard', 'course'),
    heathCard: await document('Heathland course scorecard', 'course'),
    localRules: await document('Local rules 2026', 'course', daysFromNow(-200)),
    safeguarding: await document('Safeguarding policy', 'policies', daysFromNow(-150)),
    equality: await document('Equality, diversity & inclusion', 'policies', daysFromNow(-180)),
    application: await document('Membership application', 'forms'),
    society: await document('Society booking form', 'forms'),
    dress: await document('Dress code', 'visitors', daysFromNow(-90)),
    agm: await document('AGM minutes 2026', 'minutes', daysFromNow(-60)),
    handbook: await document('Members’ handbook', 'other'),
  }

  // ---------- Courses ----------
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
    'Favour the right half of the fairway; the green slopes hard from back to front.',
    'The hardest hole on the card. A long iron in is normal, so bail out short, never left.',
    'Only a short iron, but the green is a shelf. Take one more club than you think.',
    'Reachable in two for the long hitters, but the cross-bunker at 280 yards catches many.',
  ]
  const championship = await create<{ id: ID }>('courses', {
    name: 'The Championship course',
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
      image: photos[i % photos.length].id,
      tip: tips[i % tips.length],
    })),
  })
  const heathland = await create<{ id: ID }>('courses', {
    name: 'The Heathland course',
    tees: [
      { colour: 'yellow', rating: 67.6, slope: 118 },
      { colour: 'red', rating: 70.2, slope: 121 },
    ],
    holes: holeCard.slice(0, 9).map(([name, par, , , yardsYellow, yardsRed], i) => ({
      name: `${name} (Heathland)`,
      par,
      strokeIndex: [5, 1, 9, 3, 7, 8, 2, 4, 6][i],
      yardsYellow: yardsYellow - 40,
      yardsRed: yardsRed - 40,
      image: photos[(i + 3) % photos.length].id,
    })),
  })

  // ---------- Pages (created first so links can point at them; filled in below) ----------
  const pageIDs: Record<string, ID> = {}
  const pageTitles: [string, string][] = [
    ['home', 'Home'],
    ['courses', 'The courses'],
    ['championship-course', 'The Championship course'],
    ['heathland-course', 'The Heathland course'],
    ['scorecards', 'Scorecards'],
    ['course-status', 'Course status'],
    ['academy', 'The Academy'],
    ['competitions', 'Competitions'],
    ['visitors', 'Visitors & green fees'],
    ['societies', 'Societies'],
    ['getting-here', 'Getting here'],
    ['faqs', 'Visitor questions'],
    ['membership', 'Membership'],
    ['joining', 'How to join'],
    ['clubhouse', 'Clubhouse & dining'],
    ['gallery', 'Gallery'],
    ['about', 'Our story'],
    ['history', 'Our history'],
    ['team', 'Our team'],
    ['partners', 'Partners'],
    ['documents', 'Club documents'],
    ['terms', 'Terms of play'],
    ['accessibility', 'Accessibility'],
  ]
  for (const [slug, title] of pageTitles) {
    pageIDs[slug] = (await create<{ id: ID }>('pages', { title, slug, layout: [] })).id
  }
  const to = (slug: string): Link => ({ type: 'page', page: pageIDs[slug] })
  const builtIn = (page: 'news' | 'events' | 'contact' | 'privacy'): Link => ({
    type: 'builtIn',
    builtIn: page,
  })
  const labelled = (label: string, link: Link) => ({ label, ...link })
  const booking = labelled('Book a tee time', { type: 'url', url: 'https://booking.example.com' })

  // ---------- Club settings: branding, menu, footer, announcement, privacy, contact ----------
  const { docs: settingsDocs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenant } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const menuLink = (label: string, link: Link) => ({ link: labelled(label, link) })
  await payload.update({
    collection: 'club-settings',
    id: settingsDocs[0].id,
    overrideAccess: true,
    data: {
      clubName: DEMO_NAME,
      branding: {
        primary: '#1B2A22',
        secondary: '#717E6A',
        accent: '#B39462',
        light: '#FAF7F1',
        dark: '#111814',
        fontSet: 'heritage',
        strapline: 'Est. 1926',
      },
      header: {
        style: 'classic',
        phone: '01932 704 500',
        booking,
        menu: [
          {
            label: 'Golf',
            groups: [
              {
                heading: 'The courses',
                links: [
                  menuLink('Both courses', to('courses')),
                  menuLink('The Championship course', to('championship-course')),
                  menuLink('The Heathland course', to('heathland-course')),
                  menuLink('Scorecards', to('scorecards')),
                ],
              },
              {
                heading: 'Playing',
                links: [
                  menuLink('Course status', to('course-status')),
                  menuLink('The Academy', to('academy')),
                  menuLink('Competitions', to('competitions')),
                ],
              },
            ],
          },
          {
            label: 'Visitors',
            groups: [
              {
                heading: 'Plan your round',
                links: [
                  menuLink('Green fees', to('visitors')),
                  menuLink('Societies', to('societies')),
                  menuLink('Getting here', to('getting-here')),
                ],
              },
              {
                heading: 'Help',
                links: [
                  menuLink('Visitor questions', to('faqs')),
                  menuLink('Contact the club', builtIn('contact')),
                ],
              },
            ],
          },
          {
            label: 'Membership',
            groups: [
              {
                heading: 'Join the club',
                links: [
                  menuLink('Membership categories', to('membership')),
                  menuLink('How to join', to('joining')),
                ],
              },
            ],
          },
          {
            label: 'Clubhouse',
            groups: [
              {
                heading: 'Eat & meet',
                links: [
                  menuLink('Clubhouse & dining', to('clubhouse')),
                  menuLink('What’s on', builtIn('events')),
                  menuLink('Gallery', to('gallery')),
                ],
              },
            ],
          },
          {
            label: 'About',
            groups: [
              {
                heading: 'The club',
                links: [
                  menuLink('Our story', to('about')),
                  menuLink('Our history', to('history')),
                  menuLink('Our team', to('team')),
                  menuLink('Partners', to('partners')),
                ],
              },
              {
                heading: 'Stay informed',
                links: [
                  menuLink('News', builtIn('news')),
                  menuLink('Club documents', to('documents')),
                  menuLink('Contact', builtIn('contact')),
                ],
              },
            ],
          },
        ],
      },
      footer: {
        style: 'brandColumns',
        about: 'Heathland golf since 1926, twenty minutes from Heathrow.',
        linkColumns: [
          {
            heading: 'Explore',
            links: [
              menuLink('The courses', to('courses')),
              menuLink('Visitors & green fees', to('visitors')),
              menuLink('Membership', to('membership')),
              menuLink('Competitions', to('competitions')),
              menuLink('Clubhouse & dining', to('clubhouse')),
            ],
          },
          {
            heading: 'The club',
            links: [
              menuLink('News', builtIn('news')),
              menuLink('What’s on', builtIn('events')),
              menuLink('Our team', to('team')),
              menuLink('Club documents', to('documents')),
              menuLink('Contact', builtIn('contact')),
            ],
          },
        ],
        hours: [
          { place: 'Clubhouse', times: '7am – 9pm' },
          { place: 'Pro shop', times: '7am – 7pm' },
          { place: 'Restaurant', times: '12 – 9pm' },
        ],
        hoursLink: labelled('All hours & holiday closures', to('clubhouse')),
        email: 'hello@heathcote.example',
        address: 'Heathcote Lane\nVirginia Water\nSurrey GU25 4AB',
        directions: 'https://www.google.com/maps/search/?api=1&query=Virginia+Water',
        social: [
          { network: 'instagram', url: 'https://instagram.com/example' },
          { network: 'facebook', url: 'https://facebook.com/example' },
          { network: 'x', url: 'https://x.com/example' },
        ],
        secondaryButton: labelled('Membership enquiries', to('joining')),
        legalLinks: [
          menuLink('Terms of play', to('terms')),
          menuLink('Accessibility', to('accessibility')),
        ],
      },
      announcement: {
        style: 'rotator',
        tone: 'subtle',
        items: [
          {
            tag: 'course',
            message:
              'Autumn hollow-tining starts on Monday. Temporary greens on the 4th and 11th for two days.',
            link: labelled('Course status', to('course-status')),
            expiresAt: daysFromNow(60),
          },
          {
            tag: 'event',
            message: 'The wine dinner with Berry Bros. & Rudd has 14 places left.',
            link: labelled('What’s on', builtIn('events')),
            expiresAt: daysFromNow(60),
          },
          {
            tag: 'offer',
            message:
              'Intermediate membership for 18–29s: no joining fee until the end of the year.',
            link: labelled('Membership', to('membership')),
            expiresAt: daysFromNow(60),
          },
        ],
      },
      location: {
        latitude: 51.392,
        longitude: -0.612,
        mapLabel: 'Clubhouse & car park',
        what3words: 'filled.count.soap',
      },
      privacy: {
        legalName: 'Heathcote Golf Club Limited',
        newsletterProvider: 'Mailchimp',
        gaMeasurementId: 'G-DEMO12345',
      },
      contact: {
        replyDays: 2,
        officeHours: 'Mon–Fri 8:00–17:00 · Sat 8:00–12:00',
        purposes: [
          {
            purpose: 'membership',
            replier: 'Claire Benson, our membership secretary',
            inbox: 'membership@heathcote.example',
            nextLink: labelled('Explore membership', to('membership')),
          },
          {
            purpose: 'visitor',
            replier: 'The pro shop team',
            inbox: 'proshop@heathcote.example',
            nextLink: labelled('Green fees', to('visitors')),
          },
          {
            purpose: 'events',
            replier: 'Hannah Cole, our events manager',
            inbox: 'events@heathcote.example',
            nextLink: labelled('What’s on', builtIn('events')),
          },
          {
            purpose: 'lessons',
            replier: 'James Morrison, our head professional',
            nextLink: labelled('The Academy', to('academy')),
          },
        ],
        membershipTypes: ['Full', 'Five-day', 'Intermediate (18–29)', 'Junior', 'Social'].map(
          (label) => ({ label }),
        ),
        asideTitle: 'Tee times and lessons',
        asideText: 'The pro shop is quickest for anything today: 01932 704 520, 7am–7pm.',
      },
    } as never,
  })

  // ---------- Course status ----------
  const { docs: statusDocs } = await payload.find({
    collection: 'course-status',
    where: { tenant: { equals: tenant } },
    limit: 1,
    overrideAccess: true,
  })
  await payload.update({
    collection: 'course-status',
    id: statusDocs[0].id,
    overrideAccess: true,
    data: {
      state: 'open',
      reason:
        'Both courses in play. Greens running at 10 on the Stimpmeter; temporary green on the 7th Heathland.',
      changedBy: 'the Course Manager',
      facilities: [
        { label: 'Championship course', state: 'open' },
        { label: 'Heathland course', state: 'open' },
        { label: 'Buggies', state: 'restricted', value: 'Paths only' },
        { label: 'Trolleys', state: 'open', value: 'Permitted' },
        { label: 'Practice ground', state: 'closed', value: 'Opens 10:00' },
        { label: 'Winter greens', state: 'open', value: 'Not in play' },
      ],
    } as never,
  })

  // ---------- News ----------
  const stories: [string, string, number, string][] = [
    [
      'Hollow-tining week: what to expect on the greens',
      'course',
      1,
      'Greens on both courses are cored from Monday. Here is how long recovery takes, and which tees stay open.',
    ],
    [
      'Club championship: a play-off on the 18th decides it',
      'competitions',
      3,
      'Results, photos and the full leaderboard from a dramatic final day.',
    ],
    [
      'Autumn menu: Cornish mussels and a new Sunday roast',
      'clubhouse',
      6,
      'Head chef Ed Lyle on the dishes arriving in the clubhouse this month.',
    ],
    [
      'Intermediate membership: no joining fee until the new year',
      'membership',
      9,
      'A full seven-day membership for 18–29s with a fee that steps up gradually.',
    ],
    [
      'Why we are letting the heather grow back on the 7th',
      'course',
      12,
      'The course manager explains the five-year heathland plan.',
    ],
    [
      'New TrackMan bays open at the Academy',
      'academy',
      15,
      'Four covered bays with simulator rounds, lessons and fitting. Members get 20% off.',
    ],
    [
      'Seniors’ Open raises £4,200 for the county air ambulance',
      'club',
      18,
      'Thank you to 112 players, 14 sponsors and every volunteer on the day.',
    ],
    ['Spring meeting report', 'competitions', 24, 'Scores, winners and the best of the weekend.'],
    ['Greenkeeping team grows', 'club', 30, 'Two new greenkeepers join the course team.'],
    [
      'Junior section wins the county league',
      'academy',
      36,
      'Our under-16s finish top of the table for the first time since 2011.',
    ],
  ]
  const newsPictures = [wide, ...photos, dusk, morning]
  for (const [i, [title, category, ago, excerpt]] of stories.entries()) {
    await create('news', {
      title,
      category,
      status: 'published',
      publishedAt: daysFromNow(-ago, 9),
      excerpt,
      image: newsPictures[i % newsPictures.length].id,
      ...(i < 3
        ? {
            author: i === 0 ? 'Sarah Whitfield, Course Manager' : 'The club office',
            imageCaption: i === 0 ? 'Hollow-tining the 4th green last autumn.' : null,
            body: rt.doc(
              rt.p(excerpt),
              rt.h2(i === 0 ? 'What to expect' : 'The details'),
              rt.ul(
                'Slower, bumpier greens for about two weeks',
                'Temporary greens on the 4th and 11th for two days',
                'Preferred lies through the green until the end of the month',
              ),
              rt.quote('Two weeks of patience buys us greens that hold up all winter.'),
              rt.p(
                'Questions? ',
                rt.pageLink('Check the course status page', String(pageIDs['course-status'])),
                ' or ask in the pro shop.',
              ),
            ),
          }
        : {}),
    })
  }
  // A draft and a scheduled story, so the admin shows both (neither is on the website yet).
  await create('news', {
    title: 'Captain’s Day report (draft)',
    category: 'competitions',
    status: 'draft',
    publishedAt: daysFromNow(-1),
  })
  await create('news', {
    title: 'Winter programme announced',
    category: 'club',
    status: 'published',
    publishedAt: daysFromNow(7),
    excerpt: 'Scheduled for next week: it appears on the website on its publish date.',
  })

  // ---------- Events ----------
  const diary: [
    string,
    string,
    number,
    number,
    string,
    string | null,
    string | null,
    string,
    Link | null,
  ][] = [
    [
      'Captain’s Drive-In Dinner',
      'social',
      5,
      18,
      'Clubhouse',
      '£45',
      '£38',
      'book',
      builtIn('contact'),
    ],
    [
      'Autumn Foursomes',
      'competition',
      9,
      7,
      'Championship course',
      '£20 entry',
      null,
      'book',
      { type: 'url', url: 'https://booking.example.com' },
    ],
    [
      'Wine dinner with Berry Bros. & Rudd',
      'dining',
      16,
      18,
      'Harry Colt room',
      '£95',
      '£85',
      'book',
      builtIn('contact'),
    ],
    [
      'Winter short-game clinic',
      'academy',
      23,
      9,
      'The Academy',
      '£30',
      null,
      'enquire',
      to('academy'),
    ],
    [
      'Ladies’ Open',
      'competition',
      30,
      7,
      'Championship course',
      '£35 entry',
      null,
      'book',
      { type: 'url', url: 'https://booking.example.com' },
    ],
    [
      'Members’ quiz night',
      'members',
      37,
      19,
      'Members’ bar',
      'Free',
      null,
      'book',
      builtIn('contact'),
    ],
    ['Christmas lunch and carols', 'dining', 52, 12, 'Clubhouse', '£42', '£36', 'soldOut', null],
    [
      'New Year’s Eve black-tie ball',
      'social',
      75,
      19,
      'Clubhouse',
      '£120',
      '£110',
      'book',
      builtIn('contact'),
    ],
  ]
  const eventPictures = [dusk, morning, ...photos]
  for (const [
    i,
    [title, category, days, hour, venue, price, memberPrice, bookingType, link],
  ] of diary.entries()) {
    const featured = i === 2
    await create('events', {
      title,
      category,
      startsAt: daysFromNow(days, hour),
      venue,
      price,
      memberPrice,
      booking: bookingType,
      status: 'published',
      image: eventPictures[i % eventPictures.length].id,
      timeNote: category === 'competition' ? 'shotgun' : null,
      ...(link ? { link } : {}),
      ...(featured
        ? {
            featured: true,
            capacity: 60,
            placesLeft: 14,
            summary:
              'Five courses from Ed Lyle, each matched by Berry Bros.’ head of fine wine. Black tie optional.',
          }
        : {}),
    })
  }

  // ---------- Enquiries (as if sent from the Contact page) ----------
  const enquiries: [string, string, string, string, Record<string, unknown>][] = [
    [
      'Dan Visitor',
      'dan@example.com',
      'membership',
      'Is there a waiting list for five-day membership, and can I play a round with the secretary first?',
      { membershipType: 'Five-day' },
    ],
    [
      'Priya Shah',
      'priya@example.com',
      'visitor',
      'We are a group of eight hoping to play on a Friday morning in spring. Do you offer society packages?',
      { groupSize: 8, preferredDate: daysFromNow(120) },
    ],
    [
      'Mark Ellis',
      'mark@example.com',
      'events',
      'Could we hold a 60th birthday dinner for 40 guests in the Harry Colt room?',
      { groupSize: 40, preferredDate: daysFromNow(90) },
    ],
    [
      'Lucy Grant',
      'lucy@example.com',
      'lessons',
      'My daughter is 11 and has never played. Are there junior taster sessions?',
      {},
    ],
  ]
  for (const [i, [name, address, purpose, message, extra]] of enquiries.entries()) {
    await create('enquiries', {
      name,
      email: address,
      purpose,
      message,
      reference: `HC-ENQ-${4821 + i * 137}`,
      status: i === 3 ? 'handled' : 'new',
      ...(i === 3 ? { notes: 'Booked onto the Saturday junior taster.' } : {}),
      ...extra,
    })
  }

  // ---------- Page content ----------
  const save = (slug: string, layout: unknown[]) =>
    payload.update({
      collection: 'pages',
      id: pageIDs[slug],
      data: { layout } as never,
      overrideAccess: true,
    })
  const card = (
    title: string,
    image: { id: ID },
    link: Link,
    extra: Record<string, unknown> = {},
  ) => ({
    title,
    image: image.id,
    link,
    ...extra,
  })

  await save('home', [
    {
      blockType: 'hero',
      style: 'heritage',
      mediaType: 'image',
      image: wide.id,
      eyebrow: 'Est. 1926 · Surrey heathland',
      headline: 'The quiet grandeur of heathland golf',
      primaryButton: labelled('Explore the courses', to('courses')),
      secondaryLink: labelled('Visitor green fees', to('visitors')),
    },
    { blockType: 'courseStatus', style: 'band', statusPage: to('course-status') },
    {
      blockType: 'ctaCardGrid',
      style: 'editorial',
      eyebrow: 'Explore the club',
      heading: 'Everything begins on the first tee',
      viewAll: labelled('Plan your visit', to('visitors')),
      cards: [
        card('The courses', photos[0], to('courses'), {
          description: 'Two heathland layouts through heather and pine.',
        }),
        card('Visitors', photos[4], to('visitors'), {
          description: 'Green fees, dress code and how to book a round.',
        }),
        card('Membership', photos[5], to('membership'), {
          description: 'Full, flexible and junior categories, with a guided tour.',
        }),
      ],
    },
    {
      blockType: 'twoColumn',
      style: 'keyFacts',
      imageSide: 'right',
      image: photos[1].id,
      eyebrow: 'The Championship course',
      heading: 'Colt’s heathland, still unforgiving',
      body: 'Laid out in 1926 and barely touched since, the Championship plays across open heather and through Scots pine, with greens that reward an approach from the right side of the fairway.',
      facts: [
        { label: 'Opened', value: '1926' },
        { label: 'Architect', value: 'H.S. Colt' },
        { label: 'Length', value: '7,174 yds' },
      ],
      link: labelled('Explore the course', to('championship-course')),
    },
    { blockType: 'newsFeed', style: 'carousel', eyebrow: 'News', heading: 'From the club' },
    {
      blockType: 'pullQuote',
      style: 'overImage',
      quote:
        'We came for the golf and stayed for the people. Forty years on, I still look forward to the walk up the 18th.',
      name: 'Margaret Hughes',
      role: 'Member since 1985',
      image: dusk.id,
    },
    {
      blockType: 'eventsFeed',
      style: 'carousel',
      eyebrow: 'What’s on',
      heading: 'Coming up at the club',
    },
    {
      blockType: 'logoStrip',
      style: 'row',
      eyebrow: 'Accredited & supported by',
      partners: partnerList,
    },
  ])

  await save('courses', [
    {
      blockType: 'ctaCardGrid',
      style: 'immersive',
      eyebrow: 'Golf at Heathcote',
      heading: 'Two courses, one heathland',
      cards: [
        card('The Championship course', photos[1], to('championship-course'), {
          eyebrow: '18 holes · Par 72',
        }),
        card('The Heathland course', photos[2], to('heathland-course'), {
          eyebrow: '9 holes · Par 35',
        }),
        card('The Academy', photos[6], to('academy'), { eyebrow: 'Lessons & practice' }),
      ],
    },
    {
      blockType: 'holeGrid',
      style: 'carousel',
      eyebrow: 'The Championship course',
      heading: 'A walk round the eighteen',
      course: championship.id,
    },
    {
      blockType: 'courseStatus',
      style: 'widget',
      eyebrow: 'Today',
      heading: 'Playing today',
      intro:
        'Visitors are welcome every day after 10am. Handicap certificates are needed on the Championship course; the Heathland is open to all.',
      statusPage: to('course-status'),
    },
  ])

  await save('championship-course', [
    {
      blockType: 'hero',
      style: 'resort',
      mediaType: 'image',
      image: photos[4].id,
      eyebrow: '18 holes · Par 72 · 7,174 yards',
      headline: 'The Championship course',
      caption: 'The long 4th, from the back tee',
      primaryButton: booking,
      secondaryLink: labelled('Download the scorecard', to('scorecards')),
    },
    {
      blockType: 'holeGrid',
      style: 'guide',
      eyebrow: 'Course guide',
      heading: 'Hole by hole',
      course: championship.id,
    },
    {
      blockType: 'scorecard',
      style: 'teeSelector',
      eyebrow: 'The Championship course',
      heading: 'Scorecard',
      course: championship.id,
      note: 'Yardages measured from the back of each tee. Course rating and slope shown for the selected tee.',
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
      image: photos[1].id,
    },
    {
      blockType: 'gallery',
      style: 'viewer',
      eyebrow: 'Gallery',
      heading: 'A walk round the course',
      images: photos.map((p) => ({ image: p.id })),
    },
  ])

  await save('heathland-course', [
    {
      blockType: 'richText',
      style: 'article',
      content: rt.doc(
        rt.h2('Nine holes for every golfer'),
        rt.p(
          'The Heathland course was added in 1931 for members’ families. It winds through the old pine plantation, with no forced carries and greens that run as true as the Championship’s.',
        ),
        rt.p(
          'It’s open to all golfers, with or without a handicap, and is where most juniors play their first full round.',
        ),
        rt.ul('Nine holes, par 35', 'Buggies all year', 'Twilight rate from 2pm'),
      ),
    },
    {
      blockType: 'holeGrid',
      style: 'cards',
      eyebrow: 'The Heathland course',
      heading: 'The nine holes',
      course: heathland.id,
    },
    {
      blockType: 'scorecard',
      style: 'vertical',
      eyebrow: 'The Heathland course',
      heading: 'Scorecard',
      course: heathland.id,
      download: docs.heathCard.id,
    },
  ])

  await save('scorecards', [
    {
      blockType: 'scorecard',
      style: 'classic',
      eyebrow: 'The Championship course',
      heading: 'Scorecard',
      course: championship.id,
      download: docs.champCard.id,
    },
    {
      blockType: 'documentList',
      style: 'cards',
      eyebrow: 'Before you play',
      heading: 'Scorecards and local rules',
      documents: [docs.champCard.id, docs.heathCard.id, docs.localRules.id, docs.dress.id],
      viewAll: labelled('All club documents', to('documents')),
    },
  ])

  await save('course-status', [
    {
      blockType: 'courseStatus',
      style: 'board',
      eyebrow: 'Live from the greenkeeper',
      heading: 'Course status',
    },
  ])

  const lessons = (label: string, sub: string | null, p1: string, p2: string) => ({
    label,
    subLabel: sub,
    price1: p1,
    price2: p2,
  })
  await save('academy', [
    {
      blockType: 'twoColumn',
      style: 'split',
      imageSide: 'left',
      tone: 'canvas',
      image: photos[6].id,
      eyebrow: 'The Academy',
      heading: 'Coaching built around how you play',
      body: 'Our PGA professionals shape every programme around your swing, not a template. TrackMan bays, a dedicated short-game area and on-course lessons mean what you practise on Tuesday shows up on Saturday.\n\nBeginners, juniors and low handicappers all start the same way: with a free assessment.',
      link: labelled('Book a lesson', builtIn('contact')),
    },
    {
      blockType: 'team',
      style: 'featured',
      eyebrow: 'The Academy',
      heading: 'Meet the professionals',
      featured: team[0].id,
      people: people(2, 6),
      action: labelled('Book a lesson', builtIn('contact')),
      viewAll: labelled('The whole team', to('team')),
    },
    {
      blockType: 'rateTable',
      style: 'classic',
      eyebrow: 'Lessons',
      heading: 'Lesson prices',
      intro: 'All lessons include TrackMan analysis and a video summary by email.',
      columns: [{ label: 'Members' }, { label: 'Visitors' }],
      tabs: [
        {
          label: 'Lessons',
          sections: [
            {
              rows: [
                lessons('30-minute lesson', 'Any professional', '£35', '£45'),
                lessons('60-minute lesson', 'Any professional', '£65', '£85'),
                lessons('Playing lesson', '9 holes with a professional', '£120', '£150'),
                lessons('Junior group session', 'Saturdays, ages 8–16', '£10', '£15'),
              ],
            },
          ],
        },
      ],
      footnote: 'Packages of five lessons are charged at the price of four.',
    },
  ])

  await save('competitions', [
    {
      blockType: 'richText',
      style: 'article',
      content: rt.doc(
        rt.h2('Competitions at Heathcote'),
        rt.p(
          'Members play a full programme of medals, Stablefords and knockouts from March to October, with winter foursomes on the Heathland. Sign-up sheets open three weeks ahead.',
        ),
      ),
    },
    {
      blockType: 'eventsFeed',
      style: 'agenda',
      eyebrow: 'Diary',
      heading: 'Upcoming competitions and events',
      intro: 'Competitions, dinners and clinics, open to members and guests.',
    },
    {
      blockType: 'newsFeed',
      style: 'headlines',
      eyebrow: 'Results',
      heading: 'Competition news',
      category: 'competitions',
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
  const faqs = [
    {
      question: 'Do visitors need a handicap certificate?',
      answer:
        'Yes on the Championship course: a handicap of 24 (men) or 36 (women) or below. The Heathland course is open to all golfers, and our professionals can arrange a playing lesson if you’re new to the game.',
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
      answer: 'Yes. Book them with your tee time or ask at the pro shop on the day.',
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
    {
      question: 'Can we hold a wedding or private dinner?',
      answer:
        'Yes. The Harry Colt room seats 80 and the terrace takes 120 for drinks. Talk to our events manager.',
      topic: 'Events & societies',
    },
  ]
  await save('visitors', [
    {
      blockType: 'hero',
      style: 'bookingLed',
      mediaType: 'image',
      image: morning.id,
      eyebrow: 'Visitors welcome · 7 days a week',
      headline: 'Your morning on the Championship course',
    },
    {
      blockType: 'rateTable',
      style: 'seasons',
      eyebrow: 'Green fees',
      heading: 'Pay for the season you play',
      tabs: [
        seasonsTab('Visitor', 0),
        seasonsTab('Member’s guest', -40),
        seasonsTab('Society', -20),
      ],
      button: labelled('Check availability', { type: 'url', url: 'https://booking.example.com' }),
    },
    {
      blockType: 'rateTable',
      style: 'matrix',
      eyebrow: 'Rates',
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
                rate('Heathland', '9 holes', '£55', '£40', '£65', '£45'),
                rate('Junior (under 18)', 'Any course, with an adult', '£45', '£30', '£55', '£35'),
              ],
            },
          ],
        },
        {
          label: 'Member’s guest',
          sections: [{ rows: [rate('Championship', null, '£95', '£70', '£110', '£80')] }],
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
    {
      blockType: 'courseStatus',
      style: 'widget',
      eyebrow: 'Visitors',
      heading: 'Playing as a visitor',
      intro:
        'Visitors are welcome every day after 10am. Handicap certificates are required on the Championship course; the Heathland is open to all.',
      statusPage: to('course-status'),
    },
    {
      blockType: 'faq',
      style: 'centred',
      eyebrow: 'Visitors',
      heading: 'Before you play',
      items: faqs.slice(0, 5),
      contactLink: labelled('Ask the pro shop', builtIn('contact')),
    },
    { blockType: 'map', style: 'split', eyebrow: 'Getting here', heading: 'Find the club' },
  ])

  await save('societies', [
    {
      blockType: 'twoColumn',
      style: 'collage',
      imageSide: 'left',
      image: photos[5].id,
      insetImage: photos[7].id,
      eyebrow: 'Society days',
      heading: 'A day out your group will talk about',
      body: 'Coffee and bacon rolls on arrival, eighteen holes on the Championship course, and a two-course dinner overlooking the 18th. We look after the scoring, prizes and photographs.',
      link: labelled('Enquire about a date', builtIn('contact')),
    },
    {
      blockType: 'rateTable',
      style: 'classic',
      eyebrow: 'Society packages',
      heading: 'Per player, groups of 12 or more',
      columns: [{ label: 'Mon–Thu' }, { label: 'Friday' }],
      tabs: [
        {
          label: 'Packages',
          sections: [
            {
              rows: [
                rate('The Heathcote', 'Coffee, 18 holes, two-course dinner', '£145', '£165'),
                rate('The Colt', '27 holes, lunch and dinner', '£195', '£215'),
                rate('Twilight', '18 holes from 2pm, supper', '£95', '£110'),
              ],
            },
          ],
        },
      ],
    },
    {
      blockType: 'documentList',
      style: 'cards',
      eyebrow: 'Forms',
      heading: 'Booking forms',
      documents: [docs.society.id, docs.dress.id],
    },
  ])

  await save('getting-here', [
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
            'London Heathrow is a 20-minute drive. The club can arrange a car for visiting parties of four or more.',
        },
      ],
    },
  ])

  await save('faqs', [
    {
      blockType: 'faq',
      style: 'searchTopics',
      eyebrow: 'Help',
      heading: 'How can we help?',
      items: faqs,
      contactLink: labelled('Ask the club', builtIn('contact')),
    },
  ])

  const yes = 'yes'
  const vals = (...v: string[]) => v.map((value) => ({ value }))
  const benefits = (...t: string[]) => t.map((text) => ({ text }))
  const tierLink = to('joining')
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
    link: to('academy'),
  }
  await save('membership', [
    {
      blockType: 'hero',
      style: 'heritage',
      mediaType: 'image',
      image: photos[5].id,
      eyebrow: 'Membership',
      headline: 'A club for life, on two of the best heathland courses',
      primaryButton: labelled('How to join', to('joining')),
      secondaryLink: labelled('Ask the membership secretary', builtIn('contact')),
    },
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
      action: labelled('Book a tour', builtIn('contact')),
    },
    {
      blockType: 'pullQuote',
      style: 'centred',
      quote:
        'The finest piece of heathland golf in England, and the one I’d choose for my last round.',
      name: 'A visiting captain',
      role: 'Royal St George’s, 2025',
    },
    {
      blockType: 'faq',
      style: 'withContact',
      eyebrow: 'Questions',
      heading: 'About membership',
      items: [
        {
          question: 'Is there a waiting list?',
          answer:
            'Full membership has a waiting list of about six months. Five-day and intermediate places are usually available straight away.',
        },
        {
          question: 'Do I need a handicap to join?',
          answer:
            'No. New golfers can join through the Academy pathway and gain a handicap with us.',
        },
        {
          question: 'Can I pay monthly?',
          answer: 'Yes, subscriptions can be paid by monthly direct debit at no extra cost.',
        },
      ],
      cardHeading: 'Talk to Claire, our membership secretary',
      contactLink: labelled('Send a message', builtIn('contact')),
    },
  ])

  await save('joining', [
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
        link: labelled('Request a call back', builtIn('contact')),
        note: 'The Membership Secretary replies within two working days.',
      },
    },
    {
      blockType: 'documentList',
      style: 'cards',
      eyebrow: 'Forms',
      heading: 'Application forms',
      documents: [docs.application.id, docs.handbook.id],
    },
  ])

  const galleryImages = [...photos, ...tall, wide, dusk, morning].map((p, i) => ({
    image: p.id,
    caption: i === 0 ? 'Heather either side of the 2nd fairway, late September' : null,
    album: ['The course', 'Clubhouse', 'Events'][i % 3],
  }))
  await save('clubhouse', [
    {
      blockType: 'hero',
      style: 'resort',
      mediaType: 'image',
      image: dusk.id,
      eyebrow: 'Clubhouse & dining',
      headline: 'Supper on the terrace, above the 18th',
      caption: 'The terrace at dusk',
      primaryButton: labelled('Book a table', builtIn('contact')),
      secondaryLink: labelled('What’s on', builtIn('events')),
    },
    {
      blockType: 'twoColumn',
      style: 'split',
      imageSide: 'right',
      tone: 'brand',
      image: photos[5].id,
      eyebrow: 'The restaurant',
      heading: 'Seasonal, local and unhurried',
      body: 'Ed Lyle’s kitchen cooks breakfast from 7am, lunch and afternoon tea, and dinner on Thursday to Saturday. Members and their guests are always welcome; visitors on the day of their round.',
      link: labelled('See the autumn menu', builtIn('news')),
    },
    {
      blockType: 'eventsFeed',
      style: 'featured',
      eyebrow: 'Next big night',
      heading: 'Featured event',
    },
    {
      blockType: 'gallery',
      style: 'masonry',
      eyebrow: 'Gallery',
      heading: 'Around the clubhouse',
      images: galleryImages.slice(0, 9),
    },
  ])

  await save('gallery', [
    {
      blockType: 'gallery',
      style: 'grid',
      eyebrow: 'Gallery',
      heading: 'The club through the seasons',
      images: galleryImages,
    },
  ])

  const milestones = [
    {
      year: '1926',
      title: 'The club is founded',
      text: 'Members of the London Stock Exchange commission Harry Colt to lay out heathland golf within an hour of the City.',
      image: tall[0].id,
    },
    {
      year: '1931',
      title: 'A second course',
      text: 'The Heathland course opens for members’ families, routed through the old pine plantation.',
      image: photos[2].id,
    },
    {
      year: '1953',
      title: 'Championship golf arrives',
      text: 'The club hosts its first county championship; crowds of 3,000 follow the final.',
      image: photos[4].id,
    },
    {
      year: '1987',
      title: 'The new clubhouse',
      text: 'The Victorian lodge is extended, with the terrace that now overlooks the 18th green.',
      image: photos[5].id,
    },
    {
      year: '2019',
      title: 'Back to Colt',
      text: 'Every bunker is restored to Colt’s original drawings, found in the clubhouse library.',
      image: null,
    },
  ]
  await save('about', [
    {
      blockType: 'richText',
      style: 'editorial',
      eyebrow: 'Our story',
      noteTitle: 'Did you know?',
      noteText: 'Colt charged the club £150 for both courses, about £9,000 today.',
      content: rt.doc(
        rt.p(
          'Ninety-nine years ago, a group of stockbrokers asked a young architect for heathland golf within an hour of the City. He gave them two courses and one rule: keep the heather.',
        ),
        rt.p(
          'Today the club has 900 members and welcomes around 12,000 visitor rounds a year, but the heather, and Colt’s instruction, remain.',
        ),
      ),
    },
    {
      blockType: 'ctaCardGrid',
      style: 'index',
      heading: 'A club for every kind of golfer',
      intro:
        'From a first lesson to a lifetime membership, start with the part of the club that matters to you.',
      cards: [
        card('The courses', photos[0], to('courses'), {
          description: 'Two heathland layouts through heather and pine.',
        }),
        card('Visitors', photos[4], to('visitors'), {
          description: 'Green fees, dress code and how to book a round.',
        }),
        card('Membership', photos[5], to('membership'), {
          description: 'Full, flexible and junior categories, with a guided tour.',
        }),
        card('Our history', tall[0], to('history'), {
          description: 'A century of championships, architects and characters.',
        }),
      ],
    },
    {
      blockType: 'timeline',
      style: 'ledger',
      eyebrow: 'Our history',
      heading: 'Year by year',
      intro: 'From a stockbrokers’ idea in 1926 to the bunker restoration of 2019.',
      entries: milestones,
    },
    {
      blockType: 'newsFeed',
      style: 'leadList',
      eyebrow: 'News',
      heading: 'The latest from Heathcote',
    },
    {
      blockType: 'logoStrip',
      style: 'grid',
      eyebrow: 'Partners',
      heading: 'In good company',
      intro:
        'The organisations that certify our course, coach our juniors and help protect the heathland.',
      partners: partnerList,
    },
  ])

  await save('history', [
    {
      blockType: 'richText',
      style: 'contents',
      content: rt.doc(
        rt.h2('A short history of the club'),
        rt.p(
          'The club was founded in 1926 by a group of members from the London Stock Exchange who wanted heathland golf within an hour of the City. They hired Harry Colt, fresh from his work at Sunningdale, and gave him one instruction: keep the heather.',
        ),
        rt.h2('The early years'),
        rt.p(
          'Colt routed the Championship course along the natural ridges, which is why the 2nd and 13th still play into the prevailing wind. See ',
          rt.pageLink('the Championship course', String(pageIDs['championship-course'])),
          ' today.',
        ),
        rt.ul(
          '1926: club founded; Championship course opens',
          '1931: Heathland course added',
          '1953: first county championship hosted',
          '2019: bunkers restored to Colt’s plans',
        ),
        rt.h2('Championship golf'),
        rt.image(String(photos[4].id), 'The long 4th, where the 1953 final was decided.'),
        rt.h2('The club today'),
        rt.p('Today the club has 900 members and welcomes around 12,000 visitor rounds a year.'),
      ),
    },
    {
      blockType: 'timeline',
      style: 'alternating',
      eyebrow: 'Our history',
      heading: 'Ninety-nine years in four moments',
      entries: milestones.slice(0, 4),
    },
    {
      blockType: 'timeline',
      style: 'horizontal',
      eyebrow: 'Our history',
      heading: 'A century in the heather',
      entries: milestones,
    },
  ])

  await save('team', [
    {
      blockType: 'team',
      style: 'grid',
      eyebrow: 'The team',
      heading: 'The people behind the club',
      people: people(0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    },
    {
      blockType: 'team',
      style: 'directory',
      eyebrow: 'Contact',
      heading: 'Who to speak to',
      people: people(0, 2, 6, 3, 5, 4, 7),
      action: labelled('General enquiries', builtIn('contact')),
    },
  ])

  await save('partners', [
    {
      blockType: 'richText',
      style: 'article',
      content: rt.doc(
        rt.h2('Our partners'),
        rt.p(
          'These organisations certify our course, coach our juniors and help us protect the heathland. Interested in partnering with the club? ',
          rt.urlLink('Email the general manager', 'mailto:priya@heathcote.example'),
          '.',
        ),
      ),
    },
    {
      blockType: 'logoStrip',
      style: 'marquee',
      eyebrow: 'Our partners',
      partners: [...partnerList, ...partnerList.slice(0, 2)],
    },
  ])

  await save('documents', [
    {
      blockType: 'documentList',
      style: 'grouped',
      eyebrow: 'Club documents',
      heading: 'Policies, forms and scorecards',
      documents: [
        docs.champCard.id,
        docs.heathCard.id,
        docs.localRules.id,
        docs.safeguarding.id,
        docs.equality.id,
        docs.application.id,
        docs.society.id,
        docs.dress.id,
      ],
    },
    {
      blockType: 'documentList',
      style: 'table',
      eyebrow: 'Document library',
      heading: 'Find a document',
      documents: Object.values(docs).map((d) => d.id),
    },
  ])

  const simple = (heading: string, ...paragraphs: string[]) => [
    {
      blockType: 'richText',
      style: 'article',
      content: rt.doc(rt.h2(heading), ...paragraphs.map((p) => rt.p(p))),
    },
  ]
  await save(
    'terms',
    simple(
      'Terms of play',
      'Visitors must hold a handicap to play the Championship course. Ready golf is encouraged; please keep pace with the group in front.',
      'Example text for the demo club.',
    ),
  )
  await save(
    'accessibility',
    simple(
      'Accessibility',
      'We want everyone to be able to use this website. If something doesn’t work for you, please contact the club office.',
      'Example text for the demo club.',
    ),
  )

  return { url: `/preview/${DEMO_SLUG}`, pages: pageTitles.length }
}

const partnerList = [
  'Heathland Trust',
  'Fairway Collective',
  'County Golf Union',
  'Junior Golf Foundation',
  'Greens Certified',
  'The Links Guild',
].map((name) => ({ name, url: 'https://example.com' }))
