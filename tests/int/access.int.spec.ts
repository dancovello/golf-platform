import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { collections } from '@/collections'
import config from '@/payload.config'

import { assertTestDatabase, resetDatabase } from './helpers/seed'

describe('collection registry', () => {
  it('every collection in the Payload config is listed in src/collections', async () => {
    const payloadConfig = await config
    const registered = payloadConfig.collections
      .map((c) => c.slug)
      .filter((slug) => !slug.startsWith('payload-'))
    expect(registered.sort()).toEqual(collections.map((c) => c.slug).sort())
  })

  it('document locking stays off (its records are readable across clubs)', async () => {
    const payloadConfig = await config
    expect(payloadConfig.collections.map((c) => c.slug)).not.toContain('payload-locked-documents')
  })
})

describe('account creation on an empty platform', () => {
  let payload: Payload

  beforeAll(async () => {
    assertTestDatabase()
    payload = await getPayload({ config: await config })
    await resetDatabase(payload)
  })

  it('the built-in "create first user" path cannot create an account', async () => {
    // registerFirstUser calls create with overrideAccess: true and no trusted context.
    const { totalDocs } = await payload.count({ collection: 'users' })
    expect(totalDocs).toBe(0)
    for (const role of ['editor', 'super-admin'] as const) {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: `first-${role}@example.com`, password: 'a-long-test-password', role },
          overrideAccess: true,
        }),
      ).rejects.toThrow(/platform/)
    }
  })

  it('an anonymous visitor cannot list users', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
  })
})
