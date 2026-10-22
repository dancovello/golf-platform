/**
 * Keeps src/security/isolation-manifest.ts complete and true (job 2, 21 Oct grilling): every
 * collection, endpoint, web route and server action must point at a test that exists.
 */
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import config from '@/payload.config'
import {
  CACHED,
  COLLECTIONS,
  type Cover,
  ENDPOINTS,
  ROUTES,
  SERVER_ACTIONS,
} from '@/security/isolation-manifest'

import { CACHED_LOADERS } from '@/site/cache'
// Imported so their cached loaders register themselves.
import '@/site/events'
import '@/site/loadClub'
import '@/site/news'
import '@/site/resolveSite'

import { ROOT } from '../shared/sourceScan'

/** Payload's standard endpoints: tested for every collection by the isolation suite. */
const STANDARD = new Set([
  'GET /',
  'GET /:id',
  'GET /count',
  'POST /',
  'PATCH /',
  'PATCH /:id',
  'DELETE /',
  'DELETE /:id',
  'POST /access/:id?',
  'POST /:id/duplicate',
  'GET /versions',
  'GET /versions/:id',
  'POST /versions/:id',
  // Login and account endpoints (users)
  'POST /login',
  'POST /logout',
  'GET /me',
  'POST /refresh-token',
  'GET /init',
  'POST /first-register',
  'POST /forgot-password',
  'POST /reset-password',
  'POST /unlock',
  'POST /verify/:id',
])

type Endpoint = { method: string; path: string }

const endpointsInConfig = async () => {
  const cfg = await config
  const found: string[] = []
  for (const e of (cfg.endpoints ?? []) as Endpoint[]) {
    found.push(`${e.method.toUpperCase()} /api${e.path}`)
  }
  for (const c of cfg.collections) {
    for (const e of (c.endpoints || []) as Endpoint[]) {
      const key = `${e.method.toUpperCase()} ${e.path}`
      if (!STANDARD.has(key)) found.push(`${e.method.toUpperCase()} /api/${c.slug}${e.path}`)
    }
  }
  return [...new Set(found)].sort()
}

const filesUnder = (dir: string, match: (name: string) => boolean): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'migrations' ? [] : filesUnder(full, match)
    return match(e.name) ? [path.relative(ROOT, full)] : []
  })

const routesInApp = () =>
  filesUnder(path.join(ROOT, 'src/app'), (n) => n === 'page.tsx' || n === 'route.ts').sort()

/** Files that declare server actions: 'use server' at the top, or inside a function. */
const serverActionFiles = () =>
  filesUnder(path.join(ROOT, 'src'), (n) => /\.tsx?$/.test(n))
    .filter((f) => /^\s*['"]use server['"]/m.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
    .sort()

const missingTests = (manifest: Record<string, Cover[]>) =>
  Object.entries(manifest).flatMap(([key, covers]) => {
    if (covers.length === 0) return [`${key}: no test named`]
    return covers
      .filter((c) => {
        const file = path.join(ROOT, c.file)
        return !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(c.test)
      })
      .map((c) => `${key}: "${c.test}" isn't in ${c.file}`)
  })

describe('the isolation manifest lists everything', () => {
  it('every collection, and nothing that no longer exists', async () => {
    const slugs = (await config).collections.map((c) => c.slug).sort()
    expect(Object.keys(COLLECTIONS).sort()).toEqual(slugs)
  })

  it('every endpoint beyond the standard ones, and nothing that no longer exists', async () => {
    expect(Object.keys(ENDPOINTS).sort()).toEqual(await endpointsInConfig())
  })

  it('every page and route under src/app, and nothing that no longer exists', () => {
    expect(Object.keys(ROUTES).sort()).toEqual(routesInApp())
  })

  it('every cached club loader (src/site/cache.ts)', () => {
    expect(Object.keys(CACHED).sort()).toEqual(CACHED_LOADERS.map((l) => l.name).sort())
  })

  it("every file of server actions ('use server')", () => {
    expect(Object.keys(SERVER_ACTIONS).sort()).toEqual(serverActionFiles())
  })
})

describe('every test the manifest names exists', () => {
  it.each([
    ['collections', COLLECTIONS],
    ['endpoints', ENDPOINTS],
    ['routes', ROUTES],
    ['server actions', SERVER_ACTIONS],
    ['cached loaders', CACHED],
  ] as const)('%s', (_name, manifest) => {
    expect(missingTests(manifest)).toEqual([])
  })
})
