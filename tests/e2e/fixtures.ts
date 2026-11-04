import {
  test as base,
  type BrowserContext,
  expect,
  type FrameLocator,
  type Page,
  type Response,
} from '@playwright/test'

import { clubBSecrets, loadWorld, STATE_DIR, type World } from './world'

type Leak = { url: string; secret: string }

/** How long to wait for one response's body before treating it as abandoned by the browser. */
const BODY_WAIT_MS = 20_000

const ABANDONED = Symbol('abandoned')

/**
 * A response's text, or ABANDONED if it hasn't arrived in `waitMs`. When a test moves to the
 * next screen while a request is still coming in, the browser can drop it without the body
 * ever finishing or failing, and `response.text()` then waits forever. On GitHub's slower
 * machines that held the end of the admin security-policy test until its 180 second limit
 * (3 Nov 2026). A body the browser dropped was never shown to the editor.
 */
const readBody = (response: Response, waitMs: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const gone = new Promise<typeof ABANDONED>((resolve) => {
    timer = setTimeout(() => resolve(ABANDONED), waitMs)
  })
  return Promise.race([response.text().catch(() => ''), gone]).finally(() => clearTimeout(timer))
}

/**
 * Watches every response the app sends to the browser during a test (pages, data requests,
 * server-component payloads) and fails the test if any of them contains a club B secret.
 * Static script and style files are skipped: they're built once and can't hold club data.
 * `onAbandoned` hears about each body that never arrived, so a skipped check is not silent.
 */
export const watchForLeaks = (
  page: Page,
  secrets: string[],
  echoed: Set<string>,
  onAbandoned: (url: string) => void = () => {},
  waitMs = BODY_WAIT_MS,
) => {
  const leaks: Leak[] = []
  const pending: Promise<void>[] = []
  page.on('response', (response) => {
    const url = response.url()
    if (!url.startsWith('http://localhost') || /\/_next\/static\//.test(url)) return
    // Redirects and aborted requests have no body: readBody turns that into an empty text.
    pending.push(
      readBody(response, waitMs).then((body) => {
        if (body === ABANDONED) return onAbandoned(url)
        for (const secret of secrets) {
          if (body.includes(secret) && !echoed.has(secret)) leaks.push({ url, secret })
        }
      }),
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
/**
 * Marks the homepage golf ball intro as already seen this session (src/marketing/intro), so it
 * doesn't cover the page in tests about something else. The intro's own tests
 * (marketing-intro.spec.ts) open a fresh browser without this.
 */
export const skipIntro = async (context: BrowserContext) => {
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('mk-intro-seen', '1')
    } catch {
      // Some pages (about:blank) have no storage.
    }
  })
  return context
}

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
    await use(asSameOrigin(await skipIntro(context)))
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
      await skipIntro(await browser.newContext({ storageState: `${STATE_DIR}/editorA.json` })),
    )
    const page = await context.newPage()
    const leaksSoFar = watchForLeaks(page, clubBSecrets(world), echoed, (url) =>
      base.info().annotations.push({ type: 'leak-check-skipped', description: url }),
    )
    await use(page)
    expect(await leaksSoFar(), 'club B data reached club A’s editor').toEqual([])
    await context.close()
  },
  superAdminPage: async ({ browser }, use) => {
    const context = asSameOrigin(
      await skipIntro(await browser.newContext({ storageState: `${STATE_DIR}/superAdmin.json` })),
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

/**
 * The club's logo link home. Its name is what the logo shows (its alt text, or the club name
 * and strapline) followed by ", home".
 */
export const homeLink = (scope: Page | FrameLocator, clubName: string) =>
  scope.getByRole('link', {
    name: new RegExp(`^${clubName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: .*)?, home$`),
  })

export { expect }
