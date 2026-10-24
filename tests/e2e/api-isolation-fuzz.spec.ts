// Randomised tenant isolation over the REST API (job 9, 21 Oct grilling), as club A's editor.
// Every response is checked for club B's data by the leak watcher (tests/e2e/fixtures.ts), and
// club B's records are checked unchanged at the end. ISOLATION_ITERATIONS steps (500 on every
// change); the seed is printed, and ISOLATION_SEED replays a run.
import { expect, test } from './fixtures'

const ITERATIONS = Number(process.env.ISOLATION_ITERATIONS ?? 500)
// Not in the test's title: Playwright lists tests in one process and runs them in another.
const SEED = Number(process.env.ISOLATION_SEED ?? Math.floor(Math.random() * 2 ** 31))
const MADE_UP = '00000000-0000-4000-8000-000000000000'

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

const COLLECTIONS = [
  'pages',
  'news',
  'events',
  'staff',
  'courses',
  'media',
  'documents',
  'enquiries',
  'club-settings',
  'course-status',
  'agreement-acceptances',
  'users',
  'tenants',
]

test("random REST requests as club A's editor never reach club B", async ({
  editorPage,
  superAdminPage,
  world,
}) => {
  test.setTimeout(240_000)
  console.info(`REST isolation fuzz: seed ${SEED}, ${ITERATIONS} steps`)
  const next = random(SEED)
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!
  const bIDs = [
    world.pageB.id,
    world.settingsB.id,
    world.mediaB.id,
    world.clubB.id,
    world.editorB.id,
    world.superAdmin.id,
  ]
  const ids = [...bIDs, world.pageA.id, world.homeA.id, world.settingsA.id, MADE_UP]
  const before = {
    page: await (await superAdminPage.request.get(`/api/pages/${world.pageB.id}?depth=0`)).json(),
    settings: await (
      await superAdminPage.request.get(`/api/club-settings/${world.settingsB.id}?depth=0`)
    ).json(),
  }
  const steps: string[] = []

  for (let n = 1; n <= ITERATIONS; n++) {
    const c = pick(COLLECTIONS)
    const id = pick(ids)
    const r = editorPage.request
    const op = pick([
      'list',
      'byID',
      'filter',
      'patch',
      'patchMany',
      'delete',
      'create',
      'versions',
    ])
    steps.push(`${n}. ${op} ${c} ${id}`)
    switch (op) {
      case 'list':
        await r.get(`/api/${c}?limit=50&depth=1`)
        break
      case 'byID':
        await r.get(`/api/${c}/${id}?depth=1`)
        break
      case 'filter':
        await r.get(
          `/api/${c}?where[${pick(['tenant', 'id'])}][equals]=${pick([world.clubB.id, id])}`,
        )
        break
      case 'patch':
        await r.patch(`/api/${c}/${id}`, {
          data: {
            title: `fuzz ${n}`,
            name: `fuzz ${n}`,
            clubName: `fuzz ${n}`,
            tenant: world.clubB.id,
          },
        })
        break
      case 'patchMany':
        await r.patch(`/api/${c}?where[id][equals]=${id}`, {
          data: { title: `fuzz ${n}`, tenant: world.clubB.id },
        })
        break
      case 'delete':
        if (bIDs.includes(id)) await r.delete(`/api/${c}/${id}`)
        break
      case 'create':
        await r.post(`/api/${c}`, {
          data: { title: `fuzz ${n}`, slug: `fuzz-${SEED}-${n}`, tenant: world.clubB.id },
        })
        break
      case 'versions':
        await r.get(`/api/${c}/versions?limit=20`)
        break
    }
  }

  const after = {
    page: await (await superAdminPage.request.get(`/api/pages/${world.pageB.id}?depth=0`)).json(),
    settings: await (
      await superAdminPage.request.get(`/api/club-settings/${world.settingsB.id}?depth=0`)
    ).json(),
  }
  expect(after, `Club B changed. Seed ${SEED}; replay with ISOLATION_SEED=${SEED}`).toEqual(before)
  const plantedInB = await (
    await superAdminPage.request.get(
      `/api/pages?where[slug][like]=fuzz-${SEED}&where[tenant][equals]=${world.clubB.id}`,
    )
  ).json()
  expect(plantedInB.totalDocs, `Created in club B. Seed ${SEED}`).toBe(0)
})
