import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { allowAccountCreation } from '@/access/accountCreation'
import { createSuperAdmin } from '@/accounts/createSuperAdmin'
import config from '@/payload.config'
import type {
  AgreementAcceptance,
  ClubSetting,
  Course,
  CourseStatus,
  Document,
  Enquiry,
  Event,
  Media,
  News,
  Page,
  Staff,
  Tenant,
  User,
} from '@/payload-types'

import { ensureMediaBucket, pdfFile, pngFile } from '../../shared/media'
import { TEST_TOTP_SECRET } from '../../shared/totp'

export const PASSWORD = 'a-long-test-password'

export { TEST_TOTP_SECRET }

/** Gives an account two-factor, as if they'd scanned the QR code. Stored encrypted. */
export const enrolTwoFactor = (payload: Payload, id: string) =>
  payload.update({
    collection: 'users',
    id,
    data: { totpSecret: TEST_TOTP_SECRET } as never,
    overrideAccess: true,
  })

export type LoggedInUser = User & { collection: 'users'; _strategy?: string }

export type World = {
  payload: Payload
  clubA: Tenant
  clubB: Tenant
  superAdmin: LoggedInUser
  editorA: LoggedInUser
  editorA2: LoggedInUser
  editorB: LoggedInUser
  pageA: Page
  pageB: Page
  settingsA: ClubSetting
  settingsB: ClubSetting
  mediaA: Media
  mediaB: Media
  docA: Document
  docB: Document
  staffA: Staff
  staffB: Staff
  courseA: Course
  courseB: Course
  statusA: CourseStatus
  statusB: CourseStatus
  newsA: News
  newsB: News
  agreementA: AgreementAcceptance
  agreementB: AgreementAcceptance
  eventA: Event
  eventB: Event
  enquiryA: Enquiry
  enquiryB: Enquiry
}

/** Refuses to run against anything but the golf_test database (or a golf_test_<name> copy). */
export const assertTestDatabase = () => {
  if (!/\/golf_test(_[a-z0-9]+)?(\?|$)/.test(process.env.DATABASE_URL ?? '')) {
    throw new Error('Integration tests must run against the golf_test database')
  }
}

export const getTestPayload = async () => {
  assertTestDatabase()
  return getPayload({ config: await config })
}

export const resetDatabase = async (payload: Payload) => {
  const all = { id: { exists: true } }
  await payload.delete({ collection: 'pages', where: all })
  await payload.delete({ collection: 'media', where: all })
  await payload.delete({ collection: 'documents', where: all })
  await payload.delete({ collection: 'staff', where: all })
  await payload.delete({ collection: 'courses', where: all })
  await payload.delete({ collection: 'news', where: all })
  await payload.delete({ collection: 'agreement-acceptances', where: all })
  await payload.delete({ collection: 'events', where: all })
  await payload.delete({ collection: 'enquiries', where: all })
  await payload.delete({ collection: 'club-settings', where: all })
  await payload.delete({ collection: 'course-status', where: all })
  await payload.delete({ collection: 'payload-preferences', where: all })
  await payload.delete({ collection: 'marketing-pages', where: all })
  await payload.delete({ collection: 'marketing-media', where: all })
  // Settings screens have one record; removing it brings back the defaults.
  await payload.db.drizzle.execute(sql`DELETE FROM marketing_settings`)
  // Rate-limit counts, so one test file's sends don't count against the next one's limits.
  await payload.db.drizzle.execute(sql`DELETE FROM rate_limits`)
  await payload.delete({ collection: 'users', where: all })
  await payload.delete({ collection: 'tenants', where: all })
}

/**
 * Loads a user exactly as Payload's login does for a request: findByID with hooks applied,
 * plus the `collection` marker (payload/dist/auth/strategies/jwt.js). The multi-tenant plugin
 * only scopes users that carry this marker, so tests must include it.
 */
