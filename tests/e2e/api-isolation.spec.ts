/**
 * Tenant isolation over the REST API, against the real server, as club A's editor fully
 * logged in (password and two-factor code). Moved here from the integration tests in 2.5:
 * the two-factor session only exists inside a running server.
 */
import { expect, test } from './fixtures'
import { clubBSecrets } from './world'

const MADE_UP_ID = '00000000-0000-4000-8000-000000000000'

test.describe("REST API as club A's editor", () => {
  test('lists only club A pages and club settings', async ({ editorPage, world }) => {
    const pages = await (await editorPage.request.get('/api/pages')).json()
    const ids = pages.docs.map((d: { id: string }) => d.id)
    expect(ids).toEqual(expect.arrayContaining([world.pageA.id, world.homeA.id]))
    expect(ids).not.toContain(world.pageB.id)
    for (const d of pages.docs as { tenant: unknown }[]) {
      expect(JSON.stringify(d.tenant)).toContain(world.clubA.id)
    }
    const settings = await (await editorPage.request.get('/api/club-settings')).json()
    expect(settings.docs.map((d: { id: string }) => d.id)).toEqual([world.settingsA.id])
  })

  test("club B's records answer exactly like records that don't exist", async ({
    editorPage,
    world,
  }) => {
    for (const [collection, id] of [
      ['pages', world.pageB.id],
      ['club-settings', world.settingsB.id],
      ['users', world.editorB.id],
      ['users', world.superAdmin.id],
      ['tenants', world.clubB.id],
    ] as const) {
      const real = await editorPage.request.get(`/api/${collection}/${id}`)
      const madeUp = await editorPage.request.get(`/api/${collection}/${MADE_UP_ID}`)
      expect({ collection, status: real.status(), body: await real.json() }).toEqual({
        collection,
        status: madeUp.status(),
        body: await madeUp.json(),
      })
    }
  })

  test('filtering by club B returns nothing', async ({ editorPage, world }) => {
    const res = await editorPage.request.get(`/api/pages?where[tenant][equals]=${world.clubB.id}`)
    expect((await res.json()).totalDocs).toBe(0)
  })

  test('no API response mentions club B, its editor or a super-admin', async ({
    editorPage,
    world,
  }) => {
    for (const path of [
      '/api/pages',
      '/api/club-settings',
      '/api/users',
      '/api/tenants',
      '/api/users/me',
      '/api/tenants/populate-tenant-options',
    ]) {
      const body = await (await editorPage.request.get(path)).text()
      const leaked = clubBSecrets(world).filter((secret) => body.includes(secret))
      expect({ path, leaked }).toEqual({ path, leaked: [] })
    }
  })

  test("cannot change, delete or create club B's content", async ({
    editorPage,
    superAdminPage,
    world,
  }) => {
    await editorPage.request.patch(`/api/pages/${world.pageB.id}`, { data: { title: 'hacked' } })
    await editorPage.request.delete(`/api/pages/${world.pageB.id}`)
    const created = await editorPage.request.post('/api/pages', {
      data: { title: 'Planted', slug: 'planted', tenant: world.clubB.id },
    })
    expect(created.status()).toBeGreaterThanOrEqual(400)
    // Checked through the super-admin, who can see club B.
    const pageB = await (await superAdminPage.request.get(`/api/pages/${world.pageB.id}`)).json()
    expect(pageB.title).toBe(world.pageB.title)
  })

  test('cannot make itself super-admin or move club', async ({ editorPage, world }) => {
    await editorPage.request.patch(`/api/users/${world.editorA.id}`, {
      data: { role: 'super-admin', tenant: world.clubB.id },
    })
    const me = await (await editorPage.request.get('/api/users/me?depth=0')).json()
    expect(me.user.role).toBe('editor')
    expect(me.user.tenant).toBe(world.clubA.id)
  })
})

test.describe('REST API with no login', () => {
  for (const path of ['/api/pages', '/api/club-settings', '/api/users', '/api/tenants']) {
    test(`${path} is refused`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(403)
    })
  }

  test('GraphQL is switched off', async ({ request }) => {
    const res = await request.post('/api/graphql', { data: { query: '{__typename}' } })
    expect(res.status()).toBe(404)
  })
})
