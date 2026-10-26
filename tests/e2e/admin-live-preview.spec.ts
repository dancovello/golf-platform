import { expect, homeLink, openReady, test } from './fixtures'

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

// Club Settings (plan part E): the home page beside the form, refreshed each time it's saved.
// Uses its own club, so saving never disturbs tests that have club A's settings open.
test('the Club Settings preview shows the home page and updates on save', async ({
  superAdminPage: page,
}) => {
  const name = `Preview Club ${Date.now()}`
  const club = await page.request.post('/api/tenants', { data: { name } })
  expect(club.ok()).toBe(true)
  const { doc: tenant } = (await club.json()) as { doc: { id: string } }
  const found = await page.request.get(`/api/club-settings?where[tenant][equals]=${tenant.id}`)
  const settingsID = ((await found.json()) as { docs: { id: string }[] }).docs[0].id
  // Every save needs an email and address in the footer (src/collections/ClubSettings.ts).
  const ready = await page.request.patch(`/api/club-settings/${settingsID}`, {
    data: { footer: { email: 'office@preview.example', address: '1 Preview Road' } },
  })
  expect(ready.ok()).toBe(true)

  const changed = `hello-${Date.now()}@preview.example`
  await openReady(page, `/admin/collections/club-settings/${settingsID}`)
  await page.getByRole('button', { name: 'Live Preview' }).click()
  const preview = page.frameLocator('#live-preview-iframe')
  await expect(homeLink(preview, name).first()).toBeVisible()
  await expect(preview.getByText(changed)).toHaveCount(0)

  await page.getByRole('button', { name: 'Footer', exact: true }).click()
  await page.locator('#field-footer__email').fill(changed)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(preview.getByText(changed)).toBeVisible()
})

// News and Events (plan part E): a draft shows in the editor's preview, never to visitors.
test('the News preview shows a draft article to the editor only', async ({
  editorPage,
  page: visitor,
  world,
}) => {
  const title = `Draft story ${Date.now()}`
  const created = await editorPage.request.post('/api/news', {
    data: {
      title,
      status: 'draft',
      category: 'club',
      publishedAt: new Date().toISOString(),
      tenant: world.clubA.id,
    },
  })
  expect(created.ok()).toBe(true)
  const { doc } = (await created.json()) as { doc: { id: string; slug: string } }
  try {
    const response = await visitor.goto(`/preview/test-club-a/news/${doc.slug}?live=1`)
    expect(response?.status()).toBe(404)

    await openReady(editorPage, `/admin/collections/news/${doc.id}`)
    await editorPage.getByRole('button', { name: 'Live Preview' }).click()
    const preview = editorPage.frameLocator('#live-preview-iframe')
    await expect(preview.getByRole('heading', { level: 1, name: title })).toBeVisible()
  } finally {
    await editorPage.request.delete(`/api/news/${doc.id}`)
  }
})

test('the Events preview shows a draft event to the editor only', async ({
  editorPage,
  page: visitor,
  world,
}) => {
  const title = `Draft event ${Date.now()}`
  const created = await editorPage.request.post('/api/events', {
    data: {
      title,
      status: 'draft',
      category: 'dining',
      booking: 'book',
      startsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      tenant: world.clubA.id,
    },
  })
  expect(created.ok()).toBe(true)
  const { doc } = (await created.json()) as { doc: { id: string } }
  try {
    await visitor.goto(`/preview/test-club-a/events?live=1&event=${doc.id}`)
    await expect(visitor.getByText(title)).toHaveCount(0)

    await openReady(editorPage, `/admin/collections/events/${doc.id}`)
    await editorPage.getByRole('button', { name: 'Live Preview' }).click()
    const preview = editorPage.frameLocator('#live-preview-iframe')
    await expect(preview.getByText(title).first()).toBeVisible()
  } finally {
    await editorPage.request.delete(`/api/events/${doc.id}`)
  }
})
