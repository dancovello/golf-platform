import { test as base, type BrowserContext, expect, type Page } from '@playwright/test'

import { clubBSecrets, loadWorld, STATE_DIR, type World } from './world'

type Leak = { url: string; secret: string }

/**
 * Watches every response the app sends to the browser during a test (pages, data requests,
 * server-component payloads) and fails the test if any of them contains a club B secret.
 * Static script and style files are skipped: they're built once and can't hold club data.
 */
const watchForLeaks = (page: Page, secrets: string[], echoed: Set<string>) => {
  const leaks: Leak[] = []
  const pending: Promise<void>[] = []
  page.on('response', (response) => {
    const url = response.url()
    if (!url.startsWith('http://localhost') || /\/_next\/static\//.test(url)) return
    pending.push(
      response
        .text()
        .then((body) => {
          for (const secret of secrets) {
            if (body.includes(secret) && !echoed.has(secret)) leaks.push({ url, secret })
          }
        })
        .catch(() => {}), // redirects and aborted requests have no body
    )
  })
  return async () => {
    await Promise.all(pending)
    return leaks
  }
}

/**
 * Payload accepts the login cookie only on requests from the admin's own address (sign-in
 * audit, A5). Browsers say so with Sec-Fetch-Site on every request. The tests' direct API calls
 * (page.request, used the way a stolen cookie would be) don't, so they add it here: the
 * isolation suites then test the access rules themselves, not the cross-site check. Only the
 * API client gets it; a page can't override a browser's own Sec- headers.
 */
export const asSameOrigin = (context: BrowserContext) => {
  type Call = (url: unknown, options?: { headers?: Record<string, string> }) => unknown
  const api = context.request as unknown as Record<string, Call>
  for (const method of ['fetch', 'get', 'post', 'put', 'patch', 'delete', 'head']) {
    const original = api[method]!.bind(api)
    api[method] = (url, options = {}) =>
      original(url, {
        ...options,
        headers: { 'Sec-Fetch-Site': 'same-origin', ...options.headers },
      })
  }
  return context
}

type Fixtures = {
  world: World
  /**
   * IDs the test itself types into the address bar. Payload repeats a typed ID back in its
   * "could not be found" message, exactly as it does for an ID that doesn't exist, so these
   * aren't leaks. Tests that use this must also prove the page matches a made-up ID.
   */
  echoed: Set<string>
  editorPage: Page
  superAdminPage: Page
}

export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    await use(asSameOrigin(context))
  },
  world: async ({}, use) => {
    await use(loadWorld())
  },
  // Logged in as club A's editor, with every response checked for club B data.
  echoed: async ({}, use) => {
    await use(new Set())
  },
  editorPage: async ({ browser, world, echoed }, use) => {
    const context = asSameOrigin(
      await browser.newContext({ storageState: `${STATE_DIR}/editorA.json` }),
    )
    const page = await context.newPage()
    const leaksSoFar = watchForLeaks(page, clubBSecrets(world), echoed)
    await use(page)
    expect(await leaksSoFar(), 'club B data reached club A’s editor').toEqual([])
    await context.close()
  },
  superAdminPage: async ({ browser }, use) => {
    const context = asSameOrigin(
      await browser.newContext({ storageState: `${STATE_DIR}/superAdmin.json` }),
    )
    await use(await context.newPage())
    await context.close()
  },
})

/**
 * Opens a page and waits until it has finished loading its interactive code. Clicking a form
 * before then submits it as a plain page load and nothing reaches the API, which made logins
 * flaky when the machine was busy.
 */
export const openReady = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

export { expect }
