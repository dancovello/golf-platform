/**
 * Tenant isolation over the REST API: real HTTP requests, handled by the same route handlers
 * the deployed app uses (src/app/(payload)/api/[...slug]/route.ts), with a real login token.
 */
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { PASSWORD, seedWorld, type World } from './helpers/seed'

let w: World
let tokenA: string

const handlers = {
  GET: REST_GET(config),
  POST: REST_POST(config),
  PATCH: REST_PATCH(config),
  DELETE: REST_DELETE(config),
}

const api = async (
  method: keyof typeof handlers,
  path: string,
  { token, body }: { token?: string; body?: unknown } = {},
) => {
  const url = new URL(`http://localhost/api${path}`)
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `JWT ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const slug = url.pathname.replace(/^\/api\//, '').split('/')
  const response = await handlers[method](request, { params: Promise.resolve({ slug }) })
  const text = await response.text()
  return { status: response.status, text, json: text ? JSON.parse(text) : null }
}

beforeAll(async () => {
  w = await seedWorld()
  const login = await api('POST', '/users/login', {
    body: { email: 'editor-a@example.com', password: PASSWORD },
  })
  expect(login.status).toBe(200)
  tokenA = login.json.token
})

describe('REST API as editor A', () => {
  it('lists only club A pages and club settings', async () => {
    const pages = await api('GET', '/pages', { token: tokenA })
    expect(pages.json.docs.map((d: { id: string }) => d.id)).toEqual([w.pageA.id])
    const settings = await api('GET', '/club-settings', { token: tokenA })
    expect(settings.json.docs.map((d: { id: string }) => d.id)).toEqual([w.settingsA.id])
  })

  it("club B's records answer exactly like records that don't exist", async () => {
    const missing = await api('GET', '/pages/00000000-0000-4000-8000-000000000000', {
      token: tokenA,
    })
    for (const path of [
      `/pages/${w.pageB.id}`,
      `/club-settings/${w.settingsB.id}`,
      `/users/${w.editorB.id}`,
      `/users/${w.superAdmin.id}`,
      `/tenants/${w.clubB.id}`,
    ]) {
      const res = await api('GET', path, { token: tokenA })
      expect({ path, status: res.status, body: res.json }).toEqual({
        path,
        status: missing.status,
        body: missing.json,
      })
    }
  })

  it('filtering by club B returns an empty list', async () => {
    const res = await api('GET', `/pages?where[tenant][equals]=${w.clubB.id}`, { token: tokenA })
    expect(res.json.totalDocs).toBe(0)
  })

  it('no response anywhere mentions club B, its editor or a super-admin', async () => {
    const paths = [
      '/pages',
      '/club-settings',
      '/users',
      '/tenants',
      '/users/me',
      '/tenants/populate-tenant-options',
    ]
    for (const path of paths) {
      const res = await api('GET', path, { token: tokenA })
      for (const secret of [
        'Test Club B',
        'editor-b@example.com',
        'super@example.com',
        w.clubB.id,
      ]) {
        expect({ path, leaked: res.text.includes(secret) ? secret : null }).toEqual({
          path,
          leaked: null,
        })
      }
    }
  })

  it("cannot change or delete club B's page", async () => {
    await api('PATCH', `/pages/${w.pageB.id}`, { token: tokenA, body: { title: 'hacked' } })
    await api('DELETE', `/pages/${w.pageB.id}`, { token: tokenA })
    const stillThere = await w.payload.findByID({ collection: 'pages', id: w.pageB.id })
    expect(stillThere.title).toBe('Membership (Club B)')
  })

  it('cannot create a page in club B', async () => {
    const res = await api('POST', '/pages', {
      token: tokenA,
      body: { title: 'Planted', slug: 'planted', tenant: w.clubB.id },
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('cannot make itself super-admin or move club', async () => {
    await api('PATCH', `/users/${w.editorA.id}`, {
      token: tokenA,
      body: { role: 'super-admin', tenant: w.clubB.id },
    })
    const me = await w.payload.findByID({ collection: 'users', id: w.editorA.id, depth: 0 })
    expect(me.role).toBe('editor')
    expect(me.tenant).toBe(w.clubA.id)
  })
})

describe('REST API with no login', () => {
  it.each(['/pages', '/club-settings', '/users', '/tenants'])('%s is refused', async (path) => {
    expect((await api('GET', path)).status).toBe(403)
  })

  it('GraphQL is switched off', async () => {
    expect((await api('POST', '/graphql', { body: { query: '{__typename}' } })).status).toBe(404)
  })
})
