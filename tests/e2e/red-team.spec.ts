// Red team, session 1 (docs/security/red-team-1.md): club A's editor trying to reach club B in
// ways the other isolation tests didn't cover. Every attempt is a test, whether it worked or not.
import { expect, test } from './fixtures'

test.describe("red team: club A's editor going after club B", () => {
  test('choosing club B in the club-selector cookie shows nothing of club B', async ({
    editorPage,
    world,
    echoed,
  }) => {
    // The admin repeats the cookie's value back, whatever it is (checked below with a made-up
    // one): that's the attacker's own input, not club B's data.
    echoed.add(world.clubB.id)
    const listWith = async (club: string) => {
      await editorPage
        .context()
        .addCookies([{ name: 'payload-tenant', value: club, domain: 'localhost', path: '/' }])
      const pages = await (await editorPage.request.get('/api/pages?limit=100')).json()
      return pages.totalDocs
    }
    // Club B's ID and a made-up one behave exactly alike: nothing of club B, and no hint it exists.
    expect(await listWith(world.clubB.id)).toBe(
      await listWith('11111111-2222-4333-8444-555555555555'),
    )
    await editorPage
      .context()
      .addCookies([
        { name: 'payload-tenant', value: world.clubB.id, domain: 'localhost', path: '/' },
      ])
    for (const path of ['/api/pages', '/api/club-settings', '/api/media', '/api/users']) {
      const body = await (await editorPage.request.get(path)).json()
      const ids = (body.docs ?? []).map((d: { id: string }) => d.id)
      const ofB = [world.pageB.id, world.settingsB.id, world.mediaB.id, world.editorB.id]
      expect({ path, ids: ids.filter((id: string) => ofB.includes(id)) }).toEqual({ path, ids: [] })
    }
    await editorPage.goto('/admin/collections/pages')
    await expect(editorPage.getByText(world.pageB.title)).toHaveCount(0)
    await expect(editorPage.getByText(world.clubB.name)).toHaveCount(0)
  })

  test("filtering through a relationship (the club's name, a parent's club) finds nothing", async ({
    editorPage,
    world,
  }) => {
    for (const query of [
      `where[tenant.name][like]=${encodeURIComponent(world.clubB.name)}`,
      `where[tenant.slug][equals]=test-club-b`,
      `where[parent.tenant][equals]=${world.clubB.id}`,
      `where[or][0][tenant][equals]=${world.clubB.id}&where[or][1][id][exists]=true`,
      `sort=tenant&limit=200&depth=2`,
    ]) {
      const body = await (await editorPage.request.get(`/api/pages?${query}`)).json()
      const ids = (body.docs ?? []).map((d: { id: string }) => d.id)
      expect({ query, leaked: ids.includes(world.pageB.id) }).toEqual({ query, leaked: false })
    }
  })

  test("pointing club A's page at club B's photo or page is refused", async ({
    editorPage,
    world,
  }) => {
    const parent = await editorPage.request.patch(`/api/pages/${world.pageA.id}`, {
      data: { parent: world.pageB.id },
    })
    expect(parent.status()).toBeGreaterThanOrEqual(400)
    const photo = await editorPage.request.patch(`/api/pages/${world.pageA.id}`, {
      data: { layout: [{ blockType: 'hero', heading: 'x', image: world.mediaB.id }] },
    })
    expect(photo.status()).toBeGreaterThanOrEqual(400)
    // Nothing of club B comes back populated either way (the leak watcher checks every response).
  })

  test("club B's draft stays hidden from club A's editor in the live preview", async ({
    editorPage,
    superAdminPage,
    world,
  }) => {
    const secret = `Club B draft ${Date.now()}`
    const saved = await superAdminPage.request.patch(`/api/pages/${world.pageB.id}?draft=true`, {
      data: { title: secret },
    })
    expect(saved.ok()).toBe(true)
    const html = await (
      await editorPage.request.get('/preview/test-club-b/membership?live=1')
    ).text()
    expect(html).not.toContain(secret)
  })

  test("a forgotten-password request for club B's editor tells club A nothing", async ({
    request,
    world,
  }) => {
    const real = await request.post('/api/users/forgot-password', {
      data: { email: world.editorB.email },
    })
    const madeUp = await request.post('/api/users/forgot-password', {
      data: { email: 'nobody@example.com' },
    })
    expect({ status: real.status(), body: await real.text() }).toEqual({
      status: madeUp.status(),
      body: await madeUp.text(),
    })
  })
})
