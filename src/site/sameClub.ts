import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import { layoutRefs } from '../blocks'
import { richTextRefs } from '../blocks/richText/lexical'
import { type BlockRef as Ref, idOf } from '../blocks/types'

/** Every page and photo a club's settings point at, with where it was found. */
const settingsRefs = (data: Record<string, unknown>): Ref[] => {
  const refs: Ref[] = []
  const branding = (data.branding ?? {}) as Record<string, unknown>
  for (const key of ['logoOnLight', 'logoOnDark']) {
    const id = idOf(branding[key])
    if (id) refs.push({ collection: 'media', id, path: `branding.${key}` })
  }
  const header = (data.header ?? {}) as {
    booking?: { page?: unknown }
    menu?: { link?: { page?: unknown }; groups?: { links?: { link?: { page?: unknown } }[] }[] }[]
  }
  const page = (value: unknown, path: string) => {
    const id = idOf(value)
    if (id) refs.push({ collection: 'pages', id, path })
  }
  page(header.booking?.page, 'header.booking.page')
  header.menu?.forEach((item, i) => {
    page(item.link?.page, `header.menu.${i}.link.page`)
    item.groups?.forEach((group, g) =>
      group.links?.forEach((l, k) =>
        page(l.link?.page, `header.menu.${i}.groups.${g}.links.${k}.link.page`),
      ),
    )
  })
  const footer = (data.footer ?? {}) as {
    linkColumns?: { links?: { link?: { page?: unknown } }[] }[]
    hoursLink?: { page?: unknown }
    secondaryButton?: { page?: unknown }
    legalLinks?: { link?: { page?: unknown } }[]
  }
  footer.linkColumns?.forEach((col, c) =>
    col.links?.forEach((l, k) =>
      page(l.link?.page, `footer.linkColumns.${c}.links.${k}.link.page`),
    ),
  )
  page(footer.hoursLink?.page, 'footer.hoursLink.page')
  page(footer.secondaryButton?.page, 'footer.secondaryButton.page')
  footer.legalLinks?.forEach((l, k) => page(l.link?.page, `footer.legalLinks.${k}.link.page`))
  const announcement = (data.announcement ?? {}) as { items?: { link?: { page?: unknown } }[] }
  announcement.items?.forEach((item, k) =>
    page(item.link?.page, `announcement.items.${k}.link.page`),
  )
  return refs
}

/**
 * Refuses a record that points at another club's pages or photos. Editors' pickers are
 * already limited to their own club, but the API accepts any ID, and the public site must
 * never show another club's content. The message doesn't say whether the item exists.
 */
const sameClubCheck =
  (collect: (data: Record<string, unknown>) => Ref[]): CollectionBeforeValidateHook =>
  async ({ collection, data, originalDoc, req }) => {
    const merged = { ...originalDoc, ...data } as Record<string, unknown>
    const tenant = idOf(merged.tenant)
    const refs = collect(merged)
    if (!tenant || refs.length === 0) return data

    const errors: { path: string; message: string }[] = []
    for (const name of ['pages', 'media', 'documents', 'staff', 'courses'] as const) {
      const wanted = [...new Set(refs.filter((r) => r.collection === name).map((r) => r.id))]
      if (wanted.length === 0) continue
      const { docs } = await req.payload.find({
        collection: name,
        where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenant } }] },
        select: {},
        limit: wanted.length,
        depth: 0,
        overrideAccess: true,
        req,
      })
      const found = new Set(docs.map((d) => String(d.id)))
      for (const ref of refs.filter((r) => r.collection === name && !found.has(r.id))) {
        errors.push({
          path: ref.path,
          message:
            name === 'pages'
              ? 'Choose one of your own pages.'
              : name === 'media'
                ? 'Choose one of your own photos.'
                : name === 'documents'
                  ? 'Choose one of your own documents.'
                  : name === 'staff'
                    ? 'Choose people from your own team.'
                    : 'Choose one of your own courses.',
        })
      }
    }
    if (errors.length > 0) throw new ValidationError({ collection: collection.slug, errors })
    return data
  }

/** Club Settings: logos, header and footer links. */
export const checkSameClub = sameClubCheck(settingsRefs)

/** Pages: everything the page's blocks point at. */
export const checkPageSameClub = sameClubCheck((data) => layoutRefs(data.layout))

/** Team members: their photo. */
export const checkStaffSameClub = sameClubCheck((data) => {
  const id = idOf(data.photo)
  return id ? [{ collection: 'media', id, path: 'photo' }] : []
})

/** Courses: each hole's photo. */
export const checkCourseSameClub = sameClubCheck((data) =>
  (Array.isArray(data.holes) ? (data.holes as Record<string, unknown>[]) : []).flatMap(
    (hole, i) => {
      const id = idOf(hole.image)
      return id ? [{ collection: 'media' as const, id, path: `holes.${i}.image` }] : []
    },
  ),
)

/** News: the main photo, and the photos and pages in the article. */
export const checkNewsSameClub = sameClubCheck((data) => {
  const id = idOf(data.image)
  return [
    ...(id ? [{ collection: 'media' as const, id, path: 'image' }] : []),
    ...richTextRefs(data.body, 'body'),
  ]
})