export const asUser = async (payload: Payload, id: string): Promise<LoggedInUser> => {
  const user = await payload.findByID({ collection: 'users', id, depth: 0 })
  // How the account is signed in when fully logged in: with its two-factor code entered
  // (`totp`, payload-totp's marker) if it has two-factor, otherwise with its password alone
  // (`local-jwt`): club editors without two-factor (decisions.md, 22 Oct).
  const hasTotp = Boolean((user as { hasTotp?: boolean }).hasTotp)
  return { ...user, collection: 'users', _strategy: hasTotp ? 'totp' : 'local-jwt' }
}

/** The same user part-way through logging in: password accepted, no code entered yet. */
export const withoutCode = (user: LoggedInUser): LoggedInUser => {
  const { _strategy: _ignored, ...rest } = user as LoggedInUser & { _strategy?: string }
  return { ...rest, _strategy: 'local-jwt' } as LoggedInUser
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** A club editor with a password only (the default since 22 Oct), or with two-factor too. */
export const createEditor = async (
  payload: Payload,
  email: string,
  tenant: string,
  { twoFactor = false }: { twoFactor?: boolean } = {},
) => {
  const created = await payload.create({
    collection: 'users',
    data: { email, password: PASSWORD, role: 'editor', tenant },
    context: allowAccountCreation,
  })
  if (twoFactor) await enrolTwoFactor(payload, created.id)
  return asUser(payload, created.id)
}

/** Two test clubs, an editor in each (two in club A), and a super-admin. */
export const seedWorld = async (): Promise<World> => {
  const payload = await getTestPayload()
  await ensureMediaBucket()
  await resetDatabase(payload)

  // Web addresses (build step 4). Browsers send *.localhost to this computer, so the browser
  // tests can visit each club on "its own domain". The second address forwards to the first.
  const clubA = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Test Club A',
      domains: [{ hostname: 'club-a.localhost' }, { hostname: 'old-club-a.localhost' }],
    },
  })
  const clubB = await payload.create({
    collection: 'tenants',
    data: { name: 'Test Club B', domains: [{ hostname: 'club-b.localhost' }] },
  })
  const superAdminID = (
    await createSuperAdmin(payload, { email: 'super@example.com', password: PASSWORD })
  ).id
  await enrolTwoFactor(payload, superAdminID)
  const superAdmin = await asUser(payload, superAdminID)

  // Both clubs have a page with the same slug: slugs are unique per club, not globally.
  const page = (title: string, tenant: string) =>
    payload.create({
      collection: 'pages',
      data: { _status: 'published', title, slug: 'membership', tenant },
    })
  // Created automatically with each club (src/collections/Tenants.ts), then given the email
  // and address every save needs (the privacy policy uses them).
  const settings = async (clubName: string, tenant: string) => {
    const { docs } = await payload.find({
      collection: 'club-settings',
      where: { tenant: { equals: tenant } },
    })
    return payload.update({
      collection: 'club-settings',
      id: docs[0]!.id,
      data: {
        footer: { email: `office@${slugOf(clubName)}.example`, address: `${clubName}\nTest Lane` },
      },
      overrideAccess: true,
    })
  }

  const status = async (tenant: string) =>
    (await payload.find({ collection: 'course-status', where: { tenant: { equals: tenant } } }))
      .docs[0]

  const media = (alt: string, tenant: string) =>
    payload.create({ collection: 'media', data: { alt, tenant }, file: pngFile('photo.png') })

  return {
    payload,
    clubA,
    clubB,
    superAdmin,
    editorA: await createEditor(payload, 'editor-a@example.com', clubA.id),
    editorA2: await createEditor(payload, 'editor-a2@example.com', clubA.id),
    editorB: await createEditor(payload, 'editor-b@example.com', clubB.id),
    pageA: await page('Membership (Club A)', clubA.id),
    pageB: await page('Membership (Club B)', clubB.id),
    settingsA: await settings('Test Club A', clubA.id),
    settingsB: await settings('Test Club B', clubB.id),
    // Same file name in both clubs: each is stored in its own random folder.
    mediaA: await media('Club A photo', clubA.id),
    mediaB: await media('Club B photo', clubB.id),
    docA: await payload.create({
      collection: 'documents',
      data: { title: 'Club A local rules', category: 'course', tenant: clubA.id },
      file: pdfFile('local-rules.pdf'),
    }),
    docB: await payload.create({
      collection: 'documents',
      data: { title: 'Club B local rules', category: 'course', tenant: clubB.id },
      file: pdfFile('local-rules.pdf'),
    }),
    staffA: await payload.create({
      collection: 'staff',
      data: { name: 'Alex Pro', role: 'Head Professional', department: 'golf', tenant: clubA.id },
    }),
    staffB: await payload.create({
      collection: 'staff',
      data: { name: 'Bea Pro', role: 'Head Professional', department: 'golf', tenant: clubB.id },
    }),
    courseA: await course(payload, 'Club A course', clubA.id),
    courseB: await course(payload, 'Club B course', clubB.id),
    // Created automatically with each club, like Club Settings.
    statusA: await status(clubA.id),
    statusB: await status(clubB.id),
    // Same address in both clubs: addresses are unique per club, not globally.
    newsA: await payload.create({
      collection: 'news',
      data: {
        title: 'Club A news',
        publishedAt: new Date().toISOString(),
        status: 'published',
        category: 'club',
        tenant: clubA.id,
      },
    }),
    newsB: await payload.create({
      collection: 'news',
      data: {
        title: 'Club B news',
        publishedAt: new Date().toISOString(),
        slug: 'club-a-news',
        status: 'published',
        category: 'club',
        tenant: clubB.id,
      },
    }),
    // Both clubs have accepted the data processing agreement, so editors can save settings.
    agreementA: await acceptAgreement(payload, clubA.id, 'Alice Secretary'),
    agreementB: await acceptAgreement(payload, clubB.id, 'Bob Secretary'),
    eventA: await event(payload, 'Club A dinner', clubA.id),
    eventB: await event(payload, 'Club B dinner', clubB.id),
    // Only the website creates enquiries, as trusted server code (src/site/contact/submit.ts).
    enquiryA: await enquiry(payload, 'Ann Visitor', clubA.id),
    enquiryB: await enquiry(payload, 'Ben Visitor', clubB.id),
  }
}

