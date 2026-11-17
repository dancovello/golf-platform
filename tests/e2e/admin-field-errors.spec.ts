import { expect, openReady, test } from './fixtures'

// QA-08: a refused page address turns the Slug field red and says why, instead of only a
// pop-up saying "The following field is invalid: Slug".
test('a bad or taken page address marks the field and says why', async ({ editorPage, world }) => {
  const t = Date.now()
  const created = await editorPage.request.post('/api/pages', {
    data: {
      title: `Errors ${t}`,
      slug: `errors-${t}`,
      tenant: world.clubA.id,
      _status: 'published',
    },
  })
  const { doc } = (await created.json()) as { doc: { id: string } }
  try {
    await openReady(editorPage, `/admin/collections/pages/${doc.id}`)
    const field = editorPage.locator('.field-type.text', { has: editorPage.locator('#field-slug') })

    await editorPage.locator('#field-slug').fill('news')
    await editorPage.getByRole('button', { name: 'Publish changes' }).click()
    await expect(field.locator('.field-error')).toContainText('already used by your site')
    await expect(editorPage.getByText('Slug: "news" is already used')).toBeVisible()

    await editorPage.locator('#field-slug').fill('Foo Bar')
    await editorPage.getByRole('button', { name: 'Publish changes' }).click()
    await expect(field.locator('.field-error')).toContainText('Lower-case letters')

    // The same address as another page in the club: a sentence, not "tenant_id, slug".
    await editorPage.locator('#field-slug').fill('membership')
    await editorPage.getByRole('button', { name: 'Publish changes' }).click()
    await expect(field.locator('.field-error')).toContainText('Your club already has one')
    await expect(editorPage.getByText('tenant_id')).toHaveCount(0)
  } finally {
    await editorPage.request.delete(`/api/pages/${doc.id}`)
  }
})
