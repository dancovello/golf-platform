import type { Payload } from 'payload'

import { layoutRefs } from '@/blocks'
import { idOf } from '@/blocks/types'
import { STATUS_STALE_HOURS, type StatusState } from '@/collections/courseStatusStates'
import { TEE_COLOURS, type TeeColour, yardsField } from '@/collections/courseTees'
import { builtInLink, isSafeURL } from '@/fields/link'

import type { SiteLink } from '../loadClub'
import { siteToday } from '../today'
import { loadClubMedia, type SiteMedia } from './media'

export type ResolvedLink = { label: string; link: SiteLink }

export type SiteDocument = {
  id: string
  title: string
  category: string
  url: string
  /** e.g. "PDF" or "DOCX" */
  type: string
  /** e.g. "240 KB" */
  size: string
  lastReviewed: string | null
}

const TYPE_NAMES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}
const formatSize = (bytes: number | null | undefined) =>
  !bytes
    ? ''
    : bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

/** An email address in two halves, so it is never whole in the page (ProtectedEmail). */
export type EmailParts = { user: string; domain: string }

const emailParts = (email: string | null | undefined): EmailParts | null => {
  const at = email?.trim().lastIndexOf('@') ?? -1
  return email && at > 0
    ? { user: email.trim().slice(0, at), domain: email.trim().slice(at + 1) }
    : null
}

/** A team member (Team & staff), as the website shows them. */
export type SitePerson = {
  id: string
  name: string
  role: string
  department: string
  qualification: string | null
  photo: SiteMedia | null
  bio: string | null
  email: EmailParts | null
  phone: string | null
}

/** Team members by ID, only if they belong to this club, with their (same-club) photos. */
const loadClubStaff = async (
  payload: Payload,
  tenantID: string,
  ids: string[],
): Promise<Map<string, SitePerson>> => {
  if (ids.length === 0) return new Map()
  const { docs } = await payload.find({
    collection: 'staff',
    where: { and: [{ id: { in: ids } }, { tenant: { equals: tenantID } }] },
    limit: ids.length,
    depth: 0,
    overrideAccess: true,
  })
  const photos = await loadClubMedia(
    payload,
    tenantID,
    docs.map((d) => idOf(d.photo)).filter((id): id is string => Boolean(id)),
  )
  return new Map(
    docs.map((d) => {
      const photo = photos.get(idOf(d.photo) ?? '') ?? null
      return [
        String(d.id),
        {
          id: String(d.id),
          name: d.name,
          role: d.role,
          department: d.department,
          qualification: d.qualification?.trim() || null,
          photo: photo?.mimeType.startsWith('image/') ? photo : null,
          bio: d.bio?.trim() || null,
          email: emailParts(d.email),
          phone: d.phone?.trim() || null,
        },
      ]
    }),
  )
}

export type SiteTee = {
  colour: TeeColour
  /** "White", "Yellow"… */
  name: string
  rating: number | null
  slope: number | null
}

export type SiteHole = {
  number: number
  name: string | null
  par: number
  strokeIndex: number | null
  /** Yards from each of the course's tees, in the same order as `tees` (null if not set). */
  yards: (number | null)[]
  image: SiteMedia | null
  tip: string | null
}

export type SiteCourse = { id: string; name: string; tees: SiteTee[]; holes: SiteHole[] }

/** Courses by ID, only if they belong to this club, with their (same-club) hole photos. */
const loadClubCourses = async (
  payload: Payload,
  tenantID: string,
  ids: string[],
): Promise<Map<string, SiteCourse>> => {
  if (ids.length === 0) return new Map()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { and: [{ id: { in: ids } }, { tenant: { equals: tenantID } }] },
    limit: ids.length,
    depth: 0,
    overrideAccess: true,
  })
  const photos = await loadClubMedia(
    payload,
    tenantID,
    docs
      .flatMap((d) => (d.holes ?? []).map((h) => idOf(h.image)))
      .filter((id): id is string => Boolean(id)),
  )
  return new Map(
    docs.map((d) => {
      const tees: SiteTee[] = (d.tees ?? []).map((t) => ({
        colour: t.colour,
        name: TEE_COLOURS.find((c) => c.value === t.colour)?.label ?? t.colour,
        rating: t.rating ?? null,
        slope: t.slope ?? null,
      }))
      const holes: SiteHole[] = (d.holes ?? []).map((h, i) => {
        const image = photos.get(idOf(h.image) ?? '') ?? null
        return {
          number: i + 1,
          name: h.name?.trim() || null,
          par: h.par,
          strokeIndex: h.strokeIndex ?? null,
          yards: tees.map((t) => h[yardsField(t.colour)] ?? null),
          image: image?.mimeType.startsWith('image/') ? image : null,
          tip: h.tip?.trim() || null,
        }
      })
      return [String(d.id), { id: String(d.id), name: d.name, tees, holes }]
    }),
  )
}

export type SiteCourseStatus = {
  state: StatusState
  reason: string | null
  facilities: { label: string; state: StatusState; value: string | null }[]
  changedBy: string | null
  updatedAt: string
  /** Not changed for 24 hours: the site says so instead of showing an old status. */
  stale: boolean
}

