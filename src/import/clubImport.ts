import { readFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import type { Payload } from 'payload'

import { rt } from '../demo/richText'

/**
 * Builds a club from a content file written for it (docs/operations/club-import.md).
 *
 * The content file is plain data. It points at photos, documents, people, courses and pages
 * with short references, which this fills in once each one exists:
 *   "@media:key"  "@doc:key"  "@staff:key"  "@course:key"  "@page:slug"
 * Rich text is written as { $rt: [...] } (see RichLine) and turned into the editor's format.
 *
 * Only the club with the content file's slug is touched: building replaces it. Refuses if
 * that club has accounts or an accepted agreement, so a live club is never rebuilt.
 */

type ID = string | number

export type RichPart = string | { bold: string } | { link: string; url?: string; page?: string }
export type RichLine =
  | ['h2' | 'h3' | 'quote', string]
  | ['p', ...RichPart[]]
  | ['ul', ...string[]]
  | ['img', string, string?]

export type ClubContent = {
  name: string
  slug: string
  /** Files: paths are relative to the content file's folder. */
  media: Record<string, { file: string; alt: string }>
  documents?: Record<string, { file: string; title: string; category: string }>
  staff?: Record<string, Record<string, unknown>>
  courses?: Record<string, Record<string, unknown>>
  /** In menu order. A page with a parent appears in its parent's drop-down. */
  pages: { slug: string; title: string; parent?: string; layout: unknown[] }[]
  settings: Record<string, unknown>
  courseStatus?: Record<string, unknown>
  news?: Record<string, unknown>[]
  events?: Record<string, unknown>[]
}

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

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const richPart = (part: RichPart, ids: Refs) => {
  if (typeof part === 'string') return part
  if ('bold' in part) return rt.bold(part.bold)
  if (part.page) return rt.pageLink(part.link, String(ids.get(part.page)))
  return rt.urlLink(part.link, part.url ?? '')
}

const richText = (lines: RichLine[], ids: Refs) =>
  rt.doc(
    ...(lines.map((line) => {
      const [kind, ...rest] = line
      if (kind === 'h2') return rt.h2(rest[0] as string)
      if (kind === 'h3') return rt.h3(rest[0] as string)
      if (kind === 'quote') return rt.quote(rest[0] as string)
      if (kind === 'ul') return rt.ul(...(rest as string[]))
      if (kind === 'img') return rt.image(String(ids.get(rest[0] as string)), rest[1] as string)
      return rt.p(...(rest as RichPart[]).map((p) => richPart(p, ids)))
    }) as never[]),
  )

class Refs {
  private map = new Map<string, ID>()
  set(ref: string, id: ID) {
    this.map.set(ref, id)
  }
  get(ref: string): ID {
    const id = this.map.get(ref)
    if (id === undefined) throw new Error(`Unknown reference ${ref}`)
    return id
  }
  /** Replaces every reference and rich-text value inside a piece of content. */
  fill(value: unknown): unknown {
    if (typeof value === 'string') return value.startsWith('@') ? this.get(value) : value
    if (Array.isArray(value)) return value.map((v) => this.fill(v))
    if (value && typeof value === 'object') {
      if ('$rt' in value) return richText((value as { $rt: RichLine[] }).$rt, this)
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.fill(v)]))
    }
    return value
  }
}

/** Removes the club with this slug and everything in it. False if there was none. */
export const removeImportedClub = async (payload: Payload, slug: string) => {
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const club = docs[0]
  if (!club) return false
  const own = { tenant: { equals: club.id } }
  for (const collection of ['users', 'agreement-acceptances'] as const) {
    const { totalDocs } = await payload.count({ collection, where: own, overrideAccess: true })
    if (totalDocs > 0) {
      throw new Error(
        `${slug} has editor accounts or an accepted agreement, so it can't be rebuilt by import.`,
      )
    }
  }
  for (const collection of CLUB_OWNED) {
    await payload.delete({ collection, where: own, overrideAccess: true })
  }
  await payload.delete({ collection: 'tenants', id: club.id, overrideAccess: true })
  return true
}

