import { expect, openReady, test } from './fixtures'

// Live preview: the editor sees their unsaved draft beside the form, while visitors (even
// ones who add ?live=1 to the address) only ever see the published page. The test makes its
// own page so the shared test pages are never left with a draft.
test('the live preview shows the draft to the editor and the published page to visitors', async ({
  editorPage,
  page: visitor,
  world,
}) => {
  const slug = `live-preview-${Date.now()}`
  const created = await editorPage.request.post('/api/pages', {
    data: { title: 'Published title', slug, tenant: world.clubA.id, _status: 'published' },
  })
  expect(created.ok()).toBe(true)
  const { doc } = (await created.json()) as { doc: { id: string } }
  try {
    const saved = await editorPage.request.patch(`/api/pages/${doc.id}?draft=true`, {
      data: { title: 'Draft title' },
    })
    expect(saved.ok()).toBe(true)

    await visitor.goto(`/preview/test-club-a/${slug}?live=1`)
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText('Published title')
    await expect(visitor.getByText('Draft title')).toHaveCount(0)

    await openReady(editorPage, `/admin/collections/pages/${doc.id}`)
    await editorPage.getByRole('button', { name: 'Live Preview' }).click()
    const preview = editorPage.frameLocator('#live-preview-iframe') // Payload gives the panel no accessible name
    await expect(preview.getByRole('heading', { level: 1 })).toHaveText('Draft title')
  } finally {
    await editorPage.request.delete(`/api/pages/${doc.id}`)
  }
})
