/**
 * Seeds the two test clubs (the same world as the integration tests) and writes the IDs the
 * browser tests need. Run by tests/e2e/setup.ts through `payload run`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { allowAccountCreation } from '@/access/accountCreation'
import { PLACEHOLDER } from '@/marketing/collections/MarketingPages'
import { STARTER_PAGES, starterPageData } from '@/marketing/starter/pages'

import { pdfFile, photoFile } from '../shared/media'
import { rt } from '../shared/richText'
import { enrolTwoFactor, PASSWORD, seedWorld } from '../int/helpers/seed'

const w = await seedWorld()

// Club A's home page: a Heritage hero (tests/e2e/site-hero.spec.ts).
const heroPhoto = await w.payload.create({
  collection: 'media',
  data: { alt: 'Heathland fairway at dawn', tenant: w.clubA.id },
  file: await photoFile('fairway.jpg', 2400, 1200),
})
const homeA = await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Home',
    slug: 'home',
    tenant: w.clubA.id,
    layout: [
      {
        blockType: 'hero',
        style: 'heritage',
        mediaType: 'image',
        image: heroPhoto.id,
        eyebrow: 'Founded 1926',
        headline: 'A round worth travelling for',
        primaryButton: { label: 'Visitors', type: 'page', page: w.pageA.id },
        secondaryLink: { label: 'Membership', type: 'url', url: 'https://example.com/join' },
      },
    ],
  } as never,
})

// Club A's gallery page (tests/e2e/site-gallery.spec.ts): 13 photos, so "Load more" shows.
const galleryPhotos = []
for (let i = 1; i <= 13; i++) {
  galleryPhotos.push(
    await w.payload.create({
      collection: 'media',
      data: { alt: `Gallery photo ${i}`, tenant: w.clubA.id },
      file: await photoFile(`gallery-${i}.jpg`, 800, 600),
    }),
  )
}
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Gallery',
    slug: 'gallery',
    tenant: w.clubA.id,
    layout: [
      {
        blockType: 'gallery',
        style: 'grid',
        heading: 'Around the club',
        images: galleryPhotos.map((m) => ({ image: m.id })),
      },
    ],
  } as never,
})

// A gallery in "Viewer" style below a hero (tests/e2e/site-gallery.spec.ts): opening the page
// must not jump down to it.
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Photo library',
    slug: 'photo-library',
    tenant: w.clubA.id,
    layout: [
      {
        blockType: 'hero',
        style: 'heritage',
        mediaType: 'image',
        image: heroPhoto.id,
        headline: 'Photo library',
      },
      {
        blockType: 'gallery',
        style: 'viewer',
        heading: 'On the course',
        images: galleryPhotos.slice(0, 8).map((m) => ({ image: m.id })),
      },
    ],
  } as never,
})

// Club A's document library (tests/e2e/site-documents.spec.ts).
const libraryDocs = []
for (const [title, category, lastReviewed] of [
  ['Safeguarding policy', 'policies', '2026-03-12'],
  ['Privacy notice', 'policies', '2025-01-20'],
  ['Membership application', 'forms', undefined],
] as const) {
  libraryDocs.push(
    await w.payload.create({
      collection: 'documents',
      data: { title, category, lastReviewed, tenant: w.clubA.id } as never,
      file: pdfFile(`${title.toLowerCase().replace(/\W+/g, '-')}.pdf`),
    }),
  )
}
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Documents',
    slug: 'documents',
    tenant: w.clubA.id,
    layout: [
      {
        blockType: 'documentList',
        style: 'table',
        heading: 'Find a document',
        documents: libraryDocs.map((d) => d.id),
      },
    ],
  } as never,
})

// Club A's map page (tests/e2e/site-map.spec.ts).
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Find us',
    slug: 'find-us',
    tenant: w.clubA.id,
    layout: [{ blockType: 'map', style: 'split', heading: 'Find the club' }],
  } as never,
})

// Club A's help page (tests/e2e/site-faq.spec.ts).
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Help',
    slug: 'help',
    tenant: w.clubA.id,
    layout: [
      {
        blockType: 'faq',
        style: 'searchTopics',
        heading: 'How can we help?',
        items: [
          {
            question: 'Do visitors need a handicap certificate?',
            answer: 'Yes, 24 or below on the Championship course.',
            topic: 'Visitors',
          },
          { question: 'What is the dress code?', answer: 'Smart golf attire.', topic: 'Visitors' },
          {
            question: 'Is there a driving range?',
            answer: 'A 20-bay grass range.',
            topic: 'The course',
          },
        ],
      },
    ],
  } as never,
})

// Club A's team page (tests/e2e/site-team.spec.ts).
await w.payload.update({
  collection: 'staff',
  id: w.staffA.id,
  data: { bio: 'Alex has coached here for ten years.', email: 'alex@club-a.example' },
})
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Team',
    slug: 'team',
    tenant: w.clubA.id,
    layout: [
      { blockType: 'team', style: 'grid', heading: 'The team', people: [w.staffA.id] },
      { blockType: 'team', style: 'directory', heading: 'Who to ask', people: [w.staffA.id] },
    ],
  } as never,
})

// Club A's course page (tests/e2e/site-holes.spec.ts).
await w.payload.update({
  collection: 'courses',
  id: w.courseA.id,
  data: {
    tees: [
      { colour: 'white', rating: 70.1, slope: 125 },
      { colour: 'yellow', rating: 68.4, slope: 120 },
    ],
    holes: Array.from({ length: 9 }, (_, i) => ({
      par: 4,
      strokeIndex: i + 1,
      yardsWhite: 400,
      yardsYellow: 380,
    })),
  },
})
await w.payload.create({
  collection: 'pages',
  data: {
    _status: 'published',
    title: 'Course',
    slug: 'course',
    tenant: w.clubA.id,
    layout: [
      { blockType: 'holeGrid', style: 'cards', heading: 'Holes', course: w.courseA.id },
      { blockType: 'holeGrid', style: 'guide', heading: 'Guide', course: w.courseA.id },
      { blockType: 'scorecard', style: 'teeSelector', heading: 'Card', course: w.courseA.id },
    ],
  } as never,
})

// Club A's events (tests/e2e/site-events.spec.ts). The browser tests run on 15 July 2026.
for (const [i, category] of [
  'social',
  'dining',
  'competition',
  'social',
  'academy',
  'dining',
  'social',
  'competition',
].entries()) {
  await w.payload.create({
    collection: 'events',
    data: {
      title: `Event ${i + 1}`,
      category,
      status: 'published',
      booking: 'book',
      startsAt: new Date(Date.UTC(2026, 7 + Math.floor(i / 3), 3 + i, 18)).toISOString(),
      tenant: w.clubA.id,
    } as never,
  })
}

// Club A's header and menu, for the public site tests (tests/e2e/site-header.spec.ts).
await w.payload.update({
  collection: 'club-settings',
  id: w.settingsA.id,
  data: {
    branding: { strapline: 'Golf Club · 1926' },
    // tests/e2e/site-announcement.spec.ts (the browser tests run on 15 July 2026).
    announcement: {
      style: 'classic',
      tone: 'brand',
      items: [
        {
          message:
            'The Championship course reopens on Saturday 18 October after autumn hollow-tining. Buggies stay on paths until the greens recover, and the practice ground opens at 10:00 on weekdays while the new mats are fitted.',
          startsAt: '2026-07-01T12:00:00.000Z',
          expiresAt: '2026-07-31T12:00:00.000Z',
        },
        { message: 'An expired notice', expiresAt: '2026-07-14T12:00:00.000Z' },
      ],
    },
    header: {
      style: 'classic',
      phone: '01932 704 500',
      booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
      menu: [
        {
          label: 'Golf',
          kind: 'manual',
          links: [
            { link: { label: 'Green fees', type: 'url', url: 'https://example.com/fees' } },
            { link: { label: 'Membership', type: 'page', page: w.pageA.id } },
          ],
        },
        { label: 'Membership', link: { type: 'page', page: w.pageA.id } },
      ],
    },
    location: { latitude: 51.392, longitude: -0.612, mapLabel: 'Clubhouse' },
    footer: {
      style: 'brandColumns',
      about: 'Heathland golf since 1926.',
      linkColumns: [
        {
          heading: 'Explore',
          links: [{ link: { label: 'Membership', type: 'page', page: w.pageA.id } }],
        },
      ],
      hours: [{ place: 'Clubhouse', times: '7am – 9pm' }],
      email: 'hello@club-a.example',
      address: 'Heath Lane, Club A Town',
      legalLinks: [{ link: { label: 'Privacy', type: 'url', url: 'https://example.com/privacy' } }],
    },
  } as never,
})

// Two extra club A editors for the two-factor tests: one who hasn't set it up yet, and one
// whose two-factor the super-admin will reset.
const extraEditor = async (email: string, enrol: boolean) => {
  const user = await w.payload.create({
    collection: 'users',
    data: { email, password: PASSWORD, role: 'editor', tenant: w.clubA.id },
    context: allowAccountCreation,
  })
  if (enrol) await enrolTwoFactor(w.payload, user.id)
  return { id: user.id, email }
}
const editorNotSetUp = await extraEditor('editor-not-set-up@example.com', false)
const editorToReset = await extraEditor('editor-to-reset@example.com', true)
// One account per login test: Payload saves a login by writing back the whole account record,
// so two tests logging in as the same account at the same moment can log each other out.
const editorLoginOnly = await extraEditor('editor-login-only@example.com', true)
const editorTypesCode = await extraEditor('editor-types-code@example.com', true)
const editorWrongCode = await extraEditor('editor-wrong-code@example.com', true)
const editorLinkTarget = await extraEditor('editor-link-target@example.com', true)
// One club per header style, with a long name in the widest font set, so the phone-width check
// in tests/e2e/site-header.spec.ts has something that could overflow.
for (const style of ['classic', 'transparent', 'appBar'] as const) {
  const club = await w.payload.create({
    collection: 'tenants',
    data: { name: 'Saltmarsh Links', slug: `header-${style.toLowerCase()}` },
  })
  const { docs } = await w.payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: club.id } },
    limit: 1,
  })
  const about = await w.payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      title: 'About the club',
      slug: 'about',
      tenant: club.id,
      layout: [],
    } as never,
  })
  await w.payload.update({
    collection: 'club-settings',
    id: docs[0].id,
    data: {
      clubName: 'Saltmarsh Links',
      branding: { fontSet: 'editorial', strapline: 'Links · 1891' },
      footer: { email: 'office@saltmarsh.example', address: '1 Links Road\nSaltmarsh\nSA1 1LT' },
      header: {
        style,
        phone: '01932 704 500',
        booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
        // Nine items, like Cottrell Park's: too many to fit across a laptop (headerFit.ts).
        menu: [
          'Golf',
          'Visitors',
          'Membership',
          'Clubhouse',
          'About',
          'Saltmarsh Links Resort',
          'Weddings',
          'What’s on',
          'Contact us',
        ].map((label) => ({ label, link: { type: 'page', page: about.id } })),
      },
    },
  })
}

// Six short items: these fit across a laptop and must stay a full menu.
{
  const club = await w.payload.create({
    collection: 'tenants',
    data: { name: 'Test Club Six', slug: 'header-six' },
  })
  const { docs } = await w.payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: club.id } },
    limit: 1,
  })
  const about = await w.payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      title: 'About the club',
      slug: 'about',
      tenant: club.id,
      layout: [],
    } as never,
  })
  await w.payload.update({
    collection: 'club-settings',
    id: docs[0].id,
    data: {
      clubName: 'Test Club Six',
      footer: { email: 'office@six.example', address: '6 Fairway Road\nTesttown\nTE6 6ST' },
      header: {
        style: 'classic',
        booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
        menu: ['Golf', 'Visitors', 'Members', 'Clubhouse', 'News', 'Contact'].map((label) => ({
          label,
          link: { type: 'page', page: about.id },
        })),
      },
    },
  })
}

// A club using every privacy option, for tests/e2e/site-privacy.spec.ts. Its own club, so the
// cookie banner never sits over what other tests click.
const cookieClub = await w.payload.create({
  collection: 'tenants',
  data: { name: 'Test Club Cookies', slug: 'test-club-cookies' },
})
const { docs: cookieSettings } = await w.payload.find({
  collection: 'club-settings',
  where: { tenant: { equals: cookieClub.id } },
})
await w.payload.update({
  collection: 'club-settings',
  id: cookieSettings[0]!.id,
  data: {
    footer: { email: 'office@cookies.example', address: '1 Fairway Road\nTesttown\nTE1 1ST' },
    privacy: {
      legalName: 'Test Club Cookies Limited',
      email: 'privacy@cookies.example',
      newsletterProvider: 'Mailchimp',
      gaMeasurementId: 'G-TEST12345',
      additionalInfo: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              direction: 'ltr',
              textFormat: 0,
              children: [
                {
                  type: 'text',
                  text: 'We use CCTV in the car park.',
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ],
            },
          ],
        },
      },
    },
  } as never,
  overrideAccess: true,
})

// Club A's news: nine live articles (tests/e2e/site-news.spec.ts). The browser tests pin
// "today" to 15 July 2026,
// so the seeded "Club A news" (dated today) is still in the future there and stays hidden.
const newsPhoto = await w.payload.create({
  collection: 'media',
  data: { alt: 'Greenkeeper hollow tining the 18th green', tenant: w.clubA.id },
  file: await photoFile('tining.jpg', 1600, 900),
})
const articles: [string, string, string][] = [
  ['Hollow tining week', 'course', '2026-07-14'],
  ['Club championship results', 'competitions', '2026-07-12'],
  ['New bar menu', 'clubhouse', '2026-07-10'],
  ['Junior open day', 'academy', '2026-07-08'],
  ['Summer fourball', 'competitions', '2026-07-06'],
  ['Bunker renovation update', 'course', '2026-07-04'],
  ['Welcome to our new members', 'membership', '2026-07-02'],
  ['Greenkeeping team grows', 'club', '2026-06-30'],
  ['Spring meeting report', 'club', '2026-06-28'],
]
for (const [title, category, date] of articles) {
  await w.payload.create({
    collection: 'news',
    data: {
      title,
      category,
      status: 'published',
      publishedAt: `${date}T12:00:00.000Z`,
      excerpt: `${title}: the latest from the club.`,
      author: title === 'Hollow tining week' ? 'Owen Pryce, Course Manager' : undefined,
      image: title === 'Hollow tining week' ? newsPhoto.id : undefined,
      imageCaption: title === 'Hollow tining week' ? 'The 18th green, Monday morning' : undefined,
      body:
        title === 'Hollow tining week'
          ? rt.doc(
              rt.p('The greens will be hollow tined from Monday. Temporary greens are in play.'),
              rt.h2('What to expect'),
              rt.ul('Slower greens for about two weeks', 'Preferred lies through the green'),
            )
          : undefined,
      tenant: w.clubA.id,
    } as never,
  })
}
await w.payload.create({
  collection: 'news',
  data: {
    title: 'Unfinished draft',
    category: 'club',
    status: 'draft',
    publishedAt: '2026-07-13T12:00:00.000Z',
    tenant: w.clubA.id,
  } as never,
})

mkdirSync('tests/e2e/.state', { recursive: true })
// The company website (tests/e2e/marketing-content.spec.ts): one published page, one draft.
await w.payload.create({
  collection: 'marketing-pages',
  data: {
    _status: 'published',
    title: 'E2E pricing',
    slug: 'e2e-pricing',
    meta: { description: 'One price for your club, shown in full.' },
    layout: [
      { blockType: 'mkSectionHeader', eyebrow: 'Pricing', title: 'One clear price' },
      {
        blockType: 'mkRichText',
        content: rt.doc(rt.p('Marketing-only sentence for the browser tests.')),
      },
      { blockType: 'mkCtaBand', title: 'See it on your club' },
    ],
  } as never,
})
await w.payload.create({
  collection: 'marketing-pages',
  draft: true,
  data: {
    _status: 'draft',
    title: 'E2E draft',
    slug: 'e2e-draft',
    layout: [{ blockType: 'mkSectionHeader', title: 'Not published yet' }],
  } as never,
})

// Every marketing block and variant on one page, for the Figma comparison
// (tests/e2e/marketing-look.spec.ts).
const marketingPhoto = await w.payload.create({
  collection: 'marketing-media',
  data: { alt: 'Demo club: a heathland fairway at dawn' },
  file: await photoFile('demo-fairway.jpg', 2400, 1350),
})
await w.payload.create({
  collection: 'marketing-pages',
  data: {
    _status: 'published',
    title: 'E2E blocks',
    slug: 'e2e-blocks',
    layout: [
      {
        blockType: 'mkSectionHeader',
        eyebrow: 'Eyebrow',
        title: 'A heading that says one thing well.',
        subhead: 'One or two sentences that back the heading up. Keep it under thirty words.',
      },
      {
        blockType: 'mkRichText',
        content: rt.doc(
          rt.h2('Our commitment'),
          rt.p('A paragraph of body text, set in the reading width.'),
          rt.p('A second paragraph with ', rt.urlLink('a link', 'https://example.com'), '.'),
          rt.h3('What we test'),
          rt.ul('Keyboard access to every control', 'Colour contrast of text and controls'),
          rt.quote('A quote, set large with a dawn rule.'),
        ),
      },
      {
        blockType: 'mkSectionHeader',
        eyebrow: 'Features',
        title: 'Rows by default.',
        align: 'center',
      },
      {
        blockType: 'mkFeatureCards',
        cards: [
          {
            icon: 'check',
            title: 'Rows have no box',
            body: 'A hairline above, icon beside the text.',
          },
          {
            icon: 'calendar',
            title: 'Two columns',
            body: 'Rows sit in a two-column list.',
            availability: 'coming-next',
          },
        ],
      },
      {
        blockType: 'mkFeatureCards',
        style: 'cards',
        cards: [
          {
            icon: 'lock',
            title: 'Cards link somewhere',
            body: 'Only then is it a card.',
            linkLabel: 'Read more',
            linkHref: '/e2e-pricing',
          },
          {
            icon: 'players',
            title: 'Equal widths',
            body: 'Rows of two or three.',
            linkLabel: 'Read more',
            linkHref: '/e2e-pricing',
          },
          {
            icon: 'flag',
            title: 'Badges show status',
            body: 'Text and icon, never colour alone.',
            availability: 'coming-next',
            linkLabel: 'Read more',
            linkHref: '/e2e-pricing',
          },
        ],
      },
      { blockType: 'mkSectionHeader', title: 'Photos.' },
      {
        blockType: 'mkMedia',
        image: marketingPhoto.id,
        ratio: '16:9',
        frame: 'plain',
        caption: 'Caption. Optional, one line.',
      },
      {
        blockType: 'mkMedia',
        image: marketingPhoto.id,
        ratio: '3:2',
        frame: 'window',
        windowAddress: 'ashgrovepark.golf',
      },
      {
        blockType: 'mkCtaBand',
        title: 'See your club on it.',
        subhead: 'We’ll rebuild your homepage in your colours and send it straight to you, free.',
      },
    ],
  } as never,
})

// The marketing pages from the Figma copy, published (tests/e2e/marketing-*.spec.ts). The
// legal pages keep their placeholder wording, so they stay drafts (marketing-info.spec.ts).
for (const starter of STARTER_PAGES) {
  const data = starterPageData(starter, new Date('2026-10-14T12:00:00Z'))
  const draft = PLACEHOLDER.test(JSON.stringify(data.layout))
  await w.payload.create({
    collection: 'marketing-pages',
    draft,
    data: { _status: draft ? 'draft' : 'published', ...data } as never,
  })
}

writeFileSync(
  'tests/e2e/.state/world.json',
  JSON.stringify({
    clubA: { id: w.clubA.id, name: w.clubA.name },
    clubB: { id: w.clubB.id, name: w.clubB.name },
    superAdmin: { id: w.superAdmin.id, email: w.superAdmin.email },
    editorA: { id: w.editorA.id, email: w.editorA.email },
    editorA2: { id: w.editorA2.id, email: w.editorA2.email },
    editorB: { id: w.editorB.id, email: w.editorB.email },
    pageA: { id: w.pageA.id, title: w.pageA.title },
    pageB: { id: w.pageB.id, title: w.pageB.title },
    homeA: { id: homeA.id },
    settingsA: { id: w.settingsA.id },
    settingsB: { id: w.settingsB.id },
    mediaB: {
      id: w.mediaB.id,
      prefix: w.mediaB.prefix,
      filename: w.mediaB.filename,
      url: w.mediaB.url,
    },
    editorNotSetUp,
    editorToReset,
    editorLoginOnly,
    editorTypesCode,
    editorWrongCode,
    editorLinkTarget,
  }),
)
process.exit(0)
