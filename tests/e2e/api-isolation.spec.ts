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
    const pages = await (await editorPage.request.get('/api/pages?limit=100')).json()
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
      '/api/pages/versions?limit=100',
      '/api/payload-preferences',
      '/api/media?limit=100',
      '/api/documents?limit=100',
      '/api/access',
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

  test("club B's page history answers like history that doesn't exist", async ({
    editorPage,
    superAdminPage,
    world,
  }) => {
    const versions = await (
      await superAdminPage.request.get(
        `/api/pages/versions?where[parent][equals]=${world.pageB.id}&limit=1`,
      )
    ).json()
    const versionB = versions.docs[0]?.id
    expect(versionB, 'club B’s page should have a version to look for').toBeTruthy()
    const real = await editorPage.request.get(`/api/pages/versions/${versionB}`)
    const madeUp = await editorPage.request.get(`/api/pages/versions/${MADE_UP_ID}`)
    expect({ status: real.status(), body: await real.json() }).toEqual({
      status: madeUp.status(),
      body: await madeUp.json(),
    })
    const restore = await editorPage.request.post(`/api/pages/versions/${versionB}`)
    expect(restore.status()).toBeGreaterThanOrEqual(400)
  })

  test('cannot read or run the background job queue', async ({ editorPage }) => {
    expect((await editorPage.request.get('/api/payload-jobs')).status()).toBe(403)
    for (const path of ['/api/payload-jobs/run', '/api/payload-jobs/handle-schedules']) {
      const res = await editorPage.request.get(path)
      expect({ path, status: res.status() >= 400 }).toEqual({ path, status: true })
    }
  })

  test('switching off two-factor does nothing for an account without it', async ({
    editorPage,
  }) => {
    const res = await editorPage.request.post('/api/remove-totp', { data: { token: '000000' } })
    expect((await res.json()).ok).toBe(false)
  })

  test("club B's photo file isn't served through the API", async ({ editorPage, world }) => {
    const { filename, prefix } = world.mediaB
    const real = await editorPage.request.get(
      `/api/media/file/${encodeURIComponent(filename)}?prefix=${encodeURIComponent(prefix)}`,
    )
    const madeUp = await editorPage.request.get(
      `/api/media/file/made-up.png?prefix=${encodeURIComponent(prefix)}`,
    )
    expect(real.status()).toBeGreaterThanOrEqual(400)
    expect(real.status()).toBe(madeUp.status())
  })

  test('pasting a photo from a web address is switched off', async ({ editorPage }) => {
    const res = await editorPage.request.get(
      '/api/media/paste-url?src=https%3A%2F%2Fexample.com%2Fa.png',
    )
    expect(res.status()).toBeGreaterThanOrEqual(400)
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

test('platform files hold no club data', async ({ request, editorPage, world }) => {
  const clubData = [world.clubA.name, world.clubA.id, ...clubBSecrets(world)]
  for (const path of ['/health', '/robots.txt']) {
    for (const r of [request, editorPage.request]) {
      const body = await (await r.get(path)).text()
      expect({ path, leaked: clubData.filter((s) => body.includes(s)) }).toEqual({
        path,
        leaked: [],
      })
    }
  }
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
