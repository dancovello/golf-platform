/**
 * Randomised tenant-isolation test (job 9, 21 Oct grilling). Random reads and writes, as each
 * role, across every club-owned collection, checked after every single step:
 *
 * - whatever an editor reads belongs to their own club;
 * - the other club's records are exactly as they were before the step (nothing changed, added
 *   or removed), whatever the editor tried;
 * - an anonymous visitor reads nothing and changes nothing.
 *
 * 500 steps on every change (ISOLATION_ITERATIONS), 10,000 nightly
 * (.github/workflows/isolation-nightly.yml). Every run prints its seed; a failure prints the
 * seed and the steps that led to it. Replay with ISOLATION_SEED=<seed>.
 */
import type { Payload, Where } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { clubOwnedCollections, type ClubOwnedSlug } from '@/tenancy'

import { type LoggedInUser, seedWorld, type World } from './helpers/seed'

const ITERATIONS = Number(process.env.ISOLATION_ITERATIONS ?? 500)
const SEED = Number(process.env.ISOLATION_SEED ?? Math.floor(Math.random() * 2 ** 31))

/** mulberry32: small, seedable, good enough to pick steps. */
const random = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SLUGS = Object.keys(clubOwnedCollections) as ClubOwnedSlug[]
const MADE_UP = '00000000-0000-4000-8000-000000000000'

/** New records the fuzzer can create, per collection it creates in (uploads are read-only here). */
const NEW: Partial<Record<ClubOwnedSlug, (tenant: string, n: number) => Record<string, unknown>>> =
  {
    pages: (tenant, n) => ({ title: `Fuzz ${n}`, slug: `fuzz-${n}`, tenant }),
    news: (tenant, n) => ({
      title: `Fuzz ${n}`,
      category: 'club',
      publishedAt: new Date().toISOString(),
      tenant,
    }),
    events: (tenant, n) => ({
      title: `Fuzz ${n}`,
      category: 'social',
      booking: 'book',
      startsAt: new Date().toISOString(),
      tenant,
    }),
    staff: (tenant, n) => ({ name: `Fuzz ${n}`, role: 'Fuzz', department: 'golf', tenant }),
    courses: (tenant, n) => ({
      name: `Fuzz ${n}`,
      tenant,
      tees: [{ colour: 'white' }],
      holes: Array.from({ length: 9 }, () => ({ par: 4 })),
    }),
  }

/** A harmless change per collection (a text field every record has). */
const CHANGE: Record<ClubOwnedSlug, (n: number) => Record<string, unknown>> = {
  pages: (n) => ({ title: `Changed ${n}` }),
  news: (n) => ({ title: `Changed ${n}` }),
  events: (n) => ({ title: `Changed ${n}` }),
  staff: (n) => ({ name: `Changed ${n}` }),
  courses: (n) => ({ name: `Changed ${n}` }),
  media: (n) => ({ alt: `Changed ${n}` }),
  documents: (n) => ({ title: `Changed ${n}` }),
  enquiries: () => ({ status: 'handled' }),
  'agreement-acceptances': (n) => ({ fullName: `Changed ${n}` }),
  'club-settings': (n) => ({ clubName: `Changed ${n}` }),
  'course-status': (n) => ({ reason: `Changed ${n}` }),
}

type Role = 'editorA' | 'editorB' | 'anonymous' | 'superAdmin'
type Step = { role: Role; op: string; collection: ClubOwnedSlug; detail: string }

let w: World
const p = (): Payload => w.payload

