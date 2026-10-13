/**
 * Seeds the two test clubs (the same world as the integration tests) and writes the IDs the
 * browser tests need. Run by tests/e2e/setup.ts through `payload run`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { allowAccountCreation } from '@/access/accountCreation'

import { pdfFile, photoFile } from '../shared/media'
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
await w.payload.create({
  collection: 'pages',
  data: {
    title: 'Course',
    slug: 'course',
    tenant: w.clubA.id,
    layout: [
      { blockType: 'holeGrid', style: 'cards', heading: 'Holes', course: w.courseA.id },
      { blockType: 'holeGrid', style: 'guide', heading: 'Guide', course: w.courseA.id },
    ],
  } as never,
})

// Club A's header and menu, for the public site tests (tests/e2e/site-header.spec.ts).
await w.payload.update({
  collection: 'club-settings',
  id: w.settingsA.id,
  data: {
    branding: { strapline: 'Golf Club · 1926' },
    header: {
      style: 'classic',
      phone: '01932 704 500',
      booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
      menu: [
        {
          label: 'Golf',
          groups: [
            {
              heading: 'Play',
              links: [
                { link: { label: 'Green fees', type: 'url', url: 'https://example.com/fees' } },
                { link: { label: 'Membership', type: 'page', page: w.pageA.id } },
              ],
            },
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
mkdirSync('tests/e2e/.state', { recursive: true })
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
