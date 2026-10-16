/**
 * Tenant-isolation suite (CLAUDE.md non-negotiable 3). Runs as the required
 * `tenant-isolation` check. Editor A must get zero records from club B, by any route.
 *
 * Every club-owned collection in src/tenancy.ts needs an entry in `fixtures` below;
 * TypeScript refuses to build until it has one, so no collection can go untested.
 */
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { clubOwnedCollections, type ClubOwnedSlug } from '@/tenancy'

import { pdfFile, pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const MISSING_ID = '00000000-0000-4000-8000-000000000000'

/** Runs fn and returns its error (or null), so failures can be compared. */
const errorOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    const e = error as { name?: string; message?: string; status?: number }
    return { name: e.name, message: e.message, status: e.status }
  }
  return null
}

type Fixture = {
  ids: (w: World) => { a: string; b: string }
  /** Data for a new record in the given club. */
  newRecord: (tenant: string) => Record<string, unknown>
  /** A harmless change, and how to read the value back. */
  change: Record<string, unknown>
  read: (doc: unknown) => unknown
  /** Club-global collections (one record per club) can't be created by editors at all. */
  editorsCanCreate: boolean
  /** Upload collections: the file to send with a new record. */
  file?: () => ReturnType<typeof pngFile> | ReturnType<typeof pdfFile>
}

const fixtures: Record<ClubOwnedSlug, Fixture> = {
  pages: {
    ids: (w) => ({ a: w.pageA.id, b: w.pageB.id }),
    newRecord: (tenant) => ({ title: 'Planted', slug: `planted-${Date.now()}`, tenant }),
    change: { title: 'Changed' },
    read: (doc) => (doc as { title?: unknown }).title,
    editorsCanCreate: true,
  },
  'club-settings': {
    ids: (w) => ({ a: w.settingsA.id, b: w.settingsB.id }),
    newRecord: (tenant) => ({ clubName: 'Planted', tenant }),
    change: { clubName: 'Changed' },
    read: (doc) => (doc as { clubName?: unknown }).clubName,
    editorsCanCreate: false,
  },
  'course-status': {
    ids: (w) => ({ a: w.statusA.id, b: w.statusB.id }),
    newRecord: (tenant) => ({ state: 'closed', tenant }),
    change: { reason: 'Changed' },
    read: (doc) => (doc as { reason?: unknown }).reason,
    editorsCanCreate: false,
  },
  media: {
    ids: (w) => ({ a: w.mediaA.id, b: w.mediaB.id }),
    newRecord: (tenant) => ({ alt: 'Planted', tenant }),
    change: { alt: 'Changed' },
    read: (doc) => (doc as { alt?: unknown }).alt,
    editorsCanCreate: true,
    file: () => pngFile('planted.png'),
  },
  documents: {
    ids: (w) => ({ a: w.docA.id, b: w.docB.id }),
    newRecord: (tenant) => ({ title: 'Planted', category: 'forms', tenant }),
    change: { title: 'Changed' },
    read: (doc) => (doc as { title?: unknown }).title,
    editorsCanCreate: true,
    file: () => pdfFile('planted.pdf'),
  },
  staff: {
    ids: (w) => ({ a: w.staffA.id, b: w.staffB.id }),
    newRecord: (tenant) => ({ name: 'Planted', role: 'Planted', department: 'golf', tenant }),
    change: { name: 'Changed' },
    read: (doc) => (doc as { name?: unknown }).name,
    editorsCanCreate: true,
  },
  news: {
    ids: (w) => ({ a: w.newsA.id, b: w.newsB.id }),
    newRecord: (tenant) => ({
      title: `Planted ${Date.now()}`,
      category: 'club',
      publishedAt: new Date().toISOString(),
      tenant,
    }),
    change: { title: 'Changed' },
    read: (doc) => (doc as { title?: unknown }).title,
    editorsCanCreate: true,
  },
  events: {
    ids: (w) => ({ a: w.eventA.id, b: w.eventB.id }),
    newRecord: (tenant) => ({
      title: 'Planted',
      category: 'social',
      booking: 'book',
      startsAt: new Date().toISOString(),
      tenant,
    }),
    change: { title: 'Changed' },
    read: (doc) => (doc as { title?: unknown }).title,
    editorsCanCreate: true,
  },
  courses: {
    ids: (w) => ({ a: w.courseA.id, b: w.courseB.id }),
    newRecord: (tenant) => ({
      name: 'Planted',
      tenant,
      tees: [{ colour: 'white' }],
      holes: Array.from({ length: 9 }, () => ({ par: 4 })),
    }),
    change: { name: 'Changed' },
    read: (doc) => (doc as { name?: unknown }).name,
    editorsCanCreate: true,
  },
}

const slugs = Object.keys(clubOwnedCollections) as ClubOwnedSlug[]
const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const p = (): Payload => w.payload

