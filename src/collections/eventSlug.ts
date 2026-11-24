import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import { idOf } from '../blocks/types'
import { slugify } from '../fields/slug'

/** The year an event is in, UK time: "2027". */
const ukYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Europe/London' })

/**
 * The web address an event gets from its title and year: "Spring Open" on 12 Apr 2027 →
 * "spring-open-2027". Clubs run the same competition every year, so the year keeps each one's
 * page apart. A title that already has the year in it doesn't get it twice. At most 80 long.
 */
export const eventSlugFrom = (title: string, startsAt: string | null | undefined) => {
  const words = slugify(title)
  const year = startsAt ? ukYear(startsAt) : null
  const withYear =
    year && !words.split('-').includes(year) ? [words, year].filter(Boolean).join('-') : words
  return withYear.slice(0, 80).replace(/-+$/, '') || 'event'
}

/**
 * Event pages (24 Nov 2026): every event has a web address, /events/<address>, unique within
 * its club. A new event gets one from its title and year; if another of the club's events
 * already has it, "-2", "-3" … is added. A typed address that another event already uses is
 * refused with a plain message rather than a database error.
 */
export const eventSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const typed = typeof data.slug === 'string' ? data.slug.trim() : null
  const current = typed ?? originalDoc?.slug ?? null
  const title = data.title ?? originalDoc?.title
  const tenant = idOf(data.tenant ?? originalDoc?.tenant)
  const self = originalDoc?.id ?? null

  if (current) {
    if (!tenant) return data
    const { docs } = await req.payload.find({
      collection: 'events',
      where: {
        and: [
          { tenant: { equals: tenant } },
          { slug: { equals: current } },
          ...(self ? [{ id: { not_equals: self } }] : []),
        ],
      },
      select: {},
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (docs.length > 0) {
      throw new ValidationError({
        collection: 'events',
        errors: [
          { path: 'slug', message: 'Another of your events already uses this web address.' },
        ],
      })
    }
    return data
  }

  if (typeof title !== 'string' || !title.trim()) return data
  const base = eventSlugFrom(title, data.startsAt ?? originalDoc?.startsAt)
  if (!tenant) {
    data.slug = base
    return data
  }
  const { docs } = await req.payload.find({
    collection: 'events',
    where: {
      and: [
        { tenant: { equals: tenant } },
        { slug: { like: base } },
        ...(self ? [{ id: { not_equals: self } }] : []),
      ],
    },
    select: { slug: true },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const taken = new Set(docs.map((d) => d.slug))
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base.slice(0, 76)}-${n}`
  data.slug = slug
  return data
}
