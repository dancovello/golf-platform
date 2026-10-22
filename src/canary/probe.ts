/**
 * The live isolation canary's attempts (job 9; docs/operations/canary.md). Signs in over the
 * real web address as the hidden canary club A's editor, then tries to reach the hidden canary
 * club B's records every way an outsider might. Returns every attempt that got something.
 *
 * No database or Payload here: only HTTP, so the browser tests can run it against the test
 * server too (tests/e2e/canary.spec.ts).
 */
export type CanaryTargets = {
  clubB: { id: string; slug: string }
  /** Club B's records by collection, with a text only club B has (a marker in a title). */
  records: { collection: string; id: string }[]
  marker: string
}

export type ProbeOptions = {
  baseURL: string
  email: string
  password: string
  targets: CanaryTargets
  /** Vercel's Protection Bypass for Automation secret, where the site is behind Vercel's login. */
  bypass?: string
  /** Club previews must be closed (production). Staging's previews are open to anyone. */
  previewsClosed?: boolean
  fetch?: typeof fetch
}

export const probeAsCanaryA = async ({
  baseURL,
  email,
  password,
  targets,
  bypass,
  previewsClosed = true,
  fetch: f = fetch,
}: ProbeOptions): Promise<string[]> => {
  const base = baseURL.replace(/\/$/, '')
  const common: Record<string, string> = bypass ? { 'x-vercel-protection-bypass': bypass } : {}
  const login = await f(`${base}/api/users/login`, {
    method: 'POST',
    headers: { ...common, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!login.ok) throw new Error(`Canary login failed (${login.status})`)
  const { token } = (await login.json()) as { token?: string }
  if (!token) throw new Error('Canary login returned no token')
  const asA = { ...common, Authorization: `JWT ${token}` }
  const get = async (path: string) => {
    const res = await f(`${base}${path}`, { headers: asA, redirect: 'manual' })
    return { status: res.status, body: await res.text() }
  }

  const leaks: string[] = []
  const check = (attempt: string, { status, body }: { status: number; body: string }) => {
    const hit =
      body.includes(targets.marker) ||
      body.includes(targets.clubB.id) ||
      targets.records.some((r) => body.includes(r.id))
    // The record's own ID may be echoed back in a "not found" message; that alone isn't a leak.
    const echoOnly = status === 404 && !body.includes(targets.marker)
    if (hit && !echoOnly) leaks.push(`${attempt} (${status})`)
  }

  // 1. By ID.
  for (const { collection, id } of targets.records) {
    check(`${collection} ${id} by ID`, await get(`/api/${collection}/${id}?depth=1`))
  }
  check('club B by ID', await get(`/api/tenants/${targets.clubB.id}`))
  // 2. By filtering and listing.
  const collections = [...new Set(targets.records.map((r) => r.collection))]
  for (const collection of collections) {
    check(
      `${collection} filtered by club B`,
      await get(`/api/${collection}?where[tenant][equals]=${targets.clubB.id}&depth=1`),
    )
    check(`${collection} listed`, await get(`/api/${collection}?limit=200&depth=1`))
    check(
      `${collection} searched for the marker`,
      await get(`/api/${collection}?where[title][like]=${encodeURIComponent(targets.marker)}`),
    )
  }
  // 3. By address: club previews exist only on staging, and must never answer on production.
  if (previewsClosed) {
    for (const path of [
      `/preview/${targets.clubB.slug}`,
      `/preview/${targets.clubB.slug}/search?q=canary`,
    ]) {
      const { status } = await get(path)
      if (status < 400) leaks.push(`${path} answered on production (${status})`)
    }
  }

  await f(`${base}/api/users/logout`, { method: 'POST', headers: asA }).catch(() => undefined)
  return leaks
}
