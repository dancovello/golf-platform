import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { expect, test, watchForLeaks } from './fixtures'

// The club-separation leak check (watchForLeaks in fixtures.ts) that every editor browser runs
// when its test ends. It must still catch club B data, and must not wait forever for a response
// body the browser never finished receiving (the admin security-policy test hung on that in CI,
// 3 Nov 2026). A small server on a free port stands in for the app.

let server: Server
let base: string

test.beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === '/never') {
      // Headers and a first byte, then nothing: the body never finishes.
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.write('x')
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end(request.url === '/secret' ? 'the club B secret' : 'fine')
  })
  await new Promise<void>((resolve) => server.listen(0, 'localhost', resolve))
  base = `http://localhost:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

test('still reports club B data in a response', async ({ page }) => {
  await page.goto(`${base}/fine`)
  const leaksSoFar = watchForLeaks(page, ['club B secret'], new Set())
  await page.evaluate((url) => fetch(url).then((r) => r.text()), `${base}/secret`)
  expect(await leaksSoFar()).toEqual([{ url: `${base}/secret`, secret: 'club B secret' }])
})

test('does not wait forever for a body that never finishes, and says so', async ({ page }) => {
  await page.goto(`${base}/fine`)
  const abandoned: string[] = []
  const leaksSoFar = watchForLeaks(
    page,
    ['club B secret'],
    new Set(),
    (url) => abandoned.push(url),
    500,
  )
  // fetch() settles once the headers arrive; the body is the part that never does.
  await page.evaluate((url) => void fetch(url), `${base}/never`)
  await page.evaluate((url) => fetch(url).then((r) => r.text()), `${base}/fine`)
  expect(await leaksSoFar()).toEqual([])
  expect(abandoned).toEqual([`${base}/never`])
})