/** A message from the Contact page, saved as the website saves it. */
export const enquiry = (payload: Payload, name: string, tenant: string) =>
  payload.create({
    collection: 'enquiries',
    data: {
      name,
      tenant,
      reference: `T-ENQ-${name.length}`,
      purpose: 'general',
      email: 'visitor@example.com',
      message: 'Hello',
      status: 'new',
    },
    overrideAccess: true,
  })

/** The club accepts the current data processing agreement (as a trusted script would). */
export const acceptAgreement = (payload: Payload, tenant: string, fullName: string) =>
  payload.create({
    collection: 'agreement-acceptances',
    data: { fullName, jobTitle: 'Club Secretary', authorised: true, tenant },
  })

/** A published event a week from now. */
export const event = (payload: Payload, title: string, tenant: string, days = 7) =>
  payload.create({
    collection: 'events',
    data: {
      title,
      tenant,
      status: 'published',
      category: 'dining',
      booking: 'book',
      startsAt: new Date(Date.now() + days * 86_400_000).toISOString(),
    },
  })

/** A 9-hole course with one tee. */
export const course = (payload: Payload, name: string, tenant: string) =>
  payload.create({
    collection: 'courses',
    data: {
      name,
      tenant,
      tees: [{ colour: 'white' }],
      holes: Array.from({ length: 9 }, (_, i) => ({ par: 4, strokeIndex: i + 1, yardsWhite: 400 })),
    },
  })
