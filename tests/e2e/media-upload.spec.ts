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
