import { expect, openReady, test } from './fixtures'

// QA-36: two editors on one page must not silently overwrite each other. The editor's own
// autosaves must never trip the check.
test('a page changed by someone else is not overwritten, but own autosaves are fine', async ({
  editorPage,
  world,
}) => {
  const slug = `stale-save-${Date.now()}`
  const created = await editorPage.request.post('/api/pages', {
    data: { title: 'Original', slug, tenant: world.clubA.id, _status: 'published' },
  })
  expect(created.ok()).toBe(true)
  const { doc } = (await created.json()) as { doc: { id: string } }
  try {
    await openReady(editorPage, `/admin/collections/pages/${doc.id}`)
    const title = editorPage.locator('#field-title')

    // Several edits with autosaves in between: no conflict message.
    for (const text of ['One', 'Two', 'Three']) {
      await title.fill(text)
      await editorPage.waitForTimeout(2500)
    }
    await expect(editorPage.getByText('Someone else has changed this')).toHaveCount(0)

    // Publishing after those autosaves works too.
    await editorPage.getByRole('button', { name: 'Publish changes' }).click()
    await expect(editorPage.getByText('Updated successfully')).toBeVisible()
    // ...and so does a second publish without reloading.
    await title.fill('Four')
    await editorPage.getByRole('button', { name: 'Publish changes' }).click()
    await expect(editorPage.getByText('Updated successfully')).toBeVisible()
    // ...and carrying on editing after publishing, with autosaves, is fine too.
    await title.fill('Five')
    await editorPage.waitForTimeout(2500)
    await expect(editorPage.getByText('Someone else has changed this')).toHaveCount(0)

    // Let the screen settle after publishing, then someone else saves the same page.
    await editorPage.waitForTimeout(3000)
    const other = await editorPage.request.patch(`/api/pages/${doc.id}?draft=true`, {
      data: { title: 'Their change' },
    })
    expect(other.ok()).toBe(true)

    // The next edit from the old screen is refused, and their change survives.
    await title.fill('Mine, from an old screen')
    await expect(editorPage.getByText('Someone else has changed this').first()).toBeVisible({
      timeout: 10_000,
    })
    const now = await editorPage.request.get(`/api/pages/${doc.id}?draft=true`)
    expect(((await now.json()) as { title: string }).title).toBe('Their change')
  } finally {
    await editorPage.request.delete(`/api/pages/${doc.id}`)
  }
})