/** The club's course status, if a block on the page shows it. */
const loadClubCourseStatus = async (
  payload: Payload,
  tenantID: string,
): Promise<SiteCourseStatus | null> => {
  const { docs } = await payload.find({
    collection: 'course-status',
    where: { tenant: { equals: tenantID } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const d = docs[0]
  if (!d) return null
  const age = siteToday().getTime() - new Date(d.updatedAt).getTime()
  return {
    state: d.state,
    reason: d.reason?.trim() || null,
    facilities: (d.facilities ?? []).map((f) => ({
      label: f.label,
      state: f.state,
      value: f.value?.trim() || null,
    })),
    changedBy: d.changedBy?.trim() || null,
    updatedAt: d.updatedAt,
    stale: age > STATUS_STALE_HOURS * 60 * 60 * 1000,
  }
}

/** What a block's website component gets: its own data, with pages and photos looked up. */
export type BlockContext = {
  media: (value: unknown) => SiteMedia | null
  /** `fallbackLabel` for links whose text is fixed by the design (e.g. a whole card). */
  link: (value: unknown, fallbackLabel?: string) => ResolvedLink | null
  /** One of the club's documents, or null. */
  document: (value: unknown) => SiteDocument | null
  /** One of the club's team members, or null. */
  person: (value: unknown) => SitePerson | null
  /** One of the club's courses, or null. */
  course: (value: unknown) => SiteCourse | null
  /** The club's course status (only loaded when a block shows it). */
  courseStatus: SiteCourseStatus | null
}

/**
 * Prepares a page's blocks for the website. Every page and photo the blocks point at is
 * looked up within the club; anything else (another club's, deleted) is treated as missing.
 */
export const loadBlockContext = async (
  payload: Payload,
  tenantID: string,
  layout: unknown,
): Promise<BlockContext> => {
  const refs = layoutRefs(layout)
  const pageIDs = [...new Set(refs.filter((r) => r.collection === 'pages').map((r) => r.id))]
  const documentIDs = [
    ...new Set(refs.filter((r) => r.collection === 'documents').map((r) => r.id)),
  ]
  const staffIDs = [...new Set(refs.filter((r) => r.collection === 'staff').map((r) => r.id))]
  const courseIDs = [...new Set(refs.filter((r) => r.collection === 'courses').map((r) => r.id))]
  const showsStatus = (Array.isArray(layout) ? layout : []).some(
    (b) => b?.blockType === 'courseStatus',
  )
  const [media, pages, documents, staff, courses, courseStatus] = await Promise.all([
    loadClubMedia(
      payload,
      tenantID,
      refs.filter((r) => r.collection === 'media').map((r) => r.id),
    ),
    pageIDs.length === 0
      ? Promise.resolve(new Map<string, string>())
      : payload
          .find({
            collection: 'pages',
            where: { and: [{ id: { in: pageIDs } }, { tenant: { equals: tenantID } }] },
            select: { slug: true },
            limit: pageIDs.length,
            depth: 0,
            overrideAccess: true,
          })
          .then(({ docs }) => new Map(docs.map((d) => [String(d.id), String(d.slug)]))),
    documentIDs.length === 0
      ? Promise.resolve(new Map<string, SiteDocument>())
      : payload
          .find({
            // No `select`: a file's address is worked out from its folder and stored name.
            collection: 'documents',
            where: { and: [{ id: { in: documentIDs } }, { tenant: { equals: tenantID } }] },
            limit: documentIDs.length,
            depth: 0,
            overrideAccess: true,
          })
          .then(
            ({ docs }) =>
              new Map(
                docs
                  .filter((d) => typeof d.url === 'string' && TYPE_NAMES[d.mimeType ?? ''])
                  .map((d) => [
                    String(d.id),
                    {
                      id: String(d.id),
                      title: String(d.title),
                      category: String(d.category ?? 'other'),
                      url: String(d.url),
                      type: TYPE_NAMES[d.mimeType ?? ''],
                      size: formatSize(d.filesize),
                      lastReviewed: d.lastReviewed ? String(d.lastReviewed) : null,
                    },
                  ]),
              ),
          ),
    loadClubStaff(payload, tenantID, staffIDs),
    loadClubCourses(payload, tenantID, courseIDs),
    showsStatus ? loadClubCourseStatus(payload, tenantID) : Promise.resolve(null),
  ])

  return {
    media: (value) => media.get(idOf(value) ?? '') ?? null,
    document: (value) => documents.get(idOf(value) ?? '') ?? null,
    person: (value) => staff.get(idOf(value) ?? '') ?? null,
    course: (value) => courses.get(idOf(value) ?? '') ?? null,
    courseStatus,
    link: (value, fallbackLabel) => {
      const raw = (value ?? {}) as {
        label?: string | null
        type?: string
        page?: unknown
        url?: string
        builtIn?: unknown
      }
      const label = raw.label?.trim() || fallbackLabel
      if (!label) return null
      if (raw.type === 'url') {
        return isSafeURL(raw.url) ? { label, link: { kind: 'url', href: raw.url.trim() } } : null
      }
      if (raw.type === 'builtIn') {
        const builtIn = builtInLink(raw.builtIn)
        return builtIn ? { label, link: builtIn } : null
      }
      const slug = pages.get(idOf(raw.page) ?? '')
      return slug ? { label, link: { kind: 'page', slug } } : null
    },
  }
}
