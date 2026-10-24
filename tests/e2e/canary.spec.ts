// The live isolation canary's probe (src/canary/probe.ts), run against the test server with the
// test clubs standing in for the canary clubs.
import { probeAsCanaryA } from '@/canary/probe'

import { expect, test } from './fixtures'
import { PASSWORD } from './world'

test("the canary's attempts on club B, as club A's editor, all come back empty", async ({
  world,
  baseURL,
}) => {
  const leaks = await probeAsCanaryA({
    baseURL: baseURL!,
    email: world.editorA.email,
    password: PASSWORD,
    targets: {
      clubB: { id: world.clubB.id, slug: 'test-club-b' },
      records: [
        { collection: 'pages', id: world.pageB.id },
        { collection: 'club-settings', id: world.settingsB.id },
        { collection: 'media', id: world.mediaB.id },
      ],
      marker: world.pageB.title,
    },
    // The test server is like staging: club previews are open to anyone, by design.
    previewsClosed: false,
  })
  expect(leaks).toEqual([])
})

test('the canary notices when it can see something (pointed at its own club)', async ({
  world,
  baseURL,
}) => {
  const leaks = await probeAsCanaryA({
    baseURL: baseURL!,
    email: world.editorA.email,
    password: PASSWORD,
    targets: {
      clubB: { id: world.clubA.id, slug: 'test-club-a' },
      records: [{ collection: 'pages', id: world.pageA.id }],
      marker: world.pageA.title,
    },
    previewsClosed: false,
  })
  expect(leaks.length).toBeGreaterThan(0)
})