describe.each(slugs)('%s: editor A gets nothing from club B', (slug) => {
  const f = fixtures[slug]

  it('lists and counts only club A records', async () => {
    const { a } = f.ids(w)
    const list = await p().find({ collection: slug, ...asEditorA(), limit: 0 })
    expect(list.docs.map((d) => d.id)).toEqual([a])
    expect((await p().count({ collection: slug, ...asEditorA() })).totalDocs).toBe(1)
  })

  it("searching by club B's ID or club returns nothing", async () => {
    const { b } = f.ids(w)
    const byID = await p().find({ collection: slug, ...asEditorA(), where: { id: { equals: b } } })
    expect(byID.totalDocs).toBe(0)
    const byClub = await p().find({
      collection: slug,
      ...asEditorA(),
      where: { tenant: { equals: w.clubB.id } },
    })
    expect(byClub.totalDocs).toBe(0)
  })

  it("club B's record by ID looks exactly like one that doesn't exist", async () => {
    const { b } = f.ids(w)
    const otherClub = await errorOf(() => p().findByID({ collection: slug, id: b, ...asEditorA() }))
    const missing = await errorOf(() =>
      p().findByID({ collection: slug, id: MISSING_ID, ...asEditorA() }),
    )
    expect(otherClub).not.toBeNull()
    expect(otherClub).toEqual(missing)
  })

  it("cannot change or delete club B's record", async () => {
    const { b } = f.ids(w)
    const before = f.read(await p().findByID({ collection: slug, id: b }))
    await errorOf(() => p().update({ collection: slug, id: b, data: f.change, ...asEditorA() }))
    await errorOf(() => p().delete({ collection: slug, id: b, ...asEditorA() }))
    const after = await p().findByID({ collection: slug, id: b })
    expect(f.read(after)).toEqual(before)
  })

  it('bulk changes by query never reach club B', async () => {
    const { b } = f.ids(w)
    const before = f.read(await p().findByID({ collection: slug, id: b }))
    await errorOf(() =>
      p().update({
        collection: slug,
        where: { id: { exists: true } },
        data: f.change,
        ...asEditorA(),
      }),
    )
    expect(f.read(await p().findByID({ collection: slug, id: b }))).toEqual(before)
  })

  it('cannot create a record in club B', async () => {
    const before = (
      await p().count({ collection: slug, where: { tenant: { equals: w.clubB.id } } })
    ).totalDocs
    await errorOf(() =>
      p().create({
        collection: slug,
        data: f.newRecord(w.clubB.id) as never,
        file: f.file?.(),
        ...asEditorA(),
      }),
    )
    const after = (await p().count({ collection: slug, where: { tenant: { equals: w.clubB.id } } }))
      .totalDocs
    expect(after).toBe(before)
  })

  it('creating in club A behaves as configured', async () => {
    const result = await errorOf(() =>
      p().create({
        collection: slug,
        data: f.newRecord(w.clubA.id) as never,
        file: f.file?.(),
        ...asEditorA(),
      }),
    )
    if (f.editorsCanCreate) expect(result).toBeNull()
    else expect(result).not.toBeNull()
  })

  it('the super-admin sees both clubs', async () => {
    const all = await p().find({ collection: slug, overrideAccess: false, user: w.superAdmin })
    const { a, b } = f.ids(w)
    expect(all.docs.map((d) => d.id)).toEqual(expect.arrayContaining([a, b]))
  })
})

describe('pages: slugs are unique per club, not across clubs', () => {
  it("editor A can use a slug that only club B uses, and the clash error doesn't mention B", async () => {
    await p().create({
      collection: 'pages',
      data: { title: 'B only', slug: 'b-only', tenant: w.clubB.id },
    })
    const created = await p().create({
      collection: 'pages',
      data: { title: 'A copy', slug: 'b-only', tenant: w.clubA.id },
      ...asEditorA(),
    })
    expect(created.slug).toBe('b-only')
    const clash = await errorOf(() =>
      p().create({
        collection: 'pages',
        data: { title: 'A again', slug: 'b-only', tenant: w.clubA.id },
        ...asEditorA(),
      }),
    )
    expect(clash).not.toBeNull()
    expect(JSON.stringify(clash)).not.toContain('Club B')
  })
})

describe("Payload's own records", () => {
  it("editor A cannot read club B's admin preferences", async () => {
    // Written directly: Payload's own preference form takes the owner from the request.
    await p().db.create({
      collection: 'payload-preferences',
      data: {
        key: 'b-pref',
        value: { club: 'B' },
        user: { relationTo: 'users', value: w.editorB.id },
      },
    })
    expect((await p().find({ collection: 'payload-preferences' })).totalDocs).toBeGreaterThan(0)
    const res = await p().find({ collection: 'payload-preferences', ...asEditorA() })
    expect(res.docs).toHaveLength(0)
  })
})

describe('the database enforces club ownership on its own', () => {
  const db = () => p().db.drizzle

  it('rejects club content with no club', async () => {
    await expect(
      db().execute(sql`INSERT INTO pages (title, slug) VALUES ('orphan', 'orphan')`),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO club_settings (club_name) VALUES ('orphan')`),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO media (alt, prefix) VALUES ('orphan', 'media/orphan')`),
    ).rejects.toThrow()
    await expect(
      db().execute(
        sql`INSERT INTO documents (title, prefix) VALUES ('orphan', 'documents/orphan')`,
      ),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO staff (name, role, department) VALUES ('o', 'o', 'golf')`),
    ).rejects.toThrow()
    await expect(db().execute(sql`INSERT INTO courses (name) VALUES ('orphan')`)).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO news (title, slug, category) VALUES ('o', 'o', 'club')`),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO events (title, starts_at) VALUES ('o', now())`),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`INSERT INTO course_status (state) VALUES ('open')`),
    ).rejects.toThrow()
  })

  it('refuses to delete a club that still has content', async () => {
    const lonely = await p().create({ collection: 'tenants', data: { name: 'Content only' } })
    await p().create({
      collection: 'pages',
      data: { title: 'x', slug: 'x', tenant: lonely.id },
    })
    await expect(db().execute(sql`DELETE FROM tenants WHERE id = ${lonely.id}`)).rejects.toThrow()
  })
})
