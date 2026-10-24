// Cached club data with the real Next.js cache (job 5; src/site/cache.ts): a published change
// shows on the next visit, and drafts never reach visitors.
import { expect, test } from './fixtures'

test('publishing shows on the next visit; a saved draft never does', async ({
  editorPage,
  request,
}) => {
  const slug = `cache-check-${Date.now()}`
  const created = await editorPage.request.post('/api/pages', {
    data: { title: 'Cache check, first version', slug, _status: 'published' },
  })
  expect(created.ok()).toBe(true)
  const { doc } = await created.json()
  const visit = async () => (await request.get(`/preview/test-club-a/${slug}`)).text()

  // Twice: the second visit can come from the cache.
  expect(await visit()).toContain('Cache check, first version')
  expect(await visit()).toContain('Cache check, first version')

  const published = await editorPage.request.patch(`/api/pages/${doc.id}`, {
    data: { title: 'Cache check, second version', _status: 'published' },
  })
  expect(published.ok()).toBe(true)
  expect(await visit()).toContain('Cache check, second version')

  const draft = await editorPage.request.patch(`/api/pages/${doc.id}?draft=true`, {
    data: { title: 'Cache check, unpublished draft' },
  })
  expect(draft.ok()).toBe(true)
  const page = await visit()
  expect(page).toContain('Cache check, second version')
  expect(page).not.toContain('unpublished draft')
})

test("club B's preview never shows club A's cached page at the same address", async ({
  request,
  world,
}) => {
  for (let i = 0; i < 2; i++) {
    const a = await (await request.get('/preview/test-club-a/membership')).text()
    const b = await (await request.get('/preview/test-club-b/membership')).text()
    expect(a).toContain(world.pageA.title)
    expect(b).not.toContain(world.pageA.title)
  }
})