/** Everything one club has in a collection, as the database holds it (id → last change). */
const snapshot = async (collection: ClubOwnedSlug, tenant: string) => {
  const { docs } = (await p().find({
    collection,
    where: { tenant: { equals: tenant } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { updatedAt: true } as never,
  })) as unknown as { docs: { id: string; updatedAt: string }[] }
  return Object.fromEntries(docs.map((d) => [String(d.id), String(d.updatedAt)]))
}

const tenantOf = (doc: unknown) => {
  const t = (doc as { tenant?: unknown }).tenant
  return typeof t === 'object' && t ? String((t as { id: unknown }).id) : String(t)
}

beforeAll(async () => {
  w = await seedWorld()
})

describe(`randomised isolation (${ITERATIONS} steps, seed ${SEED})`, () => {
  // About 10 ms a step, so the time limit grows with the number of steps.
  it(
    'no step lets one club read or change another club’s records',
    { timeout: 60_000 + ITERATIONS * 50 },
    async () => {
      console.info(
        `Isolation fuzz: seed ${SEED}, ${ITERATIONS} steps (replay: ISOLATION_SEED=${SEED})`,
      )
      const next = random(SEED)
      const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!
      const users: Record<Role, LoggedInUser | null> = {
        editorA: w.editorA,
        editorB: w.editorB,
        anonymous: null,
        superAdmin: w.superAdmin,
      }
      const clubOf: Record<Role, string | null> = {
        editorA: w.clubA.id,
        editorB: w.clubB.id,
        anonymous: null,
        superAdmin: null,
      }
      const steps: Step[] = []
      const fail = (message: string) => {
        const recent = steps
          .slice(-15)
          .map(
            (s, i) =>
              `  ${steps.length - 15 + i + 1}. ${s.role} ${s.op} ${s.collection} ${s.detail}`,
          )
        throw new Error(
          `${message}\nSeed ${SEED}, step ${steps.length}. Replay: ISOLATION_SEED=${SEED}\n${recent.join('\n')}`,
        )
      }

      for (let n = 1; n <= ITERATIONS; n++) {
        const role = pick(['editorA', 'editorB', 'anonymous', 'superAdmin'] as const)
        const collection = pick(SLUGS)
        const user = users[role]
        const access = { overrideAccess: false as const, user }
        const own = clubOf[role]
        const clubs = [w.clubA.id, w.clubB.id]
        // Any record of either club (or a made-up one) can be the target.
        const all = {
          ...(await snapshot(collection, w.clubA.id)),
          ...(await snapshot(collection, w.clubB.id)),
        }
        const targetID =
          next() < 0.1 ? MADE_UP : pick(Object.keys(all).length ? Object.keys(all) : [MADE_UP])
        const otherClubs = role === 'superAdmin' ? [] : clubs.filter((c) => c !== own)
        const before = await Promise.all(otherClubs.map((c) => snapshot(collection, c)))

        const op = pick([
          'find',
          'findByID',
          'count',
          'update',
          'updateMany',
          'delete',
          'create',
        ] as const)
        let detail = ''
        let seen: unknown[] = []
        try {
          switch (op) {
            case 'find': {
              const where = pick<Where | undefined>([
                undefined,
                { tenant: { equals: pick(clubs) } },
                { id: { equals: targetID } },
                { id: { in: Object.keys(all) } },
              ])
              detail = JSON.stringify(where ?? {})
              seen = (await p().find({ collection, where, limit: 100, depth: 1, ...access })).docs
              break
            }
            case 'findByID':
              detail = targetID
              seen = [await p().findByID({ collection, id: targetID, depth: 1, ...access })]
              break
            case 'count': {
              const tenant = pick(clubs)
              detail = `tenant ${tenant === w.clubA.id ? 'A' : 'B'}`
              const { totalDocs } = await p().count({
                collection,
                where: { tenant: { equals: tenant } },
                ...access,
              })
              if (own && tenant !== own && totalDocs > 0)
                fail(`${role} counted ${totalDocs} of another club's ${collection}`)
              if (role === 'anonymous' && totalDocs > 0)
                fail(`anonymous counted ${totalDocs} ${collection}`)
              break
            }
            case 'update':
              detail = targetID
              seen = [
                await p().update({
                  collection,
                  id: targetID,
                  data: CHANGE[collection](n) as never,
                  ...access,
                }),
              ]
              break
            case 'updateMany':
              detail = 'all records'
              seen = (
                await p().update({
                  collection,
                  where: { id: { exists: true } },
                  data: CHANGE[collection](n) as never,
                  ...access,
                })
              ).docs
              break
            case 'delete':
              // Only records this test created, so the seeded world stays usable.
              detail = targetID
              if (
                !String(
                  (
                    (await p()
                      .findByID({ collection, id: targetID, overrideAccess: true })
                      .catch(() => ({}))) as { title?: string; name?: string }
                  ).title ?? '',
                ).startsWith('Fuzz')
              )
                break
              await p().delete({ collection, id: targetID, ...access })
              break
            case 'create': {
              const make = NEW[collection]
              if (!make) break
              const tenant = pick(clubs)
              detail = `in club ${tenant === w.clubA.id ? 'A' : 'B'}`
              seen = [await p().create({ collection, data: make(tenant, n) as never, ...access })]
              break
            }
          }
        } catch {
          // Refused (or not found): fine. What matters is what was seen and what changed.
        }
        steps.push({ role, op, collection, detail })

        for (const doc of seen) {
          if (!doc) continue
          if (role === 'anonymous') fail(`anonymous got a ${collection} record from ${op}`)
          if (own && tenantOf(doc) !== own)
            fail(`${role} got another club's ${collection} record from ${op}`)
        }
        const after = await Promise.all(otherClubs.map((c) => snapshot(collection, c)))
        otherClubs.forEach((club, i) => {
          if (JSON.stringify(after[i]) !== JSON.stringify(before[i])) {
            fail(`${role}'s ${op} changed club ${club === w.clubA.id ? 'A' : 'B'}'s ${collection}`)
          }
        })
      }
      expect(steps).toHaveLength(ITERATIONS)
    },
  )
})
