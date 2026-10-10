import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { allowAccountCreation } from '@/access/accountCreation'
import { collections } from '@/collections'
import config from '@/payload.config'

describe('collection registry', () => {
  it('every collection in the Payload config is listed in src/collections', async () => {
    const payloadConfig = await config
    const registered = payloadConfig.collections
      .map((c) => c.slug)
      .filter((slug) => !slug.startsWith('payload-'))
    expect(registered.sort()).toEqual(collections.map((c) => c.slug).sort())
  })
})

describe('Users collection', () => {
  let payload: Payload

  beforeAll(async () => {
    // These tests delete data, so refuse to run against anything but a test database.
    if (!/\/golf_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) {
      throw new Error('Integration tests must run against the golf_test database')
    }
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { id: { exists: true } } })
  })

  it('an anonymous visitor cannot list users', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
  })

  it('the built-in "create first user" path cannot create an account', async () => {
    // registerFirstUser calls create with overrideAccess: true and no trusted context.
    const { totalDocs } = await payload.count({ collection: 'users' })
    expect(totalDocs).toBe(0)
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'first@example.com', password: 'a-long-test-password' },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/platform administrator/)
  })

  it('an anonymous visitor cannot create a user', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'intruder@example.com', password: 'a-long-test-password' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('a logged-in user cannot create another user', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'step1-user@example.com', password: 'a-long-test-password' },
      context: allowAccountCreation,
    })
    try {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: 'second@example.com', password: 'a-long-test-password' },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow()
    } finally {
      await payload.delete({ collection: 'users', id: user.id })
    }
  })

  it('a logged-in user can only read their own record', async () => {
    const [a, b] = await Promise.all([
      payload.create({
        collection: 'users',
        data: { email: 'user-a@example.com', password: 'a-long-test-password' },
        context: allowAccountCreation,
      }),
      payload.create({
        collection: 'users',
        data: { email: 'user-b@example.com', password: 'a-long-test-password' },
        context: allowAccountCreation,
      }),
    ])
    try {
      const result = await payload.find({ collection: 'users', overrideAccess: false, user: a })
      expect(result.docs.map((d) => d.id)).toEqual([a.id])
    } finally {
      await payload.delete({ collection: 'users', where: { id: { in: [a.id, b.id] } } })
    }
  })
})
