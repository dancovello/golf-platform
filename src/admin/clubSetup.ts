import type { Payload } from 'payload'

import { clubHasAccepted } from '../agreement/acceptance'
import { STATUS_STALE_HOURS, STATUS_STATES } from '../collections/courseStatusStates'
import { BRAND_INPUTS, DEFAULT_BRAND } from '../theme/colour'

/**
 * What the club home screen shows (src/admin/ClubHome.tsx, plan part E): a setup checklist
 * built from the club's real data, its newest enquiries and its course status. Every query
 * names the club, so one club's screen can only ever show that club.
 */

export type SetupStep = { key: string; label: string; done: boolean; href: string }

export type ClubHomeData = {
  clubName: string
  steps: SetupStep[]
  doneCount: number
  enquiries: { id: string; name: string; reference: string; createdAt: string }[]
  newEnquiries: number
  courseStatus: { label: string; updatedAt: string | null; stale: boolean } | null
  homePageID: string | null
}

type Settings = {
  id: string
  clubName?: string | null
  branding?: Record<string, unknown> | null
  header?: { menu?: unknown[] | null } | null
  footer?: { email?: string | null; address?: string | null } | null
}

const filled = (v: unknown) => typeof v === 'string' && v.trim() !== ''

export const clubHomeData = async (
  payload: Payload,
  tenantID: string,
  now = new Date(),
): Promise<ClubHomeData | null> => {
  const byClub = { tenant: { equals: tenantID } }
  const [club, settingsResult, home, accepted, enquiries, newCount, status] = await Promise.all([
    payload
      .findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true })
      .catch(() => null),
    payload.find({
      collection: 'club-settings',
      where: byClub,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'pages',
      where: { and: [byClub, { slug: { equals: 'home' } }] },
      select: { _status: true },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    clubHasAccepted(payload, tenantID),
    payload.find({
      collection: 'enquiries',
      where: { and: [byClub, { status: { equals: 'new' } }] },
      select: { name: true, reference: true, createdAt: true },
      sort: '-createdAt',
      limit: 5,
      depth: 0,
      overrideAccess: true,
    }),
    payload.count({
      collection: 'enquiries',
      where: { and: [byClub, { status: { equals: 'new' } }] },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'course-status',
      where: byClub,
      select: { state: true, updatedAt: true },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  if (!club) return null

  const settings = settingsResult.docs[0] as Settings | undefined
  const branding = settings?.branding ?? {}
  const settingsHref = settings
    ? `/admin/collections/club-settings/${settings.id}`
    : '/admin/collections/club-settings'
  const homeDoc = home.docs[0] as { id: string; _status?: string } | undefined

  const steps: SetupStep[] = [
    {
      key: 'logo',
      label: 'Add your logo',
      done: Boolean(branding.logoOnLight || branding.logoOnDark),
      href: settingsHref,
    },
    {
      key: 'colours',
      label: 'Choose your colours',
      done: BRAND_INPUTS.some(
        (k) =>
          typeof branding[k] === 'string' &&
          (branding[k] as string).toLowerCase() !== DEFAULT_BRAND[k].toLowerCase(),
      ),
      href: settingsHref,
    },
    {
      key: 'contact',
      label: 'Add your email address and postal address (footer)',
      done: filled(settings?.footer?.email) && filled(settings?.footer?.address),
      href: settingsHref,
    },
    {
      key: 'menu',
      label: 'Set up your menu',
      done: (settings?.header?.menu?.length ?? 0) > 0,
      href: settingsHref,
    },
    {
      key: 'home',
      label: 'Publish your home page',
      done: homeDoc?._status === 'published',
      href: homeDoc ? `/admin/collections/pages/${homeDoc.id}` : '/admin/collections/pages/create',
    },
    {
      key: 'agreement',
      label: 'Accept the data processing agreement',
      done: accepted,
      href: '/admin/collections/agreement-acceptances/create',
    },
  ]

  const statusDoc = status.docs[0] as { state?: string; updatedAt?: string } | undefined
  const updatedAt = statusDoc?.updatedAt ?? null
  return {
    clubName: (filled(settings?.clubName) ? settings?.clubName : club.name) as string,
    steps,
    doneCount: steps.filter((s) => s.done).length,
    enquiries: enquiries.docs.map((e) => ({
      id: String(e.id),
      name: String(e.name ?? ''),
      reference: String(e.reference ?? ''),
      createdAt: String(e.createdAt),
    })),
    newEnquiries: newCount.totalDocs,
    courseStatus: statusDoc
      ? {
          label: STATUS_STATES.find((s) => s.value === statusDoc.state)?.label ?? 'Open',
          updatedAt,
          stale:
            !updatedAt ||
            now.getTime() - new Date(updatedAt).getTime() > STATUS_STALE_HOURS * 60 * 60 * 1000,
        }
      : null,
    homePageID: homeDoc?.id ?? null,
  }
}

/** Every club's setup progress, for the super-admin's list. */
export const allClubsProgress = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'tenants',
    select: { name: true },
    sort: 'name',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return Promise.all(
    docs.map(async (club) => {
      const data = await clubHomeData(payload, String(club.id))
      return {
        id: String(club.id),
        name: String(club.name),
        done: data?.doneCount ?? 0,
        total: data?.steps.length ?? 0,
      }
    }),
  )
}
