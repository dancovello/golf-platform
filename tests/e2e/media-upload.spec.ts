import { TINY_PNG } from '../shared/media'
import { expect, openReady, test } from './fixtures'

// The upload path used on Vercel: the browser sends the file straight to storage with a
// short-lived signed link (Vercel refuses request bodies over 4.5 MB), then Payload checks it.
test("club A's editor uploads a photo straight to storage", async ({ editorPage: page }) => {
  await openReady(page, '/admin/collections/media/create')
  const [upload] = await Promise.all([
    page.waitForRequest(
      (r) => r.method() === 'PUT' && r.url().startsWith('http://127.0.0.1:8333/'),
    ),
    page.locator('input[type="file"]').setInputFiles({
      name: 'green.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    }),
    page
      .getByLabel('Description')
      .fill('The 18th green')
      .then(() => page.getByRole('button', { name: 'Save' }).click()),
  ])
  expect(new URL(upload.url()).pathname).toMatch(
    // media/<our random folder>/<Payload's random folder>/<random code>-green.png
    /^\/golf-media-test\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-z]{6}-green\.png$/,
  )
  await expect(page).toHaveURL(/\/admin\/collections\/media\/[0-9a-f-]{36}/)
  await expect(page.getByLabel('Description')).toHaveValue('The 18th green')
})

// Security review: could a crafted upload request make a signed link that writes over
// club B's file? The file name and folder come from the browser, so try the worst ones.
test("a crafted upload request cannot reach club B's file", async ({ editorPage: page, world }) => {
  const original = await (await page.request.get(world.mediaB.url)).body()
  await openReady(page, '/admin/collections/media')
  const attempts = [
    { filename: `../${world.mediaB.filename}`, docPrefix: world.mediaB.prefix },
    { filename: `../../${world.mediaB.prefix}/${world.mediaB.filename}`, docPrefix: 'media' },
    { filename: world.mediaB.filename, docPrefix: `${world.mediaB.prefix}/..` },
  ]
  for (const attempt of attempts) {
    const res = await page.request.post('/api/storage-s3-generate-signed-url', {
      data: { collectionSlug: 'media', mimeType: 'image/png', filesize: 68, ...attempt },
    })
    if (!res.ok()) continue // refused outright: fine
    const { url, headers } = (await res.json()) as { url: string; headers: Record<string, string> }
    const key = decodeURIComponent(new URL(url).pathname)
    expect(key, JSON.stringify(attempt)).not.toContain('..')
    expect(key).not.toBe(new URL(world.mediaB.url).pathname)
    // Even if a link were issued, it can only create a new file, never replace one.
    await page.request.put(url, { headers, data: Buffer.from('overwritten!') })
  }
  expect(await (await page.request.get(world.mediaB.url)).body()).toEqual(original)
})

// Security review: the browser declares the file type when asking for an upload link. Types
// outside the allowed list (web pages, SVG) must be refused before any link is issued.
test('no upload link for file types outside the allowed list', async ({ editorPage: page }) => {
  await openReady(page, '/admin/collections/media')
  for (const [filename, mimeType] of [
    ['page.html', 'text/html'],
    ['logo.svg', 'image/svg+xml'],
    ['tool.exe', 'application/x-msdownload'],
    ['photo.png', 'text/html'],
  ]) {
    const res = await page.request.post('/api/storage-s3-generate-signed-url', {
      data: { collectionSlug: 'media', filename, mimeType, filesize: 100 },
    })
    expect(res.ok(), `${filename} as ${mimeType}`).toBe(false)
  }
})
