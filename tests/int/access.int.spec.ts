import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { collections } from '@/collections'
import config from '@/payload.config'

import { getTestPayload, resetDatabase } from './helpers/seed'

// Collections added by plugins for their own bookkeeping. Each must refuse every operation.
const PLUGIN_INTERNAL = ['totp-attempts']

describe('collection registry', () => {
  it('every collection in the Payload config is listed in src/collections', async () => {
    const payloadConfig = await config
    const registered = payloadConfig.collections
      .map((c) => c.slug)
      .filter((slug) => !slug.startsWith('payload-'))
      .filter((slug) => !PLUGIN_INTERNAL.includes(slug))
    expect(registered.sort()).toEqual(collections.map((c) => c.slug).sort())
  })

  it('plugin-internal collections refuse every operation', async () => {
    const payloadConfig = await config
    for (const slug of PLUGIN_INTERNAL) {
      const collection = payloadConfig.collections.find((c) => c.slug === slug)
      expect(collection, slug).toBeDefined()
      for (const op of ['create', 'read', 'update', 'delete'] as const) {
        const access = collection!.access[op] as (args: unknown) => unknown
        expect(
          await access({ req: { user: { id: 'x', role: 'super-admin' } } }),
          `${slug}.${op}`,
        ).toBe(false)
      }
    }
  })

  it('document locking stays off (its records are readable across clubs)', async () => {
    const payloadConfig = await config
    expect(payloadConfig.collections.map((c) => c.slug)).not.toContain('payload-locked-documents')
  })
})

describe('account creation on an empty platform', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getTestPayload()
    await resetDatabase(payload)
  })

  it('the built-in "create first user" path cannot create any account', async () => {
    // registerFirstUser calls create with overrideAccess: true and no trusted context.
    expect((await payload.count({ collection: 'users' })).totalDocs).toBe(0)
    for (const role of ['editor', 'super-admin'] as const) {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: `first-${role}@example.com`, password: 'a-long-test-password', role },
          overrideAccess: true,
        }),
      ).rejects.toThrow(/platform/)
    }
    expect((await payload.count({ collection: 'users' })).totalDocs).toBe(0)
  })

  it('an anonymous visitor cannot list accounts or clubs', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    await expect(payload.find({ collection: 'tenants', overrideAccess: false })).rejects.toThrow()
  })
})