export const importClub = async (
  payload: Payload,
  content: ClubContent,
  folder: string,
  log: (message: string) => void = () => {},
) => {
  await removeImportedClub(payload, content.slug)
  const club = await payload.create({
    collection: 'tenants',
    data: { name: content.name, slug: content.slug },
    overrideAccess: true,
  })
  const tenant = club.id
  const ids = new Refs()
  const create = async (collection: string, data: unknown, file?: string): Promise<{ id: ID }> => {
    const upload = file
      ? await readFile(resolve(folder, file)).then((data) => ({
          data,
          mimetype: MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
          name: basename(file),
          size: data.length,
        }))
      : undefined
    try {
      return (await payload.create({
        collection: collection as never,
        data: { ...(ids.fill(data) as object), tenant } as never,
        ...(upload ? { file: upload as never } : {}),
        overrideAccess: true,
      })) as { id: ID }
    } catch (error) {
      const detail = (error as { data?: { errors?: unknown } }).data?.errors
      throw new Error(
        `Could not create ${collection} (${file ?? JSON.stringify(data).slice(0, 80)}): ${
          (error as Error).message
        } ${detail ? JSON.stringify(detail) : ''}`,
      )
    }
  }

  for (const [key, { file, alt }] of Object.entries(content.media)) {
    ids.set(`@media:${key}`, (await create('media', { alt }, file)).id)
  }
  log(`${Object.keys(content.media).length} photos and videos`)
  for (const [key, { file, ...data }] of Object.entries(content.documents ?? {})) {
    ids.set(`@doc:${key}`, (await create('documents', data, file)).id)
  }
  for (const [key, data] of Object.entries(content.staff ?? {})) {
    ids.set(`@staff:${key}`, (await create('staff', data)).id)
  }
  for (const [key, data] of Object.entries(content.courses ?? {})) {
    ids.set(`@course:${key}`, (await create('courses', data)).id)
  }

  // Pages first (empty), so menus, links and other pages can point at them.
  for (const page of content.pages) {
    const doc = await create('pages', {
      title: page.title,
      slug: page.slug,
      layout: [],
      _status: 'published',
    })
    ids.set(`@page:${page.slug}`, doc.id)
  }
  const position: Record<string, number> = {}
  for (const page of content.pages) {
    const data: Record<string, unknown> = {}
    if (page.parent) {
      position[page.parent] = (position[page.parent] ?? 0) + 1
      data.parent = ids.get(`@page:${page.parent}`)
      data.menuPosition = position[page.parent]
    }
    try {
      await payload.update({
        collection: 'pages',
        id: ids.get(`@page:${page.slug}`),
        data: { ...data, layout: ids.fill(page.layout) } as never,
        overrideAccess: true,
      })
    } catch (error) {
      const detail = (error as { data?: { errors?: unknown } }).data?.errors
      throw new Error(
        `Page "${page.slug}": ${(error as Error).message} ${detail ? JSON.stringify(detail) : ''}`,
      )
    }
  }
  log(`${content.pages.length} pages`)

  // The club's settings and course status are created with the club; fill them in.
  const one = async (collection: 'club-settings' | 'course-status', data?: unknown) => {
    if (!data) return
    const { docs } = await payload.find({
      collection,
      where: { tenant: { equals: tenant } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    try {
      await payload.update({
        collection,
        id: docs[0].id,
        data: ids.fill(data) as never,
        overrideAccess: true,
      })
    } catch (error) {
      const detail = (error as { data?: { errors?: unknown } }).data?.errors
      throw new Error(`${collection}: ${(error as Error).message} ${JSON.stringify(detail ?? '')}`)
    }
  }
  await one('club-settings', content.settings)
  await one('course-status', content.courseStatus)

  for (const story of content.news ?? []) await create('news', story)
  for (const event of content.events ?? []) await create('events', event)
  log(`${content.news?.length ?? 0} news stories, ${content.events?.length ?? 0} events`)

  return { slug: content.slug, pages: content.pages.length }
}
